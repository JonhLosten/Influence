const { app, BrowserWindow } = require('electron');
const path = require('path');

// Import ESM-compatible modules dynamiquement
(async () => {
    const { default: isDev } = await import('electron-is-dev').catch(() => ({ default: true }));

    async function createWindow() {
        const win = new BrowserWindow({
            width: 1280,
            height: 800,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
            },
        });

        if (isDev) {
            await win.loadURL('http://localhost:5173');
            win.webContents.openDevTools();
        } else {
            await win.loadFile(path.join(__dirname, '../dist-renderer/index.html'));
        }
    }

    app.whenReady().then(createWindow);

    app.on('window-all-closed', () => {
        if (process.platform !== 'darwin') app.quit();
    });
})();
