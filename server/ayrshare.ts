import type { Network } from "./types";
import { buildYoutubePosts, buildYoutubeProfile } from "./youtube";

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

async function ayr(path: string, init: RequestInit = {}) {
  if (!API_KEY) {
    const url = new URL(path, "https://demo.influenceops.local");
    const network = (url.searchParams.get("network") as Network) || "instagram";
    if (network === "youtube") {
      if (path.startsWith("/analytics/social")) {
        const days = clampDays(Number(url.searchParams.get("days") || "30"));
        return buildYoutubeProfile(days);
      }
      if (path.startsWith("/analytics/posts")) {
        const days = clampDays(Number(url.searchParams.get("days") || "30"));
        return buildYoutubePosts(days);
      }
    }
    return demo(path);
  }
  const res = await fetch(`${AYR_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers || {}),
    },
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}

export async function getProfileAnalytics(network: Network, days = 30) {
  return ayr(`/analytics/social?network=${network}&days=${days}`);
}

export async function getPostsAnalytics(network: Network, days = 30) {
  return ayr(`/analytics/posts?network=${network}&days=${days}`);
}

function demo(path: string) {
  const url = new URL(path, "https://demo.influenceops.local");
  const network = (url.searchParams.get("network") as Network) || "instagram";
  const days = clampDays(parseInt(url.searchParams.get("days") || "30", 10));
  const seedBase: Record<Network, number> = {
    instagram: 9101,
    facebook: 7203,
    tiktok: 5307,
    youtube: 8209,
  };
  const followersBase: Record<Network, number> = {
    instagram: 3200,
    facebook: 5100,
    tiktok: 12400,
    youtube: 2100,
  };
  const prng = createPRNG(seedBase[network] + days * 37);

  const to = new Date();
  const from = new Date(to.getTime() - days * 86400000);

  if (path.startsWith("/analytics/social")) {
    const followers = followersBase[network] + deterministicRange(prng, 80, 320);
    const impressions = deterministicRange(prng, 18000, 42000) + days * deterministicRange(prng, 90, 160);
    const views = Math.max(impressions - deterministicRange(prng, 1000, 5000), 0);
    const likes = deterministicRange(prng, Math.floor(views * 0.03), Math.floor(views * 0.08));
    const comments = deterministicRange(prng, Math.floor(likes * 0.08), Math.floor(likes * 0.15));
    const shares = deterministicRange(prng, Math.floor(likes * 0.05), Math.floor(likes * 0.12));
    return {
      followers,
      impressions,
      views,
      likes,
      comments,
      shares,
      period: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
    };
  }

  if (path.startsWith("/analytics/posts")) {
    const posts = [] as Array<{
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
    }>;
    const count = Math.min(40, Math.max(12, days));
    for (let i = 0; i < count; i++) {
      const views = deterministicRange(prng, 1500, 12000);
      const impressions = views + deterministicRange(prng, 800, 4000);
      const likes = deterministicRange(prng, Math.floor(views * 0.04), Math.floor(views * 0.09));
      const comments = deterministicRange(prng, Math.floor(likes * 0.08), Math.floor(likes * 0.18));
      const shares = deterministicRange(prng, Math.floor(likes * 0.05), Math.floor(likes * 0.12));
      const publishedAt = new Date(to.getTime() - i * 86400000 * 0.8);
      posts.push({
        id: `${network}-${i}`,
        network,
        title: `${network.toUpperCase()} Post ${i + 1}`,
        url: "#",
        publishedAt: publishedAt.toISOString(),
        views,
        impressions,
        likes,
        comments,
        shares,
        thumbnail: `https://picsum.photos/seed/${network}-${i}/320/180`,
      });
    }
    return posts;
  }

  return {};
}
