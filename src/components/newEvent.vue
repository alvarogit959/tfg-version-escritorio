<template>
  <div class="new-event-container">
    <div class="header-row">
      <h1>Crear nuevo evento</h1>
      <button type="button" class="cancel-btn" @click="$emit('cancel')">
        Cancelar
      </button>
    </div>

    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div class="layout">
      <form class="event-form" @submit.prevent="createEvent">
        <div class="form-group">
          <label for="title">Título *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            required
            placeholder="Nombre del evento"
          />
        </div>

        <div class="form-group">
          <label for="type">Tipo *</label>
          <select id="type" v-model="form.type" required>
            <option value="coches">Concentración coches</option>
            <option value="motos">Concentración motos</option>
            <option value="competicion">Competición</option>
            <option value="feria">Feria</option>
          </select>
        </div>

        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="3"
            placeholder="Descripción del evento"
          />
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="start">Inicio *</label>
            <input
              id="start"
              v-model="form.start"
              type="datetime-local"
              :min="minDate"
              required
            />
          </div>
          <div class="form-group">
            <label for="end">Fin *</label>
            <input
              id="end"
              v-model="form.end"
              type="datetime-local"
              :min="form.start || minDate"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label for="locationLabel">Nombre del lugar</label>
          <input
            id="locationLabel"
            v-model="form.locationLabel"
            type="text"
            placeholder="Se rellena al hacer clic en el mapa (editable)"
          />
        </div>

        <div v-if="selectedCoords" class="coords-info">
          <p>
             {{ selectedCoords.latitude }}, {{ selectedCoords.longitude }}
          </p>
          <p v-if="!form.locationLabel" class="hint">
            Haz clic en el mapa para fijar la ubicación exacta.
          </p>
        </div>

        <button type="submit" class="submit-btn" :disabled="saving">
          {{ saving ? "Creando..." : "Crear evento" }}
        </button>
      </form>

      <div class="map-section">
        <p class="map-hint">
          Haz clic en el mapa para marcar la ubicación del evento
        </p>
        <div id="new-event-map" ref="mapContainer"></div>
      </div>
    </div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { apiJson, userIdFrom } from "../utils/api.js";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWx2YXJvZCIsImEiOiJjbXBiemtremUwMmV3MnFzYjd6d3c1c291In0.SgpTdV6EiabbSeRDcXg24w";

const MAP_STYLE = "mapbox://styles/alvarod/cmpbzx3ho001z01s6bjz3eruc";
const DEFAULT_CENTER = [-8.7292, 42.2383];

export default {
  name: "new-event-view",
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
  },
  emits: ["created", "cancel"],
  data() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    const minDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
      now.getDate(),
    )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

    return {
      form: {
        title: "",
        type: "coches",
        description: "",
        start: "",
        end: "",
        locationLabel: "",
      },
      selectedCoords: null,
      minDate,
      map: null,
      placementMarker: null,
      saving: false,
      notification: "",
      notificationClass: "",
    };
  },
  mounted() {
    this.$nextTick(() => {
      setTimeout(() => this.initMap(), 150);
    });
    window.addEventListener("resize", this.onResize);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onResize);
    if (this.placementMarker) {
      this.placementMarker.remove();
      this.placementMarker = null;
    }
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    onResize() {
      if (this.map) this.map.resize();
    },

    initMap() {
      const container = this.$refs.mapContainer;
      if (!container) return;

      this.map = new mapboxgl.Map({
        container,
        style: MAP_STYLE,
        center: DEFAULT_CENTER,
        zoom: 8,
      });

      this.map.on("load", () => {
        this.map.on("click", (e) => this.onMapClick(e));
        this.map.getCanvas().style.cursor = "crosshair";
      });
    },

    async onMapClick(e) {
      const { lng, lat } = e.lngLat;
      this.setPlacementMarker(lng, lat);

      this.selectedCoords = {
        latitude: lat.toFixed(8),
        longitude: lng.toFixed(8),
      };

      await this.reverseGeocode(lng, lat);
    },

    setPlacementMarker(lng, lat) {
      if (this.placementMarker) {
        this.placementMarker.setLngLat([lng, lat]);
        return;
      }

      const el = document.createElement("div");
      el.style.width = "22px";
      el.style.height = "22px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = "#2196f3";
      el.style.border = "3px solid white";
      el.style.boxShadow = "0 0 10px rgba(33, 150, 243, 0.8)";

      this.placementMarker = new mapboxgl.Marker({
        element: el,
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .addTo(this.map);
    },

    async reverseGeocode(lng, lat) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=es&access_token=${mapboxgl.accessToken}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.features?.length > 0) {
          this.form.locationLabel = data.features[0].place_name;
        } else {
          this.form.locationLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      } catch {
        this.form.locationLabel = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    },

    async createEvent() {
      const userId = userIdFrom(this.currentUser);
      if (!userId) {
        this.showNotification(
          "Debes iniciar sesión para crear eventos",
          "error",
        );
        return;
      }

      if (!this.form.title.trim()) {
        this.showNotification("El título es obligatorio", "error");
        return;
      }

      if (!this.form.start || !this.form.end) {
        this.showNotification("Indica fecha de inicio y fin", "error");
        return;
      }

      if (new Date(this.form.end) < new Date(this.form.start)) {
        this.showNotification(
          "La fecha de fin no puede ser anterior al inicio",
          "error",
        );
        return;
      }

      if (!this.selectedCoords) {
        this.showNotification(
          "Selecciona la ubicación haciendo clic en el mapa",
          "error",
        );
        return;
      }

      const locationName =
        this.form.locationLabel.trim() ||
        `${this.selectedCoords.latitude}, ${this.selectedCoords.longitude}`;

      this.saving = true;

      try {
        const event = await apiJson("/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: this.form.title.trim(),
            type: this.form.type,
            description: this.form.description.trim() || this.form.title.trim(),
            start: new Date(this.form.start).toISOString(),
            end: new Date(this.form.end).toISOString(),
            location: [
              {
                location: locationName,
                latitude: this.selectedCoords.latitude,
                longitude: this.selectedCoords.longitude,
              },
            ],
            creatorId: userId,
          }),
        });

        this.showNotification("Evento creado correctamente", "success");
        this.$emit("created", event);
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.saving = false;
      }
    },

    showNotification(message, type) {
      this.notification = message;
      this.notificationClass = type;
      if (type === "success") {
        setTimeout(() => {
          this.notification = "";
          this.notificationClass = "";
        }, 2500);
      }
    },
  },
};
</script>

<style scoped>
.view-container{
    width: 100%;
  max-height: 100vh;
}
.new-event-container {
  align-items: center;
  justify-content: center;
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  padding: 0.8rem 2rem;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.header-row h1 {
  margin: 0;
  font-size: 1.6rem;
}

.cancel-btn {
  padding: 0.6rem 1.2rem;
  background: rgba(85, 18, 18, 0.39);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  color: white;
  cursor: pointer;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.22);
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

.layout {
  display: grid;
  align-items: center;
  justify-content: center;
  grid-template-columns: 1fr 1.2fr;
  gap: 1.5rem;
  height: 74vh;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
  }
}

.event-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  justify-content: space-evenly;

  max-width: 90vw;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.form-group label {
  font-size: 0.9rem;
  opacity: 0.9;
}

.form-group input,
.form-group select,
.form-group textarea {
  font-family: "Inter", sans-serif;
  padding: 0.7rem 1rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  color: white;
  outline: none;
  max-width: 90vw;
}

.form-group select option {
  color: #222;
}

.coords-info {
  padding: 0.8rem;
  background: rgba(33, 150, 243, 0.15);
  border-radius: 0.6rem;
  font-size: 0.9rem;
}

.coords-info p {
  margin: 0.2rem 0;
}

.hint,
.map-hint {
  font-size: 0.85rem;
  opacity: 0.8;
  margin: 0 0 0.5rem;
}

.map-section {
  display:block;
  min-height: 380px;
}

#new-event-map {
  flex: 1;
  min-height: 360px;
  border-radius: 0.8rem;
  height: 50vh;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.submit-btn {
  padding: 0.9rem 1.5rem;
  background: rgba(76, 175, 80, 0.45);
  border: 1px solid rgba(76, 175, 80, 0.7);
  border-radius: 0.8rem;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  background: rgba(76, 175, 80, 0.65);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
@media (max-width: 700px) {
  .new-event-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 30.5rem;
  }
  .form-row {
  display: flex;
  flex-direction: column;
}
#new-event-map {
  height: 20vh;
  
}
  }
</style>
