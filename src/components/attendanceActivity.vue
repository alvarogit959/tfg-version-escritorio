<template>
  <div class="mainarea" v-if="actividad">
    <h1>{{ msg }}</h1>
    <img id="image" src="../assets/transport.png" />
    <h3>Comprobar asistencia</h3>
    <p id="notifications">{{ notification }}</p>
    <p><strong>Nombre:</strong> {{ actividad.nombre }}</p>
    <p><strong>Descripción:</strong> {{ actividad.descripcion }}</p>
    <p><strong>Duración:</strong> {{ actividad.duracion }} min</p>
    <p><strong>Plazas máximas:</strong> {{ actividad.plazasMaximas }}</p>
    <p><strong>Fecha:</strong> {{ formatDate(actividad.fecha) }}</p>
    <div class="attendance-area">
      <h4>Usuarios inscritos:</h4>
      <ul>
        <li v-for="usuario in usuariosConAsistencia" :key="usuario.nombre">
          {{ usuario.nombre }} -
          <span :class="usuario.estado">
            {{ usuario.estado }}
          </span>
        </li>
      </ul>
    </div>
    <button class="return-btn" @click="goBack">Atrás</button>
    <!--@click="return"-->
  </div>
</template>
<script>
export default {
  name: "attendanceActivity",
  props: {
    msg: String,
    actividad: Object,
  },

  computed: {
    usuariosConAsistencia() {
      if (!this.actividad?.usuarios) return [];

      return this.actividad.usuarios.map((u) => ({
        nombre: u.user?.nombreCorreo || u.user?._id,
        estado: u.estado,
      }));
    },
  },

  methods: {
    formatDate(dateString) {
      return new Date(dateString).toLocaleString("es-ES");
    },

    goBack() {
      this.$emit("back");
    },
  },
};
</script>

<style scoped>
.mainarea {
  display: flex;
  flex-direction: column;
  row-gap: 0.01rem;
  width: 30rem;
  height: 40rem;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.12),
    rgba(255, 255, 255, 0.05)
  );
  background-color: #00000005;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  padding: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  color: rgb(255, 255, 255);
  padding: 1rem;
  -webkit-app-region: no-drag;
}
#image {
  width: 6rem;
  height: 6rem;
  object-fit: contain;
  margin-top: -3rem;
  margin-bottom: -4rem;
}
#notifications {
  margin-top: -0.5rem;
  margin-bottom: -0.02rem;
  padding: 0;
}
.admin-options {
  padding: 1rem;
  width: 27rem;
}
.admin-button {
  margin: 0.2rem;
}
.scroll-area {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  width: 25rem;
  max-height: 25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scrollbar-width: none;
  overflow-y: auto;
  overflow-x: hidden;
  align-items: center;
  padding: 1rem;
}
.glass {
  width: 100%;
  min-height: 5rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  border: 1px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1);
  border-radius: 1rem;
  color: white;
  align-items: center;
  justify-content: center;
}
h3 {
  font-family: "Inter", sans-serif;
  color: rgb(255, 255, 255);
  font-size: 1.7rem;
}
.date-input-container {
  width: 30rem;
}
input {
  font-family: "Inter", sans-serif;
  width: 60%;
  height: 2.8rem;
  padding: 0 1rem;
  scrollbar-width: none;
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

p {
  width: 80%;
}
a {
  color: #ffffff;
}
</style>
