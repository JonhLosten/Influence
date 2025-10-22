// app/preload.js
const { contextBridge, ipcRenderer } = require('electron');

// Permet de communiquer de mani�re s�curis�e entre le front et le backend Electron
contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
});
