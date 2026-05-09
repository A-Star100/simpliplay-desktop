// if (process.platform === 'linux') {
//   const isWayland = process.argv.some(arg => arg.includes('--ozone-platform=wayland'));
//   if (!isWayland) {
//     process.env.WAYLAND_DISPLAY = '';
//     process.env.XDG_SESSION_TYPE = 'x11';
//   }
// }
const { app, BrowserWindow, Menu, MenuItem, shell, dialog, globalShortcut } = require('electron');
// if (process.platform === 'linux' && !process.argv.some(arg => arg.includes('--ozone-platform=wayland'))) {
//   app.commandLine.appendSwitch('ozone-platform', 'x11');
// }
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pathToFileURL } = require("url");
const { checkForUpdate } = require('./updateChecker');
let gpuAccel = "";
let didRegisterShortcuts = false;
let version = "2.2.1.2"

if (process.platform === 'darwin') {
  if (process.argv.includes('--use-gl')) {
    app.commandLine.appendSwitch('disable-features', 'Metal');
    app.commandLine.appendSwitch('use-gl', 'desktop');
  } 
}

let mainWindow;
if (process.argv.includes('--disable-gpu')) {
  app.disableHardwareAcceleration();
  gpuAccel = "disabled";
}

// handle file open events
app.on('open-file', (event, filePath) => {
  event.preventDefault();
  openFile(filePath);
});

const openFile = (filePath) => {
  app.whenReady().then(() => {
    const fileURL = pathToFileURL(filePath).href;

    if (mainWindow) {
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once("did-finish-load", () => {
          mainWindow.webContents.send("play-media", fileURL);
        });
      } else {
        mainWindow.webContents.send("play-media", fileURL);
      }
    } else {
      createWindow(() => {
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
      nodeIntegration: false, // anyone debugging this: keep this false for security pls
      sandbox: true,
    },
  });

  mainWindow.loadFile("index.html");

  if (process.platform === 'darwin') {
    if (process.argv.includes('--use-gl')) {
      mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.executeJavaScript("navigator.userAgent").then(ua => {
          console.log("User Agent:", ua);
        });

        mainWindow.webContents.executeJavaScript("chrome.loadTimes ? chrome.loadTimes() : {}").then(loadTimes => {
          console.log("GPU Info (legacy):", loadTimes);
        });
      });
    }
  }

  mainWindow.once("ready-to-show", () => {

  if (gpuAccel === "disabled") {
      dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Ok'],
    defaultId: 0,
    title: 'Warning!',
    message: "Disabling GPU acceleration greatly decreases performance and is not recommended, but if you're curious, I don't wanna stop you.",
  });
  } 

    if (onReadyCallback) onReadyCallback();
  });

  setupContextMenu();
};


// set up context menu (if mainWindow's gone nothing will crash here)
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


// set up application menu
const setupMenu = () => {
  const menu = Menu.getApplicationMenu();
  if (!menu) return;

  const fileMenu = menu.items.find(item => item.label === 'File');
  if (fileMenu && !fileMenu.submenu.items.some(item => item.label === 'Take a Snapshot')) {
    fileMenu.submenu.append(new MenuItem({ label: 'Take a Snapshot', accelerator: 'CommandOrControl+Shift+S', click: takeSnapshot }));
  }

  const appMenu = menu.items.find(item => item.label === 'SimpliPlay');

if (appMenu && !appMenu.submenu.items.some(item => item.label === 'Check for Updates')) {
  const submenu = appMenu.submenu;
  const separatorIndex = submenu.items.findIndex(item => item.type === 'separator');

  const updateMenuItem = new MenuItem({
    label: 'Check for Updates',
    accelerator: 'CommandOrControl+Shift+U',
    click: () => checkForUpdate(version)
  });

  if (separatorIndex === -1) {
    // if no separator, just append
    submenu.append(updateMenuItem);
  } else {
    // insert riiiight before the separator
    submenu.insert(separatorIndex, updateMenuItem);
  }
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

    // Check for Updates
  if (!helpMenu.submenu.items.some(item => item.label === 'Check for Updates')) {
    helpMenu.submenu.append(
      new MenuItem({
        label: 'Check for Updates',
        accelerator: 'CommandOrControl+Shift+U',
        click: () => checkForUpdate(version)
      })
    );
  }

    if (!helpMenu.submenu.items.some(item => item.label === 'Quit')) {
      helpMenu.submenu.append(new MenuItem({ type: 'separator' }));
      helpMenu.submenu.append(new MenuItem({ label: 'Quit', click: () => app.quit() }));
    }
  }

const loadedAddons = new Map(); // key: addon filepath, value: MenuItem

const newMenuItems = menu ? [...menu.items] : [];

let addonsMenu;

// check if menu was already created
const existingAddonsMenuItem = newMenuItems.find(item => item.label === 'Add-ons');

if (existingAddonsMenuItem) {
  addonsMenu = existingAddonsMenuItem.submenu;
} else {
  addonsMenu = new Menu();

  addonsMenu.append(new MenuItem({
    label: 'Load Add-on',
    accelerator: 'CommandOrControl+Shift+A',
    click: async () => {
      const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Load Add-on',
        filters: [{ name: 'JavaScript Files', extensions: ['simpliplay'] }],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = path.basename(filePath);
        const fileURL = pathToFileURL(filePath).href;

        // any addons already loaded? check here
        const alreadyLoaded = [...loadedAddons.keys()].some(
          loadedPath => path.basename(loadedPath) === fileName
        );

        if (alreadyLoaded) {
          await dialog.showMessageBox(mainWindow, {
            type: 'error',
            title: `Failed to load an addon`,
            message: `An add-on named "${fileName}" has already been loaded before.`,
            buttons: ['OK']
          });
          return;
        }

        if (!loadedAddons.has(filePath)) {
          mainWindow.webContents.send('load-addon', fileURL);

          const addonMenuItem = new MenuItem({
            label: fileName,
            type: 'checkbox',
            checked: true,
            click: (menuItem) => {
              if (menuItem.checked) {
                fs.access(filePath, (err) => {
                  if (!err) {
                      mainWindow.webContents.send('load-addon', fileURL);
                  } else {
                      dialog.showMessageBox(mainWindow, {
                        type: 'error',
                        title: 'Could not load addon',
                        message: `The add-on "${fileName}" could not be found or doesn't exist anymore, unfortunately.`,
                        buttons: ['OK']
                      }).then(() => {
                        // delay any unchecking to make sure the dialog closes first
                        // and doesn't cause errors...
                      setTimeout(() => {
                          menuItem.checked = false;
                      }, 100);
                      });
                  }
                });

              } else {
                mainWindow.webContents.send('unload-addon', fileURL);
              }
            }
          });

          

          if (!addonsMenu.items.some(item => item.type === 'separator')) {
            addonsMenu.append(new MenuItem({ type: 'separator' }));
          }

          addonsMenu.append(addonMenuItem);
          loadedAddons.set(filePath, addonMenuItem);

          // rebuild menu after changes
          Menu.setApplicationMenu(Menu.buildFromTemplate(newMenuItems));
        }
      }
    }
  }));

addonsMenu.append(new MenuItem({
  label: 'About Addons',
  click: async () => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: 'info',
      buttons: ['OK'],
      defaultId: 0,
      title: 'About Addons',
      message: 'Addons are regular, client-side JavaScript files with the [.simpliplay] extension.',
      detail: 'Addons can do almost anything from adding features to the media player to adding an entire game within the app!'
    });

    if (result.response === 0) {
      console.log('User clicked OK');
      // no need for dialog.closeDialog()
    }
  }
}));

addonsMenu.append(new MenuItem({
  label: 'Store',
  click: () => {
    shell.openExternal("https://simpliplay.netlify.app/addons/")
  }
}));

  newMenuItems.push(new MenuItem({ label: 'Add-ons', submenu: addonsMenu }));

  Menu.setApplicationMenu(Menu.buildFromTemplate(newMenuItems));
}


//Menu.setApplicationMenu(Menu.buildFromTemplate(newMenuItems));


  //Menu.setApplicationMenu(menu);
};

const setupShortcuts = () => {
if (didRegisterShortcuts === false) {
  globalShortcut.register('CommandOrControl+Q', () => {
    const focusedWindow = BrowserWindow.getFocusedWindow(); // get the currently focused window

    if (!focusedWindow) return; // if no window's focused then just quit

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

    const focusedWindow = BrowserWindow.getFocusedWindow(); // get the focused window

    if (!focusedWindow) return; // if no window's focused then just quit

    takeSnapshot();
  });

  globalShortcut.register('CommandOrControl+S', () => {

    const focusedWindow = BrowserWindow.getFocusedWindow(); // Get the current focused window

    if (!focusedWindow) return; // if no window's focused then just quit

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

app.whenReady().then(() => {
  createWindow();
  setupMenu();

  
  mainWindow?.on("focus", () => {
    if (!didRegisterShortcuts) setupShortcuts();
  });

  mainWindow?.on("blur", unregisterShortcuts);

  // Store but delay opening
  const args = process.argv.slice(2);
  const fileArg = args.find(isValidFileArg);

  if (fileArg) {
    app.whenReady().then(() => {
      if (mainWindow) openFileSafely(fileArg);
    });
  }

  app.on("open-file", (event, filePath) => {
    event.preventDefault();
    openFileSafely(filePath);
  });

  if (["win32", "linux"].includes(process.platform)) { 
    if (!app.requestSingleInstanceLock()) {
      app.quit();
    } else {
      app.on("second-instance", (event, argv) => {
        const fileArg = argv.find(isValidFileArg);
        if (fileArg) openFileSafely(fileArg);
      });
    }
  }
});

let hasOpenedFile = false;

function openFileSafely(filePath) {
  if (!hasOpenedFile) {
    hasOpenedFile = true;

    const absPath = path.resolve(filePath); // ensure absolute path

    if (mainWindow?.webContents) {
        const winFileURL = pathToFileURL(filePath).href; // encode path so no special characters cause really bad errors
        mainWindow.webContents.send("play-media", winFileURL);
    }

    setTimeout(() => (hasOpenedFile = false), 1000);
  }
}

function isValidFileArg(arg) {
  if (!arg || arg.startsWith('-') || arg.includes('electron')) return false;

  const resolvedPath = path.resolve(arg);
  if (!fs.existsSync(resolvedPath)) return false;

  // reject known bad extensions
  const badExtensions = ['.exe', '.bat', '.cmd', '.sh', '.msi', '.com', '.vbs', '.ps1', '.jar', '.scr'];
  const ext = path.extname(resolvedPath).toLowerCase();

  return !badExtensions.includes(ext);
}

app.on("window-all-closed", () => {
  globalShortcut.unregisterAll();
  app.quit();
  /* once bug fixed replace above with:
 if (process.platform !== 'darwin') app.quit() */
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
