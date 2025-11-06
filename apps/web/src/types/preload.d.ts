import type { DesktopBridge } from '@influence/sdk';

declare global {
  interface Window {
    influence: DesktopBridge;
  }
}

export {};
