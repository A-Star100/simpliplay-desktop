const { app, BrowserWindow, Menu, MenuItem, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

let mainWindow;
let pipItem; // Define pipItem
let isPip = false; // Track PiP status

// Create the main window
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

  // Create context menu
  const contextMenu = new Menu();

  // Snapshot functionality
  contextMenu.append(new MenuItem({
    label: 'Take a snapshot',
    click: () => {
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
    }
  }));

  contextMenu.append(new MenuItem({ type: 'separator' }));

  contextMenu.append(new MenuItem({
    label: 'Inspect',
    click: () => {
      mainWindow.webContents.openDevTools();
    }
  }));

  // Set the context menu when right-click is detected
  mainWindow.webContents.on('context-menu', (event, params) => {
    event.preventDefault();
    contextMenu.popup({ window: mainWindow });
  });

  // Modify the default menu (this includes File, Edit, etc.)
  const menu = Menu.getApplicationMenu();

  if (menu) {
    // Find the Help menu and add custom items to it
    const helpMenu = menu.items.find(item => item.label === 'Help');

    if (helpMenu) {
      // Add your custom items
      helpMenu.submenu.append(new MenuItem({
        label: 'Source code',
        click: () => {
          shell.openExternal('https://github.com/A-Star100/simpliplay-desktop'); // Replace with your actual documentation URL
        }
      }));

      helpMenu.submenu.append(new MenuItem({
        label: 'Website',
        click: () => {
          shell.openExternal('https://simpliplay.netlify.app'); // Replace with your actual documentation URL
        }
      }));


      // Add a separator before the quit option (optional)
      helpMenu.submenu.append(new MenuItem({ type: 'separator' }));

      helpMenu.submenu.append(new MenuItem({
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }));
    }
  }

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
