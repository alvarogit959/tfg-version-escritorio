<template>
  <div class="mainarea">
    <!-- <img id="image" src="../assets/transport.png" />
    <h3>CarMeet Club</h3>-->

    <div class="nearby-events-row" v-if="nearbyEvents.length > 0">
      <div class="top-events">
        <button @click="activateLocation" class="submenu-btn-gps">
          {{ "Activar GPS" }}
        </button>
        <!-- <h4>Eventos Cercanos</h4> -->
      </div>
      <div class="events-flex-container">
        <div
          v-for="event in nearbyEvents"
          :key="event.id"
          class="event-card-small"
          @click="selectEvent(event)"
        >
          <div class="event-image-container">
            <img
              :src="`http://localhost:5000${event.image}`"
              class="event-image-small"
              alt="Poster"
            />
          </div>
          <div class="event-details">
            <h5>{{ event.title }}</h5>
            <p class="date">{{ formatDate(event.start) }}</p>
            <p v-if="eventDistanceKm(event) !== null" class="distance">
              A {{ eventDistanceKm(event) }} km
            </p>
          </div>
          <!--<p class="preview">{{ eventPreview(event) }}</p>-->
        </div>
      </div>
    </div>

    <div class="go-map">
      <div class="blurtest">
        <button class="nav-btn-absolute" @click="$emit('navigate', 'map')">
          Ir al Mapa
        </button>
      </div>
    </div>

    <div class="events-soon">
      <h4>Próximos eventos</h4>
      <p v-if="upcomingEventsList.length === 0">No hay eventos disponibles.</p>
      <ul v-else>
        <li
          v-for="event in upcomingEventsList"
          :key="event.id"
          @click="selectEvent(event)"
          class="clickable-event"
        >
          <strong>{{ event.title }}</strong
          ><br />
          {{ new Date(event.start).toLocaleDateString("es-ES") }}<br />
         <!-- {{ event.description }}-->
        </li>
      </ul>
      <button
        v-if="events.length > 7"
        class="nav-btn"
        @click="$emit('navigate', 'events')"
      >
        Ver todos los eventos
      </button>
    </div>
  </div>
</template>

<script>
import { upcomingEvents, apiJson } from "../utils/api.js";

export default {
  name: "inicio-view",
  emits: ["navigate", "select-event"],
  data() {
    return {
      events: [],
      userLocation: { lat: 40.4168, lng: -3.7038 }, //Madrid, para probar y luego cangas?
      locating: false,
      notification: "",
      notificationClass: "",
    };
  },
  computed: {
    nearbyEvents() {
      const sorted = [...this.events]
        .map((event) => ({
          event,
          distance: this.getEventDistanceValue(event),
        }))
        .filter(({ distance }) => Number.isFinite(distance))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5)
        .map(({ event }) => event);

      return sorted;
    },

    upcomingEventsList() {
      return this.events.slice(0, 7);
    },
  },
  async mounted() {
    await this.loadEvents();
  },
  methods: {
    async loadEvents() {
      try {
        const data = await apiJson("/events");
        this.events = upcomingEvents(data);
        console.log("Eventos cargados:", this.events);
      } catch (error) {
        console.error("Error cargando eventos:", error);
        this.notification = "No se pudieron cargar los eventos";
        this.notificationClass = "error";
      }
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
          },
        );
      });
    },

    setUserLocation(location, message) {
      this.userLocation = location;
      this.notification = message;
      this.notificationClass = "success";
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
      const toRadians = (degrees) => (degrees * Math.PI) / 180;
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

    eventDistanceKm(event) {
      const distance = this.getEventDistanceValue(event);
      if (!Number.isFinite(distance)) return null;

      return distance < 10 ? distance.toFixed(1) : Math.round(distance);
    },

    eventPreview(event) {
      const raw = event.description || "";
      const plain = typeof raw === "string" ? raw.replace(/<[^>]*>/g, "") : "";
      return plain.length > 60 ? `${plain.slice(0, 60)}...` : plain || "—";
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "short",
      });
    },

    selectEvent(event) {
      this.$emit("select-event", event);
    },
  },
};
</script>


<style scoped>
html,
body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.leaflet-control-attribution {
  font-size: 10px;
  opacity: 0.1;
}
.leaflet-bottom.leaflet-right {
  bottom: 5px;
  right: 5px;
}
.mainarea {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  overflow-x: hidden;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  align-items: center;
  justify-content: flex-start;
  color: rgb(255, 255, 255);
  -webkit-app-region: no-drag;
  padding-top: 0.5rem;
  box-sizing: border-box;
}
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  color: white;
}
#image {
  width: 100%;
  height: 30vh;
  object-fit: cover;
}

h3 {
  font-family: "Inter", sans-serif;
  color: rgb(255, 255, 255);
  font-size: 1.7rem;
}
input {
  font-family: "Inter", sans-serif;
  width: 60%;
  height: 2.8rem;
  padding: 0 1rem;

  outline: none;
  transition: all 0.25s ease;

  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  color: white;
}
input::placeholder {
  color: rgba(255, 255, 255, 0.7);
}

input:focus {
  border-color: rgba(255, 255, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.15);
}
button {
  font-family: "Inter", sans-serif;
  width: 100%;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

button:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

p {
  width: 80%;
}
a {
  color: #ffffff;
}

#map {
  width: 100%;
  height: calc(100vh - 220px);
  overflow: hidden;

  max-height: 100vh;
}

.filters-container {
  display: flex;
  flex-direction: row;

  gap: 0.8rem;
  width: 95%;
  justify-content: center;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  margin: 1rem 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.filter-group {
  position: relative;
  width: 100%;
}

.filter-btn {
  font-family: "Inter", sans-serif;
  padding: 0.7rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  color: white;
  font-size: 0.95rem;
  white-space: nowrap;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.filter-btn:active {
  transform: translateY(0);
}

.submenu {
  position: absolute;
  top: 100%;
  left: 0;
  background: rgba(30, 30, 40, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  padding: 0.8rem;
  min-width: 200px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  margin-top: 0.5rem;
}

.submenu-btn {
  font-family: "Inter", sans-serif;
  margin-left: 5rem;
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.6rem;
  color: white;
  text-align: left;
  font-size: 0.9rem;
}

.submenu-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.4);
}

.submenu input {
  font-family: "Inter", sans-serif;
  width: 100%;
  padding: 0.6rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.6rem;
  color: white;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.submenu input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.submenu input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.15);
}
.mainarea::-webkit-scrollbar {
  width: 12px;
}

.mainarea::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}

.mainarea::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.mainarea::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
  border-color: rgba(255, 255, 255, 0.2);
}

.top-events {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  width: 100%;
}

.location-status {
  font-size: 0.9rem;
  color: rgba(255, 162, 100, 0.8);
  padding: 0.5rem 1rem;
  background: rgba(255, 162, 100, 0.1);
  border-radius: 0.6rem;
  border: 1px solid rgba(255, 162, 100, 0.3);
}

.nearby-events-row,
.go-map,
.events-soon {
  width: 100vw;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.events-soon {
  padding-bottom: 4.5rem;
}

.nearby-events-row h4 {
  margin: 0;
  color: rgb(255, 255, 255);
  font-size: 1.1rem;
}

.events-flex-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding-bottom: 0.5rem;
  width: 90%;
}

.event-card-small {
  height: 55vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(29, 14, 43, 0.336);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.4rem;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  overflow: hidden;
}

.event-card-small:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.4);
}

.event-card-small h5 {
  margin: 0;
  color: rgb(255, 255, 255);
  font-size: 0.8rem;
  font-weight: 600;
}

.event-card-small .date {
  margin: 0;
  font-size: 0.85rem;
  color: rgb(96, 168, 250);
}

.event-card-small .distance {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  font-weight: 500;
}

.event-card-small .preview {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.3;
}
.event-image-container {
  flex: 8;
  overflow: hidden;
  position: relative;
  margin: 0;
  padding: 0;
  gap: 0;
}
.event-image-small {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.event-details {
  flex: 2; 
  
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  
}


.go-map {
  position: relative;
  width: 90%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  background-image: url("../assets/mapscreenshot.png");
  background-size: cover;
  background-position: center;
  border-radius: 0.4rem;
}
.blurtest {
  background: rgba(0, 0, 0, 0.39);
  position: relative;
  height: 20rem;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  border-radius: 0.4rem;
}
.blurtest:hover {
  background: rgba(0, 0, 0, 0.185);
  transition: all 1.5s ease;
}
.events-soon h4 {
  margin: 1rem 0 0.5rem 0;
  color: rgb(255, 255, 255);
}
.events-soon {
  width: 90%;
  height: auto;
  display: flex;
  flex-direction: column;
}
.events-soon ul {
  list-style: none;
  padding: 0;
  margin: 0.5rem 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.clickable-event {
  width: 70vw;
  padding: 0.8rem 1rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.25s ease;
  color: rgb(180, 199, 250);
  font-size: 0.95rem;
  text-align: left;
}

.clickable-event:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateX(4px);
  border-color: rgba(255, 255, 255, 0.4);
  color: rgb(255, 255, 255);
}

.clickable-event:active {
  transform: translateX(2px);
}

.nav-btn {
  width: 14rem;
  padding: 0.8rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(83, 13, 129, 0.596);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  font-family: "Inter", sans-serif;
  font-size: 1rem;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}

.nav-btn:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}

.nav-btn-absolute {
  width: 10rem;
  margin-top: 5rem;
  margin-bottom: 5rem;
  padding: 0.9rem 2rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(115, 134, 197, 0.507);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.4rem;
  color: white;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  font-family: "Inter", sans-serif;
  font-size: 1rem;
}

.nav-btn-absolute:hover {
  background: rgba(164, 181, 235, 0.507);
  transform: scale(1.2);
  -ms-zoom-animation: all 2s ease;
}

.nav-btn-absolute:active {
  transform: translateY(0);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
}
.submenu-btn {
  width: auto;
  padding: 0.9rem 2rem;
}
.submenu-btn-gps {
  background: rgba(47, 21, 141, 0.781);
  border:none;
  color: rgb(255, 255, 255);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 7rem;
  height: 2rem;
  margin-bottom: 0.6rem;
  margin-left: 10%;
}
.submenu-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}


@media (max-width: 700px) {
  .mainarea {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 2rem;
  }
}
</style>
