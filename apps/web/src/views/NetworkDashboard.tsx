import React, { useState, useEffect, useMemo } from "react";
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
import { getDashboardData } from "./_dataMock";
import type { PeriodDays, MockPost } from "./_dataMock";
import { useAppState, getAccountsByNetwork } from "../store/useAppState";
import type { NetworkName } from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";
import { fetchNetworkSnapshot, searchYouTubeChannels } from "../lib/api";
import { usePreferences } from "../store/usePreferences";
import { useLanguage } from "../i18n";
import type { LocaleKey } from "../i18n";
import { Button } from "../components/button";

// Add new types for stronger typing
interface YouTubeChannel {
  id: string;
  link: string;
  thumbnailUrl: string;
  title: string;
  description: string;
}

interface SnapshotPost {
  id: string;
  title?: string;
  network?: NetworkName;
  thumbnail?: string;
  engagementRate?: number;
  views?: number;
  impressions?: number;
  publishedAt?: string;
  url?: string;
}

interface TrendPoint {
  date: string;
  views: number;
}

// Explicitly define NetworkSnapshot based on usage
export interface NetworkSnapshot {
  profile: {
    views: number;
    engagementRate: number;
  };
  topPosts: SnapshotPost[];
  posts: SnapshotPost[];
  trends: TrendPoint[];
  summaries: Record<string, any>; // Assuming summaries is a record of something
  networks: Record<NetworkName, number>; // Assuming networks is a record of NetworkName to number
}

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
  `nav.${network}` as LocaleKey;

const EMPTY_SNAPSHOT: NetworkSnapshot = {
  profile: {
    views: 0,
    engagementRate: 0,
  },
  topPosts: [],
  posts: [],
  trends: [],
  summaries: {}, // Initialize summaries as an empty object
  networks: { // Initialize networks with default values for each NetworkName
    instagram: 0,
    facebook: 0,
    tiktok: 0,
    youtube: 0,
  },
};

export function NetworkDashboard({ network }: { network: NetworkName }) {
  const { showDemoData } = usePreferences();
  const { t } = useLanguage();
  const [period, setPeriod] = useState<Period>("7d");
  const [data, setData] = useState<DashboardData | null>(() =>
    showDemoData ? getDashboardData(periodToDays["7d"], network) : null
  );
  const [snapshot, setSnapshot] = useState<NetworkSnapshot>(EMPTY_SNAPSHOT);
  const [loadingSnapshot, setLoadingSnapshot] = useState(false);
  const [snapshotError, setSnapshotError] = useState<"api" | null>(null);

  // State for YouTube Channel Search
  const [youtubeSearchQuery, setYoutubeSearchQuery] = useState<string>("");
  const [youtubeSearchResults, setYoutubeSearchResults] = useState<
    YouTubeChannel[]
  >([]);
  const [loadingYoutubeSearch, setLoadingYoutubeSearch] = useState(false);
  const [youtubeSearchError, setYoutubeSearchError] = useState<string | null>(
    null
  );

  const {
    state: { accounts },
  } = useAppState();
  const accountsOfNetwork = getAccountsByNetwork(accounts, network);

  useEffect(() => {
    if (!showDemoData) {
      setData(null);
      return;
    }
    const next = getDashboardData(periodToDays[period], network);
    setData(next);
  }, [period, network, showDemoData]);

  useEffect(() => {
    let cancelled = false;
    const range = periodToDays[period];
    const days = range === "all" ? 365 : range;
    setLoadingSnapshot(true);
    setSnapshotError(null);
    fetchNetworkSnapshot(network, days)
      .then((payload) => {
        if (!cancelled) {
          // Ensure payload conforms to NetworkSnapshot
          setSnapshot({
            profile: payload.profile || EMPTY_SNAPSHOT.profile,
            topPosts: payload.topPosts || EMPTY_SNAPSHOT.topPosts,
            posts: payload.posts || EMPTY_SNAPSHOT.posts,
            trends: payload.trends || EMPTY_SNAPSHOT.trends,
            summaries: payload.summaries || EMPTY_SNAPSHOT.summaries,
            networks: payload.networks || EMPTY_SNAPSHOT.networks,
          });
          setLoadingSnapshot(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.error(`Failed to load snapshot for ${network}`, err);
          setSnapshot(EMPTY_SNAPSHOT);
          setSnapshotError("api");
          setLoadingSnapshot(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [network, period]);

  const handleYoutubeSearch = async () => {
    if (!youtubeSearchQuery.trim()) return;
    setLoadingYoutubeSearch(true);
    setYoutubeSearchError(null);
    try {
      const { results } = await searchYouTubeChannels(youtubeSearchQuery);
      setYoutubeSearchResults(results as YouTubeChannel[]);
    } catch (error: unknown) {
      console.error("YouTube search failed:", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to search YouTube channels.";
      setYoutubeSearchError(message);
      setYoutubeSearchResults([]);
    } finally {
      setLoadingYoutubeSearch(false);
    }
  };

  const fmtDate = (isoDate: string) =>
    `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;

  const totalViews = useMemo(() => {
    if (snapshot?.profile?.views) {
      return snapshot.profile.views;
    }
    if (showDemoData && data) {
      return data.trendStack.reduce((s, d) => s + (d[network] as number), 0);
    }
    return 0;
  }, [snapshot, data, network, showDemoData]);

  type DashboardPost = MockPost & { url: string | undefined };

  const postsForDisplay: DashboardPost[] = useMemo<DashboardPost[]>(() => {
    if (snapshot?.topPosts?.length) {
      return snapshot.topPosts.map((p: SnapshotPost) => ({
        id: p.id,
        title: p.title || `${network.toUpperCase()} Post`,
        network: (p.network as NetworkName) ?? network,
        thumbnailUrl:
          p.thumbnail ||
          `https://picsum.photos/seed/${p.network}-${p.id}/300/200`,
        engagementRate: p.engagementRate ?? 0,
        views: p.views ?? p.impressions ?? 0,
        date: p.publishedAt ?? new Date().toISOString(),
        url: p.url,
      }));
    }
    if (snapshot?.posts?.length) {
      return snapshot.posts
        .map((p: SnapshotPost) => ({
          id: p.id,
          title: p.title || `${network.toUpperCase()} Post`,
          network: (p.network as NetworkName) ?? network,
          thumbnailUrl:
            p.thumbnail ||
            `https://picsum.photos/seed/${p.network}-${p.id}/300/200`,
          engagementRate: p.engagementRate ?? 0,
          views: p.views ?? p.impressions ?? 0,
          date: p.publishedAt ?? new Date().toISOString(),
          url: p.url,
        }))
        .sort((a, b) => (b.engagementRate || 0) - (a.engagementRate || 0))
        .slice(0, 6);
    }
    if (showDemoData && data) {
      return data.topPosts.map((post) => ({ ...post, url: "#" }));
    }
    return [];
  }, [snapshot, data, network, showDemoData]);

  const averageEngagement = useMemo(() => {
    if (snapshot?.profile?.engagementRate !== undefined) {
      return snapshot.profile.engagementRate;
    }
    if (snapshot?.posts?.length) {
      const sum = snapshot.posts.reduce(
        (acc: number, p: SnapshotPost) => acc + (p.engagementRate ?? 0),
        0
      );
      return sum / snapshot.posts.length;
    }
    if (showDemoData && data?.topPosts.length) {
      const sum = data.topPosts.reduce((acc, p) => acc + p.engagementRate, 0);
      return sum / data.topPosts.length;
    }
    return 0;
  }, [snapshot, data, showDemoData]);

  const chartRows = useMemo(() => {
    if (snapshot?.trends?.length) {
      return snapshot.trends.map((point: TrendPoint) => ({
        date: point.date,
        [network]: point.views,
      }));
    }
    if (showDemoData && data) {
      return data.trendStack;
    }
    return [] as Array<Record<string, number | string>>;
  }, [snapshot, network, data, showDemoData]);

  const chartIsEmpty = chartRows.length === 0;

  const kpis = [
    { label: t("dashboard.kpi.views"), value: totalViews.toLocaleString() },
    {
      label: t("dashboard.kpi.posts"),
      value: (snapshot?.posts?.length ?? data?.topPosts.length ?? 0).toString(),
    },
    {
      label: t("dashboard.kpi.accounts"),
      value: accountsOfNetwork.length.toString(),
    },
    {
      label: t("dashboard.kpi.engagement"),
      value: `${(averageEngagement * 100).toFixed(1)}%`,
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen overflow-auto">
      {!showDemoData && !snapshot && !loadingSnapshot && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-2xl">
          {t("network.demoDisabledNotice")}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SocialIcon name={network} size={28} />
          <h2 className="text-2xl font-bold capitalize">
            {t(toNavKey(network))}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="border rounded-lg px-3 py-1 text-sm bg-white md:hidden"
          >
            <option value="7d">{t("period.days", { count: 7 })}</option>
            <option value="30d">{t("period.days", { count: 30 })}</option>
            <option value="90d">{t("period.days", { count: 90 })}</option>
            <option value="365d">{t("period.year", { count: 1 })}</option>
            <option value="all">{t("period.allTime")}</option>
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

      {network === "youtube" && (
        <div className="bg-white border rounded-2xl p-6 shadow-sm">
          <h3 className="font-semibold mb-4 text-lg">
            {t("youtube.search.title")}
          </h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder={t("youtube.search.placeholder")}
              className="flex-1 border rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
              value={youtubeSearchQuery}
              onChange={(e) => setYoutubeSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleYoutubeSearch();
                }
              }}
            />
            <Button
              onClick={handleYoutubeSearch}
              disabled={loadingYoutubeSearch}
            >
              {loadingYoutubeSearch
                ? t("youtube.search.loading")
                : t("youtube.search.button")}
            </Button>
          </div>

          {youtubeSearchError && (
            <p className="text-red-500 mb-4">
              {t("youtube.search.error", { message: youtubeSearchError })}
            </p>
          )}

          {youtubeSearchResults.length > 0 && (
            <div className="space-y-4">
              {youtubeSearchResults.map((channel: YouTubeChannel) => (
                <a
                  key={channel.id}
                  href={channel.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <img
                    src={channel.thumbnailUrl}
                    alt={channel.title}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {channel.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {channel.description}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          )}
          {youtubeSearchQuery.trim() &&
            !loadingYoutubeSearch &&
            youtubeSearchResults.length === 0 &&
            !youtubeSearchError && (
              <p className="text-gray-500">
                {t("youtube.search.noResults", { query: youtubeSearchQuery })}
              </p>
            )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className="bg-white border rounded-2xl p-4 shadow-sm">
            <div className="text-xs text-gray-500">{k.label}</div>
            <div className="text-2xl font-semibold">{k.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          {t("dashboard.trend.title")} • {period.toUpperCase()}
        </h3>
        {loadingSnapshot ? (
          <div className="h-[360px] flex items-center justify-center text-gray-400">
            {t("loading")}
          </div>
        ) : chartIsEmpty ? (
          <div className="h-[360px] flex items-center justify-center text-gray-400 text-center px-4">
            {showDemoData
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
          {t("dashboard.trend.totalViews")}: {totalViews.toLocaleString()}
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-6 text-xl">
          {t("dashboard.topContent.title", { network: t(toNavKey(network)) })} —{" "}
          {t("period.allTime")} {period.toUpperCase()}
        </h3>
        {loadingSnapshot && (
          <p className="text-gray-500 text-sm">
            {t("loading")}
          </p>
        )}
        {snapshotError && (
          <p className="text-amber-600 text-sm mb-3">
            {t("network.error.snapshot", { network: t(toNavKey(network)) })}
          </p>
        )}
        {postsForDisplay.length === 0 ? (
          <p className="text-gray-500 text-sm">
            {t("dashboard.topContent.noDataPeriod")}
          </p>
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
                    {new Date(p.date).toLocaleDateString()} •{" "}
                    {p.views.toLocaleString()} {t("dashboard.kpi.views")}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white border rounded-2xl p-6 shadow-sm">
        <h3 className="font-semibold mb-4 text-lg">
          {t("sidebar.accountsFor", { network: t(toNavKey(network)) })}
        </h3>
        {accountsOfNetwork.length === 0 ? (
          <p className="text-gray-500 text-sm">{t("sidebar.noAccounts")}</p>
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
