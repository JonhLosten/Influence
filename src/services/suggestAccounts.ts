import { NetworkName } from "../store/useAppState";

type Suggestion = {
  network: NetworkName;
  displayName: string;
  handle: string;
  followers: number;
  avatar: string;
  url?: string;
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

export async function suggestAccounts(network: NetworkName, query: string): Promise<Suggestion[]> {
  if (!query.trim()) return [];

  let search = query.trim();
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

  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(search)}&format=json&no_redirect=1&no_html=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`DuckDuckGo ${res.status}`);

    const data = await res.json();
    const related = Array.isArray(data?.RelatedTopics) ? data.RelatedTopics : [];
    const results = related
      .filter((r: any) => r?.FirstURL && r?.Text)
      .slice(0, 6)
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
        };
      });

    if (results.length > 0) {
      return results;
    }
  } catch (err) {
    console.warn("suggestAccounts: fallback to offline dataset", err);
  }

  return filterFallback(network, query);
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
