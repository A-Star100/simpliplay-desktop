const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  receive: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)),
});
