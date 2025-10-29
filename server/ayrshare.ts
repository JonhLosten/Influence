import type { Network } from "./types";
import { buildYoutubePosts, buildYoutubeProfile } from "./youtube";

const AYR_BASE = "https://app.ayrshare.com/api";
const API_KEY = process.env.AYRSHARE_API_KEY;

export class MissingCredentialsError extends Error {
  network: Network;

  constructor(network: Network) {
    super(`Missing Ayrshare credentials for ${network}`);
    this.name = "MissingCredentialsError";
    this.network = network;
  }
}

function clampDays(days: number) {
  if (!Number.isFinite(days)) return 30;
  return Math.min(Math.max(Math.floor(days), 1), 365);
}

async function requestAyr(
  path: string,
  network: Network,
  init: RequestInit = {}
) {
  if (!API_KEY) {
    throw new MissingCredentialsError(network);
  }

  const res = await fetch(`${AYR_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    throw new Error(`${res.status} ${await res.text()}`);
  }

  return res.json();
}

export async function getProfileAnalytics(network: Network, days = 30) {
  const clampedDays = clampDays(days);

  if (!API_KEY && network === "youtube") {
    return buildYoutubeProfile(clampedDays);
  }

  if (network === "youtube") {
    try {
      return await requestAyr(
        `/analytics/social?network=${network}&days=${clampedDays}`,
        network
      );
    } catch (error) {
      console.warn("ayrshare: youtube profile fallback to piped", error);
      return buildYoutubeProfile(clampedDays);
    }
  }

  return requestAyr(
    `/analytics/social?network=${network}&days=${clampedDays}`,
    network
  );
}

export async function getPostsAnalytics(network: Network, days = 30) {
  const clampedDays = clampDays(days);

  if (!API_KEY && network === "youtube") {
    return buildYoutubePosts(clampedDays);
  }

  if (network === "youtube") {
    try {
      return await requestAyr(
        `/analytics/posts?network=${network}&days=${clampedDays}`,
        network
      );
    } catch (error) {
      console.warn("ayrshare: youtube posts fallback to piped", error);
      return buildYoutubePosts(clampedDays);
    }
  }

  return requestAyr(
    `/analytics/posts?network=${network}&days=${clampedDays}`,
    network
  );
}
