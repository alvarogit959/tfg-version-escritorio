<template>
  <div class="app-container">
    <!-- BARRA DE NAVEGACIÓN SUPERIOR -->
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <h2>CarMeet Club</h2>
        </div>
        
        <ul class="nav-menu">
            <li>
            <button
              class="nav-btn"
              :class="{ active: currentView === 'inicio' }"
              @click="switchView('inicio')"
            >
              Inicio
            </button>
          </li>
          <li>
            <button
              class="nav-btn"
              :class="{ active: currentView === 'map' }"
              @click="switchView('map')"
            >
              Mapa
            </button>
          </li>
          <li>
            <button
              class="nav-btn"
              :class="{ active: currentView === 'events' }"
              @click="switchView('events')"
            >
              Eventos
            </button>
          </li>
          <li>
            <button
              class="nav-btn"
              :class="{ active: currentView === 'forum' }"
              @click="switchView('forum')"
            >
              Foro 
            </button>
          </li>
          <li>
            <div class="profile-group">
        <button class="profile-btn" @click="toggleProfileMenu">
          {{ isLoggedIn ? 'Perfil' : 'Iniciar sesión' }}
        </button>
        <div v-if="showProfileMenu" class="submenu">
          <template v-if="isLoggedIn">
            <button
              class="submenu-btn"
              :class="{ active: currentView === 'profile' }"
              @click="selectOption('profile')"
            >
              Ver Perfil
            </button>
            <button @click="selectOption('myevents')" class="submenu-btn">Mis Eventos</button>
            <button @click="selectOption('settings')" class="submenu-btn">Configuración</button>
            <button @click="selectOption('logout')" class="submenu-btn logout-option">Cerrar sesión</button>
          </template>
          <template v-else>
            <button @click="selectOption('login')" class="submenu-btn">Iniciar sesión</button>
            <button @click="selectOption('register')" class="submenu-btn">Registrarse</button>
          </template>
        </div>
      </div>
          </li>
        </ul>


      </div>
    </nav>

    <!-- CONTENIDO PRINCIPAL -->
    <div class="main-content">
      <!-- Vista Inicio -->
      <div v-if="currentView === 'inicio'" class="view-container">
        <InicioView msg="Inicio - CarMeet Club" />
      </div>

      <!-- Vista Mapa -->
      <div v-if="currentView === 'map'" class="view-container">
        <MapView/>
      </div>

      <!-- Vista Eventos -->
      <div v-if="currentView === 'events'" class="view-container">
        <EventsView />
      </div>

      <!-- Vista Foro -->
      <div v-if="currentView === 'forum'" class="view-container">
        <ForumView />
      </div>

      <!-- Vista Perfil -->
      <div v-if="currentView === 'profile'" class="view-container">
        <LoginView @newUser="switchView('newUser')" @login="handleLogin"/>
      </div>
      <div v-if="currentView === 'newUser'" class="view-container">
        <newUser @back="switchView('profile')" @userCreated="switchView('profile')"/>  
      </div>
    </div>

<!--BOTON CHAT-->
    <button 
      v-if="isLoggedIn"
      class="chat-button"
      @click="toggleChat"
      :class="{ active: chatOpen }"
      title="Abrir chat"
    >
      <span v-if="!chatOpen">Chat</span>
      <span v-else>✕</span>
    </button>

    <div v-if="isLoggedIn && chatOpen" class="chat-window">
      <div class="chat-header">
        <h3>TEST Chat Grupal</h3>
      </div>
      <div class="chat-messages">
        <div v-for="msg in messages" :key="msg.id" class="message" :class="msg.type">
          <div class="message-content">
            <span v-if="msg.type === 'bot'" class="message-sender">{{ msg.senderName }}</span>
            <p>{{ msg.text }}</p>
            <span class="message-time">{{ new Date(msg.sentAt).toLocaleTimeString() }}</span>
          </div>
        </div>
      </div>
      <div class="chat-input">
        <input 
          v-model="messageInput" 
          type="text" 
          placeholder="Escriba su mensaje..."
          @keyup.enter="sendMessage"
        />
        <button @click="sendMessage">Enviar</button>
      </div>
    </div>
  </div>
</template>

<script>
import 'mapbox-gl/dist/mapbox-gl.css';
import InicioView from './inicio.vue';
import MapView from './map.vue';
import EventsView from './events.vue';
import ForumView from './forum.vue';
import LoginView from './login-view.vue';
import newUser from './newUser.vue';
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
export default {
  name: 'main-view',
  components: {
    InicioView,
    MapView,
    EventsView,
    ForumView,
    LoginView,
    newUser
  },
  data() {
    return {
      currentView: 'inicio',
      isLoggedIn: false,
      currentUser: null,
      chatOpen: false,
      messages: [],
      messageInput: '',
      conversationId: null,
      showProfileMenu: false
    };
  },
  mounted() {
    // Cargar el estado de login desde localStorage
    const savedLoginState = localStorage.getItem('isLoggedIn');
    const savedUser = localStorage.getItem('user');
    socket.on("new-message", (msg) => {
  // Evitar duplicados
  const exists = this.messages.some(m => m.id === msg._id);
  if (exists) return;

  this.messages.push({
    id: msg._id,
    text: msg.text,
    senderId: msg.senderId._id || msg.senderId,
    senderName: msg.senderId.username || "Usuario",
    senderImage: msg.senderId.profileImage || "",
    type:
      (msg.senderId._id || msg.senderId) === this.currentUser?.id
        ? "user"
        : "bot",
    sentAt: msg.sentAt
  });

  this.$nextTick(() => {
    const chatMessages = document.querySelector(".chat-messages");
    if (chatMessages) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
});

    if (savedLoginState === 'true' && savedUser) {
      const user = JSON.parse(savedUser);
      this.isLoggedIn = user.status === true;
      this.currentUser = user;
      
      // Cargar conversación grupal
      if (this.isLoggedIn) {
        this.loadGroupConversation();
      }
    }
  },
  
  methods: {
    switchView(viewName) {
      this.currentView = viewName;
    },
    handleLogin(user) {
      this.isLoggedIn = user.status === true;
      this.currentUser = user;
      
      // Cargar conversación grupal y agregar como participante
      this.loadGroupConversation();
      
      this.switchView('inicio');
    },
    loadGroupConversation() {
      // Obtener conversación grupal
      fetch('http://localhost:5000/conversations/group')
        .then(res => res.json())
        .then(conversation => {
          this.conversationId = conversation._id;
          socket.emit("join-group-chat", this.currentUser.id);
          // Agregar usuario a los participantes
          return fetch(`http://localhost:5000/conversations/${conversation._id}/add-participant`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId: this.currentUser.id })
          });
        })
        .then(res => res.json())
        .then(() => {
          // Cargar mensajes de la conversación
          this.loadMessages();
        })
        .catch(error => console.error('Error cargando conversación:', error));
    },
        toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
    },
    selectOption(option) {
      this.showProfileMenu = false;
      switch(option) {
        case 'profile':
          this.switchView('profile');
          break;
        case 'myevents':
          this.switchView('events');
          break;
        case 'settings':
          // Opción de configuración - puedes agregar una nueva vista si es necesario
          console.log('Configuración seleccionada');
          break;
        case 'logout':
          this.logout();
          break;
        case 'login':
          this.switchView('profile');
          break;
        case 'register':
          this.switchView('newUser');
          break;
        default:
          break;
      }
    },
    loadMessages() {
      if (!this.conversationId) return;

      fetch(`http://localhost:5000/conversations/${this.conversationId}/messages`)
        .then(res => res.json())
        .then(messages => {
          this.messages = messages.map(msg => ({
            id: msg._id,
            text: msg.text,
            senderId: msg.senderId._id,
            senderName: msg.senderId.username,
            senderImage: msg.senderId.profileImage,
            type: msg.senderId._id === this.currentUser.id ? 'user' : 'bot',
            sentAt: msg.sentAt
          }));
        })
        .catch(error => console.error('Error cargando mensajes:', error));
    },
    logout() {
      // Llamar al servidor para establecer status en false
      const userId = this.currentUser.id;
      
      fetch('http://localhost:5000/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      }).catch((error) => console.error('Error en logout:', error));

      // Limpiar estado local
      this.isLoggedIn = false;
      this.currentUser = null;
      this.chatOpen = false;
      this.messages = [];
      this.conversationId = null;
      this.messageInput = '';
      localStorage.removeItem('user');
      localStorage.removeItem('isLoggedIn');
      this.switchView('profile');
    },
    toggleChat() {
      this.chatOpen = !this.chatOpen;
    },
    sendMessage() {
      if (this.messageInput.trim() === '' || !this.conversationId) return;

      const messageText = this.messageInput;

      // Enviar mensaje al servidor
      fetch('http://localhost:5000/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          conversationId: this.conversationId,
          senderId: this.currentUser.id,
          text: messageText
        })
      })
        .then(res => res.json())
        .then(() => {
          // El mensaje se agregará automáticamente por el socket listener
          this.messageInput = '';

          // Scroll al último mensaje
          this.$nextTick(() => {
            const chatMessages = document.querySelector('.chat-messages');
            if (chatMessages) {
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          });
        })
        .catch(error => {
          console.error('Error enviando mensaje:', error);
          this.messageInput = messageText; // Restaurar el mensaje si falla
        });
    }
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1));
  -webkit-app-region: drag;
}



.user-info {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.5rem 1rem;
  background: rgba(100, 200, 255, 0.1);
  border-radius: 0.6rem;
  border: 1px solid rgba(100, 200, 255, 0.3);
}

.user-name {
  color: rgba(100, 200, 255, 0.9);
  font-family: "Inter", sans-serif;
  font-weight: 500;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.logout-btn {
  font-family: "Inter", sans-serif;
  padding: 0.5rem 1rem;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(255, 100, 100, 0.5);
  border-radius: 0.5rem;
  color: rgba(255, 150, 150, 0.9);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.logout-btn:hover {
  background: rgba(255, 100, 100, 0.3);
  border-color: rgba(255, 100, 100, 0.8);
  color: rgba(255, 100, 100, 1);
}

.logout-btn:active {
  transform: scale(0.95);
}

/* ===== BARRA DE NAVEGACIÓN ===== */
.navbar {
  background: rgba(20, 20, 40, 0.95);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 2px solid rgba(100, 200, 255, 0.3);
  padding: 0.8rem 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  -webkit-app-region: drag;
  position: relative;
  z-index: 1000;
  overflow: visible;
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 100%;
  margin: 0 auto;
  gap: 2rem;
}

.navbar-logo h2 {
  color: rgba(100, 200, 255, 0.9);
  font-size: 1.3rem;
  font-weight: bold;
  font-family: "Inter", sans-serif;
  white-space: nowrap;
}

.nav-menu {
  display: flex;
  list-style: none;
  gap: 0.5rem;
  flex: 1;
  justify-content: center;
  -webkit-app-region: no-drag;
  overflow: visible;
}

.nav-menu li:last-child {
  margin-left: auto;
}

.nav-btn {
  font-family: "Inter", sans-serif;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 0.6rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.nav-btn:hover {
  background: rgba(100, 200, 255, 0.2);
  border-color: rgba(100, 200, 255, 0.6);
  color: rgba(100, 200, 255, 1);
  transform: translateY(-2px);
}

.nav-btn.active {
  background: rgba(100, 200, 255, 0.4);
  border-color: rgba(100, 200, 255, 0.8);
  color: rgba(150, 220, 255, 1);
  box-shadow: 0 0 15px rgba(100, 200, 255, 0.3);
}

/* ===== PROFILE GROUP & SUBMENU ===== */
.profile-group {
  position: relative;
  display: flex;
  align-items: center;
  overflow: visible;
}

.profile-btn {
  font-family: "Inter", sans-serif;
  padding: 0.6rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 0.6rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.profile-btn:hover {
  background: rgba(100, 200, 255, 0.2);
  border-color: rgba(100, 200, 255, 0.6);
  color: rgba(100, 200, 255, 1);
  transform: translateY(-2px);
}

.profile-btn:active {
  transform: scale(0.95);
}

.submenu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 0.5rem;
  background: rgba(20, 20, 40, 0.98);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 0.6rem;
  min-width: 180px;
  z-index: 999999;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.submenu-btn {
  display: block;
  width: 100%;
  padding: 0.7rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  font-weight: 500;
}

.submenu-btn:hover {
  background: rgba(100, 200, 255, 0.15);
  color: rgba(100, 200, 255, 1);
  padding-left: 1.2rem;
}

.submenu-btn:active {
  background: rgba(100, 200, 255, 0.25);
}

.submenu-btn.logout-option {
  border-top: 1px solid rgba(100, 200, 255, 0.2);
  color: rgba(255, 150, 150, 0.9);
}

.submenu-btn.logout-option:hover {
  background: rgba(255, 100, 100, 0.15);
  color: rgba(255, 150, 150, 1);
}

.submenu-btn.active {
  background: rgba(100, 200, 255, 0.25);
  color: rgba(150, 220, 255, 1);
}


/* ===== CONTENIDO PRINCIPAL ===== */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  -webkit-app-region: no-drag;
}

.view-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .navbar-content {
    gap: 1rem;
  }

  .navbar-logo h2 {
    font-size: 1.1rem;
  }

  .nav-menu {
    gap: 0.3rem;
  }

  .nav-btn {
    padding: 0.5rem 0.8rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 768px) {
  .navbar {
    padding: 0.6rem 1rem;
  }

  .navbar-content {
    gap: 0.8rem;
  }

  .nav-menu {
    gap: 0.2rem;
  }

  .nav-btn {
    padding: 0.4rem 0.6rem;
    font-size: 0.75rem;
  }

  .user-name {
    display: none;
  }

  .logout-btn {
    padding: 0.4rem 0.8rem;
    font-size: 0.8rem;
  }
}

/* ===== BOTÓN CHAT FLOTANTE ===== */
.chat-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 100px;
  height: 50px;
  border-radius: 5%;
  background: rgb(64, 32, 122);
  border: 2px solid rgb(120, 85, 201);
  color: rgb(231, 231, 231);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(146, 61, 226, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  -webkit-app-region: no-drag;
}

.chat-button:hover {
  background: rgb(255, 170, 100);
  color: rgb(77, 14, 14);
  box-shadow: 0 6px 25px rgba(255, 193, 100, 0.6);
  transform: scale(1.1);
}

.chat-button:active {
  transform: scale(0.95);
}

/* ===== VENTANA DE CHAT ===== */
.chat-window {
  position: fixed;
  bottom: 85px;
  right: 20px;
  width: 350px;
  height: 450px;
  background: rgba(20, 20, 40, 0.98);
  border: 2px solid rgba(100, 200, 255, 0.5);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  z-index: 99;
  backdrop-filter: blur(10px);
  -webkit-app-region: no-drag;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-header {
  padding: 15px;
  border-bottom: 1px solid rgba(100, 200, 255, 0.3);
  background: rgba(100, 200, 255, 0.1);
  border-radius: 10px 10px 0 0;
}

.chat-header h3 {
  margin: 0;
  color: rgba(100, 200, 255, 0.9);
  font-size: 1rem;
  font-family: "Inter", sans-serif;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.message {
  display: flex;
  animation: messageIn 0.3s ease;
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.user {
  justify-content: flex-end;
}

.message.bot {
  justify-content: flex-start;
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
}

.message p {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  word-wrap: break-word;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
}

.message.user p {
  background: rgba(100, 200, 255, 0.6);
  color: white;
}

.message.bot p {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

.message-sender {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  padding: 0 12px 4px 12px;
  font-weight: 600;
  font-family: "Inter", sans-serif;
}

.message-time {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
  padding: 2px 12px 0 12px;
  font-family: "Inter", sans-serif;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(100, 200, 255, 0.3);
  background: rgba(20, 20, 40, 0.95);
  border-radius: 0 0 10px 10px;
}

.chat-input input {
  flex: 1;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(100, 200, 255, 0.3);
  border-radius: 6px;
  color: white;
  font-family: "Inter", sans-serif;
  outline: none;
  transition: all 0.2s ease;
}

.chat-input input:focus {
  border-color: rgba(100, 200, 255, 0.6);
  box-shadow: 0 0 10px rgba(100, 200, 255, 0.2);
}

.chat-input input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.chat-input button {
  padding: 8px 16px;
  background: rgba(100, 200, 255, 0.6);
  border: 1px solid rgba(100, 200, 255, 0.8);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  font-family: "Inter", sans-serif;
  transition: all 0.2s ease;
}

.chat-input button:hover {
  background: rgba(100, 200, 255, 0.8);
  box-shadow: 0 0 10px rgba(100, 200, 255, 0.3);
}

.chat-input button:active {
  transform: scale(0.95);
}
</style>
