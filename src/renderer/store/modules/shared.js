const state = {
  deezer: {
    loggedIn: false,
    sessionId: "",
    apiToken: ""
  },
  downloads: {
    quality: 1,
    directory: null,
    library: {},
    libraryIds: []
  }
}

const mutations = {
  setLoginData(state, deezer) {
    state.deezer.loggedIn = deezer.loggedIn;
    state.deezer.sessionId = deezer.sessionId;
    state.deezer.apiToken = deezer.apiToken;
  },
  setDownloads(state, downloads) {
    state.downloads.quality = downloads.quality;
    state.downloads.directory = downloads.directory;

    // Handle library
    state.downloads.library = {};
    downloads.library.map(download => state.downloads.library[download.track.id] = download);
    state.downloads.libraryIds = downloads.library.map(download => download.track.id);
  }
}

const actions = {
  setData(context, newData) {
    if (newData.deezer != undefined) {
      console.log(newData.downloads.library);
      context.commit("setLoginData", newData.deezer);
      context.commit("setDownloads", newData.downloads);
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
