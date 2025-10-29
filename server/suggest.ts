import type { Network } from "./types";

export interface SuggestionPayload {
  network: Network;
  displayName: string;
  handle: string;
  followers: number;
  avatar: string;
  url?: string;
}

const FALLBACK_SUGGESTIONS: Record<Network, SuggestionPayload[]> = {
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
  return 500 + (hash % 20000);
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

export async function fetchSuggestions(
  network: Network,
  query: string
): Promise<SuggestionPayload[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

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

  const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(
    search
  )}&format=json&no_redirect=1&no_html=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(ddgUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const related = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
      const results = related
        .filter((r: any) => r?.FirstURL && r?.Text)
        .slice(0, 10)
        .map((r: any) => {
          const displayName = cleanTitle(r.Text);
          const handle =
            extractHandleFromUrl(r.FirstURL) || extractHandleFromText(r.Text) || displayName;
          return {
            network,
            displayName,
            handle,
            followers: deterministicFollowers(handle),
            avatar: guessDefaultAvatar(network),
            url: r.FirstURL,
          } satisfies SuggestionPayload;
        })
        .filter((item: SuggestionPayload) => Boolean(item.handle));

      if (results.length > 0) {
        return results;
      }
    } else {
      console.warn(`suggestions: DuckDuckGo ${res.status}`);
    }
  } catch (err) {
    console.warn("suggestions: failed to query DuckDuckGo", err);
  }

  const fallback = filterFallback(network, query);
  if (fallback.length) return fallback;

  return [
    {
      network,
      displayName: trimmed,
      handle: trimmed.startsWith("@") ? trimmed : `@${trimmed.replace(/\s+/g, "")}`,
      followers: deterministicFollowers(trimmed),
      avatar: guessDefaultAvatar(network),
    },
  ];
}
