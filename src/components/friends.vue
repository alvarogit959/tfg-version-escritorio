<template>
  <div class="friends-container">
    <h1 class="page-title">Amigos</h1>
    <p class="page-subtitle">Añade amigos y chatea en privado con ellos.</p>

    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div v-if="loading" class="loading">Cargando...</div>

    <template v-else>
<!--SEARCH AND ADD FRIEND-->
      <section class="panel-card">
        <h2 class="section-title">Añadir amigo</h2>
        <form class="search-form" @submit.prevent="searchUsers">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre de usuario..."
          />
          <button type="submit" class="btn-primary" :disabled="searching">
            {{ searching ? "..." : "Buscar" }}
          </button>
        </form>

        <ul v-if="searchResults.length" class="search-results">
          <li v-for="u in searchResults" :key="u.id" class="user-row">
            <div class="user-info">
              <strong>{{ u.username }}</strong>
              <span v-if="u.bio" class="bio-preview">{{ u.bio }}</span>
            </div>
            <button
              type="button"
              class="btn-primary btn-sm"
              :disabled="sendingTo === u.id"
              @click="sendRequest(u)"
            >
              {{ sendingTo === u.id ? "..." : "Enviar solicitud" }}
            </button>
          </li>
        </ul>
      </section>

<!--INCOMING FRIENDSHIP lmao-->
      <section v-if="incoming.length" class="panel-card">
        <h2 class="section-title">Solicitudes recibidas</h2>
        <ul class="requests-list">
          <li v-for="req in incoming" :key="req.id" class="user-row">
            <div class="user-info">
              <strong>{{ req.from.username }}</strong>
            </div>
            <div class="row-actions">
              <button
                type="button"
                class="btn-primary btn-sm"
                :disabled="responding === req.id"
                @click="respondRequest(req.id, 'accept')"
              >
                Aceptar
              </button>
              <button
                type="button"
                class="btn-ghost btn-sm"
                :disabled="responding === req.id"
                @click="respondRequest(req.id, 'decline')"
              >
                Rechazar
              </button>
            </div>
          </li>
        </ul>
      </section>

<!--FRIENDSHIP PENDING-->
      <section v-if="outgoing.length" class="panel-card">
        <h2 class="section-title">Solicitudes enviadas</h2>
        <ul class="requests-list">
          <li v-for="req in outgoing" :key="req.id" class="user-row pending">
            <span>{{ req.to.username }}</span>
            <span class="pending-tag">Pendiente</span>
          </li>
        </ul>
      </section>

<!--FRIENDLIST-->
      <section class="panel-card">
        <h2 class="section-title">Mis amigos ({{ friends.length }})</h2>
        <div v-if="friends.length === 0" class="empty">
          <p>Aún no tienes amigos. Busca usuarios arriba para enviar una solicitud.</p>
        </div>
        <ul v-else class="friends-list">
          <li v-for="friend in friends" :key="friend.id" class="user-row">
            <button
              type="button"
              class="user-link"
              @click="$emit('view-user', friend.id)"
            >
              {{ friend.username }}
            </button>
            <div class="row-actions">
              <button
                type="button"
                class="btn-primary btn-sm"
                @click="openChat(friend)"
              >
                Chat
              </button>
              <button
                type="button"
                class="btn-danger btn-sm"
                :disabled="removing === friend.id"
                @click="removeFriend(friend)"
              >
                {{ removing === friend.id ? "..." : "Eliminar" }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script>
import { apiJson } from "../utils/api.js";

export default {
  name: "friends-view",
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  emits: ["view-user", "open-private-chat"],
  data() {
    return {
      friends: [],
      incoming: [],
      outgoing: [],
      searchQuery: "",
      searchResults: [],
      loading: true,
      searching: false,
      sendingTo: null,
      responding: null,
      removing: null,
      notification: "",
      notificationClass: "",
    };
  },
  watch: {
    userId: {
      immediate: true,
      handler() {
        this.loadAll();
      },
    },
  },
  methods: {
    async loadAll() {
      if (!this.userId) return;
      this.loading = true;
      try {
        const [friends, requests] = await Promise.all([
          apiJson(`/users/${this.userId}/friends`),
          apiJson(`/users/${this.userId}/friend-requests`),
        ]);
        this.friends = friends;
        this.incoming = requests.incoming || [];
        this.outgoing = requests.outgoing || [];
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.loading = false;
      }
    },

    async searchUsers() {
      const q = this.searchQuery.trim();
      if (!q) {
        this.showNotification("Escribe un nombre de usuario", "error");
        return;
      }
      this.searching = true;
      try {
        this.searchResults = await apiJson(
          `/users/search?username=${encodeURIComponent(q)}&currentUserId=${this.userId}`
        );
        if (!this.searchResults.length) {
          this.showNotification("No se encontraron usuarios", "info");
        }
      } catch (error) {
        this.showNotification(error.message, "error");
        this.searchResults = [];
      } finally {
        this.searching = false;
      }
    },

    async sendRequest(user) {
      this.sendingTo = user.id;
      try {
        await apiJson(`/users/${this.userId}/friend-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: user.id }),
        });
        this.showNotification(`Solicitud enviada a ${user.username}`, "success");
        this.searchResults = this.searchResults.filter((u) => u.id !== user.id);
        await this.loadAll();
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.sendingTo = null;
      }
    },

    async respondRequest(requestId, action) {
      this.responding = requestId;
      try {
        const data = await apiJson(`/friend-requests/${requestId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.userId, action }),
        });
        this.showNotification(data.message, "success");
        await this.loadAll();
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.responding = null;
      }
    },

    async removeFriend(friend) {
      if (!confirm(`¿Eliminar a ${friend.username} de tus amigos?`)) return;
      this.removing = friend.id;
      try {
        await apiJson(`/users/${this.userId}/friends/${friend.id}`, {
          method: "DELETE",
        });
        this.showNotification("Amigo eliminado", "success");
        await this.loadAll();
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.removing = null;
      }
    },

    async openChat(friend) {
      try {
        const data = await apiJson(`/users/${this.userId}/conversations/private`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ friendId: friend.id }),
        });
        this.$emit("open-private-chat", {
          conversationId: data.conversationId,
          otherUser: data.otherUser || friend,
        });
      } catch (error) {
        this.showNotification(error.message, "error");
      }
    },

    showNotification(message, type) {
      this.notification = message;
      this.notificationClass = type;
      setTimeout(() => {
        this.notification = "";
        this.notificationClass = "";
      }, 3500);
    },
  },
};
</script>

<style scoped>
.friends-container {
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  padding: 1rem;
  color: white;
  font-family: "Inter", sans-serif;
  box-sizing: border-box;
  -webkit-app-region: no-drag;

  display: flex;
  flex-direction: column;
  gap: 1rem;

  background: linear-gradient(
    135deg,
    rgba(99, 86, 155, 0.247),
    rgba(0, 0, 0, 0.705)
  );




  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.page-title {
  margin: 0;
  font-size: 1.7rem;
  color: white;
}

.page-subtitle {
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.panel-card {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;

  padding: 1.1rem 1.2rem;

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.5rem;
}

.notification {
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.notification.success {
  background: rgba(76, 175, 80, 0.15);
}

.notification.error {
  background: rgba(244, 67, 54, 0.15);
}

.notification.info {
  background: rgba(255, 255, 255, 0.08);
}

.loading,
.empty {
  opacity: 0.8;
  padding: 1rem;
}

.search-form {
  display: flex;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
}

.search-form input {
  flex: 1;
  padding: 0.65rem 0.9rem;

  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;

  color: white;
  font-family: inherit;
}

.search-form input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

.search-form input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.search-results,
.requests-list,
.friends-list {
  list-style: none;
  padding: 0;
  margin: 0;

  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  padding: 0.9rem 1rem;

  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;

  transition: all 0.25s ease;
}

.user-row:hover {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.4);
}

.user-row.pending {
  opacity: 0.85;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.bio-preview {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
}

.user-link {
  background: none;
  border: none;
  padding: 0;

  color: rgb(96, 168, 250);
  cursor: pointer;

  font-size: 1rem;
  font-weight: 600;
  text-decoration: underline;
}

.row-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.pending-tag {
  color: rgb(255, 208, 186);
  font-size: 0.8rem;
}

.btn-primary,
.btn-ghost,
.btn-danger {
  font-family: inherit;

  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;

  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border-radius: 0.6rem;
  color: white;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.btn-primary:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-ghost:hover {
  background: rgba(255, 255, 255, 0.18);
}

.btn-danger {
  background: rgba(180, 60, 60, 0.25);
  border: 1px solid rgba(255, 120, 120, 0.3);
}

.btn-danger:hover {
  background: rgba(180, 60, 60, 0.4);
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}

.friends-container::-webkit-scrollbar {
  width: 12px;
}

.friends-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.friends-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.friends-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}
@media (max-width: 700px) {
  .friends-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 5rem;
  }}


</style>
