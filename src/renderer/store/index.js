import Vue from 'vue'
import Vuex from 'vuex'

import { createPersistedState, createSharedMutations } from 'vuex-electron'

import shared from './modules/shared'
import tracks from './modules/tracks'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    shared,
    tracks
  },
  plugins: [

  ],
  strict: process.env.NODE_ENV !== 'production'
})
