<template>
  <div class="profile-container">
    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div v-if="loading" class="loading">Cargando perfil...</div>

    <template v-else-if="profile">
      <div class="profile-header">
        <div class="avatar-section">
          <img
            v-if="form.profileImage && !imageError"
            :src="form.profileImage"
            alt="Foto de perfil"
            class="avatar"
            @error="onImageError"
          />
          <div v-else class="avatar avatar-placeholder">
            {{ form.username.charAt(0).toUpperCase() }}
          </div>
        </div>
        <div class="header-info">
          <h1>{{ form.username }}</h1>
          <p class="email">{{ profile.email }}</p>
          <span class="role-badge">{{ profile.role }}</span>
        </div>
      </div>

      <form class="profile-form" @submit.prevent="saveProfile">
        <div class="form-group">
          <label for="username">Nombre de usuario</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            required
            placeholder="Tu nombre de usuario"
          />
        </div>

        <div class="form-group">
          <label for="profileImage">URL de imagen de perfil</label>
          <input
            id="profileImage"
            v-model="form.profileImage"
            type="url"
            placeholder="https://..."
            @input="imageError = false"
          />
        </div>

        <div class="form-group">
          <label for="bio">Biografía</label>
          <textarea
            id="bio"
            v-model="form.bio"
            rows="4"
            placeholder="Cuéntanos sobre ti..."
          />
        </div>

        <div class="readonly-info">
          <p><strong>Email:</strong> {{ profile.email }}</p>
          <p v-if="profile.location">
            <strong>Ubicación:</strong>
            {{ profile.location.city || "—" }},
            {{ profile.location.country || "—" }}
          </p>
          <p>
            <strong>Miembro desde:</strong>
            {{ formatDate(profile.createdAt) }}
          </p>
        </div>

        <button type="submit" class="save-btn" :disabled="saving">
          {{ saving ? "Guardando..." : "Guardar cambios" }}
        </button>
      </form>

      <section class="joined-events-section">
        <h2>Eventos apuntados</h2>
        <div v-if="joinedEventsList.length === 0" class="no-events">
          <p>No estás apuntado a ningún evento</p>
        </div>
        <ul v-else class="joined-events-list">
          <li
            v-for="event in joinedEventsList"
            :key="eventKey(event)"
            class="joined-event-item"
          >
            <div class="event-info">
              <h3>{{ event.title || "Evento" }}</h3>
              <p v-if="event.start" class="event-date">
                {{ formatDate(event.start) }}
              </p>
              <p
                v-if="event.location && event.location.length > 0"
                class="event-location"
              >
                📍 {{ event.location[0].location }}
              </p>
            </div>
            <button
              type="button"
              class="leave-btn"
              :disabled="leavingEventId === eventKey(event)"
              @click="leaveEvent(event)"
            >
              {{ leavingEventId === eventKey(event) ? "Saliendo..." : "Salir" }}
            </button>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="error-state">
      <p>No se pudo cargar el perfil</p>
    </div>
  </div>
</template>

<script>
import { apiJson, eventIdentifier } from "../utils/api.js";

export default {
  name: "profile-view",
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  emits: ["profile-updated"],
  data() {
    return {
      profile: null,
      form: {
        username: "",
        profileImage: "",
        bio: "",
      },
      loading: true,
      saving: false,
      leavingEventId: null,
      notification: "",
      notificationClass: "",
      imageError: false,
    };
  },
  computed: {
    joinedEventsList() {
      if (!this.profile?.joinedEvents?.length) return [];
      return this.profile.joinedEvents.map((e) => {
        if (e && typeof e === "object" && (e.title || e._id)) return e;
        return { _id: e, title: "Evento" };
      });
    },
  },
  watch: {
    userId: {
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
      if (!this.userId) return;

      this.loading = true;
      this.notification = "";

      try {
        const data = await apiJson(`/users/${this.userId}`);
        this.profile = data;
        this.form = {
          username: data.username || "",
          profileImage: data.profileImage || "",
          bio: data.bio || "",
        };
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
        this.profile = null;
      } finally {
        this.loading = false;
      }
    },

    async saveProfile() {
      if (!this.form.username.trim()) {
        this.showNotification("El nombre de usuario es obligatorio", "error");
        return;
      }

      this.saving = true;

      try {
        const data = await apiJson(`/users/${this.userId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: this.form.username.trim(),
            profileImage: this.form.profileImage.trim(),
            bio: this.form.bio.trim(),
          }),
        });
        this.profile = data;
        this.form.username = data.username;
        this.form.profileImage = data.profileImage || "";
        this.form.bio = data.bio || "";
        this.imageError = false;

        this.showNotification("Perfil actualizado correctamente", "success");
        this.$emit("profile-updated", data);
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.saving = false;
      }
    },

    async leaveEvent(event) {
      const eventId = this.eventKey(event);
      if (!confirm(`¿Salir del evento "${event.title || "este evento"}"?`)) {
        return;
      }

      this.leavingEventId = eventId;

      try {
        const data = await apiJson(
          `/users/${this.userId}/joined-events/${eventId}`,
          { method: "DELETE" }
        );
        this.profile = data;
        this.showNotification("Has salido del evento", "success");
        this.$emit("profile-updated", data);
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.leavingEventId = null;
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
.profile-container {
  display: flex;
  flex-direction: column;
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
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  border-radius: 1rem;
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

.notification {
  padding: 0.8rem 1rem;
  border-radius: 0.6rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.notification.success {
  background: rgba(76, 175, 80, 0.3);
}

.notification.error {
  background: rgba(244, 67, 54, 0.3);
}

.loading,
.error-state,
.no-events {
  text-align: center;
  padding: 2rem;
  opacity: 0.85;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.avatar-section {
  flex-shrink: 0;
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
  margin: 0 0 0.3rem;
  font-size: 1.8rem;
}

.email {
  margin: 0 0 0.5rem;
  opacity: 0.8;
}

.role-badge {
  display: inline-block;
  padding: 0.25rem 0.7rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  font-size: 0.85rem;
  text-transform: capitalize;
}

.profile-form {
  max-width: 520px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.form-group input,
.form-group textarea {
  font-family: "Inter", sans-serif;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  color: white;
  outline: none;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

.readonly-info {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.8rem;
  font-size: 0.95rem;
  line-height: 1.6;
}

.readonly-info p {
  margin: 0.3rem 0;
}

.save-btn {
  align-self: flex-start;
  padding: 0.8rem 1.5rem;
  background: rgba(33, 150, 243, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 0.8rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: rgba(33, 150, 243, 0.75);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.joined-events-section h2 {
  margin: 0 0 1rem;
  font-size: 1.3rem;
}

.joined-events-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  max-width: 640px;
}

.joined-event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
}

.event-info h3 {
  margin: 0 0 0.3rem;
  font-size: 1.05rem;
}

.event-date,
.event-location {
  margin: 0.15rem 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.leave-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.leave-btn:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.55);
}

.leave-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
