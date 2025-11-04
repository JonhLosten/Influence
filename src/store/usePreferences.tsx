import React, { createContext, useContext, useMemo, useState } from "react";

export interface PreferencesState {
  showDemoData: boolean;
}

interface PreferencesContextValue {
  prefs: PreferencesState;
  setShowDemoData: (value: boolean) => void;
}

const STORAGE_KEY = "influenceops.preferences";
const DEFAULT_STATE: PreferencesState = {
  showDemoData: false,
};

function readStoredPreferences(): PreferencesState {
  if (typeof window === "undefined") {
    return DEFAULT_STATE;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as Partial<PreferencesState> | null;
    if (!parsed || typeof parsed !== "object") {
      return DEFAULT_STATE;
    }
    return {
      showDemoData:
        typeof parsed.showDemoData === "boolean"
          ? parsed.showDemoData
          : DEFAULT_STATE.showDemoData,
    };
  } catch (error) {
    console.warn("usePreferences: unable to read stored preferences", error);
    return DEFAULT_STATE;
  }
}

function persistPreferences(state: PreferencesState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("usePreferences: unable to persist preferences", error);
  }
}

const PreferencesContext = createContext<PreferencesContextValue | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [prefs, setPrefs] = useState<PreferencesState>(() =>
    readStoredPreferences()
  );

  const setShowDemoData = (value: boolean) => {
    setPrefs((prev) => {
      if (prev.showDemoData === value) return prev;
      const next = { ...prev, showDemoData: value };
      persistPreferences(next);
      return next;
    });
  };

  const value = useMemo<PreferencesContextValue>(
    () => ({
      prefs,
      setShowDemoData,
    }),
    [prefs]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
};

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
