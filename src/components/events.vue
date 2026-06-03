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

        <div class="events-controls">
          <div class="location-controls">
            <button
              type="button"
              class="control-btn"
              :disabled="locating"
              @click="activateLocation"
            >
              Usar ubicación
            </button>
            <span v-if="userLocation" class="location-status">
              Ubicación activa
            </span>
            <span v-else class="location-status muted">
              Sin ubicación
            </span>
          </div>

          <div class="filter-controls">
            <button
              v-for="type in eventTypeFilters"
              :key="type.value"
              type="button"
              class="type-filter-btn"
              :class="{ active: selectedTypes.includes(type.value) }"
              @click="toggleTypeFilter(type.value)"
            >
              {{ type.label }}
            </button>
          </div>

          <div class="date-controls">
            <label>
              <span>Desde</span>
              <input v-model="dateFrom" type="date">
            </label>
            <label>
              <span>Hasta</span>
              <input v-model="dateTo" type="date">
            </label>
            <button
              type="button"
              class="clear-date-btn"
              :disabled="!dateFrom && !dateTo"
              @click="clearDateFilters"
            >
              Limpiar
            </button>
          </div>

          <div class="sort-control">
            <span>Ordenar</span>
            <button
              type="button"
              class="sort-btn"
              :class="{ active: sortMode === 'date' }"
              @click="setSortMode('date')"
            >
              Fecha
            </button>
            <button
              type="button"
              class="sort-btn"
              :class="{ active: sortMode === 'distance' }"
              :disabled="locating"
              @click="setSortMode('distance')"
            >
              Distancia
            </button>
          </div>
        </div>

    <!--    <p v-if="notification" class="notification" :class="notificationClass">
          {{ notification }}
        </p>-->

        <div class="events-list">
          <div
            v-for="event in displayedEvents"
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
            <p v-if="userLocation && eventDistanceKm(event) !== null" class="event-distance">
              A {{ eventDistanceKm(event) }} km
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>
          </div>

          <div v-if="displayedEvents.length === 0" class="no-events">
            <p>No hay eventos disponibles con estos filtros</p>
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

              <div
                v-if="selectedEvent.location && selectedEvent.location.length > 0"
                class="event-map-block"
              >
                <label class="map-label">Ubicación en el mapa</label>
                <EventMiniMap
                  :key="'map-' + eventKey(selectedEvent)"
                  :event="selectedEvent"
                />
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
                    Organizadores
                    <template v-if="!loadingModerators">
                      ({{ resolvedModerators.length }})
                    </template>
                  </label>
                  <div v-if="loadingModerators" class="attendees-loading">
                    Cargando organizadores...
                  </div>
                  <div
                    v-else-if="resolvedModerators.length > 0"
                    class="moderators-list"
                  >
                    <button
                      v-for="mod in resolvedModerators"
                      :key="mod.id"
                      type="button"
                      class="moderator-badge"
                      :class="{ 'is-admin': mod.role === 'admin' }"
                      @click="$emit('view-user', mod.id)"
                    >
                      <span class="mod-name">{{ mod.username }}</span>
                      <span v-if="mod.role === 'admin'" class="mod-role">Admin</span>
                      <span v-else class="mod-role">Moderador</span>
                    </button>
                  </div>
                  <p v-else class="no-attendees">Sin organizadores asignados</p>
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
  isUpcomingEvent,
  isUserAttending,
  upcomingEvents,
  userIdFrom,
} from "../utils/api.js";
import EventMiniMap from "./EventMiniMap.vue";

export default {
  name: "events-view",
  components: { EventMiniMap },
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
  emits: ["events-updated", "create-event", "view-user"],
  data() {
    return {
      events: [],
      selectedEvent: null,
      resolvedAttendees: [],
      resolvedModerators: [],
      loadingAttendees: false,
      loadingModerators: false,
      notification: "",
      notificationClass: "",
      attending: false,
      userLocation: null,
      locating: false,
      sortMode: "date",
      dateFrom: "",
      dateTo: "",
      selectedTypes: ["coches", "motos", "competicion", "feria"],
      eventTypeFilters: [
        { value: "coches", label: "Coches" },
        { value: "motos", label: "Motos" },
        { value: "competicion", label: "Competición" },
        { value: "feria", label: "Ferias" },
      ],
    };
  },
  computed: {
    isAttendingSelected() {
      return isUserAttending(this.selectedEvent, this.currentUser);
    },

    displayedEvents() {
      const filtered = this.events.filter((event) =>
        this.selectedTypes.includes(this.getEventType(event)) &&
        this.isEventInsideDateRange(event)
      );

      return [...filtered].sort((a, b) => {
        if (this.sortMode === "distance" && this.userLocation) {
          const distanceA = this.getEventDistanceValue(a);
          const distanceB = this.getEventDistanceValue(b);
          return distanceA - distanceB;
        }

        return this.getEventDateValue(a) - this.getEventDateValue(b);
      });
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

    normalizeEventType(type) {
      if (!type) return "";
      const normalized = String(type).toLowerCase();
      if (normalized === "ferias") return "feria";
      if (normalized === "rally") return "competicion";
      if (normalized === "competición") return "competicion";
      if (normalized === "carmeet") return "coches";
      return normalized;
    },

    inferTypeFromUrl(event) {
      const url = (event.url || "").toLowerCase();
      if (url.includes("/concentraciones-de-coches-y-motos/")) return "coches";
      if (url.includes("/concentraciones-de-coches/")) return "coches";
      if (url.includes("/concentraciones-de-motos/")) return "motos";
      if (url.includes("/calendario/competicion/") || url.includes("/competicion/")) {
        return "competicion";
      }
      if (url.includes("/feria") || url.includes("/ferias")) return "feria";
      return "";
    },

    getEventType(event) {
      return this.normalizeEventType(event.type) || this.inferTypeFromUrl(event);
    },

    toggleTypeFilter(type) {
      if (this.selectedTypes.includes(type)) {
        this.selectedTypes = this.selectedTypes.filter((t) => t !== type);
      } else {
        this.selectedTypes = [...this.selectedTypes, type];
      }
    },

    async setSortMode(mode) {
      if (mode === "distance" && !this.userLocation) {
        await this.activateLocation();
      }

      if (mode === "distance" && !this.userLocation) return;
      this.sortMode = mode;
    },

    async activateLocation() {
  this.locating = true;

  try {
    const location = await this.getBrowserLocation();
    this.setUserLocation(location, "Ubicación activada");

  } catch (error) {
    console.warn("GPS falló:", error);

    //fallback sin API externa
    const location = {
      lat: 42.2406,
      lng: -8.7823
    };

    this.setUserLocation(location, "Ubicación aproximada (Cangas)");
  } finally {
    this.locating = false;
  }
},

    getBrowserLocation() {
      if (!navigator.geolocation) {
        return Promise.reject(new Error("Geolocalización no disponible"));
      }

      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          reject,
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });
    },


    setUserLocation(location, message) {
      this.userLocation = location;
      this.sortMode = "distance";
      this.notification = message;
      this.notificationClass = "success";
    },

    activateLocationOld() {
      if (!navigator.geolocation) {
        this.notification = "Tu dispositivo no permite usar ubicación";
        this.notificationClass = "error";
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          this.sortMode = "distance";
          this.notification = "Ubicación activada";
          this.notificationClass = "success";
        },
        (error) => {
          console.warn("No se pudo obtener la ubicación:", error);
          this.notification = "No se pudo obtener tu ubicación";
          this.notificationClass = "error";
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    },

    getEventCoordinates(event) {
      const loc = event.location?.[0];
      if (!loc) return null;

      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

      return { lat, lng };
    },

    getDistanceKm(from, to) {
      const earthRadiusKm = 6371;
      const toRadians = (degrees) => degrees * (Math.PI / 180);
      const dLat = toRadians(to.lat - from.lat);
      const dLng = toRadians(to.lng - from.lng);
      const lat1 = toRadians(from.lat);
      const lat2 = toRadians(to.lat);

      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);

      return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    },

    getEventDistanceValue(event) {
      if (!this.userLocation) return Number.POSITIVE_INFINITY;

      const eventCoordinates = this.getEventCoordinates(event);
      if (!eventCoordinates) return Number.POSITIVE_INFINITY;

      return this.getDistanceKm(this.userLocation, eventCoordinates);
    },

    getEventDateValue(event) {
      const rawDate = event.start || event.startDate || event.date;
      const timestamp = new Date(rawDate).getTime();
      return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
    },

    getEventEndDateValue(event) {
      const rawDate = event.end || event.start || event.startDate || event.date;
      const timestamp = new Date(rawDate).getTime();
      return Number.isNaN(timestamp) ? Number.POSITIVE_INFINITY : timestamp;
    },

    getDateStartValue(date) {
      if (!date) return null;
      const value = new Date(`${date}T00:00:00`).getTime();
      return Number.isNaN(value) ? null : value;
    },

    getDateEndValue(date) {
      if (!date) return null;
      const value = new Date(`${date}T23:59:59.999`).getTime();
      return Number.isNaN(value) ? null : value;
    },

    isEventInsideDateRange(event) {
      const from = this.getDateStartValue(this.dateFrom);
      const to = this.getDateEndValue(this.dateTo);
      if (from === null && to === null) return true;

      const eventStart = this.getEventDateValue(event);
      const eventEnd = this.getEventEndDateValue(event);
      if (!Number.isFinite(eventStart) && !Number.isFinite(eventEnd)) return false;

      if (from !== null && eventEnd < from) return false;
      if (to !== null && eventStart > to) return false;
      return true;
    },

    clearDateFilters() {
      this.dateFrom = "";
      this.dateTo = "";
    },

    eventDistanceKm(event) {
      const distance = this.getEventDistanceValue(event);
      if (!Number.isFinite(distance)) return null;

      return distance < 10 ? distance.toFixed(1) : Math.round(distance);
    },

    async loadEvents() {
      try {
        this.events = upcomingEvents(await apiJson("/events"));
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
      await Promise.all([
        this.loadAttendeesForSelected(),
        this.loadModeratorsForSelected(),
      ]);
    },

    closeDetail() {
      this.selectedEvent = null;
      this.resolvedAttendees = [];
      this.resolvedModerators = [];
    },

    async loadModeratorsForSelected() {
      if (!this.selectedEvent) return;

      const eventId = eventIdentifier(this.selectedEvent);
      this.loadingModerators = true;
      this.resolvedModerators = [];

      try {
        this.resolvedModerators = await apiJson(`/events/${eventId}/moderators`);
      } catch (error) {
        console.error(error);
        this.resolvedModerators = [];
      } finally {
        this.loadingModerators = false;
      }
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
      if (!isUpcomingEvent(updatedEvent)) {
        if (idx >= 0) this.events.splice(idx, 1);
        return;
      }
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
  color: rgb(255, 255, 255);
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
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.list-header h2 {
  margin: 0;
  font-size: 1.3rem;
  font-family: "Inter", sans-serif;
  font-weight: bold;
  color: rgb(255, 255, 255);
}

.create-event-btn {
  font-family: "Inter", sans-serif;
  padding: 0.55rem 1.1rem;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.create-event-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px);
}

.events-controls {
  display: grid;
  grid-template-columns: minmax(170px, auto) 1fr minmax(280px, auto) minmax(150px, auto);
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
}

.location-controls,
.filter-controls,
.date-controls,
.sort-control {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.filter-controls {
  flex-wrap: wrap;
}

.control-btn,
.type-filter-btn,
.sort-btn,
.clear-date-btn,
.date-controls input {
  font-family: "Inter", sans-serif;
  border-radius: 0.2rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.control-btn,
.type-filter-btn,
.sort-btn,
.clear-date-btn {
  padding: 0.48rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.control-btn:hover,
.type-filter-btn:hover,
.sort-btn:hover:not(:disabled),
.clear-date-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
}

.type-filter-btn.active,
.sort-btn.active {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  font-weight: 600;
}

.control-btn:disabled,
.sort-btn:disabled,
.clear-date-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.date-controls {
  justify-content: center;
  flex-wrap: wrap;
}

.date-controls label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
}

.date-controls input {
  height: 2.05rem;
  padding: 0 0.45rem;
  color-scheme: dark;
  outline: none;
}

.location-status {
  font-size: 0.78rem;
  color: rgba(184, 245, 184, 0.9);
  white-space: nowrap;
}

.location-status.muted {
  color: rgba(255, 255, 255, 0.55);
}

.sort-control {
  justify-content: flex-end;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
}

.notification {
  padding: 0.65rem 0.9rem;
  border-radius: 0.2rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
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
  width: 8px;
}

.events-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.events-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
}

.events-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.event-card {
  font-family: "Inter", sans-serif;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.2rem;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.event-card:hover {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(255, 255, 255, 0.4);
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
  color: white;
  flex: 1;
}

.event-type {
  padding: 0.25rem 0.55rem;
  border-radius: 0.2rem;
  font-size: 0.72rem;
  font-weight: 600;
  white-space: nowrap;
  text-transform: capitalize;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
}

.type-carmeet,
.type-coches {
  background: rgba(255, 255, 255, 0.18);
  border-color: rgba(255, 255, 255, 0.35);
  color: white;
}

.event-date {
  margin: 0.2rem 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.82);
}

.event-location {
  margin: 0.15rem 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.72);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-distance {
  margin: 0.15rem 0;
  font-size: 0.8rem;
  color: rgba(184, 245, 184, 0.85);
  font-weight: 600;
}

.event-preview {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
}

.no-events {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 12rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

/* ===== Detalle a pantalla completa ===== */
.event-details-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.82);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  overflow: hidden;
}

.details-toolbar {
  flex-shrink: 0;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(0, 0, 0, 0.2);
}

.back-btn {
  font-family: "Inter", sans-serif;
  padding: 0.55rem 1.2rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.4);
  color: white;
}

.details-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.5rem;
}

.details-scroll::-webkit-scrollbar {
  width: 8px;
}

.details-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.details-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
}

.details-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
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

.event-map-block {
  margin-bottom: 1rem;
}

.map-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: "Inter", sans-serif;
  color: rgba(255, 149, 100, 0.95);
  margin-bottom: 0.45rem;
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

.moderators-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.35rem;
}

.moderator-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.7rem;
  background: linear-gradient(
    90deg,
    rgba(255, 162, 100, 0.2),
    rgba(255, 162, 100, 0.08)
  );
  border: 1px solid rgba(255, 162, 100, 0.45);
  border-radius: 0.2rem;
  color: rgb(255, 230, 210);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  transition: background 0.2s ease, transform 0.2s ease;
}

.moderator-badge:hover {
  background: rgba(255, 162, 100, 0.28);
  transform: translateY(-1px);
}

.moderator-badge.is-admin {
  border-color: rgba(255, 193, 7, 0.55);
  background: linear-gradient(
    90deg,
    rgba(255, 193, 7, 0.25),
    rgba(255, 162, 100, 0.12)
  );
}

.mod-name {
  font-weight: 600;
}

.mod-role {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  opacity: 0.75;
  padding: 0.1rem 0.35rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 0.15rem;
}

.moderator-badge.is-admin .mod-role {
  color: rgba(255, 220, 120, 1);
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

@media (max-width: 900px) {
  .events-controls {
    grid-template-columns: 1fr;
  }

  .sort-control {
    justify-content: flex-start;
  }
}
</style>
