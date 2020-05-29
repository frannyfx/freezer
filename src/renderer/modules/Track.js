class Track {
	constructor(track, download) {
		this.id = track.id;
		this.data = track;
		this.progress = 0;
		this.status = !download ? "Idle" : "Done";
		this.downloaded = !!download;
		this.downloadPath = !!download ? download.path : null;	
	}

	updateProgress(progress) {
		this.progress = progress.progress;
		this.status = progress.status;

		if (this.progress == 1) {
			this.downloaded = true;
		}
	}

	download() {
		this.progress = 0;
		this.status = "Downloading";
	}
}

export default Track;