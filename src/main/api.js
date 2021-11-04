import Axios from "axios";
import Store from "./store";
import https from "https";

async function sendRequest(action = "GET", method, body) {
	// Get Deezer variables
	let apiToken = Store.get("deezer.apiToken");
	let sessionId = Store.get("deezer.sessionId");

	try {
		// Send request
		let response = await Axios.request({
			url: `https://www.deezer.com/ajax/gw-light.php?method=${method}&input=3&api_version=1.0&api_token=${method != "deezer.getUserData" ? apiToken : ""}`,
			headers: {
				Cookie: `sid=${sessionId};`
			},
			method: action,
			data: body,
			httpsAgent: new https.Agent({
				rejectUnauthorized: false
			})
		});
	
		return response;
	} catch (e) {
		console.log(e);
		console.warn("Unable to send Deezer request.", action, method, body);
		return null;
	}
}

async function testConnection() {
	if (Store.get("deezer.sessionId") == null)
		return false;

	let response = await sendRequest("GET", "deezer.getUserData");
	try {
		// Not logged in if UID = 0
		if (response.data.results["USER"]["USER_ID"] == 0) {
			throw new Error("Not logged in.");
		}
			

		let apiToken = response.data.results.checkForm;
		await Store.set("deezer.apiToken", apiToken);
		await Store.set("deezer.loggedIn", true);
		return true;
	} catch (e) {
		await Store.set("deezer.apiToken", "");
		await Store.set("deezer.sessionId", "");
		await Store.set("deezer.loggedIn", false);
		return false;
	}
}

async function sendAutocompleteRequest(query) {
	let response = await sendRequest("POST", "search_getSuggestedQueries", { query });

	// Parse response
	if (response.data.error.length != 0)
		return [];

	// Define an item converter
	let itemConverter = function (item, isHistory) {
		let converted = {
			query: item["QUERY"],
			isHistory
		};

		if (!isHistory) {
			converted.id = item["ITEM_ID"];
			converted.countryRank = item["COUNTRY_RANK"];
			converted.globalRank = item["GLOBAL_RANK"];
			converted.itemType = item["ITEM_TYPE"];
		}

		return converted;
	}

	// Convert the items
	let items = [];
	items.push(...response.data.results["HISTORY"].map(item => itemConverter(item, true)));
	items.push(...response.data.results["SUGGESTION"].map(item => itemConverter(item, false)));
	return items;
}

async function sendSearchRequest(query) {
	let response = await sendRequest("POST", "search.music", {
		query: query,
		filter: "ALL",
		output: "TRACK",
		start: 0,
		nb: 30
	});

	// Define an item converter
	let results = response.data.results.data.map((item) => {
		let converted = {
			id: item["SNG_ID"],
			title: `${item["SNG_TITLE"]} ${item["VERSION"] != undefined ? item["VERSION"] : ""}`.trim(),
			type: item["TYPE"],
			md5: item["MD5_ORIGIN"],
			version: item["MEDIA_VERSION"],
			token: {
				token: item["TRACK_TOKEN"],
				expiry: item["TRACK_TOKEN_EXPIRE"]
			},
			gain: item["GAIN"],
			filesizes: {
				aac_64: item["FILESIZE_AAC_64"],
				mp3_64: item["FILESIZE_MP3_64"],
				mp3_128: item["FILESIZE_MP3_128"],
				mp3_256: item["FILESIZE_MP3_256"],
				mp3_320: item["FILESIZE_MP3_320"],
				flac: item["FILESIZE_FLAC"]
			},
			album: {
				id: item["ALB_ID"],
				picture: item["ALB_PICTURE"],
				title: item["ALB_TITLE"],
				
			},
			artist: {
				id: item["ART_ID"],
				name: item["ART_NAME"],
				picture: item["ART_PICTURE"]
			},
			artists: [],
			duration: item["DURATION"],
			rank: item["RANK_SNG"],
		};

		converted.artists = item["ARTISTS"].map((artist) => {
			return {
				id: artist["ART_ID"],
				order: artist["ARTISTS_SONGS_ORDER"],
				name: artist["ART_NAME"],
				picture: artist["ART_PICTURE"],
				rank: artist["RANK"]
			};
		});

		return converted;
	});

	return results;
}

export default {
	sendAutocompleteRequest,
	sendSearchRequest,
	testConnection
}