import { app, BrowserWindow, ipcMain } from "electron";
import * as path from "path";

// ⚙️ Supprime les avertissements de sécurité Electron
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

// 🔥 Empêche la création multiple de fenêtres
if (!app.requestSingleInstanceLock()) {
    app.quit();
}

// 🪟 Fonction de création de la fenêtre principale
function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1100,
        minHeight: 700,
        backgroundColor: "#f8fafc",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // ⚠️ désactivé pour compatibilité Vite (ok en dev)
            preload: path.join(__dirname, "preload.js"), // si inexistant, pas grave
        },
    });

    // 🧩 Injecte un CSP (Content Security Policy)
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
            responseHeaders: {
                ...details.responseHeaders,
                "Content-Security-Policy": [
                    "default-src 'self' 'unsafe-inline' data: blob: filesystem: https://* http://localhost:*",
                ],
            },
        });
    });

    // 🚧 En mode dev, charge le serveur Vite
    if (!app.isPackaged) {
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools(); // optionnel
    } else {
        // 📦 En production, charge le build Vite
        win.loadFile(path.join(__dirname, "../dist/index.html"));
    }

    // (Optionnel) Log utile pour vérifier le chargement
    console.log("Fenêtre principale créée ✅");
}

// 🏁 Lancer la fenêtre quand Electron est prêt
app.whenReady().then(createWindow);

// 🧩 Quitter l’app quand toutes les fenêtres sont fermées
app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// 🧠 Exemple IPC (facultatif, communication front <-> back)
ipcMain.handle("get-app-version", () => {
    return app.getVersion();
});
