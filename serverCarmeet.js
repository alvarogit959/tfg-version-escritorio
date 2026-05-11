require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
//const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());

//CREAR SERVIDOR
const server = http.createServer(app);
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