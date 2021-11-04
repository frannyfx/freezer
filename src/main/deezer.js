// Imports
import { app, remote } from "electron";
import Crypto from "./crypto";
import Axios from "axios";
import Store from "./store";
import fs from "fs";
import path from "path";
import Shared from "./shared";
import {v4 as uuid} from "uuid";
import NodeID3 from "node-id3";

// Enums
const MediaQuality = {
	MP3_128: 1,
	MP3_320: 3,
	FLAC: 9
};

// Consts
const CDN = "https://e-cdns-proxy-{0}.dzcdn.net/mobile/1/";
const downloadPercentage = .5;
const decryptionPercentage = .2;
const artworkPercentage = .2;
const progressUpdateThreshold = 50;

// Downloads in progress
let progressUpdateThrottle = {};

// Decryptions in progerss
let decryptionsInProgress = [];

function sendDownloadProgress(id, progress, status, force = false) {
	// Don't send excessive updates
	if (Date.now() - progressUpdateThrottle[id] < progressUpdateThreshold && progress != 1 && !force)
		return;

	// Send update
	progressUpdateThrottle[id] = Date.now();
	Shared.getMainWindow().webContents.send("download-progress", {
		id: id,
		progress: progress,
		status: status
	});
}

function getArtwork(track) {
	return new Promise(async (resolve, reject) => {
		// Get artwork
		let parentPath = (app || remote.app).getPath("temp");
		let artworkPath = path.join(parentPath, `${track.id}_${uuid()}.jpg`);

		// Download with stream
		try {
			let {data, headers} = await Axios({
				url: `https://e-cdns-images.dzcdn.net/images/cover/${track.album.picture}/500x500-000000-80-0-0.jpg`,
				method: "GET",
				responseType: "stream"
			});

			var downloadedBytes = 0;
			const totalBytes = headers["content-length"];
			const writer = fs.createWriteStream(artworkPath);
			data.pipe(writer);

			data.on("data", (chunk) => {
				// Increment progress
				downloadedBytes += chunk.length;
				sendDownloadProgress(track.id, downloadPercentage + decryptionPercentage + (downloadedBytes / totalBytes) * artworkPercentage, "Downloading artwork");
			});

			data.on("close", () => {
				sendDownloadProgress(track.id, downloadPercentage + decryptionPercentage + artworkPercentage, "Finalising", true);
				resolve(artworkPath);
			});
		} catch (e) {
			return reject(e);
		}
	})
}

function embedArtwork(track, artworkPath, outputPath) {
	return new Promise(resolve => {
		let tags = {
			title: track.title,
			artist: track.artists.reduce((prev, cur, i) => i != track.artists.length - 1 ? prev + cur.name + ", " : prev + cur.name, ""),
			album: track.album.title,
			APIC: artworkPath
		};

		return resolve(NodeID3.write(tags, outputPath));
	});
}

async function decryptionPromise(track, filePath, decryptedPath, outputPath) {
	return new Promise(resolve => {
		console.log(`Decrypting track ${track.id}...`);
		Crypto.initialise(track.id);
		Crypto.decryptTrack(filePath, decryptedPath, async (progress) => {
			sendDownloadProgress(track.id, downloadPercentage + (decryptionPercentage * progress), "Decrypting");

			// Finished decrypting, delete temp file.
			if (progress == 1) {
				resolve();
				await fs.promises.unlink(filePath);

				// Get the artwork
				try {
					console.log(`Retrieving artwork for track ${track.id}...`);
					let artworkPath = await getArtwork(track);
					if (await embedArtwork(track, artworkPath, decryptedPath)) {
						await fs.promises.rename(decryptedPath, outputPath);
						sendDownloadProgress(track.id, 1, "Done");
						console.log(`Download for track ${track.id} complete.`);
						await fs.promises.unlink(artworkPath);
					}
				} catch (e) {
					console.log("Failed to include album art.", e);
				}
				
				delete progressUpdateThrottle[track.id];
			}
		});
	});
}

async function downloadAndDecrypt(track, quality) {
	try {
		// Get URL
		let url = Crypto.getStreamUrl(track.id, CDN, MediaQuality.MP3_128, track.md5, track.version);

		// Get extension
		let extension = quality == MediaQuality.FLAC ? "flac" : "mp3";

		// Get temp folder and a path to save the file
		let parentPath = (app || remote.app).getPath("temp");
		let filePath = path.join(parentPath, `${track.id}_${uuid()}.${extension}`);
		let decryptedPath = path.join(parentPath, `${track.id}_${uuid()}_decrypted.${extension}`);

		// Get output folder
		let downloadsPath = (app || remote.app).getPath("downloads");
		let outputPath = path.join(downloadsPath, `${track.artist.name} - ${track.title} (freezer_${Date.now()}).${extension}`.replace("/", "-"));

		// Start downloading file
		const { data, headers } = await Axios({
			url,
			method: "GET",
			responseType: "stream"
		});

		// Get track length
		var downloadedBytes = 0;
		const totalBytes = headers["content-length"];

		// Throttle download progress
		progressUpdateThrottle[track.id] = 0;

		// Write to stream
		const writer = fs.createWriteStream(filePath);
		data.pipe(writer);

		// Update progress
		data.on("data", (chunk) => {
			// Increment progress
			downloadedBytes += chunk.length;
			sendDownloadProgress(track.id, (downloadedBytes / totalBytes) * downloadPercentage, "Downloading");
		});

		data.on("close", async () => {
			sendDownloadProgress(track.id, (downloadedBytes / totalBytes) * downloadPercentage, "Waiting for crypto");

			// Wait for other decryptions to finish
			await Promise.all(decryptionsInProgress);

			// Create decryption and push immediately
			let decryption = decryptionPromise(track, filePath, decryptedPath, outputPath);
			decryptionsInProgress.push(decryption);

			// Wait for decryption to finish, then remove it
			await decryption;
			decryptionsInProgress.splice(decryptionsInProgress.indexOf(decryption), 1);

			// Store in library
			await Store.push("downloads.library", {
				track: track,
				path: outputPath
			});
		});
	} catch (e) {
		console.log("Something went wrong while downloading & decrypting the track.", e);
		sendDownloadProgress(track.id, 1, "Error");
	}
}

export default {
	MediaQuality,
	downloadAndDecrypt
}