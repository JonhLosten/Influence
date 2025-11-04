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
  watchTimeHours?: number;
  avgViewDurationSeconds?: number;
  audienceRetentionRate?: number;
  videosPublished?: number;
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
  watchTimeHours: Record<NetworkName, number>;
}

export async function fetchNetworkSnapshot(
  network: NetworkName,
  days: number,
  accounts: string[] = []
): Promise<NetworkSnapshotResponse> {
  const params = new URLSearchParams({ days: String(days) });
  accounts.forEach((account) => {
    if (!account.trim()) return;
    params.append("account", account);
  });
  const res = await fetch(
    resolveApiUrl(`/api/networks/${network}?${params.toString()}`)
  );
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

export async function fetchOverviewAnalytics(
  days: number,
  accountsByNetwork?: Partial<Record<NetworkName, string[]>>
): Promise<OverviewAnalytics> {
  const params = new URLSearchParams({ days: String(days) });
  if (accountsByNetwork) {
    Object.entries(accountsByNetwork).forEach(([network, handles]) => {
      if (!Array.isArray(handles)) return;
      handles.forEach((handle) => {
        if (!handle?.trim()) return;
        params.append("account", `${network}:${handle}`);
      });
    });
  }
  const res = await fetch(resolveApiUrl(`/api/overview?${params.toString()}`));
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}
