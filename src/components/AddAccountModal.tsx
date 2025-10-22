import React from "react";
import { NetworkName } from "../store/useAppState";
import { suggestAccounts } from "../services/suggestAccounts";

export const AddAccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (network: NetworkName, displayName: string, folder: string) => void;
  existing?: Array<{ network: NetworkName; displayName: string }>;
  availableFolders?: string[];
}> = ({
  isOpen,
  onClose,
  onAdd,
  existing = [],
  availableFolders = ["Par défaut"],
}) => {
    const [network, setNetwork] = React.useState<NetworkName>("instagram");
    const [query, setQuery] = React.useState("");
    const [folder, setFolder] = React.useState(availableFolders[0] || "Par défaut");
    const [results, setResults] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(false);
    const [message, setMessage] = React.useState("");

    // 🔄 Reset à chaque ouverture
    React.useEffect(() => {
      if (isOpen) {
        setQuery("");
        setResults([]);
        setMessage("");
      }
    }, [isOpen]);

    // 🔍 Recherche en ligne (déclenchée à chaque frappe)
    React.useEffect(() => {
      if (!isOpen) return;
      const q = query.trim();
      if (!q) {
        setResults([]);
        return;
      }

      setLoading(true);
      const timer = setTimeout(async () => {
        const res = await suggestAccounts(network, q);
        setResults(res);
        setLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }, [query, network, isOpen]);

    // 🧩 Vérifie si déjà ajouté
    const isDuplicate = (name: string) => {
      const lower = name.trim().toLowerCase();
      return existing.some(
        (a) => a.network === network && a.displayName.trim().toLowerCase() === lower
      );
    };

    // ✅ Sélection d'une suggestion
    function handleSelect(s: any) {
      if (isDuplicate(s.displayName)) {
        setMessage("❌ Ce compte est déjà ajouté.");
        return;
      }
      onAdd(network, s.displayName, folder);
      setMessage("✅ Compte ajouté !");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 900);
    }

    // ➕ Saisie manuelle
    function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      const name = query.trim();
      if (!name) {
        setMessage("❌ Saisis un nom ou choisis une suggestion.");
        return;
      }
      if (isDuplicate(name)) {
        setMessage("❌ Ce compte est déjà présent.");
        return;
      }
      onAdd(network, name, folder);
      setMessage("✅ Compte ajouté !");
      setTimeout(() => {
        setMessage("");
        onClose();
      }, 900);
    }

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-6 w-[520px] shadow space-y-5"
        >
          <h2 className="text-lg font-semibold text-gray-800">Ajouter un compte</h2>

          {/* Choix du réseau et du dossier */}
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm text-gray-700">
              Réseau
              <select
                value={network}
                onChange={(e) => setNetwork(e.target.value as NetworkName)}
                className="w-full border rounded-lg px-2 py-1 mt-1"
              >
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="tiktok">TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </label>

            <label className="text-sm text-gray-700">
              Dossier
              <select
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
                className="w-full border rounded-lg px-2 py-1 mt-1"
              >
                {availableFolders.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Champ de recherche */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">
              Rechercher un compte
            </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="@handle, nom ou lien…"
              className="w-full border rounded-lg px-3 py-2"
            />

            {/* Loader */}
            {loading && (
              <div className="text-xs text-gray-500 mt-2">Recherche en cours…</div>
            )}

            {/* Suggestions web */}
            {!loading && results.length > 0 && (
              <ul className="mt-3 border rounded-lg overflow-hidden divide-y max-h-60 overflow-y-auto">
                {results.map((s, i) => (
                  <li
                    key={i}
                    className="px-3 py-3 hover:bg-blue-50 transition cursor-pointer"
                    onClick={() => handleSelect(s)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={s.avatar}
                        alt={s.displayName}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">
                          {s.displayName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {s.handle} • {s.followers.toLocaleString()} abonnés
                        </div>
                      </div>
                      <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded shrink-0">
                        {network}
                      </span>
                    </div>

                    {/* 🔗 Bonus : lien vers le profil */}
                    {s.url && (
                      <div className="text-right mt-1">
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Voir le profil →
                        </a>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}

            {/* Aucun résultat */}
            {!loading && query.trim() && results.length === 0 && (
              <div className="text-xs text-gray-500 mt-2">
                Aucun profil trouvé pour cette recherche.
              </div>
            )}
          </div>

          {/* Message de retour */}
          {message && (
            <div className="text-center text-sm text-blue-600">{message}</div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-3 py-1 rounded-lg border hover:bg-gray-100"
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Ajouter
            </button>
          </div>
        </form>
      </div>
    );
  };
