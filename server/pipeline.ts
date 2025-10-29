import { normalizeProfile, normalizePosts, buildSeededInsights } from "./normalize";
import {
  type Network,
  type NetworkSnapshot,
  type OverviewAnalytics,
} from "./types";

interface AnalyticsSource {
  fetchProfile: (network: Network, days: number) => Promise<any>;
  fetchPosts: (network: Network, days: number) => Promise<any[]>;
}

const SUPPORTED_NETWORKS: Network[] = ["instagram", "facebook", "tiktok", "youtube"];

function ensureNetwork(value: string): value is Network {
  return (SUPPORTED_NETWORKS as string[]).includes(value);
}

function clampDays(input: unknown, fallback = 30) {
  const parsed = typeof input === "string" ? parseInt(input, 10) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 365);
}

export function createAnalyticsPipeline(source: AnalyticsSource) {
  async function fetchSnapshot(network: Network, days: number): Promise<NetworkSnapshot> {
    const [profileRaw, postsRaw] = await Promise.all([
      source.fetchProfile(network, days),
      source.fetchPosts(network, days),
    ]);
    const profile = normalizeProfile(network, profileRaw);
    const posts = normalizePosts(network, postsRaw);
    const insights = buildSeededInsights(network, profile, posts, days);

    return {
      network,
      profile,
      posts,
      summary: insights.summary,
      trends: insights.trends,
      topPosts: insights.topPosts,
    };
  }

  async function fetchOverview(days: number): Promise<OverviewAnalytics> {
    const snapshotTuples = await Promise.all(
      SUPPORTED_NETWORKS.map(async (network) => {
        try {
          const snapshot = await fetchSnapshot(network, days);
          return [network, snapshot] as const;
        } catch (error) {
          console.warn(`pipeline: unable to fetch snapshot for ${network}`, error);
          return [network, null] as const;
        }
      })
    );

    const availableSnapshots = snapshotTuples.filter(
      (entry): entry is [Network, NetworkSnapshot] => entry[1] !== null
    );

    if (availableSnapshots.length === 0) {
      throw new Error("No analytics available");
    }

    const networks = snapshotTuples.reduce((acc, [network, snapshot]) => {
      acc[network] = snapshot ? snapshot.profile.views : 0;
      return acc;
    }, {} as OverviewAnalytics["networks"]);

    const topPosts = availableSnapshots
      .flatMap(([, snapshot]) => snapshot.topPosts)
      .sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))
      .slice(0, 9);

    const summaries = availableSnapshots.reduce((acc, [network, snapshot]) => {
      acc[network] = snapshot.summary;
      return acc;
    }, {} as OverviewAnalytics["summaries"]);

    const aggregatedTrendMap = new Map<string, { views: number; samples: number }>();
    availableSnapshots.forEach(([, snapshot]) => {
      snapshot.trends.forEach((point) => {
        const prev = aggregatedTrendMap.get(point.date) ?? { views: 0, samples: 0 };
        aggregatedTrendMap.set(point.date, {
          views: prev.views + point.views,
          samples: prev.samples + 1,
        });
      });
    });

    const trends = Array.from(aggregatedTrendMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, payload]) => ({
        date,
        views: Math.round(payload.views / Math.max(payload.samples, 1)),
        delta: 0,
      }));

    const unavailable = snapshotTuples
      .filter(([, snapshot]) => !snapshot)
      .map(([network]) => network);

    return { networks, topPosts, summaries, trends, unavailable };
  }

  return {
    supportedNetworks: SUPPORTED_NETWORKS,
    ensureNetwork,
    clampDays,
    fetchSnapshot,
    fetchOverview,
  };
}

export type AnalyticsPipeline = ReturnType<typeof createAnalyticsPipeline>;
