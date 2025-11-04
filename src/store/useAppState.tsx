import React, { createContext, useContext, useMemo, useState } from "react";

export type NetworkName = "instagram" | "facebook" | "tiktok" | "youtube";

export interface VideoPerformance {
  id: string;
  title: string;
  publishedAt: string;
  views: number;
  likeCount: number;
  commentCount: number;
  durationSeconds: number;
  url: string;
  thumbnailUrl: string;
}

export interface YoutubeAccountMetrics {
  type: "youtube";
  channelId: string;
  title: string;
  handle?: string;
  avatarUrl: string;
  bannerUrl?: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  estimatedWatchTimeHours: number;
  averageViewDurationSeconds: number;
  recentVideos: VideoPerformance[];
  lastUpdated: string;
}

export type AccountMetrics = YoutubeAccountMetrics;

export interface Account {
  id: string;
  network: NetworkName;
  displayName: string; // ex: "@laugh-logic" ou "Laugh Logic"
  folder: string; // nom du dossier
  metrics?: AccountMetrics;
}

interface AppState {
  networkOrder: NetworkName[];
  accounts: Account[];
  folders: string[]; // <— ajouté
  activeFolder?: string;
}

interface AppActions {
  reorderNetworks: (from: number, to: number) => void;
  addAccount: (acc: Omit<Account, "id">) => Account;
  removeAccount: (id: string) => void;
  addFolder: (name: string) => void;
  removeFolder: (name: string) => void;
  setActiveFolder: (folder?: string) => void;
  setAccountMetrics: (id: string, metrics: AccountMetrics) => void;
}

interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}

function createId() {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${time}-${rand}`;
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(() => ({
    networkOrder: ["instagram", "facebook", "tiktok", "youtube"],
    accounts: [],
    folders: ["Par défaut"], // <— un dossier par défaut
    activeFolder: undefined,
  }));

  const reorderNetworks = (from: number, to: number) => {
    setState((s) => {
      const copy = [...s.networkOrder];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return { ...s, networkOrder: copy };
    });
  };

  const addAccount = (acc: Omit<Account, "id">) => {
    const created: Account = { id: createId(), ...acc };
    setState((s) => ({
      ...s,
      accounts: [...s.accounts, created],
    }));
    return created;
  };

  const removeAccount = (id: string) => {
    setState((s) => ({ ...s, accounts: s.accounts.filter((a) => a.id !== id) }));
  };

  const addFolder = (name: string) => {
    const clean = name.trim();
    if (!clean) return;
    setState((s) => {
      if (s.folders.includes(clean)) return s; // déjà là
      return { ...s, folders: [...s.folders, clean] };
    });
  };

  const removeFolder = (name: string) => {
    setState((s) => {
      const folders = s.folders.filter((f) => f !== name);
      const accounts = s.accounts.map((a) =>
        a.folder === name ? { ...a, folder: "Par défaut" } : a
      );
      const activeFolder = s.activeFolder === name ? undefined : s.activeFolder;
      return { ...s, folders, accounts, activeFolder };
    });
  };

  const setActiveFolder = (folder?: string) => {
    setState((s) => ({ ...s, activeFolder: folder }));
  };

  const setAccountMetrics = (id: string, metrics: AccountMetrics) => {
    setState((s) => ({
      ...s,
      accounts: s.accounts.map((account) =>
        account.id === id ? { ...account, metrics } : account
      ),
    }));
  };

  const value = useMemo<AppContextType>(
    () => ({
      state,
      actions: {
        reorderNetworks,
        addAccount,
        removeAccount,
        addFolder,
        removeFolder,
        setActiveFolder,
        setAccountMetrics,
      },
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function getAccountsByNetwork(accounts: Account[], network: NetworkName) {
  return accounts.filter((a) => a.network === network);
}
