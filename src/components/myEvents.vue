<template>
  <div class="my-events-container">
    <!--<h1>Mis Eventos</h1>-->

    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div v-if="loading" class="loading">Cargando tus eventos...</div>

    <template v-else>
      <!-- MY events -->
      <section class="section">
        <h2>Eventos que organizas</h2>


        <div v-if="moderatedEventsList.length === 0" class="no-events-inline">
          <p>No has creado ningún evento.</p>
          <p class="hint">
            Crea uno desde <strong>Eventos → + Crear evento</strong>.
          </p>
        </div>

        <ul v-else class="events-list">
          <li
            v-for="event in moderatedEventsList"
            :key="'mod-' + eventKey(event)"
            class="event-card moderated-card"
          >
            <div class="event-card-header">
              <h3 @click="selectEvent(event)"
             class="event-title-clickable">{{ event.title || "Evento" }}</h3>
              <span class="badge-moderator">Moderador</span>
              <span
                v-if="event.type"
                class="event-type"
                :class="`type-${event.type}`"
              >
                {{ event.type }}
              </span>
            </div>
            <p v-if="event.start" class="event-date">
              {{ formatDate(event.start) }}
            </p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              {{ event.location[0].location }}
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>

            <div class="card-actions">
              <button type="button" class="edit-btn" @click="toggleEdit(event)">
                {{
                  editingId === eventKey(event) ? "Cerrar edición" : "Editar"
                }}
              </button>
            </div>

            <!--Editrar opciones-->
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
                </select>
              </div>
              <div class="form-group">
                <label>Descripción</label>
                <textarea v-model="editForm.description" rows="2" />
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Inicio</label>
                  <input
                    v-model="editForm.start"
                    type="datetime-local"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Fin</label>
                  <input
                    v-model="editForm.end"
                    type="datetime-local"
                    required
                  />
                </div>
              </div>
              <div class="form-group">
                <label>Ubicación</label>
                <input v-model="editForm.locationLabel" type="text" />
              </div>
              <button type="submit" class="save-btn" :disabled="saving">
                {{ saving ? "Guardando..." : "Guardar cambios" }}
              </button>
            </form>

            <!--Asistentes-->
            <div class="attendees-block">
              <h4>Asistentes ({{ attendeesFor(event).length }})</h4>
              <div
                v-if="loadingAttendeesId === eventKey(event)"
                class="attendees-loading"
              >
                Cargando...
              </div>
              <ul v-else-if="attendeesFor(event).length" class="attendees-list">
                <li
                  v-for="att in attendeesFor(event)"
                  :key="att.id"
                  class="attendee-row"
                >
                  <button
                    v-if="att.id && mongooseIdLike(att.id)"
                    type="button"
                    class="profile-link"
                    @click="$emit('view-user', att.id)"
                  >
                    {{ att.username }}
                  </button>
                  <span v-else>{{ att.username }}</span>
                  <span v-if="att.email" class="attendee-email">{{
                    att.email
                  }}</span>
                  <button
                    type="button"
                    class="remove-attendee-btn"
                    :disabled="
                      removingAttendee === attendeeRemoveKey(event, att)
                    "
                    @click="removeAttendee(event, att)"
                  >
                    {{
                      removingAttendee === attendeeRemoveKey(event, att)
                        ? "..."
                        : "Eliminar"
                    }}
                  </button>
                </li>
              </ul>
              <p v-else class="no-attendees">Nadie apuntado aún</p>
            </div>
          </li>
        </ul>
      </section>

      <!--Joined events-->
      <section class="section">
        <h2>Eventos apuntados</h2>


        <div v-if="joinedOnlyList.length === 0" class="no-events-inline">
          <p>No estás apuntado a otros eventos.</p>
        </div>

        <ul v-else class="events-list">
          <li
            v-for="event in joinedOnlyList"
            :key="'join-' + eventKey(event)"
            class="event-card"
           
          >
            <div class="event-card-header">
              <h3  @click="selectEvent(event)"
             class="event-title-clickable">{{ event.title || "Evento" }}</h3>
              <span
                v-if="event.type"
                class="event-type"
                :class="`type-${event.type}`"
              >
                {{ event.type }}
              </span>
            </div>
            <p v-if="event.start" class="event-date">
              {{ formatDate(event.start) }}
            </p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              {{ event.location[0].location }}
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>
            <button
              type="button"
              class="leave-btn"
              :disabled="leavingEventId === eventKey(event)"
              @click="leaveEvent(event)"
            >
              {{
                leavingEventId === eventKey(event)
                  ? "Desapuntando..."
                  : "Desapuntarse"
              }}
            </button>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<script>
import {
  apiJson,
  eventIdentifier,
  isUpcomingEvent,
  normalizeEventList,
  toDatetimeLocal,
} from "../utils/api.js";

export default {
  name: "my-events-view",
  props: {
    userId: {
      type: String,
      required: true,
    },
  },
  emits: ["events-updated", "view-user"],
  data() {
    return {
      joinedEvents: [],
      moderatedEvents: [],
      attendeesByEvent: {},
      loading: true,
      loadingAttendeesId: null,
      leavingEventId: null,
      removingAttendee: null,
      editingId: null,
      editForm: {
        title: "",
        type: "coches",
        description: "",
        start: "",
        end: "",
        locationLabel: "",
      },
      saving: false,
      notification: "",
      notificationClass: "",
    };
  },
  computed: {
    moderatedEventsList() {
      return normalizeEventList(this.moderatedEvents);
    },
    joinedEventsList() {
      return normalizeEventList(this.joinedEvents);
    },
    joinedOnlyList() {
      const modIds = new Set(
        this.moderatedEventsList.map((e) => this.eventKey(e)),
      );
      return this.joinedEventsList.filter((e) => !modIds.has(this.eventKey(e)));
    },
  },
  watch: {
    userId: {
      immediate: true,
      handler() {
        this.loadMyEvents();
      },
    },
  },
  methods: {
    eventKey(event) {
      return eventIdentifier(event) || String(event);
    },

    mongooseIdLike(id) {
      return /^[a-f\d]{24}$/i.test(String(id));
    },

    attendeesFor(event) {
      return this.attendeesByEvent[this.eventKey(event)] || [];
    },

    attendeeRemoveKey(event, att) {
      return `${this.eventKey(event)}-${att.id}`;
    },

    eventPreview(event) {
      const raw = event.description || "";
      const plain = typeof raw === "string" ? raw.replace(/<[^>]*>/g, "") : "";
      return plain.length > 100 ? `${plain.slice(0, 100)}...` : plain || "—";
    },

    async loadMyEvents() {
      if (!this.userId) return;

      this.loading = true;
      this.notification = "";

      try {
        const data = await apiJson(`/users/${this.userId}`);
        this.joinedEvents = data.joinedEvents || [];
        this.moderatedEvents = data.moderatedEvents || data.managedEvents || [];

        await Promise.all(
          this.moderatedEventsList.map((ev) => this.loadAttendees(ev)),
        );
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
        this.joinedEvents = [];
        this.moderatedEvents = [];
      } finally {
        this.loading = false;
      }
    },

    async loadAttendees(event) {
      const id = this.eventKey(event);
      this.loadingAttendeesId = id;
      try {
        const list = await apiJson(`/events/${id}/attendees`);
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: list };
      } catch (error) {
        console.error(error);
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: [] };
      } finally {
        if (this.loadingAttendeesId === id) {
          this.loadingAttendeesId = null;
        }
      }
    },

    toggleEdit(event) {
      const id = this.eventKey(event);
      if (this.editingId === id) {
        this.editingId = null;
        return;
      }
      this.editingId = id;
      const loc = event.location?.[0];
      this.editForm = {
        title: event.title || "",
        type: event.type || "coches",
        description: (event.description || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 2000),
        start: toDatetimeLocal(event.start),
        end: toDatetimeLocal(event.end),
        locationLabel: loc?.location || "",
      };
      if (!this.attendeesFor(event).length && !this.loadingAttendeesId) {
        this.loadAttendees(event);
      }
    },

    buildLocationPayload(event) {
      const prev = event.location?.[0] || {};
      return [
        {
          location: this.editForm.locationLabel.trim() || prev.location || "",
          latitude: prev.latitude || "0",
          longitude: prev.longitude || "0",
        },
      ];
    },

    async saveEvent(event) {
      const eventId = this.eventKey(event);

      if (new Date(this.editForm.end) < new Date(this.editForm.start)) {
        this.showNotification(
          "La fecha de fin no puede ser anterior al inicio",
          "error",
        );
        return;
      }

      this.saving = true;

      try {
        const updated = await apiJson(`/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moderatorId: this.userId,
            title: this.editForm.title.trim(),
            type: this.editForm.type,
            description: this.editForm.description.trim(),
            start: new Date(this.editForm.start).toISOString(),
            end: new Date(this.editForm.end).toISOString(),
            location: this.buildLocationPayload(event),
          }),
        });

        this.updateEventInLists(updated);
        this.editingId = null;
        this.showNotification("Evento actualizado", "success");
        this.$emit("events-updated", await apiJson(`/users/${this.userId}`));
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.saving = false;
      }
    },

    updateEventInLists(updated) {
      const id = this.eventKey(updated);
      const updateList = (list) => {
        if (!isUpcomingEvent(updated)) {
          return list.filter((e) => this.eventKey(e) !== id);
        }

        return list.map((e) => (this.eventKey(e) === id ? updated : e));
      };

      this.moderatedEvents = updateList(this.moderatedEvents);
      this.joinedEvents = updateList(this.joinedEvents);
    },

    async removeAttendee(event, attendee) {
      const eventId = this.eventKey(event);
      this.removingAttendee = this.attendeeRemoveKey(event, attendee);

      try {
        const updated = await apiJson(
          `/events/${eventId}/attendees/${encodeURIComponent(
            attendee.id,
          )}?moderatorId=${this.userId}`,
          { method: "DELETE" },
        );

        this.updateEventInLists(updated);
        await this.loadAttendees(event);
        this.showNotification("Asistente eliminado", "success");
        this.$emit("events-updated", await apiJson(`/users/${this.userId}`));
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.removingAttendee = null;
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
        this.joinedEvents = data.joinedEvents || [];

        // Quitar al usuario del chat del evento
        const eventMongoId = event._id || eventId;
        try {
          await apiJson(`/events/${eventMongoId}/conversation/leave`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: this.userId }),
          });
        } catch (chatError) {
          console.error("Error saliendo del chat del evento:", chatError);
        }
        this.$emit("event-chat-left", {
          eventId: eventMongoId,
        });

        this.showNotification("Te has desapuntado del evento", "success");
        this.$emit("events-updated", data);
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.leavingEventId = null;
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
    selectEvent(event) {
      this.$emit("select-event", event);
    },
  },
};
</script>

<style scoped>
.my-events-container {
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  padding: 1.5rem 2rem;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(99, 86, 155, 0.247),
    rgba(0, 0, 0, 0.705)
  );
  


  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

h1 {
  margin: 0 0 1rem;
  font-size: 1.8rem;
}

.section {
  margin-bottom: 2.5rem;
}

.section h2 {
  margin: 0 0 0.35rem;
  font-size: 1.25rem;
}

.section-hint {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  opacity: 0.75;
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
.no-events-inline {
  padding: 1rem;
  opacity: 0.85;
}

.hint {
  margin-top: 0.4rem;
  font-size: 0.9rem;
  opacity: 0.75;
}

.events-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.event-card {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.moderated-card {
  border-color: rgba(255, 193, 7, 0.35);
  background: rgba(12, 3, 59, 0.24);
}

.event-card-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
}

.event-card-header h3 {
  margin: 0;
  font-size: 1.05rem;
  flex: 1 1 100%;
}

.badge-moderator {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 193, 7, 0.35);
  border-radius: 0.4rem;
  color: #ffe082;
}

.event-type {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  text-transform: capitalize;
}

.event-date,
.event-location,
.event-preview {
  margin: 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.edit-btn {
  padding: 0.5rem 1rem;
  background: rgba(33, 150, 243, 0.35);
  border: 1px solid rgba(33, 150, 243, 0.6);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
}

.edit-btn:hover {
  background: rgba(33, 150, 243, 0.55);
}

.edit-form {
  margin-top: 0.75rem;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group label {
  font-size: 0.8rem;
  opacity: 0.85;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  font-family: inherit;
}

.form-group select option {
  color: #222;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
@media (max-width: 700px) {
  .form-row {
    display: flex;
    flex-direction: column;
  }
}
.save-btn {
  padding: 0.6rem 1rem;
  background: rgba(76, 175, 80, 0.45);
  border: 1px solid rgba(76, 175, 80, 0.7);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
  align-self: flex-start;
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.4rem;
  font-size: 0.85rem;
}

.attendee-email {
  opacity: 0.65;
  font-size: 0.8rem;
}

.remove-attendee-btn {
  margin-left: auto;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.4rem;
  color: white;
  cursor: pointer;
}

.remove-attendee-btn:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.55);
}

.remove-attendee-btn:disabled {
  opacity: 0.5;
}

.profile-link {
  background: none;
  border: none;
  color: rgba(150, 220, 255, 1);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
  font-size: inherit;
}

.no-attendees,
.attendees-loading {
  font-size: 0.85rem;
  opacity: 0.7;
  margin: 0;
}

.leave-btn {
  margin-top: 0.5rem;
  padding: 0.6rem 1rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
}

.leave-btn:hover:not(:disabled) {
  background: rgba(244, 67, 54, 0.55);
}

.leave-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.my-events-container::-webkit-scrollbar {
  width: 8px;
}

.my-events-container::-webkit-scrollbar-track {
  background: rgba(99, 102, 241, 0.05);
  border-radius: 10px;
}

.my-events-container::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.6),
    rgba(168, 85, 247, 0.6)
  );
  border-radius: 10px;
  border: 2px solid rgba(99, 102, 241, 0.1);
}

.my-events-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.8),
    rgba(168, 85, 247, 0.8)
  );
}
.event-title-clickable {
  cursor: pointer;
  transition: color 0.2s ease;
  display: inline-block; 
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
  .my-events-container {
    max-height: 100vh;

    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 3rem;
  }
}
</style>
