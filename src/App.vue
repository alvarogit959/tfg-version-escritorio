<template>
  <div class="titlebar" @dblclick="toggleMaximize">
    <div class="buttoncontanier">
      <button class="defaultbutton" @click="minimizeWindow">_</button>
      <button class="defaultbutton" @click="toggleMaximize">□</button>
      <button class="defaultbutton" @click="closeWindow">x</button>
    </div>
  </div>

  <MainView />
</template>

<script>
import 'leaflet/dist/leaflet.css';
import MainView from "./components/main.vue";

export default {
  name: "App",
  components: {
    MainView,
  },
  data() {
    return {};
  },
  methods: {
    closeWindow() {
      window.electron?.ipcRenderer.send("close-window");
    },
    minimizeWindow() {
      window.electron?.ipcRenderer.send("minimize-window");
    },
    toggleMaximize() {
      window.electron?.ipcRenderer.send("toggle-maximize");
    },
  },
};
</script>

<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@100;300;400;500;600;700;800;900&display=swap");

  :root {
    background:transparent;
    background: radial-gradient(
  circle at center,
  rgb(56, 17, 14),
  rgb(5, 23, 37)
);
}

* {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  -webkit-text-size-adjust: 100%;
  letter-spacing: -0.2px;
  line-height: 1.5;
}

html,
body {
overflow: hidden;
height: 100vh;
  width: 100vw;
  padding: 0;
  margin: 0;
  background: transparent;
  overflow-x: hidden;
  -webkit-app-region: no-drag;
}

#app {
  padding-top: 2rem;
  margin-top: 0;
  width: 100vw;
  height: calc(100vh);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Inter', sans-serif;
  justify-content: flex-start;
  text-align: center;
background: transparent;

  background-image: url("http://localhost:5000/event-images/rrreflection.svg");
 background-blend-mode: exclusion;
    background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1)); */
  -webkit-app-region: drag;
  /*background-image: url("@/assets/newbackground.svg");*/
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  border-radius: 0;
  -webkit-app-region: no-drag;
}

.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 2rem;
  -webkit-app-region: drag;
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
  border-bottom: 1px solid rgba(100, 149, 255, 0);
  
   background-image: url("http://localhost:5000/event-images/rrreflection.svg");
 background-blend-mode: exclusion;
    background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1)); */
  -webkit-app-region: drag;
  /*background-image: url("@/assets/newbackground.svg");*/
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
}



.buttoncontanier {
  height: 1.8rem;
  position: relative;
  border-radius: 0.3rem;
  margin-top: 0.1rem;
  display: flex;
  -webkit-app-region: no-drag;
  column-gap: 0.4rem;
  padding-right: 0.3rem;
  
}

.defaultbutton {
  font-family: 'Inter', sans-serif;
  width: 1.4rem;
  height: 1.4rem;
  margin: 0.3rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(20, 20, 40, 0);
  border-radius: 0.3rem;
  border: 1px solid rgba(0, 0, 0, 0);
  font-size: 1rem;
  color: white;
  align-items: center;
  justify-content: center;
}

.defaultbutton:hover {
  background: rgba(168, 85, 247, 0.3);
  transform:scale(1.1);
}

.defaultbutton:active {
  transform: translateY(0);
}
.main-content,
.view-container,
.chat-panel,
.chat-conversation,
.chat-messages {
  min-height: 0;
}

</style>