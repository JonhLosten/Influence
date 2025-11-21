// apps/web/src/store/usePreferences.tsx
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import React, { createContext, useContext } from "react";

interface PreferencesState {
  darkMode: boolean;
  hasCompletedOnboarding: boolean;
  toggleDarkMode: () => void;
  completeOnboarding: () => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      darkMode: window.matchMedia("(prefers-color-scheme: dark)").matches, // Default to system preference
      hasCompletedOnboarding: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
      completeOnboarding: () => set(() => ({ hasCompletedOnboarding: true })),
    }),
    {
      name: "influence-preferences-storage", // unique name
      storage: createJSONStorage(() => localStorage), // Use localStorage for persistence
    }
  )
);

// Create a context provider for the preferences store
// This is useful if you want to avoid direct `usePreferences()` calls everywhere
interface PreferencesContextType {
  preferences: PreferencesState;
}

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const preferences = usePreferences();
  return (
    <PreferencesContext.Provider value={{ preferences }}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferencesContext = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error(
      "usePreferencesContext must be used within a PreferencesProvider"
    );
  }
  return context;
};
