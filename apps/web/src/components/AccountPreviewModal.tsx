import React from "react";
import { NetworkName } from "../store/useAppState";
import { SocialIcon } from "./SocialIcon";

interface AccountPreviewProps {
  isOpen: boolean;
  account: {
    username: string;
    displayName: string;
    avatar: string;
    network: NetworkName;
  } | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AccountPreviewModal: React.FC<AccountPreviewProps> = ({
  isOpen,
  account,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen || !account) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-96 shadow-lg text-center space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Confirmer le compte</h2>
        <img
          src={account.avatar}
          alt={account.displayName}
          className="w-24 h-24 rounded-full mx-auto"
        />
        <div className="text-xl font-semibold">{account.displayName}</div>
        <div className="text-sm text-gray-500">{account.username}</div>
        <div className="flex justify-center mt-2">
          <SocialIcon name={account.network} size={22} />
        </div>

        <div className="flex justify-center gap-3 mt-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border hover:bg-gray-100"
          >
            Corriger
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
};
