// src/router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import Login from '../components/login-view.vue'
import MapView from '../components/map.vue'

const routes = [
  {
    path: '/',
    name: 'login',
    component: Login
  },
  { 
    path: '/map', 
    name: 'map', 
    component: MapView 
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router