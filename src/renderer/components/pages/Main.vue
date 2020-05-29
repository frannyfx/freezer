<template>
  <div class="wrapper">
    <!-- Search bar -->
    <div class="search-bar" :class="{'with-results': search.autocompleteItems.length != 0}">
      <div class="text-field">
        <input ref="searchbar" type="text" placeholder="Search for songs..." v-model="search.query"
          @input="autocomplete"
          @keydown="searchKeyDown"
          @blur="searchFieldBlur"
          @focus="searchFieldFocus">
      </div>
      <div class="results">
        <transition-group name="scale">
          <div class="item" v-for="(item, index) in search.autocompleteItems" :key="item.query" :class="{'selected': index == search.selectedAutocompleteIndex, 'visible': search.fieldFocused}" @click="() => selectAutocomplete(item.query)">
            <!--<font-awesome-icon :icon="item.isHistory ? 'history' : 'chevron-right'" :class="{invisible: !item.isHistory}"/>-->
            <span>{{item.query}}</span>
            <!--<font-awesome-icon :icon="item.isHistory ? 'history' : 'chevron-right'" class="invisible"/>-->
          </div>
        </transition-group>
      </div>
    </div>
    <!-- Search results -->
    <div class="search-results" :class="{'no-results': search.results.length == 0}">
      <transition name="fade">
        <div class="no-results" v-show="search.results.length == 0">
          <font-awesome-icon icon="search"/>
          <span>Nothing to see here.</span>
        </div>
      </transition>
      <transition-group name="scale">
        <div class="item" v-for="item in search.results" :key="item.id">
          <div class="background">
            <div class="image" :style="{ backgroundImage: `url('https://e-cdns-images.dzcdn.net/images/cover/${item.data.album.picture}/50x50-000000-80-0-0.jpg')`}"></div>
          </div>
          <div class="info">
            <img class="cover-art" :src="`https://e-cdns-images.dzcdn.net/images/cover/${item.data.album.picture}/50x50-000000-80-0-0.jpg`">
            <div class="details">
              <span class="title">{{item.data.title}}</span>
              <span class="artists">
                <span v-for="(artist, index) in item.data.artists" :key="artist.id">
                  {{artist.name}}{{index != item.data.artists.length - 1 ? ", " : ""}}
                </span>
              </span>
            </div>
            <transition name="fade">
              <div class="progress" v-show="item.status != 'Idle' && item.status != 'Done' && item.status != 'Error'">
                <div class="bar">
                  <div class="value" :style="{'width': `${Math.floor(item.progress * 100)}%`}"></div>
                </div>
                <span class="status">{{item.status}}{{item.status != "Done" && item.status != "Error" ? ` (${Math.floor(item.progress * 100)}%)...` : "."}}</span>
              </div>
            </transition>
            <div class="actions">
              <div class="button" @click="() => download(item)" :class="{'disabled': item.status != 'Idle'}">
                <font-awesome-icon :icon="item.status == 'Idle' ? 'download' : item.status == 'Done' ? 'check' : item.status == 'Error' ? 'exclamation-triangle' : 'sync-alt'" :spin="item.status != 'Idle' && item.status != 'Done' && item.status != 'Error'"/>
              </div>
            </div>
          </div>
        </div>
      </transition-group>
    </div>
  </div>
</template>
<script>
import { ipcRenderer } from "electron";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";
import Track from "../../modules/Track";

export default {
  name: 'Main',
  components: { FontAwesomeIcon },
  data: () => {
    return {
      search: {
        query: "",
        fieldFocused: false,
        autocompleteItems: [],
        selectedAutocompleteIndex: -1,
        queryBeforeSelecting: null,
        results: []
      }
    };
  }, 
	methods: {
    searchFieldFocus() {
      this.search.fieldFocused = true;
    },
    searchFieldBlur() {
      this.search.fieldFocused = false;
    },
    async performSearch() {
      if (this.search.query.trim().length == 0) {
        this.search.results.splice(0, this.search.results.length);
        return;
      }

      console.log("Searching for", this.search.query);
      ipcRenderer.send("search", { query: this.search.query });
    },
    async autocomplete() {
      // Clear list and don't request if the length of the input is zero.
      if (this.search.query.trim().length == 0) {
        this.search.autocompleteItems = [];
        return;
      }

      // Reset selected item
      this.search.selectedAutocompleteIndex = -1;
      
      // Send autocomplete request over IPC.
      ipcRenderer.send("autocomplete", {
        query: this.search.query
      });
    },
    searchKeyDown(e) {
      switch (e.code) {
        case "Enter":
          console.log("Searching...");
          this.search.selectedAutocompleteIndex = -1;
          this.$refs.searchbar.blur();
          this.performSearch();
          return;
        case "ArrowUp":
          e.preventDefault();
          this.search.selectedAutocompleteIndex--;
          if (this.search.selectedAutocompleteIndex < -1) {
            this.search.selectedAutocompleteIndex = this.search.autocompleteItems.length - 1;
          }
          break;
        case "ArrowDown":
          e.preventDefault();
          if (this.search.selectedAutocompleteIndex == -1) {
            this.search.queryBeforeSelecting = this.search.query;
          }

          this.search.selectedAutocompleteIndex++;
          if (this.search.selectedAutocompleteIndex >= this.search.autocompleteItems.length) {
            this.search.selectedAutocompleteIndex = -1;
          }
          break;
        default:
          return;
      }

      if (this.search.selectedAutocompleteIndex > -1 && this.search.selectedAutocompleteIndex < this.search.autocompleteItems.length) {
        this.search.query = this.search.autocompleteItems[this.search.selectedAutocompleteIndex].query;
      } else {
        this.search.query = this.search.queryBeforeSelecting;
      }
    },
    download(item) {
      console.log("Downloading track", item.id);
      ipcRenderer.send("download", {
        track: item.data
      });

      item.download();
    },
    selectAutocomplete(query) {
      this.search.query = query;
      this.performSearch();
    }
  },
  mounted: function () {
    // Handle response.
    ipcRenderer.on("autocomplete-response", (event, data) => {
      this.search.autocompleteItems = data.slice(0, 4);
    });

    ipcRenderer.on("search-response", (event, data) => {
      this.search.results = data.map(track => new Track(track, this.$store.state.shared.downloads.library[track.id] != undefined ? this.$store.state.shared.downloads.library[track.id] : null));
    });

    ipcRenderer.on("download-progress", (event, progress) => {
      this.search.results.filter((result) => result.id == progress.id)[0].updateProgress(progress);
    });
  }
}
</script>
<style lang="scss" scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;

  box-sizing: border-box;

  overflow-y: auto;
  overflow-x: hidden;

  background-color: #444;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }
}

.search-bar {
  position: fixed;
  z-index: 1001;

  top: 10px; right: 10px;

  display: flex;
  flex-direction: column;
  align-items: stretch;
  cursor: text;

  background-color: rgba(black, 0.3);
  border-radius: 18px;
  
  width: 250px;

  transition: border-radius 0.3s;
  overflow: hidden;

  .text-field {
    display: flex;
    flex-direction: row;
    align-items: center;

    padding: 8px 20px;

    svg {
      color: #bbb;
      margin-right: 15px;
    }

    input {
      color: white;
      background-color: transparent;
      border: none;
      outline: none;
      font-size: 0.8em;
      flex-grow: 1;
      text-align: center;
      padding: 0;
    }
  }

  .results {
    .item {
      color: white;
     
      line-height: 50px;
      text-align: center;
      font-size: 0.8em;
      cursor: pointer;

      height: 50px;
      opacity: 1;

      text-overflow: ellipsis;
      width: 100%;
      overflow: hidden;
      white-space: nowrap;
      padding: 0px 30px;
      box-sizing: border-box;

      transition: height 0.4s, opacity 0.4s, background-color 0.3s;
      /*display: flex;
      align-items: center;
      justify-content: space-between;

      svg {
        font-size: 1.1em;
        color: #ccc;
      }

      svg.invisible {
        opacity: 0;
      }*/

      &:hover, &.selected {
        background-color: rgba(white, 0.2);
      }


      &.scale-enter, &.scale-leave-to, &:not(.visible) {
        height: 0;
        opacity: 0;
      }

      &.scale-enter-to, &.scale-leave {
        height: 50px;
        opacity: 1;
      }
    }
  }
}

.search-results {
  padding-top: 50px;
  flex-grow: 1;

  width: 100%;

  .no-results {
    top: 0px; left: 0; right: 0; bottom: 0;
    position: absolute;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    svg {
      font-size: 3em;
      margin-bottom: 20px;
    }

    span {
      color: rgba(white, 0.5);
      font-size: 0.9em;
    }

    &.fade-enter-active {
      transition: transform 0.6s, opacity 0.6s;
    }

    &.fade-leave-active {
      transition: transform 0.3s, opacity 0.3s;
    }

    &.fade-enter, &.fade-leave-to {
      transform: scale(0);
      opacity: 0;
    }

    &.fade-enter-to, &.fade-leave {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  .item {
    position: relative;

    height: 80px;
    overflow: hidden;

    transition: height 0.4s, opacity 0.4s;

    &.scale-enter, &.scale-leave-to {
      height: 0;
      opacity: 0;
    }

    &.scale-enter-to, &.scale-leave {
      height: 80px;
      opacity: 1;
    }

    &:hover {
      .background {
        opacity: 1;
      }
    }

    .background {
      .image {
        filter: blur(30px) saturate(170%);
        width: 100%;
        height: 100%;
        background-size: cover;
        background-position: center;
      }

      opacity: 0.7;
      transform: scale(1.5);
      transition: opacity 0.3s;

      top: 0;
      right: 0;
      left: 0;
      bottom: 0;
      position: absolute;
    }

    .info {
      top: 0;
      right: 0;
      left: 0;
      bottom: 0;

      position: absolute;
      display: flex;
      flex-direction: row;
      align-items: center;
      padding: 10px 30px;

      .cover-art {
        border-radius: 5px;
        margin-right: 20px;
        box-shadow: 0px 0px 10px rgba(black, 0.1);
      }

      .details {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        
        .title {
          font-weight: 600;
          text-shadow: 0px 1px rgba(black, 0.1);
        }
        
        .artists {
          font-weight: 400;
          color: rgba(white, 0.8);
          font-size: 0.8em;
        }
      }

      .progress {
        display: flex;
        flex-direction: column;
        justify-content: center;
        
        .bar {
          width: 150px;
          height: 5px;
          background-color: #aaa;
          border-radius: 5px;
          overflow: hidden;

          .value {
            transition: width 0.5s;
            height: 100%;
            background-color: white;
            border-radius: 5px;
          }
        }

        .status {
          font-size: 0.7em;
          margin-top: 5px;
        }

        &.fade-leave-active {
          transition: opacity 0.3s 2s;
        }

        &.fade-enter-active {
          transition: opacity 0.3s;
        }

        &.fade-enter, &.fade-leave-to {
          opacity: 0;
        }

        &.fade-enter-to, &.fade-leave {
          opacity: 1;
        }

        margin-right: 20px;
      }

      .button {
        width: 40px;
        height: 40px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 20px;
        background-color: rgba(black, 0.1);
        font-size: 0.9em;
        cursor: pointer;

        transition: transform 0.3s, background-color 0.3s;

        &:hover {
          transform: scale(1.1);
          background-color: rgba(black, 0.2);
        }

        &:active {
          transform: scale(0.9);
          transition: transform 0.2s, background-color 0.2s; 
          background-color: rgba(black, 0.3);
        }

        &.disabled {
          pointer-events: none;
          cursor: default;
          background-color: transparent;
        }
      }
    }
  }
}

</style>
