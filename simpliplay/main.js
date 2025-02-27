const { app, BrowserWindow, Menu, MenuItem, shell, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require("url");
var didRegisterShortcuts = false;

let mainWindow;

// Handle file opening from Finder or File Explorer
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFile(filePath);
});

const openFile = (filePath) => {
  app.whenReady().then(() => {
    if (mainWindow) {
      const fileURL = pathToFileURL(filePath).href; // ✅ Convert and encode file path
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once("did-finish-load", () => {
          mainWindow.webContents.send("play-media", fileURL);
        });
      } else {
        const fileURL = pathToFileURL(filePath).href; // ✅ Convert and encode file path
        mainWindow.webContents.send("play-media", fileURL);
      }
    } else {
      createWindow(() => {
        const fileURL = pathToFileURL(filePath).href; // ✅ Convert and encode file path
        mainWindow.webContents.send("play-media", fileURL);
      });
    }
  });
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
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false, // Keep this false for security
      sandbox: true,
    },
  });

  mainWindow.loadFile("index.html");

  mainWindow.once("ready-to-show", () => {
    if (onReadyCallback) onReadyCallback();
  });

  setupContextMenu();
};

// Set up context menu (prevents errors if `mainWindow` is undefined)
const setupContextMenu = () => {
  if (!mainWindow) return;

  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({ label: 'Take a Snapshot', click: takeSnapshot }));
  contextMenu.append(new MenuItem({ type: 'separator' }));
  contextMenu.append(new MenuItem({ label: 'Inspect', click: () => mainWindow.webContents.openDevTools() }));

  mainWindow.webContents.on('context-menu', (event) => {
    event.preventDefault();
    contextMenu.popup({ window: mainWindow });
  });
};

// Set up application menu
const setupMenu = () => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const fileMenu = menu.items.find(item => item.label === 'File');
  if (fileMenu && !fileMenu.submenu.items.some(item => item.label === 'Take a Snapshot')) {
    fileMenu.submenu.append(new MenuItem({ label: 'Take a Snapshot', accelerator: 'CommandOrControl+Shift+S', click: takeSnapshot }));
  }

  const helpMenu = menu.items.find(item => item.label === 'Help');
  if (helpMenu) {
    const addMenuItem = (label, url) => {
      if (!helpMenu.submenu.items.some(item => item.label === label)) {
        helpMenu.submenu.append(new MenuItem({ label, click: () => shell.openExternal(url) }));
      }
    };

    addMenuItem('Source Code', 'https://github.com/A-Star100/simpliplay-desktop');
    addMenuItem('Website', 'https://simpliplay.netlify.app');
    addMenuItem('Help Center', 'https://simpliplay.netlify.app/help');

    if (!helpMenu.submenu.items.some(item => item.label === 'Quit')) {
      helpMenu.submenu.append(new MenuItem({ type: 'separator' }));
      helpMenu.submenu.append(new MenuItem({ label: 'Quit', click: () => app.quit() }));
    }
  }

  Menu.setApplicationMenu(menu);
};

const setupShortcuts = () => {
if (didRegisterShortcuts === false) {
  globalShortcut.register('CommandOrControl+Q', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow(); // Get the currently focused window

    if (!focusedWindow) return; // Do nothing if no window is focused

    dialog.showMessageBox(focusedWindow, {
      type: 'question',
      buttons: ['Cancel', 'Quit'],
      defaultId: 1,
      title: 'Quit?',
      message: 'Are you sure you want to quit SimpliPlay?',
    }).then(({ response }) => {
      if (response === 1) app.quit();
    });
  });

  globalShortcut.register('CommandOrControl+Shift+S', () => {

    const focusedWindow = BrowserWindow.getFocusedWindow(); // Get the currently focused window

    if (!focusedWindow) return; // Do nothing if no window is focused

    takeSnapshot();
  });

  globalShortcut.register('CommandOrControl+S', () => {

    const focusedWindow = BrowserWindow.getFocusedWindow(); // Get the currently focused window

    if (!focusedWindow) return; // Do nothing if no window is focused

    takeSnapshot();
  });

  // globalShortcut.register('CommandOrControl+Shift+S', takeSnapshot);
  didRegisterShortcuts = true;
}
};

function unregisterShortcuts() {
  didRegisterShortcuts = false;
  globalShortcut.unregisterAll();
  console.log("Shortcuts unregistered");
}


// App lifecycle management
app.whenReady().then(() => {
  createWindow();
  setupMenu();
  setupShortcuts();

  if (!mainWindow) {
     createWindow(() => {
       console.log("Created window");
      });
  }

  mainWindow.on("focus", () => {
    setupShortcuts(); // setupShortcuts() is an existing function made earlier in the code
  });

  mainWindow.on("blur", () => {
    unregisterShortcuts();
  });


  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    openFile(filePath);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});


app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  app.quit();
  /* once bug fixed replace above with:
 if (process.platform !== 'darwin') app.quit() */
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
