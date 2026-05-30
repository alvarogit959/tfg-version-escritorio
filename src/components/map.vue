<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <!--<img id="image"  src="../assets/transport.png">
    <h3>CarMeet Club</h3>-->
  
    <!-- <p id="notifications">{{ notification }}</p> -->

    <!--FILTROS -->
    <div class="filters-container">
      <div class="filter-group">
        <!-- Ubicación -->
        <button class="filter-btn" @click="toggleUbicacion">
          Ubicación
        </button>
        <div v-if="showUbicacion" class="submenu">
          <button @click="activateGPS" class="submenu-btn">Activar GPS</button>
          <input v-model="manualLocation" type="text" placeholder="Escribe tu ubicación">
          <button @click="closeUbicacion" class="submenu-btn">Aplicar</button>
        </div>
      </div>

      <button
        class="filter-btn"
        :class="{ 'filter-btn--hidden': isTypeHidden('coches') }"
        @click="selectFilter('coches')"
      >
        Concentración Coches
      </button>

      <button
        class="filter-btn"
        :class="{ 'filter-btn--hidden': isTypeHidden('motos') }"
        @click="selectFilter('motos')"
      >
        Concentración Motos
      </button>
      <button
      class="filter-btn"
            @click="selectCompeticion('rally')"
            
            :class="{ 'filter-btn--hidden': isTypeHidden('competicion') }">
          Competición
        </button>
       
      

      <button
        class="filter-btn"
        :class="{ 'filter-btn--hidden': isTypeHidden('feria') }"
        @click="selectFilter('feria')"
      >
        Ferias
      </button>

      <button v-if="false" class="filter-btn" @click="selectFilter('talleres')">
        Talleres
      </button>
    </div>

    <div id="map"></div>


  </div>
</template>

<script>
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
mapboxgl.accessToken = 'pk.eyJ1IjoiYWx2YXJvZCIsImEiOiJjbXBiemtremUwMmV3MnFzYjd6d3c1c291In0.SgpTdV6EiabbSeRDcXg24w';

export default {
  name: "map-view",
  emits: ["open-event"],
  props: {
    msg: String,
  },
  data() {
    
    return {
      username: "",
      password: "",
      confirmpassword: "",
      notification: "",
      map: null,
      showUbicacion: false,
      showCompeticion: false,
      manualLocation: "",
      hiddenTypes: [],
      userLocation: null,
      events: [],
      eventMarkers: [],
      userMarker: null
    };
  },
  async mounted() {
    await this.loadEvents();

    // Dar más tiempo para que el DOM se renderice completamente
    this.$nextTick(() => {
      setTimeout(() => {
        this.initializeMap();
        // Agregar listener para cambios de tamaño
        window.addEventListener('resize', this.onWindowResize);
      }, 100);
    });
  },
  beforeUnmount() {
    // Remover listener de resize
    window.removeEventListener('resize', this.onWindowResize);
    this.eventMarkers.forEach(({ marker }) => marker.remove());
    this.eventMarkers = [];
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    onWindowResize() {
      if (this.map) {
        this.map.resize();
      }
    },

    toggleUbicacion() {
      this.showUbicacion = !this.showUbicacion;
      this.showCompeticion = false;
    },

    toggleCompeticion() {
      this.showCompeticion = !this.showCompeticion;
      this.showUbicacion = false;
    },

    async closeUbicacion() {

if (!this.manualLocation.trim()) return;

try {

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(this.manualLocation)}.json?access_token=${mapboxgl.accessToken}`
  );

  const data = await response.json();

  if (!data.features.length) {
    this.notification = "Ubicación no encontrada";
    return;
  }

  const [lng, lat] = data.features[0].center;

  this.userLocation = {
    lat,
    lng
  };

  this.map.flyTo({
    center: [lng, lat],
    zoom: 13,
    duration: 1500
  });
//TEST MARCADOR
if (this.userMarker) {
  this.userMarker.remove();
}

this.userMarker = new mapboxgl.Marker({
  color: "#0099ff"
})
  .setLngLat([lng, lat])
  .addTo(this.map);

  this.showUbicacion = false;
  this.manualLocation = "";

} catch (error) {
  console.error(error);
}
},
    getMarkerColor(eventType) {
      const colors = {
        coches: " #667eea",
        motos: "#B03B0C",
        competicion: "#31BD5C",
        feria: "#F0EC3C",
      };
      return colors[eventType] || "#9e9e9e";
    },

    createMarkerElement(eventType) {
      const color = this.getMarkerColor(eventType);
      const el = document.createElement("div");

      el.style.width = "18px";
      el.style.height = "18px";
      el.style.borderRadius = "50%";
      el.style.backgroundColor = color;
      el.style.border = "1px solid rgba(220, 210, 240, 0.9)";
      el.style.boxShadow = `0 0 10px ${color}`;
      el.style.cursor = "pointer";

      return el;
    },
    //
    async fallbackLocation() {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();

  const lat = data.latitude;
  const lng = data.longitude;

  this.map.flyTo({
    center: [lng, lat],
    zoom: 10,
    duration: 1500
  });

  // marcador usuario
  if (this.userMarker) {
    this.userMarker.remove();
  }

  this.userMarker = new mapboxgl.Marker({
    color: "#0099ff"
  })
    .setLngLat([lng, lat])
    .addTo(this.map);

  this.notification = "Ubicación por IP";
},
activateGPS() {
  if (!this.map) {
    this.notification = "Mapa no inicializado";
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      this.map.flyTo({
        center: [longitude, latitude],
        zoom: 13,
        duration: 1500
      });

      // marcador usuario
      if (this.userMarker) {
        this.userMarker.remove();
      }

      this.userMarker = new mapboxgl.Marker({
        color: "#0099ff"
      })
        .setLngLat([longitude, latitude])
        .addTo(this.map);

      this.notification = "Ubicación GPS obtenida";
    },

    async (error) => {
      console.warn("GPS falló:", error);

      // 👉 fallback automático
      await this.fallbackLocation();
    },

    {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 0
    }
  );
},

    normalizeEventType(type) {
      if (!type) return "";
      const t = String(type).toLowerCase();
      if (t === "ferias") return "feria";
      return t;
    },

    inferTypeFromUrl(event) {
      const url = (event.url || "").toLowerCase();
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

    isTypeHidden(type) {
      return this.hiddenTypes.includes(this.normalizeEventType(type));
    },

    isEventHidden(event) {
      const type = this.getEventType(event);
      return type ? this.hiddenTypes.includes(type) : false;
    },

    selectFilter(filterType) {
      const type = this.normalizeEventType(filterType);
      this.showUbicacion = false;
      this.showCompeticion = false;

      if (this.hiddenTypes.includes(type)) {
        this.hiddenTypes = this.hiddenTypes.filter((t) => t !== type);
        this.notification = `Mostrando eventos: ${type}`;
      } else {
        this.hiddenTypes.push(type);
        this.notification = `Ocultando eventos: ${type}`;
      }

      this.updateMarkerVisibility();
    },

    selectCompeticion() {
      this.selectFilter("competicion");
      this.showCompeticion = false;
    },

    updateMarkerVisibility() {
      this.eventMarkers.forEach(({ marker, event }) => {
        const el = marker.getElement();
        if (!el) return;
        el.style.display = this.isEventHidden(event) ? "none" : "block";
      });
    },

    initializeMap() {
      // Verify DOM element exists
      const mapContainer = document.getElementById('map');
      if (!mapContainer) {
        console.warn('Map container not found');
        return;
      }

      // Crear mapa de Mapbox
      this.map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/alvarod/cmpbzx3ho001z01s6bjz3eruc',
        center: [-8.7292, 42.2383],
        zoom: 13
      });

      this.map.on('load', () => {
        this.events.forEach((event) => {
          this.addEventMarker(event);
        });
        this.updateMarkerVisibility();
      });
    },


    addEventMarker(event) {
      if (!this.map) {
    console.warn("Mapa no inicializado todavía!!!");
    return;
  }
      if (!event.location || event.location.length === 0) return;

      const loc = event.location[0];
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);

      if (isNaN(lat) || isNaN(lng)) return;

      const fechaInicio = new Date(event.start).toLocaleDateString("es-ES");
      const descripcion = typeof event.description === "string"
        ? event.description.replace(/<[^>]*>/g, "").slice(0, 120)
        : "";

      const popupContent = document.createElement("div");
      popupContent.className = "mapbox-popup-content";
      popupContent.innerHTML = `
        <div style="padding: 10px; max-width: 200px;background: linear-gradient(135deg, #000000 0%, #2E144A 100%);">
          <b style="font-size: 1.1em; color:white">${event.title}</b><br>
          <span style="color: white; font-size: 0.9em;">${fechaInicio}</span><br><br>
          <p style="color: white; margin: 5px 0; font-size: 0.9em;">${descripcion}</p><br>
          <button
            class="map-popup-info-btn"
            style="width: 100%; padding: 8px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 0.2rem; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;">
            Más información
          </button>
        </div>
      `;

      const infoBtn = popupContent.querySelector(".map-popup-info-btn");
      infoBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.$emit("open-event", event);
      });

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
        .setDOMContent(popupContent);

      const eventType = this.getEventType(event);
      const marker = new mapboxgl.Marker({
        element: this.createMarkerElement(eventType),
        anchor: "center",
      })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(this.map);

      this.eventMarkers.push({ marker, event });
    },

    async createUser() {
      if (this.password !== this.confirmpassword) {
        this.notification = "Las contraseñas no coinciden";
        return;
      }

      if (!this.username || !this.password) {
        this.notification = "Rellene todos los campos";
        return;
      }

      try {
        const res = await fetch("http://localhost:5000/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            nombreCorreo: this.username,
            password: this.password
          })
        });

        if (!res.ok) {
          const error = await res.json();
          this.notification = error.error || "Error creando usuario";
          return;
        }

        this.notification = "Usuario creado correctamente";

        this.username = "";
        this.password = "";
        this.confirmpassword = "";

      } catch (error) {
        console.error(error);
        this.notification = "Error conectando con servidor";
      }
    },
    //TEST CARGAR DESDE EL SERVER!!!!====================================================================
    async loadEvents() {
  try {
    const res = await fetch("http://localhost:5000/events");
    this.events = await res.json();
    console.log("Eventos cargados:", this.events);
  } catch (error) {
    console.error("Error cargando eventos:", error);
    this.notification = "No se pudieron cargar los eventos";
  }
},
  },
};
</script>

<style scoped>
/*TEST*/



.mapboxgl-popup-tip {
  border-top-color: #2E144A !important;
  border-bottom-color: #2E144A !important;
}
:deep(.mapboxgl-popup-close-button) {
  color: white;
  font-size: 18px;
}

:deep(.mapboxgl-popup-close-button:hover) {
  background: transparent;
  color: #ccc;
}
:deep(.mapboxgl-popup-content) {
  background: linear-gradient(135deg, #000000 0%, #2E144A 100%) !important;
}
/*FIN   TEST*/
.mainarea {
  display: flex;
  flex-direction: column;
  row-gap: 0.1rem;
  width: 100%;
  height: 100vh;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.12),
    rgba(0, 0, 0, 0.726)
  );

  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  align-items: center;
  justify-content: flex-start;
  color: rgb(255, 255, 255);
  padding: 1rem;
  -webkit-app-region: no-drag;
}
.glass {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);

  border-radius: 1rem;
  color: white;
} 
#image{width: 9rem; 
  height: 9rem; 
  object-fit: contain;
    margin-top: -3rem;
  margin-bottom: -3rem;
}
#notifications{
 margin-top: -0.5rem; 
  margin-bottom: -0.02rem;
padding: 0;
}

h3{  font-family: "Inter", sans-serif;
  color:rgb(255, 255, 255);
font-size: 1.7rem;}
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
  padding: 0.9rem 2rem;
  cursor: pointer;
  transition: all 0.25s ease;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 1rem;
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

p{width: 80%;}
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
  border-radius: 0.2rem;
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

.filter-btn--hidden {
  opacity: 0.55;
  background: rgba(255, 80, 80, 0.25);
  border-color: rgba(255, 120, 120, 0.5);
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

.marker {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

</style>