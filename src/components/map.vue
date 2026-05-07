<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <img id="image"  src="../assets/transport.png">
    <h3>CarMeet Club</h3>
  
    <p id="notifications">{{ notification }}</p>

    <div id="map"></div>

    <button @click="$emit('back')">Atrás</button>
  </div>
</template>

<script>
import L from 'leaflet';
const nombre = "Evento CarMeet";
const fecha = "20/05/2026";
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
      map: null
    };
  },
  mounted() {
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
      L.marker([42.223, -8.6380], { icon: carIcon })
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
      
      // Delay popup opening to avoid animation conflicts
      setTimeout(() => {
        if (this.map) {
          document.querySelectorAll('.leaflet-marker-icon')[0]?.click();
        }
      }, 500);
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
  width: 93%;
  height: 80%;
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
  justify-content: center;
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
  width: 45%;
  padding: 0.9rem;
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
  height: 40rem;
  border-radius: 1rem;
  margin: 1rem 0;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  z-index: 1;
}

</style>