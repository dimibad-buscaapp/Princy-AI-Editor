import { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage, ipcMain, shell } from "electron";
import fs from "node:fs";
import path from "node:path";
import { setupAutoUpdater } from "./updater.js";
import { waitForFrontend } from "./health.js";
import { resolveMonorepoRoot, startMonorepo, stopMonorepo } from "./services.js";
import { closeSplash, createSplashWindow, updateSplashMessage } from "./splash.js";
import { errorPageDataUrl } from "./error-page.js";

const FRONTEND_PORT = Number(process.env.PRINCY_FRONTEND_PORT ?? 3400);
const isDev = process.env.PRINCY_DEV === "1" || !app.isPackaged;
const FRONTEND_HOST = isDev ? "localhost" : "127.0.0.1";
const FRONTEND_URL = `http://${FRONTEND_HOST}:${FRONTEND_PORT}`;
const FRONTEND_URLS = [
  FRONTEND_URL,
  `http://127.0.0.1:${FRONTEND_PORT}`,
  `http://localhost:${FRONTEND_PORT}`
];

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function secureWebPreferences() {
  return {
    preload: path.join(__dirname, "preload.js"),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: true,
    webSecurity: true
  } as const;
}

function createMainWindow(loadUrl: string) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    void mainWindow.loadURL(loadUrl);
    mainWindow.show();
    return mainWindow;
  }

  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    show: false,
    backgroundColor: "#0a0518",
    title: "Princy Code Beta",
    webPreferences: secureWebPreferences()
  });

  void mainWindow.loadURL(loadUrl);
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  return mainWindow;
}

function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "icon.png")
    : path.join(__dirname, "../assets/icon.png");
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);
  tray.setToolTip("Princy Code Beta");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir Princy Code Beta", click: () => mainWindow?.show() },
      { label: "Sair", click: () => app.quit() }
    ])
  );
}

async function bootstrap() {
  const preloadPath = path.join(__dirname, "preload.js");
  createSplashWindow(preloadPath);
  await updateSplashMessage("Princy services are starting...");

  startMonorepo();

  const health = await waitForFrontend({
    urls: [...new Set(FRONTEND_URLS)],
    intervalMs: 1500,
    timeoutMs: 90_000,
    onAttempt: async () => {
      await updateSplashMessage("Princy services are starting...");
    }
  });

  closeSplash();

  if (health.ok && health.url) {
    createMainWindow(health.url);
  } else {
    createMainWindow(
      errorPageDataUrl("Não foi possível conectar aos serviços locais da Princy.")
    );
  }
}

function registerIpcHandlers() {
  ipcMain.on("princy:retry", () => {
    void bootstrap();
  });

  ipcMain.handle("princy:open-logs", async () => {
    const logsDir = path.join(resolveMonorepoRoot(), "logs");
    if (fs.existsSync(logsDir)) {
      await shell.openPath(logsDir);
      return true;
    }
    return false;
  });
}

app.whenReady().then(async () => {
  registerIpcHandlers();
  await bootstrap();
  createTray();
  setupAutoUpdater();

  globalShortcut.register("CommandOrControl+K", () => {
    mainWindow?.webContents.send("princy:command-palette");
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  stopMonorepo();
});
