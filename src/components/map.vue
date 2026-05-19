<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <!--<img id="image"  src="../assets/transport.png">
    <h3>CarMeet Club</h3>-->
  
    <p id="notifications">{{ notification }}</p>

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
          <button @click="closeUbicacion" class="submenu-btn">✓ Aplicar</button>
        </div>
      </div>

      <button class="filter-btn" @click="selectFilter('coches')">
        Concentración Coches
      </button>

      <button class="filter-btn" @click="selectFilter('motos')">
        Concentración Motos
      </button>

      <!-- Competición -->
      <div class="filter-group">
        <button class="filter-btn" @click="toggleCompeticion">
          Competición
        </button>
        <div v-if="showCompeticion" class="submenu">
          <button @click="selectCompeticion('rally')" class="submenu-btn">Rally</button>
          <button @click="selectCompeticion('circuito')" class="submenu-btn">Circuito</button>
          <button @click="selectCompeticion('drift')" class="submenu-btn">Drift</button>
          
        </div>
      </div>

      <button class="filter-btn" @click="selectFilter('ferias')">
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
      activeFilter: null,
      userLocation: null,
      events: [],
      markers: [],
      popups: []
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
    // Limpiar popups
    this.popups.forEach(popup => popup.remove());
    this.popups = [];
    this.markers = [];
    if (this.map) {
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

    closeUbicacion() {
      this.showUbicacion = false;
      this.notification = `Ubicación establecida: ${this.manualLocation}`;
      this.userLocation = this.manualLocation;
      this.manualLocation = "";
    },
    
 createMarkerElement() {
  
  const el = document.createElement('div');

  el.style.width = '22px';
  el.style.height = '22px';
  el.style.backgroundImage = `url('${require('../assets/transport.png')}')`;
  el.style.backgroundSize = 'contain';
  el.style.backgroundRepeat = 'no-repeat';
  el.style.backgroundPosition = 'center';
  el.style.cursor = 'pointer';
  el.style.filter = 'drop-shadow(0 0 6px orange)';
  // No agregar position absolute ni transform - Mapbox GL lo maneja

  return el;
},

    activateGPS() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this.userLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            this.notification = `GPS Activado: ${this.userLocation}`;
            this.map.flyTo({
              center: [longitude, latitude],
              zoom: 13,
              duration: 1500
            });
            this.showUbicacion = false;
          },
          (error) => {
            this.notification = "No se pudo obtener la ubicación";
            console.error(error);
          }
        );
      } else {
        this.notification = "Geolocalización no disponible";
      }
    },

    selectFilter(filterType) {
      this.activeFilter = filterType;
      this.showUbicacion = false;
      this.showCompeticion = false;
      this.notification = `Filtro aplicado: ${filterType}`;
      console.log(`Filter selected: ${filterType}`);
    },

    selectCompeticion(tipo) {
      this.activeFilter = `competicion-${tipo}`;
      this.showCompeticion = false;
      this.notification = `Competición seleccionada: ${tipo}`;
      console.log(`Competition type selected: ${tipo}`);
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

      // Esperar a que el mapa esté cargado
      this.map.on('load', () => {
        // Crear un marcador por cada evento
        this.events.forEach(event => {
          if (!event.location || event.location.length === 0) return;

          const loc = event.location[0];
          const lat = parseFloat(loc.latitude);
          const lng = parseFloat(loc.longitude);

          if (isNaN(lat) || isNaN(lng)) return;

          const fechaInicio = new Date(event.start).toLocaleDateString("es-ES");

          // Crear elemento del marcador
          const markerEl = this.createMarkerElement();

          // Crear popup
          const popupContent = document.createElement('div');
          popupContent.className = 'mapbox-popup-content';
          popupContent.innerHTML = `
            <div style="padding: 10px; max-width: 200px;">
              <b style="font-size: 1.1em; color: #333;">${event.title}</b><br>
              <span style="color: #666; font-size: 0.9em;">${fechaInicio}</span><br><br>
              <p style="color: #555; margin: 5px 0; font-size: 0.9em;">${event.description}</p><br>
              <button onclick="alert('Apuntado correctamente')" 
                style="width: 100%; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">
                Asistir
              </button>
            </div>
          `;

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: true })
            .setDOMContent(popupContent);

          // Crear marcador y agregarlo al mapa
          const marker = new mapboxgl.Marker({
  element: this.createMarkerElement(),
  anchor: 'center'
})
  .setLngLat([lng, lat])
  .setPopup(popup)
  .addTo(this.map);

          this.markers.push(marker);
          this.popups.push(popup);

          // Mostrar popup al hacer clic en el marcador
          markerEl.addEventListener('click', () => {
            marker.togglePopup();
          });
        });
      });
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

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
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
  width: 99%;
  height: calc(100vh - 260px);
  overflow: hidden;
  min-height: 400px;
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

.marker {
  display: block !important;
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: none !important;
}

</style>