import React from "react";
import {
  ComposedChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from "recharts";

import { useLanguage, LocaleKey } from "../i18n";
import { SocialIcon } from "../components/SocialIcon";
import { getDashboardData, MockPost } from "./_dataMock";
import { fetchOverviewAnalytics } from "../services/analytics";
import { NetworkName, useAppState } from "../store/useAppState";

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

const networkColors: Record<NetworkName, string> = {
  instagram: "#e4405f",
  facebook: "#1877f2",
  tiktok: "#000000",
  youtube: "#ff0000",
};

const toNavKey = (network: NetworkName): LocaleKey =>
  (`nav.${network}` as unknown) as LocaleKey;

export const Dashboard: React.FC = () => {
  const { lang, t } = useLanguage();
  const {
    state: { preferences },
  } = useAppState();
  const [period, setPeriod] = React.useState<Period>("7d");
  const [loading, setLoading] = React.useState(false);
  const [overview, setOverview] = React.useState<
    Awaited<ReturnType<typeof fetchOverviewAnalytics>> | null
  >(null);
  const [overviewError, setOverviewError] = React.useState<"api" | null>(null);
  const [selectedNetworks, setSelectedNetworks] = React.useState<NetworkName[]>(
    Object.keys(networkColors) as NetworkName[]
  );
  const demoEnabled = preferences.demoDataEnabled;
  const [topSort, setTopSort] = React.useState<"engagement" | "views">(
    "engagement"
  );
  const [exportNotice, setExportNotice] = React.useState<
    { status: "success" | "error"; message: string } | null
  >(null);

  const periodRange = periodToDays[period];

  const demoData = React.useMemo(() => {
    if (!demoEnabled) return null;
    return getDashboardData(periodRange);
  }, [demoEnabled, periodRange]);

  React.useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const range = periodRange;
    const days = range === "all" ? 365 : range;
    setLoading(true);
    setOverviewError(null);
    fetchOverviewAnalytics(days, controller.signal)
      .then((payload) => {
        if (!cancelled) {
          setOverview(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        if ((err as any)?.name === "AbortError") return;
        console.error("Failed to load overview analytics", err);
        setOverview(null);
        setOverviewError("api");
        setLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [periodRange]);

  const totalsPerNetwork = React.useMemo(() => {
    if (overview) {
      return {
        instagram: overview.networks.instagram ?? 0,
        facebook: overview.networks.facebook ?? 0,
        tiktok: overview.networks.tiktok ?? 0,
        youtube: overview.networks.youtube ?? 0,
      };
    }
    if (demoData) {
      return demoData.trendStack.reduce(
        (acc, day) => {
          acc.instagram += day.instagram;
          acc.facebook += day.facebook;
          acc.tiktok += day.tiktok;
          acc.youtube += day.youtube;
          return acc;
        },
        { instagram: 0, facebook: 0, tiktok: 0, youtube: 0 }
      );
    }
    return { instagram: 0, facebook: 0, tiktok: 0, youtube: 0 };
  }, [overview, demoData]);

  const viewsLabel = t("dashboard.viewsLabel");
  const overviewErrorMessage =
    overviewError === "api" ? t("dashboard.error.apiUnavailable") : null;
  const showDemoDisabledNotice =
    !demoEnabled && !overview && !demoData && !loading;

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
    if (demoData) {
      return demoData.topPosts.map((post) => ({ ...post, url: "#" }));
    }
    return [];
  }, [overview, demoData]);

  const availableNetworks = React.useMemo<NetworkName[]>(() => {
    if (demoData) {
      return demoData.networks as NetworkName[];
    }
    if (overview) {
      return Object.keys(overview.networks) as NetworkName[];
    }
    return Object.keys(networkColors) as NetworkName[];
  }, [demoData, overview]);

  React.useEffect(() => {
    setSelectedNetworks((current) => {
      const filtered = current.filter((network) =>
        availableNetworks.includes(network)
      );
      if (!filtered.length && availableNetworks.length) {
        return availableNetworks;
      }
      return filtered.length === current.length ? current : filtered;
    });
  }, [availableNetworks]);

  const activeNetworks = selectedNetworks.length
    ? selectedNetworks
    : availableNetworks;

  type TrendEntry = {
    date: string;
    total: number;
  } & Partial<Record<NetworkName, number>>;

  const chartData = React.useMemo<TrendEntry[]>(() => {
    if (demoData) {
      return demoData.trendStack.map((item) => ({
        date: item.date,
        instagram: item.instagram,
        facebook: item.facebook,
        tiktok: item.tiktok,
        youtube: item.youtube,
        total: item.total,
      }));
    }
    if (overview?.trends?.length) {
      return overview.trends.map((point) => ({
        date: point.date,
        total: point.views,
      }));
    }
    return [];
  }, [demoData, overview]);

  const movingWindow = React.useMemo(() => {
    switch (period) {
      case "7d":
        return 3;
      case "30d":
        return 5;
      case "90d":
        return 7;
      case "365d":
        return 14;
      default:
        return 21;
    }
  }, [period]);

  const chartWithAverage = React.useMemo(() => {
    return chartData.map((entry, index) => {
      const start = Math.max(0, index - movingWindow + 1);
      const slice = chartData.slice(start, index + 1);
      const avg =
        slice.reduce((sum, day) => sum + (day.total ?? 0), 0) /
        (slice.length || 1);
      return { ...entry, movingAverage: Number.isFinite(avg) ? avg : 0 };
    });
  }, [chartData, movingWindow]);

  const totalsForActiveNetworks = React.useMemo(() => {
    const networksToSum = activeNetworks.length
      ? activeNetworks
      : availableNetworks;
    if (overview) {
      return networksToSum.reduce((acc, network) => {
        acc[network] = overview.networks[network] ?? 0;
        return acc;
      }, {} as Record<NetworkName, number>);
    }
    if (demoData) {
      return networksToSum.reduce((acc, network) => {
        const sum = demoData.trendStack.reduce(
          (total, day) => total + ((day[network] as number) ?? 0),
          0
        );
        acc[network] = sum;
        return acc;
      }, {} as Record<NetworkName, number>);
    }
    return networksToSum.reduce((acc, network) => {
      acc[network] = 0;
      return acc;
    }, {} as Record<NetworkName, number>);
  }, [activeNetworks, availableNetworks, overview, demoData]);

  const filteredPosts = React.useMemo(() => {
    if (!selectedNetworks.length) return postsToDisplay;
    const set = new Set(selectedNetworks);
    return postsToDisplay.filter((post) => set.has(post.network));
  }, [postsToDisplay, selectedNetworks]);

  const postsToRender = React.useMemo(() => {
    const sorted = [...filteredPosts];
    sorted.sort((a, b) => {
      if (topSort === "views") {
        return (b.views ?? 0) - (a.views ?? 0);
      }
      return (b.engagementRate ?? 0) - (a.engagementRate ?? 0);
    });
    return sorted;
  }, [filteredPosts, topSort]);

  const postsEngagementAverage = React.useMemo(() => {
    if (!postsToRender.length) return 0;
    const sum = postsToRender.reduce(
      (acc, post) => acc + (post.engagementRate ?? 0),
      0
    );
    return sum / postsToRender.length;
  }, [postsToRender]);

  const bestDay = React.useMemo(() => {
    if (!chartData.length) return null;
    return chartData.reduce((best, day) =>
      (day.total ?? 0) > (best.total ?? 0) ? day : best
    );
  }, [chartData]);

  const growthRate = React.useMemo(() => {
    if (chartData.length < 2) return 0;
    const first = chartData[0].total ?? 0;
    const last = chartData[chartData.length - 1].total ?? 0;
    if (first === 0) {
      return last === 0 ? 0 : 100;
    }
    return ((last - first) / first) * 100;
  }, [chartData]);

  const totalActiveViews = React.useMemo(() => {
    const networksToSum = activeNetworks.length
      ? activeNetworks
      : availableNetworks;
    if (overview) {
      return networksToSum.reduce(
        (acc, network) => acc + (overview.networks[network] ?? 0),
        0
      );
    }
    if (demoData) {
      return networksToSum.reduce(
        (acc, network) => acc + (totalsForActiveNetworks[network] ?? 0),
        0
      );
    }
    return chartData.reduce((acc, day) => acc + (day.total ?? 0), 0);
  }, [
    activeNetworks,
    availableNetworks,
    overview,
    demoData,
    totalsForActiveNetworks,
    chartData,
  ]);

  const dominantNetwork = React.useMemo(() => {
    if (!activeNetworks.length) return null;
    return activeNetworks.reduce<NetworkName | null>((currentBest, network) => {
      const value = totalsForActiveNetworks[network] ?? 0;
      if (value <= 0) {
        return currentBest;
      }
      if (!currentBest) return network;
      const currentValue = totalsForActiveNetworks[currentBest] ?? 0;
      return value > currentValue ? network : currentBest;
    }, null);
  }, [activeNetworks, totalsForActiveNetworks]);

  const insights = React.useMemo(() => {
    const list: string[] = [];
    if (dominantNetwork && totalActiveViews > 0) {
      const share =
        ((totalsForActiveNetworks[dominantNetwork] ?? 0) / totalActiveViews) *
        100;
      list.push(
        t("dashboard.insights.dominant", {
          network: t(toNavKey(dominantNetwork)),
          share: share.toFixed(1),
        })
      );
    }
    if (bestDay) {
      const formatted = new Date(bestDay.date).toLocaleDateString(lang);
      list.push(
        t("dashboard.insights.bestDay", {
          date: formatted,
          views: Math.round(bestDay.total ?? 0).toLocaleString(),
        })
      );
    }
    const growthAbs = Math.abs(growthRate);
    if (growthAbs > 0) {
      const key: LocaleKey = (growthRate >= 0
        ? "dashboard.insights.growthPositive"
        : "dashboard.insights.growthNegative") as LocaleKey;
      list.push(
        t(key, {
          value: growthRate.toFixed(1),
        })
      );
    }
    list.push(
      t("dashboard.insights.engagement", {
        value: (postsEngagementAverage * 100).toFixed(1),
      })
    );
    return list;
  }, [
    bestDay,
    dominantNetwork,
    growthRate,
    lang,
    postsEngagementAverage,
    t,
    totalActiveViews,
    totalsForActiveNetworks,
  ]);

  React.useEffect(() => {
    if (!exportNotice) return;
    if (typeof window === "undefined") return;
    const timer = window.setTimeout(() => setExportNotice(null), 4000);
    return () => window.clearTimeout(timer);
  }, [exportNotice]);

  const handleToggleNetwork = (network: NetworkName) => {
    setSelectedNetworks((current) => {
      if (current.includes(network)) {
        return current.filter((n) => n !== network);
      }
      return [...current, network];
    });
  };

  const handleResetNetworks = () => {
    setSelectedNetworks(availableNetworks);
  };

  const handleClearNetworks = () => {
    setSelectedNetworks([]);
  };

  const handleExportCsv = () => {
    try {
      if (typeof window === "undefined") return;
      if (!postsToRender.length) {
        setExportNotice({
          status: "error",
          message: t("dashboard.exportCSV.empty"),
        });
        return;
      }
      const header = ["id", "title", "network", "views", "engagement", "date", "url"];
      const escape = (value: string | number | undefined) => {
        const str = value === undefined ? "" : String(value);
        if (str.includes("\"") || str.includes(",") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };
      const csv = [
        header.join(","),
        ...postsToRender.map((post) =>
          [
            escape(post.id),
            escape(post.title),
            escape(post.network),
            escape(post.views?.toString() ?? ""),
            escape(((post.engagementRate ?? 0) * 100).toFixed(2)),
            escape(new Date(post.date).toISOString()),
            escape(post.url ?? ""),
          ].join(",")
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `influenceops-top-posts-${period}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice({
        status: "success",
        message: t("dashboard.exportCSV.success", {
          count: postsToRender.length,
        }),
      });
    } catch (err) {
      console.error("Failed to export posts", err);
      setExportNotice({
        status: "error",
        message: t("dashboard.exportCSV.error"),
      });
    }
  };

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto" key={lang}>
      {showDemoDisabledNotice && (
        <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-2xl">
          {t("dashboard.error.demoDisabled")}
        </div>
      )}

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
                {Math.round(total).toLocaleString()} {" "}
                <span className="text-base text-gray-500 font-normal">
                  {viewsLabel}
                </span>
              </div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-600">
              {t("dashboard.networkFilterLabel")}
            </div>
            <p className="text-xs text-gray-500">
              {t("dashboard.networkFilterHint")}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleResetNetworks}
              className="px-3 py-1.5 text-sm border rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
            >
              {t("dashboard.networkFilterAll")}
            </button>
            <button
              onClick={handleClearNetworks}
              className="px-3 py-1.5 text-sm border rounded-full bg-white text-gray-600 hover:bg-gray-100"
            >
              {t("dashboard.networkFilterClear")}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {availableNetworks.map((network) => {
            const active = selectedNetworks.includes(network);
            return (
              <button
                key={network}
                onClick={() => handleToggleNetwork(network)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm border rounded-full capitalize transition ${
                  active
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white hover:bg-blue-50 border-gray-200 text-gray-700"
                }`}
                aria-pressed={active}
              >
                <SocialIcon name={network} size={16} />
                {t(toNavKey(network))}
              </button>
            );
          })}
        </div>
        {selectedNetworks.length === 0 && (
          <div className="text-xs text-amber-600">
            {t("dashboard.noNetworkSelected")}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="font-semibold text-xl">
              {t("dashboard.insights.title")}
            </h3>
            <p className="text-xs text-gray-500">
              {t("dashboard.insights.subtitle")}
            </p>
          </div>
          <div className="flex flex-col gap-2 md:items-end">
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-blue-600 text-white hover:bg-blue-700 shadow"
            >
              ⬇ {t("dashboard.exportCSV")}
            </button>
            <span className="text-[11px] text-gray-500">
              {t("dashboard.exportCSV.hint")}
            </span>
            {exportNotice && (
              <span
                className={`text-xs ${
                  exportNotice.status === "success"
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {exportNotice.message}
              </span>
            )}
          </div>
        </div>
        <ul className="space-y-2">
          {insights.map((insight, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
              <span className="mt-1 text-blue-500">•</span>
              <span>{insight}</span>
            </li>
          ))}
        </ul>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {Object.entries(overview.summaries).map(([networkKey, summary]) => {
            const directionLabel =
              summary.direction === "up"
                ? t("dashboard.direction.up")
                : t("dashboard.direction.down");
            const deltaDisplay = `${summary.direction === "down" ? "-" : "+"}${summary.delta.toFixed(1)}%`;
            const description = summary.description[lang as "fr" | "en"] ?? summary.description.fr;
            return (
              <div key={networkKey} className="bg-white border rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <SocialIcon name={networkKey} size={18} />
                    {directionLabel}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      summary.direction === "down" ? "text-rose-500" : "text-emerald-600"
                    }`}
                  >
                    {deltaDisplay}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-snug">{description}</p>
              </div>
            );
          })}
        </div>
      )}

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
            <ComposedChart data={chartWithAverage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              {demoData &&
                activeNetworks.map((network) => (
                  <Bar
                    key={network}
                    dataKey={network}
                    fill={networkColors[network]}
                    name={t(toNavKey(network))}
                    stackId="views"
                  />
                ))}
              {!demoData && (
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  name={t("dashboard.viewsLabel")}
                />
              )}
              <Line
                type="monotone"
                dataKey="movingAverage"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name={t("dashboard.trendAverage")}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">
          {t("dashboard.topContentHeading")}
        </h3>
        {overviewErrorMessage && (
          <div className="mb-4 text-sm text-amber-600">
            {overviewErrorMessage}
          </div>
        )}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="text-xs text-gray-500">
            {t("dashboard.topContent.filterNotice", {
              count: postsToRender.length,
            })}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500" htmlFor="top-sort">
              {t("dashboard.sortBy")}
            </label>
            <select
              id="top-sort"
              value={topSort}
              onChange={(event) =>
                setTopSort(event.target.value as "engagement" | "views")
              }
              className="border rounded-lg px-3 py-1 text-sm"
            >
              <option value="engagement">{t("dashboard.sort.engagement")}</option>
              <option value="views">{t("dashboard.sort.views")}</option>
            </select>
          </div>
        </div>
        {postsToRender.length === 0 ? (
          <p className="text-sm text-gray-500">
            {postsToDisplay.length === 0
              ? t("dashboard.error.noPosts")
              : selectedNetworks.length === 0
              ? t("dashboard.topContent.noData")
              : t("dashboard.topContent.emptyFiltered")}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {postsToRender.map((p) => (
              <a
                key={p.id}
                href={p.url ?? "#"}
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
        )}
      </div>
    </div>
  );
};
