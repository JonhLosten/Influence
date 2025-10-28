import React from "react";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

import { t } from "../i18n";
import { useAppState } from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";
import { getDashboardData, MockPost } from "./_dataMock";
import { fetchOverviewAnalytics } from "../services/analytics";

export type Period = "7d" | "30d" | "90d" | "365d" | "all";

const periodToDays: Record<Period, number | "all"> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  "all": "all",
};

const periodLabels: Record<Period, { fr: string; en: string }> = {
  "7d": { fr: "7 jours", en: "7 days" },
  "30d": { fr: "30 jours", en: "30 days" },
  "90d": { fr: "90 jours", en: "90 days" },
  "365d": { fr: "1 an", en: "1 year" },
  all: { fr: "Depuis toujours", en: "All time" },
};

export const Dashboard: React.FC = () => {
  const {
    state: { lang },
  } = useAppState();
  const [period, setPeriod] = React.useState<Period>("7d");
  const [data, setData] = React.useState(() => getDashboardData(periodToDays["7d"]));
  const [loading, setLoading] = React.useState(false);
  const [overview, setOverview] = React.useState<Awaited<ReturnType<typeof fetchOverviewAnalytics>> | null>(null);
  const [overviewError, setOverviewError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const range = periodToDays[period];
    setLoading(true);
    const next = getDashboardData(range);
    setData(next);
    setLoading(false);
  }, [period]);

  React.useEffect(() => {
    let cancelled = false;
    const range = periodToDays[period];
    const days = range === "all" ? 365 : range;
    setOverviewError(null);
    fetchOverviewAnalytics(days)
      .then((payload) => {
        if (!cancelled) {
          setOverview(payload);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error("Failed to load overview analytics", err);
          setOverviewError(err instanceof Error ? err.message : String(err));
          setOverview(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [period]);

  const totalsPerNetwork = React.useMemo(() => {
    if (overview) {
      return {
        instagram: overview.networks.instagram ?? 0,
        facebook: overview.networks.facebook ?? 0,
        tiktok: overview.networks.tiktok ?? 0,
        youtube: overview.networks.youtube ?? 0,
      };
    }
    const fallback = { instagram: 0, facebook: 0, tiktok: 0, youtube: 0 };
    for (const d of data.trendStack) {
      fallback.instagram += d.instagram;
      fallback.facebook += d.facebook;
      fallback.tiktok += d.tiktok;
      fallback.youtube += d.youtube;
    }
    return fallback;
  }, [overview, data.trendStack]);

  const viewsLabel = lang === "fr" ? "vues" : "views";

  type DisplayPost = MockPost & { url?: string };

  const postsToDisplay = React.useMemo<DisplayPost[]>(() => {
    if (overview?.topPosts) {
      return overview.topPosts.map((post) => ({
        id: post.id,
        title: post.title || `Post ${post.id}`,
        network: post.network,
        thumbnailUrl:
          post.thumbnail ||
          `https://picsum.photos/seed/${post.network}-${post.id}/300/200`,
        engagementRate: post.engagementRate ?? 0,
        views: post.views ?? post.impressions ?? 0,
        date: post.publishedAt || new Date().toISOString(),
        url: post.url,
      }));
    }
    return data.topPosts.map((post) => ({ ...post, url: "#" }));
  }, [overview, data.topPosts]);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto" key={lang}>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {([
          ["instagram", totalsPerNetwork.instagram],
          ["youtube", totalsPerNetwork.youtube],
          ["tiktok", totalsPerNetwork.tiktok],
          ["facebook", totalsPerNetwork.facebook],
        ] as const).map(([network, total]) => (
          <div
            key={network}
            className="bg-white border rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SocialIcon name={network} size={24} />
                <div className="text-sm text-gray-600 capitalize">{network}</div>
              </div>
              <div className="text-sm text-gray-400">{period}</div>
            </div>
            <div className="text-3xl font-bold text-gray-800">
              {Math.round(total).toLocaleString()} <span className="text-base text-gray-500 font-normal">{viewsLabel}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-xl">{t("trendViews")}</h3>

          <div className="flex gap-2 items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              {(Object.keys(periodLabels) as Period[]).map((p) => (
                <option key={p} value={p}>
                  {periodLabels[p][lang]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-[350px] flex items-center justify-center text-gray-400">
            {t("loading")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.trendStack}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="youtube" fill="#ff0000" name="YouTube" stackId="a" />
              <Bar dataKey="instagram" fill="#e4405f" name="Instagram" stackId="a" />
              <Bar dataKey="tiktok" fill="#000000" name="TikTok" stackId="a" />
              <Bar dataKey="facebook" fill="#1877f2" name="Facebook" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">Top contenus ({t("topContent")})</h3>
        {overviewError && (
          <div className="mb-4 text-sm text-amber-600">
            {overviewError}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {postsToDisplay.map((p) => (
            <a
              key={p.id}
              href={p.url ?? "#"}
              className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-gray-50"
            >
              <img src={p.thumbnailUrl} alt={p.title} className="w-full h-48 object-cover" />
              <div className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-gray-500 text-sm uppercase">
                    <SocialIcon name={p.network} size={18} />
                    {p.network}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(p.engagementRate * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="font-medium text-gray-800 truncate">{p.title}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
