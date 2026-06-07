<template>
  <div class="event-mini-map-wrap">
    <div ref="mapContainer" class="event-mini-map" />
  </div>
</template>

<script>
import L from "leaflet";

export default {
  name: "event-mini-map",
  props: {
    event: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      map: null,
      marker: null,
      resizeTimer: null,
    };
  },
  watch: {
    event: {
      deep: true,
      handler() {
        this.$nextTick(() => this.renderPoint());
      },
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.initMap();
      this.renderPoint();
    });
  },
  beforeUnmount() {
    if (this.resizeTimer) {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = null;
    }
    if (this.marker) {
      this.marker.remove();
      this.marker = null;
    }
    if (this.map) {
      this.map.stop();
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    createCarIcon(zoom) {
      const size = Math.max(12, Math.min(36, zoom * 2.2));
      return L.icon({
        iconUrl: require("../assets/transport.png"),
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
        popupAnchor: [0, -size + 5],
      });
    },

    initMap() {
      if (!this.$refs.mapContainer || this.map) return;

      this.map = L.map(this.$refs.mapContainer, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        zoomAnimation: false,
        markerZoomAnimation: false,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
        {
          attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
          maxZoom: 19,
        },
      ).addTo(this.map);

      this.map.on("zoomend", () => {
        if (this.marker) {
          this.marker.setIcon(this.createCarIcon(this.map.getZoom()));
        }
      });
    },

    renderPoint() {
      if (!this.map) return;

      const loc = this.event?.location?.[0];
      if (!loc) return;

      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      if (this.marker) {
        this.marker.remove();
        this.marker = null;
      }

      const zoom = 14;
      this.marker = L.marker([lat, lng], {
        icon: this.createCarIcon(zoom),
      })
        .addTo(this.map)
        .bindPopup(
          `<b>${this.event.title || "Evento"}</b><br>${loc.location || ""}`,
        );

      this.map.setView([lat, lng], zoom, { animate: false, reset: true });

      this.resizeTimer = setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
        }
      }, 80);
    },
  },
};
</script>

<style scoped>
.event-mini-map-wrap {
  width: 100%;
  border-radius: 0.2rem;
  overflow: hidden;
  border: 1px solid rgba(255, 162, 100, 0.35);
  margin-bottom: 1rem;
}

.event-mini-map {
  width: 100%;
  height: 220px;
  background: rgba(20, 20, 40, 0.4);
}

.event-mini-map-wrap :deep(.leaflet-control-attribution) {
  font-size: 9px;
  opacity: 0.45;
}
</style>
