import { app, BrowserWindow, Tray, Menu, globalShortcut, nativeImage } from "electron";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { setupAutoUpdater } from "./updater.js";

const FRONTEND_PORT = Number(process.env.PRINCY_FRONTEND_PORT ?? 3400);
const FRONTEND_URL = `http://127.0.0.1:${FRONTEND_PORT}`;
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let monorepoProc: ChildProcess | null = null;

function startMonorepo() {
  const root = path.resolve(__dirname, "../../..");
  monorepoProc = spawn("npm", ["run", "start"], {
    cwd: root,
    shell: true,
    stdio: "ignore",
    env: { ...process.env, FORCE_COLOR: "0" }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    backgroundColor: "#0a0518",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadURL(FRONTEND_URL);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = nativeImage.createEmpty();
  tray = new Tray(icon);
  tray.setToolTip("Princy AI Editor");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Abrir Princy", click: () => mainWindow?.show() },
      { label: "Sair", click: () => app.quit() }
    ])
  );
}

app.whenReady().then(() => {
  startMonorepo();
  createWindow();
  createTray();
  setupAutoUpdater();
  globalShortcut.register("CommandOrControl+K", () => {
    mainWindow?.webContents.send("princy:command-palette");
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
  monorepoProc?.kill();
});
