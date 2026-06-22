js="main.js"
# set devtools to false in webPreferences
sed -i '102s/$/, \n    devTools: false,/' $js
# delete separator and inspect btn
sed -i "/contextMenu.append(new MenuItem({ type: 'separator' }));/,/contextMenu.append(new MenuItem({ label: 'Inspect', click: () => mainWindow.webContents.openDevTools() }));/d" $js
