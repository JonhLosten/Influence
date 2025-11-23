import React from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "../views/Dashboard";
import { NetworkDashboard } from "../views/NetworkDashboard";
import Settings from "../views/Settings";
import { Troubleshooting } from "../views/Troubleshooting";
import { VideoPublisher } from "../views/VideoPublisher";
import { AppStateProvider } from "../store/useAppState";
import { ErrorDisplay } from "../components/ErrorDisplay"; // Import ErrorDisplay
import type { Route } from "../routes";
import type { NetworkName } from "../store/useAppState";

// Add this button component to your app to test Sentry's error tracking
function ErrorButton() {
  return (
    <button
      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded m-4"
      onClick={() => {
        throw new Error("This is your first error!");
      }}
    >
      Break the world
    </button>
  );
}

export function App() {
  const [route, setRoute] = React.useState<Route>("dashboard");

  const renderContent = () => {
    if (route === "dashboard") return <Dashboard />;
    if (route === "settings") return <Settings />;
    if (route === "troubleshooting") return <Troubleshooting />;
    if (route === "video_publisher") return <VideoPublisher />;

    // Handle network routes
    const networkRoutes: NetworkName[] = [
      "instagram",
      "facebook",
      "tiktok",
      "youtube",
    ];
    if (networkRoutes.includes(route as NetworkName)) {
      return <NetworkDashboard network={route as NetworkName} />;
    }

    return <Dashboard />; // Fallback to dashboard
  };

  return (
    <AppStateProvider>
      <div className="flex h-screen bg-gray-100 overflow-hidden">
        {/* Barre latérale */}
        <Sidebar route={route} onNavigate={setRoute} />

        {/* Contenu principal */}
        <main className="flex-1 overflow-auto p-6">
          <ErrorButton />
          {renderContent()}
        </main>
      </div>
      <ErrorDisplay /> {/* Add ErrorDisplay here */}
    </AppStateProvider>
  );
}
