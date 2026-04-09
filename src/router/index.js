import { createRouter, createWebHistory } from 'vue-router'
import Login from '../components/login-view.vue'
import MainMenu from '../components/mainMenu.vue'
import MapView from '../components/map.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  {
    path: '/main-menu',
    name: 'MainMenu',
    component: MainMenu
  },
  { path: '/map', name: 'map', component: MapView }
  
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router