<template>
  <div class="admin-panel">
    <h1>Panel de administración</h1>
    <p class="subtitle">Gestiona todos los eventos y usuarios de la plataforma.</p>

    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: tab === 'events' }"
        @click="tab = 'events'"
      >
        Eventos
      </button>
      <button
        type="button"
        :class="{ active: tab === 'users' }"
        @click="tab = 'users'"
      >
        Usuarios
      </button>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>

    <!-- EVENTOS -->
    <section v-else-if="tab === 'events'" class="section">
      <p class="hint">Puedes editar, eliminar eventos y quitar asistentes de cualquier evento.</p>

      <ul class="events-list">
        <li
          v-for="event in events"
          :key="eventKey(event)"
          class="event-card"
        >
          <div class="card-header">
            <h3>{{ event.title || "Evento" }}</h3>
            <span v-if="event.type" class="type-badge">{{ event.type }}</span>
          </div>
          <p v-if="event.start" class="meta">{{ formatDate(event.start) }}</p>
          <p
            v-if="event.location?.length"
            class="meta"
          >
            {{ event.location[0].location }}
          </p>

          <div class="card-actions">
            <button type="button" class="edit-btn" @click="toggleEdit(event)">
              {{ editingId === eventKey(event) ? "Cerrar" : "Editar" }}
            </button>
            <button
              type="button"
              class="delete-btn"
              :disabled="deletingEventId === eventKey(event)"
              @click="deleteEvent(event)"
            >
              {{ deletingEventId === eventKey(event) ? "..." : "Eliminar evento" }}
            </button>
          </div>

          <form
            v-if="editingId === eventKey(event)"
            class="edit-form"
            @submit.prevent="saveEvent(event)"
          >
            <div class="form-group">
              <label>Título</label>
              <input v-model="editForm.title" type="text" required />
            </div>
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="editForm.type">
                <option value="coches">Coches</option>
                <option value="motos">Motos</option>
                <option value="competicion">Competición</option>
                <option value="feria">Feria</option>
                <option value="carmeet">Car meet</option>
              </select>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea v-model="editForm.description" rows="2" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Inicio</label>
                <input v-model="editForm.start" type="datetime-local" required />
              </div>
              <div class="form-group">
                <label>Fin</label>
                <input v-model="editForm.end" type="datetime-local" required />
              </div>
            </div>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? "Guardando..." : "Guardar" }}
            </button>
          </form>

          <div class="attendees-block">
            <h4>Asistentes ({{ attendeesFor(event).length }})</h4>
            <ul v-if="attendeesFor(event).length" class="attendees-list">
              <li
                v-for="att in attendeesFor(event)"
                :key="att.id"
                class="attendee-row"
              >
                <button
                  type="button"
                  class="profile-link"
                  @click="$emit('view-user', att.id)"
                >
                  {{ att.username }}
                </button>
                <button
                  type="button"
                  class="remove-btn"
                  :disabled="removingAttendee === removeKey(event, att)"
                  @click="removeAttendee(event, att)"
                >
                  Quitar del evento
                </button>
              </li>
            </ul>
            <p v-else class="no-attendees">Sin asistentes</p>
          </div>
        </li>
      </ul>
      <p v-if="events.length === 0" class="empty">No hay eventos</p>
    </section>

    <!-- USUARIOS -->
    <section v-else class="section">
      <p class="hint">
        Eliminar un usuario es permanente: se quita de todos los eventos y se borra su cuenta.
      </p>

      <ul class="users-list">
        <li
          v-for="u in users"
          :key="u.id"
          class="user-row"
        >
          <div class="user-info">
            <strong>{{ u.username }}</strong>
            <span class="user-email">{{ u.email }}</span>
            <span class="role-tag" :class="{ admin: u.role === 'admin' }">{{ u.role }}</span>
          </div>
          <div class="user-actions">
            <button type="button" class="view-btn" @click="$emit('view-user', u.id)">
              Ver perfil
            </button>
            <button
              v-if="u.id !== adminId"
              type="button"
              class="delete-btn"
              :disabled="deletingUserId === u.id"
              @click="deleteUser(u)"
            >
              {{ deletingUserId === u.id ? "..." : "Eliminar usuario" }}
            </button>
            <span v-else class="self-tag">Tu cuenta</span>
          </div>
        </li>
      </ul>
      <p v-if="users.length === 0" class="empty">No hay usuarios</p>
    </section>
  </div>
</template>

<script>
import {
  apiJson,
  eventIdentifier,
  isUpcomingEvent,
  toDatetimeLocal,
  upcomingEvents,
} from "../utils/api.js";

export default {
  name: "admin-panel",
  props: {
    adminId: {
      type: String,
      required: true,
    },
  },
  emits: ["view-user", "events-changed"],
  data() {
    return {
      tab: "events",
      events: [],
      users: [],
      attendeesByEvent: {},
      loading: true,
      editingId: null,
      editForm: {
        title: "",
        type: "coches",
        description: "",
        start: "",
        end: "",
      },
      saving: false,
      deletingEventId: null,
      deletingUserId: null,
      removingAttendee: null,
      notification: "",
      notificationClass: "",
    };
  },
  watch: {
    adminId: {
      immediate: true,
      handler() {
        this.loadAll();
      },
    },
    tab() {
      if (this.tab === "users" && !this.users.length) {
        this.loadUsers();
      }
    },
  },
  methods: {
    eventKey(event) {
      return eventIdentifier(event) || String(event);
    },

    attendeesFor(event) {
      return this.attendeesByEvent[this.eventKey(event)] || [];
    },

    removeKey(event, att) {
      return `${this.eventKey(event)}-${att.id}`;
    },

    async loadAll() {
      this.loading = true;
      try {
        await Promise.all([this.loadEvents(), this.loadUsers()]);
      } finally {
        this.loading = false;
      }
    },

    async loadEvents() {
      try {
        this.events = upcomingEvents(await apiJson("/events"));
        await Promise.all(this.events.map((ev) => this.loadAttendees(ev)));
      } catch (error) {
        this.showNotification(error.message, "error");
        this.events = [];
      }
    },

    async loadUsers() {
      try {
        this.users = await apiJson(`/users?adminId=${this.adminId}`);
      } catch (error) {
        this.showNotification(error.message, "error");
        this.users = [];
      }
    },

    async loadAttendees(event) {
      const id = this.eventKey(event);
      try {
        const list = await apiJson(`/events/${id}/attendees`);
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: list };
      } catch {
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: [] };
      }
    },

    toggleEdit(event) {
      const id = this.eventKey(event);
      if (this.editingId === id) {
        this.editingId = null;
        return;
      }
      this.editingId = id;
      this.editForm = {
        title: event.title || "",
        type: event.type || "coches",
        description: (event.description || "").replace(/<[^>]*>/g, "").slice(0, 2000),
        start: toDatetimeLocal(event.start),
        end: toDatetimeLocal(event.end),
      };
      if (!this.attendeesFor(event).length) {
        this.loadAttendees(event);
      }
    },

    buildLocationPayload(event) {
      const prev = event.location?.[0] || {};
      return [
        {
          location: prev.location || "",
          latitude: prev.latitude || "0",
          longitude: prev.longitude || "0",
        },
      ];
    },

    async saveEvent(event) {
      const eventId = this.eventKey(event);
      this.saving = true;
      try {
        const updated = await apiJson(`/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moderatorId: this.adminId,
            title: this.editForm.title.trim(),
            type: this.editForm.type,
            description: this.editForm.description.trim(),
            start: new Date(this.editForm.start).toISOString(),
            end: new Date(this.editForm.end).toISOString(),
            location: this.buildLocationPayload(event),
          }),
        });
        if (isUpcomingEvent(updated)) {
          this.events = this.events.map((e) =>
            this.eventKey(e) === eventId ? updated : e
          );
        } else {
          this.events = this.events.filter((e) => this.eventKey(e) !== eventId);
        }
        this.editingId = null;
        this.showNotification("Evento actualizado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.saving = false;
      }
    },

    async deleteEvent(event) {
      const eventId = this.eventKey(event);
      if (!confirm(`¿Eliminar permanentemente "${event.title}"?`)) return;

      this.deletingEventId = eventId;
      try {
        await apiJson(
          `/events/${eventId}?moderatorId=${this.adminId}`,
          { method: "DELETE" }
        );
        this.events = this.events.filter((e) => this.eventKey(e) !== eventId);
        this.showNotification("Evento eliminado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.deletingEventId = null;
      }
    },

    async removeAttendee(event, attendee) {
      if (!confirm(`¿Quitar a "${attendee.username}" del evento?`)) return;

      const eventId = this.eventKey(event);
      this.removingAttendee = this.removeKey(event, attendee);
      try {
        await apiJson(
          `/events/${eventId}/attendees/${encodeURIComponent(attendee.id)}?moderatorId=${this.adminId}`,
          { method: "DELETE" }
        );
        await this.loadAttendees(event);
        this.showNotification("Asistente eliminado del evento", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.removingAttendee = null;
      }
    },

    async deleteUser(user) {
      if (
        !confirm(
          `¿Eliminar PERMANENTEMENTE al usuario "${user.username}"? Esta acción no se puede deshacer.`
        )
      ) {
        return;
      }

      this.deletingUserId = user.id;
      try {
        await apiJson(`/users/${user.id}?adminId=${this.adminId}`, {
          method: "DELETE",
        });
        this.users = this.users.filter((u) => u.id !== user.id);
        await this.loadEvents();
        this.showNotification("Usuario eliminado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.deletingUserId = null;
      }
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
  },
};
</script>

<style scoped>
.admin-panel {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: 1.5rem 2rem;
  color: white;
  background: linear-gradient(135deg, rgba(80, 40, 120, 0.25), rgba(0, 0, 0, 0.75));
  border: 2px solid rgba(180, 120, 255, 0.35);
  border-radius: 1rem;
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

h1 {
  margin: 0 0 0.25rem;
}

.subtitle {
  margin: 0 0 1rem;
  opacity: 0.8;
  font-size: 0.95rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.tabs button {
  padding: 0.5rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
}

.tabs button.active {
  background: rgba(180, 120, 255, 0.45);
  border-color: rgba(200, 150, 255, 0.7);
}

.notification {
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  margin-bottom: 1rem;
}

.notification.success {
  background: rgba(76, 175, 80, 0.35);
}

.notification.error {
  background: rgba(244, 67, 54, 0.35);
}

.hint {
  font-size: 0.9rem;
  opacity: 0.75;
  margin: 0 0 1rem;
}

.loading,
.empty {
  opacity: 0.8;
  padding: 1rem;
}

.events-list,
.users-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(180, 120, 255, 0.3);
  border-radius: 0.9rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-header h3 {
  margin: 0;
  flex: 1;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.4rem;
  text-transform: capitalize;
}

.meta {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}

.edit-btn,
.view-btn {
  padding: 0.45rem 0.9rem;
  background: rgba(33, 150, 243, 0.4);
  border: 1px solid rgba(33, 150, 243, 0.6);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.delete-btn {
  padding: 0.45rem 0.9rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.delete-btn:disabled {
  opacity: 0.5;
}

.edit-form {
  margin: 0.75rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
}

.form-group select option {
  color: #222;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}

.save-btn {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: rgba(76, 175, 80, 0.45);
  border: 1px solid rgba(76, 175, 80, 0.7);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.attendees-block {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.attendees-block h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.attendees-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.attendee-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.4rem;
}

.profile-link {
  background: none;
  border: none;
  color: rgba(150, 220, 255, 1);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.remove-btn {
  margin-left: auto;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.4rem;
  color: white;
  cursor: pointer;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-email {
  font-size: 0.85rem;
  opacity: 0.7;
}

.role-tag {
  font-size: 0.75rem;
  align-self: flex-start;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0.4rem;
  text-transform: capitalize;
}

.role-tag.admin {
  background: rgba(255, 193, 7, 0.35);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.self-tag {
  font-size: 0.85rem;
  opacity: 0.65;
}
.admin-panel::-webkit-scrollbar {
  width: 6px;
}

.admin-panel::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(255, 162, 100, 0.6),
    rgba(197, 41, 30, 0.5)
  );
  border-radius: 10px;
}
</style>
