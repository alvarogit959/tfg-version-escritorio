require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const bcrypt = require("bcrypt");
const { Server } = require("socket.io");

const path = require('path');
const fs = require("fs");
const app = express();
app.use(cors());
app.use(express.json());
//TEST IMAGES SERVER

app.use(
  "/event-images",
  express.static(path.join(__dirname, "event-images"))
);


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


//Esquema ubicación
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
  { _id: false } //No id for ubication 
);

//Esquema evento===============
const eventSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true, 
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
    type: [String],
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

const Event = mongoose.model("Event", eventSchema);

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
  friends: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
});

const User = mongoose.model("User", userSchema);

const friendRequestSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["pending", "accepted", "declined"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
    default: null,
  },
});

friendRequestSchema.index({ from: 1, to: 1 }, { unique: true });

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema);

const conversationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["private", "group", "event"],
    default: "group",
  },
  participants: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: "User",
    default: [],
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    default: null,
  },
  title: {
    type: String,
    default: "",
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

const Conversation = mongoose.model("Conversation", conversationSchema);

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

const Message = mongoose.model("Message", messageSchema);

app.post("/users", async (req, res) => {
  try {
    const { username, email, password, location } = req.body;


    if (!username || !email || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }


    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(400).json({ error: "El usuario o correo ya existe" });
    }


    const passwordHash = await bcrypt.hash(password, 10);


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

app.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    
    if (!user) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    
    if (!passwordMatch) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos" });
    }

    user.status = true;
    await user.save();

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

const formatUserPublic = (user) => ({
  id: user._id,
  username: user.username,
  profileImage: user.profileImage || "",
  bio: user.bio || "",
  role: user.role,
});

const todayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const isUpcomingEvent = (event) => {
  if (!event || !event.end) return true;
  return new Date(event.end) >= todayStart();
};

const filterUpcomingEvents = (events) => {
  if (!Array.isArray(events)) return events;
  return events.filter((event) => {
    if (!event || typeof event !== "object" || !event.end) return true;
    return isUpcomingEvent(event);
  });
};

const formatUserResponse = (user) => ({
  id: user._id,
  username: user.username,
  email: user.email,
  role: user.role,
  location: user.location,
  profileImage: user.profileImage,
  bio: user.bio,
  status: user.status,
  joinedEvents: filterUpcomingEvents(user.joinedEvents),
  managedEvents: filterUpcomingEvents(user.managedEvents),
  createdAt: user.createdAt,
  friends: user.friends,
});

const privateRoomName = (conversationId) =>
  `private-${conversationId.toString()}`;

const findPrivateConversation = async (userId1, userId2) => {
  const id1 = new mongoose.Types.ObjectId(userId1);
  const id2 = new mongoose.Types.ObjectId(userId2);
  return Conversation.findOne({
    type: "private",
    participants: { $all: [id1, id2] },
    $expr: { $eq: [{ $size: "$participants" }, 2] },
  });
};

const getOrCreatePrivateConversation = async (userId1, userId2) => {
  let conv = await findPrivateConversation(userId1, userId2);
  if (!conv) {
    conv = new Conversation({
      type: "private",
      participants: [
        new mongoose.Types.ObjectId(userId1),
        new mongoose.Types.ObjectId(userId2),
      ],
      lastMessage: {},
    });
    await conv.save();
  }
  return conv;
};

const areFriends = async (userId1, userId2) => {
  const user = await User.findById(userId1).select("friends");
  if (!user?.friends?.length) return false;
  return user.friends.some((id) => id.toString() === userId2.toString());
};

const addFriendship = async (userId1, userId2) => {
  await User.findByIdAndUpdate(userId1, {
    $addToSet: { friends: userId2 },
  });
  await User.findByIdAndUpdate(userId2, {
    $addToSet: { friends: userId1 },
  });
};

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

const isAdminUser = async (userId) => {
  if (!userId) return false;
  const user = await User.findById(userId).select("role");
  return user?.role === "admin";
};

const canManageEvent = async (event, actorId) => {
  if (!actorId) return false;
  if (await isAdminUser(actorId)) return true;
  return isEventModerator(event, actorId);
};

const deleteEventCompletely = async (event) => {
  const eventId = event._id;
  await User.updateMany(
    {},
    {
      $pull: {
        joinedEvents: eventId,
        managedEvents: eventId,
      },
    }
  );
  await Event.findByIdAndDelete(eventId);
};

const purgeUserFromAllEvents = async (user) => {
  const userIdStr = user._id.toString();
  const events = await Event.find({
    $or: [
      { attendees: userIdStr },
      { attendees: user.username },
      { attendees: user.email },
      { moderators: user._id },
    ],
  });

  for (const event of events) {
    event.attendees = event.attendees.filter(
      (a) =>
        a !== userIdStr && a !== user.username && a !== user.email
    );
    event.moderators = event.moderators.filter(
      (m) => m.toString() !== userIdStr
    );
    await event.save();
  }
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
//TEST UBICACIÓN: 
app.get("/api/location", async (req, res) => {
  try {
    const r = await fetch("https://ipwho.is/");
    const data = await r.json();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "failed" });
  }
});

//Listar usuarios
app.get("/users", async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId || !(await isAdminUser(adminId))) {
      return res.status(403).json({ error: "Solo administradores pueden listar usuarios" });
    }

    const users = await User.find().select("-passwordHash").sort({ createdAt: -1 });
    res.status(200).json(users.map(formatUserResponse));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo usuarios" });
  }
});

app.get("/users/search", async (req, res) => {
  try {
    const { username, currentUserId } = req.query;

    if (!username || !String(username).trim()) {
      return res.status(400).json({
        error: "Indica un nombre de usuario para buscar",
      });
    }

    const regex = new RegExp(String(username).trim(), "i");
    const filter = {
      username: regex,
      ...(currentUserId ? { _id: { $ne: currentUserId } } : {}),
    };

    const users = await User.find(filter)
      .select("username profileImage bio role")
      .limit(15);

    res.status(200).json(users.map(formatUserPublic));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error buscando usuarios" });
  }
});

//get profile
app.get("/users/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("-passwordHash")
      .populate("joinedEvents")
      .populate("managedEvents");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const moderatedEvents = filterUpcomingEvents(
      await Event.find({ moderators: user._id })
    );

    res.status(200).json({
      ...formatUserResponse(user),
      moderatedEvents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo usuario" });
  }
});

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

    const user = await User.findByIdAndUpdate(userId, update, { returnDocument: 'after' })
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

app.get("/users/:userId/relationship/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    if (userId === otherUserId) {
      return res.status(200).json({ isSelf: true });
    }

    const isFriend = await areFriends(userId, otherUserId);

    const incoming = await FriendRequest.findOne({
      from: otherUserId,
      to: userId,
      status: "pending",
    });

    const outgoing = await FriendRequest.findOne({
      from: userId,
      to: otherUserId,
      status: "pending",
    });

    res.status(200).json({
      isFriend,
      pendingIncoming: !!incoming,
      pendingOutgoing: !!outgoing,
      incomingRequestId: incoming?._id || null,
      outgoingRequestId: outgoing?._id || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo relación" });
  }
});

app.get("/users/:userId/friends", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .select("friends")
      .populate("friends", "username profileImage bio role status");

    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const friends = (user.friends || []).map((f) =>
      f?._id ? formatUserPublic(f) : null
    ).filter(Boolean);

    res.status(200).json(friends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo amigos" });
  }
});

app.get("/users/:userId/friend-requests", async (req, res) => {
  try {
    const userId = req.params.userId;

    const incoming = await FriendRequest.find({
      to: userId,
      status: "pending",
    })
      .populate("from", "username profileImage bio")
      .sort({ createdAt: -1 });

    const outgoing = await FriendRequest.find({
      from: userId,
      status: "pending",
    })
      .populate("to", "username profileImage bio")
      .sort({ createdAt: -1 });

    res.status(200).json({
      incoming: incoming.map((r) => ({
        id: r._id,
        from: formatUserPublic(r.from),
        status: r.status,
        createdAt: r.createdAt,
      })),
      outgoing: outgoing.map((r) => ({
        id: r._id,
        to: formatUserPublic(r.to),
        status: r.status,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo solicitudes" });
  }
});

app.post("/users/:userId/friend-requests", async (req, res) => {
  try {
    const fromId = req.params.userId;
    const { toUserId, username } = req.body;

    if (!toUserId && !username) {
      return res.status(400).json({
        error: "Indica toUserId o username del destinatario",
      });
    }

    let target = null;
    if (toUserId) {
      target = await User.findById(toUserId);
    } else {
      target = await User.findOne({
        username: String(username).trim(),
      });
    }

    if (!target) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const toId = target._id.toString();

    if (fromId === toId) {
      return res.status(400).json({ error: "No puedes añadirte a ti mismo" });
    }

    if (await areFriends(fromId, toId)) {
      return res.status(400).json({ error: "Ya sois amigos" });
    }

    const reversePending = await FriendRequest.findOne({
      from: toId,
      to: fromId,
      status: "pending",
    });

    if (reversePending) {
      return res.status(400).json({
        error: "Esa persona ya te envió una solicitud. Acéptala en Amigos.",
        requestId: reversePending._id,
      });
    }

    let request = await FriendRequest.findOne({ from: fromId, to: toId });

    if (request?.status === "pending") {
      return res.status(400).json({ error: "Solicitud ya enviada" });
    }

    if (request?.status === "accepted") {
      return res.status(400).json({ error: "Ya sois amigos" });
    }

    if (request) {
      request.status = "pending";
      request.respondedAt = null;
      request.createdAt = new Date();
      await request.save();
    } else {
      request = new FriendRequest({ from: fromId, to: toId });
      await request.save();
    }

    const populated = await FriendRequest.findById(request._id).populate(
      "to",
      "username profileImage bio"
    );

    res.status(201).json({
      id: populated._id,
      to: formatUserPublic(populated.to),
      status: populated.status,
      createdAt: populated.createdAt,
    });
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ error: "Solicitud ya existente" });
    }
    res.status(500).json({ error: "Error enviando solicitud" });
  }
});

app.patch("/friend-requests/:requestId", async (req, res) => {
  try {
    const { userId, action } = req.body;

    if (!userId || !["accept", "decline"].includes(action)) {
      return res.status(400).json({
        error: "userId y action (accept|decline) son obligatorios",
      });
    }

    const request = await FriendRequest.findById(req.params.requestId);

    if (!request) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    if (request.to.toString() !== userId.toString()) {
      return res.status(403).json({
        error: "Solo el destinatario puede responder la solicitud",
      });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ error: "La solicitud ya fue respondida" });
    }

    request.status = action === "accept" ? "accepted" : "declined";
    request.respondedAt = new Date();
    await request.save();

    if (action === "accept") {
      await addFriendship(request.from, request.to);
      await getOrCreatePrivateConversation(request.from, request.to);
    }

    res.status(200).json({
      id: request._id,
      status: request.status,
      message:
        action === "accept"
          ? "Solicitud aceptada. Ya podéis chatear en privado."
          : "Solicitud rechazada",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error respondiendo solicitud" });
  }
});
//Deletefriend
app.delete("/users/:userId/friends/:friendId", async (req, res) => {
  try {
    const { userId, friendId } = req.params;

    await User.findByIdAndUpdate(userId, {
      $pull: { friends: friendId },
    });
    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: userId },
    });

    res.status(200).json({ message: "Amigo eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando amigo" });
  }
});

//Conversaciones eventos
app.get("/users/:userId/conversations/event", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const conversations = await Conversation.find({
      type: "event",
      participants: userId,
    })
      .sort({ "lastMessage.sentAt": -1 });

    const list = conversations.map((conv) => ({
      conversationId: conv._id,
      eventId: conv.eventId,
      title: conv.title,
      lastMessage: conv.lastMessage,
    }));

    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo chats de eventos" });
  }
});

//get obtain conversation
app.post("/events/:eventId/conversation", async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await findEventByIdentifier(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    let conversation = await Conversation.findOne({
      type: "event",
      eventId: event._id,
    });

    if (!conversation) {
      const participantIds = new Set();

      for (const mod of event.moderators || []) {
        const modId = mod?._id ? mod._id.toString() : mod.toString();
        participantIds.add(modId);
      }

      for (const att of event.attendees || []) {
        if (mongoose.Types.ObjectId.isValid(att)) {
          participantIds.add(att);
        }
      }

      const participants = Array.from(participantIds).map(
        (id) => new mongoose.Types.ObjectId(id)
      );

      conversation = new Conversation({
        type: "event",
        participants,
        eventId: event._id,
        title: event.title,
        lastMessage: {},
      });
      await conversation.save();
    }

    res.status(200).json(conversation);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo conversación del evento" });
  }
});

app.post("/events/:eventId/conversation/leave", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId es obligatorio" });
    }

    const event = await findEventByIdentifier(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const conversation = await Conversation.findOne({
      type: "event",
      eventId: event._id,
    });

    if (conversation) {
      conversation.participants = conversation.participants.filter(
        (p) => p.toString() !== userId
      );
      await conversation.save();
    }

    res.status(200).json({ message: "Usuario eliminado del chat del evento" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error saliendo de la conversación del evento" });
  }
});

app.post("/events/:eventId/conversation/join", async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId es obligatorio" });
    }

    const event = await findEventByIdentifier(eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    let conversation = await Conversation.findOne({
      type: "event",
      eventId: event._id,
    });

    if (!conversation) {
      conversation = new Conversation({
        type: "event",
        participants: [],
        eventId: event._id,
        title: event.title,
        lastMessage: {},
      });
    }

    if (!conversation.participants.some((p) => p.toString() === userId)) {
      conversation.participants.push(new mongoose.Types.ObjectId(userId));
      await conversation.save();
    } else {
      await conversation.save();
    }

    res.status(200).json({
      conversationId: conversation._id,
      title: conversation.title,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error uniendo a la conversación del evento" });
  }
});

app.get("/users/:userId/conversations/private", async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.userId);

    const conversations = await Conversation.find({
      type: "private",
      participants: userId,
    })
      .populate("participants", "username profileImage")
      .sort({ "lastMessage.sentAt": -1 });

    const list = conversations.map((conv) => {
      const other = conv.participants.find(
        (p) => p._id.toString() !== userId.toString()
      );
      return {
        conversationId: conv._id,
        otherUser: other ? formatUserPublic(other) : null,
        lastMessage: conv.lastMessage,
      };
    });

    res.status(200).json(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo chats privados" });
  }
});

app.post("/users/:userId/conversations/private", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { friendId } = req.body;

    if (!friendId) {
      return res.status(400).json({ error: "friendId es obligatorio" });
    }

    if (!(await areFriends(userId, friendId))) {
      return res.status(403).json({
        error: "Solo puedes chatear con usuarios que son tus amigos",
      });
    }

    const conversation = await getOrCreatePrivateConversation(userId, friendId);
    const other = await User.findById(friendId).select(
      "username profileImage bio"
    );

    res.status(200).json({
      conversationId: conversation._id,
      otherUser: formatUserPublic(other),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error abriendo chat privado" });
  }
});

app.delete("/users/:userId", async (req, res) => {
  try {
    const adminId = req.query.adminId || req.body?.adminId;
    const targetId = req.params.userId;

    if (!adminId || !(await isAdminUser(adminId))) {
      return res.status(403).json({ error: "Solo administradores pueden eliminar usuarios" });
    }

    if (adminId === targetId) {
      return res.status(400).json({ error: "No puedes eliminar tu propia cuenta desde el panel admin" });
    }

    const user = await User.findById(targetId);
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    await purgeUserFromAllEvents(user);
    await FriendRequest.deleteMany({
      $or: [{ from: targetId }, { to: targetId }],
    });
    await User.updateMany(
      { friends: targetId },
      { $pull: { friends: targetId } }
    );
    await User.findByIdAndDelete(targetId);

    res.status(200).json({ message: "Usuario eliminado permanentemente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando usuario" });
  }
});
//sign in
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

//get out of event
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

//Logout 
app.post("/logout", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario requerido" });
    }

//Find user
    const user = await User.findByIdAndUpdate(
      userId,
      { status: false },
      { returnDocument: 'after' }
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

app.get("/conversations/group", async (req, res) => {
  try {
//chekc if it exist
    let groupConversation = await Conversation.findOne({ type: "group" });

//TEST make if it doenst
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

//GET MESSAGES========================================================================================
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

app.post("/messages", async (req, res) => {
  try {
    const { conversationId, senderId, text } = req.body;

    if (!conversationId || !senderId || !text) {
      return res.status(400).json({ error: "Faltan campos requeridos" });
    }

    const newMessage = new Message({
      conversationId,
      senderId,
      text,
      type: "text",
      readBy: [senderId],
      sentAt: new Date()
    });

    await newMessage.save();

    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: {
        text,
        sender: senderId,
        sentAt: new Date()
      }
    });

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "senderId",
      "username profileImage"
    );

    const conversation = await Conversation.findById(conversationId).select(
      "type"
    );

    if (conversation?.type === "private") {
      io.to(privateRoomName(conversationId)).emit(
        "new-message",
        populatedMessage
      );
    } else if (conversation?.type === "event") {
      io.to(`event-${conversationId}`).emit(
        "new-message",
        populatedMessage
      );
    } else {
      io.to("group-chat").emit("new-message", populatedMessage);
    }

    res.status(201).json(populatedMessage);

  } catch (error) {
    console.error("Error al enviar mensaje:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

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
      { returnDocument: 'after' }
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

app.get("/events", async (req, res) => {
  try {
    const events = await Event.find().sort({ start: 1 });

    const eventsWithImages = filterUpcomingEvents(events).map(event => {
      const posterPath = path.join(
        __dirname,
        "event-images",
        event.id.toString(),
        "poster.jpg"
      );

      const image = fs.existsSync(posterPath)
        ? `/event-images/${event.id}/poster.jpg`
        : "/event-images/default.jpg";

      return {
        ...event.toObject(),
        image
      };
    });

    res.json(eventsWithImages);
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

//UPDATE event
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

    if (!(await canManageEvent(event, moderatorId))) {
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

    if (!(await canManageEvent(event, moderatorId))) {
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

app.delete("/events/:eventId", async (req, res) => {
  try {
    const moderatorId = req.query.moderatorId || req.body?.moderatorId;

    if (!moderatorId) {
      return res.status(400).json({ error: "moderatorId es obligatorio" });
    }

    const event = await findEventByIdentifier(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    if (!(await canManageEvent(event, moderatorId))) {
      return res.status(403).json({ error: "No tienes permiso para eliminar este evento" });
    }

    await deleteEventCompletely(event);
    res.status(200).json({ message: "Evento eliminado" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error eliminando evento" });
  }
});

app.get("/events/:eventId/moderators", async (req, res) => {
  try {
    const event = await findEventByIdentifier(req.params.eventId);
    if (!event) {
      return res.status(404).json({ error: "Evento no encontrado" });
    }

    const populated = await Event.findById(event._id)
      .populate("moderators", "username email role profileImage")
      .select("moderators");

    let resolved = (populated.moderators || []).map((m) => ({
      id: m._id,
      username: m.username,
      email: m.email,
      role: m.role,
      profileImage: m.profileImage || "",
    }));

    if (resolved.length === 0) {
      const organizers = await User.find({ managedEvents: event._id }).select(
        "username email role profileImage"
      );
      resolved = organizers.map((u) => ({
        id: u._id,
        username: u.username,
        email: u.email,
        role: u.role,
        profileImage: u.profileImage || "",
      }));
    }

    res.status(200).json(resolved);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error obteniendo organizadores" });
  }
});

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


// =====SOCKET.IO EVENT LISTENERS ======================
io.on("connection", (socket) => {
  console.log("Nuevo usuario conectado:", socket.id);

  //join group chat
  socket.on("join-group-chat", (userId) => {
    socket.join("group-chat");
    console.log(`${userId} se unió al chat grupal`);
  });

  socket.on("join-private-chat", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(privateRoomName(conversationId));
  });

  socket.on("leave-private-chat", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(privateRoomName(conversationId));
  });

  socket.on("join-event-chat", ({ conversationId }) => {
    if (!conversationId) return;
    socket.join(`event-${conversationId}`);
  });

  socket.on("leave-event-chat", ({ conversationId }) => {
    if (!conversationId) return;
    socket.leave(`event-${conversationId}`);
  });
  
  //NEW MESSAGE
  socket.on("send-message", async (messageData) => {
    try {
      //SEND TO ALL
      io.to("group-chat").emit("new-message", messageData);
    } catch (error) {
      console.error("Error emitiendo mensaje:", error);
    }
  });
  

  //desonectar
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
