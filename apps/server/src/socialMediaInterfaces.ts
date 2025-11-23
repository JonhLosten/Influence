import { SocialNetwork, VideoPublishPayload } from "./publisher";

/**
 * Defines the common interface for any social media publishing provider.
 * This allows for flexible integration of different APIs (e.g., Ayrshare, native APIs).
 */
export interface SocialMediaPublisher {
  /**
   * Publishes a video to the specified social networks.
   * @param payload The video publishing payload.
   * @returns A promise that resolves to a result object containing success status, post IDs, and potential errors.
   * @throws {VideoPublishError} on specific publishing failures.
   */
  publishVideo(payload: VideoPublishPayload): Promise<PublishResult>;
}

/**
 * Generic result structure for a publishing operation.
 */
export interface PublishResult {
  success: boolean;
  message?: string;
  /**
   * A record of network to the published post URL or ID if successful.
   */
  postIds?: Record<SocialNetwork, string>;
  /**
   * Detailed error information if the publication failed for one or more networks.
   */
  error?: { code: string; message: string; details?: any };
}

/**
 * Interface for a native YouTube publishing API.
 * This would encapsulate direct interaction with YouTube Data API v3.
 */
export interface YouTubeNativePublisher extends SocialMediaPublisher {
  // Specific methods for YouTube beyond generic publishVideo, e.g., for channel management, advanced video settings.
  // uploadVideoToYouTube(videoPath: string, metadata: YouTubeVideoMetadata): Promise<string>;
}

/**
 * Interface for a native Instagram publishing API.
 * This would encapsulate direct interaction with Instagram Graph API.
 */
export interface InstagramNativePublisher extends SocialMediaPublisher {
  // Specific methods for Instagram, e.g., for feed posts, reels, stories.
}

/**
 * Interface for a native TikTok publishing API.
 */
export interface TikTokNativePublisher extends SocialMediaPublisher {
  // Specific methods for TikTok.
}

/**
 * Interface for a native Facebook publishing API.
 */
export interface FacebookNativePublisher extends SocialMediaPublisher {
  // Specific methods for Facebook.
}

/**
 * Interface for a native X (formerly Twitter) publishing API.
 */
export interface XNativePublisher extends SocialMediaPublisher {
  // Specific methods for X.
}
