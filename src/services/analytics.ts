import { NetworkName } from "../store/useAppState";

const API_BASE = (import.meta as any).env?.VITE_API_URL || "http://localhost:5174";

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

export interface NetworkSnapshotResponse {
  network: NetworkName;
  profile: NetworkProfile;
  posts: NormalizedPost[];
}

export interface OverviewAnalytics {
  networks: Record<NetworkName, number>;
  topPosts: NormalizedPost[];
}

function resolveUrl(path: string) {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path}`;
}

export async function fetchNetworkSnapshot(network: NetworkName, days: number): Promise<NetworkSnapshotResponse> {
  const res = await fetch(resolveUrl(`/api/networks/${network}?days=${days}`));
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}

export async function fetchOverviewAnalytics(days: number): Promise<OverviewAnalytics> {
  const res = await fetch(resolveUrl(`/api/overview?days=${days}`));
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  return res.json();
}
