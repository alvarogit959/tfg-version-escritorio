<template>
  <div class="events-container">
    <button id="back-button" @click="$emit('back')">Atrás</button>
    
    <div class="content-wrapper">
      <!-- LISTA DE EVENTOS -->
      <div class="events-list-section">
        <div class="list-header">
          <h2>Eventos Disponibles</h2>
          <button
            v-if="currentUser"
            type="button"
            class="create-event-btn"
            @click="$emit('create-event')"
          >
            + Crear evento
          </button>
        </div>
        <p v-if="notification" id="notification" :class="notificationClass">
          {{ notification }}
        </p>
        
        <div class="events-list">
          <div
            v-for="event in events"
            :key="event.id"
            class="event-card"
            :class="{ active: selectedEvent && selectedEvent.id === event.id }"
            @click="selectEvent(event)"
          >
            <div class="event-card-header">
              <h3>{{ event.title }}</h3>
              <span class="event-type" :class="`type-${event.type}`">{{ event.type }}</span>
            </div>
            <p class="event-date">
              {{ formatDate(event.start) }}
            </p>
            <p class="event-location" v-if="event.location && event.location.length > 0">
              📍 {{ event.location[0].location }}
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>
          </div>

          <div v-if="events.length === 0" class="no-events">
            <p>No hay eventos disponibles</p>
          </div>
        </div>
      </div>

      <!-- PANEL DE DETALLES -->
      <div class="event-details-section" v-if="selectedEvent">
        <div class="details-content">
          <h1>{{ selectedEvent.title }}</h1>
          
          <!-- GALERÍA DE IMÁGENES (espacio reservado) -->
          <div class="images-gallery">
            <div class="image-placeholder">
              <p>Imágenes del evento</p>
              <div v-if="selectedEvent.images && selectedEvent.images.length > 0" class="images-container">
                <img
                  v-for="(image, index) in selectedEvent.images"
                  :key="index"
                  :src="image"
                  :alt="`Evento ${index + 1}`"
                  class="event-image"
                />
              </div>
              <div v-else class="no-images">
                <p>Sin imágenes disponibles</p>
              </div>
            </div>
          </div>

          <!-- INFORMACIÓN DEL EVENTO -->
          <div class="event-info">
            <div class="info-group">
              <label>Tipo de Evento:</label>
              <p :class="`type-${selectedEvent.type}`">{{ selectedEvent.type }}</p>
            </div>

            <div class="info-group">
              <label>Descripción:</label>
              <p>{{ selectedEvent.description }}</p>
            </div>

            <div class="info-group">
              <label>Fecha Inicio:</label>
              <p>{{ formatDateFull(selectedEvent.start) }}</p>
            </div>

            <div class="info-group">
              <label>Fecha Fin:</label>
              <p>{{ formatDateFull(selectedEvent.end) }}</p>
            </div>

            <div class="info-group" v-if="selectedEvent.location && selectedEvent.location.length > 0">
              <label>Ubicación:</label>
              <p>{{ selectedEvent.location[0].location }}</p>
              <p class="coordinates">
                📍 {{ selectedEvent.location[0].latitude }}, {{ selectedEvent.location[0].longitude }}
              </p>
            </div>

            <div class="info-group" v-if="selectedEvent.attendees && selectedEvent.attendees.length > 0">
              <label>Asistentes ({{ selectedEvent.attendees.length }}):</label>
              <div class="attendees-list">
                <span v-for="(attendee, index) in selectedEvent.attendees" :key="index" class="attendee-badge">
                  {{ attendee }}
                </span>
              </div>
            </div>

            <div class="info-group" v-if="selectedEvent.url">
              <label>Enlace:</label>
              <a :href="selectedEvent.url" target="_blank" class="event-url">{{ selectedEvent.url }}</a>
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
              <button class="share-btn" @click="shareEvent">Compartir</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MENSAJE CUANDO NO HAY EVENTO SELECCIONADO -->
      <div v-else class="event-details-section">
        <div class="no-selection">
          <p>Selecciona un evento para ver más detalles</p>
        </div>
      </div>
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
    async loadEvents() {
      try {
        this.events = await apiJson("/events");
        this.notification = `${this.events.length} eventos cargados`;
        this.notificationClass = "success";
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

    selectEvent(event) {
      this.selectedEvent = event;
      console.log("Evento seleccionado:", event);
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short"
      });
    },

    formatDateFull(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
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
          this.notification = "";
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

    shareEvent() {
      const text = `Mira este evento: ${this.selectedEvent.title}`;
      if (navigator.share) {
        navigator.share({
          title: this.selectedEvent.title,
          text: text,
          url: this.selectedEvent.url
        });
      } else {
        this.notification = "Funcionalidad de compartir no disponible";
        this.notificationClass = "info";
      }
    }
  }
};
</script>

<style scoped>
.events-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.726));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  color: rgb(255, 255, 255);
  padding: 1rem;
  -webkit-app-region: no-drag;
}

#back-button {
  align-self: flex-end;
  width: 6rem;
  padding: 0.7rem 1rem;
  margin-bottom: 0.5rem;
  font-family: "Inter", sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  color: white;
  font-size: 0.9rem;
}

#back-button:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

#notification {
  padding: 0.8rem;
  border-radius: 0.6rem;
  margin-bottom: 0.8rem;
  font-size: 0.95rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

#notification.success {
  background: rgba(76, 175, 80, 0.3);
  border-color: rgba(76, 175, 80, 0.5);
  color: #90ee90;
}

#notification.error {
  background: rgba(244, 67, 54, 0.3);
  border-color: rgba(244, 67, 54, 0.5);
  color: #ff8a80;
}

#notification.info {
  background: rgba(33, 150, 243, 0.3);
  border-color: rgba(33, 150, 243, 0.5);
  color: #80d8ff;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  flex: 1;
  overflow: hidden;
}

/* ===== LISTA DE EVENTOS ===== */
.events-list-section {
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.2rem;
  overflow: hidden;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 1rem;
}

.list-header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: white;
}

.create-event-btn {
  flex-shrink: 0;
  padding: 0.5rem 1rem;
  font-size: 0.85rem;
  background: rgba(76, 175, 80, 0.35);
  border: 1px solid rgba(76, 175, 80, 0.6);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.create-event-btn:hover {
  background: rgba(76, 175, 80, 0.55);
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.events-list::-webkit-scrollbar {
  width: 6px;
}

.events-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.events-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.events-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.event-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-card:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateX(5px);
}

.event-card.active {
  background: rgba(100, 200, 255, 0.3);
  border-color: rgba(100, 200, 255, 0.8);
  box-shadow: 0 0 15px rgba(100, 200, 255, 0.3);
}

.event-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.event-card-header h3 {
  margin: 0;
  font-size: 1rem;
  color: white;
  flex: 1;
}

.event-type {
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  text-transform: capitalize;
}

.type-carmeet {
  background: rgba(255, 165, 0, 0.5);
  color: #ffb347;
}

.type-competicion {
  background: rgba(220, 20, 60, 0.5);
  color: #ff6b6b;
}

.type-feria {
  background: rgba(147, 112, 219, 0.5);
  color: #dda0dd;
}

.event-date {
  margin: 0.3rem 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.8);
}

.event-location {
  margin: 0.2rem 0;
  font-size: 0.8rem;
  color: rgba(100, 200, 255, 0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-preview {
  margin: 0.3rem 0 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* ===== PANEL DE DETALLES ===== */
.event-details-section {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.5rem;
  overflow-y: auto;
}

.event-details-section::-webkit-scrollbar {
  width: 6px;
}

.event-details-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.event-details-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.event-details-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.details-content h1 {
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  color: white;
}

/* ===== GALERÍA DE IMÁGENES ===== */
.images-gallery {
  margin-bottom: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.8rem;
  border: 1px dashed rgba(255, 255, 255, 0.2);
  padding: 1rem;
}

.image-placeholder {
  text-align: center;
}

.image-placeholder p {
  margin: 0 0 0.8rem 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.7);
}

.images-container {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  justify-content: center;
}

.event-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 0.6rem;
  object-fit: cover;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: transform 0.3s ease;
}

.event-image:hover {
  transform: scale(1.05);
}

.no-images {
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
  padding: 2rem 0;
}

/* ===== INFORMACIÓN DEL EVENTO ===== */
.event-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-group {
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid rgba(100, 200, 255, 0.6);
  padding: 0.8rem;
  border-radius: 0.4rem;
}

.info-group label {
  display: block;
  font-size: 0.9rem;
  font-weight: bold;
  color: rgba(100, 200, 255, 0.9);
  margin-bottom: 0.4rem;
}

.info-group p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
}

.coordinates {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.3rem;
}

.attendees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.attendee-badge {
  background: rgba(100, 200, 255, 0.3);
  border: 1px solid rgba(100, 200, 255, 0.6);
  color: rgba(100, 200, 255, 1);
  padding: 0.3rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.8rem;
}

.event-url {
  color: rgba(100, 200, 255, 0.9);
  text-decoration: none;
  word-break: break-all;
  transition: color 0.3s ease;
}

.event-url:hover {
  color: rgba(150, 220, 255, 1);
  text-decoration: underline;
}

/* ===== BOTONES DE ACCIÓN ===== */
.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.attend-btn,
.share-btn {
  flex: 1;
  padding: 0.9rem 1.5rem;
  font-family: "Inter", sans-serif;
  border: none;
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.95rem;
  font-weight: bold;
  min-width: 150px;
}

.attend-btn {
  background: rgba(76, 175, 80, 0.4);
  border: 1px solid rgba(76, 175, 80, 0.6);
  color: #90ee90;
}

.attend-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.attend-btn:disabled {
  opacity: 0.65;
  cursor: not-allowed;
  transform: none;
}

.share-btn {
  background: rgba(33, 150, 243, 0.4);
  border: 1px solid rgba(33, 150, 243, 0.6);
  color: #80d8ff;
}

.share-btn:hover {
  background: rgba(33, 150, 243, 0.6);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

/* ===== SIN SELECCIÓN ===== */
.no-selection {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
  font-size: 1.1rem;
  font-style: italic;
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .content-wrapper {
    grid-template-columns: 1fr;
  }

  .event-details-section {
    min-height: 300px;
  }
}
</style>
