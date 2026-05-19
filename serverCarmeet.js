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