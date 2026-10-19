<template>
  <div class="routes-container">
    <p v-if="notification" class="notification" :class="notificationClass">
      {{ notification }}
    </p>

    <div class="routes-header">
      <h2>Rutas</h2>
      <button class="new-route-btn" @click="$emit('create-route')">
        + Nueva ruta
      </button>
    </div>

    <div class="routes-layout">
      <!-- Sidebar with route list / route detail -->
      <aside class="routes-sidebar">
        <!-- Route detail panel (covers the sidebar when a route is selected) -->
        <div v-if="routeDetail" class="route-detail-panel">
          <button class="close-detail-btn" @click="closeRouteDetail" title="Cerrar">
            ✕
          </button>
          <h3>{{ routeDetail.title }}</h3>
          <p v-if="routeDetail.description" class="detail-desc">
            {{ routeDetail.description }}
          </p>

          <div class="detail-points">
            <div class="detail-point">
              <span class="point-badge start">A</span>
              <div class="point-info">
                <strong>{{ routeDetail.start.name || "Inicio" }}</strong>
                <p v-if="routeDetail.start.description">
                  {{ routeDetail.start.description }}
                </p>
              </div>
            </div>

            <div
              v-for="(stop, i) in routeDetail.stops"
              :key="i"
              class="detail-point"
            >
              <span class="point-badge stop">{{ i + 1 }}</span>
              <div class="point-info">
                <strong>{{ stop.name }}</strong>
                <p v-if="stop.description">{{ stop.description }}</p>
              </div>
            </div>

            <div class="detail-point">
              <span class="point-badge end">B</span>
              <div class="point-info">
                <strong>{{ routeDetail.end.name || "Destino" }}</strong>
                <p v-if="routeDetail.end.description">
                  {{ routeDetail.end.description }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Route list (hidden when detail panel is open) -->
        <template v-else>
          <div v-if="loading" class="loading">Cargando rutas...</div>
          <p v-else-if="routes.length === 0" class="no-routes">
            No hay rutas todavía. ¡Crea la primera!
          </p>
          <ul v-else class="routes-list">
            <li
              v-for="route in routes"
              :key="route._id"
              class="route-item"
              :class="{ active: selectedRouteId === route._id }"
              @click="selectRoute(route)"
            >
              <h3>{{ route.title }}</h3>
              <p v-if="route.description" class="route-desc">{{ route.description }}</p>
              <div class="route-meta">
                <span class="route-creator">
                  {{ route.creatorId?.username || "Usuario" }}
                </span>
                <span class="route-stops-count">
                  {{ route.stops.length }} paradas
                </span>
              </div>
              <button
                v-if="canDeleteRoute(route)"
                class="delete-route-btn"
                @click.stop="deleteRoute(route)"
                title="Eliminar ruta"
              >
                ✕
              </button>
            </li>
          </ul>
        </template>
      </aside>

      <!-- Map -->
      <div class="map-wrapper">
        <!-- Ubicación filter -->
        <div class="filters-container">
          <div class="filter-group">
            <button class="filter-btn" @click="toggleUbicacion">
              Ubicación
            </button>
            <div v-if="showUbicacion" class="submenu">
              <button @click="activateGPS" class="submenu-btn">Activar GPS</button>
              <input v-model="manualLocation" type="text" placeholder="Escribe tu ubicación">
              <button @click="closeUbicacion" class="submenu-btn">Aplicar</button>
            </div>
          </div>

          <div v-if="userLocation" class="distance-filter">
            <div class="distance-filter__header">
              <span>Rango</span>
              <strong>{{ distanceKm }} km</strong>
            </div>
            <input
              v-model.number="distanceKm"
              class="distance-slider"
              type="range"
              min="5"
              max="600"
              step="5"
              @input="updateRangeFilter"
            >
          </div>
        </div>

        <div id="routes-map"></div>
      </div>
    </div>
  </div>
</template>

<script>
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { apiJson } from "../utils/api.js";

mapboxgl.accessToken =
  "pk.eyJ1IjoiYWx2YXJvZCIsImEiOiJjbXBiemtremUwMmV3MnFzYjd6d3c1c291In0.SgpTdV6EiabbSeRDcXg24w";

export default {
  name: "routes-map-view",
  emits: ["create-route"],
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      map: null,
      routes: [],
      selectedRouteId: null,
      loading: true,
      notification: "",
      notificationClass: "",
      routeMarkers: [],
      routeLineSourceId: "routes-line-source",
      routeLineLayerId: "routes-line-layer",
      routeDetail: null,
      showUbicacion: false,
      manualLocation: "",
      userLocation: null,
      distanceKm: 50,
      userMarker: null,
      rangeSourceId: "route-range-source",
      rangeFillLayerId: "route-range-fill",
      rangeLineLayerId: "route-range-line",
    };
  },
  computed: {
    selectedRoute() {
      return this.routes.find((r) => r._id === this.selectedRouteId) || null;
    },
  },
  async mounted() {
    await this.loadRoutes();
    this.$nextTick(() => {
      setTimeout(() => {
        this.initializeMap();
        window.addEventListener("resize", this.onWindowResize);
      }, 100);
    });
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
    this.clearRouteMarkers();
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    onWindowResize() {
      if (this.map) this.map.resize();
    },

    async loadRoutes() {
      this.loading = true;
      try {
        this.routes = await apiJson("/routes");
        if (this.routes.length > 0 && !this.selectedRouteId) {
          this.selectedRouteId = this.routes[0]._id;
        }
        this.$nextTick(() => {
          this.drawAllRouteMiddlePoints();
        });
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      } finally {
        this.loading = false;
      }
    },

    selectRoute(route) {
      this.selectedRouteId = route._id;
      this.routeDetail = route;
      this.drawSelectedRoute();
    },

    canDeleteRoute(route) {
      if (!this.currentUser) return false;
      const isAdmin = this.currentUser.role === "admin";
      const isCreator =
        route.creatorId &&
        String(route.creatorId._id || route.creatorId) ===
          String(this.currentUser.id);
      return isAdmin || isCreator;
    },

    async deleteRoute(route) {
      if (!confirm(`¿Eliminar la ruta "${route.title}"?`)) return;
      try {
        await apiJson(`/routes/${route._id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: this.currentUser?.id }),
        });
        this.routes = this.routes.filter((r) => r._id !== route._id);
        if (this.selectedRouteId === route._id) {
          this.selectedRouteId = this.routes[0]?._id || null;
        }
        this.drawSelectedRoute();
        this.showNotification("Ruta eliminada", "success");
      } catch (error) {
        console.error(error);
        this.showNotification(error.message, "error");
      }
    },

    getRouteCoordinates(route) {
      if (!route) return [];
      const coords = [];
      if (route.start) {
        coords.push([route.start.longitude, route.start.latitude]);
      }
      (route.stops || []).forEach((stop) => {
        coords.push([stop.longitude, stop.latitude]);
      });
      if (route.end) {
        coords.push([route.end.longitude, route.end.latitude]);
      }
      return coords;
    },

    clearRouteMarkers() {
      this.routeMarkers.forEach(({ marker }) => marker.remove());
      this.routeMarkers = [];
    },

    getRouteMiddlePoint(route) {
      const coords = this.getRouteCoordinates(route);
      if (coords.length === 0) return null;
      const sumLng = coords.reduce((sum, c) => sum + c[0], 0);
      const sumLat = coords.reduce((sum, c) => sum + c[1], 0);
      return {
        longitude: sumLng / coords.length,
        latitude: sumLat / coords.length,
      };
    },

    async drawSelectedRoute() {
      if (!this.map || !this.map.isStyleLoaded()) return;
      this.clearRouteMarkers();

      const route = this.selectedRoute;
      if (!route) return;

      const coords = this.getRouteCoordinates(route);
      if (coords.length < 2) return;

      // Add markers for start, stops, and end
      const addPointMarker = (point, color, label) => {
        const el = document.createElement("div");
        el.style.cssText = `
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid white;
          box-shadow: 0 0 8px rgba(0,0,0,0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 700;
        `;
        el.textContent = label;

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
          .setHTML(`<div style="color:#333;font-family:sans-serif;font-size:13px;">
            <strong>${point.name || label}</strong>
          </div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(this.map);

        this.routeMarkers.push({ marker });
      };

      addPointMarker(route.start, "#22c55e", "A");
      (route.stops || []).forEach((stop, i) => {
        addPointMarker(stop, "#f59e0b", String(i + 1));
      });
      addPointMarker(route.end, "#ef4444", "B");

      // Fit bounds to show the whole route
      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));
      this.map.fitBounds(bounds, { padding: 60, duration: 800 });

      // Fetch the actual road route from Mapbox Directions API
      try {
        const coordsStr = coords.map((c) => `${c[0]},${c[1]}`).join(";");
        const res = await fetch(
          `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsStr}?access_token=${mapboxgl.accessToken}&geometries=geojson&overview=full&steps=false`
        );
        const data = await res.json();

        if (!data.routes || data.routes.length === 0) {
          throw new Error("No se pudo calcular la ruta por carretera");
        }

        const roadCoords = data.routes[0].geometry.coordinates;

        // Draw the road polyline
        const geojson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: roadCoords,
              },
            },
          ],
        };

        const source = this.map.getSource(this.routeLineSourceId);
        if (source) {
          source.setData(geojson);
        } else {
          this.map.addSource(this.routeLineSourceId, {
            type: "geojson",
            data: geojson,
          });
          this.map.addLayer({
            id: this.routeLineLayerId,
            type: "line",
            source: this.routeLineSourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#8b5cf6",
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
        }
      } catch (error) {
        console.error("Error obteniendo ruta por carretera:", error);
        // Fallback: draw straight line if directions API fails
        const geojson = {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          ],
        };

        const source = this.map.getSource(this.routeLineSourceId);
        if (source) {
          source.setData(geojson);
        } else {
          this.map.addSource(this.routeLineSourceId, {
            type: "geojson",
            data: geojson,
          });
          this.map.addLayer({
            id: this.routeLineLayerId,
            type: "line",
            source: this.routeLineSourceId,
            layout: {
              "line-join": "round",
              "line-cap": "round",
            },
            paint: {
              "line-color": "#8b5cf6",
              "line-width": 4,
              "line-opacity": 0.9,
            },
          });
        }
      }
    },

    drawAllRouteMiddlePoints() {
      if (!this.map || !this.map.isStyleLoaded()) return;
      this.clearRouteMarkers();

      if (this.routes.length === 0) return;

      const bounds = new mapboxgl.LngLatBounds();

      this.routes.forEach((route) => {
        if (!this.isRouteInsideRange(route)) return;

        const middle = this.getRouteMiddlePoint(route);
        if (!middle) return;

        const isSelected = this.selectedRouteId === route._id;

        const el = document.createElement("div");
        el.style.cssText = `
          width: ${isSelected ? 34 : 26}px;
          height: ${isSelected ? 34 : 26}px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          border: 3px solid white;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.6);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: ${isSelected ? 13 : 11}px;
          font-weight: 700;
          transition: all 0.2s ease;
        `;
        el.textContent = route.title.charAt(0).toUpperCase();

        const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
          .setHTML(`<div style="color:#333;font-family:sans-serif;font-size:13px;">
            <strong>${route.title}</strong>
          </div>`);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([middle.longitude, middle.latitude])
          .setPopup(popup)
          .addTo(this.map);

        // Open the route detail view when clicking the middle point
        el.addEventListener("click", () => {
          this.openRouteDetail(route);
        });

        this.routeMarkers.push({ marker, routeId: route._id });

        bounds.extend([middle.longitude, middle.latitude]);
      });

      if (this.routes.length > 1) {
        this.map.fitBounds(bounds, { padding: 60, duration: 800 });
      }
    },

    openRouteDetail(route) {
      this.selectedRouteId = route._id;
      this.routeDetail = route;
      this.drawSelectedRoute();
    },

    closeRouteDetail() {
      this.routeDetail = null;
      this.drawAllRouteMiddlePoints();
    },

    // ===== Ubicación filter =====
    toggleUbicacion() {
      this.showUbicacion = !this.showUbicacion;
    },

    async closeUbicacion() {
      if (!this.manualLocation.trim()) return;

      try {
        const response = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(this.manualLocation)}.json?access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        if (!data.features.length) {
          this.showNotification("Ubicación no encontrada", "error");
          return;
        }

        const [lng, lat] = data.features[0].center;

        this.userLocation = { lat, lng };

        this.map.flyTo({
          center: [lng, lat],
          zoom: 13,
          duration: 1500
        });

        if (this.userMarker) {
          this.userMarker.remove();
        }

        this.userMarker = new mapboxgl.Marker({ color: "#0099ff" })
          .setLngLat([lng, lat])
          .addTo(this.map);

        this.updateRangeFilter();
        this.showUbicacion = false;
        this.manualLocation = "";
      } catch (error) {
        console.error(error);
        this.showNotification("Error buscando ubicación", "error");
      }
    },

    activateGPS() {
      if (!this.map) {
        this.showNotification("Mapa no inicializado", "error");
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          this.userLocation = { lat: latitude, lng: longitude };

          this.map.flyTo({
            center: [longitude, latitude],
            zoom: 13,
            duration: 1500
          });

          if (this.userMarker) {
            this.userMarker.remove();
          }

          this.userMarker = new mapboxgl.Marker({ color: "#0099ff" })
            .setLngLat([longitude, latitude])
            .addTo(this.map);

          this.updateRangeFilter();
          this.showNotification("Ubicación GPS obtenida", "success");
          this.showUbicacion = false;
        },
        (error) => {
          console.warn("GPS falló:", error);
          this.showNotification("No se pudo obtener la ubicación", "error");
          this.showUbicacion = false;
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        }
      );
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

    isRouteInsideRange(route) {
      if (!this.userLocation) return true;
      const middle = this.getRouteMiddlePoint(route);
      if (!middle) return false;
      return this.getDistanceKm(this.userLocation, { lat: middle.latitude, lng: middle.longitude }) <= this.distanceKm;
    },

    updateRangeFilter() {
      this.updateDistanceCircle();
      this.drawAllRouteMiddlePoints();
    },

    createCircleGeoJson(center, radiusKm, points = 96) {
      const coordinates = [];
      const lat = center.lat * Math.PI / 180;
      const lng = center.lng * Math.PI / 180;
      const angularDistance = radiusKm / 6371;

      for (let i = 0; i <= points; i++) {
        const bearing = (i * 360 / points) * Math.PI / 180;
        const pointLat = Math.asin(
          Math.sin(lat) * Math.cos(angularDistance) +
          Math.cos(lat) * Math.sin(angularDistance) * Math.cos(bearing)
        );
        const pointLng = lng + Math.atan2(
          Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat),
          Math.cos(angularDistance) - Math.sin(lat) * Math.sin(pointLat)
        );

        coordinates.push([
          pointLng * 180 / Math.PI,
          pointLat * 180 / Math.PI
        ]);
      }

      return {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Polygon",
              coordinates: [coordinates]
            }
          }
        ]
      };
    },

    updateDistanceCircle() {
      if (!this.map || !this.map.isStyleLoaded() || !this.userLocation) return;

      const data = this.createCircleGeoJson(this.userLocation, this.distanceKm);
      const source = this.map.getSource(this.rangeSourceId);

      if (source) {
        source.setData(data);
        return;
      }

      this.map.addSource(this.rangeSourceId, {
        type: "geojson",
        data
      });

      this.map.addLayer({
        id: this.rangeFillLayerId,
        type: "fill",
        source: this.rangeSourceId,
        paint: {
          "fill-color": "#3570B5",
          "fill-opacity": 0.08
        }
      });

      this.map.addLayer({
        id: this.rangeLineLayerId,
        type: "line",
        source: this.rangeSourceId,
        paint: {
          "line-color": "#3570B5",
          "line-opacity": 1,
          "line-width": 3
        }
      });
    },

    initializeMap() {
      const mapContainer = document.getElementById("routes-map");
      if (!mapContainer) {
        console.warn("Map container not found");
        return;
      }

      this.map = new mapboxgl.Map({
        container: "routes-map",
        style: "mapbox://styles/alvarod/cmpbzx3ho001z01s6bjz3eruc",
        center: [-8.7292, 42.2383],
        zoom: 8,
      });

      this.map.on("load", () => {
        this.drawAllRouteMiddlePoints();
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
.routes-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  padding: 1rem;
  box-sizing: border-box;
  color: white;
  font-family: "Inter", sans-serif;
  -webkit-app-region: no-drag;
  gap: 0.75rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(0, 0, 0, 0.726)
  );
}

.routes-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.routes-header h2 {
  margin: 0;
  font-size: 1.4rem;
  font-weight: 700;
}

.new-route-btn {
  padding: 0.6rem 1.2rem;
  font-family: "Inter", sans-serif;
  font-size: 0.9rem;
  font-weight: 600;
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.6),
    rgba(99, 102, 241, 0.6)
  );
  border: 1px solid rgba(139, 92, 246, 0.6);
  border-radius: 0.3rem;
  color: white;
  cursor: pointer;
  transition: all 0.25s ease;
}

.new-route-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(139, 92, 246, 0.8),
    rgba(99, 102, 241, 0.8)
  );
  transform: translateY(-2px);
}

.routes-layout {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0.75rem;
}

.routes-sidebar {
  width: 280px;
  min-width: 220px;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.3rem;
  padding: 0.75rem;
}

.routes-sidebar::-webkit-scrollbar {
  width: 6px;
}

.routes-sidebar::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.loading,
.no-routes {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
}

.routes-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.route-item {
  position: relative;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 0.3rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.route-item:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(139, 92, 246, 0.5);
}

.route-item.active {
  background: rgba(139, 92, 246, 0.2);
  border-color: rgba(139, 92, 246, 0.7);
}

.route-item h3 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  padding-right: 1.5rem;
}

.route-desc {
  margin: 0 0 0.4rem;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.3;
}

.route-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.5);
}

.route-stops-count {
  color: rgba(245, 158, 11, 0.8);
}

.delete-route-btn {
  position: absolute;
  top: 0.4rem;
  right: 0.4rem;
  width: 22px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(239, 68, 68, 0.3);
  border: 1px solid rgba(239, 68, 68, 0.5);
  border-radius: 50%;
  color: white;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.delete-route-btn:hover {
  background: rgba(239, 68, 68, 0.6);
}

.map-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
  border-radius: 0.3rem;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

#routes-map {
  width: 100%;
  height: 100%;
  touch-action: none;
}

/* Route detail panel (fills the sidebar) */
.route-detail-panel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background: rgba(20, 20, 40, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(139, 92, 246, 0.5);
  border-radius: 0.4rem;
  padding: 1rem;
  box-sizing: border-box;
  color: white;
  font-family: "Inter", sans-serif;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
  z-index: 10;
}

.route-detail-panel::-webkit-scrollbar {
  width: 6px;
}

.route-detail-panel::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 3px;
}

.close-detail-btn {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  width: 24px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: white;
  font-size: 0.75rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-detail-btn:hover {
  background: rgba(239, 68, 68, 0.5);
  border-color: rgba(239, 68, 68, 0.7);
}

.route-detail-panel h3 {
  margin: 0 0 0.5rem;
  font-size: 1.1rem;
  font-weight: 700;
  padding-right: 1.5rem;
}

.detail-desc {
  margin: 0 0 0.75rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
}

.detail-points {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-point {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.5rem 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.3rem;
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
  margin-top: 0.1rem;
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

.point-info {
  flex: 1;
  min-width: 0;
}

.point-info strong {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  line-height: 1.3;
  word-break: break-word;
}

.point-info p {
  margin: 0.2rem 0 0;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.3;
}

/* Ubicación filter styles */
.filters-container {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 5;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.filter-group {
  position: relative;
  width: auto;
}

.filter-btn {
  width: auto;
  font-family: "Inter", sans-serif;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  color: white;
  font-size: 0.8rem;
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
  border-radius: 0.4rem;
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
  padding: 0.6rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.2rem;
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
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.2rem;
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

.distance-filter {
  height: 2rem;
  padding: 0.1rem 0.65rem;
  padding-bottom: 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.2rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.distance-filter__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: -0.4rem;
  font-family: "Inter", sans-serif;
  font-size: 0.85rem;
  white-space: nowrap;
}

.distance-filter__header strong {
  color: #55c7ff;
  font-size: 0.95rem;
}

.distance-slider {
  width: 100%;
  height: 0.35rem;
  padding: 0;
  accent-color: #55c7ff;
  cursor: pointer;
  border: none;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.25);
  box-shadow: none;
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

@media (max-width: 700px) {
  .routes-layout {
    flex-direction: column;
  }
  .routes-sidebar {
    width: 100%;
    max-height: 200px;
  }
  .map-wrapper {
    flex: 1;
  }
}
</style>