<template>
  <div class="buttoncontanier">
    <button class="defaultbutton" @click="minimizeWindow">_</button>
    <button class="defaultbutton" @click="closeWindow">X</button>
  </div>
  <login-view
    v-if="screen === 'login'"
    @login="handleLogin"
    @newUser="goNewUser"
    @goToMap="goMap"
  />

  <newUser v-else-if="screen === 'newUser'" @back="goLogin" />
  <MapView
  v-else-if="screen === 'map'"
  @back="goLogin"
/>
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
//ACORDARSE DE IMPORTAR AQUI TAMBIEN
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
}
,
    goMain() {
      this.screen = "main";
    },
    minimizeWindow() {
      if (window.electron) {
        window.electron.ipcRenderer.send("minimize-window");
      }
    },
    closeWindow() {
      if (window.electron) {
        window.electron.ipcRenderer.send("close-window");
      }
    },
  },
};
</script>
<style>
@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap");

html,
body {
  height: 100vh;
  width: 100vw;
  padding: 0;
  margin: 0;
  border-radius: 1rem;
  background: transparent;
  overflow: hidden;
  -webkit-app-region: no-drag;
}

#app {
  display: flex;
  font-family: "Inter", sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  justify-content: center;
  align-items: center;
  text-align: center;
  margin: 0rem;
  height: 100vh;
  padding: 0rem;
  background-color: rgb(194, 221, 228);
  background-image: url("assets/test2.png");
  /*background-image: url('assets/backgroundtest.svg');*/
  background-size: cover; /* o contain, auto, etc. */
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 3rem;
  -webkit-app-region: drag;
}
.buttoncontanier {
  position: absolute;
  right: 1.5rem;
  top: 1.5rem;
  -webkit-app-region: no-drag;
}
.defaultbutton {
  font-family: "Inter", sans-serif;
  width: 2rem;
  padding: 0.5rem;
  margin: 0.1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.defaultbutton:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.defaultbutton:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
</style>
