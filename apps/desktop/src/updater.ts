import { app } from "electron";
import { autoUpdater } from "electron-updater";

export function setupAutoUpdater() {
  if (!app.isPackaged) return;

  const channel = process.env.PRINCY_UPDATE_CHANNEL ?? "latest";
  autoUpdater.channel = channel;
  autoUpdater.autoDownload = true;
  autoUpdater.checkForUpdatesAndNotify().catch(() => undefined);
}
