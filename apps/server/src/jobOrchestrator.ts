import { database } from "@influence/db";
import { publishingJobs } from "@influence/db/src/schema";
import { eq, and, inArray, sql } from "drizzle-orm"; // Added sql import
import { nanoid } from "nanoid";
import {
  JobStatus,
  PublishingJob,
  VideoPublishPayload,
  VideoPublishError,
  VideoPublishErrorCodes,
  SocialNetwork,
} from "./publisher";
import { FfmpegService } from "./ffmpeg";
import { AppErrorCodes, AppError } from "./errors";
import { AyrshareService } from "./ayrshareService";
import { SocialMediaPublisher, PublishResult } from "./socialMediaInterfaces"; // Import interfaces
import { promises as fs } from "fs"; // Import fs for file operations
import path from "path"; // Import path for path operations

interface JobOrchestratorConfig {
  ffmpegService: FfmpegService;
  // A map of network to its publisher implementation
  publishers: Record<SocialNetwork, SocialMediaPublisher>;
  retryIntervals: number[]; // In milliseconds
}

export class JobOrchestrator {
  private config: JobOrchestratorConfig;
  private processingQueue: Set<string> = new Set();

  constructor(config: JobOrchestratorConfig) {
    this.config = config;
    this.init();
  }

  private async init() {
    await this.recoverStuckJobs();
    void this.processJobsLoop();
  }

  private async recoverStuckJobs() {
    const stuckJobs = await database.query.publishingJobs.findMany({
      where: inArray(publishingJobs.status, [
        JobStatus.QUEUED,
        JobStatus.PROCESSING,
      ]),
    });

    for (const job of stuckJobs) {
      console.warn(`Recovering stuck job ${job.id}. Re-queueing.`);
      await this.updateJobStatus(job.id, JobStatus.QUEUED);
    }
  }

  private async processJobsLoop() {
    while (true) {
      await this.processNextJob();
      await new Promise((resolve) => setTimeout(resolve, 5000)); // Check every 5 seconds
    }
  }

  private async processNextJob() {
    const job = await database.query.publishingJobs.findFirst({
      where: and(
        eq(publishingJobs.status, JobStatus.QUEUED),
        publishingJobs.scheduledFor
          ? sql`${publishingJobs.scheduledFor} <= CURRENT_TIMESTAMP`
          : true
      ),
      orderBy: publishingJobs.createdAt,
    });

    if (job && !this.processingQueue.has(job.id)) {
      this.processingQueue.add(job.id);
      void this.executeJob(job).finally(() => {
        this.processingQueue.delete(job.id);
      });
    }
  }

  private async executeJob(job: PublishingJob) {
    console.warn(`Executing job ${job.id} for video: ${job.payload.videoPath}`);
    await this.updateJobStatus(job.id, JobStatus.PROCESSING, {
      lastAttempt: new Date().toISOString(),
    });

    try {
      const processedVideoPath = await this.preprocessVideo(job);
      const publishedUrls = await this.publishVideo(job, processedVideoPath);
      await this.updateJobStatus(job.id, JobStatus.PUBLISHED, {
        publishedUrls,
      });
      console.warn(`Job ${job.id} published successfully.`);
    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);
      await this.handleJobFailure(job, error);
    }
  }

  private async preprocessVideo(job: PublishingJob): Promise<string> {
    let currentVideoPath = job.payload.videoPath;
    const tempDir = "/tmp/influence-videos";
    await fs.mkdir(tempDir, { recursive: true });

    // Pre-check and potentially re-encode for each target network
    for (const network of job.payload.networks) {
      try {
        // First, check if re-encoding is needed and get options
        const { required, options } =
          await this.config.ffmpegService.needsReencoding(
            currentVideoPath,
            network
          );

        if (required) {
          console.warn(
            `Re-encoding video for network ${network} for job ${job.id}`
          );
          const outputFileName = `${path.basename(currentVideoPath, path.extname(currentVideoPath))}-${network}-reencoded${path.extname(currentVideoPath)}`;
          const outputPath = path.join(tempDir, outputFileName);
          currentVideoPath = await this.config.ffmpegService.reencodeVideo(
            currentVideoPath,
            outputPath,
            options
          );
          console.warn(`Video re-encoded to ${currentVideoPath}`);
        }

        // After potential re-encoding, perform final pre-check to confirm compatibility
        await this.config.ffmpegService.precheckVideo(
          currentVideoPath,
          network
        );
      } catch (error) {
        // If pre-check or re-encoding fails for any network, the job fails.
        if (error instanceof VideoPublishError) {
          throw error;
        } else {
          throw new VideoPublishError(
            `Échec de la pré-vérification ou du ré-encodage pour ${network}: ${error.message}`,
            VideoPublishErrorCodes.FFMPEG_ERROR,
            { originalError: error.message, network }
          );
        }
      }
    }
    return currentVideoPath;
  }

  private async publishVideo(
    job: PublishingJob,
    videoPath: string
  ): Promise<Record<string, string>> {
    const publishedUrls: Record<string, string> = {};
    const publicationErrors: { network: SocialNetwork; error: any }[] = [];

    // Each network might have a specific publisher configured, or fall back to Ayrshare
    for (const network of job.payload.networks) {
      const publisher =
        this.config.publishers[network] || this.config.publishers.ayrshare; // Fallback to ayrshare if no native specified

      if (!publisher) {
        publicationErrors.push({
          network,
          error: new VideoPublishError(
            `Aucun service de publication configuré pour le réseau ${network}.`,
            VideoPublishErrorCodes.MISSING_CREDENTIALS,
            { network }
          ),
        });
        continue; // Skip to next network
      }

      try {
        console.warn(
          `Attempting to publish to ${network} using ${publisher.constructor.name}`
        );
        const publishPayload: VideoPublishPayload = {
          ...job.payload,
          videoPath: videoPath, // Use the potentially re-encoded video path
          networks: [network], // Publish to one network at a time through the publisher interface
        };
        const result: PublishResult =
          await publisher.publishVideo(publishPayload);

        if (result.success && result.postIds) {
          publishedUrls[network] = result.postIds[network];
          console.warn(
            `Successfully published to ${network}. Post ID/URL: ${result.postIds[network]}`
          );
        } else {
          // If success is false but no explicit error, create a generic one
          const error = result.error || {
            code: VideoPublishErrorCodes.UNKNOWN_ERROR,
            message: `Publication to ${network} failed without specific error.`,
          };
          publicationErrors.push({ network, error });
          console.warn(`Publication to ${network} failed: ${error.message}`);
        }
      } catch (error) {
        publicationErrors.push({ network, error });
        console.error(`Caught error publishing to ${network}:`, error);
      }
    }

    if (publicationErrors.length > 0) {
      // If any publication failed, consider the job as failed.
      // Aggregate errors or pick the first one for the job's error state.
      const firstError = publicationErrors[0].error;
      throw new VideoPublishError(
        `Publication échouée sur certains réseaux. Premier échec sur ${publicationErrors[0].network}: ${firstError.message}`,
        firstError.code || VideoPublishErrorCodes.UPLOAD_FAILED,
        {
          failedNetworks: publicationErrors.map((e) => e.network),
          originalErrors: publicationErrors.map((e) => ({
            network: e.network,
            code: e.error.code,
            message: e.error.message,
          })),
        }
      );
    }

    return publishedUrls;
  }

  private async handleJobFailure(job: PublishingJob, error: any) {
    const retryCount = job.retryCount + 1;
    const maxRetries = this.config.retryIntervals.length;
    const errorDetails =
      error instanceof AppError
        ? { code: error.code, message: error.message, details: error.details }
        : {
            code: AppErrorCodes.GENERAL_UNKNOWN_ERROR,
            message: error.message || "An unknown error occurred.",
          };

    if (retryCount <= maxRetries) {
      const delay = this.config.retryIntervals[retryCount - 1];
      console.warn(
        `Job ${job.id} failed. Retrying in ${delay / 1000} seconds. Attempt ${retryCount}/${maxRetries}`
      );
      await this.updateJob(job.id, {
        status: JobStatus.QUEUED,
        retryCount: retryCount,
        error: errorDetails,
        lastAttempt: new Date().toISOString(),
        scheduledFor: new Date(Date.now() + delay).toISOString(), // Schedule for retry
      });
    } else {
      console.error(
        `Job ${job.id} failed permanently after ${maxRetries} retries.`
      );
      await this.updateJobStatus(job.id, JobStatus.FAILED, {
        error: errorDetails,
      });
    }
  }

  async addJob(payload: VideoPublishPayload): Promise<PublishingJob> {
    const newJob: PublishingJob = {
      id: nanoid(),
      payload,
      status: JobStatus.QUEUED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      scheduledFor: payload.scheduleTime || null,
      retryCount: 0,
      lastAttempt: null,
    };
    await database.insert(publishingJobs).values(newJob);
    console.warn(`Job ${newJob.id} added to queue.`);
    return newJob;
  }

  async getJob(id: string): Promise<PublishingJob | undefined> {
    return database.query.publishingJobs.findFirst({
      where: eq(publishingJobs.id, id),
    });
  }

  async updateJobStatus(
    id: string,
    status: JobStatus,
    updates?: Partial<PublishingJob>
  ): Promise<void> {
    await database
      .update(publishingJobs)
      .set({
        status,
        updatedAt: new Date().toISOString(),
        ...updates,
      })
      .where(eq(publishingJobs.id, id));
  }

  async updateJob(id: string, updates: Partial<PublishingJob>): Promise<void> {
    await database
      .update(publishingJobs)
      .set({
        updatedAt: new Date().toISOString(),
        ...updates,
      })
      .where(eq(publishingJobs.id, id));
  }

  async getPendingJobs(): Promise<PublishingJob[]> {
    return database.query.publishingJobs.findMany({
      where: and(
        eq(publishingJobs.status, JobStatus.QUEUED),
        publishingJobs.scheduledFor
          ? sql`${publishingJobs.scheduledFor} <= CURRENT_TIMESTAMP`
          : true
      ),
      orderBy: publishingJobs.createdAt,
    });
  }

  async getFailedJobs(): Promise<PublishingJob[]> {
    return database.query.publishingJobs.findMany({
      where: eq(publishingJobs.status, JobStatus.FAILED),
      orderBy: publishingJobs.updatedAt,
    });
  }
}
