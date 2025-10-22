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
import { getDashboardData } from "./_dataMock";

type Period = "7d" | "30d" | "90d" | "365d" | "all";

const periodToDays: Record<Period, number | "all"> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  "all": "all",
};

export const Dashboard: React.FC = () => {
  const { lang } = useAppState();
  const [period, setPeriod] = React.useState<Period>("7d");
  const [data, setData] = React.useState(() => getDashboardData(periodToDays["7d"]));
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const range = periodToDays[period];
    setLoading(true);
    const next = getDashboardData(range);
    setData(next);
    setLoading(false);
  }, [period]);

  // Agrégation totaux par réseau
  const totalsPerNetwork = React.useMemo(() => {
    const base = { instagram: 0, facebook: 0, tiktok: 0, youtube: 0 };
    for (const d of data.trendStack) {
      base.instagram += d.instagram;
      base.facebook += d.facebook;
      base.tiktok += d.tiktok;
      base.youtube += d.youtube;
    }
    return base;
  }, [data.trendStack]);

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      {/* ---- Statistiques principales ---- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {(
          [
            ["instagram", totalsPerNetwork.instagram],
            ["youtube", totalsPerNetwork.youtube],
            ["tiktok", totalsPerNetwork.tiktok],
            ["facebook", totalsPerNetwork.facebook],
          ] as const
        ).map(([network, total]) => (
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
              {total.toLocaleString()}{" "}
              <span className="text-base text-gray-500 font-normal">vues</span>
            </div>
          </div>
        ))}
      </div>

      {/* ---- Graphique ---- */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-xl">{t("trendViews")}</h3>

          <div className="flex gap-2 items-center">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="7d">7 jours</option>
              <option value="30d">30 jours</option>
              <option value="90d">90 jours</option>
              <option value="365d">1 an</option>
              <option value="all">Depuis toujours</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="h-[350px] flex items-center justify-center text-gray-400">
            Chargement des statistiques...
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

      {/* ---- Top contenus dynamiques ---- */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">Top contenus ({t("topContent")})</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {data.topPosts.map((p) => (
            <a
              key={p.id}
              href="#"
              className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-gray-50"
            >
              <img
                src={p.thumbnailUrl}
                alt={p.title}
                className="w-full h-48 object-cover"
              />
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
