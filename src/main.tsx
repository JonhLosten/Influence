import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { App } from "./ui/App";
import { LanguageProvider } from "./i18n";
import { PreferencesProvider } from "./store/usePreferences";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <LanguageProvider>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </LanguageProvider>
  </React.StrictMode>
);
