import React from "react";
import {
  NetworkName,
  type AccountMetrics,
  type YoutubeAccountMetrics,
} from "../store/useAppState";
import {
  suggestAccounts,
  type Suggestion,
} from "../services/suggestAccounts";
import { useLanguage } from "../i18n";
import { fetchYoutubeChannelAnalytics } from "../services/youtube";

interface AddPayload {
  network: NetworkName;
  displayName: string;
  folder: string;
  metrics?: AccountMetrics;
}

export const AddAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (payload: AddPayload) => Promise<void> | void;
  existing?: Array<{ network: NetworkName; displayName: string }>;
  availableFolders?: string[];
}> = ({
  isOpen,
  onClose,
  onAdd,
  existing = [],
  availableFolders = ["Par défaut"],
}) => {
  const { t } = useLanguage();
  const [network, setNetwork] = React.useState<NetworkName>("instagram");
  const [query, setQuery] = React.useState("");
  const [folder, setFolder] = React.useState(availableFolders[0] || "Par défaut");
  const [results, setResults] = React.useState<Suggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setMessage("");
      setSaving(false);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await suggestAccounts(network, q);
        if (!cancelled) {
          setResults(res);
        }
      } catch (error) {
        console.error("suggestAccounts", error);
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, network, isOpen]);

  const isDuplicate = (name: string) => {
    const lower = name.trim().toLowerCase();
    return existing.some(
      (a) => a.network === network && a.displayName.trim().toLowerCase() === lower
    );
  };

  async function attachAccount(
    source: Pick<Suggestion, "displayName" | "handle" | "channelId"> & {
      queryFallback?: string;
    }
  ) {
    if (isDuplicate(source.displayName)) {
      setMessage(t("modal.account.duplicate"));
      return;
    }

    setSaving(true);
    setMessage(t("modal.account.fetching"));

    try {
      let metrics: AccountMetrics | undefined;
      let displayName = source.displayName;

      if (network === "youtube") {
        try {
          const analytics = await fetchYoutubeChannelAnalytics({
            channelId: source.channelId,
            handle: source.handle,
            query: source.queryFallback || source.displayName,
          });
          metrics = {
            type: "youtube",
            channelId: analytics.channelId,
            title: analytics.title,
            handle: analytics.handle,
            avatarUrl: analytics.avatarUrl,
            bannerUrl: analytics.bannerUrl,
            subscribers: analytics.subscribers,
            totalViews: analytics.totalViews,
            videoCount: analytics.videoCount,
            estimatedWatchTimeHours: analytics.estimatedWatchTimeHours,
            averageViewDurationSeconds: analytics.averageViewDurationSeconds,
            recentVideos: analytics.recentVideos,
            lastUpdated: analytics.lastUpdated,
          } satisfies YoutubeAccountMetrics;
          displayName =
            analytics.handle || analytics.title || source.handle || displayName;
        } catch (error) {
          console.error("youtube analytics", error);
          setMessage(t("modal.account.fetchError"));
          setSaving(false);
          return;
        }
      }

      await Promise.resolve(
        onAdd({ network, displayName, folder, metrics })
      );
      setMessage(t("modal.account.added"));
      setTimeout(() => {
        setMessage("");
        setSaving(false);
        onClose();
      }, 900);
    } catch (error) {
      console.error("add account", error);
      setMessage(t("modal.account.fetchError"));
      setSaving(false);
    }
  }

  function handleSelect(s: Suggestion) {
    void attachAccount({
      displayName: s.displayName,
      handle: s.handle,
      channelId: s.channelId,
      queryFallback: s.url,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = query.trim();
    if (!name) {
      setMessage(t("modal.account.missing"));
      return;
    }
    if (isDuplicate(name)) {
      setMessage(t("modal.account.duplicateExisting"));
      return;
    }
    void attachAccount({
      displayName: name,
      handle: name,
      queryFallback: name,
      channelId: undefined,
    });
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl p-6 w-[520px] shadow space-y-5"
      >
        <h2 className="text-lg font-semibold text-gray-800">
          {t("modal.account.title")}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-700">
            {t("modal.account.network")}
            <select
              value={network}
              onChange={(e) => setNetwork(e.target.value as NetworkName)}
              className="w-full border rounded-lg px-2 py-1 mt-1"
            >
              <option value="instagram">{t("nav.instagram")}</option>
              <option value="facebook">{t("nav.facebook")}</option>
              <option value="tiktok">{t("nav.tiktok")}</option>
              <option value="youtube">{t("nav.youtube")}</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            {t("modal.account.folder")}
            <select
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="w-full border rounded-lg px-2 py-1 mt-1"
            >
              {availableFolders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-1">
            {t("modal.account.search")}
          </label>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("modal.account.placeholder")}
            className="w-full border rounded-lg px-3 py-2"
            disabled={saving}
          />

          {loading && (
            <div className="text-xs text-gray-500 mt-2">
              {t("modal.account.loading")}
            </div>
          )}

          {!loading && results.length > 0 && (
            <ul className="mt-3 border rounded-lg overflow-hidden divide-y max-h-60 overflow-y-auto">
              {results.map((s, i) => (
                <li
                  key={i}
                  className="px-3 py-3 hover:bg-blue-50 transition cursor-pointer"
                  onClick={() => handleSelect(s)}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={s.avatar}
                      alt={s.displayName}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">
                        {s.displayName}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {s.handle} • {t("modal.account.followers", {
                          count: s.followers.toLocaleString(),
                        })}
                        {typeof s.videoCount === "number" && (
                          <>
                            {" • "}
                            {t("modal.account.videos", {
                              count: s.videoCount.toLocaleString(),
                            })}
                          </>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded shrink-0">
                      {t(("nav." + network) as any)}
                    </span>
                  </div>

                  {s.url && (
                    <div className="text-right mt-1">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-blue-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {t("modal.account.viewProfile")}
                      </a>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}

          {!loading && query.trim() && results.length === 0 && (
            <div className="text-xs text-gray-500 mt-2">
              {t("modal.account.empty")}
            </div>
          )}
        </div>

        {message && (
          <div className="text-center text-sm text-blue-600 whitespace-pre-line">
            {message}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="px-3 py-1 rounded-lg border hover:bg-gray-100"
            onClick={onClose}
          >
            {t("modal.cancel")}
          </button>
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={saving}
          >
            {t("modal.account.submit")}
          </button>
        </div>
      </form>
    </div>
  );
};
