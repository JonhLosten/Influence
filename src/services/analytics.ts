import { NetworkName } from "../store/useAppState";
import { resolveApiUrl } from "./api";

export interface NetworkProfile {
  followers: number;
  impressions: number;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  engagementRate?: number;
  period: { from: string; to: string };
}

export interface NormalizedPost {
  id: string;
  network: NetworkName;
  title?: string;
  url?: string;
  publishedAt?: string;
  views?: number;
  impressions?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  engagementRate?: number;
  thumbnail?: string;
}

export interface TrendPoint {
  date: string;
  views: number;
  delta: number;
}

export interface AnalyticsSummary {
  headline: { fr: string; en: string };
  description: { fr: string; en: string };
  delta: number;
  direction: "up" | "down";
  baseline: number;
}

export interface NetworkSnapshotResponse {
  network: NetworkName;
  profile: NetworkProfile;
  posts: NormalizedPost[];
  topPosts: NormalizedPost[];
  trends: TrendPoint[];
  summary: AnalyticsSummary;
}

export interface OverviewAnalytics {
  networks: Record<NetworkName, number>;
  topPosts: NormalizedPost[];
  summaries: Record<NetworkName, AnalyticsSummary>;
  trends: TrendPoint[];
}

export async function fetchNetworkSnapshot(
  network: NetworkName,
  days: number,
  signal?: AbortSignal
): Promise<NetworkSnapshotResponse> {
  const res = await fetch(resolveApiUrl(`/api/networks/${network}?days=${days}`), {
    signal,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

export async function fetchOverviewAnalytics(
  days: number,
  signal?: AbortSignal
): Promise<OverviewAnalytics> {
  const res = await fetch(resolveApiUrl(`/api/overview?days=${days}`), {
    signal,
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}
