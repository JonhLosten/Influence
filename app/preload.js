const { contextBridge, ipcRenderer } = require("electron");

const api = {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
};

contextBridge.exposeInMainWorld("influence", api);
