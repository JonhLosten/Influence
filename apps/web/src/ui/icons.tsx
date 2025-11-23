import React from "react";
import type { NetworkName } from "../store/useAppState";

export function NetworkIcon({
  name,
  className = "w-5 h-5",
}: {
  name: NetworkName;
  className?: string;
}) {
  const color =
    name === "instagram"
      ? "#E1306C"
      : name === "facebook"
        ? "#1877F2"
        : name === "tiktok"
          ? "#000000"
          : "#FF0000"; // youtube

  // Icnes minimalistes
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10" fill={color} opacity="0.15" />
      <path d="M7 12h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 7v10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
