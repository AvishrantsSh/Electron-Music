import { app, BrowserWindow } from 'electron';
import { createTargets } from 'electron-builder';

const MStore = require('../assets/js/mstore.js');

if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

let mainWindow, workerWindow;

const userpref = new MStore({
  configName: 'user-preferences',
  defaults: {
    // 800x600 is the default size of our window
    windowBounds: { width: 1280, height: 720 }
  }
});

const createWindow = () => {
  // Create the browser window.
  let { width, height } = userpref.get('windowBounds');

  mainWindow = new BrowserWindow({
    backgroundColor: '#333',
    width: width,
    height: height,
    minHeight: 720,
    minWidth: 1280,
    frame: false,
    show: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
      webSecurity: false,
    }
  });
  mainWindow.loadURL(`file://${__dirname}/index.html`);

  // Background Task
  // workerWindow = new BrowserWindow({
  //   show: false,
  //   webPreferences: { nodeIntegration: true, contextIsolation: false }
  // });

  // workerWindow.loadFile(`src/worker.html`);


  // Load when content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Storing Resize Info
  mainWindow.on('resize', () => {
    let { width, height } = mainWindow.getBounds();
    // Now that we have them, save them using the `set` method.
    userpref.set('windowBounds', { width, height });
  });

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.on('ready', () => {
  app.allowRendererProcessReuse = true
  createWindow()
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
