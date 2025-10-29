import React, { createContext, useContext, useMemo, useState } from "react";

export type NetworkName = "instagram" | "facebook" | "tiktok" | "youtube";

export interface Account {
  id: string;
  network: NetworkName;
  displayName: string; // ex: "@laugh-logic" ou "Laugh Logic"
  folder: string; // nom du dossier
}

interface Preferences {
  demoDataEnabled: boolean;
}

interface AppState {
  networkOrder: NetworkName[];
  accounts: Account[];
  folders: string[]; // <— ajouté
  activeFolder?: string;
  preferences: Preferences;
}

interface AppActions {
  reorderNetworks: (from: number, to: number) => void;
  addAccount: (acc: Omit<Account, "id">) => void;
  removeAccount: (id: string) => void;
  addFolder: (name: string) => void;
  removeFolder: (name: string) => void;
  setActiveFolder: (folder?: string) => void;
  setDemoDataEnabled: (enabled: boolean) => void;
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

const PREFERENCES_KEY = "influenceops.preferences";

function readStoredPreferences(): Preferences {
  if (typeof window === "undefined") {
    return { demoDataEnabled: false };
  }
  try {
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return { demoDataEnabled: false };
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      demoDataEnabled: Boolean(parsed.demoDataEnabled),
    };
  } catch (err) {
    console.warn("useAppState: unable to read preferences", err);
    return { demoDataEnabled: false };
  }
}

function persistPreferences(preferences: Preferences) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch (err) {
    console.warn("useAppState: unable to persist preferences", err);
  }
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<AppState>(() => ({
    networkOrder: ["instagram", "facebook", "tiktok", "youtube"],
    accounts: [],
    folders: ["Par défaut"], // <— un dossier par défaut
    activeFolder: undefined,
    preferences: readStoredPreferences(),
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
    setState((s) => ({
      ...s,
      accounts: [...s.accounts, { id: createId(), ...acc }],
    }));
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

  const setDemoDataEnabled = (enabled: boolean) => {
    setState((s) => {
      const next: AppState = {
        ...s,
        preferences: { ...s.preferences, demoDataEnabled: enabled },
      };
      persistPreferences(next.preferences);
      return next;
    });
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
        setDemoDataEnabled,
      },
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function getAccountsByNetwork(accounts: Account[], network: NetworkName) {
  return accounts.filter((a) => a.network === network);
}
