import React, { createContext, useContext, useMemo, useState } from "react";
import { getLang as getStoredLang, setLang as persistLang, type Lang } from "../i18n";

export type NetworkName = "instagram" | "facebook" | "tiktok" | "youtube";

export interface Account {
  id: string;
  network: NetworkName;
  displayName: string; // ex: "@laugh-logic" ou "Laugh Logic"
  folder: string; // nom du dossier
}

interface AppState {
  networkOrder: NetworkName[];
  accounts: Account[];
  folders: string[]; // <— ajouté
  activeFolder?: string;
  lang: Lang;
}

interface AppActions {
  reorderNetworks: (from: number, to: number) => void;
  addAccount: (acc: Omit<Account, "id">) => void;
  removeAccount: (id: string) => void;
  addFolder: (name: string) => void;
  removeFolder: (name: string) => void;
  setActiveFolder: (folder?: string) => void;
  setLang: (lang: Lang) => void;
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

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => ({
    networkOrder: ["instagram", "facebook", "tiktok", "youtube"],
    accounts: [],
    folders: ["Par défaut"], // <— un dossier par défaut
    activeFolder: undefined,
    lang: getStoredLang(),
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

  const setLang = (lang: Lang) => {
    const next = lang === "en" ? "en" : "fr";
    persistLang(next);
    setState((s) => (s.lang === next ? s : { ...s, lang: next }));
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
        setLang,
      },
    }),
    [state]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function getAccountsByNetwork(accounts: Account[], network: NetworkName) {
  return accounts.filter((a) => a.network === network);
}
