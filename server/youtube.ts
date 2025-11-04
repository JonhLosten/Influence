import type { Network } from "./types";

type YoutubeSearchResponse = {
  items?: Array<{
    id?: { channelId?: string };
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: Record<string, { url?: string }>;
      channelTitle?: string;
    };
  }>;
};

type YoutubeChannelResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      description?: string;
      customUrl?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    statistics?: {
      subscriberCount?: string;
      viewCount?: string;
      videoCount?: string;
    };
    brandingSettings?: {
      image?: { bannerExternalUrl?: string };
    };
    contentDetails?: {
      relatedPlaylists?: { uploads?: string };
    };
  }>;
};

type YoutubePlaylistItemsResponse = {
  items?: Array<{
    contentDetails?: { videoId?: string; videoPublishedAt?: string };
  }>;
};

type YoutubeVideosResponse = {
  items?: Array<{
    id?: string;
    snippet?: {
      title?: string;
      publishedAt?: string;
      thumbnails?: Record<string, { url?: string }>;
    };
    contentDetails?: { duration?: string };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
  }>;
};

export interface YoutubeSuggestion {
  network: Network;
  displayName: string;
  handle: string;
  followers: number;
  avatar: string;
  url: string;
  channelId: string;
  description?: string;
  totalViews?: number;
  videoCount?: number;
}

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

const API_BASE = "https://yt.lemnoslife.com/noKey";

async function fetchJSON<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { signal });
  if (!res.ok) {
    throw new Error(`YouTube API ${res.status}`);
  }
  return (await res.json()) as T;
}

function parseIsoDuration(value: string | undefined): number {
  if (!value) return 0;
  const match = value.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i
  );
  if (!match) return 0;
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const seconds = match[3] ? parseFloat(match[3]) : 0;
  return Math.round(hours * 3600 + minutes * 60 + seconds);
}

function normalizeHandle(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("@")) return trimmed;
  return `@${trimmed}`;
}

function extractHandleFromUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] && segments[0].startsWith("@")) {
        return segments[0];
      }
      if (segments[0] === "channel" && segments[1]) {
        return segments[1];
      }
      if (segments[0] === "user" && segments[1]) {
        return segments[1];
      }
      if (segments[0] === "c" && segments[1]) {
        return segments[1];
      }
    }
  } catch (error) {
    // ignore
  }
  return undefined;
}

async function findChannelIdFromLookup(lookup: string): Promise<{
  channelId: string;
  handle?: string;
}> {
  const trimmed = lookup.trim();
  if (!trimmed) {
    throw new Error("Missing lookup");
  }

  if (/^UC[0-9A-Za-z_-]{20,}$/.test(trimmed)) {
    return { channelId: trimmed };
  }

  const handle =
    normalizeHandle(trimmed) || normalizeHandle(extractHandleFromUrl(trimmed));
  if (handle) {
    const channel = await fetchJSON<YoutubeChannelResponse>(
      `/channels?part=snippet,statistics,contentDetails,brandingSettings&forHandle=${encodeURIComponent(
        handle
      )}`
    );
    const item = channel.items?.[0];
    if (item?.id) {
      return { channelId: item.id, handle };
    }
  }

  const search = await fetchJSON<YoutubeSearchResponse>(
    `/search?part=snippet&type=channel&q=${encodeURIComponent(trimmed)}`
  );
  const first = search.items?.find((item) => item?.id?.channelId);
  if (first?.id?.channelId) {
    const snippet = first.snippet;
    return {
      channelId: first.id.channelId,
      handle: normalizeHandle(snippet?.channelTitle),
    };
  }

  throw new Error("Channel not found");
}

export async function searchYoutubeChannels(query: string): Promise<YoutubeSuggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const data = await fetchJSON<YoutubeSearchResponse>(
      `/search?part=snippet&type=channel&q=${encodeURIComponent(trimmed)}`,
      controller.signal
    );
    const baseSuggestions = (data.items || [])
      .filter((item) => item?.id?.channelId)
      .map((item) => {
        const channelId = item.id!.channelId!;
        const title = item.snippet?.title?.trim() || "Chaîne YouTube";
        const description = item.snippet?.description?.trim();
        const thumb =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.default?.url ||
          "https://yt3.ggpht.com/ytc/AGIKgqPq-placeholder=s88-c-k-c0x00ffffff-no-rj";
        return {
          network: "youtube" as Network,
          displayName: title,
          handle: normalizeHandle(title) || `@${channelId.slice(0, 10)}`,
          followers: 0,
          avatar: thumb,
          url: `https://www.youtube.com/channel/${channelId}`,
          channelId,
          description,
        } satisfies YoutubeSuggestion;
      })
      .slice(0, 8);

    if (baseSuggestions.length === 0) {
      return [];
    }

    const details = await fetchJSON<YoutubeChannelResponse>(
      `/channels?part=snippet,statistics&id=${baseSuggestions
        .map((s) => s.channelId)
        .join(",")}`,
      controller.signal
    );

    const detailMap = new Map(
      (details.items || []).map((item) => [item.id, item])
    );

    return baseSuggestions.map((suggestion) => {
      const match = detailMap.get(suggestion.channelId);
      const stats = match?.statistics;
      const snippet = match?.snippet;
      const resolvedHandle =
        normalizeHandle(snippet?.customUrl) ||
        suggestion.handle ||
        `@${suggestion.channelId.slice(0, 12)}`;
      return {
        ...suggestion,
        followers: Number(stats?.subscriberCount || 0),
        totalViews: Number(stats?.viewCount || 0),
        videoCount: Number(stats?.videoCount || 0),
        handle: resolvedHandle,
        avatar:
          snippet?.thumbnails?.high?.url ||
          snippet?.thumbnails?.medium?.url ||
          snippet?.thumbnails?.default?.url ||
          suggestion.avatar,
      } satisfies YoutubeSuggestion;
    });
  } catch (error) {
    console.warn("youtube.search fallback", error);
    return [];
  } finally {
    clearTimeout(timeout);
  }
}

function computeAggregates(videos: YoutubeVideoInsight[]) {
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const watchTimeSeconds = videos.reduce(
    (sum, v) => sum + v.views * v.durationSeconds,
    0
  );
  const averageDuration = totalViews > 0 ? watchTimeSeconds / totalViews : 0;
  return {
    recentViews: totalViews,
    estimatedWatchTimeHours: watchTimeSeconds / 3600,
    averageViewDurationSeconds: averageDuration,
  };
}

export async function fetchYoutubeChannelAnalytics(
  lookup: { channelId?: string; handle?: string; query?: string }
): Promise<YoutubeChannelAnalytics> {
  let channelId = lookup.channelId;
  let handle = lookup.handle;

  if (!channelId) {
    const resolved = await findChannelIdFromLookup(
      handle || lookup.query || ""
    );
    channelId = resolved.channelId;
    handle = handle || resolved.handle;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const channel = await fetchJSON<YoutubeChannelResponse>(
      `/channels?part=snippet,statistics,contentDetails,brandingSettings&id=${channelId}`,
      controller.signal
    );
    const item = channel.items?.[0];
    if (!item) {
      throw new Error("Channel payload missing");
    }

    const uploadsPlaylist =
      item.contentDetails?.relatedPlaylists?.uploads || "";

    const playlistItems = uploadsPlaylist
      ? await fetchJSON<YoutubePlaylistItemsResponse>(
          `/playlistItems?part=contentDetails&maxResults=10&playlistId=${uploadsPlaylist}`,
          controller.signal
        )
      : { items: [] };

    const videoIds = (playlistItems.items || [])
      .map((entry) => entry.contentDetails?.videoId)
      .filter((id): id is string => Boolean(id));

    const videosPayload = videoIds.length
      ? await fetchJSON<YoutubeVideosResponse>(
          `/videos?part=snippet,contentDetails,statistics&id=${videoIds.join(",")}`,
          controller.signal
        )
      : { items: [] };

    const videos: YoutubeVideoInsight[] = (videosPayload.items || [])
      .filter((video) => video?.id)
      .map((video) => {
        const stats = video.statistics || {};
        const snippet = video.snippet || {};
        const duration = parseIsoDuration(video.contentDetails?.duration);
        return {
          id: video.id!,
          title: snippet.title || "Vidéo YouTube",
          publishedAt: snippet.publishedAt || new Date().toISOString(),
          views: Number(stats.viewCount || 0),
          likeCount: Number(stats.likeCount || 0),
          commentCount: Number(stats.commentCount || 0),
          durationSeconds: duration,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          thumbnailUrl:
            snippet.thumbnails?.high?.url ||
            snippet.thumbnails?.medium?.url ||
            snippet.thumbnails?.default?.url ||
            "https://img.youtube.com/vi/placeholder/hqdefault.jpg",
        } satisfies YoutubeVideoInsight;
      })
      .sort((a, b) => b.views - a.views);

    const aggregates = computeAggregates(videos);

    const statistics = item.statistics || {};
    const snippet = item.snippet || {};

    const analytics: YoutubeChannelAnalytics = {
      channelId,
      title: snippet.title || handle || channelId,
      handle: normalizeHandle(snippet.customUrl || handle),
      description: snippet.description,
      avatarUrl:
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.medium?.url ||
        snippet.thumbnails?.default?.url ||
        "https://yt3.ggpht.com/ytc/AGIKgqPq-placeholder=s88-c-k-c0x00ffffff-no-rj",
      bannerUrl: item.brandingSettings?.image?.bannerExternalUrl,
      subscribers: Number(statistics.subscriberCount || 0),
      totalViews: Number(statistics.viewCount || 0),
      videoCount: Number(statistics.videoCount || 0),
      estimatedWatchTimeHours: aggregates.estimatedWatchTimeHours,
      averageViewDurationSeconds: aggregates.averageViewDurationSeconds,
      recentVideos: videos,
      lastUpdated: new Date().toISOString(),
    };

    return analytics;
  } finally {
    clearTimeout(timeout);
  }
}
