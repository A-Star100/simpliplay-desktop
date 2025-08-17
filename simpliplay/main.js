// main.js
const { app } = require('electron');
const { createWindow, setupWindowHandlers } = require('./src/windowManager');
const { setupMenu } = require('./src/menuManager');
const { setupShortcuts, unregisterShortcuts } = require('./src/shortcuts');
const { handleFileOpen } = require('./src/fileHandler');
const { APP_CONSTANTS } = require('./src/constants');

// Handle GPU acceleration
if (process.argv.includes('--disable-gpu')) {
  app.disableHardwareAcceleration();
  APP_CONSTANTS.GPU_ACCEL = 'disabled';
}

// macOS-specific GL handling
if (process.platform === 'darwin' && process.argv.includes('--use-gl')) {
  app.commandLine.appendSwitch('disable-features', 'Metal');
  app.commandLine.appendSwitch('use-gl', 'desktop');
}

// App event handlers
app.whenReady().then(() => {
  createWindow();
  setupMenu();
  setupShortcuts();
  handleFileOpen();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    unregisterShortcuts();
    app.quit();
  }
});

app.on('will-quit', unregisterShortcuts);
