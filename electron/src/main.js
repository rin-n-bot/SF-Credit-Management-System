import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeDatabase } from './database.js';
import './handlers.js';


// Determine the current file and directory paths
const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectoryPath = path.dirname(currentFilePath);
const clientDevelopmentUrl = 'http://localhost:5173';


// Create the main application window
function createMainWindow() {
  const preloadFilePath = path.join(currentDirectoryPath, 'preload.js');

  console.log('Electron main file:', currentFilePath);
  console.log('Electron directory:', currentDirectoryPath);
  console.log('Electron preload path:', preloadFilePath);

  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: preloadFilePath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error('Failed to load client:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('preload-error', (_, preloadPath, error) => {
    console.error('Failed to load preload script:', preloadPath, error);
  });

  mainWindow.loadURL(clientDevelopmentUrl);
}


// Initialize the app when ready
app.whenReady().then(async () => {
  try {
    await initializeDatabase();
    createMainWindow();
  } catch (error) {
    console.error('Failed to start Electron app:', error);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});