import type { Network } from "./types";

interface PipedVideo {
  videoId?: string;
  url?: string;
  title?: string;
  views?: number | string;
  uploaded?: number | string;
  uploadedDate?: string;
  uploadedText?: string;
  thumbnail?: string;
  description?: string;
  uploaderName?: string;
  uploaderUrl?: string;
  uploaderAvatar?: string;
  likes?: number | string;
  type?: string;
}

interface PipedChannelDetails {
  name?: string;
  description?: string;
  bannerUrl?: string;
  thumbnailUrl?: string;
  subscriberCount?: number | string;
  subscribers?: number | string;
  id?: string;
  url?: string;
  videos?: any[];
}

const DEFAULT_PIPED_BASE = process.env.PIPED_BASE || "https://piped.video";

async function fetchJson<T = any>(path: string, init?: RequestInit): Promise<T> {
  const url = `${DEFAULT_PIPED_BASE.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      "User-Agent":
        "InfluenceOps/1.0 (+https://github.com/your-org/InfluenceOps)",
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error(`piped ${res.status}`);
  }
  return res.json();
}

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const numeric = value
      .trim()
      .replace(/[,\s]/g, "")
      .replace(/(?<=\d)[^\d.].*/, "");
    const magnitudeMatch = value.trim().match(/([\d.]+)\s*([kmby])/i);
    if (magnitudeMatch) {
      const base = parseFloat(magnitudeMatch[1]);
      const unit = magnitudeMatch[2].toLowerCase();
      const multiplier =
        unit === "k"
          ? 1_000
          : unit === "m"
          ? 1_000_000
          : unit === "b"
          ? 1_000_000_000
          : unit === "y"
          ? 1_000_000_000_000
          : 1;
      return Math.round(base * multiplier);
    }
    const parsed = parseFloat(numeric);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return 0;
}

function parseTimestamp(video: PipedVideo): string {
  if (typeof video.uploaded === "number" && Number.isFinite(video.uploaded)) {
    return new Date(video.uploaded * 1000).toISOString();
  }
  if (typeof video.uploaded === "string") {
    const numeric = Number.parseInt(video.uploaded, 10);
    if (Number.isFinite(numeric)) {
      return new Date(numeric * 1000).toISOString();
    }
    const parsed = Date.parse(video.uploaded);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  if (video.uploadedDate) {
    const parsed = Date.parse(video.uploadedDate);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  if (video.uploadedText) {
    const parsed = Date.parse(video.uploadedText);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date().toISOString();
}

function normaliseHandleFromUrl(url?: string, fallbackName?: string): string | null {
  if (!url) return fallbackName ? `@${fallbackName.replace(/\s+/g, "")}` : null;
  const atIndex = url.indexOf("/@");
  if (atIndex >= 0) {
    return url.slice(atIndex + 2);
  }
  const channelId = url.split("/").filter(Boolean).pop();
  if (channelId) {
    return `@${channelId}`;
  }
  return fallbackName ? `@${fallbackName.replace(/\s+/g, "")}` : null;
}

function normaliseVideoId(video: PipedVideo): string {
  if (video.videoId) return video.videoId;
  if (video.url) {
    const url = new URL(video.url, "https://youtube.com");
    return url.searchParams.get("v") || url.pathname.split("/").pop() || video.url;
  }
  return video.title ? video.title.replace(/\s+/g, "-") : "unknown";
}

export async function fetchYoutubeTrending(limit = 24): Promise<PipedVideo[]> {
  const data: any = await fetchJson(`/api/trending?region=FR`);
  const list: PipedVideo[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.videos)
    ? data.videos
    : Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data)
    ? data
    : [];
  return list.slice(0, limit);
}

export async function fetchYoutubeChannelDetails(
  channelUrlFragment?: string
): Promise<PipedChannelDetails | null> {
  if (!channelUrlFragment) return null;
  const channelId = channelUrlFragment.split("/").filter(Boolean).pop();
  if (!channelId) return null;
  try {
    return await fetchJson<PipedChannelDetails>(`/api/channel/${channelId}`);
  } catch (error) {
    console.warn("youtube: unable to fetch channel details", error);
    return null;
  }
}

export async function buildYoutubeProfile(days: number) {
  const videos = await fetchYoutubeTrending(Math.min(40, Math.max(days, 12)));
  const totalViews = videos.reduce((sum, video) => sum + toNumber(video.views), 0);
  const inferredLikes = videos.reduce(
    (sum, video) => sum + Math.max(Math.round(toNumber(video.views) * 0.06), 0),
    0
  );
  const inferredComments = Math.round(inferredLikes * 0.12);
  const inferredShares = Math.round(inferredLikes * 0.18);

  const firstChannel = videos.find((video) => video.uploaderUrl);
  const channelDetails = await fetchYoutubeChannelDetails(firstChannel?.uploaderUrl);

  const followers = channelDetails
    ? toNumber(channelDetails.subscriberCount ?? channelDetails.subscribers)
    : Math.max(Math.round(totalViews / 80), 1000);

  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);

  return {
    followers,
    impressions: Math.round(totalViews * 1.18),
    views: totalViews,
    likes: inferredLikes,
    comments: inferredComments,
    shares: inferredShares,
    engagementRate:
      totalViews > 0 ? (inferredLikes + inferredComments + inferredShares) / (totalViews * 1.18) : 0,
    period: {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    },
  };
}

export async function buildYoutubePosts(days: number) {
  const videos = await fetchYoutubeTrending(Math.min(40, Math.max(days, 12)));
  return videos.map((video) => {
    const id = normaliseVideoId(video);
    const views = toNumber(video.views);
    const impressions = Math.round(views * 1.18);
    const likes = Math.max(Math.round(views * 0.06), toNumber((video as any).likes));
    const comments = Math.round(likes * 0.12);
    const shares = Math.round(likes * 0.18);
    const uploadedAt = parseTimestamp(video);
    const handle = normaliseHandleFromUrl(video.uploaderUrl, video.uploaderName || undefined);
    return {
      id,
      network: "youtube" as Network,
      title: video.title ?? `YouTube Video ${id}`,
      url: video.url
        ? new URL(video.url, "https://youtube.com").toString()
        : `https://youtube.com/watch?v=${id}`,
      publishedAt: uploadedAt,
      views,
      impressions,
      likes,
      comments,
      shares,
      engagementRate: impressions > 0 ? (likes + comments + shares) / impressions : 0,
      thumbnail: video.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      author: video.uploaderName,
      handle,
    };
  });
}

export async function searchYoutubeChannels(query: string, limit = 10) {
  const data: any = await fetchJson(`/api/search?filter=channels&q=${encodeURIComponent(query)}`);
  const list: any[] = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.channels)
    ? data.channels
    : Array.isArray(data)
    ? data
    : [];

  return list.slice(0, limit).map((item) => {
    const url: string | undefined = item.url || item.uploaderUrl;
    const handle = normaliseHandleFromUrl(url, item.name || item.uploaderName || query) ?? `@${query}`;
    const avatar =
      item.thumbnail || item.uploaderAvatar || `https://unavatar.io/youtube/${handle.replace(/^@/, "")}`;
    const followers = toNumber(item.subscribers ?? item.subscriberCount ?? item.followers);
    const profileUrl = url
      ? new URL(url, "https://youtube.com").toString()
      : `https://youtube.com/${handle.replace(/^@/, "@")}`;
    return {
      network: "youtube" as Network,
      displayName: item.name || item.uploaderName || handle.replace(/^@/, ""),
      handle,
      followers,
      avatar,
      url: profileUrl,
    };
  });
}
