<template>
  <div class="events-container">
    <!--<p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p> -->

    <div class="content-wrapper">
      <section class="panel-card filters-panel">
        <div class="events-controls">
          <div class="location-controls">
            <button
              type="button"
              class="btn-primary btn-sm"
              :disabled="locating"
              @click="activateLocation"
            >
              Usar ubicación
            </button>
            <span v-if="userLocation" class="location-status">
              Ubicación activa
            </span>
            <span v-else class="location-status muted"> Sin ubicación </span>
          </div>

          <div class="filter-controls">
                    <input
          v-model="eventSearchText"
          type="text"
          placeholder="Buscar por nombre"
          class="search-input"
        />
            <button
              v-for="type in eventTypeFilters"
              :key="type.value"
              type="button"
              class="btn-ghost btn-sm type-filter-btn"
              :class="{ active: selectedTypes.includes(type.value) }"
              @click="toggleTypeFilter(type.value)"
            >
              {{ type.label }}
            </button>
          </div>

          <div class="date-filter">
            <div class="date-picker-field">
              <button
                type="button"
                class="date-picker-btn"
                @click="openDatePicker('dateFromInput')"
              >
                <span>Desde</span>
                <strong v-if="dateFrom">{{
                  formatDateFilter(dateFrom)
                }}</strong>
              </button>
              <input
                ref="dateFromInput"
                v-model="dateFrom"
                class="date-picker-native"
                type="date"
              />
            </div>
            <span class="date-filter-arrow">→</span>
            <div class="date-picker-field">
              <button
                type="button"
                class="date-picker-btn"
                @click="openDatePicker('dateToInput')"
              >
                <span>Hasta</span>
                <strong v-if="dateTo">{{ formatDateFilter(dateTo) }}</strong>
              </button>
              <input
                ref="dateToInput"
                v-model="dateTo"
                class="date-picker-native"
                type="date"
              />
            </div>
            <button
              type="button"
              class="date-clear-btn"
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
              class="btn-ghost btn-sm sort-btn"
              :class="{ active: sortMode === 'date' }"
              @click="setSortMode('date')"
            >
              Fecha
            </button>
            <button
              type="button"
              class="btn-ghost btn-sm sort-btn"
              :class="{ active: sortMode === 'distance' }"
              :disabled="locating"
              @click="setSortMode('distance')"
            >
              Distancia
            </button>
            <button
              v-if="currentUser"
              type="button"
              class="btn-primary"
              @click="$emit('create-event')"
            >
              + Crear evento
            </button>
          </div>
        </div>
      </section>

      <section class="events-list-panel">
        <div class="events-list">
          <div
            v-for="event in displayedEvents"
            :key="eventKey(event)"
            class="event-card"
            @click="selectEvent(event)"
          >
            <div class="event-card-header">
              <h3>{{ event.title }}</h3>
              <span class="event-type" :class="`type-${event.type}`">{{
                event.type
              }}</span>
            </div>
            <p class="event-date">{{ formatDate(event.start) }}</p>
            <p
              v-if="event.location && event.location.length > 0"
              class="event-location"
            >
              {{ event.location[0].location }}
            </p>
            <p
              v-if="userLocation && eventDistanceKm(event) !== null"
              class="event-distance"
            >
              A {{ eventDistanceKm(event) }} km
            </p>
            <p class="event-preview">{{ eventPreview(event) }}</p>
          </div>

          <div v-if="displayedEvents.length === 0" class="no-events">
            <p>No hay eventos disponibles con estos filtros</p>
          </div>
        </div>
      </section>

      <!--OVERLAY EN VEZ DE OTRA VISTA   =========================================================                                                             -->
      <Transition name="detail-slide">
        <div v-if="selectedEvent" class="event-details-overlay">
          <div class="details-scroll">
            <div class="details-content">
              <div class="details-title-row">
                <h1>{{ selectedEvent.title }}</h1>
                <span
                  class="event-type detail-type"
                  :class="`type-${selectedEvent.type}`"
                >
                  {{ selectedEvent.type }}
                </span>
                <button
                  type="button"
                  class="btn-primary back-btn"
                  @click="closeDetail"
                >
                  ← Volver
                </button>
              </div>
              <div class="info-container">
                <div class="poster-container">
                  <img
                    :src="`http://localhost:5000${selectedEvent.image}`"
                    class="event-image"
                    alt="Poster"
                  />
                </div>
 <!--INFO-->
                <div class="event-info">
                  <!--MAP-->
                  <div
                    v-if="
                      selectedEvent.location &&
                      selectedEvent.location.length > 0
                    "
                    class="event-map-block"
                  >
                    <EventMiniMap
                      :key="'map-' + eventKey(selectedEvent)"
                      :event="selectedEvent"
                    />
                  </div>

 <!--ACCIONES-->
                  <div class="action-buttons">
                    <button
                      type="button"
                      class="btn-primary attend-btn"
                      :disabled="
                        attending || leavingEventId === eventKey(selectedEvent)
                      "
                      @click="toggleAttendance"
                    >
                      {{
                        attending
                          ? "Apuntando..."
                          : leavingEventId === eventKey(selectedEvent)
                          ? "Desapuntando..."
                          : isAttendingSelected
                          ? "Desapuntarse del evento"
                          : "Asistir a este evento"
                      }}
                    </button>
                    <button
                      v-if="isAttendingSelected"
                      type="button"
                      class="btn-primary chat-event-btn"
                      @click="goToEventChat"
                    >
                      Chat del evento
                    </button>
                  </div>
 <!--DESCRIPTION-->

                  <div class="info-group">
                    <label>Descripción: </label>
                    <p>{{ selectedEvent.description }}</p>
                  </div>

 <!--FECHAS-->
                  <div class="info-group">
                    <label>Fecha inicio:</label>
                    <p>{{ formatDateFull(selectedEvent.start) }}</p>
                  </div>
                  <div class="info-group">
                    <label>Fecha fin:</label>
                    <p>{{ formatDateFull(selectedEvent.end) }}</p>
                  </div>
<!--UBICACION-->
                  <div
                    v-if="
                      selectedEvent.location &&
                      selectedEvent.location.length > 0
                    "
                    class="info-group"
                  >
                    <label>Ubicación:</label>
                    <p>{{ selectedEvent.location[0].location }}</p>
                   <!-- <p class="coordinates">
                      {{ selectedEvent.location[0].latitude }},
                      {{ selectedEvent.location[0].longitude }}
                    </p>-->
                  </div>
<!--ORGANIZADORES-->
                  <div class="info-group">
                    <label>
                      Organizadores: 
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
                        <span v-if="mod.role === 'admin'" class="mod-role"
                          >Admin</span
                        >
                        <span v-else class="mod-role">Moderador</span>
                      </button>
                    </div>
                    <p v-else class="no-attendees">
                      Sin organizadores asignados
                    </p>
                  </div>

                  <div class="info-group">
                    <label>
                      Asistentes: 
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
                    
                    <!--<button
              type="button"
              class="user-link"
              @click="$emit('view-user', att.id)"
            >
              {{ att.username }}
            </button>-->
            <button
              type="button"
              v-for="att in resolvedAttendees"
                        :key="att.id"
                        class="attendee-badge"
              @click="$emit('view-user', att.id)"
            >
              {{ att.username }}
            </button>
                     <!-- <span
                        v-for="att in resolvedAttendees"
                        :key="att.id"
                        class="attendee-badge"
                      >
                        {{ att.username }}
                      </span>-->
                    </div>
                    <p v-else class="no-attendees">Nadie apuntado aún</p>
                  </div>
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
import EventMiniMap from "./eventMiniMap.vue"

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
  emits: ["events-updated", "create-event", "view-user", "event-chat-joined", "event-chat-left"],
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
      leavingEventId: null,
      eventSearchText: "",
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
        hasActiveFilters() {
      return (
        this.eventSearchText ||
        this.selectedEventType ||
        this.dateFrom ||
        this.dateTo
      );
    },
    isAttendingSelected() {
      return isUserAttending(this.selectedEvent, this.currentUser);
    },

    displayedEvents() {
      
      let filtered = this.events.filter(
        (event) =>
          this.selectedTypes.includes(this.getEventType(event)) &&
          this.isEventInsideDateRange(event),
      );
//SEARCH BY NAME: 
if (this.eventSearchText && this.eventSearchText.trim()) {
      const searchLower = this.eventSearchText.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchLower)
      );
    }
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
      if (
        url.includes("/calendario/competicion/") ||
        url.includes("/competicion/")
      ) {
        return "competicion";
      }
      if (url.includes("/feria") || url.includes("/ferias")) return "feria";
      return "";
    },

    getEventType(event) {
      return (
        this.normalizeEventType(event.type) || this.inferTypeFromUrl(event)
      );
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

        const location = {
          lat: 42.2406,
          lng: -8.7823,
        };

        this.setUserLocation(location);
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
          },
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
        },
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
        Math.cos(lat1) *
          Math.cos(lat2) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);

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
      if (!Number.isFinite(eventStart) && !Number.isFinite(eventEnd))
        return false;

      if (from !== null && eventEnd < from) return false;
      if (to !== null && eventStart > to) return false;
      return true;
    },

    clearDateFilters() {
      this.dateFrom = "";
      this.dateTo = "";
    },

    /**
      @param {string} refName 
     */
    openDatePicker(refName) {
      const picker = this.$refs[refName];
      if (!picker) return;

      if (typeof picker.showPicker === "function") {
        picker.showPicker();
        return;
      }

      picker.focus();
      picker.click();
    },

    /**
     @param {string} date 
     @returns {string} 
     */
    formatDateFilter(date) {
      if (!date) return "Fecha";
      return new Date(`${date}T00:00:00`).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
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
        this.notification =
          error.message || "No se pudieron cargar los eventos";
        this.notificationClass = "error";
      }
    },

    eventPreview(event) {
      const raw = event.description || "";
      const plain = typeof raw === "string" ? raw.replace(/<[^>]*>/g, "") : "";
      return plain.length > 60 ? `${plain.slice(0, 60)}...` : plain || "—";
    },

    applyInitialEvent() {
      if (!this.initialEvent) return;

      const targetId = this.initialEvent.id;
      const targetMongoId = this.initialEvent._id;

      const match = this.events.find(
        (e) =>
          (targetId != null && e.id === targetId) ||
          (targetMongoId && e._id === targetMongoId),
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
        this.resolvedModerators = await apiJson(
          `/events/${eventId}/moderators`,
        );
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
      const originalImage = this.selectedEvent.image;
      this.attending = true;

      try {
      const data = await apiJson(
          `/users/${userId}/joined-events/${eventId}`,
          { method: "POST" },
        );

        if (data.event) {
          if (!data.event.image && originalImage) {
            data.event.image = originalImage;
          }
          this.updateEventInList(data.event);
          this.selectedEvent = data.event;
        }

        await this.loadAttendeesForSelected();

        // Unir al usuario al chat del evento
        const eventMongoId = this.selectedEvent?._id || eventId;
        try {
          await apiJson(`/events/${eventMongoId}/conversation/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
          });
          this.$emit("event-chat-joined", {
            eventId: eventMongoId,
            title: this.selectedEvent?.title || "Evento",
          });
        } catch (chatError) {
          console.error("Error uniendo al chat del evento:", chatError);
        }

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

    //TEST LEAVE EVENT=========================================================================================================================
    async toggleAttendance() {
  if (this.isAttendingSelected) {
    await this.leaveEvent(this.selectedEvent);
  } else {
    await this.attendEvent();
  }
},

  async leaveEvent(event) {
  const userId = userIdFrom(this.currentUser);
  if (!userId) {
    this.notification = "Debes iniciar sesión para desapuntarte";
    this.notificationClass = "error";
    return;
  }

  const eventId = this.eventKey(event);
  this.leavingEventId = eventId;

  try {
    //DELETE
    const response = await fetch(
      `http://localhost:5000/users/${userId}/joined-events/${eventId}`,
      { method: "DELETE" }
    );

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

//ACTUALIZAR LISTA
    const eventIndex = this.events.findIndex(e => this.eventKey(e) === eventId);
    if (eventIndex !== -1) {
      const updatedEvent = { ...this.events[eventIndex] };
      
      //Eliminar usuario actual
      if (updatedEvent.attendees) {
        updatedEvent.attendees = updatedEvent.attendees.filter(
          id => id.toString() !== userId
        );
      }
      
      //Actualizar
      this.events[eventIndex] = updatedEvent;
//Forzar actualizacion
      this.events = [...this.events];

      if (this.selectedEvent && this.eventKey(this.selectedEvent) === eventId) {
        this.selectedEvent = updatedEvent;
        this.resolvedAttendees = this.resolvedAttendees.filter(
          att => att.id !== userId && att.id?.toString() !== userId
        );
      }
    }

    // Quitar al usuario del chat del evento
    const eventMongoId = event._id || eventId;
    try {
      await apiJson(`/events/${eventMongoId}/conversation/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    } catch (chatError) {
      console.error("Error saliendo del chat del evento:", chatError);
    }
    this.$emit("event-chat-left", {
      eventId: eventMongoId,
    });

    this.notification = "Has salido del evento";
    this.notificationClass = "success";
    this.$emit("events-updated");
  } catch (error) {
    console.error("Error al salir del evento:", error);
    this.notification = error.message || "No se pudo salir del evento";
    this.notificationClass = "error";
  } finally {
    this.leavingEventId = null;
    setTimeout(() => {
      this.notification = "";
    }, 3500);
  }
},



    goToEventChat() {
      if (!this.selectedEvent) return;
      const eventMongoId = this.selectedEvent._id || eventIdentifier(this.selectedEvent);
      this.$emit("event-chat-joined", {
        eventId: eventMongoId,
        title: this.selectedEvent.title || "Evento",
        openChat: true,
      });
    },

    updateEventInList(updatedEvent) {
      const idx = this.events.findIndex(
        (e) =>
          (updatedEvent._id && e._id === updatedEvent._id) ||
          e.id === updatedEvent.id,
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
  width: 100%;
  height: calc(100vh - 2rem - 75px);
  max-height: calc(100vh - 2rem - 75px);
  overflow-y: auto;
  
  
  color: white;
  font-family: "Inter", sans-serif;
  box-sizing: border-box;
  -webkit-app-region: no-drag;

  display: flex;
  flex-direction: column;

  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);


  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.events-container::-webkit-scrollbar {
  width: 12px;
}

.events-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.events-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}

.events-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
}

.page-heading {
  flex: 1;
  min-width: 200px;
}

.page-title {
  margin: 0;
  font-size: 1.7rem;
  color: white;
}

.page-subtitle {
  margin: 0.35rem 0 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;

}

.panel-card {
  background: rgba(255, 255, 255, 0.12);
  min-height: 1.5rem;
  height: auto;
  padding: 0.4rem 1rem;
  display:flex;
  flex-direction: row;




}

.events-list-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: none;
  border: none;
  padding: 0.5rem;
}

.section-title {
  margin: 0 0 0.85rem;
  font-size: 1.05rem;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.5rem;
}

.btn-primary,
.btn-ghost {
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

.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.18);
}

.btn-ghost:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.35rem 0.75rem;
  font-size: 0.82rem;
}
.search-input {
  width: 8rem;
  padding: 0.3rem 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.18);
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.type-filter-btn.active,
.sort-btn.active {
  background: rgba(119, 120, 196, 0.315);
  border-color: rgba(255, 255, 255, 0.767);
}

.events-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content:center;
  flex:space-evenly;
  width: 100%;
  height: auto;
}
.location-controls,
.filter-controls,
.sort-control {

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

.filter-controls {
  flex-wrap: wrap;
  max-width: 100vw;
}

.date-filter {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex: 0 1 auto;
  max-width: 100%;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.25rem 0.45rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  color: white;
}

.date-filter label {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  cursor: pointer;
}

.date-filter label span {
  color: white;
  font-size: 0.85rem;
  opacity: 0.8;
  font-family: "Inter", sans-serif;
  white-space: nowrap;
}

.date-filter-arrow,
.date-filter > span:not(.date-picker-field span) {
  color: white;
  font-size: 0.82rem;
  white-space: nowrap;
}

.date-clear-btn {
  width: auto;
  padding: 0.43rem 0.55rem;
  border-radius: 0.5rem;
  font-size: 0.74rem;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: inherit;
}

.date-clear-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.date-clear-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.date-picker-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.date-picker-field span,
.date-filter-arrow {
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 0.82rem;
  white-space: nowrap;
}

.date-picker-btn {
  width: 5.4rem;
  min-width: 0;
  min-height: 2.15rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.05rem;
  padding: 0.28rem 0.45rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgb(255, 255, 255);
  cursor: pointer;
  box-shadow: none;
  font-family: inherit;
  transition: all 0.2s ease;
}

.date-picker-btn span {
  font-size: 0.78rem;
  line-height: 1;
}

.date-picker-btn strong {
  font-size: 0.65rem;
  line-height: 1;
  font-weight: 600;
  color: #55c7ff;
}

.date-picker-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.date-filter .date-picker-native[type="date"] {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  pointer-events: none;
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
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
}

.notification {
  padding: 0.8rem 1rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  margin: 0;
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

.events-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 0.25rem;
  padding-top:0.2rem
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
  font-family: inherit;
  padding: 0.9rem 1rem;
  background: linear-gradient(
    135deg,
    rgba(17, 13, 73, 0.404),
    rgba(0, 0, 0, 0.596)
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.event-card:hover {
  background: rgba(55, 69, 116, 0.712);
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
  border-radius: 0.5rem;
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
  color: rgb(185, 190, 233);
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

.event-details-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgb(54, 54, 54), rgb(0, 0, 0));
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
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
  font-size: 0.75rem;
  padding: 0.6em 0.8rem;

  border-radius: 0.3rem;
  background-color: rgba(83, 15, 15, 0.795);
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
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.details-content h1 {
  margin: 0;
  font-size: 1.65rem;
  font-family: inherit;
  color: white;
  flex: 1;
  min-width: 200px;
}

.detail-type {
  align-self: center;
  border-width: 0rem;
  background-color: rgba(0, 0, 0, 0);
}

.event-map-block {
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  overflow: hidden;
  line-height: 0;
  font-size: 0;
}
.event-map-block > * {
  margin: 0 !important;
  padding: 0 !important;
  display: block;
}
.map-label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.88);
}

.images-gallery {
  margin-bottom: 1.25rem;
}

.images-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  width: 50rem;
}

.event-info {
  display: flex;
  width: 60%;
  flex-direction: column;
  gap: 0.4rem;
}

.info-group {
  display: flex;
  flex-direction: row;
  column-gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2rem 0.4rem;
  border-radius: 0.4rem;
}

.info-group label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  font-family: inherit;
  color: rgba(255, 255, 255, 0.88);
  margin-bottom: 0.35rem;
}

.info-group p {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.5;
  font-size: 0.8rem;
}

.coordinates {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 0.3rem;
}

.attendees-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.attendee-badge {
  display: flex;
  align-items: top;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.95);
  padding: 0.2rem 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.82rem;
  cursor:pointer;
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
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  transition: background 0.2s ease, transform 0.2s ease;
}

.moderator-badge:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.moderator-badge.is-admin {
  border-color: rgba(255, 193, 7, 0.55);
  background: rgba(255, 193, 7, 0.15);
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
  color: rgba(255, 224, 130, 1);
}

.attendees-loading,
.no-attendees {
  margin: 0.25rem 0 0;
  font-size: 0.88rem;
  color: rgba(255, 255, 255, 0.55);
  font-style: italic;
}

.action-buttons {
  justify-content: center;
}

.attend-btn {
  width: 100%;
  padding: 0.5rem 1.5rem;
  font-size: 0.95rem;
  font-weight: 600;
  background: linear-gradient(135deg, rgb(59, 20, 90), rgba(46, 76, 94, 0.726));
}
.attend-btn :hover {
  background: linear-gradient(
    135deg,
    rgb(59, 20, 90),
    rgb(153, 125, 175),
    0.726
  );
}
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
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
    
    
  }
  .events-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 3.5rem;
 
  }
  .location-controls,
  .filter-controls,
  .date-filter,
  .sort-control {
    flex-shrink: 0;
  }



  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .btn-primary {
    width: 100%;
    text-align: center;
  }
}

.info-container {
  display: flex;
  flex-direction: row;
  justify-content: center;

  gap: 0.85rem;
}
.event-image {
  max-width: 40vw;
  max-height: 70vh;
  border-radius: 0.6rem;
  object-fit: cover;
}
.poster-container {
  display: flex;
  flex-direction: row;
  justify-content: center;
  flex: 1;
}
.chat-event-btn{margin-top: 0.4rem;}
</style>
