import type { InfluenceBridge } from "../../app/preload";

declare global {
  interface Window {
    influence: InfluenceBridge;
  }
}

export {};
