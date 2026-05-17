<template>
  <div class="titlebar" @dblclick="toggleMaximize">
    <div class="buttoncontanier">
      <button class="defaultbutton" @click="minimizeWindow">_</button>
      <button class="defaultbutton" @click="toggleMaximize">□</button>
      <button class="defaultbutton" @click="closeWindow">X</button>
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
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap");

html,
body {
  height: 100vh;
  width: 100vw;
  padding: 0;
  margin: 0;
  background: transparent;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

#app {
  padding-top: 3.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: "Inter", sans-serif;
  justify-content: flex-start;
  text-align: center;
  height: calc(100vh - 3.5rem);
  width: 100vw;
  background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1));
  border-radius: 0;
  -webkit-app-region: no-drag;
  overflow: hidden;
}

.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5rem;
  -webkit-app-region: drag;
  z-index: 9999;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
  background: rgba(20, 20, 40, 0.95);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
}

/* Buttons must NOT be draggable */
.buttoncontanier {
  position: relative;
  right: 1rem;
  display: flex;
  -webkit-app-region: no-drag;
}

.defaultbutton {
  font-family: "Inter", sans-serif;
  width: 2rem;
  height: 2rem;
  margin: 0.1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
}

.defaultbutton:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.defaultbutton:active {
  transform: translateY(0);
}
</style>