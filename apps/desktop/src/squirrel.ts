import { app } from "electron";

if (process.platform === "win32") {
  const squirrelStartup = require("electron-squirrel-startup") as boolean;
  if (squirrelStartup) {
    app.quit();
  }
}
