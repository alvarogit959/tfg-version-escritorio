<template>
  <div class="admin-panel">
    <h1>Panel de administración</h1>

    <div class="tabs">
      <button
        type="button"
        :class="{ active: tab === 'events' }"
        @click="tab = 'events'"
      >
        Eventos
      </button>
      <button
        type="button"
        :class="{ active: tab === 'users' }"
        @click="tab = 'users'"
      >
        Usuarios
      </button>
    </div>

    <!--FILTERS EVENTS-->
    <div v-if="tab === 'events'" class="filters-section">
      <div class="filters-row">
        <input
          v-model="eventSearchText"
          type="text"
          placeholder="Buscar por nombre"
          class="search-input"
        />

        <div class="filter-group">
          <select v-model="selectedEventType" class="filter-select">
            <option value="">Todos</option>
            <option value="coches">Coches</option>
            <option value="motos">Motos</option>
            <option value="competicion">Competición</option>
            <option value="feria">Feria</option>
            <option value="carmeet">Car meet</option>
          </select>
        </div>

        <div class="date-range">
          <div class="date-picker-field">
            <button
              type="button"
              class="date-picker-btn"
              @click="openDatePicker('dateFromInput')"
            >
              <span>Desde</span>
              <strong v-if="dateFrom">{{ formatDateFilter(dateFrom) }}</strong>
            </button>
            <input
              ref="dateFromInput"
              v-model="dateFrom"
              class="date-picker-native"
              type="date"
            />
          </div>
          <span class="date-filter-arrow">→</span>
          <div class="date-picker-field">
            <button
              type="button"
              class="date-picker-btn"
              @click="openDatePicker('dateToInput')"
            >
              <span>Hasta</span>
              <strong v-if="dateTo">{{ formatDateFilter(dateTo) }}</strong>
            </button>
            <input
              ref="dateToInput"
              v-model="dateTo"
              class="date-picker-native"
              type="date"
            />
          </div>
          <button
            type="button"
            class="date-clear-btn"
            :disabled="!dateFrom && !dateTo"
            @click="clearDateFilters"
          >
            Limpiar
          </button>
        </div>

        <div class="sort-control">
          <span>Ordenar por:</span>
          <button
            type="button"
            class="sort-btn"
            :class="{ active: sortMode === 'date' }"
            @click="setSortMode('date')"
          >
            Fecha
          </button>
          <button
            type="button"
            class="sort-btn"
            :class="{ active: sortMode === 'name' }"
            @click="setSortMode('name')"
          >
            Nombre
          </button>
          <button
            v-if="sortMode"
            type="button"
            class="sort-dir-btn"
            @click="toggleSortDirection"
          >
            {{ sortDirection === "asc" ? "↑" : "↓" }}
          </button>
        </div>

        <button
          v-if="hasActiveFilters"
          type="button"
          class="clear-filters-btn"
          @click="clearAllFilters"
        >
          Limpiar todos los filtros
        </button>
      </div>
    </div>

    <!--FILTERS USERS-->
    <div v-if="tab === 'users'" class="filters-section">
      <div class="filters-row">
        <input
          v-model="userSearchText"
          type="text"
          placeholder="Buscar por nombre de usuario o email..."
          class="search-input"
        />

        <div class="filter-group">
          <select v-model="selectedRole" class="filter-select">
            <option value="">Todos</option>
            <option value="admin">Admin</option>
            <option value="user">Usuario</option>
          </select>
        </div>
        <button
          v-if="userSearchText || selectedRole"
          type="button"
          class="clear-filters-btn"
          @click="clearUserFilters"
        >
          Limpiar filtros
        </button>
      </div>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>

    <!-- EVENTS -->
    <section v-else-if="tab === 'events'" class="section">
      <p v-if="filteredEvents.length === 0" class="empty">
        No hay eventos que coincidan con los filtros
      </p>
      <ul v-else class="events-list">
        <li
          v-for="event in filteredEvents"
          :key="eventKey(event)"
          class="event-card"
        >
          <div class="card-header">
            <h3 @click="selectEvent(event)" class="event-title-clickable">
              {{ event.title || "Evento" }}
            </h3>
            <span v-if="event.type" class="type-badge">{{ event.type }}</span>
          </div>
          <p v-if="event.start" class="meta">{{ formatDate(event.start) }}</p>
          <p v-if="event.location?.length" class="meta">
            {{ event.location[0].location }}
          </p>

          <div class="card-actions">
            <button type="button" class="edit-btn" @click="toggleEdit(event)">
              {{ editingId === eventKey(event) ? "Cerrar" : "Editar" }}
            </button>
            <button
              type="button"
              class="delete-btn"
              :disabled="deletingEventId === eventKey(event)"
              @click="deleteEvent(event)"
            >
              {{
                deletingEventId === eventKey(event) ? "..." : "Eliminar evento"
              }}
            </button>
          </div>

          <form
            v-if="editingId === eventKey(event)"
            class="edit-form"
            @submit.prevent="saveEvent(event)"
          >
            <div class="form-group">
              <label>Título</label>
              <input v-model="editForm.title" type="text" required />
            </div>
            <div class="form-group">
              <label>Tipo</label>
              <select v-model="editForm.type">
                <option value="coches">Coches</option>
                <option value="motos">Motos</option>
                <option value="competicion">Competición</option>
                <option value="feria">Feria</option>
                <option value="carmeet">Car meet</option>
              </select>
            </div>
            <div class="form-group">
              <label>Descripción</label>
              <textarea v-model="editForm.description" rows="2" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Inicio</label>
                <input
                  v-model="editForm.start"
                  type="datetime-local"
                  required
                />
              </div>
              <div class="form-group">
                <label>Fin</label>
                <input v-model="editForm.end" type="datetime-local" required />
              </div>
            </div>
            <button type="submit" class="save-btn" :disabled="saving">
              {{ saving ? "Guardando..." : "Guardar" }}
            </button>
          </form>

          <div class="attendees-block">
            <h4>Asistentes ({{ attendeesFor(event).length }})</h4>
            <ul v-if="attendeesFor(event).length" class="attendees-list">
              <li
                v-for="att in attendeesFor(event)"
                :key="att.id"
                class="attendee-row"
              >
                <button
                  type="button"
                  class="profile-link"
                  @click="$emit('view-user', att.id)"
                >
                  {{ att.username }}
                </button>
                <button
                  type="button"
                  class="remove-btn"
                  :disabled="removingAttendee === removeKey(event, att)"
                  @click="removeAttendee(event, att)"
                >
                  Quitar del evento
                </button>
              </li>
            </ul>
            <p v-else class="no-attendees">Sin asistentes</p>
          </div>
        </li>
      </ul>
    </section>

    <!-- USERS -->
    <section v-else class="section">
      <p class="hint">Eliminar un usuario es permanente!</p>

      <ul class="users-list">
        <li v-for="u in filteredUsers" :key="u.id" class="user-row">
          <div class="user-info">
            <strong>{{ u.username }}</strong>
            <span class="user-email">{{ u.email }}</span>
            <span class="role-tag" :class="{ admin: u.role === 'admin' }">{{
              u.role
            }}</span>
          </div>
          <div class="user-actions">
            <button
              type="button"
              class="view-btn"
              @click="$emit('view-user', u.id)"
            >
              Ver perfil
            </button>
            <button
              v-if="u.id !== adminId"
              type="button"
              class="delete-btn"
              :disabled="deletingUserId === u.id"
              @click="deleteUser(u)"
            >
              {{ deletingUserId === u.id ? "..." : "Eliminar usuario" }}
            </button>
            <span v-else class="self-tag">Tu cuenta</span>
          </div>
        </li>
      </ul>
      <p v-if="filteredUsers.length === 0" class="empty">
        No hay usuarios que coincidan
      </p>
    </section>
  </div>
</template>

<script>
import {
  apiJson,
  eventIdentifier,
  isUpcomingEvent,
  toDatetimeLocal,
  upcomingEvents,
} from "../utils/api.js";

export default {
  name: "admin-panel",
  props: {
    adminId: {
      type: String,
      required: true,
    },
  },
  emits: ["view-user", "events-changed", "select-event"],
  data() {
    return {
      tab: "events",
      events: [],
      users: [],
      attendeesByEvent: {},
      loading: true,
      editingId: null,
      editForm: {
        title: "",
        type: "coches",
        description: "",
        start: "",
        end: "",
      },
      saving: false,
      deletingEventId: null,
      deletingUserId: null,
      removingAttendee: null,
      notification: "",
      notificationClass: "",


      eventSearchText: "",
      selectedEventType: "",
      dateFrom: "",
      dateTo: "",
      sortMode: "date", 
      sortDirection: "asc", 


      userSearchText: "",
      selectedRole: "",
    };
  },
  computed: {
    hasActiveFilters() {
      return (
        this.eventSearchText ||
        this.selectedEventType ||
        this.dateFrom ||
        this.dateTo
      );
    },

    filteredEvents() {
      let result = [...this.events];

//TEST FILTER BY NAME
      if (this.eventSearchText) {
        const searchLower = this.eventSearchText.toLowerCase();
        result = result.filter((event) =>
          event.title?.toLowerCase().includes(searchLower),
        );
      }

      if (this.selectedEventType) {
        result = result.filter(
          (event) =>
            this.normalizeEventType(event.type) === this.selectedEventType,
        );
      }

      if (this.dateFrom) {
        const fromDate = new Date(this.dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        result = result.filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate >= fromDate;
        });
      }

      if (this.dateTo) {
        const toDate = new Date(this.dateTo);
        toDate.setHours(23, 59, 59, 999);
        result = result.filter((event) => {
          const eventDate = new Date(event.start);
          return eventDate <= toDate;
        });
      }

      result.sort((a, b) => {
        let comparison = 0;
        if (this.sortMode === "date") {
          comparison = new Date(a.start) - new Date(b.start);
        } else if (this.sortMode === "name") {
          comparison = (a.title || "").localeCompare(b.title || "");
        }
        return this.sortDirection === "asc" ? comparison : -comparison;
      });

      return result;
    },

    filteredUsers() {
      let result = [...this.users];

      if (this.userSearchText) {
        const searchLower = this.userSearchText.toLowerCase();
        result = result.filter(
          (user) =>
            user.username?.toLowerCase().includes(searchLower) ||
            user.email?.toLowerCase().includes(searchLower),
        );
      }

      if (this.selectedRole) {
        result = result.filter((user) => user.role === this.selectedRole);
      }

      return result;
    },
  },
  watch: {
    adminId: {
      immediate: true,
      handler() {
        this.loadAll();
      },
    },
    tab() {
      if (this.tab === "users" && !this.users.length) {
        this.loadUsers();
      }
    },
  },
  methods: {
    normalizeEventType(type) {
      if (!type) return "";
      const normalized = String(type).toLowerCase();
      if (normalized === "ferias") return "feria";
      if (normalized === "rally") return "competicion";
      if (normalized === "competición") return "competicion";
      if (normalized === "carmeet") return "coches";
      return normalized;
    },

    openDatePicker(refName) {
      this.$refs[refName]?.click();
    },

    formatDateFilter(date) {
      if (!date) return "";
      const d = new Date(date);
      return d.toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    },

    clearDateFilters() {
      this.dateFrom = "";
      this.dateTo = "";
    },

    setSortMode(mode) {
      if (this.sortMode === mode) {
        this.toggleSortDirection();
      } else {
        this.sortMode = mode;
        this.sortDirection = "asc";
      }
    },

    toggleSortDirection() {
      this.sortDirection = this.sortDirection === "asc" ? "desc" : "asc";
    },

    clearAllFilters() {
      this.eventSearchText = "";
      this.selectedEventType = "";
      this.dateFrom = "";
      this.dateTo = "";
      this.sortMode = "date";
      this.sortDirection = "asc";
    },

    clearUserFilters() {
      this.userSearchText = "";
      this.selectedRole = "";
    },

    eventKey(event) {
      return eventIdentifier(event) || String(event);
    },

    attendeesFor(event) {
      return this.attendeesByEvent[this.eventKey(event)] || [];
    },

    removeKey(event, att) {
      return `${this.eventKey(event)}-${att.id}`;
    },

    async loadAll() {
      this.loading = true;
      try {
        await Promise.all([this.loadEvents(), this.loadUsers()]);
      } finally {
        this.loading = false;
      }
    },

    async loadEvents() {
      try {
        this.events = upcomingEvents(await apiJson("/events"));
        await Promise.all(this.events.map((ev) => this.loadAttendees(ev)));
      } catch (error) {
        this.showNotification(error.message, "error");
        this.events = [];
      }
    },

    async loadUsers() {
      try {
        this.users = await apiJson(`/users?adminId=${this.adminId}`);
      } catch (error) {
        this.showNotification(error.message, "error");
        this.users = [];
      }
    },

    async loadAttendees(event) {
      const id = this.eventKey(event);
      try {
        const list = await apiJson(`/events/${id}/attendees`);
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: list };
      } catch {
        this.attendeesByEvent = { ...this.attendeesByEvent, [id]: [] };
      }
    },

    toggleEdit(event) {
      const id = this.eventKey(event);
      if (this.editingId === id) {
        this.editingId = null;
        return;
      }
      this.editingId = id;
      this.editForm = {
        title: event.title || "",
        type: event.type || "coches",
        description: (event.description || "")
          .replace(/<[^>]*>/g, "")
          .slice(0, 2000),
        start: toDatetimeLocal(event.start),
        end: toDatetimeLocal(event.end),
      };
      if (!this.attendeesFor(event).length) {
        this.loadAttendees(event);
      }
    },

    buildLocationPayload(event) {
      const prev = event.location?.[0] || {};
      return [
        {
          location: prev.location || "",
          latitude: prev.latitude || "0",
          longitude: prev.longitude || "0",
        },
      ];
    },

    async saveEvent(event) {
      const eventId = this.eventKey(event);
      this.saving = true;
      try {
        const updated = await apiJson(`/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            moderatorId: this.adminId,
            title: this.editForm.title.trim(),
            type: this.editForm.type,
            description: this.editForm.description.trim(),
            start: new Date(this.editForm.start).toISOString(),
            end: new Date(this.editForm.end).toISOString(),
            location: this.buildLocationPayload(event),
          }),
        });
        if (isUpcomingEvent(updated)) {
          this.events = this.events.map((e) =>
            this.eventKey(e) === eventId ? updated : e,
          );
        } else {
          this.events = this.events.filter((e) => this.eventKey(e) !== eventId);
        }
        this.editingId = null;
        this.showNotification("Evento actualizado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.saving = false;
      }
    },

    async deleteEvent(event) {
      const eventId = this.eventKey(event);
      if (!confirm(`¿Eliminar permanentemente "${event.title}"?`)) return;

      this.deletingEventId = eventId;
      try {
        await apiJson(`/events/${eventId}?moderatorId=${this.adminId}`, {
          method: "DELETE",
        });
        this.events = this.events.filter((e) => this.eventKey(e) !== eventId);
        this.showNotification("Evento eliminado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.deletingEventId = null;
      }
    },

    async removeAttendee(event, attendee) {
      if (!confirm(`¿Quitar a "${attendee.username}" del evento?`)) return;

      const eventId = this.eventKey(event);
      this.removingAttendee = this.removeKey(event, attendee);
      try {
        await apiJson(
          `/events/${eventId}/attendees/${encodeURIComponent(
            attendee.id,
          )}?moderatorId=${this.adminId}`,
          { method: "DELETE" },
        );
        await this.loadAttendees(event);
        this.showNotification("Asistente eliminado del evento", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.removingAttendee = null;
      }
    },

    async deleteUser(user) {
      if (
        !confirm(
          `¿Eliminar PERMANENTEMENTE al usuario "${user.username}"? Esta acción no se puede deshacer.`,
        )
      ) {
        return;
      }

      this.deletingUserId = user.id;
      try {
        await apiJson(`/users/${user.id}?adminId=${this.adminId}`, {
          method: "DELETE",
        });
        this.users = this.users.filter((u) => u.id !== user.id);
        await this.loadEvents();
        this.showNotification("Usuario eliminado", "success");
        this.$emit("events-changed");
      } catch (error) {
        this.showNotification(error.message, "error");
      } finally {
        this.deletingUserId = null;
      }
    },

    formatDate(date) {
      if (!date) return "—";
      return new Date(date).toLocaleDateString("es-ES", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },

    showNotification(message, type) {
      this.notification = message;
      this.notificationClass = type;
      setTimeout(() => {
        this.notification = "";
        this.notificationClass = "";
      }, 3500);
    },

    selectEvent(event) {
      this.$emit("select-event", event);
    },
  },
};
</script>

<style scoped>
.admin-panel {
  width: 100%;
  height: calc(100vh - 2rem - 60px);
  max-height: calc(100vh - 2rem - 60px);
  overflow-y: auto;
  padding: 1.5rem 2rem;
  color: white;
  background: linear-gradient(
    135deg,
    rgba(80, 40, 120, 0.25),
    rgba(0, 0, 0, 0.75)
  );

  border-radius: 1rem;
  box-sizing: border-box;
  -webkit-app-region: no-drag;
}

h1 {
  margin: 0 0 0.25rem 0;
  font-size: 1.7rem;
  color: white;
}

.subtitle {
  margin: 0 0 1rem 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
}

.tabs button {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 0.5rem 1.25rem;
  border-radius: 0.6rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.9rem;
  transition: all 0.25s ease;
}

.tabs button:hover {
  background: rgba(255, 255, 255, 0.18);
  transform: translateY(-1px);
}

.tabs button.active {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
}
.filters-section {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  padding: 1rem;
  margin-bottom: 1.25rem;
  backdrop-filter: blur(8px);
}

.search-input {
  width: 8rem;
  padding: 0.6rem 0.8rem;
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
.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  justify-content: center;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.filter-group label {
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
}
.filter-select {
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
}
.filter-select:hover {
  background: rgba(255, 255, 255, 0.18);
}
.filter-select:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
}
.filter-select option {
  background: #2a2a2a;
  color: white;
}
.date-range {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.25rem 0.45rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.date-picker-field {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.date-picker-field span {
  color: white;
  font-family: "Inter", sans-serif;
  font-size: 0.82rem;
  white-space: nowrap;
}

.date-picker-btn {
  min-height: 2.15rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.05rem;
  padding: 0.28rem 0.6rem;
  border-radius: 0.5rem;
  font-size: 0.78rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgb(255, 255, 255);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.2s ease;
  pointer-events: none;
}

.date-picker-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.date-picker-btn span {
  font-size: 0.7rem;
  line-height: 1;
  opacity: 0.8;
}

.date-picker-btn strong {
  font-size: 0.65rem;
  line-height: 1;
  font-weight: 600;
  color: #55c7ff;
}

.date-picker-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  z-index: 1;
}
.date-picker-native::-webkit-calendar-picker-indicator {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
  opacity: 0;
}
.date-filter-arrow {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.date-clear-btn,
.clear-filters-btn {
  padding: 0.5rem 0.8rem;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.6rem;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.date-clear-btn:hover:not(:disabled),
.clear-filters-btn:hover {
  background: rgba(255, 255, 255, 0.22);
  transform: translateY(-1px);
}

.date-clear-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  transform: none;
}
.sort-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.25rem 0.75rem;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.8rem;
}

.sort-btn {
  padding: 0.35rem 0.7rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.75rem;
  transition: all 0.2s ease;
}

.sort-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.sort-btn.active {
  background: rgba(255, 255, 255, 0.22);
  border-color: rgba(255, 255, 255, 0.45);
}

.sort-dir-btn {
  padding: 0.35rem 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  font-family: inherit;
  font-size: 1rem;
  transition: all 0.2s ease;
}

.sort-dir-btn:hover {
  background: rgba(255, 255, 255, 0.18);
}

.notification {
  padding: 0.75rem 1rem;
  border-radius: 0.6rem;
  margin-bottom: 1rem;
}

.notification.success {
  background: rgba(76, 175, 80, 0.35);
}

.notification.error {
  background: rgba(244, 67, 54, 0.35);
}

.hint {
  font-size: 0.9rem;
  opacity: 0.75;
  margin: 0 0 1rem;
}

.loading,
.empty {
  opacity: 0.8;
  padding: 1rem;
}

.events-list,
.users-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.event-card {
  padding: 1.2rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(180, 120, 255, 0.3);
  border-radius: 0.9rem;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.card-header h3 {
  margin: 0;
  flex: 1;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 0.4rem;
  text-transform: capitalize;
}

.meta {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  opacity: 0.85;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  margin: 0.75rem 0;
  flex-wrap: wrap;
}

.edit-btn,
.view-btn {
  padding: 0.45rem 0.9rem;
  background: rgba(33, 150, 243, 0.4);
  border: 1px solid rgba(33, 150, 243, 0.6);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.delete-btn {
  padding: 0.45rem 0.9rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.delete-btn:disabled {
  opacity: 0.5;
}

.edit-form {
  margin: 0.75rem 0;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.25);
  border-radius: 0.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 0.5rem;
  color: white;
}

.form-group select option {
  color: #222;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
  overflow-y: auto;
  overflow-x: auto;
}
@media (max-width: 700px) {
  .form-row {
    display: flex;
    flex-direction: column;
  }
}
.save-btn {
  align-self: flex-start;
  padding: 0.5rem 1rem;
  background: rgba(76, 175, 80, 0.45);
  border: 1px solid rgba(76, 175, 80, 0.7);
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
}

.attendees-block {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.15);
}

.attendees-block h4 {
  margin: 0 0 0.5rem;
  font-size: 0.95rem;
}

.attendees-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.attendee-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 0.4rem;
}

.profile-link {
  background: none;
  border: none;
  color: rgba(150, 220, 255, 1);
  cursor: pointer;
  text-decoration: underline;
  padding: 0;
}

.remove-btn {
  margin-left: auto;
  padding: 0.25rem 0.6rem;
  font-size: 0.75rem;
  background: rgba(244, 67, 54, 0.35);
  border: 1px solid rgba(255, 120, 120, 0.5);
  border-radius: 0.4rem;
  color: white;
  cursor: pointer;
}

.user-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.8rem;
  flex-wrap: wrap;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.user-email {
  font-size: 0.85rem;
  opacity: 0.7;
}

.role-tag {
  font-size: 0.75rem;
  align-self: flex-start;
  padding: 0.15rem 0.5rem;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 0.4rem;
  text-transform: capitalize;
}

.role-tag.admin {
  background: rgba(255, 193, 7, 0.35);
}

.user-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.self-tag {
  font-size: 0.85rem;
  opacity: 0.65;
}
.admin-panel::-webkit-scrollbar {
  width: 8px;
}

.admin-panel::-webkit-scrollbar-track {
  background: rgba(99, 102, 241, 0.05);
  border-radius: 10px;
}

.admin-panel::-webkit-scrollbar-thumb {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.6),
    rgba(168, 85, 247, 0.6)
  );
  border-radius: 10px;
  border: 2px solid rgba(99, 102, 241, 0.1);
}

.admin-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(
    180deg,
    rgba(99, 102, 241, 0.8),
    rgba(168, 85, 247, 0.8)
  );
}
.event-title-clickable {
  cursor: pointer;
  transition: color 0.2s ease;
}

.event-title-clickable:hover {
  color: #71a7ee;
  transition: color 1s ease;
  transform: scale(1.1);
}

.event-title-clickable:active {
  transform: scale(0.99);
}

@media (max-width: 700px) {
  .admin-panel {
    max-height: 100vh;
    width: 100%;
    height: 100vh;
    margin: 0;
    padding-bottom: 5rem;
  }
}
</style>
