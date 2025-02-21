const { app, BrowserWindow, Menu, MenuItem, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

// Handle file opening from Finder or File Explorer
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFile(filePath);
});

// Open files using the existing window (or create a new one if needed)
const openFile = (filePath) => {
  if (mainWindow) {
    mainWindow.webContents.send("play-media", filePath);
  } else {
    createWindow(() => {
      mainWindow.webContents.send("play-media", filePath);
    });
  }
};

const takeSnapshot = async () => {
  if (!mainWindow) return;

  try {
    const image = await mainWindow.webContents.capturePage();
    const png = image.toPNG();
    const snapshotsDir = path.join(os.homedir(), 'simpliplay-snapshots');
    fs.mkdirSync(snapshotsDir, { recursive: true });
    const filePath = path.join(snapshotsDir, `snapshot-${Date.now()}.png`);
    fs.writeFileSync(filePath, png);

    const { response } = await dialog.showMessageBox({
      type: 'info',
      title: 'Snapshot Saved',
      message: `Snapshot saved to:\n${filePath}`,
      buttons: ['OK', 'Open File'],
      defaultId: 0,
    });

    if (response === 1) {
      shell.openPath(filePath);
    }
  } catch (error) {
    console.error("Error capturing snapshot:", error);
    dialog.showErrorBox("Snapshot Error", `Failed to capture snapshot: ${error.message}`);
  }
};

const createWindow = (onReadyCallback) => {
  if (mainWindow) {
    mainWindow.close();
    mainWindow = null;
  }

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  mainWindow.webContents.once("did-finish-load", () => {
    if (onReadyCallback) onReadyCallback();
  });

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+S', takeSnapshot);
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.openDevTools();
  });

  // Modify the default menu
  const menu = Menu.getApplicationMenu();
  if (menu) {
    const fileMenu = menu.items.find(item => item.label === 'File');
    if (fileMenu && !fileMenu.submenu.items.some(item => item.label === 'Take a Snapshot')) {
      fileMenu.submenu.append(new MenuItem({
        label: 'Take a Snapshot',
        accelerator: 'CommandOrControl+Shift+S',
        click: takeSnapshot
      }));
    }

    const helpMenu = menu.items.find(item => item.label === 'Help');
    if (helpMenu) {
      const existingLabels = helpMenu.submenu.items.map(item => item.label);

      const addMenuItem = (label, url) => {
        if (!existingLabels.includes(label)) {
          helpMenu.submenu.append(new MenuItem({
            label,
            click: () => shell.openExternal(url)
          }));
        }
      };

      addMenuItem('Source Code', 'https://github.com/A-Star100/simpliplay-desktop');
      addMenuItem('Website', 'https://simpliplay.netlify.app');
      addMenuItem('Help Center', 'https://simpliplay.netlify.app/help');

      if (!existingLabels.includes('Quit')) {
        helpMenu.submenu.append(new MenuItem({ type: 'separator' }));
        helpMenu.submenu.append(new MenuItem({
          label: 'Quit',
          click: () => app.quit(),
        }));
      }
    }
  }

  // Create context menu
  const contextMenu = new Menu();
  if (!contextMenu.items.some(item => item.label === 'Take a Snapshot')) {
    contextMenu.append(new MenuItem({
      label: 'Take a Snapshot',
      click: takeSnapshot
    }));
  }

  if (!contextMenu.items.some(item => item.label === 'Inspect')) {
    contextMenu.append(new MenuItem({ type: 'separator' }));
    contextMenu.append(new MenuItem({
      label: 'Inspect',
      click: () => mainWindow.webContents.openDevTools()
    }));
  }

  mainWindow.webContents.on('context-menu', (event, params) => {
    event.preventDefault();
    contextMenu.popup({ window: mainWindow });
  });

  Menu.setApplicationMenu(menu);
};

app.whenReady().then(() => {
  createWindow();

  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    openFile(filePath);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
