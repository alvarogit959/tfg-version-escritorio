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
    // 🔲 Window controls
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


  background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1));
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
  background: rgba(14, 14, 32, 0.95);
  border-bottom: 1px solid rgba(100, 150, 255, 0.3);
}
@media (max-width: 768px) {
  .titlebar {
    display: none;
  }
  #app {padding-top: 0rem;
  padding-bottom: 0rem;}
}


.buttoncontanier {
  position: relative;
  border-radius: 0.3rem;
  display: flex;
  -webkit-app-region: no-drag;
  column-gap: 0.5rem;
  
}

.defaultbutton {
  font-family: 'Inter', sans-serif;
  width: 2rem;
  height: 2rem;
  margin: 0.1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(20, 20, 40, 0);

  border: 1px solid rgba(0, 0, 0, 0);
  font-size: 1rem;
  color: white;
}

.defaultbutton:hover {
  background: rgba(168, 85, 247, 0.3);
  transform: translateY(-2px);
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