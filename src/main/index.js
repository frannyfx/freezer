// Imports
import { app, BrowserWindow, ipcMain } from 'electron';
import Store from "./store";
import API from "./api";
import Shared from "./shared";

// Modules
import EventHandler from "./event-handler";
import shared from './shared';

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = require('path').join(__dirname, '/static').replace(/\\/g, '\\\\');
}

let mainWindow;
const winURL = process.env.NODE_ENV === 'development' ? `http://localhost:9080` : `file://${__dirname}/index.html`;

function createWindow () {
	// Create main window and load URL.
	mainWindow = new BrowserWindow({
		title: "Freezer",
		titleBarStyle: "hiddenInset",
		width: 700,
		height: 450,
		useContentSize: true,
		resizable: false,
		webPreferences: {
			nodeIntegration: true
		}
	});

	mainWindow.loadURL(winURL);

	// Set the main window.
	shared.setMainWindow(mainWindow);

	// Handle close.
	mainWindow.on('closed', () => {
		mainWindow = null
	});
}

app.on('ready', async () => {
	// Load settings
	await Store.load();

	// Initialise API
	await API.testConnection();

	// Create the window.
	createWindow();

	// Initialise event handler.
	EventHandler.initialise();
});

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



/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
