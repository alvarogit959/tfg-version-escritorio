<template>
  <div class="forum-container">
    <h2>Foro</h2>
    
    <div class="notification-area" v-if="notification">
      <p :class="notificationClass">{{ notification }}</p>
    </div>

    <div class="forum-content">
      <!-- CREAR NUEVO HILO -->
      <div class="create-thread-section">
        <h3>Crear nuevo tema</h3>
        <input
          v-model="newThread.title"
          type="text"
          placeholder="Título del tema..."
          class="thread-input"
        />
        <textarea
          v-model="newThread.content"
          placeholder="Escribe tu mensaje..."
          class="thread-textarea"
        ></textarea>
        <button @click="createThread" class="create-btn">Publicar tema</button>
      </div>

      <!-- LISTA DE TEMAS -->
      <div class="threads-section">
        <h3>Temas activos</h3>
        
        <div v-if="threads.length === 0" class="no-threads">
          <p>No hay temas aún. Sé el primero en crear uno.</p>
        </div>

        <div v-for="thread in threads" :key="thread.id" class="thread-item">
          <div class="thread-header">
            <h4>{{ thread.title }}</h4>
            <span class="thread-date">{{ formatDate(thread.createdAt) }}</span>
          </div>
          <p class="thread-author">Por: {{ thread.author }}</p>
          <p class="thread-preview">{{ thread.content.substring(0, 100) }}...</p>
          <div class="thread-stats">
            <span class="replies">💬 {{ thread.replies || 0 }} respuestas</span>
            <button class="reply-btn" @click="selectThread(thread)">Leer más</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "forum-view",
  data() {
    return {
      threads: [],
      selectedThread: null,
      newThread: {
        title: "",
        content: ""
      },
      notification: "",
      notificationClass: ""
    };
  },
  mounted() {
    this.loadThreads();
  },
  methods: {
    loadThreads() {
      // Por ahora, cargamos datos de ejemplo
      this.threads = [
        {
          id: 1,
          title: "Mejor ruta para la próxima concentración",
          author: "usuario1",
          content: "Hola a todos, alguien conoce una buena ruta para hacer un road trip el próximo fin de semana?",
          replies: 5,
          createdAt: new Date("2026-05-15")
        },
        {
          id: 2,
          title: "Consejos de mantenimiento para coches clásicos",
          author: "mecanico_pro",
          content: "Aquí comparto algunos tips para mantener en perfecto estado tu vehículo clásico.",
          replies: 12,
          createdAt: new Date("2026-05-14")
        },
        {
          id: 3,
          title: "¿Quién va al rally de este mes?",
          author: "racing_fan",
          content: "Se anima alguien a participar en el rally del 20 de mayo?",
          replies: 8,
          createdAt: new Date("2026-05-13")
        }
      ];
    },

    createThread() {
      if (!this.newThread.title || !this.newThread.content) {
        this.notification = "Por favor completa todos los campos";
        this.notificationClass = "error";
        return;
      }

      const thread = {
        id: this.threads.length + 1,
        title: this.newThread.title,
        author: "usuario_actual",
        content: this.newThread.content,
        replies: 0,
        createdAt: new Date()
      };

      this.threads.unshift(thread);
      this.notification = "Tema creado correctamente";
      this.notificationClass = "success";
      
      this.newThread.title = "";
      this.newThread.content = "";

      setTimeout(() => {
        this.notification = "";
      }, 3000);
    },

    selectThread(thread) {
      this.selectedThread = thread;
      console.log("Tema seleccionado:", thread);
    },

    formatDate(date) {
      return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    }
  }
};
</script>

<style scoped>
.forum-container {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(0, 0, 0, 0.726));
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 3px solid rgba(175, 175, 175, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  color: rgb(255, 255, 255);
  padding: 1.5rem;
  -webkit-app-region: no-drag;
  overflow-y: auto;
}

h2 {
  margin: 0 0 1.5rem 0;
  font-size: 1.8rem;
  color: white;
  justify-content: left;
  display:flex;
}

h3 {
  margin: 0 0 1rem 0;
  font-size: 1.2rem;
  color: rgba(100, 200, 255, 0.9);
}

h4 {
  margin: 0;
  color: white;
}

.notification-area {
  margin-bottom: 1rem;
}

.notification-area p {
  padding: 0.8rem;
  border-radius: 0.6rem;
  margin: 0;
  font-size: 0.95rem;
}

.notification-area p.success {
  background: rgba(76, 175, 80, 0.3);
  border: 1px solid rgba(76, 175, 80, 0.5);
  color: #90ee90;
}

.notification-area p.error {
  background: rgba(244, 67, 54, 0.3);
  border: 1px solid rgba(244, 67, 54, 0.5);
  color: #ff8a80;
}

.forum-content {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 1.5rem;
  flex: 1;
  overflow: hidden;
}

/* ===== CREAR NUEVO HILO ===== */
.create-thread-section {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.thread-input {
  font-family: "Inter", sans-serif;
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.6rem;
  color: white;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.thread-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.thread-input:focus {
  outline: none;
  border-color: rgba(100, 200, 255, 0.6);
  background: rgba(100, 200, 255, 0.1);
}

.thread-textarea {
  font-family: "Inter", sans-serif;
  width: 100%;
  padding: 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.6rem;
  color: white;
  font-size: 0.95rem;
  resize: vertical;
  min-height: 120px;
  box-sizing: border-box;
}

.thread-textarea::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.thread-textarea:focus {
  outline: none;
  border-color: rgba(100, 200, 255, 0.6);
  background: rgba(100, 200, 255, 0.1);
}

.create-btn {
  font-family: "Inter", sans-serif;
  padding: 0.8rem 1.5rem;
  background: rgba(76, 175, 80, 0.4);
  border: 1px solid rgba(76, 175, 80, 0.6);
  border-radius: 0.6rem;
  color: #90ee90;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: bold;
}

.create-btn:hover {
  background: rgba(76, 175, 80, 0.6);
  transform: translateY(-2px);
}

/* ===== LISTA DE TEMAS ===== */
.threads-section {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 1.2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.threads-section::-webkit-scrollbar {
  width: 6px;
}

.threads-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}

.threads-section::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 10px;
}

.threads-section::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

.no-threads {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  padding: 2rem;
  font-style: italic;
}

.thread-item {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  padding: 1rem;
  transition: all 0.3s ease;
}

.thread-item:hover {
  background: rgba(100, 200, 255, 0.15);
  border-color: rgba(100, 200, 255, 0.4);
  transform: translateX(5px);
}

.thread-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.thread-date {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
}

.thread-author {
  margin: 0.3rem 0;
  font-size: 0.9rem;
  color: rgba(100, 200, 255, 0.8);
}

.thread-preview {
  margin: 0.5rem 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
}

.thread-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.8rem;
  padding-top: 0.8rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.replies {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.reply-btn {
  font-family: "Inter", sans-serif;
  padding: 0.4rem 0.8rem;
  background: rgba(33, 150, 243, 0.4);
  border: 1px solid rgba(33, 150, 243, 0.6);
  border-radius: 0.4rem;
  color: #80d8ff;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
}

.reply-btn:hover {
  background: rgba(33, 150, 243, 0.6);
  transform: translateY(-1px);
}

/* ===== RESPONSIVE ===== */
@media (max-width: 1024px) {
  .forum-content {
    grid-template-columns: 1fr;
  }

  .threads-section {
    max-height: 400px;
  }
}
</style>
