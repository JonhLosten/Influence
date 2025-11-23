import type { NetworkName } from "../store/useAppState";
import { resolveApiUrl } from "./api";

type Suggestion = {
  network: NetworkName;
  displayName: string;
  handle: string;
  followers: number;
  avatar: string;
  url?: string;
};

const CACHE_KEY = "influenceops.suggestions-cache";
const CACHE_VERSION = 1;
const CACHE_TTL = 1000 * 60 * 60 * 24 * 7; // 7 jours

type SuggestionCache = {
  version: number;
  entries: Record<string, { expiresAt: number; items: Suggestion[] }>;
};

const FALLBACK_SUGGESTIONS: Record<NetworkName, Suggestion[]> = {
  youtube: [
    {
      network: "youtube",
      displayName: "Laugh Logic",
      handle: "@Laugh-Logic",
      followers: 52000,
      avatar: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
      url: "https://www.youtube.com/@Laugh-Logic",
    },
    {
      network: "youtube",
      displayName: "Team Royller",
      handle: "@teamroyller2769",
      followers: 23000,
      avatar: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      url: "https://www.youtube.com/@teamroyller2769",
    },
  ],
  instagram: [
    {
      network: "instagram",
      displayName: "InfluenceOps",
      handle: "@influenceops",
      followers: 18300,
      avatar: "https://picsum.photos/seed/influenceops/80",
      url: "https://www.instagram.com/influenceops",
    },
    {
      network: "instagram",
      displayName: "Créateurs FR",
      handle: "@createurs.fr",
      followers: 9200,
      avatar: "https://picsum.photos/seed/createursfr/80",
    },
  ],
  facebook: [
    {
      network: "facebook",
      displayName: "InfluenceOps Community",
      handle: "@influenceops.community",
      followers: 14100,
      avatar: "https://picsum.photos/seed/influenceopsfb/80",
    },
    {
      network: "facebook",
      displayName: "Tendances Marketing",
      handle: "@tendances.marketing",
      followers: 8700,
      avatar: "https://picsum.photos/seed/tendancefb/80",
    },
  ],
  tiktok: [
    {
      network: "tiktok",
      displayName: "InfluenceOps Tips",
      handle: "@influenceops_tips",
      followers: 25200,
      avatar: "https://picsum.photos/seed/influenceopstt/80",
    },
    {
      network: "tiktok",
      displayName: "Viral Check",
      handle: "@viralcheck",
      followers: 11200,
      avatar: "https://picsum.photos/seed/viralcheck/80",
    },
  ],
};

function deterministicFollowers(handle: string): number {
  const normalized = handle.toLowerCase();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 31 + normalized.charCodeAt(i)) >>> 0;
  }
  const base = 500 + (hash % 20000);
  return base;
}

function guessDefaultAvatar(network: NetworkName): string {
  const logos: Record<NetworkName, string> = {
    youtube: "/logos/youtube.svg",
    instagram: "/logos/instagram.svg",
    facebook: "/logos/facebook.svg",
    tiktok: "/logos/tiktok.svg",
  };
  return logos[network];
}

function filterFallback(network: NetworkName, query: string) {
  const q = query.trim().toLowerCase();
  return FALLBACK_SUGGESTIONS[network].filter(
    (item) =>
      item.displayName.toLowerCase().includes(q) ||
      item.handle.toLowerCase().includes(q)
  );
}

function readCache(): SuggestionCache {
  if (typeof window === "undefined") {
    return { version: CACHE_VERSION, entries: {} };
  }
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) {
      return { version: CACHE_VERSION, entries: {} };
    }
    const parsed = JSON.parse(raw) as SuggestionCache;
    if (parsed.version !== CACHE_VERSION || !parsed.entries) {
      return { version: CACHE_VERSION, entries: {} };
    }
    return parsed;
  } catch (err) {
    console.warn("suggestAccounts: unable to read cache", err);
    return { version: CACHE_VERSION, entries: {} };
  }
}

function writeCache(cache: SuggestionCache) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (err) {
    console.warn("suggestAccounts: unable to persist cache", err);
  }
}

function cacheKey(network: NetworkName, query: string) {
  return `${network}:${query.trim().toLowerCase()}`;
}

function getCachedSuggestions(network: NetworkName, query: string) {
  const cache = readCache();
  const key = cacheKey(network, query);
  const hit = cache.entries[key];
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    delete cache.entries[key];
    writeCache(cache);
    return null;
  }
  return hit.items;
}

function storeSuggestions(
  network: NetworkName,
  query: string,
  items: Suggestion[]
) {
  const cache = readCache();
  const key = cacheKey(network, query);
  cache.entries[key] = {
    expiresAt: Date.now() + CACHE_TTL,
    items,
  };
  writeCache(cache);
}

export async function suggestAccounts(
  network: NetworkName,
  query: string
): Promise<Suggestion[]> {
  if (!query.trim()) return [];

  const cached = getCachedSuggestions(network, query);
  if (cached) {
    return cached;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const url = resolveApiUrl(
      `/api/suggest?network=${network}&q=${encodeURIComponent(query.trim())}`
    );
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`Suggest API ${res.status}`);

    const payload = (await res.json()) as { suggestions?: Suggestion[] };
    const results = Array.isArray(payload?.suggestions)
      ? payload.suggestions
      : [];

    if (results.length > 0) {
      storeSuggestions(network, query, results);
      return results;
    }
  } catch (err) {
    console.warn("suggestAccounts: fallback to offline dataset", err);
  }

  const fallback = filterFallback(network, query);
  storeSuggestions(network, query, fallback);
  return fallback;
}
