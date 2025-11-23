import type { NetworkName } from "../store/useAppState";

export type PeriodDays = number | "all";

type TrendDay = {
  date: string;
  instagram: number;
  facebook: number;
  tiktok: number;
  youtube: number;
  total: number;
};

export type MockPost = {
  id: string;
  title: string;
  network: NetworkName;
  thumbnailUrl: string;
  engagementRate: number;
  views: number;
  date: string;
};

const networks: NetworkName[] = ["instagram", "facebook", "tiktok", "youtube"];

function prng(seed: number) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function getDashboardData(
  days: PeriodDays = 7,
  focusNetwork?: NetworkName
) {
  const today = new Date();
  const totalDays = days === "all" ? 730 : days;
  const series: TrendDay[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(+today - i * 86400000);
    const label = d.toISOString().slice(0, 10);

    const values: Record<NetworkName, number> = {
      instagram: Math.floor(800 + prng(i * 11) * 4000),
      facebook: Math.floor(600 + prng(i * 7) * 3000),
      tiktok: Math.floor(1200 + prng(i * 3) * 6000),
      youtube: Math.floor(500 + prng(i * 5) * 2500),
    };

    const total = Object.values(values).reduce((a, b) => a + b, 0);
    series.push({ date: label, ...values, total });
  }

  const posts: MockPost[] = [];
  for (let i = 0; i < 60; i++) {
    const net = networks[i % networks.length];
    const seed = i + totalDays;
    posts.push({
      id: `${net}-${i}`,
      title: `Contenu ${i + 1} (${net})`,
      network: net,
      thumbnailUrl: `https://picsum.photos/seed/${net}-${i}/300/200`,
      engagementRate: 0.03 + prng(seed) * 0.12,
      views: Math.floor(1000 + prng(seed * 2) * 100000),
      date: new Date(+today - prng(seed) * totalDays * 86400000).toISOString(),
    });
  }

  const activeNetworks = focusNetwork ? [focusNetwork] : networks;

  const cutoff =
    days === "all"
      ? 0
      : +today - (typeof days === "number" ? days : 7) * 86400000;

  const topPosts = posts
    .filter((p) => activeNetworks.includes(p.network))
    .filter((p) => new Date(p.date).getTime() >= cutoff)
    .sort((a, b) => b.views - a.views)
    .slice(0, 6);

  const trendStack = focusNetwork
    ? series.map((item) => ({
        date: item.date,
        instagram: focusNetwork === "instagram" ? item.instagram : 0,
        facebook: focusNetwork === "facebook" ? item.facebook : 0,
        tiktok: focusNetwork === "tiktok" ? item.tiktok : 0,
        youtube: focusNetwork === "youtube" ? item.youtube : 0,
        total: item[focusNetwork],
      }))
    : series;

  return {
    summary: [
      { label: "Instagram", value: "instagram" },
      { label: "Facebook", value: "facebook" },
      { label: "TikTok", value: "tiktok" },
      { label: "YouTube", value: "youtube" },
    ],
    trendStack,
    topPosts,
    horizons: [7, 30, 90, 365, "all" as const],
    networks,
  };
}
