const { app, BrowserWindow, shell } = require('electron');
const path = require('path');
const serve = require('electron-serve');

const loadURL = serve({ directory: path.join(__dirname, 'app-dist') });

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 900,
    minHeight: 600,
    title: 'ProDay',
    backgroundColor: '#070b14',
    icon: path.join(__dirname, 'assets/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
    },
    autoHideMenuBar: true,
    show: false,
  });

  // Charger directement l'application mobile ProDay exportée
  loadURL(mainWindow);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Ouvrir les liens externes dans le navigateur par défaut
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('app://') || url.startsWith('file://')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
