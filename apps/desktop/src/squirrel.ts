import { app } from 'electron';

if (process.platform === 'win32') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const squirrelStartup = require('electron-squirrel-startup') as boolean;
  if (squirrelStartup) {
    app.quit();
  }
}
