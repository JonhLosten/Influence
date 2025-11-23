import { z } from "zod";

export enum SocialNetwork {
  YOUTUBE = "youtube",
  INSTAGRAM = "instagram",
  TIKTOK = "tiktok",
  FACEBOOK = "facebook",
  X = "x",
}

export const SocialNetworkSchema = z.nativeEnum(SocialNetwork);

export enum JobStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  PUBLISHING = "publishing",
  PUBLISHED = "published",
  FAILED = "failed",
  CANCELED = "canceled",
}

export const JobStatusSchema = z.nativeEnum(JobStatus);

export const VideoPublishPayloadSchema = z.object({
  videoPath: z.string().min(1), // Path to the video file on the server
  title: z.string().min(1),
  description: z.string().optional(),
  networks: z.array(SocialNetworkSchema).min(1),
  scheduleTime: z.string().datetime().optional(), // ISO 8601 string for scheduling
  // Add other video metadata as needed (tags, category, etc.)
});

export type VideoPublishPayload = z.infer<typeof VideoPublishPayloadSchema>;

export const PublishingJobSchema = z.object({
  id: z.string().uuid(),
  payload: VideoPublishPayloadSchema,
  status: JobStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  scheduledFor: z.string().datetime().nullable(),
  publishedUrls: z.record(SocialNetworkSchema, z.string().url()).optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      details: z.record(z.string(), z.any()).optional(),
    })
    .optional(),
  retryCount: z.number().default(0),
  lastAttempt: z.string().datetime().nullable(),
});

export type PublishingJob = z.infer<typeof PublishingJobSchema>;

// Error codes specific to video publishing
export enum VideoPublishErrorCodes {
  UNSUPPORTED_RATIO = "PUBLISH-VIDEO-UNSUPPORTED_RATIO",
  UNSUPPORTED_DURATION = "PUBLISH-VIDEO-UNSUPPORTED_DURATION",
  FILE_TOO_LARGE = "PUBLISH-VIDEO-FILE_TOO_LARGE",
  FFMPEG_ERROR = "PUBLISH-VIDEO-FFMPEG_ERROR",
  UPLOAD_FAILED = "PUBLISH-VIDEO-UPLOAD_FAILED",
  NETWORK_ERROR = "PUBLISH-VIDEO-NETWORK_ERROR",
  MISSING_CREDENTIALS = "PUBLISH-VIDEO-MISSING_CREDENTIALS",
  AYRSHARE_ERROR = "PUBLISH-VIDEO-AYRSHARE-ERROR",
  JOB_NOT_FOUND = "PUBLISH-JOB-NOT_FOUND",
  UNKNOWN_ERROR = "PUBLISH-UNKNOWN-ERROR",
}

export class VideoPublishError extends Error {
  code: VideoPublishErrorCodes;
  details?: Record<string, any>;

  constructor(
    message: string,
    code: VideoPublishErrorCodes,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = "VideoPublishError";
    this.code = code;
    this.details = details;
  }
}
