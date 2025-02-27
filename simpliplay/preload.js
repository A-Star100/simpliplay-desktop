const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  receive: (channel, callback) => {
    const validChannels = ["play-media"]; // ✅ Only allow specific, safe channels
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel); // ✅ Prevent duplicate listeners
      ipcRenderer.on(channel, (_event, ...args) => callback(...args));
    }
  },
});
