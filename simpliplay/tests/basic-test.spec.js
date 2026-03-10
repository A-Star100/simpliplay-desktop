const { _electron: electron } = require('playwright');

(async () => {
  // launch
  const electronApp = await electron.launch({ 
    args: [
      'main.js', 
      '--no-sandbox', 
      '--disable-setuid-sandbox', 
      '--disable-gpu'
    ] 
  });

  // do evaluation expression in the context of electron
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // runs in main Electron
    return app.getAppPath();
  });
  console.log(appPath);

  // get first window
  const window = await electronApp.firstWindow();
  // print its title
  console.log(await window.title());
  // do a screenshot
  await window.screenshot({ path: 'intro.png' });
  // direct electron console to node terminal.
  window.on('console', console.log);
  // click a button
  // TODO: change this later
  await window.click('text=Go back');
  await window.screenshot({ path: 'clicked_back.png' }); // do another screenshot to see if button click worked
  // exit
  await electronApp.close();
})();
