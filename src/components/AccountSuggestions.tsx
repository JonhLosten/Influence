import React from "react";
import { NetworkName } from "../store/useAppState";

interface Suggestion {
  id: string;
  username: string;
  displayName: string;
  network: NetworkName;
  avatar: string;
}

export const AccountSuggestions: React.FC<{
  query: string;
  network: NetworkName;
  onSelect: (s: Suggestion) => void;
}> = ({ query, network, onSelect }) => {
  if (!query.trim()) return null;

  // 🧠 Suggestions fictives (tu pourras les remplacer par un fetch API)
  const allSuggestions: Suggestion[] = [
    {
      id: "1",
      username: "@Laugh-Logic",
      displayName: "Laugh Logic",
      network: "youtube",
      avatar: "https://yt3.googleusercontent.com/ytc/AIdro_mK4ybw75XD.jpg",
    },
    {
      id: "2",
      username: "@teamroyller2769",
      displayName: "Team Royller",
      network: "youtube",
      avatar: "https://yt3.googleusercontent.com/ytc/AIdro_kdFFteamR.jpg",
    },
    {
      id: "3",
      username: "@influenceops",
      displayName: "InfluenceOps Officiel",
      network: "instagram",
      avatar: "https://picsum.photos/seed/influenceops/64",
    },
  ];

  const filtered = allSuggestions.filter(
    (s) =>
      s.network === network &&
      s.username.toLowerCase().includes(query.toLowerCase())
  );

  if (filtered.length === 0) return null;

  return (
    <div className="border rounded-lg mt-2 bg-white shadow-sm max-h-40 overflow-y-auto">
      {filtered.map((s) => (
        <button
          key={s.id}
          onClick={() => onSelect(s)}
          className="flex items-center w-full text-left px-3 py-2 hover:bg-blue-50"
        >
          <img
            src={s.avatar}
            alt={s.displayName}
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <div className="font-medium text-sm">{s.displayName}</div>
            <div className="text-xs text-gray-500">{s.username}</div>
          </div>
        </button>
      ))}
    </div>
  );
};
