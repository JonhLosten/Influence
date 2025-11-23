import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import { App } from "./ui/App";
import { LanguageProvider } from "./i18n";
import { PreferencesProvider } from "./store/usePreferences";
import { ErrorProvider } from "./store/ErrorContext"; // Import ErrorProvider

if (import.meta.env.VITE_SENTRY_DSN_WEB) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN_WEB,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, sample the session when an error occurs.
    // Send PII data
    sendDefaultPii: true,
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<p>An error has occurred</p>}>
      <LanguageProvider>
        <PreferencesProvider>
          <ErrorProvider>
            {" "}
            {/* Wrap App with ErrorProvider */}
            <App />
          </ErrorProvider>
        </PreferencesProvider>
      </LanguageProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);
