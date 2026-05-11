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

    <button id="back-button" @click="$emit('back')">Atrás</button>
  </div>
</template>

<script>
import L from 'leaflet';
//const nombre = "Evento CarMeet";
//const fecha = "20/05/2026";
const carIcon = L.icon({
  iconUrl: require('../assets/transport.png'),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -35]
});
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
      events: []
    };
  },
  async mounted() {
    await this.loadEvents();

    this.$nextTick(() => {
      this.initializeMap();
    });
  },
  beforeUnmount() {
    if (this.map) {
      this.map.off();
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
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


    activateGPS() {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            this.userLocation = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
            this.notification = `GPS Activado: ${this.userLocation}`;
            this.map.setView([latitude, longitude], 13);
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

//UBICACION INICIO
      this.map = L.map('map');
      this.map.setView([42.2383, -8.7292], 13);

    //capa de OpenStreetMap
    //Cambiar color aqui??
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 19
}).addTo(this.map);
    
//Marcador de ejemplo ---------------------------------------------
 /*     L.marker([42.223, -8.6380], { icon: carIcon })
        .addTo(this.map)
       // .bindTooltip(`${nombre}`, { permanent: true, direction: 'top' })
        .bindPopup(`
    <b>${nombre}</b><br>
    ${fecha}<br><br>
    <button onclick="alert('Apuntado correctamente')">Asistir</button>
  `);


      L.marker([42.2383, -8.7102]).addTo(this.map)
        .bindPopup(`Test<br><br>
    <button onclick="alert('Apuntado correctamente')">Asistir</button>`);
      
      //DELAY PARA TESTEAR POPUP 
      setTimeout(() => {
        if (this.map) {
          document.querySelectorAll('.leaflet-marker-icon')[0]?.click();
        }
      }, 500); */
      // Crear un marcador por cada evento
this.events.forEach(event => {
  if (!event.location || event.location.length === 0) return;

  const loc = event.location[0];

  const lat = parseFloat(loc.latitude);
  const lng = parseFloat(loc.longitude);

  if (isNaN(lat) || isNaN(lng)) return;

  const fechaInicio = new Date(event.start).toLocaleDateString("es-ES");

  L.marker([lat, lng], { icon: carIcon })
    .addTo(this.map)
    .bindPopup(`
      <b>${event.title}</b><br>
      ${fechaInicio}<br><br>
      ${event.description}<br><br>
      <button onclick="alert('Apuntado correctamente')">
        Asistir
      </button>
    `);
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
  row-gap: 0.1rem;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    135deg,
    rgba(255,255,255,0.12),
    rgba(255,255,255,0.05)
  );
  background-color: #00000005;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);

  align-items: center;
  justify-content: flex-start;
  border-radius: 3rem;
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
#back-button{width: 18rem;}
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
  width: 90%;
  height: 35rem;
  border-radius: 1rem;
  margin: 1rem 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  z-index: 1;
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

</style>