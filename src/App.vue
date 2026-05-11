<template>
  <div class="titlebar" @dblclick="toggleMaximize">
    <div class="buttoncontanier">
      <button class="defaultbutton" @click="minimizeWindow">_</button>
      <button class="defaultbutton" @click="toggleMaximize">□</button>
      <button class="defaultbutton" @click="closeWindow">X</button>
    </div>
  </div>

  <login-view
    v-if="screen === 'login'"
    @login="handleLogin"
    @newUser="goNewUser"
    @goToMap="goMap"
  />

  <newUser v-else-if="screen === 'newUser'" @back="goLogin" />

  <MapView v-else-if="screen === 'map'" @back="goLogin" />

  <mainMenuAdmin
    v-else-if="screen === 'main' && user && user.admin"
    :user="user"
    @logout="logout"
    @newActivity="goNewActivity"
    @editActivity="goEditActivity"
    @attendanceActivity="goAttendanceActivity"
  />

  <newActivity
    v-else-if="screen === 'newActivity'"
    @logout="logout"
    @back="goMain"
  />

  <editActivity
    v-else-if="screen === 'editActivity'"
    :activity="selectedActivity"
    @back="goMain"
  />

  <attendanceActivity
    v-else-if="screen === 'attendanceActivity'"
    :actividad="selectedActivity"
    @back="goMain"
  />

  <mainMenu
    v-else-if="screen === 'main' && user"
    :user="user"
    @logout="logout"
  />
</template>

<script>
import 'leaflet/dist/leaflet.css';
import LoginView from "./components/login-view.vue";
import MainMenu from "./components/mainMenu.vue";
import MainMenuAdmin from "./components/mainMenuAdmin.vue";
import NewUser from "./components/newUser.vue";
import MapView from "./components/map.vue";
import NewActivity from "./components/newActivity.vue";
import EditActivity from "./components/editActivity.vue";
import AttendanceActivity from "./components/attendanceActivity.vue";

export default {
  name: "App",
  components: {
    LoginView,
    MainMenu,
    MainMenuAdmin,
    NewUser,
    MapView,
    NewActivity,
    EditActivity,
    AttendanceActivity,
  },
  data() {
    return {
      user: null,
      screen: "login",
      selectedActivity: null,
    };
  },
  methods: {
    handleLogin(user) {
      this.user = user;
      this.screen = "main";
    },
    goNewUser() {
      this.screen = "newUser";
    },
    goLogin() {
      this.screen = "login";
    },
    goMap() {
      this.screen = "map";
    },
    logout() {
      this.user = null;
      this.screen = "login";
    },
    goNewActivity() {
      this.screen = "newActivity";
    },
    goEditActivity(actividad) {
      this.selectedActivity = actividad;
      this.screen = "editActivity";
    },
    goAttendanceActivity(actividad) {
      this.selectedActivity = actividad;
      this.screen = "attendanceActivity";
    },
    goMain() {
      this.screen = "main";
    },

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
  
  background-color: rgb(194, 221, 228);
  background-image: url("assets/test2.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 0.5rem;
  -webkit-app-region: no-drag;
}

.titlebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3.5rem;
  -webkit-app-region: drag;
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  user-select: none;
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
</style>