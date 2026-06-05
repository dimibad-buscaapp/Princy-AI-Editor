import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("princyDesktop", {
  onCommandPalette: (cb: () => void) => {
    ipcRenderer.on("princy:command-palette", cb);
  },
  platform: process.platform
});
