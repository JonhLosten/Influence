"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const node_path_1 = __importDefault(require("node:path"));
const electron_is_dev_1 = __importDefault(require("electron-is-dev"));
require("./squirrel.js");
async function createWindow() {
    const win = new electron_1.BrowserWindow({
        width: 1280, height: 800,
        webPreferences: {
            preload: node_path_1.default.join(__dirname, 'preload.js')
        }
    });
    if (electron_is_dev_1.default)
        await win.loadURL('http://localhost:5173');
    else
        await win.loadFile(node_path_1.default.join(__dirname, '../dist-renderer/index.html'));
}
electron_1.app.whenReady().then(createWindow);
electron_1.app.on('window-all-closed', () => { if (process.platform !== 'darwin')
    electron_1.app.quit(); });
