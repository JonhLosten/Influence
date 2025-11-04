import { app, BrowserWindow, ipcMain } from "electron";
import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { pathToFileURL } from "url";

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

let analyticsProcess: ChildProcess | null = null;
let stopEmbeddedServer: (() => void) | null = null;

async function startAnalyticsServer() {
  if (stopEmbeddedServer || analyticsProcess) {
    return;
  }

  const candidates = [
    app.isPackaged ? path.join(process.resourcesPath, "dist-server/index.js") : null,
    path.join(__dirname, "../dist-server/index.js"),
  ].filter((value): value is string => !!value && fs.existsSync(value));

  for (const candidate of candidates) {
    try {
      const module = (await import(pathToFileURL(candidate).href)) as {
        startAnalyticsServer?: (port?: number) => import("http").Server;
      };
      if (typeof module.startAnalyticsServer === "function") {
        const instance = module.startAnalyticsServer(Number(process.env.PORT) || 5174);
        stopEmbeddedServer = () => {
          try {
            instance.close();
          } catch (error) {
            console.error("Failed to stop analytics server", error);
          }
        };
        console.log("Embedded analytics server started from", candidate);
        return;
      }
    } catch (error) {
      console.error(`Unable to load analytics server from ${candidate}`, error);
    }
  }

  const tsEntry = path.join(__dirname, "../server/index.ts");
  let tsxBin: string | null = null;
  try {
    tsxBin = require.resolve("tsx/dist/cli.js");
  } catch (err) {
    console.warn("tsx CLI not available to run analytics server from sources", err);
  }

  if (tsxBin && fs.existsSync(tsEntry)) {
    analyticsProcess = spawn(process.execPath, [tsxBin, tsEntry], {
      env: {
        ...process.env,
        PORT: process.env.PORT || "5174",
      },
      stdio: "inherit",
    });

    analyticsProcess.on("exit", (code) => {
      if (code && code !== 0) {
        console.error(`Analytics server exited with code ${code}`);
      }
      analyticsProcess = null;
    });
    return;
  }

  console.warn("No analytics server entrypoint available. Dashboards may stay empty.");
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#f8fafc",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

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

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  console.log("Fenêtre principale créée ✅");
}

app.whenReady().then(async () => {
  await startAnalyticsServer();
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

app.on("before-quit", () => {
  if (stopEmbeddedServer) {
    stopEmbeddedServer();
    stopEmbeddedServer = null;
  }
  if (analyticsProcess) {
    analyticsProcess.kill();
    analyticsProcess = null;
  }
});

ipcMain.handle("get-app-version", () => {
  return app.getVersion();
});
