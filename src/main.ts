import { app, BrowserWindow } from "electron";
import path from "node:path";
import isDev from "electron-is-dev";

async function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, "preload.js"),
        },
    });

    console.log("Chargement du front depuis :", isDev ? "http://localhost:5173" : "../dist-renderer/index.html");

    if (isDev) {
        await win.loadURL("http://localhost:5173");
    } else {
        await win.loadFile(path.join(__dirname, "../dist-renderer/index.html"));
    }

    win.webContents.openDevTools();
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});
