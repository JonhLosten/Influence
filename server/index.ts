import express from "express";
import cors from "cors";

const app = express();
const PORT = 5174;

app.use(cors());
app.use(express.json());

/**
 * Simulation de données YouTube pour 2 chaînes :
 * @Laugh-Logic et @teamroyller2769
 */
function getMockAnalytics(days: number) {
  const today = new Date();
  const series: { date: string; laughLogic: number; teamRoyller: number; total: number }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(+today - i * 86400000);
    const label = d.toISOString().slice(0, 10);

    // On génère des valeurs pseudo-aléatoires mais cohérentes
    const laughLogic = Math.floor(800 + Math.sin(i / 2) * 400 + Math.random() * 300);
    const teamRoyller = Math.floor(600 + Math.cos(i / 3) * 300 + Math.random() * 200);
    const total = laughLogic + teamRoyller;

    series.push({ date: label, laughLogic, teamRoyller, total });
  }

  const summary = [
    {
      label: "Laugh-Logic",
      subscribers: 52000,
      views: series.reduce((s, d) => s + d.laughLogic, 0),
      engagement: 7.8,
    },
    {
      label: "Team Royller",
      subscribers: 23000,
      views: series.reduce((s, d) => s + d.teamRoyller, 0),
      engagement: 6.3,
    },
  ];

  const topVideos = [
    {
      id: "vid1",
      title: "Rire et logique #12",
      channel: "Laugh-Logic",
      engagementRate: 0.083,
      thumbnail: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg",
      url: "https://www.youtube.com/@Laugh-Logic",
    },
    {
      id: "vid2",
      title: "Course urbaine - Team Royller",
      channel: "Team Royller",
      engagementRate: 0.071,
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      url: "https://www.youtube.com/@teamroyller2769",
    },
  ];

  return { summary, trend: series, topVideos };
}

/**
 * GET /api/analytics?days=7
 */
app.get("/api/analytics", (req, res) => {
  const days = parseInt(req.query.days as string) || 7;
  const data = getMockAnalytics(days);
  res.json(data);
});

app.listen(PORT, () => {
  console.log(`✅ API mock démarrée sur http://localhost:${PORT}`);
});
