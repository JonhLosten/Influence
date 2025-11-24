import type { NetworkName } from "./store/useAppState";

export type Route =
  | "dashboard"
  | "settings"
  | "network"
  | "troubleshooting"
  | "video_publisher"
  | NetworkName;
