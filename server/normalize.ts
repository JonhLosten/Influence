import type {
  KPI,
  Network,
  NormalizedPost,
  AnalyticsSummary,
  TrendPoint,
} from "./types";

const NETWORK_LABELS: Record<Network, { fr: string; en: string }> = {
  instagram: { fr: "Instagram", en: "Instagram" },
  facebook: { fr: "Facebook", en: "Facebook" },
  tiktok: { fr: "TikTok", en: "TikTok" },
  youtube: { fr: "YouTube", en: "YouTube" },
};

const NETWORK_SEED: Record<Network, number> = {
  instagram: 9101,
  facebook: 7203,
  tiktok: 5307,
  youtube: 8209,
};

export function normalizeProfile(network: Network, raw: any): KPI {
  const followers = raw.followers ?? raw.subscribers ?? 0;
  const impressions = raw.impressions ?? raw.reach ?? raw.views ?? 0;
  const likes = raw.likes ?? 0;
  const comments = raw.comments ?? 0;
  const shares = raw.shares ?? 0;
  const views = raw.views ?? impressions ?? 0;
  const watchTimeHours = raw.watchTimeHours ?? raw.watchTime ?? undefined;
  const avgViewDurationSeconds =
    raw.avgViewDurationSeconds ?? raw.avgViewDuration ?? undefined;
  const audienceRetentionRate =
    raw.audienceRetentionRate ?? raw.retentionRate ?? undefined;
  const videosPublished = raw.videosPublished ?? raw.postsPublished ?? undefined;
  const engagementRate = impressions
    ? +(((likes + comments + shares) / impressions).toFixed(4))
    : undefined;
  return {
    followers,
    impressions,
    views,
    likes,
    comments,
    shares,
    engagementRate,
    watchTimeHours,
    avgViewDurationSeconds,
    audienceRetentionRate,
    videosPublished,
    period: raw.period ?? { from: "", to: "" },
  };
}

export function normalizePosts(network: Network, raw: any[]): NormalizedPost[] {
  return raw.map((r) => ({
    id: String(r.id ?? `${network}-${r.title}`),
    network,
    title: r.title || r.caption,
    url: r.url,
    publishedAt: r.publishedAt || r.time,
    views: r.views ?? r.impressions ?? 0,
    impressions: r.impressions,
    likes: r.likes ?? 0,
    comments: r.comments ?? 0,
    shares: r.shares ?? 0,
    engagementRate: r.impressions
      ? ((r.likes || 0) + (r.comments || 0) + (r.shares || 0)) / r.impressions
      : undefined,
    thumbnail: r.thumbnail,
  }));
}

function createPRNG(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function clampDays(days: number) {
  if (!Number.isFinite(days)) return 30;
  return Math.min(Math.max(Math.floor(days), 7), 365);
}

function formatNumber(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
}

export function buildSeededInsights(
  network: Network,
  profile: KPI,
  posts: NormalizedPost[],
  days: number
): { summary: AnalyticsSummary; trends: TrendPoint[]; topPosts: NormalizedPost[] } {
  const safeDays = clampDays(days);
  const prng = createPRNG(NETWORK_SEED[network] + safeDays * 37);
  const trendLength = Math.min(Math.max(Math.floor(safeDays / 2), 7), 30);
  const stepMs = (safeDays / trendLength) * 86400000;
  const now = Date.now();
  const trends: TrendPoint[] = [];
  let previous = Math.max(Math.floor(profile.views / trendLength) || 1000, 120);

  for (let step = trendLength - 1; step >= 0; step--) {
    const variance = prng() * 0.35 - 0.175; // +/- 17.5%
    const next = Math.max(Math.round(previous * (1 + variance)), 0);
    const date = new Date(now - step * stepMs);
    trends.push({
      date: date.toISOString().slice(0, 10),
      views: next,
      delta: next - previous,
    });
    previous = next;
  }

  const first = trends[0]?.views ?? 1;
  const last = trends[trends.length - 1]?.views ?? first;
  const change = ((last - first) / Math.max(first, 1)) * 100;
  const delta = Math.round(Math.abs(change) * 10) / 10;
  const direction: "up" | "down" = change >= 0 ? "up" : "down";
  const labels = NETWORK_LABELS[network];

  const summary: AnalyticsSummary = {
    headline: {
      fr: direction === "up" ? "Audience en hausse" : "Audience en légère baisse",
      en: direction === "up" ? "Audience trending up" : "Audience trending down",
    },
    description: {
      fr: `${labels.fr} a généré ${formatNumber(profile.views, "fr-FR")} vues sur ${safeDays} jours avec un taux d'engagement de ${((profile.engagementRate ?? 0) * 100).toFixed(1)} %.`,
      en: `${labels.en} collected ${formatNumber(profile.views, "en-US")} views over ${safeDays} days with ${((profile.engagementRate ?? 0) * 100).toFixed(1)}% engagement.`,
    },
    delta,
    direction,
    baseline: first,
  };

  const topPosts = [...posts]
    .sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))
    .slice(0, 6);

  return { summary, trends, topPosts };
}
