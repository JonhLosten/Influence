import React from "react";
import { useError } from "../store/ErrorContext";

export function ErrorDisplay() {
  const { error, clearError } = useError();

  if (!error) {
    return null;
  }

  const userMessage = error.message || "An unknown error occurred.";

  return (
    <div className="fixed bottom-4 right-4 z-[100] w-full max-w-sm">
      <div className="bg-red-600 text-white p-4 rounded-lg shadow-lg flex items-start space-x-4">
        <div className="flex-1">
          <h4 className="font-bold text-lg">Erreur: {userMessage}</h4>
        </div>
        <button
          onClick={clearError}
          className="text-white opacity-70 hover:opacity-100 transition-opacity p-1 -mt-2 -mr-2"
          aria-label="Fermer l'alerte d'erreur"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
