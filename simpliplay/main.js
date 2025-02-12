const { app, BrowserWindow, Menu, MenuItem, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;

const takeSnapshot = () => {
  mainWindow.webContents.capturePage().then(image => {
    const png = image.toPNG();
    const snapshotsDir = path.join(os.homedir(), 'simpliplay-snapshots');
    fs.mkdirSync(snapshotsDir, { recursive: true });
    const filePath = path.join(snapshotsDir, `snapshot-${Date.now()}.png`);
    fs.writeFileSync(filePath, png);
    shell.openPath(path.dirname(filePath));
  }).catch(error => {
    console.error("Error capturing snapshot:", error);
    dialog.showErrorBox("Snapshot Error", "Failed to capture snapshot: " + error.message);
  });
};

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  mainWindow.loadFile('index.html');

  // Register global shortcuts
  globalShortcut.register('CommandOrControl+Shift+S', takeSnapshot);
  globalShortcut.register('CommandOrControl+Shift+I', () => {
    mainWindow.webContents.openDevTools();
  });

  // Modify the default menu
  const menu = Menu.getApplicationMenu();
  if (menu) {
    // Add "Take a Snapshot" to File menu
    const fileMenu = menu.items.find(item => item.label === 'File');
    if (fileMenu) {
      const snapshotItemExists = fileMenu.submenu.items.some(item => item.label === 'Take a Snapshot');
      if (!snapshotItemExists) {
        fileMenu.submenu.append(new MenuItem({
          label: 'Take a Snapshot',
          accelerator: 'CommandOrControl+Shift+S',
          click: takeSnapshot
        }));
      }
    }

    // Add new items to Help menu without removing existing ones
    const helpMenu = menu.items.find(item => item.label === 'Help');
    if (helpMenu) {
      const existingLabels = helpMenu.submenu.items.map(item => item.label);
      
      if (!existingLabels.includes('Source Code')) {
        helpMenu.submenu.append(new MenuItem({
          label: 'Source Code',
          click: () => {
            shell.openExternal('https://github.com/A-Star100/simpliplay-desktop');
          }
        }));
      }

      if (!existingLabels.includes('Website')) {
        helpMenu.submenu.append(new MenuItem({
          label: 'Website',
          click: () => {
            shell.openExternal('https://simpliplay.netlify.app');
          }
        }));
      }

      if (!existingLabels.includes('Help Center')) {
        helpMenu.submenu.append(new MenuItem({
          label: 'Help Center',
          click: () => {
            shell.openExternal('https://simpliplay.netlify.app/help');
          }
        }));
      }

      if (!existingLabels.includes('Quit')) {
        helpMenu.submenu.append(new MenuItem({ type: 'separator' }));
        helpMenu.submenu.append(new MenuItem({
          label: 'Quit',
          click: () => {
            app.quit();
          }
        }));
      }
    }
  }

  // Create context menu
  const contextMenu = new Menu();

  const inspectItemExists = contextMenu.items.some(item => item.label === 'Inspect');
  if (!inspectItemExists) {
    contextMenu.append(new MenuItem({ type: 'separator' }));
    contextMenu.append(new MenuItem({
      label: 'Inspect',
      click: () => {
        mainWindow.webContents.openDevTools();
      }
    }));
  }

  mainWindow.webContents.on('context-menu', (event, params) => {
    event.preventDefault();
    contextMenu.popup({ window: mainWindow });
  });

  // Set the updated application menu
  Menu.setApplicationMenu(menu);
};

// Handle window events and app lifecycle
app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
