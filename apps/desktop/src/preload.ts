import { contextBridge, ipcRenderer } from "electron";

const princyDesktop = {
  onCommandPalette: (cb: () => void) => {
    const listener = () => cb();
    ipcRenderer.on("princy:command-palette", listener);
    return () => {
      ipcRenderer.removeListener("princy:command-palette", listener);
    };
  },
  platform: process.platform
} as const;

contextBridge.exposeInMainWorld("princyDesktop", princyDesktop);
