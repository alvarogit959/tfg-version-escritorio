require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

//CREAR SERVIDOR
const server = http.createServer(app);

// Configurar Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
//CONEXION MONGO
//CREAR .env PARA PROTEGER LOS CREDENCIALES DE MONGODB========================================
mongoose.connect(
  "mongodb+srv://alvarod_db_user:olcRRV7HkAyGSgPY@mapcluster.nupzwwf.mongodb.net/MapDatabase?retryWrites=true&w=majority&appName=MapCluster"
)
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error de conexión:", err));


// Esquema para cada ubicación
const locationSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      required: true,
    },
    latitude: {
      type: String,
      required: true,
    },
    longitude: {
      type: String,
      required: true,
    },
  },
  { _id: false } // evita que Mongo cree un _id para cada ubicación
);

// Esquema principal del evento
const eventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true, // el id original del evento será único
  },
  title: {
    type: String,
    required: true,
  },
  start: {
    type: Date,
    required: true,
  },
  end: {
    type: Date,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    default: "carmeet",
  },
  icon: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: "",
  },
  attendees: {
    type: [String], // array de IDs, nombres o emails de asistentes
    default: [],
  },
  location: {
    type: [locationSchema],
    default: [],
  },
  moderators: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

// Modelo para la colección "events"
const Event = mongoose.model("Event", eventSchema);

// Esquema para usuarios
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  profileImage: {
    type: String,
    default: "",
  },
  bio: {
    type: String,
    default: "",
  },
  location: {
    city: {
      type: String,
      default: "",
    },
    country: {
      type: String,
      default: "",
    },
  },
  role: {
    type: String,
    default: "user",
  },
  managedEvents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Event",
    default: [],
  },
  joinedEvents: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "Event",
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: Boolean,
    default: false,
  },
});

// Modelo para la colección "users"
const User = mongoose.model("User", userSchema);

// Esquema para conversaciones
const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group"],
    default: "group",
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  lastMessage: {
    text: {
      type: String,
      default: "",
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Modelo para la colección "conversations"
const Conversation = mongoose.model("Conversation", conversationSchema);

// Esquema para mensajes
const messageSchema = new mongoose.Schema({
  conversationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Conversation",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ["text", "image", "file"],
    default: "text",
  },
  readBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  sentAt: {
    type: Date,
    default: Date.now,
  },
  edited: {
    type: Boolean,
    default: false,
  },
  deleted: {
    type: Boolean,
    default: false,
  },
});

// Modelo para la colección "messages"
const Message = mongoose.model("Message", messageSchema);



// Crear nuevo usuario
app.post("/users", async (req, res) => {
  try {
    const { username, email, password, location } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario o correo ya existe" });
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
    const newUser = new User({
      username,
      email,
      passwordHash,
      location: {
        city: location?.city || "",
        country: location?.country || "",
      },
      role: "user",
      managedEvents: [],
      joinedEvents: [],
      createdAt: new Date(),
      status: false,
    });

    // Guardar el usuario en la base de datos
    await newUser.save();

    res.status(201).json({
      message: "Usuario creado exitosamente",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando usuario" });
  }
});

// Login de usuario
app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar que los campos requeridos estén presentes
    if (!username || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Buscar el usuario por username o email
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    
    if (!user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Comparar contraseña
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    // Establecer usuario como logueado
    user.status = true;
    await user.save();

    // Retornar datos del usuario
    res.status(200).json({
      message: "Login exitoso",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        location: user.location,
        profileImage: user.profileImage,
        bio: user.bio,
        status: user.status
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  location: user.location,
  profileImage: user.profileImage,
  bio: user.bio,
  status: user.status,
  joinedEvents: user.joinedEvents,
  managedEvents: user.managedEvents,
  createdAt: user.createdAt,
});

const findEventByIdentifier = async (identifier) => {
  if (mongoose.Types.ObjectId.isValid(identifier)) {
    const byId = await Event.findById(identifier);
    if (byId) return byId;
  }
  const numId = Number(identifier);
  if (!Number.isNaN(numId)) {
    return Event.findOne({ id: numId });
  }
  return null;
};

const addUserToEvent = async (user, event) => {
  const userIdStr = user._id.toString();
  if (!event.attendees.includes(userIdStr)) {
    event.attendees.push(userIdStr);
    await event.save();
  }
  const alreadyJoined = user.joinedEvents.some((id) =>
    id.equals(event._id)
  );
  if (!alreadyJoined) {
    user.joinedEvents.push(event._id);
    await user.save();
  }
};

const removeUserFromEvent = async (user, event) => {
  const userIdStr = user._id.toString();
  event.attendees = event.attendees.filter(
    (attendee) =>
      attendee !== user.username &&
      attendee !== user.email &&
      attendee !== userIdStr
  );
  await event.save();
  user.joinedEvents = user.joinedEvents.filter(
    (id) => !id.equals(event._id)
  );
  await user.save();
};

const isEventModerator = (event, userId) => {
  if (!event?.moderators?.length || !userId) return false;
  const uid = userId.toString();
  return event.moderators.some((m) => {
    const mid = m?._id ? m._id.toString() : m.toString();
    return mid === uid;
  });
};

const removeAttendeeFromEvent = async (event, attendeeRef) => {
  event.attendees = event.attendees.filter((a) => a !== attendeeRef);
  await event.save();

  if (mongoose.Types.ObjectId.isValid(attendeeRef)) {
    const attendeeUser = await User.findById(attendeeRef);
    if (attendeeUser) {
      attendeeUser.joinedEvents = attendeeUser.joinedEvents.filter(
        (id) => !id.equals(event._id)
      );
      await attendeeUser.save();
    }
  }
};

// Obtener perfil de usuario
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-passwordHash")
      .populate("joinedEvents")
      .populate("managedEvents");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const moderatedEvents = await Event.find({ moderators: user._id });

    res.status(200).json({
      ...formatUserResponse(user),
      moderatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo usuario" });
  }
});

// Actualizar perfil de usuario
app.patch("/users/:userId", async (req, res) => {
  try {
    const { username, profileImage, bio } = req.body;
    const { userId } = req.params;

    if (username) {
      const existing = await User.findOne({
        username,
        _id: { $ne: userId },
      });
      if (existing) {
        return res.status(400).json({ error: "El nombre de usuario ya existe" });
      }
    }

    const update = {};
    if (username !== undefined) update.username = username;
    if (profileImage !== undefined) update.profileImage = profileImage;
    if (bio !== undefined) update.bio = bio;

    const user = await User.findByIdAndUpdate(userId, update, { new: true })
      .select("-passwordHash")
      .populate("joinedEvents");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json(formatUserResponse(user));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando usuario" });
  }
});

// Apuntarse a un evento
app.post("/users/:userId/joined-events/:eventId", async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const event = await findEventByIdentifier(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    await addUserToEvent(user, event);

    const updatedUser = await User.findById(userId)
      .select("-passwordHash")
      .populate("joinedEvents");

    const updatedEvent = await Event.findById(event._id);

    res.status(200).json({
      message: "Te has apuntado al evento",
      user: formatUserResponse(updatedUser),
      event: updatedEvent,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al apuntarse al evento" });
  }
});

// Salir de un evento apuntado
app.delete("/users/:userId/joined-events/:eventId", async (req, res) => {
  try {
    const { userId, eventId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const event = await findEventByIdentifier(eventId);
    if (event) {
      await removeUserFromEvent(user, event);
    } else {
      user.joinedEvents = user.joinedEvents.filter(
        (id) => id.toString() !== eventId
      );
      await user.save();
    }

    const updatedUser = await User.findById(userId)
      .select("-passwordHash")
      .populate("joinedEvents");

    res.status(200).json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al salir del evento" });
  }
});

// Logout de usuario
app.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }

    // Buscar el usuario y establecer status en false
    const user = await User.findByIdAndUpdate(
      userId,
      { status: false },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    res.status(200).json({
      message: "Logout exitoso"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Obtener o crear conversación grupal
app.get("/conversations/group", async (req, res) => {
  try {
    // Buscar si ya existe una conversación grupal
    let groupConversation = await Conversation.findOne({ type: "group" });

    // Si no existe, crear una nueva
    if (!groupConversation) {
      groupConversation = new Conversation({
        type: "group",
        participants: [],
        lastMessage: {},
      });
      await groupConversation.save();
    }

    res.status(200).json(groupConversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo conversación" });
  }
});

// Obtener mensajes de una conversación
app.get("/conversations/:conversationId/messages", async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({ conversationId })
      .populate("senderId", "username profileImage")
      .sort({ sentAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo mensajes" });
  }
});

// Enviar un nuevo mensaje
app.post("/messages", async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    // Crear el mensaje
    const newMessage = new Message({
      conversationId,
      senderId,
      text,
      type: "text",
      readBy: [senderId],
      sentAt: new Date()
    });

    await newMessage.save();

    // Actualizar último mensaje de la conversación
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text,
        sender: senderId,
        sentAt: new Date()
      }
    });

    // Poblar los datos del usuario en el mensaje
    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "username profileImage"
    );

    // Emitir a todos los clientes conectados
    io.to("group-chat").emit("new-message", populatedMessage);

    // Responder al cliente
    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// Marcar mensaje como leído
app.put("/messages/:messageId/read", async (req, res) => {
  try {
    const { messageId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }

    const message = await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: "Mensaje no encontrado" });
    }

    res.status(200).json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error marcando mensaje como leído" });
  }
});

// Agregar usuario a la conversación grupal
app.post("/conversations/:conversationId/add-participant", async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { $addToSet: { participants: userId } },
      { new: true }
    ).populate("participants", "username profileImage");

    if (!conversation) {
      return res.status(404).json({ error: "Conversación no encontrada" });
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error agregando participante" });
  }
});

//Todos los eventos
app.get("/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo eventos" });
  }
});

const buildEventUrl = (type, title) => {
  const slug = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const prefixes = {
    coches: "/calendario/concentraciones-de-coches/",
    motos: "/calendario/concentraciones-de-motos/",
    competicion: "/calendario/competicion/",
    feria: "/calendario/ferias/",
  };

  return `${prefixes[type] || "/calendario/eventos/"}${slug}`;
};

// Crear nuevo evento
app.post("/events", async (req, res) => {
  try {
    const {
      title,
      start,
      end,
      type,
      description,
      url,
      location,
      creatorId,
    } = req.body;

    if (!title || !start || !end || !type) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    if (!location || !Array.isArray(location) || location.length === 0) {
      return res.status(400).json({
        error: "Debes seleccionar una ubicación en el mapa",
      });
    }

    const loc = location[0];
    if (!loc.latitude || !loc.longitude) {
      return res.status(400).json({ error: "Ubicación incompleta" });
    }

    const lastEvent = await Event.findOne().sort({ id: -1 }).select("id");
    const nextId = lastEvent ? lastEvent.id + 1 : 1;

    const eventUrl = url || buildEventUrl(type, title);
    const moderators = creatorId ? [creatorId] : [];

    const newEvent = new Event({
      id: nextId,
      title: title.trim(),
      start: new Date(start),
      end: new Date(end),
      url: eventUrl,
      type,
      icon: null,
      description: (description || title).trim(),
      attendees: [],
      location,
      moderators,
    });

    await newEvent.save();

    if (creatorId) {
      await User.findByIdAndUpdate(creatorId, {
        $addToSet: { managedEvents: newEvent._id },
      });
    }

    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Ya existe un evento con ese id" });
    }
    res.status(500).json({ error: "Error creando evento" });
  }
});

// Actualizar evento (solo moderadores)
app.patch("/events/:eventId", async (req, res) => {
  try {
    const { moderatorId, title, description, type, start, end, location } =
      req.body;

    if (!moderatorId) {
      return res.status(400).json({ error: "moderatorId es obligatorio" });
    }

    const event = await findEventByIdentifier(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (!isEventModerator(event, moderatorId)) {
      return res.status(403).json({ error: "No tienes permiso para editar este evento" });
    }

    if (title !== undefined) event.title = title.trim();
    if (description !== undefined) event.description = description.trim();
    if (type !== undefined) event.type = type;
    if (start !== undefined) event.start = new Date(start);
    if (end !== undefined) event.end = new Date(end);
    if (location !== undefined && Array.isArray(location) && location.length > 0) {
      event.location = location;
    }

    if (title && type) {
      event.url = buildEventUrl(event.type, event.title);
    }

    await event.save();
    res.status(200).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error actualizando evento" });
  }
});

// Eliminar asistente de un evento (solo moderadores)
app.delete("/events/:eventId/attendees/:attendeeId", async (req, res) => {
  try {
    const moderatorId = req.query.moderatorId || req.body?.moderatorId;

    if (!moderatorId) {
      return res.status(400).json({ error: "moderatorId es obligatorio" });
    }

    const event = await findEventByIdentifier(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (!isEventModerator(event, moderatorId)) {
      return res.status(403).json({
        error: "No tienes permiso para gestionar asistentes",
      });
    }

    const attendeeRef = decodeURIComponent(req.params.attendeeId);
    if (!event.attendees.includes(attendeeRef)) {
      return res.status(404).json({ error: "Asistente no encontrado en el evento" });
    }

    await removeAttendeeFromEvent(event, attendeeRef);

    const updatedEvent = await Event.findById(event._id);
    res.status(200).json(updatedEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando asistente" });
  }
});

// Resolver nombres de asistentes
app.get("/events/:eventId/attendees", async (req, res) => {
  try {
    const event = await findEventByIdentifier(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const resolved = await Promise.all(
      event.attendees.map(async (attendeeRef) => {
        if (mongoose.Types.ObjectId.isValid(attendeeRef)) {
          const u = await User.findById(attendeeRef).select("username email");
          if (u) {
            return {
              id: attendeeRef,
              username: u.username,
              email: u.email,
            };
          }
        }
        return { id: attendeeRef, username: attendeeRef, email: null };
      })
    );

    res.status(200).json(resolved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo asistentes" });
  }
});







// ===== SOCKET.IO EVENT LISTENERS =====
io.on("connection", (socket) => {
  console.log("Nuevo usuario conectado:", socket.id);

  // Evento: unirse a la sala grupal
  socket.on("join-group-chat", (userId) => {
    socket.join("group-chat");
    console.log(`${userId} se unió al chat grupal`);
  });
  
  // Evento: nuevo mensaje
  socket.on("send-message", async (messageData) => {
    try {
      // Emitir a todos en la sala
      io.to("group-chat").emit("new-message", messageData);
    } catch (error) {
      console.error("Error emitiendo mensaje:", error);
    }
  });
  

  // Evento: desconexión
  socket.on("disconnect", () => {
    console.log("Usuario desconectado:", socket.id);
  });
});

//INICAR SERVIDOR ==================== IP ADECUADA??
const PORT = 5000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
  console.log(`Servidor WebSocket corriendo en ws://localhost:${PORT}`);
});

//ERROES
process.on("unhandledRejection", (err) => {
  console.error("Error no manejado:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Excepción no capturada:", err);
});