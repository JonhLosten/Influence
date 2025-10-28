import express from "express";
import cors from "cors";
import { normalizeProfile, normalizePosts } from "./normalize";
import { getProfileAnalytics, getPostsAnalytics } from "./ayrshare";
import type { Network } from "./types";

const app = express();
const PORT = Number(process.env.PORT || 5174);

app.use(cors());
app.use(express.json());

const SUPPORTED_NETWORKS: Network[] = ["instagram", "facebook", "tiktok", "youtube"];

function isNetwork(value: string): value is Network {
  return (SUPPORTED_NETWORKS as string[]).includes(value);
}

function parseDays(input: unknown, fallback = 30) {
  const parsed = typeof input === "string" ? parseInt(input, 10) : fallback;
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 365);
}

app.get("/api/networks/:network", async (req, res) => {
  const { network } = req.params;
  if (!isNetwork(network)) {
    res.status(400).json({ error: "Unknown network" });
    return;
  }
  const days = parseDays(req.query.days, 30);
  try {
    const [profileRaw, postsRaw] = await Promise.all([
      getProfileAnalytics(network, days),
      getPostsAnalytics(network, days),
    ]);
    const profile = normalizeProfile(network, profileRaw);
    const posts = normalizePosts(network, postsRaw);
    res.json({ network, profile, posts });
  } catch (error) {
    console.error(`Failed to fetch analytics for ${network}`, error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

app.get("/api/overview", async (req, res) => {
  const days = parseDays(req.query.days, 30);
  try {
    const snapshots = await Promise.all(
      SUPPORTED_NETWORKS.map(async (network) => {
        const [profileRaw, postsRaw] = await Promise.all([
          getProfileAnalytics(network, days),
          getPostsAnalytics(network, days),
        ]);
        return {
          network,
          profile: normalizeProfile(network, profileRaw),
          posts: normalizePosts(network, postsRaw),
        };
      })
    );

    const networksSummary = snapshots.reduce(
      (acc, item) => {
        acc[item.network] = item.profile.views;
        return acc;
      },
      {} as Record<Network, number>
    );

    const topPosts = snapshots
      .flatMap((item) => item.posts)
      .sort((a, b) => (b.engagementRate ?? 0) - (a.engagementRate ?? 0))
      .slice(0, 9);

    res.json({ networks: networksSummary, topPosts });
  } catch (error) {
    console.error("Failed to compute overview analytics", error);
    res.status(500).json({ error: "Failed to compute overview" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ API mock démarrée sur http://localhost:${PORT}`);
});
