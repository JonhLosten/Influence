import React, { createContext, useContext, useState } from "react";

export type NetworkName = "instagram" | "facebook" | "tiktok" | "youtube";

export interface Account {
  id: string;
  network: NetworkName;
  displayName: string; // ex: "@laugh-logic" ou "Laugh Logic"
  folder: string;      // nom du dossier
}

interface AppState {
  networkOrder: NetworkName[];
  accounts: Account[];
  folders: string[];       // <— ajouté
  activeFolder?: string;
}

interface AppActions {
  reorderNetworks: (from: number, to: number) => void;
  addAccount: (acc: Omit<Account, "id">) => void;
  removeAccount: (id: string) => void;
  addFolder: (name: string) => void;
  removeFolder: (name: string) => void;
  setActiveFolder: (folder?: string) => void;
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

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    networkOrder: ["instagram", "facebook", "tiktok", "youtube"],
    accounts: [],
    folders: ["Par défaut"],            // <— un dossier par défaut
    activeFolder: undefined,
  });

  const reorderNetworks = (from: number, to: number) => {
    setState((s) => {
      const copy = [...s.networkOrder];
      const [moved] = copy.splice(from, 1);
      copy.splice(to, 0, moved);
      return { ...s, networkOrder: copy };
    });
  };

  // ✅ MAJ immédiate du state (sans muter)
  const addAccount = (acc: Omit<Account, "id">) => {
    setState((s) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      return { ...s, accounts: [...s.accounts, { id, ...acc }] };
    });
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

  const value: AppContextType = {
    state,
    actions: { reorderNetworks, addAccount, removeAccount, addFolder, removeFolder, setActiveFolder },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// Utilitaire
export function getAccountsByNetwork(accounts: Account[], network: NetworkName) {
  return accounts.filter((a) => a.network === network);
}
