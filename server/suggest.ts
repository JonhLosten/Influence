import type { Network } from "./types";
import { searchYoutubeChannels } from "./youtube";

export type Suggestion = {
  network: Network;
  displayName: string;
  handle: string;
  followers: number;
  avatar: string;
  url?: string;
  channelId?: string;
  description?: string;
  totalViews?: number;
  videoCount?: number;
};

const FALLBACK_SUGGESTIONS: Record<Network, Suggestion[]> = {
  youtube: [
    {
      network: "youtube",
      displayName: "Laugh Logic",
      handle: "@Laugh-Logic",
      followers: 52000,
      avatar: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
      url: "https://www.youtube.com/@Laugh-Logic",
      channelId: "UCmLw-JpEWJt9CHbx9uWXSng",
      totalViews: 6420000,
      videoCount: 128,
    },
    {
      network: "youtube",
      displayName: "Team Royller",
      handle: "@teamroyller2769",
      followers: 23000,
      avatar: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      url: "https://www.youtube.com/@teamroyller2769",
      channelId: "UCzV7tY0_nE-n7Xakd0sVf5A",
      totalViews: 1800000,
      videoCount: 84,
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

function guessDefaultAvatar(network: Network): string {
  const logos: Record<Network, string> = {
    youtube: "/logos/youtube.svg",
    instagram: "/logos/instagram.svg",
    facebook: "/logos/facebook.svg",
    tiktok: "/logos/tiktok.svg",
  };
  return logos[network];
}

function filterFallback(network: Network, query: string) {
  const q = query.trim().toLowerCase();
  return FALLBACK_SUGGESTIONS[network].filter(
    (item) =>
      item.displayName.toLowerCase().includes(q) ||
      item.handle.toLowerCase().includes(q)
  );
}

function cleanTitle(title: string): string {
  return title.replace(/\s*[-|–]\s*(YouTube|TikTok|Instagram|Facebook).*/i, "").trim();
}

function extractHandleFromUrl(url: string): string | null {
  const match = url.match(/@[\w.-]+/);
  return match ? match[0] : null;
}

function extractHandleFromText(text: string): string | null {
  const match = text.match(/@[\w.-]+/);
  return match ? match[0] : null;
}

function normalizeSuggestions(network: Network, raw: any[]): Suggestion[] {
  return raw
    .filter((entry) => entry && typeof entry === "object" && entry.FirstURL && entry.Text)
    .map((entry) => {
      const displayName = cleanTitle(String(entry.Text));
      const handle =
        extractHandleFromUrl(String(entry.FirstURL)) ||
        extractHandleFromText(String(entry.Text)) ||
        displayName;
      return {
        network,
        displayName,
        handle,
        followers: deterministicFollowers(handle),
        avatar: guessDefaultAvatar(network),
        url: String(entry.FirstURL),
      } satisfies Suggestion;
    })
    .slice(0, 6);
}

function flattenDuckDuckGoTopics(topics: any[]): any[] {
  const result: any[] = [];
  topics.forEach((topic) => {
    if (!topic) return;
    if (Array.isArray(topic.Topics)) {
      result.push(...topic.Topics);
    } else {
      result.push(topic);
    }
  });
  return result;
}

export async function fetchAccountSuggestions(
  network: Network,
  query: string
): Promise<Suggestion[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  if (network === "youtube") {
    const online = await searchYoutubeChannels(trimmed);
    if (online.length > 0) {
      return online as Suggestion[];
    }
  }

  let search = trimmed;
  switch (network) {
    case "youtube":
      search += " site:youtube.com/@ OR site:youtube.com/channel";
      break;
    case "instagram":
      search += " site:instagram.com";
      break;
    case "facebook":
      search += " site:facebook.com";
      break;
    case "tiktok":
      search += " site:tiktok.com/@";
      break;
  }

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(
    search
  )}&format=json&no_redirect=1&no_html=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`DuckDuckGo ${res.status}`);
    }

    const data = await res.json();
    const related = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
    const flattened = flattenDuckDuckGoTopics(related);
    const normalized = normalizeSuggestions(network, flattened);

    if (normalized.length > 0) {
      return normalized;
    }
  } catch (error) {
    console.warn("suggest: falling back to offline dataset", error);
  }

  return filterFallback(network, trimmed);
}

export function getFallbackSuggestions(network: Network, query: string) {
  return filterFallback(network, query);
}
