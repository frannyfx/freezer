const state = {
	search: {
		results: {},
		resultIds: []
	}
}
  
const mutations = {
	addTrack(state, track) {
		state.search.results[track.id] = track;
		if (state.search.resultIds.indexOf(track.id) == -1)
			state.search.resultIds.push(track.id);
	},
	updateProgress(state, progress) {
		state.search.results[progress.id].updateProgress(progress);
	}
}

const actions = {
	addTrack(context, track) {
		context.commit("addTrack", track);
	},
	updateProgress(context, progress) {
		context.commit("updateProgress", progress);
	}
}

export default {
	namespaced: true,
	state,
	mutations,
	actions
}
