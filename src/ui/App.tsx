import React from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "../views/Dashboard";
import { NetworkDashboard } from "../views/NetworkDashboard";
import { Settings } from "../views/Settings";
import { AppStateProvider } from "../store/useAppState";

// Liste des routes possibles
type Route =
  | "dashboard"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "settings";

export function App() {
  const [route, setRoute] = React.useState<Route>("dashboard");

  return (
    <AppStateProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Barre latérale */}
        <Sidebar route={route} onNavigate={setRoute} />

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto p-6">
          {route === "dashboard" && <Dashboard />}

          {route === "instagram" && <NetworkDashboard network="instagram" />}
          {route === "facebook" && <NetworkDashboard network="facebook" />}
          {route === "tiktok" && <NetworkDashboard network="tiktok" />}
          {route === "youtube" && <NetworkDashboard network="youtube" />}

          {route === "settings" && <Settings />}
        </main>
      </div>
    </AppStateProvider>
  );
}
