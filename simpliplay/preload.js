const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  togglePip: (isPip) => ipcRenderer.send('toggle-pip', isPip),
  onPipItem: (callback) => ipcRenderer.on('pip-item', callback),
  // Add other safe APIs here as needed
  snapshot: () => ipcRenderer.send('snapshot'), // Example for snapshot
});