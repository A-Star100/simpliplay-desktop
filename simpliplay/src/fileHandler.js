// src/fileHandler.js
const { dialog, shell, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { APP_CONSTANTS } = require('./constants');

let hasOpenedFile = false;

const takeSnapshot = async () => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow) return;

  try {
    const image = await mainWindow.webContents.capturePage();
    const png = image.toPNG();
    
    fs.mkdirSync(APP_CONSTANTS.SNAPSHOTS_DIR, { recursive: true });
    const filePath = path.join(APP_CONSTANTS.SNAPSHOTS_DIR, `snapshot-${Date.now()}.png`);
    fs.writeFileSync(filePath, png);

    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Snapshot Saved',
      message: `Snapshot saved to:\n${filePath}`,
      buttons: ['OK', 'Open File'],
      defaultId: 0,
    });

    if (response === 1) shell.openPath(filePath);
  } catch (error) {
    dialog.showErrorBox("Snapshot Error", `Failed to capture snapshot: ${error.message}`);
  }
};

const openFile = (filePath) => {
  const mainWindow = BrowserWindow.getFocusedWindow();
  if (!mainWindow) return;

  const fileURL = pathToFileURL(filePath).href;
  
  if (mainWindow.webContents.isLoading()) {
    mainWindow.webContents.once("did-finish-load", () => {
      mainWindow.webContents.send("play-media", fileURL);
    });
  } else {
    mainWindow.webContents.send("play-media", fileURL);
  }
};

const openFileSafely = (filePath) => {
  if (hasOpenedFile) return;
  hasOpenedFile = true;

  const absPath = path.resolve(filePath);
  if (isValidFileArg(absPath)) {
    const winFileURL = pathToFileURL(absPath).href;
    const mainWindow = BrowserWindow.getFocusedWindow();
    if (mainWindow?.webContents) {
      mainWindow.webContents.send("play-media", winFileURL);
    }
  }

  setTimeout(() => { hasOpenedFile = false; }, 1000);
};

const isValidFileArg = (arg) => {
  if (!arg || arg.startsWith('-') || arg.includes('electron')) return false;

  const resolvedPath = path.resolve(arg);
  if (!fs.existsSync(resolvedPath)) return false;

  const ext = path.extname(resolvedPath).toLowerCase();
  return !APP_CONSTANTS.BAD_FILE_EXTENSIONS.includes(ext);
};

const handleFileOpen = () => {
  const args = process.argv.slice(2);
  const fileArg = args.find(isValidFileArg);

  if (fileArg) {
    app.whenReady().then(() => {
      openFileSafely(fileArg);
    });
  }

  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    openFileSafely(filePath);
  });

  if (['win32', 'linux'].includes(process.platform)) {
    if (!app.requestSingleInstanceLock()) {
      app.quit();
    } else {
      app.on('second-instance', (event, argv) => {
        const fileArg = argv.find(isValidFileArg);
        if (fileArg) openFileSafely(fileArg);
      });
    }
  }
};

module.exports = {
  takeSnapshot,
  openFile,
  openFileSafely,
  isValidFileArg,
  handleFileOpen
};