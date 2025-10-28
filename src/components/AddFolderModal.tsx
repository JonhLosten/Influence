import React from "react";
import { useLanguage } from "../i18n";

export const AddFolderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}> = ({ isOpen, onClose, onAdd }) => {
  const { t } = useLanguage();
  const [name, setName] = React.useState("");
  const [msg, setMsg] = React.useState("");

  React.useEffect(() => {
    if (!isOpen) {
      setName("");
      setMsg("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) {
      setMsg(t("modal.folder.missing"));
      return;
    }
    onAdd(clean);
    setMsg(t("modal.folder.created"));
    setTimeout(() => {
      setMsg("");
      setName("");
      onClose();
    }, 800);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <form onSubmit={submit} className="bg-white rounded-2xl p-6 w-96 shadow space-y-4">
        <h2 className="text-lg font-semibold">{t("modal.folder.title")}</h2>
        <input
          className="w-full border rounded-lg px-3 py-2"
          placeholder={t("modal.folder.placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {msg && <div className="text-center text-sm text-blue-600">{msg}</div>}
        <div className="flex justify-end gap-2">
          <button type="button" className="px-3 py-1 rounded-lg border" onClick={onClose}>
            {t("modal.cancel")}
          </button>
          <button type="submit" className="px-3 py-1 rounded-lg bg-blue-600 text-white">
            {t("modal.folder.submit")}
          </button>
        </div>
      </form>
    </div>
  );
};
