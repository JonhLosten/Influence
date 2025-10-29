import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { getDashboardData, PeriodDays, MockPost } from "./_dataMock";
import {
  useAppState,
  NetworkName,
  getAccountsByNetwork,
} from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";
import { fetchNetworkSnapshot } from "../services/analytics";
import { useLanguage, LocaleKey } from "../i18n";

export type NetworkSnapshot = Awaited<ReturnType<typeof fetchNetworkSnapshot>>;

type Period = "7d" | "30d" | "90d" | "365d" | "all";
const periodToDays: Record<Period, PeriodDays> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  "365d": 365,
  all: "all",
};

const colorMap: Record<NetworkName, string> = {
  instagram: "#e4405f",
  facebook: "#1877f2",
  tiktok: "#000000",
  youtube: "#ff0000",
};

const toNavKey = (network: NetworkName): LocaleKey =>
  (`nav.${network}` as unknown) as LocaleKey;

export function NetworkDashboard({ network }: { network: NetworkName }) {
  const { t, lang } = useLanguage();
  const [period, setPeriod] = React.useState<Period>("7d");
  const [snapshot, setSnapshot] = React.useState<NetworkSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = React.useState(false);
  const [snapshotError, setSnapshotError] = React.useState<"api" | null>(null);

  const {
    state: { accounts, preferences },
  } = useAppState();
  const demoEnabled = preferences.demoDataEnabled;
  const accountsOfNetwork = getAccountsByNetwork(accounts, network);

  const periodRange = periodToDays[period];

  const demoData = React.useMemo(() => {
    if (!demoEnabled) return null;
    return getDashboardData(periodRange, network);
  }, [demoEnabled, periodRange, network]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const range = periodRange;
    const days = range === "all" ? 365 : range;
    setLoadingSnapshot(true);
    setSnapshotError(null);
    fetchNetworkSnapshot(network, days, controller.signal)
      .then((payload) => {
        if (!cancelled) {
          setSnapshot(payload);
          setLoadingSnapshot(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as any)?.name === "AbortError") return;
        console.error(`Failed to load snapshot for ${network}`, err);
        setSnapshot(null);
        setSnapshotError("api");
        setLoadingSnapshot(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [network, periodRange]);

  const fmtDate = (isoDate: string) =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;

  const totalViews = React.useMemo(() => {
    if (snapshot?.profile.views) {
      return snapshot.profile.views;
    }
    if (demoData) {
      return demoData.trendStack.reduce(
        (s, d) => s + ((d[network] as number) ?? 0),
        0
      );
    }
    return 0;
  }, [snapshot, demoData, network]);

  type DashboardPost = MockPost & { url?: string };

  const postsForDisplay = React.useMemo<DashboardPost[]>(() => {
    if (snapshot?.topPosts?.length) {
      return snapshot.topPosts.map((p) => ({
        id: p.id,
        title: p.title || `${network.toUpperCase()} Post`,
        network: (p.network as NetworkName) ?? network,
        thumbnailUrl:
          p.thumbnail || `https://picsum.photos/seed/${p.network}-${p.id}/300/200`,
        engagementRate: p.engagementRate ?? 0,
        views: p.views ?? p.impressions ?? 0,
        date: p.publishedAt ?? new Date().toISOString(),
        url: p.url,
      }));
    }
    if (snapshot?.posts?.length) {
      return snapshot.posts
        .map((p) => ({
          id: p.id,
          title: p.title || `${network.toUpperCase()} Post`,
          network: (p.network as NetworkName) ?? network,
          thumbnailUrl:
            p.thumbnail || `https://picsum.photos/seed/${p.network}-${p.id}/300/200`,
          engagementRate: p.engagementRate ?? 0,
          views: p.views ?? p.impressions ?? 0,
          date: p.publishedAt ?? new Date().toISOString(),
          url: p.url,
        }))
        .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
        .slice(0, 6);
    }
    if (demoData) {
      return demoData.topPosts.map((post) => ({ ...post, url: "#" }));
    }
    return [];
  }, [snapshot, demoData, network]);

  const averageEngagement = React.useMemo(() => {
    if (snapshot?.profile.engagementRate !== undefined) {
      return snapshot.profile.engagementRate;
    }
    if (snapshot?.posts?.length) {
      const sum = snapshot.posts.reduce(
        (acc, p) => acc + (p.engagementRate ?? 0),
        0
      );
      return sum / snapshot.posts.length;
    }
    if (demoData?.topPosts.length) {
      const sum = demoData.topPosts.reduce((acc, p) => acc + p.engagementRate, 0);
      return sum / demoData.topPosts.length;
    }
    return 0;
  }, [snapshot, demoData]);

  const kpis = [
    { label: "Vues", value: totalViews.toLocaleString() },
    {
      label: "Posts (période)",
      value: (
        snapshot?.posts?.length ?? snapshot?.topPosts?.length ?? demoData?.topPosts.length ?? 0
      ).toString(),
    },
    {
      label: "Comptes rattachés",
      value: accountsOfNetwork.length.toString(),
    },
    {
      label: "Engagement moyen",
      value: `${(averageEngagement * 100).toFixed(1)}%`,
    },
  ];

  const hasLiveTrends = Boolean(snapshot?.trends?.length);

  const chartPoints = React.useMemo(() => {
    if (snapshot?.trends?.length) {
      return snapshot.trends.map((point) => ({
        date: point.date,
        views: point.views,
      }));
    }
    if (demoData) {
      return demoData.trendStack.map((entry) => ({
        date: entry.date,
        views: (entry[network] as number) ?? 0,
      }));
    }
    return [] as Array<{ date: string; views: number }>;
  }, [snapshot, demoData, network]);

  const networkLabel = t(toNavKey(network));
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const viewsText = lang === "fr" ? "vues" : "views";
  const snapshotErrorMessage = snapshotError
    ? t("network.snapshot.error", { network: networkLabel })
    : null;

  const chartEmpty =
    !loadingSnapshot && !snapshotErrorMessage && chartPoints.length === 0;

  const chartNotice = snapshotErrorMessage
    ? snapshotErrorMessage
    : chartEmpty
    ? demoEnabled
      ? t("network.snapshot.empty")
      : t("network.snapshot.demoHint")
    : null;

  const postsEmpty = !loadingSnapshot && postsForDisplay.length === 0;

  const postsNotice = snapshotErrorMessage
    ? snapshotErrorMessage
    : postsEmpty
    ? demoEnabled
      ? t("network.snapshot.empty")
      : t("network.snapshot.demoHint")
    : null;

  const showDemoDisabledNotice = !demoEnabled && !snapshot && !loadingSnapshot;

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      {showDemoDisabledNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl">
          {t("network.snapshot.demoHint")}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SocialIcon name={network} size={28} />
          <h2 className="text-2xl font-bold capitalize">{networkLabel}</h2>
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

          <div className="hidden md:flex gap-2">
            {(["7d", "30d", "90d", "365d", "all"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg text-sm border ${
                  period === p
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

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-3">
        <h3 className="font-semibold text-lg">
          Tendances des vues • {period.toUpperCase()}
        </h3>
        {loadingSnapshot ? (
          <div className="h-64 flex items-center justify-center text-gray-400">
            {t("loading")}
          </div>
        ) : chartPoints.length > 0 ? (
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={chartPoints}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtDate} />
              <YAxis />
              <Tooltip />
              <Legend />
              {hasLiveTrends ? (
                <Line
                  type="monotone"
                  dataKey="views"
                  name={networkLabel}
                  stroke={colorMap[network]}
                  strokeWidth={2}
                  dot={false}
                />
              ) : (
                <Bar
                  dataKey="views"
                  name={networkLabel}
                  fill={colorMap[network]}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-sm text-gray-500">
            {chartNotice}
          </div>
        )}
        {chartPoints.length > 0 && (
          <div className="text-xs text-gray-500">
            Total vues sur la période : {totalViews.toLocaleString()}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">
          Top contenus ({networkLabel}) — période {period.toUpperCase()}
        </h3>
        {loadingSnapshot && (
          <p className="text-gray-500 text-sm">Chargement des contenus…</p>
        )}
        {!loadingSnapshot && postsForDisplay.length === 0 ? (
          <p className="text-amber-600 text-sm">
            {postsNotice ?? t("network.snapshot.empty")}
          </p>
        ) : (
          <>
            {!loadingSnapshot && postsNotice && (
              <p className="text-amber-600 text-sm mb-3">{postsNotice}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {postsForDisplay.map((p) => (
                <a
                  key={p.id}
                  href={p.url || "#"}
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
                        {networkLabel}
                      </div>
                      <div className="text-sm text-gray-500">
                        {(p.engagementRate * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div className="font-medium text-gray-800 truncate">
                      {p.title}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(p.date).toLocaleDateString(locale)} • {p.views.toLocaleString()} {viewsText}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          Comptes ({networkLabel}) rattachés
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
