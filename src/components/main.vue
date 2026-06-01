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
              :class="{ active: currentView === 'routes' }"
              @click="switchView('routes')"
            >
              Rutas
            </button>
          </li>
          <li>
            <div class="profile-group">
              <button class="profile-btn" @click="toggleProfileMenu">
                {{ isLoggedIn ? "Perfil" : "Iniciar sesión" }}
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
                  <button
                    @click="selectOption('myevents')"
                    class="submenu-btn"
                    :class="{ active: currentView === 'myevents' }"
                  >
                    Mis Eventos
                  </button>
                  <button
                    @click="selectOption('friends')"
                    class="submenu-btn"
                    :class="{ active: currentView === 'friends' }"
                  >
                    Amigos
                  </button>
                  <button
                    v-if="isAdmin"
                    @click="selectOption('admin')"
                    class="submenu-btn admin-menu-item"
                    :class="{ active: currentView === 'admin' }"
                  >
                    Panel Admin
                  </button>
                  <button
                    @click="selectOption('logout')"
                    class="submenu-btn logout-option"
                  >
                    Cerrar sesión
                  </button>
                </template>
                <template v-else>
                  <button @click="selectOption('login')" class="submenu-btn">
                    Iniciar sesión
                  </button>
                  <button @click="selectOption('register')" class="submenu-btn">
                    Registrarse
                  </button>
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
        <InicioView />
      </div>

      <!-- Vista Mapa -->
      <div v-if="currentView === 'map'" class="view-container">
        <MapView @open-event="openEventFromMap" />
      </div>

      <!-- Vista Eventos -->
      <div v-if="currentView === 'events'" class="view-container">
        <EventsView
          :initial-event="eventFromMap"
          :current-user="currentUser"
          @events-updated="handleProfileUpdated"
          @create-event="switchView('newEvent')"
          @view-user="openUserProfile"
        />
      </div>

      <!-- Crear evento -->
      <div v-if="currentView === 'newEvent'" class="view-container">
        <NewEventView
          v-if="isLoggedIn && currentUser"
          :current-user="currentUser"
          @created="onEventCreated"
          @cancel="switchView('events')"
        />
        <LoginView
          v-else
          @newUser="switchView('newUser')"
          @login="handleLogin"
        />
      </div>

      <!-- Perfil de otro usuario -->
      <div v-if="currentView === 'user'" class="view-container">
        <UserView
          v-if="viewUserId"
          :view-user-id="viewUserId"
          :current-user="currentUser"
          @back="closeUserView"
          @open-own-profile="openOwnProfile"
          @open-private-chat="openPrivateChat"
        />
      </div>

      <!-- Panel administración -->
      <div v-if="currentView === 'admin'" class="view-container">
        <AdminPanelView
          v-if="isLoggedIn && isAdmin && currentUser"
          :admin-id="currentUser.id"
          @view-user="openUserProfile"
          @events-changed="onAdminEventsChanged"
        />
        <p v-else class="access-denied">Acceso solo para administradores</p>
      </div>

      <!-- Mis Eventos -->
      <div v-if="currentView === 'myevents'" class="view-container">
        <MyEventsView
          v-if="isLoggedIn && currentUser"
          :user-id="currentUser.id"
          @events-updated="handleProfileUpdated"
          @view-user="openUserProfile"
        />
        <LoginView
          v-else
          @newUser="switchView('newUser')"
          @login="handleLogin"
        />
      </div>

      <!-- Vista Foro -->
      <div v-if="currentView === 'routes'" class="view-container">
        <RoutesView />
      </div>

      <!-- Vista Perfil / Login -->
      <div v-if="currentView === 'profile'" class="view-container">
        <ProfileView
          v-if="isLoggedIn && currentUser"
          :user-id="currentUser.id"
          @profile-updated="handleProfileUpdated"
        />
        <LoginView
          v-else
          @newUser="switchView('newUser')"
          @login="handleLogin"
        />
      </div>
      <div v-if="currentView === 'newUser'" class="view-container">
        <newUser
          @back="switchView('profile')"
          @userCreated="switchView('profile')"
        />
      </div>

      <div v-if="currentView === 'friends'" class="view-container">
        <FriendsView
          v-if="isLoggedIn && currentUser"
          :user-id="currentUser.id"
          @view-user="openUserProfile"
          @open-private-chat="openPrivateChat"
        />
        <LoginView
          v-else
          @newUser="switchView('newUser')"
          @login="handleLogin"
        />
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

    <div v-if="isLoggedIn && chatOpen" class="chat-panel">
      <aside class="chat-sidebar">
        <div class="sidebar-header">
          <span>Chats</span>
          <button type="button" class="sidebar-close" @click="toggleChat">
            ✕
          </button>
        </div>
        <ul class="chat-list">
          <li>
            <button
              type="button"
              class="chat-list-item"
              :class="{ active: isGroupActive }"
              @click="selectGroupChat"
            >
              <span class="chat-avatar group-avatar">G</span>
              <span class="chat-list-info">
                <span class="chat-list-name">Chat grupal</span>
                <span class="chat-list-preview">Todos los usuarios</span>
              </span>
            </button>
          </li>
          <li v-for="friend in privateFriendsList" :key="friend.id">
            <button
              type="button"
              class="chat-list-item"
              :class="{ active: privateChatFriend?.id === friend.id }"
              @click="startPrivateChatWith(friend)"
            >
              <span class="chat-avatar">{{
                friend.username.charAt(0).toUpperCase()
              }}</span>
              <span class="chat-list-info">
                <span class="chat-list-name">{{ friend.username }}</span>
                <span class="chat-list-preview">Privado</span>
              </span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="chat-conversation">
        <header class="conversation-header">
          <h3>{{ activeChatTitle }}</h3>
        </header>

        <div v-if="!conversationId" class="no-chat-selected">
          <p>Selecciona un chat de la lista</p>
        </div>

        <template v-else>
          <div class="chat-messages" ref="chatMessages">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message"
              :class="msg.type"
            >
              <div class="message-content">
                <button
                  v-if="msg.type === 'me' && msg.senderId"
                  type="button"
                  class="message-sender profile-link-chat"
                  @click="openUserProfile(msg.senderId)"
                >
                  {{ msg.senderName }}
                </button>
                <span class="message-sender">{{ msg.senderName }}</span>
                <p>{{ msg.text }}</p>
                <span class="message-time">{{
                  new Date(msg.sentAt).toLocaleTimeString()
                }}</span>
              </div>
            </div>
          </div>
          <div class="chat-input">
            <input
              v-model="messageInput"
              type="text"
              placeholder="Escribe un mensaje..."
              @keyup.enter="sendMessage"
            />
            <button type="button" @click="sendMessage">Enviar</button>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<script>
import "mapbox-gl/dist/mapbox-gl.css";
import InicioView from "./inicio.vue";
import MapView from "./map.vue";
import EventsView from "./events.vue";
import RoutesView from "./routesMap.vue";
import LoginView from "./login-view.vue";
import ProfileView from "./profile.vue";
import MyEventsView from "./myEvents.vue";
import NewEventView from "./newEvent.vue";
import newUser from "./newUser.vue";
import UserView from "./user.vue";
import AdminPanelView from "./adminPanel.vue";
import FriendsView from "./friends.vue";
import { apiJson, isAdminRole } from "../utils/api.js";
import { io } from "socket.io-client";
const socket = io("http://localhost:5000");
export default {
  name: "main-view",
  components: {
    InicioView,
    MapView,
    EventsView,
    RoutesView,
    LoginView,
    ProfileView,
    MyEventsView,
    NewEventView,
    newUser,
    UserView,
    AdminPanelView,
    FriendsView,
  },
  computed: {
    isAdmin() {
      return isAdminRole(this.currentUser?.role);
    },
    isGroupActive() {
      return (
        !!this.groupConversationId &&
        String(this.conversationId) === String(this.groupConversationId)
      );
    },
    activeChatTitle() {
      if (this.isGroupActive) return "Chat grupal";
      if (this.privateChatFriend) return this.privateChatFriend.username;
      return "Mensajes";
    },
  },
  data() {
    return {
      currentView: "inicio",
      isLoggedIn: false,
      currentUser: null,
      chatOpen: false,
      chatMode: "group",
      messages: [],
      messageInput: "",
      conversationId: null,
      groupConversationId: null,
      privateChatFriend: null,
      privateFriendsList: [],
      showProfileMenu: false,
      eventFromMap: null,
      viewUserId: null,
      returnViewAfterUser: "inicio",
    };
  },
  watch: {
    messages: {
      handler() {
        this.scrollToBottom();
      },
      deep: true,
    },
    chatOpen(isOpen) {
      if (isOpen) {
        this.scrollToBottom();
      }
    },
    conversationId() {
      this.scrollToBottom();
    },
  },
  mounted() {
    const savedLoginState = localStorage.getItem("isLoggedIn");
    const savedUser = localStorage.getItem("user");
    socket.on("new-message", (msg) => {
      const msgConvId = String(
        msg.conversationId?._id || msg.conversationId || "",
      );
      if (this.conversationId && msgConvId !== String(this.conversationId)) {
        return;
      }

      const exists = this.messages.some((m) => m.id === msg._id);
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
        sentAt: msg.sentAt,
      });
    });

    if (savedLoginState === "true" && savedUser) {
      const user = JSON.parse(savedUser);
      this.isLoggedIn = user.status === true;
      this.currentUser = user;

      if (this.isLoggedIn && user.id) {
        this.refreshCurrentUserFromServer(user.id);
      }
    }
  },

  methods: {
    scrollToBottom() {
      this.$nextTick(() => {
        requestAnimationFrame(() => {
          const container = this.$refs.chatMessages;
          if (container) {
            container.scrollTop = container.scrollHeight;
          }
        });
      });
    },
    switchView(viewName) {
      this.currentView = viewName;
      if (viewName !== "events") {
        this.eventFromMap = null;
      }
      if (viewName !== "user") {
        this.viewUserId = null;
      }
    },

    openUserProfile(userId) {
      if (!userId) return;
      const id = String(userId);
      if (this.currentView !== "user") {
        this.returnViewAfterUser = this.currentView;
      }
      this.viewUserId = id;
      this.currentView = "user";
      this.showProfileMenu = false;
    },

    closeUserView() {
      const back = this.returnViewAfterUser || "inicio";
      this.viewUserId = null;
      this.switchView(back);
    },

    openOwnProfile() {
      this.viewUserId = null;
      this.switchView("profile");
    },

    onAdminEventsChanged() {
      // Refrescar datos si hace falta en otras vistas
    },

    openEventFromMap(event) {
      this.eventFromMap = event;
      this.currentView = "events";
    },

    onEventCreated() {
      this.switchView("events");
    },
    handleLogin(user) {
      this.isLoggedIn = user.status === true;
      this.currentUser = user;
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("isLoggedIn", "true");

      this.loadGroupConversation();
      this.switchView("inicio");
    },

    async refreshCurrentUserFromServer(userId) {
      try {
        const res = await fetch(`http://localhost:5000/users/${userId}`);
        if (!res.ok) return;
        const data = await res.json();
        this.currentUser = {
          id: data.id,
          username: data.username,
          email: data.email,
          role: data.role,
          location: data.location,
          profileImage: data.profileImage,
          bio: data.bio,
          status: data.status,
        };
        localStorage.setItem("user", JSON.stringify(this.currentUser));
        if (this.isLoggedIn) {
          this.loadGroupConversation();
        }
      } catch (e) {
        console.error("Error refrescando usuario:", e);
      }
    },

    handleProfileUpdated(user) {
      this.currentUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        location: user.location,
        profileImage: user.profileImage,
        bio: user.bio,
        status: user.status,
      };
      localStorage.setItem("user", JSON.stringify(this.currentUser));
    },
    loadGroupConversation() {
      fetch("http://localhost:5000/conversations/group")
        .then((res) => res.json())
        .then((conversation) => {
          this.groupConversationId = conversation._id;
          if (this.chatMode === "group" || !this.conversationId) {
            this.conversationId = conversation._id;
            this.chatMode = "group";
            this.privateChatFriend = null;
          }
          socket.emit("join-group-chat", this.currentUser.id);
          return fetch(
            `http://localhost:5000/conversations/${conversation._id}/add-participant`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: this.currentUser.id }),
            },
          );
        })
        .then((res) => res.json())
        .then(() => {
          if (this.isGroupActive || !this.conversationId) {
            this.loadMessages();
          }
        })
        .catch((error) => console.error("Error cargando conversación:", error));

      this.loadPrivateFriendsList();
    },

    async loadPrivateFriendsList() {
      if (!this.currentUser?.id) return;
      try {
        this.privateFriendsList = await apiJson(
          `/users/${this.currentUser.id}/friends`,
        );
      } catch (e) {
        console.error(e);
        this.privateFriendsList = [];
      }
    },

    selectGroupChat() {
      this.chatMode = "group";
      this.privateChatFriend = null;
      if (
        this.conversationId &&
        this.groupConversationId &&
        String(this.conversationId) !== String(this.groupConversationId)
      ) {
        socket.emit("leave-private-chat", {
          conversationId: this.conversationId,
        });
      }
      if (this.groupConversationId) {
        this.conversationId = this.groupConversationId;
        this.loadMessages();
      } else {
        this.loadGroupConversation();
      }
    },

    async startPrivateChatWith(friend) {
      await this.openPrivateChat({
        otherUser: friend,
      });
    },

    async openPrivateChat({ conversationId, otherUser }) {
      if (!this.currentUser?.id || !otherUser?.id) return;

      this.chatOpen = true;
      this.chatMode = "private";

      try {
        let convId = conversationId;
        if (!convId) {
          const data = await apiJson(
            `/users/${this.currentUser.id}/conversations/private`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ friendId: otherUser.id }),
            },
          );
          convId = data.conversationId;
        }

        if (this.conversationId && this.conversationId !== convId) {
          socket.emit("leave-private-chat", {
            conversationId: this.conversationId,
          });
        }

        this.conversationId = convId;
        this.privateChatFriend = otherUser;
        socket.emit("join-private-chat", { conversationId: convId });
        this.loadMessages();
      } catch (error) {
        console.error(error);
      }
    },
    toggleProfileMenu() {
      this.showProfileMenu = !this.showProfileMenu;
    },
    selectOption(option) {
      this.showProfileMenu = false;
      switch (option) {
        case "profile":
          this.switchView("profile");
          break;
        case "myevents":
          this.switchView("myevents");
          break;
        case "friends":
          this.switchView("friends");
          break;
        case "admin":
          this.switchView("admin");
          break;
        case "logout":
          this.logout();
          break;
        case "login":
          this.switchView("profile");
          break;
        case "register":
          this.switchView("newUser");
          break;
        default:
          break;
      }
    },
    loadMessages() {
      if (!this.conversationId) return;

      fetch(
        `http://localhost:5000/conversations/${this.conversationId}/messages`,
      )
        .then((res) => res.json())
        .then((messages) => {
          this.messages = messages.map((msg) => ({
            id: msg._id,
            text: msg.text,
            senderId: msg.senderId._id,
            senderName: msg.senderId.username,
            senderImage: msg.senderId.profileImage,
            type: msg.senderId._id === this.currentUser.id ? "user" : "bot",
            sentAt: msg.sentAt,
          }));

          // SCROLL ABAJO
          this.$nextTick(() => {
            this.scrollToBottom();
          });
        })
        .catch((error) => console.error("Error cargando mensajes:", error));
    },
    logout() {
      // Llamar al servidor para establecer status en false
      const userId = this.currentUser.id;

      fetch("http://localhost:5000/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      }).catch((error) => console.error("Error en logout:", error));

      // Limpiar estado local
      this.isLoggedIn = false;
      this.currentUser = null;
      this.chatOpen = false;
      this.chatMode = "group";
      this.messages = [];
      this.conversationId = null;
      this.groupConversationId = null;
      this.privateChatFriend = null;
      this.privateFriendsList = [];
      this.messageInput = "";
      localStorage.removeItem("user");
      localStorage.removeItem("isLoggedIn");
      this.switchView("profile");
    },
    toggleChat() {
      this.chatOpen = !this.chatOpen;
      if (this.chatOpen && !this.conversationId) {
        this.selectGroupChat();
      } else if (this.chatOpen) {
        this.scrollToBottom();
      }
    },
    sendMessage() {
      if (this.messageInput.trim() === "" || !this.conversationId) return;

      const messageText = this.messageInput;

      // Enviar mensaje al servidor
      fetch("http://localhost:5000/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: this.conversationId,
          senderId: this.currentUser.id,
          text: messageText,
        }),
      })
        .then((res) => res.json())
        .then(() => {
          this.messageInput = "";
          this.scrollToBottom();
        })
        .catch((error) => {
          console.error("Error enviando mensaje:", error);
          this.messageInput = messageText; // Restaurar el mensaje si falla
        });
    },
  },
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
  /* background: linear-gradient(135deg, rgba(10, 10, 20, 1), rgba(20, 20, 40, 1)); */
  -webkit-app-region: drag;
  /*background-image: url("@/assets/newbackground.svg");*/
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
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
  color: rgba(255, 149, 100, 0.9);
  font-family: "Inter", sans-serif;
  font-weight: 500;
  white-space: nowrap;
  -webkit-app-region: no-drag;
}

.logout-btn {
  font-family: "Inter", sans-serif;
  padding: 0.5rem 1rem;
  background: rgba(255, 100, 100, 0.2);
  border: 1px solid rgba(253, 50, 50, 0.5);
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

.navbar {
  background: rgba(20, 20, 40, 0);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
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
  color: rgba(128, 137, 255, 0.836);
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
  padding: 0.6rem 2.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 162, 100, 0.3);
  border-radius: 0.2rem;
  color: rgb(255, 208, 186);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.nav-btn:hover {
  background: rgba(112, 41, 204, 0.2);
  border-color: rgba(159, 100, 255, 0.6);
  color: rgb(221, 195, 255);
  transform: translateY(-2px);
}

.nav-btn.active {
  background: linear-gradient(
    135deg,
    rgba(150, 66, 228, 0.808),
    rgba(224, 97, 59, 0.808)
  );
  border-color: rgba(197, 41, 30, 0.8);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 0 0 15px rgba(255, 102, 0, 0.507);
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
  background: rgba(103, 12, 139, 0.377);
  border: 1px solid rgba(171, 87, 226, 0.3);
  border-radius: 0.2rem;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 500;
  white-space: nowrap;
}

.profile-btn:hover {
  background: rgba(255, 162, 100, 0.2);
  border-color: rgba(255, 162, 100, 0.6);
  color: rgba(255, 162, 100, 1);
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

.submenu-btn.admin-menu-item {
  color: rgba(220, 180, 255, 0.95);
}

.submenu-btn.admin-menu-item:hover {
  background: rgba(180, 120, 255, 0.2);
}

.access-denied {
  color: rgba(255, 150, 150, 0.9);
  padding: 2rem;
  -webkit-app-region: no-drag;
}

.profile-link-chat {
  background: none;
  border: none;
  padding: 0 12px 4px 12px;
  color: rgba(150, 220, 255, 0.95);
  cursor: pointer;
  text-decoration: underline;
  font-size: 0.8rem;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  text-align: left;
}

/* ===== CONTENIDO PRINCIPAL ===== */
.main-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
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

.chat-button {
  position: fixed;
  bottom: 40px;
  right: 20px;
  width: 100px;
  height: 50px;
  border-radius: 0.2rem;
  background: rgba(26, 6, 61, 0.774);
  border: 1px solid rgb(120, 85, 201);
  color: rgb(231, 231, 231);
  font-size: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(146, 61, 226, 0.596);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  -webkit-app-region: no-drag;
}

.chat-button:hover {
  background: rgb(154, 100, 255);
  color: rgb(47, 14, 77);
  box-shadow: 0 6px 25px rgba(159, 100, 255, 0.6);
  transform: scale(1.1);
}

.chat-button:active {
  transform: scale(0.95);
}

.chat-panel {
  position: fixed;
  bottom: 95px;
  right: 16px;
  width: min(520px, 92vw);
  height: min(380px, 55vh);
  background: rgba(18, 18, 36, 0.97);
  border: 1px solid rgba(255, 162, 100, 0.4);
  border-radius: 0.35rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.55);
  display: flex;
  flex-direction: row;
  z-index: 99;
  backdrop-filter: blur(14px);
  -webkit-app-region: no-drag;
  animation: slideUp 0.28s ease;
  overflow: hidden;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.chat-sidebar {
  width: 38%;
  min-width: 130px;
  max-width: 180px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(255, 162, 100, 0.22);
  background: rgba(0, 0, 0, 0.28);
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.55rem 0.65rem;
  font-size: 0.82rem;
  font-weight: 700;
  color: rgba(255, 149, 100, 0.95);
  border-bottom: 1px solid rgba(255, 162, 100, 0.2);
}

.sidebar-close {
  background: none;
  border: none;
  color: rgba(255, 208, 186, 0.7);
  cursor: pointer;
  font-size: 0.9rem;
  padding: 0.15rem 0.35rem;
}

.chat-list {
  list-style: none;
  margin: 0;
  padding: 0.35rem 0;
  overflow-y: auto;
  flex: 1;
}

.chat-list-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.55rem;
  background: transparent;
  border: none;
  border-left: 3px solid transparent;
  cursor: pointer;
  text-align: left;
  color: rgb(255, 230, 210);
  font-family: "Inter", sans-serif;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.chat-list-item:hover {
  background: rgba(255, 162, 100, 0.1);
}

.chat-list-item.active {
  background: rgba(255, 162, 100, 0.18);
  border-left-color: rgba(255, 149, 100, 0.95);
}

.chat-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.85rem;
  font-weight: 700;
  background: linear-gradient(
    135deg,
    rgba(103, 12, 139, 0.55),
    rgba(197, 41, 30, 0.6)
  );
  color: #fff;
}

.group-avatar {
  background: linear-gradient(
    135deg,
    rgba(255, 180, 100, 0.9),
    rgba(197, 41, 30, 0.85)
  );
  color: rgba(20, 8, 5, 0.95);
}

.chat-list-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.chat-list-name {
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-list-preview {
  font-size: 0.65rem;
  opacity: 0.55;
}

.sidebar-hint {
  margin: 0;
  padding: 0.5rem 0.6rem 0.75rem;
  font-size: 0.68rem;
  line-height: 1.35;
  color: rgba(255, 208, 186, 0.5);
}

.chat-conversation {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.conversation-header {
  padding: 0.55rem 0.75rem;
  border-bottom: 1px solid rgba(255, 162, 100, 0.2);
  background: rgba(255, 162, 100, 0.06);
}

.conversation-header h3 {
  margin: 0;
  font-size: 0.88rem;
  font-family: "Inter", sans-serif;
  color: rgba(255, 149, 100, 0.95);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.no-chat-selected {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 208, 186, 0.45);
  font-size: 0.85rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
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
  background: rgba(255, 162, 100, 0.55);
  color: rgba(20, 8, 5, 0.95);
}

.message.bot p {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 230, 210, 0.95);
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
  gap: 6px;
  padding: 8px 10px;
  border-top: 1px solid rgba(255, 162, 100, 0.25);
  background: rgba(12, 12, 28, 0.95);
}

.chat-input input {
  flex: 1;
  padding: 7px 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 162, 100, 0.3);
  border-radius: 0.2rem;
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  outline: none;
}

.chat-input input:focus {
  border-color: rgba(255, 149, 100, 0.7);
}

.chat-input button {
  padding: 7px 12px;
  background: rgba(212, 154, 105, 0.9);
  border: 1px solid rgba(197, 41, 30, 0.7);
  border-radius: 0.2rem;
  color: rgba(20, 8, 5, 0.95);
  cursor: pointer;
  font-family: "Inter", sans-serif;
  font-size: 0.82rem;
  font-weight: 600;
}

.chat-input button:hover {
  background: rgba(100, 200, 255, 0.8);
  box-shadow: 0 0 10px rgba(100, 200, 255, 0.3);
}

.chat-input button:active {
  transform: scale(0.95);
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(255, 162, 100, 0.6),
    rgba(197, 41, 30, 0.5)
  );
  border-radius: 10px;
}
</style>
