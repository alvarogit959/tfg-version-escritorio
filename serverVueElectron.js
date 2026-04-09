require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
//npm install mongodb@4.1
//mongodb+srv://alvarod_db_user:ChangeMe@clustervending.o3ch2ve.mongodb.net/?appName=ClusterVending
//alvarod_db_user ChangeMe

//CREAR SERVIDOR
const server = http.createServer(app);

/*
//WEBSOCKET PARA ADMINSITRACIÓN
const WebSocket = require('ws');
const wss = new WebSocket.Server({
  server: server,
});

//ALMACENAR CONEXIONES
const wsConnections = {
  android: new Map(),
  admin: new Set()
};*/
//CONEXION MONGO
//CREAR .env PARA PROTEGER LOS CREDENCIALES DE MONGODB========================================
mongoose
  .connect(
    "mongodb+srv://alvarod_db_user:ChangeMe@clustervending.o3ch2ve.mongodb.net/?appName=ClusterVending",
  )
  .then(() => console.log("Conectado a MongoDB Atlas"))
  .catch((err) => console.error("Error de conexión:", err));

const userSchema = new mongoose.Schema({
  nombreCorreo: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    default: false,
  },
});
const User = mongoose.model("User", userSchema);
//ACTIVIDADES
const actividadSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  duracion: { type: Number, required: true },
  plazasMaximas: { type: Number, required: true },
  fecha: { type: Date, required: true },

  usuarios: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      },
      estado: {
        type: String,
        enum: ["pendiente", "asistio", "falta"],
        default: "pendiente"
      },
      fechaCancelacion: Date
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Actividad = mongoose.model("Actividad", actividadSchema);
//Crear actividad
app.post("/actividades", async (req, res) => {
  try {
    const { duracion, plazasMaximas, fecha } = req.body;

    if (duracion <= 0 || plazasMaximas <= 0) {
      return res.status(400).json({
        error: "Duración o plazas inválidas",
      });
    }

    const fechaActividad = new Date(fecha);
    const ahora = new Date();

    if (isNaN(fechaActividad.getTime())) {
      return res.status(400).json({
        error: "Fecha inválida",
      });
    }

    if (fechaActividad < ahora) {
      return res.status(400).json({
        error: "La fecha debe ser futura",
      });
    }

    const actividad = new Actividad(req.body);
    await actividad.save();

    res.status(201).json(actividad);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        error: "Ya existe una actividad con ese nombre",
      });
    }

    console.error(err);
    res.status(500).json({ error: "Error creando actividad" });
  }
});
//Obtener actividades
app.get("/actividades", async (req, res) => {
  try {
    const actividades = await Actividad.find().populate(
      "usuarios.user",
      "nombreCorreo",
    );

    res.json(actividades);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo actividades" });
  }
});
//Obtener actividad
app.get("/actividades/:id", async (req, res) => {
  try {
    const actividad = await Actividad.findById(req.params.id).populate(
      "usuarios",
    );

    if (!actividad) return res.status(404).json({ error: "No encontrada" });

    res.json(actividad);
  } catch (err) {
    res.status(500).json({ error: "Error obteniendo actividad" });
  }
});
//Editar actividad
app.put("/actividades/:id", async (req, res) => {
  try {
    const actividad = await Actividad.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true },
    );

    res.json(actividad);
  } catch (err) {
    res.status(500).json({ error: "Error actualizando actividad" });
  }
});
//Eliminar
app.delete("/actividades/:id", async (req, res) => {
  try {
    await Actividad.findByIdAndDelete(req.params.id);

    res.json({ mensaje: "Actividad eliminada" });
  } catch (err) {
    res.status(500).json({ error: "Error eliminando actividad" });
  }
});
//Añadir usuario
app.post("/actividades/:id/inscribir", async (req, res) => {
  try {
    const { userId } = req.body;
    const actividad = await Actividad.findById(req.params.id);

    if (!actividad) return res.status(404).json({ error: "No encontrada" });

    if (actividad.fecha < new Date())
      return res.status(400).json({ error: "Actividad ya realizada" });

    const yaInscrito = actividad.usuarios.some(
      u => u.user.toString() === userId
    );

    if (yaInscrito)
      return res.status(400).json({ error: "Ya inscrito" });

    if (actividad.usuarios.length >= actividad.plazasMaximas)
      return res.status(400).json({ error: "Actividad llena" });

    actividad.usuarios.push({
      user: userId,
      estado: "pendiente"
    });

    await actividad.save();

    res.json(actividad);
  } catch (err) {
    res.status(500).json({ error: "Error inscribiendo" });
  }
});


//Eliminar usuario
app.post("/actividades/:id/desinscribir", async (req, res) => {
  try {
    const { userId } = req.body;

    const actividad = await Actividad.findById(req.params.id);

    const participante = actividad.usuarios.find(
      u => u.user.toString() === userId
    );

    if (!participante)
      return res.status(404).json({ error: "Usuario no inscrito" });

    const ahora = new Date();
    const inicio = new Date(actividad.fecha);

    const diff = inicio - ahora;

    if (diff <= 15 * 60 * 1000) {
      participante.estado = "falta";
      participante.fechaCancelacion = ahora;
    } else {
      actividad.usuarios = actividad.usuarios.filter(
        u => u.user.toString() !== userId
      );
    }

    await actividad.save();

    res.json(actividad);
  } catch (err) {
    res.status(500).json({ error: "Error desinscribiendo" });
  }
});
app.post("/actividades/:id/asistencia", async (req, res) => {
  try {
    const { userId, asistio } = req.body;

    const actividad = await Actividad.findById(req.params.id);

    const participante = actividad.usuarios.find(
      u => u.user.toString() === userId
    );

    if (!participante)
      return res.status(404).json({ error: "Usuario no inscrito" });

    participante.estado = asistio ? "asistio" : "falta";

    await actividad.save();

    res.json(actividad);

  } catch (err) {
    res.status(500).json({ error: "Error marcando asistencia" });
  }
});

//crear usuario
app.post("/users", async (req, res) => {
  try {

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = new User({
      nombreCorreo: req.body.nombreCorreo,
      password: hashedPassword,
      admin: req.body.admin || false
    });

    await user.save();

    res.status(201).json({
      id: user._id,
      nombreCorreo: user.nombreCorreo
    });

  } catch (err) {

    if (err.code === 11000) {
      return res.status(400).json({
        error: "Ese usuario ya existe"
      });
    }

    res.status(500).json({ error: "Error creando usuario" });
  }
});


//TEST LOGIN
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ nombreCorreo: username });

  if (!user) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  const match = await bcrypt.compare(password, user.password);

  if (!match) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  res.json({
    id: user._id,
    nombreCorreo: user.nombreCorreo,
    admin: user.admin
  });
});


/*
wss.clients.forEach(client => {
  client.send(JSON.stringify({
    tipo: 'ACTIVIDAD_CREADA',
    data: actividad
  }));
});
 */

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
