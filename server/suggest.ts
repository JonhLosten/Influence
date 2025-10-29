import type { Network } from "./types";
import { searchYoutubeChannels } from "./youtube";

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

function guessDefaultAvatar(network: Network, handle?: string): string {
  const fallbackLogos: Record<Network, string> = {
    youtube: "/logos/youtube.svg",
    instagram: "/logos/instagram.svg",
    facebook: "/logos/facebook.svg",
    tiktok: "/logos/tiktok.svg",
  };
  const cleanHandle = handle?.replace(/^@/, "");
  if (cleanHandle) {
    const provider = network === "youtube" ? "youtube" : network;
    return `https://unavatar.io/${provider}/${encodeURIComponent(cleanHandle)}`;
  }
  return fallbackLogos[network];
}

function filterFallback(network: Network, query: string) {
  const q = query.trim().toLowerCase();
  return FALLBACK_SUGGESTIONS[network].filter(
    (item) =>
      item.displayName.toLowerCase().includes(q) ||
      item.handle.toLowerCase().includes(q)
  );
}

export async function fetchSuggestions(
  network: Network,
  query: string
): Promise<SuggestionPayload[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    if (network === "youtube") {
      const youtubeResults = await searchYoutubeChannels(trimmed, 10);
      if (youtubeResults.length) {
        return youtubeResults;
      }
    }
  } catch (err) {
    console.warn("suggestions: failed to fetch online dataset", err);
  }

  const fallback = filterFallback(network, query);
  if (fallback.length) return fallback;

  const fallbackHandle = trimmed.startsWith("@")
    ? trimmed
    : `@${trimmed.replace(/\s+/g, "")}`;

  return [
    {
      network,
      displayName: trimmed,
      handle: fallbackHandle,
      followers: deterministicFollowers(fallbackHandle),
      avatar: guessDefaultAvatar(network, fallbackHandle),
    },
  ];
}
