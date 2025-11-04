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
  type YoutubeAccountMetrics,
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
    fetchNetworkSnapshot(network, days)
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
  }, [network, period]);

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

  const youtubeAccountsWithMetrics = React.useMemo(
    () =>
      network === "youtube"
        ? accountsOfNetwork.filter(
            (
              account
            ): account is typeof account & { metrics: YoutubeAccountMetrics } =>
              Boolean(account.metrics && account.metrics.type === "youtube")
          )
        : [],
    [accountsOfNetwork, network]
  );

  const youtubeAggregates = React.useMemo(() => {
    if (youtubeAccountsWithMetrics.length === 0) {
      return null;
    }
    const totals = youtubeAccountsWithMetrics.reduce(
      (acc, account) => {
        const metrics = account.metrics!;
        const recentViews = metrics.recentVideos.reduce(
          (sum, video) => sum + video.views,
          0
        );
        const recentWatchSeconds = metrics.recentVideos.reduce(
          (sum, video) => sum + video.views * video.durationSeconds,
          0
        );
        acc.subscribers += metrics.subscribers;
        acc.totalViews += metrics.totalViews;
        acc.watchHours += metrics.estimatedWatchTimeHours;
        acc.videoCount += metrics.videoCount;
        acc.recentViews += recentViews;
        acc.recentWatchSeconds += recentWatchSeconds;
        return acc;
      },
      {
        subscribers: 0,
        totalViews: 0,
        watchHours: 0,
        videoCount: 0,
        recentViews: 0,
        recentWatchSeconds: 0,
      }
    );
    const averageViewDurationSeconds =
      totals.recentViews > 0
        ? totals.recentWatchSeconds / totals.recentViews
        : youtubeAccountsWithMetrics.reduce(
            (sum, account) => sum + account.metrics!.averageViewDurationSeconds,
            0
          ) / youtubeAccountsWithMetrics.length;
    return {
      ...totals,
      averageViewDurationSeconds,
    };
  }, [youtubeAccountsWithMetrics]);

  const formatDuration = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "—";
    if (seconds >= 3600) {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.round((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs.toString().padStart(2, "0")}s`;
  };

  const postsCount =
    snapshot?.posts?.length ??
    snapshot?.topPosts?.length ??
    data?.topPosts.length ??
    0;

  const kpis = React.useMemo(() => {
    const list = [
      { label: t("network.kpi.views"), value: totalViews.toLocaleString() },
      {
        label: t("network.kpi.posts"),
        value: postsCount.toString(),
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
    if (network === "youtube" && youtubeAggregates) {
      list.splice(1, 0, {
        label: t("network.youtube.kpiSubscribers"),
        value: youtubeAggregates.subscribers.toLocaleString(),
      });
      list.splice(2, 0, {
        label: t("network.youtube.kpiLifetimeViews"),
        value: youtubeAggregates.totalViews.toLocaleString(),
      });
      list.splice(3, 0, {
        label: t("network.youtube.kpiWatchTime"),
        value: `${youtubeAggregates.watchHours.toFixed(1)} h`,
      });
      list.splice(4, 0, {
        label: t("network.youtube.kpiAvgDuration"),
        value: formatDuration(youtubeAggregates.averageViewDurationSeconds),
      });
    }
    return list;
  }, [
    t,
    totalViews,
    postsCount,
    accountsOfNetwork.length,
    averageEngagement,
    network,
    youtubeAggregates,
  ]);

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
          {t("network.accounts.title", { network: t(toNavKey(network)) })}
        </h3>
        {accountsOfNetwork.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t("network.accounts.empty")}
          </p>
        ) : youtubeAccountsWithMetrics.length > 0 ? (
          <div className="space-y-5">
            {youtubeAccountsWithMetrics.map((account) => {
              const metrics = account.metrics as YoutubeAccountMetrics;
              const topVideos = metrics.recentVideos.slice(0, 3);
              return (
                <div
                  key={account.id}
                  className="border border-blue-100 bg-blue-50/40 rounded-2xl p-4 space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <img
                      src={metrics.avatarUrl}
                      alt={account.displayName}
                      className="w-12 h-12 rounded-full object-cover border border-white shadow"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">
                        {metrics.handle || metrics.title || account.displayName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {t("network.accounts.folder", { folder: account.folder })}
                      </div>
                    </div>
                    <a
                      href={`https://www.youtube.com/channel/${metrics.channelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      {t("network.youtube.openChannel")}
                    </a>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs md:text-sm text-gray-700">
                    <div>
                      <div className="uppercase text-[10px] text-gray-500">
                        {t("network.youtube.metrics.subscribers")}
                      </div>
                      <div className="font-medium">
                        {metrics.subscribers.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase text-[10px] text-gray-500">
                        {t("network.youtube.metrics.videos")}
                      </div>
                      <div className="font-medium">
                        {metrics.videoCount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="uppercase text-[10px] text-gray-500">
                        {t("network.youtube.metrics.watchTime")}
                      </div>
                      <div className="font-medium">
                        {metrics.estimatedWatchTimeHours.toFixed(1)} h
                      </div>
                    </div>
                    <div>
                      <div className="uppercase text-[10px] text-gray-500">
                        {t("network.youtube.metrics.avgViewDuration")}
                      </div>
                      <div className="font-medium">
                        {formatDuration(metrics.averageViewDurationSeconds)}
                      </div>
                    </div>
                  </div>

                  {topVideos.length > 0 && (
                    <div>
                      <div className="uppercase text-[10px] text-gray-500 tracking-wide">
                        {t("network.youtube.metrics.recentVideos")}
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-gray-600">
                        {topVideos.map((video) => (
                          <li
                            key={video.id}
                            className="flex items-center justify-between gap-3"
                          >
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="truncate hover:text-blue-600"
                            >
                              {video.title}
                            </a>
                            <span className="shrink-0 text-gray-500">
                              {video.views.toLocaleString()} {t("network.youtube.metrics.viewsShort")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
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
