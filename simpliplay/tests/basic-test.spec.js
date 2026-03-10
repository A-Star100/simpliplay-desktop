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
  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

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
  await window.click('text=Enter a URL')
  await window.fill('#urlInput', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8')
  await window.click('text=Submit')
  await delay(3000);
  
  await window.screenshot({ path: 'played_media.png' }); // do another screenshot to see if playback worked
  // exit
  await electronApp.close();
})();
