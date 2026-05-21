<template>
  <div class="user-profile-container">
    <button type="button" class="back-btn" @click="$emit('back')">← Volver</button>

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

      <div class="readonly-info">
        <p v-if="showEmail">
          <strong>Email:</strong> {{ profile.email }}
        </p>
        <p v-if="profile.location">
          <strong>Ubicación:</strong>
          {{ profile.location.city || "—" }},
          {{ profile.location.country || "—" }}
        </p>
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
            <p v-if="event.start" class="event-date">{{ formatDate(event.start) }}</p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              📍 {{ event.location[0].location }}
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
        <button type="button" class="link-btn" @click="$emit('open-own-profile')">
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
import { apiJson, eventIdentifier, isAdminRole, normalizeEventList } from "../utils/api.js";

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
  emits: ["back", "open-own-profile"],
  data() {
    return {
      profile: null,
      loading: true,
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
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
        this.profile = null;
      } finally {
        this.loading = false;
      }
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
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  border-radius: 1rem;
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
</style>
