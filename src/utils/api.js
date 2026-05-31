const API_BASE = "http://localhost:5000";

export async function apiJson(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, options);
  const text = await res.text();

  let data = {};
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(
        "El servidor no devolvió JSON. Comprueba que serverCarmeet.js está en marcha."
      );
    }
  }

  if (!res.ok) {
    throw new Error(data.error || `Error ${res.status}`);
  }

  return data;
}

export function eventIdentifier(event) {
  if (!event) return null;
  if (typeof event === "string") return event;
  return event._id || event.id;
}

export function userIdFrom(user) {
  if (!user) return null;
  return user.id || user._id;
}

export function isUserAttending(event, user) {
  if (!event?.attendees?.length || !user) return false;
  const uid = String(userIdFrom(user));
  return event.attendees.some(
    (a) => a === uid || a === user.username || a === user.email
  );
}

export function isAdminRole(role) {
  return role === "admin";
}

export function isEventModerator(event, userId) {
  if (!event?.moderators?.length || !userId) return false;
  const uid = String(userId);
  return event.moderators.some((m) => {
    const mid = m?._id ? String(m._id) : String(m);
    return mid === uid;
  });
}

export function normalizeEventList(events) {
  if (!events?.length) return [];
  return events
    .map((e) => {
      if (e && typeof e === "object" && (e.title || e._id)) return e;
      return { _id: e, title: "Evento" };
    })
    .filter(isUpcomingEvent);
}

export function isUpcomingEvent(event) {
  if (!event?.end) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventEnd = new Date(event.end);
  if (Number.isNaN(eventEnd.getTime())) return true;

  return eventEnd >= today;
}

export function upcomingEvents(events) {
  if (!events?.length) return [];
  return events.filter(isUpcomingEvent);
}

export function toDatetimeLocal(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
