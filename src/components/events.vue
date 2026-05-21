<template>
  <div class="events-container">
    <div class="content-wrapper">
      <!-- Lista de eventos (pantalla completa hasta que se elige uno) -->
      <div class="events-list-section">
        <div class="list-header">
          <h2>Eventos</h2>
          <button
            v-if="currentUser"
            type="button"
            class="create-event-btn"
            @click="$emit('create-event')"
          >
            + Crear evento
          </button>
        </div>

        <p v-if="notification" class="notification" :class="notificationClass">
          {{ notification }}
        </p>

        <div class="events-list">
          <div
            v-for="event in events"
            :key="eventKey(event)"
            class="event-card"
            @click="selectEvent(event)"
          >
            <div class="event-card-header">
              <h3>{{ event.title }}</h3>
              <span class="event-type" :class="`type-${event.type}`">{{ event.type }}</span>
            </div>
            <p class="event-date">{{ formatDate(event.start) }}</p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              {{ event.location[0].location }}
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>
          </div>

          <div v-if="events.length === 0" class="no-events">
            <p>No hay eventos disponibles</p>
          </div>
        </div>
      </div>

      <!-- Detalle a pantalla completa sobre la lista -->
      <Transition name="detail-slide">
        <div v-if="selectedEvent" class="event-details-overlay">
          <div class="details-toolbar">
            <button type="button" class="back-btn" @click="closeDetail">
              ← Volver
            </button>
          </div>

          <div class="details-scroll">
            <div class="details-content">
              <div class="details-title-row">
                <h1>{{ selectedEvent.title }}</h1>
                <span class="event-type detail-type" :class="`type-${selectedEvent.type}`">
                  {{ selectedEvent.type }}
                </span>
              </div>

              <div
                v-if="selectedEvent.images && selectedEvent.images.length > 0"
                class="images-gallery"
              >
                <div class="images-container">
                  <img
                    v-for="(image, index) in selectedEvent.images"
                    :key="index"
                    :src="image"
                    :alt="`Evento ${index + 1}`"
                    class="event-image"
                  />
                </div>
              </div>

              <div class="event-info">
                <div class="info-group">
                  <label>Descripción</label>
                  <p>{{ selectedEvent.description }}</p>
                </div>

                <div class="info-group">
                  <label>Fecha inicio</label>
                  <p>{{ formatDateFull(selectedEvent.start) }}</p>
                </div>

                <div class="info-group">
                  <label>Fecha fin</label>
                  <p>{{ formatDateFull(selectedEvent.end) }}</p>
                </div>

                <div
                  v-if="selectedEvent.location && selectedEvent.location.length > 0"
                  class="info-group"
                >
                  <label>Ubicación</label>
                  <p>{{ selectedEvent.location[0].location }}</p>
                  <p class="coordinates">
                    {{ selectedEvent.location[0].latitude }},
                    {{ selectedEvent.location[0].longitude }}
                  </p>
                </div>

                <div class="info-group">
                  <label>
                    Asistentes
                    <template v-if="!loadingAttendees">
                      ({{ resolvedAttendees.length }})
                    </template>
                  </label>
                  <div v-if="loadingAttendees" class="attendees-loading">
                    Cargando asistentes...
                  </div>
                  <div
                    v-else-if="resolvedAttendees.length > 0"
                    class="attendees-list"
                  >
                    <span
                      v-for="att in resolvedAttendees"
                      :key="att.id"
                      class="attendee-badge"
                    >
                      {{ att.username }}
                    </span>
                  </div>
                  <p v-else class="no-attendees">Nadie apuntado aún</p>
                </div>

                <div class="action-buttons">
                  <button
                    class="attend-btn"
                    :disabled="attending || isAttendingSelected"
                    @click="attendEvent"
                  >
                    {{
                      attending
                        ? "Apuntando..."
                        : isAttendingSelected
                          ? "Ya estás apuntado"
                          : "Asistir a este evento"
                    }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import {
  apiJson,
  eventIdentifier,
  isUserAttending,
  userIdFrom,
} from "../utils/api.js";

export default {
  name: "events-view",
  props: {
    initialEvent: {
      type: Object,
      default: null,
    },
    currentUser: {
      type: Object,
      default: null,
    },
  },
  emits: ["events-updated", "create-event"],
  data() {
    return {
      events: [],
      selectedEvent: null,
      resolvedAttendees: [],
      loadingAttendees: false,
      notification: "",
      notificationClass: "",
      attending: false,
    };
  },
  computed: {
    isAttendingSelected() {
      return isUserAttending(this.selectedEvent, this.currentUser);
    },
  },
  watch: {
    initialEvent: {
      handler() {
        this.applyInitialEvent();
      },
    },
  },
  async mounted() {
    await this.loadEvents();
    this.applyInitialEvent();
  },
  methods: {
    eventKey(event) {
      return eventIdentifier(event) || event.id;
    },

    async loadEvents() {
      try {
        this.events = await apiJson("/events");
        this.notification = "";
      } catch (error) {
        console.error("Error cargando eventos:", error);
        this.notification = error.message || "No se pudieron cargar los eventos";
        this.notificationClass = "error";
      }
    },

    eventPreview(event) {
      const raw = event.description || "";
      const plain =
        typeof raw === "string" ? raw.replace(/<[^>]*>/g, "") : "";
      return plain.length > 60 ? `${plain.slice(0, 60)}...` : plain || "—";
    },

    applyInitialEvent() {
      if (!this.initialEvent) return;

      const targetId = this.initialEvent.id;
      const targetMongoId = this.initialEvent._id;

      const match = this.events.find(
        (e) =>
          (targetId != null && e.id === targetId) ||
          (targetMongoId && e._id === targetMongoId)
      );

      this.selectEvent(match || this.initialEvent);
    },

    async selectEvent(event) {
      this.selectedEvent = event;
      await this.loadAttendeesForSelected();
    },

    closeDetail() {
      this.selectedEvent = null;
      this.resolvedAttendees = [];
    },

    async loadAttendeesForSelected() {
      if (!this.selectedEvent) return;

      const eventId = eventIdentifier(this.selectedEvent);
      this.loadingAttendees = true;
      this.resolvedAttendees = [];

      try {
        this.resolvedAttendees = await apiJson(`/events/${eventId}/attendees`);
      } catch (error) {
        console.error(error);
        this.resolvedAttendees = [];
      } finally {
        this.loadingAttendees = false;
      }
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    },

    formatDateFull(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    async attendEvent() {
      const userId = userIdFrom(this.currentUser);
      if (!userId) {
        this.notification = "Debes iniciar sesión para apuntarte";
        this.notificationClass = "error";
        return;
      }

      if (!this.selectedEvent) return;

      const eventId = eventIdentifier(this.selectedEvent);
      this.attending = true;

      try {
        const data = await apiJson(
          `/users/${userId}/joined-events/${eventId}`,
          { method: "POST" }
        );

        if (data.event) {
          this.updateEventInList(data.event);
          this.selectedEvent = data.event;
        }

        await this.loadAttendeesForSelected();
        this.notification = `Te has apuntado a: ${this.selectedEvent.title}`;
        this.notificationClass = "success";
        this.$emit("events-updated", data.user);
      } catch (error) {
        console.error(error);
        this.notification = error.message;
        this.notificationClass = "error";
      } finally {
        this.attending = false;
        setTimeout(() => {
          if (this.selectedEvent) {
            this.notification = "";
          }
        }, 3500);
      }
    },

    updateEventInList(updatedEvent) {
      const idx = this.events.findIndex(
        (e) =>
          (updatedEvent._id && e._id === updatedEvent._id) ||
          e.id === updatedEvent.id
      );
      if (idx >= 0) {
        this.events[idx] = updatedEvent;
      }
    },
  },
};
</script>

<style scoped>
.events-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  color: rgb(255, 208, 186);
  padding: 0;
  -webkit-app-region: no-drag;
  overflow: hidden;
}

.content-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* ===== Lista (única vista visible sin selección) ===== */
.events-list-section {
  display: flex;
  flex-direction: column;
 
  height: 100%;
  background: rgba(20, 20, 40, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 162, 100, 0.25);
  border-radius: 0.2rem;
  padding: 1rem 1.2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 162, 100, 0.2);
}

.list-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-family: "Inter", sans-serif;
  font-weight: bold;
  color: rgba(255, 149, 100, 0.9);
}

.create-event-btn {
  font-family: "Inter", sans-serif;
  padding: 0.55rem 1.1rem;
  font-size: 0.85rem;
  background: rgba(212, 154, 105, 0.85);
  border: 1px solid rgba(197, 41, 30, 0.8);
  border-radius: 0.2rem;
  color: rgba(0, 0, 0, 0.9);
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.create-event-btn:hover {
  background: rgba(255, 162, 100, 1);
  box-shadow: 0 0 12px rgba(255, 102, 0, 0.4);
  transform: translateY(-2px);
}

.notification {
  padding: 0.65rem 0.9rem;
  border-radius: 0.2rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 162, 100, 0.3);
}

.notification.success {
  background: rgba(76, 175, 80, 0.25);
  color: #b8f5b8;
}

.notification.error {
  background: rgba(244, 67, 54, 0.25);
  color: #ffab91;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  overflow-y: auto;
  flex: 1;
  padding-right: 0.35rem;
}

.events-list::-webkit-scrollbar {
  width: 6px;
}

.events-list::-webkit-scrollbar-thumb {
  background: rgba(255, 162, 100, 0.35);
  border-radius: 10px;
}

.event-card {
  font-family: "Inter", sans-serif;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 162, 100, 0.25);
  border-radius: 0.2rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-card:hover {
  background: rgba(255, 162, 100, 0.15);
  border-color: rgba(255, 162, 100, 0.5);
  transform: translateY(-2px);
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}

.event-card-header h3 {
  margin: 0;
  font-size: 1rem;
  color: rgb(255, 230, 210);
  flex: 1;
}

.event-type {
  padding: 0.25rem 0.55rem;
  border-radius: 0.2rem;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: capitalize;
  background: rgba(103, 12, 139, 0.35);
  border: 1px solid rgba(171, 87, 226, 0.35);
  color: rgba(255, 220, 255, 0.95);
}

.type-carmeet,
.type-coches {
  background: rgba(255, 102, 0, 0.25);
  border-color: rgba(255, 162, 100, 0.5);
  color: rgba(255, 200, 150, 1);
}

.event-date {
  margin: 0.2rem 0;
  font-size: 0.85rem;
  color: rgba(255, 208, 186, 0.85);
}

.event-location {
  margin: 0.15rem 0;
  font-size: 0.8rem;
  color: rgba(255, 149, 100, 0.85);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-preview {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 208, 186, 0.55);
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 12rem;
  color: rgba(255, 208, 186, 0.45);
  font-style: italic;
}

/* ===== Detalle a pantalla completa ===== */
.event-details-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: rgba(20, 20, 40, 0.92);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 162, 100, 0.35);
  border-radius: 0.2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.details-toolbar {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 162, 100, 0.25);
  background: rgba(0, 0, 0, 0.2);
}

.back-btn {
  font-family: "Inter", sans-serif;
  padding: 0.55rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 162, 100, 0.35);
  border-radius: 0.2rem;
  color: rgb(255, 208, 186);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(255, 162, 100, 0.2);
  border-color: rgba(255, 162, 100, 0.6);
  color: rgba(255, 162, 100, 1);
}

.details-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.5rem;
}

.details-scroll::-webkit-scrollbar {
  width: 6px;
}

.details-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 162, 100, 0.35);
  border-radius: 10px;
}

.details-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1.25rem;
}

.details-content h1 {
  margin: 0;
  font-size: 1.65rem;
  font-family: "Inter", sans-serif;
  color: rgba(255, 149, 100, 0.95);
  flex: 1;
  min-width: 200px;
}

.detail-type {
  align-self: center;
}

.images-gallery {
  margin-bottom: 1.25rem;
}

.images-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.event-image {
  max-width: 220px;
  max-height: 220px;
  border-radius: 0.2rem;
  object-fit: cover;
  border: 1px solid rgba(255, 162, 100, 0.35);
}

.event-info {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.info-group {
  background: rgba(255, 255, 255, 0.06);
  border-left: 3px solid rgba(255, 149, 100, 0.7);
  padding: 0.85rem 1rem;
  border-radius: 0.2rem;
}

.info-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  color: rgba(255, 149, 100, 0.95);
  margin-bottom: 0.35rem;
}

.info-group p {
  margin: 0;
  color: rgba(255, 230, 210, 0.95);
  line-height: 1.5;
}

.coordinates {
  font-size: 0.85rem;
  color: rgba(255, 208, 186, 0.65);
  margin-top: 0.3rem;
}

.attendees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.attendee-badge {
  background: rgba(103, 12, 139, 0.35);
  border: 1px solid rgba(171, 87, 226, 0.4);
  color: rgba(255, 220, 255, 0.95);
  padding: 0.3rem 0.65rem;
  border-radius: 0.2rem;
  font-size: 0.82rem;
}

.attendees-loading,
.no-attendees {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  color: rgba(255, 208, 186, 0.55);
  font-style: italic;
}

.action-buttons {
  margin-top: 0.5rem;
}

.attend-btn {
  width: 100%;
  max-width: 320px;
  padding: 0.85rem 1.5rem;
  font-family: "Inter", sans-serif;
  border-radius: 0.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: 600;
  background: rgba(212, 154, 105, 0.9);
  border: 1px solid rgba(197, 41, 30, 0.8);
  color: rgba(0, 0, 0, 0.9);
}

.attend-btn:hover:not(:disabled) {
  background: rgba(255, 162, 100, 1);
  box-shadow: 0 0 14px rgba(255, 102, 0, 0.45);
  transform: translateY(-2px);
}

.attend-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 162, 100, 0.25);
  color: rgba(255, 208, 186, 0.7);
}

/* Transición al abrir detalle */
.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}

.detail-slide-enter-from,
.detail-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
