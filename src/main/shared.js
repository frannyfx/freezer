// Main window
var mainWindow = null;

function getMainWindow() {
	return mainWindow;
}

function setMainWindow(m) {
	mainWindow = m;
}

export default {
	getMainWindow,
	setMainWindow
}