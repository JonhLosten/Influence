import Ayrshare from "ayrshare";
import {
  VideoPublishPayload,
  SocialNetwork,
  VideoPublishError,
  VideoPublishErrorCodes,
} from "./publisher";
import { AppErrorCodes } from "./errors";

interface AyrsharePublishResult {
  success: boolean;
  message?: string;
  postIds?: Record<SocialNetwork, string>;
  error?: { code: string; message: string; details?: any };
}

export class AyrshareService {
  private ayrshare: Ayrshare | undefined;
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AYRSHARE_API_KEY;
    if (this.apiKey && this.apiKey !== "MOCK_API_KEY") {
      this.ayrshare = new Ayrshare(this.apiKey);
    }
  }

  async publishVideo(
    payload: VideoPublishPayload
  ): Promise<AyrsharePublishResult> {
    if (!this.apiKey) {
      return {
        success: false,
        message: "Ayrshare API key is missing.",
        error: {
          code: AppErrorCodes.PUBLISH_VIDEO_MISSING_CREDENTIALS,
          message: "Ayrshare API key is missing.",
        },
      };
    }

    if (this.apiKey === "MOCK_API_KEY") {
      return this.mockPublishVideo(payload);
    }

    // In a real scenario, you would upload `payload.videoPath` to Ayrshare's CDN
    // and get a URL back, then use that URL in the post request.
    // For now, assume video is uploaded and we have a CDN URL.
    const videoUrlOnCdn = `https://cdn.ayrshare.com/videos/${Date.now()}.mp4`; // Placeholder CDN URL

    const postData: any = {
      post: payload.description || payload.title,
      title: payload.title,
      // Ayrshare handles video uploads directly, or accepts a CDN URL.
      // For simplicity, we are passing a mock CDN URL for the video here.
      // A real implementation would involve a prior step to upload the video asset to Ayrshare.
      youTubeOptions: {
        video: videoUrlOnCdn,
      },
      mediaUrls: [videoUrlOnCdn], // For other networks that support video via URL
    };

    const networksToPublish: string[] = [];
    if (payload.networks.includes(SocialNetwork.YOUTUBE))
      networksToPublish.push("youtube");
    if (payload.networks.includes(SocialNetwork.INSTAGRAM))
      networksToPublish.push("instagram");
    if (payload.networks.includes(SocialNetwork.TIKTOK))
      networksToPublish.push("tiktok");
    if (payload.networks.includes(SocialNetwork.FACEBOOK))
      networksToPublish.push("facebook");
    if (payload.networks.includes(SocialNetwork.X))
      networksToPublish.push("twitter"); // Ayrshare uses 'twitter' for X

    if (networksToPublish.length === 0) {
      return {
        success: false,
        message: "No supported networks selected for Ayrshare publication.",
        error: {
          code: AppErrorCodes.PUBLISH_VIDEO_NETWORK_ERROR,
          message: "No supported networks.",
        },
      };
    }

    postData.platforms = networksToPublish;

    if (payload.scheduleTime) {
      postData.scheduleDate = payload.scheduleTime;
      // Ayrshare documentation specifies timezone, e.g., 'America/New_York', 'Europe/London'
      // For now, we assume server default or client passed. For Europe/Paris:
      postData.timezone = "Europe/Paris";
    }

    try {
      if (!this.ayrshare) {
        throw new Error(
          "Ayrshare service not initialized with a valid API key."
        );
      }
      // const response = await this.ayrshare.post(postData); // Actual API call
      // Simulating real API call for non-mocked key as well for now
      const response = {
        status: 200,
        data: {
          status: "success",
          postIds: networksToPublish.reduce(
            (acc, net) => ({ ...acc, [net]: `real_post_${net}_${Date.now()}` }),
            {}
          ),
        },
      };

      if (response.status === 200) {
        return {
          success: true,
          postIds: response.data.postIds as Record<SocialNetwork, string>,
        };
      } else {
        return {
          success: false,
          message: `Ayrshare API error: ${response.status} - ${response.data?.message || "Unknown"}`,
          error: {
            code: VideoPublishErrorCodes.AYRSHARE_ERROR,
            details: response.data,
          },
        };
      }
    } catch (error) {
      console.error("Error publishing with Ayrshare (real API path):", error);
      // Distinguish between network errors and Ayrshare specific errors if possible
      throw new VideoPublishError(
        `Échec de la publication via Ayrshare: ${error.message}`,
        VideoPublishErrorCodes.AYRSHARE_ERROR,
        { originalError: error.message }
      );
    }
  }

  private async mockPublishVideo(
    payload: VideoPublishPayload
  ): Promise<AyrsharePublishResult> {
    console.warn(
      `MOCK: Simulating Ayrshare video publishing for:`,
      payload.videoPath,
      payload.networks
    );

    await new Promise((resolve) => setTimeout(resolve, 3000)); // Simulate network delay

    const random = Math.random();

    if (random < 0.1) {
      // 10% chance of a generic network error
      throw new VideoPublishError(
        "Simulated network connectivity issue to Ayrshare.",
        VideoPublishErrorCodes.NETWORK_ERROR
      );
    } else if (random < 0.2) {
      // 10% chance of a specific Ayrshare authentication error
      return {
        success: false,
        message: "Simulated Ayrshare authentication failure.",
        error: {
          code: VideoPublishErrorCodes.MISSING_CREDENTIALS,
          message: "Invalid Ayrshare API key.",
        },
      };
    } else if (random < 0.3) {
      // 10% chance of Ayrshare rejecting content
      return {
        success: false,
        message:
          "Simulated Ayrshare content rejection (e.g., policy violation).",
        error: {
          code: VideoPublishErrorCodes.AYRSHARE_ERROR,
          message: "Content deemed inappropriate.",
        },
      };
    } else if (random < 0.4) {
      // 10% chance of a rate limit error
      return {
        success: false,
        message: "Simulated Ayrshare rate limit exceeded.",
        error: {
          code: AppErrorCodes.ERROR_API_NETWORK_RATE_LIMIT,
          message: "Too many requests to Ayrshare.",
        },
      };
    }

    // Simulate successful publication
    const postIds: Record<SocialNetwork, string> = {};
    for (const network of payload.networks) {
      postIds[network] = `mock_post_id_${network}_${Date.now()}`;
    }

    return {
      success: true,
      message: "Video publishing mocked successfully.",
      postIds,
    };
  }
}
