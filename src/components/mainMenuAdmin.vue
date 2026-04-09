<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <img id="image" src="../assets/transport.png" />
    <h3 id="titleText">Bienvenido usuario Admin</h3>
    <div class="admin-options">
      <!--CLOSE-->
      <button class="admin-button" @click="logout">Cerrar sesión</button>
      <button class="admin-button" id="check-reserves" @click="sortByReserves">
        Ordenar por numero de reservas
      </button>

      <button class="admin-button" @click="newActivity" id="new-activity">
        Crear nueva actividad
      </button>
    </div>
    <div class="scroll-area" v-if="!loading && !error">
      <div
        v-for="actividad in actividadesOrdenadas"
        :key="actividad._id"
        class="glass activity-card"
        :class="{ full: actividad.usuarios.length >= actividad.plazasMaximas }"
      >
        <!--NOMBRE-->
        <div class="activity-header">
          <h4>{{ actividad.nombre }}</h4>
          <span class="activity-date">{{
            formatDate(actividad.createdAt)
          }}</span>
        </div>
        <!--DESCRIPCION-->

        <p v-if="actividad.descripcion" class="activity-description">
          {{ actividad.descripcion }}
        </p>

        <p v-else class="no-description">Sin descripción</p>
        <!--DURACIÓN-->

        <div class="detail-item">
          <span class="detail-label">Duración:</span>
          <span class="detail-value">{{ actividad.duracion }} minutos</span>
        </div>
        <!--PLAZAS-->
        <div class="detail-item">
          <span class="detail-label">Plazas:</span>
          <span class="detail-value">
            {{ actividad.usuarios.length }}/{{ actividad.plazasMaximas }}
            <span
              v-if="actividad.usuarios.length >= actividad.plazasMaximas"
              class="full-badge"
              >LLENO</span
            >
          </span>
        </div>
        <!--RESERVAS
            <div class="detail-item">
              <span class="detail-label">Reservas:</span>
              <span class="detail-value">{{ actividad.usuarios.length }}</span>
            </div>-->

        <div class="activity-actions">
          <!--MODIFICAR-->
          <button class="action-btn edit-btn" @click="editActivity(actividad)">
            Modificar
          </button>
          <!--ASISTENCIA-->
          <!-- :disabled="actividad.usuarios.length === 0" -->
          <button
            class="action-btn"
            id="checkUsers"
            @click="attendanceActivity(actividad)"
          >
            Comprobar asistencia
          </button>

          <!--ELIMINAR-->
          <button
            class="action-btn delete-btn"
            @click="deleteActivity(actividad._id)"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "mainMenu",
  props: {
    msg: String,
  },
  data() {
    return {
      actividades: [],
      loading: false,
      error: null,
      showUsers: {},
      sortBy: "recent",
      sortDirection: "desc",
    };
  },
  computed: {
    actividadesOrdenadas() {
      const actividadesCopy = [...this.actividades];

      if (this.sortBy === "reserves") {
        return actividadesCopy.sort((a, b) => {
          if (this.sortDirection === "desc") {
            return b.usuarios.length - a.usuarios.length;
          } else {
            return a.usuarios.length - b.usuarios.length;
          }
        });
      } else {
        //Mas reciente primero
        return actividadesCopy.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      }
    },
  },
  mounted() {
    this.loadActividades();
  },
  methods: {
    async loadActividades() {
      this.loading = true;
      this.error = null;

      try {
        const response = await fetch("http://localhost:5000/actividades");

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        this.actividades = data;
        this.sortBy = "recent";
      } catch (error) {
        console.error("Error cargando actividades:", error);
        this.error = `No se pudieron cargar las actividades: ${error.message}`;
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    },
    selectOption(option) {
      alert(`Seleccionaste: ${option}`);
    },
    logout() {
      this.$emit("logout");
    },
    newActivity() {
      this.$emit("newActivity");
    },
    editActivity(actividad) {
      this.$emit("editActivity", actividad);
    },
    attendanceActivity(actividad) {
      this.$emit("attendanceActivity", actividad);
    },
    sortByReserves() {
      if (this.sortBy === "reserves") {
        //altrernar
        this.sortDirection = this.sortDirection === "desc" ? "asc" : "desc";
      } else {
        this.sortBy = "reserves";
        this.sortDirection = "desc";
      }
    },
    async deleteActivity(actividadId) {
      try {
        const response = await fetch(
          `http://localhost:5000/actividades/${actividadId}`,
          {
            method: "DELETE",
          },
        );
        if (!response.ok) {
          throw new Error("Error al eliminar la actividad");
        }
        await this.loadActividades();
        //alert('Actividad eliminada correctamente');
      } catch (error) {
        console.error("Error eliminando actividad:", error);
        alert("Error al eliminar la actividad");
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
  row-gap: 0.5rem;
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

  align-items: center;
  justify-content: center;
  border-radius: 3rem;
  color: rgb(255, 255, 255);
  padding: 1rem;
  -webkit-app-region: no-drag;
}
#image {
  margin-top: -3rem;
  width: 6rem;
  height: 6rem;
  object-fit: contain;
}
#titleText {
  font-size: 1rem;
  margin-bottom: 2rem;
}
.admin-options {
  margin-top: -1.5rem;
  width: 100%;

  display: flex;
  justify-content: center;
}
.admin-button {
  margin: 0.2rem;
  min-width: 15%;
  max-width: 30%;
  height: 3rem;
  display: flex;
  justify-content: center;
  align-items: center;
}
.scroll-area {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 1rem;
  width: 90%;
  min-height: 20rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scrollbar-width: none;
  overflow-y: auto;
  overflow-x: hidden;
  align-items: center;
  padding: 1rem;
  font-size: 0.7rem;
}
.activity-card {
  gap: 3%;
  max-width: 95%;
  padding-right: 1rem;
  padding-left: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
}

.activity-actions {
  width: 40%;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  column-gap: 0.3rem;
}

.action-btn {
  max-height: 3rem;
  font-size: 0.7rem;
  display: flex;
  justify-content: center;
  align-items: center;
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
  margin-top: -0.5rem;
  font-family: "Inter", sans-serif;
  color: rgb(255, 255, 255);
  font-size: 1.7rem;
}
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
h4 {
  margin: 0.4rem;
}
p {
  width: 80%;
}
a {
  color: #ffffff;
}
@media (max-width: 950px) {
  .activity-card {
    flex-wrap: wrap;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    gap: 0.5rem;
    min-height: 13rem;
  }

  .activity-actions {
    width: 100%;
    justify-content: space-between;
  }

  .action-btn {
    width: 100%;
  }
}
</style>
