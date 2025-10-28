export type Network = "instagram" | "facebook" | "tiktok" | "youtube";

export interface KPI {
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
  network: Network;
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

export interface LocalizedCopy {
  fr: string;
  en: string;
}

export interface AnalyticsSummary {
  headline: LocalizedCopy;
  description: LocalizedCopy;
  delta: number;
  direction: "up" | "down";
  baseline: number;
}

export interface NetworkSnapshot {
  network: Network;
  profile: KPI;
  posts: NormalizedPost[];
  topPosts: NormalizedPost[];
  trends: TrendPoint[];
  summary: AnalyticsSummary;
}

export interface OverviewAnalytics {
  networks: Record<Network, number>;
  topPosts: NormalizedPost[];
  summaries: Record<Network, AnalyticsSummary>;
  trends: TrendPoint[];
}
