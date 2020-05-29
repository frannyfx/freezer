<template>
  <div id="app" class="app">
    <sidebar></sidebar>
    <div class="content">
      <div class="title-bar">
        <span>Freezer</span>
      </div>
      <router-view></router-view>
    </div>
  </div>
</template>

<script>
import Sidebar from "./components/Sidebar";
import { ipcRenderer } from "electron";
export default {
  name: 'Freezer',
  components: { Sidebar },
  mounted: function () {
    // Request the data.
    ipcRenderer.send("want-data");

    // Update store with new data.
    ipcRenderer.on("data", (event, data) => {
      console.log(data);
      this.$store.dispatch("shared/setData", data);

      // Switch depending on log in status.
      if (this.$store.state.shared.deezer.loggedIn && this.$router.currentRoute.name == "auth") {
        this.$router.replace({name: "main"});
      } else if (!this.$store.state.shared.deezer.loggedIn && this.$router.currentRoute.name != "auth") {
        this.$router.replace({name: "auth"});
      }
    });
  }
}
</script>

<style>
.wrapper {
  flex-grow: 1;
}

body {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
  background-color: #333;
  color: white;
  font-family: sans-serif;
  width: 100vw;
  height: 100vh;

  user-select: none;
}
</style>

<style lang="scss" scoped>
.app {
  margin: 0; padding: 0;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  display: flex;
  flex-direction: row;
  
  .title-bar {
    height: 50px;
    border-bottom: 1px solid rgba(black, 0.2);
    box-shadow: 0px 0px 10px rgba(black, 0.1);
    -webkit-app-region: drag;

    z-index: 1000;
    backdrop-filter: blur(30px) saturate(170%);
    position: fixed;
    top: 0; left: 80px; right: 0;

    line-height: 50px;
    text-align: left;
    font-size: 0.8em;
    padding-left: 20px;

    background-color: rgba(black, 0.2);
    box-shadow: 0px 0px 10px rgba(black, 0.3);

  }

  .content {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    position: relative;

    .router-content {
      flex-grow: 1;
    }
  }
}
</style>
