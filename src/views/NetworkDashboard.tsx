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
import { getDashboardData, PeriodDays, MockPost } from "./_dataMock";
import {
  useAppState,
  NetworkName,
  getAccountsByNetwork,
} from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";
import { fetchNetworkSnapshot } from "../services/analytics";
import { usePreferences } from "../store/usePreferences";
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

type DashboardData = ReturnType<typeof getDashboardData>;

const toNavKey = (network: NetworkName): LocaleKey =>
  (`nav.${network}` as unknown) as LocaleKey;

function formatAccountHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("@")) return trimmed;
  const slug = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug ? `@${slug}` : trimmed;
}

function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0m00s";
  }
  const total = Math.round(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}m${secs.toString().padStart(2, "0")}s`;
}

export function NetworkDashboard({ network }: { network: NetworkName }) {
  const { prefs } = usePreferences();
  const { t } = useLanguage();
  const [period, setPeriod] = React.useState<Period>("7d");
  const [data, setData] = React.useState<DashboardData | null>(() =>
    prefs.showDemoData ? getDashboardData(periodToDays["7d"], network) : null
  );
  const [snapshot, setSnapshot] = React.useState<NetworkSnapshot | null>(null);
  const [loadingSnapshot, setLoadingSnapshot] = React.useState(false);
  const [snapshotError, setSnapshotError] = React.useState<"api" | null>(null);

  const {
    state: { accounts },
  } = useAppState();
  const accountsOfNetwork = getAccountsByNetwork(accounts, network);

  const accountSignature = React.useMemo(
    () =>
      accountsOfNetwork
        .map((account) => `${account.network}:${account.displayName}`.toLowerCase())
        .join("|"),
    [accountsOfNetwork]
  );

  React.useEffect(() => {
    if (!prefs.showDemoData) {
      setData(null);
      return;
    }
    const next = getDashboardData(periodToDays[period], network);
    setData(next);
  }, [period, network, prefs.showDemoData]);

  React.useEffect(() => {
    let cancelled = false;
    const range = periodToDays[period];
    const days = range === "all" ? 365 : range;
    setLoadingSnapshot(true);
    setSnapshotError(null);
    const handles = accountsOfNetwork
      .map((account) => formatAccountHandle(account.displayName))
      .filter((value) => value.length > 0);
    fetchNetworkSnapshot(network, days, handles)
      .then((payload) => {
        if (!cancelled) {
          setSnapshot(payload);
          setLoadingSnapshot(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(`Failed to load snapshot for ${network}`, err);
          setSnapshot(null);
          setSnapshotError("api");
          setLoadingSnapshot(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [network, period, accountSignature]);

  const fmtDate = (isoDate: string) =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;

  const totalViews = React.useMemo(() => {
    if (snapshot?.profile.views) {
      return snapshot.profile.views;
    }
    if (prefs.showDemoData && data) {
      return data.trendStack.reduce((s, d) => s + (d[network] as number), 0);
    }
    return 0;
  }, [snapshot, data, network, prefs.showDemoData]);

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
    if (prefs.showDemoData && data) {
      return data.topPosts.map((post) => ({ ...post, url: "#" }));
    }
    return [];
  }, [snapshot, data, network, prefs.showDemoData]);

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
    if (prefs.showDemoData && data?.topPosts.length) {
      const sum = data.topPosts.reduce((acc, p) => acc + p.engagementRate, 0);
      return sum / data.topPosts.length;
    }
    return 0;
  }, [snapshot, data, prefs.showDemoData]);

  const chartRows = React.useMemo(() => {
    if (snapshot?.trends?.length) {
      return snapshot.trends.map((point) => ({
        date: point.date,
        [network]: point.views,
      }));
    }
    if (prefs.showDemoData && data) {
      return data.trendStack;
    }
    return [] as Array<Record<string, number | string>>;
  }, [snapshot, network, data, prefs.showDemoData]);

  const chartIsEmpty = chartRows.length === 0;

  const watchTimeHours = snapshot?.profile.watchTimeHours ?? 0;
  const avgDurationSeconds = snapshot?.profile.avgViewDurationSeconds ??
    (watchTimeHours && snapshot?.profile.views
      ? Math.round((watchTimeHours * 3600) / Math.max(snapshot.profile.views, 1))
      : 0);
  const retentionRate = snapshot?.profile.audienceRetentionRate ?? 0;
  const published = snapshot?.profile.videosPublished ?? snapshot?.posts?.length ?? 0;

  const kpis = [
    { label: t("network.kpi.totalViews"), value: totalViews.toLocaleString() },
    {
      label: t("network.kpi.watchTime"),
      value: watchTimeHours > 0 ? `${watchTimeHours.toFixed(1)} h` : "0 h",
    },
    {
      label: t("network.kpi.avgDuration"),
      value: formatDuration(avgDurationSeconds ?? 0),
    },
    {
      label: t("network.kpi.retention"),
      value: `${(retentionRate * 100).toFixed(1)}%`,
    },
    {
      label: t("network.kpi.published"),
      value: Math.round(published).toString(),
    },
    {
      label: t("network.kpi.accounts"),
      value: accountsOfNetwork.length.toString(),
    },
    {
      label: t("network.kpi.engagement"),
      value: `${(averageEngagement * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      {!prefs.showDemoData && !snapshot && !loadingSnapshot && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl">
          {t("network.demoDisabledNotice")}
        </div>
      )}
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

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          Tendances des vues • {period.toUpperCase()}
        </h3>
        {loadingSnapshot ? (
          <div className="h-[360px] flex items-center justify-center text-gray-400">
            {t("loading")}
          </div>
        ) : chartIsEmpty ? (
          <div className="h-[360px] flex items-center justify-center text-gray-400 text-center px-4">
            {prefs.showDemoData
              ? t("dashboard.topContent.noData")
              : t("network.demoDisabledNotice")}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={fmtDate} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar
                dataKey={network}
                name={t(toNavKey(network))}
                fill={colorMap[network]}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="mt-3 text-xs text-gray-500">
          Total vues sur la période : {totalViews.toLocaleString()}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">
          Top contenus ({network}) — période {period.toUpperCase()}
        </h3>
        {loadingSnapshot && (
          <p className="text-gray-500 text-sm">Chargement des contenus…</p>
        )}
        {snapshotError && (
          <p className="text-amber-600 text-sm mb-3">
            {t("network.error.snapshot", { network: t(toNavKey(network)) })}
          </p>
        )}
        {postsForDisplay.length === 0 ? (
          <p className="text-gray-500 text-sm">Aucun contenu sur cette période.</p>
        ) : (
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
                    {new Date(p.date).toLocaleDateString()} • {p.views.toLocaleString()} vues
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

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
