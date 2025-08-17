// src/shortcuts.js
const { globalShortcut, dialog, app } = require('electron');
const { getMainWindow } = require('./windowManager');
const { takeSnapshot } = './fileHandler';

let didRegisterShortcuts = false;

const setupShortcuts = () => {
  if (didRegisterShortcuts) return;

  // Quit confirmation
  globalShortcut.register('CommandOrControl+Q', () => {
    const window = getMainWindow();
    if (!window) return;

    dialog.showMessageBox(window, {
      type: 'question',
      buttons: ['Cancel', 'Quit'],
      defaultId: 1,
      title: 'Quit?',
      message: 'Are you sure you want to quit SimpliPlay?',
    }).then(({ response }) => {
      if (response === 1) app.quit();
    });
  });

  // Snapshot shortcuts
  ['CommandOrControl+Shift+S', 'CommandOrControl+S'].forEach(accelerator => {
    globalShortcut.register(accelerator, () => {
      const window = getMainWindow();
      if (window) takeSnapshot();
    });
  });

  didRegisterShortcuts = true;
};

const unregisterShortcuts = () => {
  didRegisterShortcuts = false;
  globalShortcut.unregisterAll();
};

module.exports = {
  setupShortcuts,
  unregisterShortcuts
};