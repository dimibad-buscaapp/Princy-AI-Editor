import { contextBridge, ipcRenderer } from "electron";

const princyDesktop = {
  onCommandPalette: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on("princy:command-palette", listener);
    return () => {
      ipcRenderer.removeListener("princy:command-palette", listener);
    };
  },
  onRetry: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on("princy:retry", listener);
    return () => {
      ipcRenderer.removeListener("princy:retry", listener);
    };
  },
  retry: () => {
    ipcRenderer.send("princy:retry");
  },
  openLogs: () => ipcRenderer.invoke("princy:open-logs") as Promise<boolean>,
  platform: process.platform
} as const;

contextBridge.exposeInMainWorld("princyDesktop", princyDesktop);
