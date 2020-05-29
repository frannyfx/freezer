import { app, remote, ipcMain } from "electron";
import path from "path";
import { promises as fs } from "fs";
import Defaults from "./config.default.json";
import Shared from "./shared";

class Store {
	constructor() {
		let dataPath = (app || remote.app).getPath("appData");
		this.path = path.join(dataPath, "freezer-settings.json");
		this.data = {};
	}

	get(key) {
		try {
			let domains = key.split(".");
			var current = this.data;
			for (var i = 0; i < domains.length; i++) {
				current = current[domains[i]];
			}

			return current;
		} catch (e) {
			return null;
		}
	}

	async push(key, value) {
		let current = this.get(key);
		if (current == null || !Array.isArray(current))
			return false;

		current.push(value);
		await this.write();
	}

	async set(key, val) {
		let domains = key.split(".");
		var current = this.data;
		try {
			for (var i = 0; i < domains.length; i++) {
				if (current[domains[i]] == undefined)
					current[domains[i]] = {};
	
				// Last domain
				if (i == domains.length - 1) {
					current[domains[i]] = val;
				}
	
				current = current[domains[i]];
			}
		} catch (e) {
			console.warn("Unable to write property.");
		}
		
		await this.write();
	}

	async load() {
		try {
			this.data = JSON.parse(await fs.readFile(this.path));
		} catch (e) {
			this.data = Defaults;
		}
	}

	async write() {
		try {
			// Tell renderer data is updated.
			let mainWindow = Shared.getMainWindow();
			if (mainWindow) mainWindow.webContents.send("data", this.data);

			// Write to disk.
			await fs.writeFile(this.path, JSON.stringify(this.data, null, 4));
		} catch (e) {
			console.error("Unable to write config file.", this.path, e);
		}
	}
}

// Instance
let store = new Store();

// Export singleton instance
export default store;