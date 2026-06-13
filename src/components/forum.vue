<template>
  <div class="forum-container">
    <div class="content-wrapper">
      <!--Filters-->
      <section class="panel-card filters-panel">
        <div class="forum-controls">
          <div class="filter-controls">
            <input
              v-model="searchText"
              type="text"
              placeholder="Buscar por título..."
              class="search-input"
            />
          </div>
          <div class="sort-control">
            <button
              v-if="currentUser"
              type="button"
              class="btn-primary"
              @click="showCreateForm = true"
            >
              + Nueva entrada
            </button>
          </div>
        </div>
      </section>

      <!--LIST OF POSTS -->

      <section class="forum-list-panel">
        <div class="forum-list">
          <div
            v-for="post in filteredPosts"
            :key="post._id"
            class="forum-card"
            @click="selectPost(post)"
          >
            <div class="forum-card-header">
              <h3>{{ post.title }}</h3>
              <span v-if="post.tags && post.tags.length > 0" class="forum-tags">
                <span v-for="tag in post.tags" :key="tag" class="tag-badge">{{
                  tag
                }}</span>
              </span>
            </div>
            <div class="forum-card-meta">
              <span class="forum-author">
                {{ post.author?.username || "???" }}
                <span v-if="post.author?.role === 'admin'" class="admin-badge"
                  >Admin</span
                >
              </span>
              <span class="forum-date">{{ formatDate(post.createdAt) }}</span>
            </div>
            <p class="forum-preview">{{ postPreview(post) }}</p>
            <div class="forum-card-footer">
              <span class="reply-count"
                >{{ post.replies?.length || 0 }} respuestas</span
              >
            </div>
          </div>

          <div v-if="filteredPosts.length === 0" class="no-posts">
            <p>No hay entradas en el foro</p>
          </div>
        </div>
      </section>

      <!--NEW POST OVERLAY-->
      <Transition name="detail-slide">
        <div v-if="showCreateForm" class="forum-detail-overlay">
          <div class="detail-scroll">
            <div class="create-form-container">
              <div class="detail-title-row">
                <h2>Nueva entrada en el foro</h2>
                <button
                  type="button"
                  class="btn-primary back-btn"
                  @click="cancelCreate"
                >
                  ← Cancelar
                </button>
              </div>
              <div class="create-form">
                <div class="form-group">
                  <label>Título</label>
                  <input
                    v-model="newPostTitle"
                    type="text"
                    placeholder="Título de la entrada"
                    class="form-input"
                  />
                </div>
                <div class="form-group">
                  <label>Contenido</label>
                  <textarea
                    v-model="newPostContent"
                    placeholder="Escribe tu mensaje..."
                    class="form-textarea"
                    rows="6"
                  ></textarea>
                </div>
                <div class="form-group">
                  <label>Tags (separados por coma)</label>
                  <input
                    v-model="newPostTags"
                    type="text"
                    placeholder="ej: motor, ayuda, evento"
                    class="form-input"
                  />
                </div>
                <div class="form-actions">
                  <button
                    type="button"
                    class="btn-primary submit-btn"
                    :disabled="creatingPost"
                    @click="createPost"
                  >
                    {{ creatingPost ? "Publicando..." : "Publicar entrada" }}
                  </button>
                </div>
                <p v-if="createError" class="form-error">{{ createError }}</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>

      <Transition name="detail-slide">
        <div v-if="selectedPost" class="forum-detail-overlay">
          <div class="detail-scroll">
            <div class="detail-content">
              <div class="detail-title-row">
                <h1>{{ selectedPost.title }}</h1>
                              <!--TEST DELETE-->
              <div v-if="canDeletePost(selectedPost)">
                <button
                  type="button"
                  class="btn-remove"
                  :disabled="deletingPost"
                  @click="deletePost(selectedPost)"
                >
                  {{ "Borrar entrada" }}
                </button>
              </div>
                <button
                  type="button"
                  class="btn-primary back-btn"
                  @click="closeDetail"
                >
                  ← Volver
                </button>
              </div>

              <!--DATA OF THE GUY-->
              <div class="post-meta">
                <span class="forum-author">
                  <button
                    type="button"
                    class="author-link"
                    @click="$emit('view-user', selectedPost.author?._id)"
                  >
                    {{ selectedPost.author?.username || "Desconocido" }}
                  </button>
                  <span
                    v-if="selectedPost.author?.role === 'admin'"
                    class="admin-badge"
                    >Admin</span
                  >
                </span>
                <span class="forum-date">{{
                  formatDateFull(selectedPost.createdAt)
                }}</span>
                <span
                  v-if="selectedPost.tags && selectedPost.tags.length > 0"
                  class="post-tags"
                >
                  <span
                    v-for="tag in selectedPost.tags"
                    :key="tag"
                    class="tag-badge"
                    >{{ tag }}</span
                  >
                </span>
              </div>

              <div class="post-content">
                <p>{{ selectedPost.content }}</p>
              </div>



              <!--ANSWERS-->
              <div class="replies-section">
                <h3>Respuestas ({{ selectedPost.replies?.length || 0 }})</h3>

                <div
                  v-if="
                    !selectedPost.replies || selectedPost.replies.length === 0
                  "
                  class="no-replies"
                >
                  <p>Responda al post abajo...</p>
                </div>

                <div v-else class="replies-list">
                  <div
                    v-for="reply in selectedPost.replies"
                    :key="reply._id"
                    class="reply-card"
                  >
                    <div class="reply-header">
                      <span class="forum-author">
                        <button
                          type="button"
                          class="author-link"
                          @click="$emit('view-user', reply.author?._id)"
                        >
                          {{ reply.author?.username || "Desconocido" }}
                        </button>
                        <span
                          v-if="reply.author?.role === 'admin'"
                          class="admin-badge"
                          >Admin</span
                        >
                      </span>
                      <span class="forum-date">{{
                        formatDate(reply.createdAt)
                      }}</span>
                    </div>
                    <p class="reply-content">{{ reply.content }}</p>
                  </div>
                </div>

                <!--ANSWER-->
                <div v-if="currentUser" class="reply-form">
                  <textarea
                    v-model="replyContent"
                    placeholder="Escribe tu respuesta..."
                    class="form-textarea"
                    rows="3"
                  ></textarea>
                  <button
                    type="button"
                    class="btn-primary submit-btn"
                    :disabled="sendingReply"
                    @click="sendReply(selectedPost)"
                  >
                    {{ "Responder" }}
                  </button>
                </div>
                <p v-else class="login-prompt">Inicia sesion para responder!</p>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script>
import { apiJson, userIdFrom } from "../utils/api.js";

export default {
  name: "forum-view",
  props: {
    currentUser: {
      type: Object,
      default: null,
    },
  },
  emits: ["view-user"],
  data() {
    return {
      posts: [],
      selectedPost: null,
      loading: false,
      searchText: "",
      showCreateForm: false,
      newPostTitle: "",
      newPostContent: "",
      newPostTags: "",
      creatingPost: false,
      createError: "",
      replyContent: "",
      sendingReply: false,
      deletingPost: false,
    };
  },
  computed: {
    filteredPosts() {
      if (!this.searchText || !this.searchText.trim()) {
        return this.posts;
      }
      const search = this.searchText.toLowerCase().trim();
      return this.posts.filter((post) =>
        post.title?.toLowerCase().includes(search),
      );
    },
  },
  async mounted() {
    await this.loadPosts();
  },
  methods: {
    async loadPosts() {
      this.loading = true;
      try {
        this.posts = await apiJson("/forum");
      } catch (error) {
        console.error("Error cargando foro:", error);
        this.posts = [];
      } finally {
        this.loading = false;
      }
    },

    postPreview(post) {
      const raw = post.content || "";
      const plain = typeof raw === "string" ? raw.replace(/<[^>]*>/g, "") : "";
      return plain.length > 120 ? `${plain.slice(0, 120)}...` : plain || "—";
    },

    formatDate(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },

    formatDateFull(date) {
      if (!date) return "";
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },

    selectPost(post) {
      this.selectedPost = post;
    },

    closeDetail() {
      this.selectedPost = null;
      this.replyContent = "";
    },

    cancelCreate() {
      this.showCreateForm = false;
      this.newPostTitle = "";
      this.newPostContent = "";
      this.newPostTags = "";
      this.createError = "";
    },

    async createPost() {
      if (!this.newPostTitle.trim() || !this.newPostContent.trim()) {
        this.createError = "Título y contenido son obligatorios";
        return;
      }
      this.creatingPost = true;
      this.createError = "";
      try {
        const tags = this.newPostTags
          ? this.newPostTags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [];
        const newPost = await apiJson("/forum", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: this.newPostTitle.trim(),
            content: this.newPostContent.trim(),
            authorId: userIdFrom(this.currentUser),
            tags,
          }),
        });
        this.posts.unshift(newPost);
        this.cancelCreate();
        this.selectedPost = newPost;
      } catch (error) {
        console.error("Error creando post:", error);
        this.createError = error.message || "Error al crear la entrada";
      } finally {
        this.creatingPost = false;
      }
    },

    async sendReply(post) {
      if (!this.replyContent.trim()) return;
      this.sendingReply = true;
      try {
        const updated = await apiJson(`/forum/${post._id}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            authorId: userIdFrom(this.currentUser),
            content: this.replyContent.trim(),
          }),
        });
        this.selectedPost = updated;
//Updatelist
        const idx = this.posts.findIndex((p) => p._id === updated._id);
        if (idx !== -1) {
          this.posts[idx] = updated;
        }
        this.replyContent = "";
      } catch (error) {
        console.error("Error enviando respuesta:", error);
      } finally {
        this.sendingReply = false;
      }
    },

    canDeletePost(post) {
      if (!this.currentUser || !post) return false;
      const isAdmin = this.currentUser.role === "admin";
      const isAuthor = post.author?._id === this.currentUser.id;
      return isAdmin || isAuthor;
    },

    async deletePost(post) {
      this.deletingPost = true;
      try {
        await apiJson(`/forum/${post._id}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userIdFrom(this.currentUser) }),
        });
        this.posts = this.posts.filter((p) => p._id !== post._id);
        if (this.selectedPost?._id === post._id) {
          this.closeDetail();
        }
      } catch (error) {
        console.error("Error eliminando post:", error);
      } finally {
        this.deletingPost = false;
      }
    },
  },
};
//If you need more something more, check this inforamtion before: https://www.youtube.com/watch?v=P5MCgOkqb5U&rco=1
</script>

<style scoped>
.forum-container {
  width: 100%;
  height: calc(100vh - 2rem - 75px);
  max-height: calc(100vh - 2rem - 75px);
  overflow-y: auto;
  color: white;
  font-family: "Inter", sans-serif;
  box-sizing: border-box;
  -webkit-app-region: no-drag;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
}

.forum-container::-webkit-scrollbar {
  width: 12px;
}
.forum-container::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
.forum-container::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.forum-container::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.content-wrapper {
  position: relative;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.panel-card {
  min-height: 1.5rem;
  height: auto;
  padding: 0.4rem 1rem;
  display: flex;
  flex-direction: space;
}

.forum-list-panel {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: none;
  border: none;
  padding: 0.5rem;
}

.forum-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  justify-content: end;
  width: 100%;
  height: auto;
}

.filter-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  flex-wrap: wrap;
  max-width: 100vw;
}

.sort-control {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  color: rgba(255, 255, 255, 0.75);
  font-size: 0.8rem;
}

.search-input {
  width: 12rem;
  padding: 0.45rem 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.search-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.18);
}
.search-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.btn-primary {
  font-family: inherit;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 0.6rem;
  color: white;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
}
.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-2px);
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-remove {
  margin:0;
  align-items: center;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 0.6rem;
  color: #ff6b6b;
  background: rgba(255, 80, 80, 0.15);
  border: 1px solid rgba(255, 80, 80, 0.4);
}
.btn-remove:hover:not(:disabled) {
  background: rgba(255, 80, 80, 0.3);
  transform: translateY(-2px);
}
.btn-remove:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}


.forum-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  padding-right: 0.25rem;
  padding-top: 0.2rem;
}

.forum-list::-webkit-scrollbar {
  width: 8px;
}
.forum-list::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
.forum-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
}
.forum-list::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.forum-card {
  font-family: inherit;
  padding: 0.9rem 1rem;
  background: linear-gradient(
    135deg,
    rgba(17, 13, 73, 0.404),
    rgba(0, 0, 0, 0.596)
  );
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.8rem;
  cursor: pointer;
  transition: all 0.25s ease;
}
.forum-card:hover {
  background: rgba(55, 69, 116, 0.712);
  border-color: rgba(255, 255, 255, 0.4);
  transform: translateY(-2px);
}

.forum-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.4rem;
}
.forum-card-header h3 {
  margin: 0;
  font-size: 1rem;
  color: white;
  flex: 1;
}

.forum-tags {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.tag-badge {
  padding: 0.15rem 0.45rem;
  border-radius: 0.4rem;
  font-size: 0.68rem;
  background: rgba(100, 150, 255, 0.2);
  border: 1px solid rgba(100, 150, 255, 0.3);
  color: rgba(180, 210, 255, 0.95);
  white-space: nowrap;
}

.forum-card-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.3rem;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.7);
}

.forum-author {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.small-avatar {
  width: 20px;
  height: 20px;
  font-size: 0.6rem;
}

.admin-badge {
  font-size: 0.6rem;
  text-transform: uppercase;
  padding: 0.1rem 0.3rem;
  border-radius: 0.2rem;
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.4);
  color: rgba(255, 224, 130, 1);
  letter-spacing: 0.03em;
}

.author-link {
  background: none;
  border: none;
  color: rgba(180, 200, 255, 0.9);
  cursor: pointer;
  font-family: inherit;
  font-size: 0.78rem;
  padding: 0;
  text-decoration: underline transparent;
  transition: text-decoration 0.2s;
}
.author-link:hover {
  text-decoration: underline;
  color: rgba(200, 220, 255, 1);
}

.forum-date {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.55);
}

.forum-preview {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.55);
}

.forum-card-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.4rem;
}

.reply-count {
  font-size: 0.72rem;
  color: rgba(255, 255, 255, 0.5);
}

.no-posts {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 12rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.forum-detail-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, rgba(54, 54, 54, 0.267), rgb(0, 0, 0));
  backdrop-filter: blur(9px);
  -webkit-backdrop-filter: blur(9px);
  overflow: hidden;
}

.detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem 1.5rem;
}

.detail-scroll::-webkit-scrollbar {
  width: 8px;
}
.detail-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
}
.detail-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.28);
  border-radius: 10px;
  border: 2px solid rgba(0, 0, 0, 0.15);
}
.detail-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.42);
}

.detail-title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.detail-content h1 {
  margin: 0;
  font-size: 1.65rem;
  font-family: inherit;
  color: white;
  flex: 1;
  min-width: 200px;
}

.detail-content h2 {
  margin: 0;
  font-size: 1.4rem;
  font-family: inherit;
  color: white;
  flex: 1;
  min-width: 200px;
}

.back-btn {
  font-size: 0.75rem;
  padding: 0.6em 0.8rem;
  border-radius: 0.3rem;
  background-color: rgba(83, 15, 15, 0.795);
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.post-tags {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.post-content {
  display: flex;
  justify-content:left;
  text-align: left;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.6rem;
  padding: 1rem;
  margin-bottom: 1rem;
  line-height: 1.6;
}
.post-content p {
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.9rem;
  white-space: pre-wrap;
     display: flex;
  justify-content:left;
}

.replies-section {
  margin-top: 0.5rem;
}
.replies-section h3 {
  margin: 0 0 0.75rem;
  font-size: 1.1rem;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  padding-bottom: 0.5rem;
}

.no-replies {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

.replies-list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-bottom: 1rem;
}

.reply-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.6rem;
  padding: 0.75rem;
  text-align: left;
}

.reply-header {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.4rem;
  flex-wrap: wrap;
}

.btn-delete-reply {
  background: none;
  border: none;
  color: rgba(255, 100, 100, 0.6);
  cursor: pointer;
  font-size: 0.8rem;
  padding: 0.1rem 0.3rem;
  margin-left: auto;
  transition: color 0.2s;
}
.btn-delete-reply:hover {
  color: rgba(255, 100, 100, 1);
}

.reply-content {
  margin: 0;
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
}

.reply-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.login-prompt {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
  margin-top: 1rem;
}

.create-form-container {
  max-width: 700px;
  margin: 0 auto;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}
.form-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.88);
}

.form-input {
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}
.form-input:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.18);
}
.form-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-textarea {
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  transition: all 0.2s ease;
}
.form-textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(255, 255, 255, 0.18);
}
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
}

.submit-btn {
  background: linear-gradient(135deg, rgb(59, 20, 90), rgba(46, 76, 94, 0.726));
  font-weight: 600;
}

.form-error {
  color: #ff6b6b;
  font-size: 0.82rem;
  text-align: center;
}

.detail-slide-enter-active,
.detail-slide-leave-active {
  transition: transform 0.28s ease, opacity 0.28s ease;
}
.detail-slide-enter-from,
.detail-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}

@media (max-width: 900px) {
  .forum-container {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 3.5rem;
  }
  .forum-controls {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    align-items: center;
  }
}
</style>
