import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { join } from 'node:path';
import { CreatePostSchema, FetchInsightsSchema, IpcChannels, type IpcResponse } from '@influence/sdk';

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

const allowedOrigins = new Set(['http://localhost:5173', 'file://']);

if (!app.requestSingleInstanceLock()) {
  app.quit();
}

function loadRenderer(win: BrowserWindow) {
  if (!app.isPackaged) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools({ mode: 'detach' }).catch((error) => {
      console.warn('Unable to open DevTools', error);
    });
    return;
  }

  win.loadFile(join(__dirname, '../dist/index.html')).catch((error) => {
    console.error('Failed to load renderer bundle', error);
    win.webContents.send('renderer:bootstrap-error', error instanceof Error ? error.message : String(error));
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: '#0f172a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => {
    win.show();
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!/^https?:\/\//.test(url)) {
      return { action: 'deny' };
    }
    const origin = new URL(url).origin;
    if (!allowedOrigins.has(origin)) {
      shell.openExternal(url).catch((error) => {
        console.error('Failed to open external url', error);
      });
    }
    return { action: 'deny' };
  });

  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; script-src 'self'; connect-src 'self' https://* http://localhost:*;",
        ],
      },
    });
  });

  loadRenderer(win);
  return win;
}

async function bootstrap() {
  await app.whenReady();
  const window = createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, url) => {
      const origin = new URL(url).origin;
      if (!allowedOrigins.has(origin)) {
        event.preventDefault();
      }
    });
  });

  ipcMain.handle(IpcChannels.APP_GET_VERSION, (): IpcResponse<string> => ({
    ok: true,
    data: app.getVersion(),
  }));

  ipcMain.handle(IpcChannels.PROVIDER_CREATE_POST, async (_event, rawPayload): Promise<IpcResponse<never>> => {
    const parseResult = CreatePostSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      return {
        ok: false,
        error: { code: 'validation_error', message: parseResult.error.message },
      };
    }

    return {
      ok: false,
      error: { code: 'not_implemented', message: 'Provider publication is not implemented yet', retriable: false },
    };
  });

  ipcMain.handle(IpcChannels.PROVIDER_FETCH_INSIGHTS, async (_event, rawPayload): Promise<IpcResponse<never>> => {
    const parseResult = FetchInsightsSchema.safeParse(rawPayload);
    if (!parseResult.success) {
      return {
        ok: false,
        error: { code: 'validation_error', message: parseResult.error.message },
      };
    }

    return {
      ok: false,
      error: { code: 'not_implemented', message: 'Insights fetching is not implemented yet', retriable: true },
    };
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return window;
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap desktop app', error);
  app.exit(1);
});
