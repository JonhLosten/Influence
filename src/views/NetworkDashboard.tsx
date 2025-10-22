import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import { getDashboardData, PeriodDays } from "./_dataMock";
import {
  useAppState,
  NetworkName,
  getAccountsByNetwork,
} from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";

/** Périodes disponibles côté UI */
type Period = "7d" | "30d" | "90d" | "365d" | "all";
/** Map UI -> nombre de jours pour le mock */
const periodToDays: Record<Period, PeriodDays> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  all: "all",
};

/** Couleurs par réseau (cohérentes avec le Dashboard global) */
const colorMap: Record<NetworkName, string> = {
  instagram: "#e4405f",
  facebook: "#1877f2",
  tiktok: "#000000",
  youtube: "#ff0000",
};

export function NetworkDashboard({ network }: { network: NetworkName }) {
  /** période active */
  const [period, setPeriod] = React.useState<Period>("7d");
  /** données agrégées pour CE réseau (mock filtré côté _dataMock) */
  const [data, setData] = React.useState(() =>
    getDashboardData(periodToDays["7d"], network)
  );

  /** accès aux comptes pour lister ceux du réseau */
  const {
    state: { accounts },
  } = useAppState();
  const accountsOfNetwork = getAccountsByNetwork(accounts, network);

  /** recharge la série et le top quand la période change */
  React.useEffect(() => {
    const next = getDashboardData(periodToDays[period], network);
    setData(next);
  }, [period, network]);

  /** format court pour l’axe des dates */
  const fmtDate = (isoDate: string) =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;

  /** totaux de vues pour ce réseau sur la période */
  const totalViews = React.useMemo(
    () => data.trendStack.reduce((s, d) => s + (d[network] as number), 0),
    [data.trendStack, network]
  );

  /** KPI simulés (remplace facilement par de vraies métriques) */
  const kpis = [
    { label: "Vues", value: totalViews.toLocaleString() },
    {
      label: "Posts (période)",
      value: data.topPosts.length.toString(),
    },
    {
      label: "Comptes rattachés",
      value: accountsOfNetwork.length.toString(),
    },
    {
      label: "Engagement moyen",
      value: `${(6 + Math.random() * 4).toFixed(1)}%`,
    },
  ];

  /** top contenus (déjà filtrés par réseau et période dans _dataMock) */
  const topPosts = data.topPosts;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      {/* ======= En-tête + sélecteur d’horizon ======= */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SocialIcon name={network} size={28} />
          <h2 className="text-2xl font-bold capitalize">{network}</h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="border rounded-lg px-3 py-1 text-sm bg-white"
          >
            <option value="7d">7 jours</option>
            <option value="30d">30 jours</option>
            <option value="90d">90 jours</option>
            <option value="365d">1 an</option>
            <option value="all">Depuis toujours</option>
          </select>

          {/* “pills” rapides (optionnel) */}
          <div className="hidden md:flex gap-2">
            {(["7d", "30d", "90d", "365d", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm border ${period === p
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50"
                  }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ======= KPI ======= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div
            key={k.label}
            className="bg-white border rounded-2xl p-4 shadow-sm"
          >
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="text-2xl font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      {/* ======= Graphique barres (vues de CE réseau) ======= */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          Tendances des vues • {period.toUpperCase()}
        </h3>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={data.trendStack}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={fmtDate} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar
              dataKey={network}
              name={network}
              fill={colorMap[network]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-3 text-xs text-gray-500">
          Total vues sur la période : {totalViews.toLocaleString()}
        </div>
      </div>

      {/* ======= Top contenus de la plateforme ======= */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">
          Top contenus ({network}) — période {period.toUpperCase()}
        </h3>
        {topPosts.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun contenu sur cette période.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {topPosts.map((p) => (
              <a
                key={p.id}
                href="#"
                className="border rounded-xl overflow-hidden hover:shadow-lg transition bg-gray-50"
              >
                <img
                  src={p.thumbnailUrl}
                  alt={p.title}
                  className="w-full h-48 object-cover"
                  loading="lazy"
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
                  <div className="font-medium text-gray-800 truncate">
                    {p.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(p.date).toLocaleDateString()} •{" "}
                    {p.views.toLocaleString()} vues
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* ======= Comptes rattachés à ce réseau ======= */}
      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          Comptes ({network}) rattachés
        </h3>
        {accountsOfNetwork.length === 0 ? (
          <p className="text-gray-500 text-sm">
            Aucun compte ajouté pour ce réseau.
          </p>
        ) : (
          <ul className="divide-y">
            {accountsOfNetwork.map((a) => (
              <li key={a.id} className="py-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SocialIcon name={a.network} size={18} />
                  <span className="font-medium">{a.displayName}</span>
                </div>
                <span className="text-xs text-gray-500">{a.folder}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
