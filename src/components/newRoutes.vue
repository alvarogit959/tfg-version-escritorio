<template>
  <div class="new-route-container">
    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div class="new-route-header">
      <button class="back-btn" @click="$emit('cancel')">← Volver</button>
      <h2>Nueva Ruta</h2>
    </div>

    <form class="route-form" @submit.prevent="saveRoute">
      <div class="form-group">
        <label for="route-title">Título de la ruta</label>
        <input
          id="route-title"
          v-model="form.title"
          type="text"
          required
          placeholder="Ej: Ruta por la costa gallega"
        />
      </div>

      <div class="form-group">
        <label for="route-desc">Descripción</label>
        <textarea
          id="route-desc"
          v-model="form.description"
          rows="3"
          placeholder="Describe la ruta..."
        />
      </div>

      <div class="form-group">
        <label class="offroad-label">
          <input
            v-model="form.offroad"
            type="checkbox"
            class="offroad-checkbox"
          />
          <span>Ruta offroad (fuera de carretera)</span>
        </label>
      </div>

      <!-- Start point -->
      <div class="form-group">
        <label>Punto de inicio</label>
        <div class="location-search">
          <input
            v-model="startSearch"
            type="text"
            placeholder="Buscar lugar de inicio..."
            @keyup.enter.prevent="searchLocation('start')"
          />
          <button type="button" class="search-btn" @click="searchLocation('start')">
            Buscar
          </button>
        </div>
        <div v-if="startResults.length" class="search-results">
          <button
            v-for="result in startResults"
            :key="result.id"
            type="button"
            class="result-item"
            @click="selectStart(result)"
          >
            {{ result.place_name }}
          </button>
        </div>
        <div v-if="form.start" class="selected-point">
          <span class="point-badge start">A</span>
          <div class="point-details">
            <span>{{ form.start.name }}</span>
            <input
              v-model="form.start.description"
              type="text"
              placeholder="Descripción del punto de inicio (opcional)"
              class="point-desc-input"
            />
          </div>
          <button type="button" class="clear-point" @click="clearStart">✕</button>
        </div>
      </div>

      <!-- Stops -->
      <div class="form-group">
        <label>Paradas</label>
        <div class="location-search">
          <input
            v-model="stopSearch"
            type="text"
            placeholder="Buscar parada..."
            @keyup.enter.prevent="searchLocation('stop')"
          />
          <button type="button" class="search-btn" @click="searchLocation('stop')">
            Buscar
          </button>
        </div>
        <div v-if="stopResults.length" class="search-results">
          <button
            v-for="result in stopResults"
            :key="result.id"
            type="button"
            class="result-item"
            @click="addStop(result)"
          >
            {{ result.place_name }}
          </button>
        </div>
        <ul v-if="form.stops.length" class="stops-list">
          <li v-for="(stop, index) in form.stops" :key="index" class="stop-item">
            <span class="point-badge stop">{{ index + 1 }}</span>
            <div class="point-details">
              <span class="stop-name">{{ stop.name }}</span>
              <input
                v-model="stop.description"
                type="text"
                placeholder="Descripción de la parada (opcional)"
                class="point-desc-input"
              />
            </div>
            <button
              type="button"
              class="remove-stop"
              @click="removeStop(index)"
            >
              ✕
            </button>
          </li>
        </ul>
        <p v-else class="hint">Añade paradas intermedias a tu ruta</p>
      </div>

      <!-- End point -->
      <div class="form-group">
        <label>Punto de destino</label>
        <div class="location-search">
          <input
            v-model="endSearch"
            type="text"
            placeholder="Buscar lugar de destino..."
            @keyup.enter.prevent="searchLocation('end')"
          />
          <button type="button" class="search-btn" @click="searchLocation('end')">
            Buscar
          </button>
        </div>
        <div v-if="endResults.length" class="search-results">
          <button
            v-for="result in endResults"
            :key="result.id"
            type="button"
            class="result-item"
            @click="selectEnd(result)"
          >
            {{ result.place_name }}
          </button>
        </div>
        <div v-if="form.end" class="selected-point">
          <span class="point-badge end">B</span>
          <div class="point-details">
            <span>{{ form.end.name }}</span>
            <input
              v-model="form.end.description"
              type="text"
              placeholder="Descripción del punto de destino (opcional)"
              class="point-desc-input"
            />
          </div>
          <button type="button" class="clear-point" @click="clearEnd">✕</button>
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="cancel-btn" @click="$emit('cancel')">
          Cancelar
        </button>
        <button
          type="submit"
          class="save-btn"
          :disabled="saving || !canSave"
        >
          {{ saving ? "Guardando..." : "Guardar ruta" }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { apiJson } from "../utils/api.js";

const MAPBOX_TOKEN =
  "pk.eyJ1IjoiYWx2YXJvZCIsImEiOiJjbXBiemtremUwMmV3MnFzYjd6d3c1c291In0.SgpTdV6EiabbSeRDcXg24w";

export default {
  name: "new-route-view",
  emits: ["created", "cancel"],
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      form: {
        title: "",
        description: "",
        offroad: false,
        start: null,
        stops: [],
        end: null,
      },
      startSearch: "",
      stopSearch: "",
      endSearch: "",
      startResults: [],
      stopResults: [],
      endResults: [],
      saving: false,
      notification: "",
      notificationClass: "",
    };
  },
  computed: {
    canSave() {
      return (
        this.form.title.trim() &&
        this.form.start &&
        this.form.end &&
        !this.saving
      );
    },
  },
  methods: {
    async searchLocation(type) {
      const query =
        type === "start"
          ? this.startSearch
          : type === "stop"
            ? this.stopSearch
            : this.endSearch;

      if (!query.trim()) return;

      try {
        const res = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
        );
        const data = await res.json();

        if (type === "start") this.startResults = data.features || [];
        else if (type === "stop") this.stopResults = data.features || [];
        else this.endResults = data.features || [];
      } catch (error) {
        console.error(error);
        this.showNotification("Error buscando ubicación", "error");
      }
    },

    selectStart(result) {
      this.form.start = {
        name: result.place_name,
        latitude: result.center[1],
        longitude: result.center[0],
        description: "",
      };
      this.startResults = [];
      this.startSearch = "";
    },

    selectEnd(result) {
      this.form.end = {
        name: result.place_name,
        latitude: result.center[1],
        longitude: result.center[0],
        description: "",
      };
      this.endResults = [];
      this.endSearch = "";
    },

    addStop(result) {
      this.form.stops.push({
        name: result.place_name,
        latitude: result.center[1],
        longitude: result.center[0],
        description: "",
      });
      this.stopResults = [];
      this.stopSearch = "";
    },

    removeStop(index) {
      this.form.stops.splice(index, 1);
    },

    clearStart() {
      this.form.start = null;
    },

    clearEnd() {
      this.form.end = null;
    },

    async saveRoute() {
      if (!this.canSave) return;
      if (!this.currentUser?.id) {
        this.showNotification("Debes iniciar sesión para crear rutas", "error");
        return;
      }

      this.saving = true;
      try {
        const data = await apiJson("/routes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: this.form.title.trim(),
            description: this.form.description.trim(),
            offroad: this.form.offroad,
            creatorId: this.currentUser.id,
            start: this.form.start,
            stops: this.form.stops,
            end: this.form.end,
          }),
        });
        this.showNotification("Ruta creada correctamente", "success");
        this.$emit("created", data);
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
      setTimeout(() => {
        this.notification = "";
        this.notificationClass = "";
      }, 3500);
    },
  },
};
</script>

<style scoped>
.new-route-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 1.5rem;
  box-sizing: border-box;
  color: white;
  font-family: "Inter", sans-serif;
  -webkit-app-region: no-drag;
  overflow-y: auto;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
}

.new-route-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.new-route-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.back-btn {
  padding: 0.5rem 1rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.3rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.route-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 600px;
  width: 100%;
  align-self: center;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.form-group label {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.offroad-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.85);
}

.offroad-checkbox {
  width: 18px;
  height: 18px;
  padding: 0;
  accent-color: #8b5cf6;
  cursor: pointer;
  border-radius: 0.2rem;
}

.form-group input,
.form-group textarea {
  font-family: "Inter", sans-serif;
  padding: 0.7rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.3rem;
  color: white;
  outline: none;
  transition: border-color 0.2s ease;
}

.form-group input:focus,
.form-group textarea:focus {
  border-color: rgba(139, 92, 246, 0.7);
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.location-search {
  display: flex;
  gap: 0.5rem;
}

.location-search input {
  flex: 1;
}

.search-btn {
  padding: 0.7rem 1.2rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  background: rgba(139, 92, 246, 0.4);
  border: 1px solid rgba(139, 92, 246, 0.6);
  border-radius: 0.3rem;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.search-btn:hover {
  background: rgba(139, 92, 246, 0.6);
}

.search-results {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  max-height: 200px;
  overflow-y: auto;
  background: rgba(20, 20, 40, 0.95);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 0.3rem;
  padding: 0.4rem;
}

.result-item {
  padding: 0.5rem 0.75rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  text-align: left;
  background: transparent;
  border: none;
  border-radius: 0.2rem;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.15s ease;
}

.result-item:hover {
  background: rgba(139, 92, 246, 0.2);
  color: white;
}

.selected-point {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.6rem 0.75rem;
  background: rgba(139, 92, 246, 0.15);
  border: 1px solid rgba(139, 92, 246, 0.4);
  border-radius: 0.3rem;
  font-size: 0.85rem;
}

.point-details {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.point-details > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.point-desc-input {
  font-family: "Inter", sans-serif;
  font-size: 0.75rem;
  padding: 0.4rem 0.6rem;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.25rem;
  color: white;
  outline: none;
  transition: border-color 0.2s ease;
}

.point-desc-input:focus {
  border-color: rgba(139, 92, 246, 0.7);
}

.point-desc-input::placeholder {
  color: rgba(255, 255, 255, 0.35);
}

.point-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.point-badge.start {
  background: #22c55e;
}

.point-badge.stop {
  background: #f59e0b;
}

.point-badge.end {
  background: #ef4444;
}

.clear-point {
  margin-left: auto;
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
}

.clear-point:hover {
  background: rgba(239, 68, 68, 0.4);
}

.stops-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.stop-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.3rem;
  font-size: 0.85rem;
}

.stop-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-stop {
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 50%;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
}

.remove-stop:hover {
  background: rgba(239, 68, 68, 0.5);
}

.hint {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  font-style: italic;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.cancel-btn,
.save-btn {
  padding: 0.7rem 1.5rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 0.3rem;
  cursor: pointer;
  transition: all 0.25s ease;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: white;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.save-btn {
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.7),
    rgba(99, 102, 241, 0.7)
  );
  border: 1px solid rgba(139, 92, 246, 0.7);
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.9),
    rgba(99, 102, 241, 0.9)
  );
  transform: translateY(-2px);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.notification {
  padding: 0.6rem 1rem;
  border-radius: 0.3rem;
  font-size: 0.9rem;
}

.notification.success {
  background: rgba(76, 175, 80, 0.3);
  color: #c8f5c8;
}

.notification.error {
  background: rgba(244, 67, 54, 0.35);
  color: #ffccbc;
}
</style>