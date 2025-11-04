import { resolveApiUrl } from "./api";

export interface YoutubeVideoInsight {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number;
  url: string;
  thumbnailUrl: string;
}

export interface YoutubeChannelAnalytics {
  channelId: string;
  title: string;
  handle?: string;
  description?: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  estimatedWatchTimeHours: number;
  averageViewDurationSeconds: number;
  recentVideos: YoutubeVideoInsight[];
  lastUpdated: string;
}

export async function fetchYoutubeChannelAnalytics(
  lookup: { channelId?: string; handle?: string; query?: string }
): Promise<YoutubeChannelAnalytics> {
  const params = new URLSearchParams();
  if (lookup.channelId) params.set("channelId", lookup.channelId);
  if (lookup.handle) params.set("handle", lookup.handle);
  if (lookup.query) params.set("lookup", lookup.query);
  const res = await fetch(resolveApiUrl(`/api/youtube/channel?${params.toString()}`));
  if (!res.ok) {
    throw new Error(`YouTube channel API ${res.status}`);
  }
  return (await res.json()) as YoutubeChannelAnalytics;
}
