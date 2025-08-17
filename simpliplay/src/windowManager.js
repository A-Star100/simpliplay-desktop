// src/windowManager.js
const { BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const { setupContextMenu } = require('./menuManager');
const { APP_CONSTANTS } = require('./constants');

let mainWindow;

const createWindow = (onReadyCallback) => {
  if (!app.isReady()) {
    app.whenReady().then(() => createWindow(onReadyCallback));
    return;
  }

  if (mainWindow) mainWindow.close();

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, '../preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile('index.html');
  setupWindowHandlers(onReadyCallback);
  return mainWindow;
};

const setupWindowHandlers = (onReadyCallback) => {
  if (!mainWindow) return;

  mainWindow.once('ready-to-show', () => {
    if (APP_CONSTANTS.GPU_ACCEL === 'disabled') {
      showGpuWarning();
    }
    if (onReadyCallback) onReadyCallback();
  });

  setupContextMenu(mainWindow);
};

const showGpuWarning = () => {
  dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['OK'],
    defaultId: 0,
    title: 'Warning!',
    message: "Disabling GPU acceleration greatly decreases performance and is not recommended, but if you're curious, I don't wanna stop you.",
  });
};

const getMainWindow = () => mainWindow;

module.exports = {
  createWindow,
  setupWindowHandlers,
  getMainWindow
};