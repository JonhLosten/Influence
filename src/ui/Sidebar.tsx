import React from "react";
import { useLanguage } from "../i18n";
import {
  useAppState,
  NetworkName,
  getAccountsByNetwork,
} from "../store/useAppState";
import { SocialIcon } from "../components/SocialIcon";
import { AddThingModal } from "../components/AddThingModal";
import { AddFolderModal } from "../components/AddFolderModal";
import { AddAccountModal } from "../components/AddAccountModal";
import { ConfirmDialog } from "../components/ConfirmDialog";

export type Route =
  | "dashboard"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "settings";

interface AccountRowProps {
  id: string;
  network: NetworkName;
  displayName: string;
  folder: string;
  onDelete: (id: string) => void;
  deleteLabel: string;
  deleteTooltip: string;
}

function AccountRow({
  id,
  network,
  displayName,
  folder,
  onDelete,
  deleteLabel,
  deleteTooltip,
}: AccountRowProps) {
  return (
    <div className="group flex items-center justify-between px-2 py-1 rounded hover:bg-blue-50">
      <div className="flex items-center gap-2">
        <SocialIcon name={network} size={16} />
        <span className="text-sm truncate max-w-[140px]">{displayName}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-gray-500">{folder}</span>
        <button
          className="opacity-0 group-hover:opacity-100 text-xs text-red-600 hover:underline"
          onClick={() => onDelete(id)}
          title={deleteTooltip}
        >
          {deleteLabel}
        </button>
      </div>
    </div>
  );
}

export function Sidebar({
  route,
  onNavigate,
}: {
  route: Route;
  onNavigate: (r: Route) => void;
}) {
  const {
    state: { networkOrder, accounts, folders, activeFolder },
    actions: { reorderNetworks, addAccount, removeAccount, addFolder, removeFolder, setActiveFolder },
  } = useAppState();
  const { t, lang } = useLanguage();

  const [openGroups, setOpenGroups] = React.useState<Record<NetworkName, boolean>>({
    instagram: true,
    facebook: true,
    tiktok: true,
    youtube: true,
  });

  const [showChooser, setShowChooser] = React.useState(false);
  const [showAddFolder, setShowAddFolder] = React.useState(false);
  const [showAddAccount, setShowAddAccount] = React.useState(false);
  const [pendingDelete, setPendingDelete] = React.useState<{
    type: "account" | "folder";
    idOrName: string;
    label: string;
  } | null>(null);

  const dragIndex = React.useRef<number | null>(null);
  function onDragStart(idx: number) {
    dragIndex.current = idx;
  }
  function onDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function onDrop(idx: number) {
    if (dragIndex.current !== null) {
      reorderNetworks(dragIndex.current, idx);
      dragIndex.current = null;
    }
  }

  function toggleGroup(n: NetworkName) {
    setOpenGroups((g) => ({ ...g, [n]: !g[n] }));
  }

  function handleChooser(choice: "account" | "folder") {
    setShowChooser(false);
    if (choice === "account") setShowAddAccount(true);
    else setShowAddFolder(true);
  }

  const deleteAccountLabel = t("sidebar.deleteShort");
  const deleteAccountTooltip = t("sidebar.deleteAccountTooltip");

  function Header() {
    return (
      <>
        <div className="text-xl font-bold mb-3">{t("app.title")}</div>

        <div className="mb-3 space-y-2">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {t("sidebar.activeFolder")}
            </label>
            <select
              className="w-full border rounded-lg px-2 py-1 text-sm"
              value={activeFolder ?? ""}
              onChange={(e) => setActiveFolder(e.target.value || undefined)}
            >
              <option value="">{t("sidebar.allFolders")}</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("dashboard")}
              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg border ${
                route === "dashboard"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-blue-50 text-gray-800"
              }`}
              title={t("nav.dashboard")}
            >
              <SocialIcon name="default" size={18} />
              <span className="truncate">{t("nav.dashboard")}</span>
            </button>

            <button
              onClick={() => onNavigate("settings")}
              className={`px-3 py-2 rounded-lg border ${
                route === "settings"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white hover:bg-blue-50 text-gray-700"
              }`}
              title={t("nav.settings")}
            >
              ⚙
            </button>
          </div>
        </div>

        <div className="h-px bg-gray-200 my-3" />
      </>
    );
  }

  function NetworkGroup({ n, idx }: { n: NetworkName; idx: number }) {
    const listAll = getAccountsByNetwork(accounts, n);
    const list = activeFolder ? listAll.filter((a) => a.folder === activeFolder) : listAll;
    const count = list.length;

    return (
      <div className="bg-white border rounded-xl">
        <div className="flex items-center">
          <button
            onClick={() => {
              toggleGroup(n);
              onNavigate(n as Route);
            }}
            className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl ${
              route === n ? "bg-blue-600 text-white" : "hover:bg-blue-50 text-gray-800"
            }`}
            title={t("sidebar.toggleGroup")}
          >
            <span className="flex items-center gap-2">
              <span
                className={`inline-block transition-transform ${
                  openGroups[n] ? "rotate-90" : "rotate-0"
                }`}
              >
                ▶
              </span>
              <SocialIcon name={n} size={18} />
              <span className="capitalize">{t(("nav." + n) as any)}</span>
            </span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                route === n ? "bg-white/20" : "bg-gray-100"
              }`}
              title={t("sidebar.accountCountTooltip")}
            >
              {count}
            </span>
          </button>

          <div
            draggable
            onDragStart={() => onDragStart(idx)}
            onDragOver={onDragOver}
            onDrop={() => onDrop(idx)}
            className="px-2 py-2 cursor-grab select-none text-gray-400 hover:text-gray-600"
            title={t("sidebar.reorder")}
          >
            ≡
          </div>
        </div>

        {openGroups[n] && (
          <div className="p-2 space-y-1">
            {count === 0 ? (
              <div className="text-xs text-gray-500 px-2 py-1">{t("sidebar.empty")}</div>
            ) : (
              list.map((a) => (
                <AccountRow
                  key={a.id}
                  id={a.id}
                  network={a.network}
                  displayName={a.displayName}
                  folder={a.folder}
                  onDelete={(id) =>
                    setPendingDelete({
                      type: "account",
                      idOrName: id,
                      label: t("sidebar.confirmAccount", { name: a.displayName }),
                    })
                  }
                  deleteLabel={deleteAccountLabel}
                  deleteTooltip={deleteAccountTooltip}
                />
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <aside className="relative w-80 bg-white border-r h-full p-4 overflow-y-auto">
      <Header />

      <div className="space-y-3">
        {networkOrder.map((n, idx) => (
          <NetworkGroup key={n} n={n as NetworkName} idx={idx} />
        ))}
      </div>

      <div className="sticky bottom-0 left-0 right-0 bg-white pt-4 mt-4">
        <div className="h-px bg-gray-200 mb-3" />
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowChooser(true)}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow"
            title={t("sidebar.addTooltip")}
          >
            <span className="text-lg leading-none">＋</span>
            <span>{t("sidebar.addButton")}</span>
          </button>

          <span className="text-xs text-gray-500">
            {t("nav.settings")} • {lang.toUpperCase()}
          </span>
        </div>
      </div>

      <AddThingModal
        isOpen={showChooser}
        onClose={() => setShowChooser(false)}
        onChoose={handleChooser}
      />

      <AddFolderModal
        isOpen={showAddFolder}
        onClose={() => setShowAddFolder(false)}
        onAdd={(name) => {
          addFolder(name);
          setActiveFolder(name);
        }}
      />

      <AddAccountModal
        isOpen={showAddAccount}
        onClose={() => setShowAddAccount(false)}
        onAdd={(network, displayName, folder) => {
          addAccount({ network, displayName, folder });
          setActiveFolder(folder);
        }}
        existing={accounts}
        availableFolders={folders}
      />

      <ConfirmDialog
        isOpen={!!pendingDelete}
        title={t("sidebar.confirmTitle")}
        message={pendingDelete?.label || ""}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) return;
          if (pendingDelete.type === "account") {
            removeAccount(pendingDelete.idOrName);
          } else {
            removeFolder(pendingDelete.idOrName);
          }
          setPendingDelete(null);
        }}
      />
    </aside>
  );
}
