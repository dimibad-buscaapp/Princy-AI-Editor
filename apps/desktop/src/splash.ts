import { app, BrowserWindow } from "electron";
import path from "node:path";
import type { WebPreferences } from "electron";

let splashWindow: BrowserWindow | null = null;

function secureWebPreferences(preloadPath: string): WebPreferences {
  return {
    preload: preloadPath,
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true
  };
}

function resolveSplashHtmlPath(): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "assets", "splash.html");
  }
  return path.join(__dirname, "../assets/splash.html");
}

export function createSplashWindow(preloadPath: string): BrowserWindow {
  splashWindow = new BrowserWindow({
    width: 420,
    height: 280,
    frame: false,
    transparent: false,
    resizable: false,
    center: true,
    show: false,
    backgroundColor: "#0a0518",
    title: "Princy Code",
    webPreferences: secureWebPreferences(preloadPath)
  });

  void splashWindow.loadFile(resolveSplashHtmlPath());
  splashWindow.once("ready-to-show", () => splashWindow?.show());
  return splashWindow;
}

export async function updateSplashMessage(message: string): Promise<void> {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  const escaped = message.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  try {
    await splashWindow.webContents.executeJavaScript(
      `window.setSplashStatus && window.setSplashStatus('${escaped}')`
    );
  } catch {
    /* splash may still be loading */
  }
}

export function closeSplash(): void {
  if (!splashWindow || splashWindow.isDestroyed()) return;
  splashWindow.close();
  splashWindow = null;
}
