import { ipcMain, BrowserWindow } from "electron";
import Store from "./store";
import API from "./api";
import path from "path";
import Deezer from "./deezer";

function initialise() {
	ipcMain.on("want-data", async (event, data) => {
		event.sender.send("data", Store.data);
	});

	ipcMain.on("autocomplete", async (event, data) => {
		let result = await API.sendAutocompleteRequest(data.query);
		event.sender.send("autocomplete-response", result);
	});

	ipcMain.on("login", async (event, data) => {
		console.log("User requested to log in.");
		
		let logInWindow = new BrowserWindow({
			width: 500,
			height: 500,
			webPreferences: {
				nodeIntegration: true,
				preload: path.resolve(path.join(__dirname, "../../dist/electron/inject", "login-inject.js"))
			}
		});

		logInWindow.webContents.session.clearStorageData([]);
		logInWindow.loadURL("https://www.deezer.com/en/login");
		logInWindow.webContents.on("did-navigate", async (event, url) => {
			if (url.indexOf("login") == -1) {
				try {
					// Get the cookie.
					let cookies = await logInWindow.webContents.session.cookies.get({
						url: "https://www.deezer.com",
						name: "sid"
					});

					// Ignore invalid cookies.
					if (cookies.length == 0 || cookies[0].name != "sid") {
						console.log("Unable to get SID.");
						return;
					}
	
					// Test cookie and get API token.
					console.log("Testing cookie...");
					Store.set("deezer.sessionId", cookies[0].value);
					if (await API.testConnection()) {
						console.log("Success!");
						logInWindow.close();
						return;
					}
				} catch (e) {
					console.log("Failed to get cookies.", e);
				}
			}
		});
	});

	ipcMain.on("search", async (event, data) => {
		let result = await API.sendSearchRequest(data.query);
		event.sender.send("search-response", result);
	});

	ipcMain.on("download", async (event, data) => {
		console.log(`Downloading track ${data.track.id}...`);
		Deezer.downloadAndDecrypt(data.track, data.quality ? data.quality : Store.get("downloads.quality"));

	});
}

export default {
	initialise
};