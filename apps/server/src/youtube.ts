import { z } from "zod";

// Define a schema for a YouTube channel search result
export const YouTubeChannelSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  thumbnailUrl: z.string().url(),
  link: z.string().url(),
});

export type YouTubeChannel = z.infer<typeof YouTubeChannelSchema>;

// Define error codes for YouTube search
export enum YouTubeSearchErrorCodes {
  NO_RESULTS = "SEARCH-YT-NO_RESULTS",
  NETWORK_DOWN = "SEARCH-YT-NETWORK_DOWN",
  QUOTA_EXCEEDED = "SEARCH-YT-QUOTA_EXCEEDED",
  API_KEY_MISSING = "SEARCH-YT-API_KEY_MISSING",
}

export class YouTubeSearchError extends Error {
  code: YouTubeSearchErrorCodes;
  constructor(message: string, code: YouTubeSearchErrorCodes) {
    super(message);
    this.name = "YouTubeSearchError";
    this.code = code;
  }
}

/**
 * Service for interacting with the YouTube Data API v3.
 * Uses a mock implementation if no API key is provided.
 */
export class ChannelSearch {
  private apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.YOUTUBE_API_KEY;
  }

  /**
   * Searches for YouTube channels.
   * @param query The search query.
   * @returns A promise that resolves to an array of YouTube channels.
   * @throws {YouTubeSearchError} if an error occurs during the search.
   */
  async searchChannels(query: string): Promise<YouTubeChannel[]> {
    if (!this.apiKey) {
      throw new YouTubeSearchError(
        "YouTube API key is missing.",
        YouTubeSearchErrorCodes.API_KEY_MISSING
      );
    }

    // Mock implementation for now
    if (this.apiKey === "MOCK_API_KEY") {
      return this.mockSearchChannels(query);
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(
          query
        )}&key=${this.apiKey}`
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new YouTubeSearchError(
            "YouTube API quota exceeded or invalid API key.",
            YouTubeSearchErrorCodes.QUOTA_EXCEEDED
          );
        }
        throw new YouTubeSearchError(
          `Network error: ${response.statusText}`,
          YouTubeSearchErrorCodes.NETWORK_DOWN
        );
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new YouTubeSearchError(
          "No results found for your query.",
          YouTubeSearchErrorCodes.NO_RESULTS
        );
      }

      const channels: YouTubeChannel[] = data.items.map((item: any) => ({
        id: item.snippet.channelId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.default.url,
        link: `https://www.youtube.com/channel/${item.snippet.channelId}`,
      }));

      return channels;
    } catch (error) {
      if (error instanceof YouTubeSearchError) {
        throw error;
      }
      // Assuming network issues if it's not a specific API error
      throw new YouTubeSearchError(
        `Failed to fetch YouTube channels: ${error.message}`,
        YouTubeSearchErrorCodes.NETWORK_DOWN
      );
    }
  }

  private async mockSearchChannels(query: string): Promise<YouTubeChannel[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (query.toLowerCase() === "squeezie") {
          resolve([
            {
              id: "UCu4-Jb-Zc2k9f0w-dJ6L8pg",
              title: "Squeezie",
              description:
                "Chaîne de Squeezie, le plus grand youtubeur français.",
              thumbnailUrl:
                "https://yt3.ggpht.com/ytc/AIf8zZS-Z-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P-P=s88-c-k-c0x00ffffff-no-rj",
              link: "https://www.youtube.com/channel/UCu4-Jb-Zc2k9f0w-dJ6L8pg",
            },
          ]);
        } else if (query.toLowerCase() === "darkoli") {
          resolve([
            {
              id: "UCx_r_gVv_j_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x",
              title: "Darkoli",
              description: "Chaîne de Darkoli, gamer et streamer.",
              thumbnailUrl:
                "https://yt3.ggpht.com/ytc/AIf8zZTx_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x=s88-c-k-c0x00ffffff-no-rj",
              link: "https://www.youtube.com/channel/UCx_r_gVv_j_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x_x",
            },
          ]);
        } else if (query.toLowerCase() === "no results") {
          reject(
            new YouTubeSearchError(
              "No results found for your query.",
              YouTubeSearchErrorCodes.NO_RESULTS
            )
          );
        } else if (query.toLowerCase() === "network down") {
          reject(
            new YouTubeSearchError(
              "Failed to fetch YouTube channels: Network error",
              YouTubeSearchErrorCodes.NETWORK_DOWN
            )
          );
        } else if (query.toLowerCase() === "quota exceeded") {
          reject(
            new YouTubeSearchError(
              "YouTube API quota exceeded or invalid API key.",
              YouTubeSearchErrorCodes.QUOTA_EXCEEDED
            )
          );
        } else {
          resolve([]);
        }
      }, 500);
    });
  }
}
