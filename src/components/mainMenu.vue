<template>
  <div class="mainarea">
    <h1>{{ msg }}</h1>
    <img id="image" src="../assets/transport.png" />
    <h3 id="titleText">CarMeet Club</h3>
    <div class="buttonarea">
      <button class="logout-btn" @click="logout">Cerrar sesión</button>
      <button
        class="check-reserves"
        id="check-reserves"
        @click="sortByReserves"
      >
        Ordenar por numero de reservas
      </button>
    </div>
    <div class="scroll-area" v-if="!loading && !error">
      <div
        v-for="actividad in sortedActividades"
        :key="actividad._id"
        class="glass activity-card"
        :class="{ full: actividad.usuarios.length >= actividad.plazasMaximas }"
      >
        <!--NOMBRE-->
        <div class="activity-header">
          <h4>{{ actividad.nombre }}</h4>
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

        <div class="detail-item">
          <!--JOIN CAMBIAR A EXIT CON UN TOGGLE, NO PERMITIR SI PASA DETERMINADO TIEMPO-->
          <button class="action-btn join-btn" @click="toggleJoin(actividad)">
            {{ alreadyIn(actividad) ? "Salir" : "Apuntarse" }}
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
    user: Object,
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
  sortedActividades() {
    let list = [...this.actividades];

    if (this.sortBy === "reserves") {
      list.sort((a, b) => {
        const diff = a.usuarios.length - b.usuarios.length;
        return this.sortDirection === "desc" ? -diff : diff;
      });
    }

    return list;
  }
},

  mounted() {
    this.loadActividades();
  },
  methods: {
alreadyIn(actividad) {
  return actividad.usuarios.some(
    (u) => u.user?._id?.toString() === this.user.id
  );
},
    async toggleJoin(actividad) {
      if (this.alreadyIn(actividad)) {
        await fetch(
          `http://localhost:5000/actividades/${actividad._id}/desinscribir`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: this.user.id }),
          },
        );
      } else {
        await fetch(
          `http://localhost:5000/actividades/${actividad._id}/inscribir`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: this.user.id }),
          },
        );
      }

      await this.loadActividades();
    },
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
sortByReserves() {
  if (this.sortBy === "reserves") {
    this.sortDirection =
      this.sortDirection === "desc" ? "asc" : "desc";
  } else {
    this.sortBy = "reserves";
    this.sortDirection = "desc";
  }
}

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
  margin-bottom: -3rem;
  width: 6rem;
  height: 6rem;
  object-fit: contain;
  padding-right: 80%;
}
#titleText {
  font-size: 1rem;
  margin-bottom: 1rem;
  padding-right: 80%;
}
.buttonarea {
  display: flex;
  flex-direction: row;
  justify-content: center;
  height: 3rem;
  column-gap: 50%;
  padding-bottom: 0.5rem;
width: 100%;
}
button {
  font-family: "Inter", sans-serif;
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
@media (max-width: 950px) {
  .activity-card {
    flex-wrap: wrap;
    display: flex;
    flex-direction: row;
    align-items: center;

    min-height: 9rem;
    justify-content: center;
  }

  .activity-actions {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
