import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import {
  VideoPublishError,
  VideoPublishErrorCodes,
  SocialNetwork,
} from "./publisher";

// Define expected aspect ratios and their tolerance
const ASPECT_RATIOS = {
  "16:9": 16 / 9, // YouTube, Facebook (landscape)
  "9:16": 9 / 16, // TikTok, Instagram Reels (portrait)
  "1:1": 1 / 1, // Instagram, Facebook (square)
  "4:5": 4 / 5, // Instagram (vertical)
};
const ASPECT_RATIO_TOLERANCE = 0.01; // Allow for slight variations

// Define common video constraints for social networks (simplified/example values)
const NETWORK_CONSTRAINTS: Record<
  SocialNetwork,
  {
    maxDurationSec?: number;
    minDurationSec?: number;
    maxSizeMB?: number;
    supportedRatios: Array<keyof typeof ASPECT_RATIOS>;
    preferredWidth?: number; // Preferred output width for re-encoding
  }
> = {
  [SocialNetwork.YOUTUBE]: {
    maxDurationSec: 60 * 60 * 12, // 12 hours
    maxSizeMB: 256 * 1024, // 256 GB (for pre-check, actual upload handles larger files)
    supportedRatios: ["16:9", "1:1", "9:16"],
    preferredWidth: 1920, // Full HD
  },
  [SocialNetwork.INSTAGRAM]: {
    maxDurationSec: 60 * 15, // 15 minutes for Reels, 60s for feed videos
    maxSizeMB: 650, // 650MB
    supportedRatios: ["1:1", "4:5", "9:16", "16:9"], // Reels, Feed, Stories
    preferredWidth: 1080,
  },
  [SocialNetwork.TIKTOK]: {
    maxDurationSec: 60 * 10, // 10 minutes
    maxSizeMB: 2000, // 2GB
    supportedRatios: ["9:16", "1:1"],
    preferredWidth: 1080, // For 9:16, height would be 1920
  },
  [SocialNetwork.FACEBOOK]: {
    maxDurationSec: 60 * 60 * 4, // 4 hours
    maxSizeMB: 10 * 1024, // 10GB
    supportedRatios: ["16:9", "1:1", "9:16"],
    preferredWidth: 1920,
  },
  [SocialNetwork.X]: {
    maxDurationSec: 140, // 2 minutes 20 seconds
    maxSizeMB: 512, // 512MB
    supportedRatios: ["16:9", "1:1", "9:16"],
    preferredWidth: 1280,
  },
};

interface VideoMetadata {
  width: number;
  height: number;
  duration: number; // in seconds
  size: number; // in bytes
  aspectRatio: string;
  ratioValue: number;
}

export class FfmpegService {
  private ffmpegPath: string = "ffmpeg"; // Assume ffmpeg is in PATH
  private ffprobePath: string = "ffprobe"; // Assume ffprobe is in PATH

  constructor() {
    this.checkFfmpegAvailability();
  }

  private checkFfmpegAvailability() {
    spawn(this.ffmpegPath, ["-"], { stdio: "ignore" }).on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(
          "FFmpeg not found. Video pre-checks and re-encoding will be disabled."
        );
        // Potentially set a flag to disable FFmpeg-dependent features
      } else {
        console.error("Error checking FFmpeg availability:", err);
      }
    });
    spawn(this.ffprobePath, ["-"], { stdio: "ignore" }).on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        console.warn(
          "FFprobe not found. Video metadata extraction will be limited."
        );
      } else {
        console.error("Error checking FFprobe availability:", err);
      }
    });
  }

  /**
   * Retrieves video metadata using ffprobe (part of FFmpeg).
   * @param videoPath The path to the video file.
   * @returns A promise that resolves to VideoMetadata.
   * @throws {VideoPublishError} if ffprobe fails or video file is not found.
   */
  async getVideoMetadata(videoPath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn(this.ffprobePath, [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,duration",
        "-of",
        "json",
        videoPath,
      ]);

      let stdout = "";
      let stderr = "";

      ffprobe.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      ffprobe.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffprobe.on("close", async (code) => {
        if (code !== 0) {
          console.error(`ffprobe exited with code ${code}: ${stderr}`);
          return reject(
            new VideoPublishError(
              `Échec de l'analyse des métadonnées vidéo: ${stderr.trim()}`,
              VideoPublishErrorCodes.FFMPEG_ERROR
            )
          );
        }

        try {
          const data = JSON.parse(stdout);
          const stream = data.streams[0];
          if (!stream) {
            return reject(
              new VideoPublishError(
                "Aucun flux vidéo trouvé.",
                VideoPublishErrorCodes.FFMPEG_ERROR
              )
            );
          }

          const stats = await fs.stat(videoPath);
          const width = stream.width;
          const height = stream.height;
          const duration = parseFloat(stream.duration);
          const size = stats.size; // bytes
          const aspectRatio = `${width}:${height}`;
          const ratioValue = width / height;

          resolve({
            width,
            height,
            duration,
            size,
            aspectRatio,
            ratioValue,
          });
        } catch (parseError) {
          reject(
            new VideoPublishError(
              `Erreur lors du parsing des métadonnées ffprobe: ${parseError.message}`,
              VideoPublishErrorCodes.FFMPEG_ERROR
            )
          );
        }
      });

      ffprobe.on("error", (err) => {
        reject(
          new VideoPublishError(
            `Échec du lancement de ffprobe: ${err.message}`,
            VideoPublishErrorCodes.FFMPEG_ERROR
          )
        );
      });
    });
  }

  /**
   * Performs pre-checks on a video for a specific social network.
   * @param videoPath The path to the video file.
   * @param network The target social network.
   * @returns A promise that resolves if the video is compatible, or rejects with a VideoPublishError.
   */
  async precheckVideo(
    videoPath: string,
    network: SocialNetwork
  ): Promise<void> {
    const metadata = await this.getVideoMetadata(videoPath);
    const constraints = NETWORK_CONSTRAINTS[network];

    if (!constraints) {
      console.warn(
        `No specific constraints found for network ${network}. Skipping pre-checks.`
      );
      return;
    }

    // Check duration
    if (
      constraints.maxDurationSec &&
      metadata.duration > constraints.maxDurationSec
    ) {
      throw new VideoPublishError(
        `La vidéo dépasse la durée maximale de ${constraints.maxDurationSec / 60} minutes pour ${network}.`,
        VideoPublishErrorCodes.UNSUPPORTED_DURATION,
        {
          currentDuration: metadata.duration,
          maxDuration: constraints.maxDurationSec,
          network,
        }
      );
    }
    if (
      constraints.minDurationSec &&
      metadata.duration < constraints.minDurationSec
    ) {
      throw new VideoPublishError(
        `La vidéo est plus courte que la durée minimale de ${constraints.minDurationSec} secondes pour ${network}.`,
        VideoPublishErrorCodes.UNSUPPORTED_DURATION,
        {
          currentDuration: metadata.duration,
          minDuration: constraints.minDurationSec,
          network,
        }
      );
    }

    // Check file size
    if (
      constraints.maxSizeMB &&
      metadata.size > constraints.maxSizeMB * 1024 * 1024
    ) {
      throw new VideoPublishError(
        `La vidéo dépasse la taille maximale de ${constraints.maxSizeMB} Mo pour ${network}.`,
        VideoPublishErrorCodes.FILE_TOO_LARGE,
        {
          currentSize: metadata.size,
          maxSizeMB: constraints.maxSizeMB,
          network,
        }
      );
    }

    // Check aspect ratio
    let isRatioSupported = false;
    for (const supportedRatioKey of constraints.supportedRatios) {
      const supportedRatioValue = ASPECT_RATIOS[supportedRatioKey];
      if (
        Math.abs(metadata.ratioValue - supportedRatioValue) <
        ASPECT_RATIO_TOLERANCE
      ) {
        isRatioSupported = true;
        break;
      }
    }

    if (!isRatioSupported) {
      throw new VideoPublishError(
        `Le ratio d'aspect de la vidéo ${metadata.aspectRatio} n'est pas supporté par ${network}.`,
        VideoPublishErrorCodes.UNSUPPORTED_RATIO,
        {
          currentRatio: metadata.aspectRatio,
          supportedRatios: constraints.supportedRatios,
          network,
        }
      );
    }

    console.warn(`Video pre-check for ${network} successful:`, metadata);
  }

  /**
   * Re-encodes a video to meet specific requirements (e.g., aspect ratio, bitrate).
   * @param inputPath The path to the input video file.
   * @param outputPath The path for the re-encoded output video file.
   * @param options FFmpeg options (e.g., '-vf scale=w:h').
   * @returns A promise that resolves to the output path, or rejects with an error.
   */
  async reencodeVideo(
    inputPath: string,
    outputPath: string,
    options: string[] = []
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffmpegArgs = [
        "-i",
        inputPath,
        "-c:v",
        "libx264", // Example: H.264 video codec
        "-preset",
        "medium", // Example: Encoding speed vs. compression ratio
        "-crf",
        "23", // Example: Constant Rate Factor (quality setting)
        "-c:a",
        "aac", // Example: AAC audio codec
        "-b:a",
        "128k", // Example: Audio bitrate
        "-map",
        "0:v:0", // Ensure only one video stream is mapped
        "-map",
        "0:a:0?", // Map audio stream if present (0:a:0?), otherwise ignore
        ...options,
        outputPath,
      ];

      // Remove any duplicate -vf if options already contain it
      const vfIndex = ffmpegArgs.indexOf("-vf");
      if (vfIndex !== -1) {
        const customVfOption = options.find(
          (opt) => opt.startsWith("scale=") || opt.startsWith("pad=")
        );
        if (customVfOption) {
          ffmpegArgs.splice(vfIndex, 1); // Remove the placeholder if custom -vf is provided
        }
      }

      const ffmpeg = spawn(this.ffmpegPath, ffmpegArgs);

      let stderr = "";
      ffmpeg.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ffmpeg.on("close", (code) => {
        if (code !== 0) {
          console.error(`FFmpeg exited with code ${code}: ${stderr}`);
          return reject(
            new VideoPublishError(
              `Échec du re-encodage vidéo: ${stderr.trim()}`,
              VideoPublishErrorCodes.FFMPEG_ERROR
            )
          );
        }
        resolve(outputPath);
      });

      ffmpeg.on("error", (err) => {
        reject(
          new VideoPublishError(
            `Échec du lancement de FFmpeg pour le re-encodage: ${err.message}`,
            VideoPublishErrorCodes.FFMPEG_ERROR
          )
        );
      });
    });
  }

  /**
   * Determines if a video needs re-encoding for a given network and provides FFmpeg options if it does.
   * @param videoPath The path to the video file.
   * @param network The target social network.
   * @returns An object indicating if re-encoding is needed and providing ffmpeg options.
   */
  async needsReencoding(
    videoPath: string,
    network: SocialNetwork
  ): Promise<{ required: boolean; options: string[] }> {
    try {
      const metadata = await this.getVideoMetadata(videoPath);
      const constraints = NETWORK_CONSTRAINTS[network];

      if (!constraints) {
        return { required: false, options: [] };
      }

      const options: string[] = [];
      let required = false;

      // 1. Check Duration
      if (
        constraints.maxDurationSec &&
        metadata.duration > constraints.maxDurationSec
      ) {
        options.push("-t", constraints.maxDurationSec.toString());
        required = true;
      }
      // No automatic re-encoding for minDuration for now, would involve complex padding/speed-up

      // 2. Check File Size & Bitrate
      if (
        constraints.maxSizeMB &&
        metadata.size > constraints.maxSizeMB * 1024 * 1024
      ) {
        // Calculate target bitrate to fit within max size
        // Formula: target_bitrate_kbps = (max_size_mb * 8 * 1024) / duration_seconds
        // A bit of buffer is usually good, so multiply by 0.95
        const targetTotalBitrateKbps =
          (constraints.maxSizeMB * 8 * 1024 * 0.95) / metadata.duration;
        // Assuming audio bitrate is around 128kbps, subtract it to get video bitrate
        const targetVideoBitrateKbps = Math.max(
          500,
          targetTotalBitrateKbps - 128
        ); // Min 500kbps for reasonable quality
        options.push("-b:v", `${targetVideoBitrateKbps}k`);
        options.push("-maxrate", `${targetVideoBitrateKbps * 1.2}k`); // Allow some burst
        options.push("-bufsize", `${targetVideoBitrateKbps * 2}k`); // Buffer size
        required = true;
      }

      // 3. Check Aspect Ratio and Resolution
      let isRatioSupported = false;
      let bestFitRatioKey: keyof typeof ASPECT_RATIOS | undefined;
      let minDiff = Infinity;

      for (const supportedRatioKey of constraints.supportedRatios) {
        const supportedRatioValue = ASPECT_RATIOS[supportedRatioKey];
        const diff = Math.abs(metadata.ratioValue - supportedRatioValue);
        if (diff < ASPECT_RATIO_TOLERANCE) {
          isRatioSupported = true;
          bestFitRatioKey = supportedRatioKey;
          break;
        }
        if (diff < minDiff) {
          minDiff = diff;
          bestFitRatioKey = supportedRatioKey;
        }
      }

      if (!isRatioSupported && bestFitRatioKey) {
        const targetRatioValue = ASPECT_RATIOS[bestFitRatioKey];
        const preferredWidth = constraints.preferredWidth || 1280; // Default preferred width

        let newWidth: number, newHeight: number;

        // Determine if target is portrait or landscape to set preferred dimension
        if (targetRatioValue < 1) {
          // Portrait (e.g., 9:16 = 0.5625)
          newHeight = preferredWidth; // Use preferredWidth as target height
          newWidth = Math.round(newHeight * targetRatioValue);
        } else {
          // Landscape or Square
          newWidth = preferredWidth;
          newHeight = Math.round(newWidth / targetRatioValue);
        }

        // Ensure dimensions are even numbers, FFmpeg often prefers this
        newWidth = Math.round(newWidth / 2) * 2;
        newHeight = Math.round(newHeight / 2) * 2;

        options.push(
          "-vf",
          `scale=${newWidth}:${newHeight}:force_original_aspect_ratio=decrease,pad=${newWidth}:${newHeight}:(ow-iw)/2:(oh-ih)/2`
        );
        required = true;
      }

      return { required, options };
    } catch (error) {
      console.warn(
        `Could not perform re-encoding check for ${videoPath} on ${network}:`,
        error.message
      );
      // If metadata extraction fails, we can't generate specific options, so re-encoding is not 'required' by logic.
      // The error will be handled upstream (JobOrchestrator).
      return { required: false, options: [] };
    }
  }
}
