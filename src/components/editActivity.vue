<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <img id="image" src="../assets/transport.png" />
    <h3>Crear nueva actividad</h3>
    <p id="notifications">{{ notification }}</p>
    <input
      v-model="activityname"
      type="text"
      placeholder="Nombre de la nueva actividad..."
    />
    <input
      v-model="activitydescription"
      type="text"
      placeholder="Descripción..."
    />
    <div class="date-input-container">
      <input
        v-model="activitydate"
        type="datetime-local"
        :min="minDate"
        class="date-input"
        :class="{ error: errors.fecha }"
      />
    </div>
    <input
      v-model="activityduration"
      type="number"
      placeholder="Duración en minutos..."
    />
    <!--SOLO NUMEROS CAMBIAR!!!!!!!!!-->
    <input
      v-model="activitymaxusers"
      type="number"
      placeholder="Numero maximo de usuarios..."
    />
    <button class="setNewActivity" @click="updateActivity">Editar</button>
    <button class="return-btn" @click="goBack">Atrás</button>
    <!--@click="return"-->
  </div>
</template>
<script>
export default {
  name: "editActivity",
  props: {
    msg: String,
    activity: Object,
  },
  mounted() {
    if (this.activity) {
      this.activityname = this.activity.nombre;
      this.activitydescription = this.activity.descripcion;
      this.activityduration = this.activity.duracion;
      this.activitymaxusers = this.activity.plazasMaximas;

      if (this.activity.fecha) {
        this.activitydate = this.activity.fecha.slice(0, 16);
      }
    }
  },
  data() {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");
    const horas = String(hoy.getHours()).padStart(2, "0");
    const minutos = String(hoy.getMinutes()).padStart(2, "0");

    const fechaMinima = `${año}-${mes}-${dia}T${horas}:${minutos}`;
    return {
      activityname: "",
      activitydescription: "",
      activitydate: "",
      activityduration: "",
      activitymaxusers: "",
      notification: "",
      minDate: fechaMinima,
      errors: {
        nombre: false,
        fecha: false,
        duracion: false,
        plazas: false,
      },
    };
  },
  /*nombre: {
    type: String,
    required: true
  },
  descripcion: String,
  duracion: Number,
  plazasMaximas: Number, */
  methods: {
    async updateActivity() {
      try {
        const res = await fetch(
          `http://localhost:5000/actividades/${this.activity._id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              nombre: this.activityname,
              descripcion: this.activitydescription,
              fecha: this.activitydate
                ? new Date(this.activitydate).toISOString()
                : this.activity.fecha,
              duracion: parseInt(this.activityduration),
              plazasMaximas: parseInt(this.activitymaxusers),
            }),
          },
        );

        if (!res.ok) {
          throw new Error("Error actualizando actividad");
        }

        this.notification = "Actividad actualizada correctamente";
        this.$emit("back");
      } catch (error) {
        console.error(error);
        this.notification = "Error al actualizar";
      }
    },

    selectOption(option) {
      this.notification = `Seleccionaste: ${option}`;
    },
    //TERMINAR!!!===============================
    /* return() {
      this.$emit("return");
    },*/
    /*
    logout() {
      this.$emit("logout");
    },*/
    goBack() {
      this.$emit("back");
    },
  },
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.mainarea {
  display: flex;
  flex-direction: column;
  row-gap: 1rem;
  width: 75%;
  height: 88%;
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
  width: 9rem;
  height: 9rem;
  object-fit: contain;
  margin-top: -3rem;
  margin-bottom: -3rem;
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
  width: 100%;
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
