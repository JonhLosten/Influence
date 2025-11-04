import type { Network } from "./types";

const AYR_BASE = "https://app.ayrshare.com/api";
const API_KEY = process.env.AYRSHARE_API_KEY;

function clampDays(days: number) {
  if (!Number.isFinite(days)) return 30;
  return Math.min(Math.max(Math.floor(days), 1), 365);
}

function createPRNG(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return value / 2147483647;
  };
}

function deterministicRange(random: () => number, min: number, max: number) {
  return Math.floor(min + random() * (max - min));
}

function ayr(path: string, params: URLSearchParams, init: RequestInit = {}) {
  const url = `${AYR_BASE}${path}?${params.toString()}`;
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers || {}),
    },
  }).then((res) => {
    if (!res.ok) {
      throw new Error(`${res.status}`);
    }
    return res.json();
  });
}

function normalizeHandle(handle: string) {
  const trimmed = handle.trim().toLowerCase();
  if (!trimmed) return "";
  const withoutPrefix = trimmed.startsWith("@") ? trimmed.slice(1) : trimmed;
  const clean = withoutPrefix.replace(/[^a-z0-9_.-]/g, "");
  return clean || withoutPrefix;
}

function uniqueSortedHandles(handles: string[]) {
  return Array.from(
    new Set(
      handles
        .map(normalizeHandle)
        .filter((value) => value.length > 0)
        .sort((a, b) => (a < b ? -1 : 1))
    )
  );
}

function seedFromHandle(handle: string) {
  let hash = 2166136261;
  for (let i = 0; i < handle.length; i++) {
    hash ^= handle.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function demoProfile(network: Network, days: number, accounts: string[]) {
  const safeDays = clampDays(days);
  const baseSeed: Record<Network, number> = {
    instagram: 9101,
    facebook: 7203,
    tiktok: 5307,
    youtube: 8209,
  };
  const defaultFollowers: Record<Network, number> = {
    instagram: 3200,
    facebook: 5100,
    tiktok: 12400,
    youtube: 2100,
  };

  const handles = uniqueSortedHandles(accounts);
  if (handles.length === 0) {
    handles.push(`${network}-core`);
  }

  let followers = 0;
  let impressions = 0;
  let views = 0;
  let likes = 0;
  let comments = 0;
  let shares = 0;
  let watchTimeSeconds = 0;
  let videosPublished = 0;
  let retentionWeighted = 0;
  let retentionWeight = 0;

  handles.forEach((handle, index) => {
    const seed = seedFromHandle(handle) + index * 97;
    const prng = createPRNG(baseSeed[network] + seed + safeDays * 37);
    const followerFloor = Math.max(defaultFollowers[network] * 0.45, 800);
    const accountFollowers =
      followerFloor + deterministicRange(prng, 350, 6200) * (0.6 + prng());
    const accountImpressions =
      deterministicRange(prng, 16000, 52000) +
      safeDays * deterministicRange(prng, 80, 190);
    const accountViews = Math.max(
      accountImpressions - deterministicRange(prng, 900, 3600),
      0
    );
    const accountLikes = deterministicRange(
      prng,
      Math.floor(accountViews * 0.04),
      Math.floor(accountViews * 0.1)
    );
    const accountComments = deterministicRange(
      prng,
      Math.floor(accountLikes * 0.08),
      Math.floor(accountLikes * 0.18)
    );
    const accountShares = deterministicRange(
      prng,
      Math.floor(accountLikes * 0.05),
      Math.floor(accountLikes * 0.12)
    );
    const avgDuration = deterministicRange(prng, 120, 420);
    const retention = 0.35 + prng() * 0.45;
    const published = Math.max(
      4,
      Math.round((safeDays / 7) * (0.7 + prng() * 1.3))
    );

    followers += accountFollowers;
    impressions += accountImpressions;
    views += accountViews;
    likes += accountLikes;
    comments += accountComments;
    shares += accountShares;
    watchTimeSeconds += accountViews * avgDuration;
    retentionWeighted += retention * accountViews;
    retentionWeight += accountViews;
    videosPublished += published;
  });

  const watchTimeHours = Math.round((watchTimeSeconds / 3600) * 10) / 10;
  const avgViewDurationSeconds = views
    ? Math.round(watchTimeSeconds / views)
    : undefined;
  const audienceRetentionRate = retentionWeight
    ? Math.round((retentionWeighted / retentionWeight) * 1000) / 1000
    : undefined;

  const to = new Date();
  const from = new Date(to.getTime() - safeDays * 86400000);

  return {
    followers: Math.round(followers),
    impressions: Math.round(impressions),
    views: Math.round(views),
    likes: Math.round(likes),
    comments: Math.round(comments),
    shares: Math.round(shares),
    watchTimeHours,
    avgViewDurationSeconds,
    audienceRetentionRate,
    videosPublished: Math.round(videosPublished),
    period: {
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    },
  };
}

function buildPostUrl(network: Network, handle: string, id: string) {
  const normalized = normalizeHandle(handle) || handle;
  switch (network) {
    case "youtube":
      return `https://www.youtube.com/${normalized.startsWith("@") ? "" : "@"}${normalized}/videos/${id}`;
    case "instagram":
      return `https://www.instagram.com/${normalized}/`;
    case "facebook":
      return `https://www.facebook.com/${normalized}`;
    case "tiktok":
      return `https://www.tiktok.com/@${normalized}`;
    default:
      return "#";
  }
}

function demoPosts(network: Network, days: number, accounts: string[]) {
  const safeDays = clampDays(days);
  const baseSeed: Record<Network, number> = {
    instagram: 9101,
    facebook: 7203,
    tiktok: 5307,
    youtube: 8209,
  };
  const handles = uniqueSortedHandles(accounts);
  if (handles.length === 0) {
    handles.push(`${network}-core`);
  }

  const posts: Array<{
    id: string;
    network: Network;
    title: string;
    url: string;
    publishedAt: string;
    views: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    thumbnail: string;
  }> = [];

  handles.forEach((handle, index) => {
    const seed = seedFromHandle(handle) + index * 131;
    const prng = createPRNG(baseSeed[network] + seed + safeDays * 53);
    const count = Math.min(
      48,
      Math.max(8, Math.round((safeDays / 3) * (0.8 + prng())))
    );
    for (let i = 0; i < count; i++) {
      const views = deterministicRange(prng, 1800, 14500);
      const impressions = views + deterministicRange(prng, 900, 5200);
      const likes = deterministicRange(
        prng,
        Math.floor(views * 0.05),
        Math.floor(views * 0.11)
      );
      const comments = deterministicRange(
        prng,
        Math.floor(likes * 0.09),
        Math.floor(likes * 0.2)
      );
      const shares = deterministicRange(
        prng,
        Math.floor(likes * 0.05),
        Math.floor(likes * 0.14)
      );
      const ageDays = prng() * safeDays;
      const publishedAt = new Date(Date.now() - ageDays * 86400000);
      const postId = `${handle}-${i}`;
      posts.push({
        id: `${network}-${postId}`,
        network,
        title: `${handle.replace(/[-_.]/g, " ") || network} • vidéo ${i + 1}`,
        url: buildPostUrl(network, handle, postId),
        publishedAt: publishedAt.toISOString(),
        views,
        impressions,
        likes,
        comments,
        shares,
        thumbnail: `https://picsum.photos/seed/${network}-${postId}/320/180`,
      });
    }
  });

  return posts;
}

function appendAccounts(params: URLSearchParams, accounts: string[]) {
  accounts.forEach((account) => {
    if (!account) return;
    params.append("account", account);
  });
}

export async function getProfileAnalytics(
  network: Network,
  days = 30,
  accounts: string[] = []
) {
  if (!API_KEY) {
    return demoProfile(network, days, accounts);
  }
  const params = new URLSearchParams({
    network,
    days: String(clampDays(days)),
  });
  appendAccounts(params, accounts);
  return ayr("/analytics/social", params);
}

export async function getPostsAnalytics(
  network: Network,
  days = 30,
  accounts: string[] = []
) {
  if (!API_KEY) {
    return demoPosts(network, days, accounts);
  }
  const params = new URLSearchParams({
    network,
    days: String(clampDays(days)),
  });
  appendAccounts(params, accounts);
  return ayr("/analytics/posts", params);
}
