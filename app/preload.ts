import { contextBridge, ipcRenderer } from "electron";

export interface InfluenceBridge {
  getVersion: () => Promise<string>;
}

const api: InfluenceBridge = {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
};

contextBridge.exposeInMainWorld("influence", api);
