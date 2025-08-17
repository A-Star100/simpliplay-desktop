// src/menuManager.js
const { Menu, MenuItem, shell, dialog } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const { getMainWindow } = require('./windowManager');
const { checkForUpdate } = require('./updateChecker');
const { APP_CONSTANTS } = require('./constants');
const { takeSnapshot } = require('./fileHandler');

const loadedAddons = new Map();

const setupMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        { 
          label: 'Take a Snapshot', 
          accelerator: 'CommandOrControl+Shift+S', 
          click: takeSnapshot 
        }
      ]
    },
    {
      label: 'Add-ons',
      submenu: [
        {
          label: 'Load Add-on',
          accelerator: 'CommandOrControl+Shift+A',
          click: handleLoadAddon
        },
        { type: 'separator' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        { 
          label: 'Source Code', 
          click: () => shell.openExternal('https://github.com/A-Star100/simpliplay-desktop') 
        },
        { 
          label: 'Website', 
          click: () => shell.openExternal('https://simpliplay.netlify.app') 
        },
        { 
          label: 'Help Center', 
          click: () => shell.openExternal('https://simpliplay.netlify.app/help') 
        },
        { type: 'separator' },
        { 
          label: 'Check for Updates', 
          accelerator: 'CommandOrControl+Shift+U',
          click: () => checkForUpdate(APP_CONSTANTS.VERSION)
        },
        { type: 'separator' },
        { 
          label: 'Quit', 
          click: () => app.quit() 
        }
      ]
    }
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'SimpliPlay',
      submenu: [
        { 
          label: 'Check for Updates', 
          accelerator: 'CommandOrControl+Shift+U',
          click: () => checkForUpdate(APP_CONSTANTS.VERSION)
        }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  return menu;
};

const setupContextMenu = (window) => {
  const contextMenu = new Menu();
  contextMenu.append(new MenuItem({ 
    label: 'Take a Snapshot', 
    click: takeSnapshot 
  }));
  contextMenu.append(new MenuItem({ type: 'separator' }));
  contextMenu.append(new MenuItem({ 
    label: 'Inspect', 
    click: () => window.webContents.openDevTools() 
  }));

  window.webContents.on('context-menu', (event) => {
    event.preventDefault();
    contextMenu.popup({ window });
  });
};

const handleLoadAddon = async () => {
  const mainWindow = getMainWindow();
  if (!mainWindow) return;

  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Load Add-on',
    filters: [{ name: 'JavaScript Files', extensions: ['simpliplay'] }],
    properties: ['openFile'],
  });

  if (result.canceled || result.filePaths.length === 0) return;

  const filePath = result.filePaths[0];
  const fileName = path.basename(filePath);
  const fileURL = pathToFileURL(filePath).href;

  if ([...loadedAddons.keys()].some(p => path.basename(p) === fileName)) {
    await dialog.showMessageBox(mainWindow, {
      type: 'error',
      title: 'Could not load addon',
      message: `An add-on named "${fileName}" has already been loaded.`,
      buttons: ['OK']
    });
    return;
  }

  if (!loadedAddons.has(filePath)) {
    mainWindow.webContents.send('load-addon', fileURL);
    addAddonToMenu(filePath, fileName, fileURL);
  }
};

const addAddonToMenu = (filePath, fileName, fileURL) => {
  const menu = Menu.getApplicationMenu();
  const addonsMenu = menu.items.find(item => item.label === 'Add-ons')?.submenu;
  if (!addonsMenu) return;

  const addonItem = new MenuItem({
    label: fileName,
    type: 'checkbox',
    checked: true,
    click: createAddonClickHandler(filePath, fileName, fileURL)
  });

  addonsMenu.append(addonItem);
  loadedAddons.set(filePath, addonItem);
};

const createAddonClickHandler = (filePath, fileName, fileURL) => {
  return async (menuItem) => {
    const mainWindow = getMainWindow();
    if (!mainWindow) return;

    if (menuItem.checked) {
      fs.access(filePath, (err) => {
        if (err) {
          handleAddonError(mainWindow, fileName);
          menuItem.checked = false;
          return;
        }
        mainWindow.webContents.send('load-addon', fileURL);
      });
    } else {
      mainWindow.webContents.send('unload-addon', fileURL);
    }
  };
};

const handleAddonError = async (window, fileName) => {
  await dialog.showMessageBox(window, {
    type: 'error',
    title: 'Could not load addon',
    message: `The add-on "${fileName}" could not be found or doesn't exist anymore.`,
    buttons: ['OK']
  });
};

module.exports = {
  setupMenu,
  setupContextMenu,
  loadedAddons
};