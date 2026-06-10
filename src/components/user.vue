<template>
  <div class="user-profile-container">
    <button type="button" class="back-btn" @click="$emit('back')">
      ← Volver
    </button>

    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div v-if="loading" class="loading">Cargando perfil...</div>

    <template v-else-if="profile">
      <div class="profile-header">
        <div class="avatar-section">
          <img
            v-if="profile.profileImage && !imageError"
            :src="profile.profileImage"
            alt="Foto de perfil"
            class="avatar"
            @error="onImageError"
          />
          <div v-else class="avatar avatar-placeholder">
            {{ profile.username.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="header-info">
          <h1>{{ profile.username }}</h1>
          <span class="role-badge" :class="{ admin: profile.role === 'admin' }">
            {{ profile.role }}
          </span>
          <p v-if="profile.bio" class="bio">{{ profile.bio }}</p>
          <p v-else class="bio empty">Sin biografía</p>
        </div>
      </div>

      <div v-if="!isOwnProfile && currentUser?.id" class="friend-actions">
        <button
          v-if="relationship.isFriend"
          type="button"
          class="action-btn chat-btn"
          @click="openPrivateChat"
        >
          Abrir chat privado
        </button>
        <button
          v-else-if="relationship.pendingIncoming"
          type="button"
          class="action-btn accept-btn"
          :disabled="friendActionLoading"
          @click="acceptIncoming"
        >
          Aceptar solicitud de amistad
        </button>
        <button
          v-else-if="relationship.pendingOutgoing"
          type="button"
          class="action-btn pending-btn"
          disabled
        >
          Solicitud enviada
        </button>
        <button
          v-else-if="!relationship.isSelf"
          type="button"
          class="action-btn add-btn"
          :disabled="friendActionLoading"
          @click="sendFriendRequest"
        >
          {{ friendActionLoading ? "..." : "Añadir amigo" }}
        </button>
      </div>

      <div class="readonly-info">
        <p v-if="showEmail"><strong>Email:</strong> {{ profile.email }}</p>
        <p>
          <strong>Miembro desde:</strong>
          {{ formatDate(profile.createdAt) }}
        </p>
        <p v-if="profile.status !== undefined">
          <strong>Estado:</strong>
          {{ profile.status ? "En línea" : "Desconectado" }}
        </p>
      </div>

      <section v-if="joinedEventsList.length" class="events-section">
        <h2>Eventos apuntados</h2>
        <ul class="events-list">
          <li
            v-for="event in joinedEventsList"
            :key="eventKey(event)"
            class="event-item"
          >
            <h3>{{ event.title || "Evento" }}</h3>
            <p v-if="event.start" class="event-date">
              {{ formatDate(event.start) }}
            </p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              {{ event.location[0].location }}
            </p>
          </li>
        </ul>
      </section>

      <section
        v-if="managedEventsList.length && (isOwnProfile || isViewerAdmin)"
        class="events-section"
      >
        <h2>Eventos que organiza</h2>
        <ul class="events-list managed">
          <li
            v-for="event in managedEventsList"
            :key="'m-' + eventKey(event)"
            class="event-item"
          >
            <h3>{{ event.title || "Evento" }}</h3>
            <span v-if="event.type" class="event-type">{{ event.type }}</span>
          </li>
        </ul>
      </section>

      <div v-if="isOwnProfile" class="own-profile-hint">
        <button
          type="button"
          class="link-btn"
          @click="$emit('open-own-profile')"
        >
          Editar mi perfil
        </button>
      </div>
    </template>

    <div v-else class="error-state">
      <p>No se pudo cargar el perfil</p>
    </div>
  </div>
</template>

<script>
import {
  apiJson,
  eventIdentifier,
  isAdminRole,
  normalizeEventList,
} from "../utils/api.js";

export default {
  name: "user-view",
  props: {
    viewUserId: {
      type: String,
      required: true,
    },
    currentUser: {
      type: Object,
      default: null,
    },
  },
  emits: ["back", "open-own-profile", "open-private-chat"],
  data() {
    return {
      profile: null,
      relationship: {},
      loading: true,
      friendActionLoading: false,
      notification: "",
      notificationClass: "",
      imageError: false,
    };
  },
  computed: {
    isOwnProfile() {
      const cur = this.currentUser?.id;
      return cur && String(cur) === String(this.viewUserId);
    },
    isViewerAdmin() {
      return isAdminRole(this.currentUser?.role);
    },
    showEmail() {
      return this.isOwnProfile || this.isViewerAdmin;
    },
    joinedEventsList() {
      return normalizeEventList(this.profile?.joinedEvents);
    },
    managedEventsList() {
      const managed =
        this.profile?.managedEvents || this.profile?.moderatedEvents || [];
      return normalizeEventList(managed);
    },
  },
  watch: {
    viewUserId: {
      immediate: true,
      handler() {
        this.loadProfile();
      },
    },
  },
  methods: {
    eventKey(event) {
      return eventIdentifier(event) || String(event);
    },

    async loadProfile() {
      if (!this.viewUserId) return;
      this.loading = true;
      this.notification = "";
      this.imageError = false;
      try {
        this.profile = await apiJson(`/users/${this.viewUserId}`);
        await this.loadRelationship();
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
        this.profile = null;
      } finally {
        this.loading = false;
      }
    },

    async loadRelationship() {
      if (!this.currentUser?.id || this.isOwnProfile) {
        this.relationship = { isSelf: true };
        return;
      }
      try {
        this.relationship = await apiJson(
          `/users/${this.currentUser.id}/relationship/${this.viewUserId}`,
        );
      } catch {
        this.relationship = {};
      }
    },

    async sendFriendRequest() {
      this.friendActionLoading = true;
      try {
        await apiJson(`/users/${this.currentUser.id}/friend-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ toUserId: this.viewUserId }),
        });
        this.showNotification("Solicitud de amistad enviada", "success");
        await this.loadRelationship();
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.friendActionLoading = false;
      }
    },

    async acceptIncoming() {
      if (!this.relationship.incomingRequestId) return;
      this.friendActionLoading = true;
      try {
        await apiJson(
          `/friend-requests/${this.relationship.incomingRequestId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: this.currentUser.id,
              action: "accept",
            }),
          },
        );
        this.showNotification("¡Ahora sois amigos!", "success");
        await this.loadRelationship();
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.friendActionLoading = false;
      }
    },

    openPrivateChat() {
      this.$emit("open-private-chat", {
        otherUser: {
          id: this.profile.id,
          username: this.profile.username,
          profileImage: this.profile.profileImage,
        },
      });
    },

    onImageError() {
      this.imageError = true;
    },

    formatDate(date) {
      if (!date) return "—";
      return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
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
.user-profile-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  padding: 1.5rem 2rem;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  backdrop-filter: blur(10px);

  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

.back-btn {
  margin-bottom: 1rem;
  padding: 0.5rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
}

.back-btn:hover {
  background: rgba(100, 200, 255, 0.2);
}

.notification {
  padding: 0.8rem 1rem;
  border-radius: 0.6rem;
  margin-bottom: 1rem;
}

.notification.error {
  background: rgba(244, 67, 54, 0.3);
}

.notification.success {
  background: rgba(76, 175, 80, 0.25);
}

.loading,
.error-state {
  text-align: center;
  padding: 2rem;
  opacity: 0.85;
}

.profile-header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.4);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  font-size: 2.5rem;
  font-weight: 700;
}

.header-info h1 {
  margin: 0 0 0.5rem;
  font-size: 1.8rem;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.role-badge.admin {
  background: rgba(255, 193, 7, 0.35);
  color: #ffe082;
}

.bio {
  margin: 0.75rem 0 0;
  line-height: 1.5;
  opacity: 0.9;
}

.bio.empty {
  opacity: 0.55;
  font-style: italic;
}

.friend-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.action-btn {
  padding: 0.6rem 1.1rem;
  font-family: inherit;
  font-weight: 600;
  border-radius: 0.2rem;
  cursor: pointer;
  border: 1px solid rgba(255, 162, 100, 0.45);
  transition: all 0.25s ease;
}

.add-btn,
.accept-btn {
  background: linear-gradient(
    135deg,
    rgb(49, 33, 75),
    rgba(0, 0, 0, 0.85)
  );
  color: rgba(255, 255, 255, 0.95);
  border-color: blueviolet;
}

.chat-btn {
  background: rgba(103, 12, 139, 0.45);
  color: rgba(255, 220, 255, 1);
  border-color: rgba(171, 87, 226, 0.5);
}

.pending-btn {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 208, 186, 0.6);
  cursor: not-allowed;
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.readonly-info {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.8rem;
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 520px;
}

.events-section h2 {
  margin: 0 0 1rem;
  font-size: 1.25rem;
}

.events-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 0.8rem;
}

.event-item {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
}

.events-list.managed .event-item {
  border-color: rgba(255, 193, 7, 0.3);
}

.event-item h3 {
  margin: 0 0 0.35rem;
  font-size: 1rem;
}

.event-date,
.event-location {
  margin: 0.15rem 0;
  font-size: 0.85rem;
  opacity: 0.85;
}

.event-type {
  font-size: 0.75rem;
  text-transform: capitalize;
  opacity: 0.75;
}

.own-profile-hint {
  margin-top: 1.5rem;
}

.link-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(33, 150, 243, 0.4);
  border: 1px solid rgba(33, 150, 243, 0.6);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
}
@media (max-width: 700px) {
  .user-profile-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 5rem;
  }}
</style>
