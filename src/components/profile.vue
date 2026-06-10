<template>
  <div class="profile-container">
    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div v-if="loading" class="loading">
      <span class="loading-spinner" />
      Cargando perfil...
    </div>

    <template v-else-if="profile">
      <div class="profile-hero">
        <div class="hero-glow" />
        <div class="profile-header">
          <div class="avatar-wrap">
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
            <span
              class="role-badge"
              :class="{ admin: profile.role === 'admin' }"
            >
              {{ profile.role }}
            </span>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-card">
            <span class="stat-value">{{ joinedEventsList.length }}</span>
            <span class="stat-label">Eventos apuntados</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ memberSinceYear }}</span>
            <span class="stat-label">Miembro desde</span>
          </div>
          <div
            v-if="profile.location?.city || profile.location?.country"
            class="stat-card"
          >
            <span class="stat-value stat-location">
              {{ profile.location.city || "—" }}
            </span>
            <span class="stat-label">{{
              profile.location.country || "Ubicación"
            }}</span>
          </div>
        </div>
      </div>

      <!--Edit-->
      <section class="panel-card">
        <h2 class="section-title">Editar perfil</h2>
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
            <label for="bio">Biografía</label>
            <textarea
              id="bio"
              v-model="form.bio"
              rows="4"
              placeholder="Cuéntanos sobre ti, tu coche, tus eventos favoritos..."
            />
          </div>

          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? "Guardando..." : "Guardar cambios" }}
          </button>
        </form>
      </section>

      <!--SAVED events -->
      <section class="panel-card joined-events-section">
        <h2 class="section-title">Eventos apuntados</h2>


        <div v-if="joinedEventsList.length === 0" class="no-events">
          <p>No estás apuntado a ningún evento</p>
          <p class="hint">Explora la sección Eventos para apuntarte.</p>
        </div>

        <ul v-else class="joined-events-list">
          <li
            v-for="event in joinedEventsList"
            :key="eventKey(event)"
            class="joined-event-item"
          >
            <div class="event-info">
              <h3 @click="selectEvent(event)"
             class="event-title-clickable">{{ event.title || "Evento" }}</h3>
              <p v-if="event.start" class="event-date">
                {{ formatDate(event.start) }}
              </p>
              <p
                v-if="event.location && event.location.length > 0"
                class="event-location"
              >
                {{ event.location[0].location }}
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
    memberSinceYear() {
      if (!this.profile?.createdAt) return "—";
      return new Date(this.profile.createdAt).getFullYear();
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
        this.imageError = false;
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
            profileImage: (this.form.profileImage || "").trim(),
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

      this.leavingEventId = eventId;

      try {
        const data = await apiJson(
          `/users/${this.userId}/joined-events/${eventId}`,
          { method: "DELETE" },
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
        weekday: "short",
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
        selectEvent(event) {
      this.$emit("select-event", event);
    },
  },
};
</script>

<style scoped>
.profile-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.5rem;
  color: rgb(255, 255, 255);
  font-family: "Inter", sans-serif;
  box-sizing: border-box;
  -webkit-app-region: no-drag;
  gap: 1rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  align-items: center;
  justify-content: flex-start;
  color: rgb(255, 255, 255);
  -webkit-app-region: no-drag;
  box-sizing: border-box;
  margin-top: 0;
}

.profile-container::-webkit-scrollbar {
  width: 8px;
}

.profile-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.profile-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
}

.profile-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.notification {
  padding: 0.65rem 1rem;
  border-radius: 0.2rem;

  font-size: 0.9rem;
}

.notification.success {
  background: linear-gradient(
    90deg,
    rgba(76, 175, 80, 0.3),
    rgba(56, 142, 60, 0.2)
  );
  color: #c8f5c8;
}

.notification.error {
  background: linear-gradient(
    90deg,
    rgba(244, 67, 54, 0.35),
    rgba(197, 41, 30, 0.25)
  );
  color: #ffccbc;
}

.loading,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.75);
}

.loading-spinner {
  width: 22px;
  height: 22px;

  border-top-color: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.profile-hero {
  width: 80%;
  align-self: center;
  position: relative;

  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  padding: 1.5rem 1.5rem 1.25rem;
}

.profile-header {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1.35rem;
  margin-bottom: 1.25rem;
}

.avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  display: block;
  border: 3px solid rgba(255, 255, 255, 0.25);
}

.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.15);
  font-size: 2.6rem;
  font-weight: 700;
  color: rgba(255, 230, 210, 1);
}

.header-info h1 {
  margin: 0 0 0.35rem;
  font-size: 1.85rem;
  font-weight: 700;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 1),
    rgba(210, 210, 210, 1)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.email {
  margin: 0 0 0.6rem;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.75);
}

.role-badge {
  display: inline-block;
  padding: 0.3rem 0.85rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  border-radius: 0.2rem;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);

  color: rgba(255, 255, 255, 0.95);
}

.role-badge.admin {
  background: rgba(255, 255, 255, 0.24);
  border-color: rgba(255, 255, 255, 0.45);
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.stats-row {
  position: relative;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.65rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0.85rem 0.75rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.25), rgba(0, 0, 0, 0.08));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.2rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 1),
    rgba(210, 210, 210, 1)
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.stat-value.stat-location {
  font-size: 1.1rem;
}

.stat-label {
  margin-top: 0.25rem;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(255, 255, 255, 0.6);
}

/* ===== Paneles ===== */
.panel-card {
  align-self: center;
  width: 80%;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  border-radius: 0.2rem;
  padding: 1.25rem 1.35rem;
}

.section-title {
  margin: 0 0 1rem;
  padding-bottom: 0.65rem;
  font-size: 1.2rem;
  font-weight: 700;
  color: white;
}

.section-hint {
  margin: -0.5rem 0 1rem;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.55);
}

.profile-form {
  width: 80%;
  justify-self: center;
  align-self: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 560px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.form-group input,
.form-group textarea {
  font-family: "Inter", sans-serif;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.08), rgba(0, 0, 0, 0.15));
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  color: white;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}

.save-btn {
  padding: 0.8rem 1.6rem;
  font-family: "Inter", sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: 0.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  filter: brightness(1.05);
}

.save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

/* ===== Eventos apuntados ===== */
.no-events {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.55);
}

.no-events .hint {
  margin-top: 0.4rem;
  font-size: 0.88rem;
  opacity: 0.8;
}

.joined-events-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.joined-event-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.15rem;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.04)
  );

  border-radius: 0.2rem;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.joined-event-item:hover {
  border-color: rgba(255, 255, 255, 0.4);

}

.event-info h3 {
  margin: 0 0 0.25rem;
  font-size: 1.05rem;
  color: white;
}

.event-date {
  margin: 0.1rem 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.8);
}

.event-location {
  margin: 0.1rem 0 0;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.72);
}

.leave-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.1rem;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}

.leave-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.leave-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.event-title-clickable {
  cursor: pointer;
  transition: color 0.2s ease;

}

.event-title-clickable:hover {
  color: #71a7ee;
  transition: color 1s ease;
  transform: scale(1.1);
}

.event-title-clickable:active {
  transform: scale(0.99);
}

@media (max-width: 700px) {
  .profile-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 5rem;
  }
  .profile-header {
    flex-direction: column;
    text-align: center;
  }

  .header-info h1 {
    font-size: 1.5rem;
  }

  .joined-event-item {
    flex-direction: column;
    align-items: stretch;
  }

  .leave-btn {
    width: 100%;
    text-align: center;
  }
}
</style>
