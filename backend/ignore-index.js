import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import crypto from "crypto";
import multer from "multer";
import path from "path";
import fs from "fs";
process.env.TZ = 'America/Argentina/Buenos_Aires';
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || "beautycare_secret_key";


function toLocalDate(dateInput) {
  if (!dateInput) return null;

  const date = new Date(dateInput);

  // 🔁 Convierte a texto en hora argentina (UTC-3)
  return date.toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour12: false,
  });
}

app.use(cors({
  origin: "https://migabinete-frontend.onrender.com",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ⬇️ Aumentamos el límite para base64
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// 🌸 Ruta base
app.get("/", (req, res) => {
  res.send("🌸 BeautyCare API funcionando correctamente 🌸");
});

// --------------------------
// DEBUG ENDPOINTS
// --------------------------

// 1) Render: velocidad pura (sin DB, sin token)
app.get("/debug/ping", (req, res) => {
  res.json({ ok: true, serverTime: Date.now() });
});

// 2) Supabase: velocidad de la base de datos
app.get("/debug/db", async (req, res) => {
  const start = Date.now();
  await prisma.patient.findMany({ take: 1 });
  res.json({ db_time_ms: Date.now() - start });
});

// 3) Consulta real: velocidad de tu lógica Prisma
app.get("/debug/patients", async (req, res) => {
  const start = Date.now();
  const patients = await prisma.patient.findMany({ take: 5 });
  res.json({
    items: patients.length,
    total_time_ms: Date.now() - start
  });
});

app.get("/debug/me", async (req, res) => {
  const token = req.headers["authorization"];
  res.json({ token });
});

// ========================= 🔐 JWT & USUARIOS =========================
function authenticateToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Token requerido" });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido" });
    req.user = user;
    next();
  });
}

// Perfil usuario logueado
app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
      select: { id: true, name: true, email: true, phone: true, profileImage: true, profession: true }, // 👈 sin phone
    });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(user);
  } catch (err) {
    console.error("Error en /me:", err);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

// ========================= 💅 OBSERVACIONES PROFESIONALES =========================

// Crear o actualizar observaciones
app.post("/observations", authenticateToken, async (req, res) => {
  try {
    const { patientId, biotipo, fototipo } = req.body;

    if (!patientId) return res.status(400).json({ error: "Falta el ID del paciente" });

    const existing = await prisma.observation.findUnique({ where: { patientId } });

    let observation;
    if (existing) {
      observation = await prisma.observation.update({
        where: { patientId },
        data: { biotipo, fototipo },
      });
    } else {
      observation = await prisma.observation.create({
        data: { patientId, biotipo, fototipo },
      });
    }

    res.json(observation);
  } catch (err) {
    console.error("Error al guardar observaciones:", err);
    res.status(500).json({ error: "Error al guardar observaciones" });
  }
});

// Obtener observaciones por paciente
app.get("/observations/:patientId", authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const observation = await prisma.observation.findUnique({
      where: { patientId: Number(patientId) },
    });

    if (!observation) return res.status(404).json({});
    res.json(observation);
  } catch (err) {
    console.error("Error al obtener observaciones:", err);
    res.status(500).json({ error: "Error al obtener observaciones" });
  }
});

// ========================= 🩷 PACIENTES =========================

// Obtener todos los pacientes
// Obtener todos los pacientes (incluye último tratamiento)
app.get("/patients", authenticateToken, async (req, res) => {
  try {
    const patients = await prisma.patient.findMany({
      where: { userId: req.user.id },
      orderBy: { id: "desc" },
      include: {
        appointments: {
          orderBy: { date: "desc" },
          take: 1, // 👈 solo el último tratamiento
        }
      }
    });

    // Agregar lastTreatment al JSON antes de devolverlo
    const enriched = patients.map(p => {
      const lastApp = p.appointments[0];

      return {
        ...p,
        lastTreatment: lastApp ? lastApp.treatment : null
      };
    });

    res.json(enriched);
  } catch (error) {
    console.error("Error al obtener pacientes:", error);
    res.status(500).json({ error: "Error al obtener pacientes" });
  }
});

// ✅ Obtener paciente completo por ID (con entrevista, observaciones y tratamientos)
app.get("/patients/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const patient = await prisma.patient.findFirst({
      where: { id, userId: req.user.id },
      include: {
        appointments: { orderBy: { date: "desc" } },
        interview: true,
        observation: true,
      },
    });

    if (!patient) return res.status(404).json({ error: "Paciente no encontrado" });

    res.json(patient);
  } catch (error) {
    console.error("Error al obtener paciente completo:", error);
    res.status(500).json({ error: "Error al obtener paciente completo" });
  }
});


// Crear nuevo paciente
app.post("/patients", authenticateToken, async (req, res) => {
  try {
    const { fullName, birthDate, address, phone, profession } = req.body;

    if (!fullName || !birthDate || !address || !phone)
      return res.status(400).json({ error: "Faltan datos obligatorios." });

    const birth = new Date(birthDate);
    const age = new Date().getFullYear() - birth.getFullYear();

    const newPatient = await prisma.patient.create({
      data: { fullName, birthDate: birth, age, address, phone, profession, userId: req.user.id },
    });

    // ✅ Usá esto:
    res.status(201).json(newPatient);
  } catch (error) {
    console.error("Error al crear paciente:", error);
    res.status(500).json({ error: "Error al crear paciente" });
  }
});

// 🗑️ Eliminar paciente con borrado de datos relacionados
app.delete("/patients/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const patientId = Number(id);

    if (isNaN(patientId)) {
      return res.status(400).json({ error: "ID de paciente inválido" });
    }

    // 🔹 1. Eliminar todos los datos relacionados
    await prisma.appointment.deleteMany({ where: { patientId } }).catch(() => {});
    await prisma.treatment?.deleteMany?.({ where: { patientId } }).catch(() => {}); // por si existe una tabla separada
    await prisma.observation.deleteMany({ where: { patientId } }).catch(() => {});
    await prisma.interview.deleteMany({ where: { patientId } }).catch(() => {});

    // 🔹 2. Eliminar el paciente
    const deletedPatient = await prisma.patient.delete({
      where: { id: patientId },
    });

    // 🔹 3. Responder al front
    res.json({ message: "Paciente eliminado correctamente", deletedPatient });
  } catch (error) {
    console.error("Error al eliminar paciente:", error);
    res.status(500).json({ error: "No se pudo eliminar el paciente." });
  }
});


// ========================= 💗 ACTUALIZAR PACIENTE (Edad calculada correctamente) =========================
app.put("/patients/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, birthDate, address, phone, profession } = req.body;

    if (!birthDate) {
      return res.status(400).json({ error: "La fecha de nacimiento es obligatoria" });
    }

    // 🧮 Cálculo preciso de edad
    const birth = new Date(birthDate);
    const today = new Date();

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    // 🩷 Actualizar paciente
    const updatedPatient = await prisma.patient.updateMany({
      where: { id: Number(id), userId: req.user.id },
      data: {
        fullName,
        birthDate: birth,
        age, // <- ahora se asegura que no sea null
        address,
        phone,
        profession,
      },
    });

    res.json({ message: "Paciente actualizado correctamente", patient: updatedPatient });
  } catch (error) {
    console.error("Error al actualizar paciente:", error);
    res.status(500).json({ error: "Error al actualizar paciente" });
  }
});

// ========================= 💆‍♀️ TRATAMIENTOS (Alias: appointments) =========================
app.post("/appointments", authenticateToken, async (req, res) => {
  try {
    const { patientId, treatment, date, time, amount, notes, status, method, beforePhoto, afterPhoto } = req.body;

    if (!patientId || !date || !treatment) {
      return res.status(400).json({ error: "Faltan campos obligatorios" });
    }

    // 🧭 Ajuste de zona horaria
    const treatmentDate = new Date(`${date}T${time}:00-03:00`);

    const newAppointment = await prisma.appointment.create({
      data: {
        patientId: Number(patientId),
        date: treatmentDate,
        time: time || null,
        treatment,
        amount: amount ? parseFloat(amount) : null,
        notes,
        status,
        method,
        beforePhoto,
        afterPhoto,
        userId: req.user.id,
      },
      include: { patient: true },
    });

    res.json(newAppointment);
  } catch (error) {
    console.error("Error al crear appointment:", error);
    res.status(500).json({ error: "Error al crear appointment" });
  }
});


// ========================= 📅 OBTENER TODOS LOS TURNOS (para calendario) =========================
app.get("/appointments", authenticateToken, async (req, res) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.id },
      include: { patient: true },
      orderBy: { date: "asc" },
    });

    // Protección: asegurar que date SIEMPRE sea un string válido
    const safeAppointments = appointments.map(app => ({
      ...app,
      date: app.date instanceof Date
        ? app.date.toISOString().split("T")[0]
        : app.date, // ya viene como string, no lo tocamos
    }));

    res.json(safeAppointments);

  } catch (error) {
    console.error("Error al obtener appointments:", error);
    res.status(500).json({ error: "Error al obtener appointments" });
  }
});

// ========================= 🗑️ ELIMINAR TURNO =========================
app.delete("/appointments/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    // 🔒 Solo puede eliminar turnos del usuario autenticado
    const deleted = await prisma.appointment.deleteMany({
      where: { id, userId: req.user.id },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: "Tratamiento no encontrado o no autorizado" });
    }

    res.json({ message: "Tratamiento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar appointment:", error);
    res.status(500).json({ error: "Error al eliminar tratamiento" });
  }
});

// ========================= 💆 HISTORIAL DE TRATAMIENTOS =========================

// Obtener tratamientos de un paciente
app.get("/treatments/patient/:id", authenticateToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const treatments = await prisma.appointment.findMany({
      where: { patientId: id },
      orderBy: { date: "desc" },
    });

    res.json(treatments);
  } catch (error) {
    console.error("Error al obtener tratamientos:", error);
    res.status(500).json({ error: "Error al obtener tratamientos" });
  }
});

app.put("/appointments/:id", authenticateToken, async (req, res) => {
  try {
    console.log("🟣 UPDATE RECIBIDO:", req.body);

    const { id } = req.params;
    let { treatment, date, time, amount, notes, status, method, beforePhoto, afterPhoto } = req.body;

    // Normalizar valores vacíos → evitar errores 500
    if (!beforePhoto || beforePhoto === "null" || beforePhoto === "undefined") {
      beforePhoto = null;
    }
    if (!afterPhoto || afterPhoto === "null" || afterPhoto === "undefined") {
      afterPhoto = null;
    }

    if (amount === "" || amount === undefined) amount = null;

    const treatmentDate = new Date(`${date}T${time}:00-03:00`);
    const updatedAppointment = await prisma.appointment.update({
      where: { id: Number(id) },
      data: {
        treatment,
        date: treatmentDate,
        time,
        amount: amount ? parseFloat(amount) : null,
        notes,
        status,
        method,
        beforePhoto,
        afterPhoto,
      },
      include: { patient: true },
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error(" ERROR EN PUT /appointments/:id:", error);
    res.status(500).json({ error: "Error al actualizar tratamiento", details: error.message });
  }
});


// Crear tratamiento para un paciente
app.post("/treatments", authenticateToken, async (req, res) => {
  try {
    const { patientId, date, time, treatment, amount, notes } = req.body;

    if (!patientId || !date || !treatment)
      return res.status(400).json({ error: "Faltan campos obligatorios" });

    // 🧭 Ajuste de zona horaria
    const localDate = new Date(date + "T00:00:00");
    localDate.setHours(localDate.getHours() + 3); // 🇦🇷 UTC-3

    const newTreatment = await prisma.appointment.create({
      data: {
        patientId: Number(patientId),
        date: localDate,
        time: time || null,
        treatment,
        amount: amount ? parseFloat(amount) : null,
        notes,
        userId: req.user.id, // 🔒 importante
      },
    });

    res.json({ message: "Tratamiento registrado correctamente", treatment: newTreatment });
  } catch (error) {
    console.error("Error al crear tratamiento:", error);
    res.status(500).json({ error: "Error al crear tratamiento" });
  }
});

// ========================= 🩺 ENTREVISTA COMPLETA =========================

// Obtener entrevista por pacienteId
app.get("/interview/:patientId", authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const interview = await prisma.interview.findUnique({
      where: { patientId: Number(patientId) },
    });

    if (!interview) return res.status(404).json({ message: "No se encontró entrevista" });
    res.json(interview);
  } catch (error) {
    console.error("Error al obtener entrevista:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Crear o actualizar entrevista (cubre parte 1 y 2)
app.post("/interview", authenticateToken, async (req, res) => {
  try {
    let data = req.body;

    // Convertir concerns a string si es array
    if (Array.isArray(data.concerns)) {
      data.concerns = data.concerns.join(", ");
    }

    // Guardar el ID del paciente aparte
    const patientId = Number(data.patientId);
    delete data.patientId; // 🔥 importante: lo quitamos del data

    // Verificar si ya existe entrevista
    const existing = await prisma.interview.findUnique({
      where: { patientId },
    });

    let interview;
    if (existing) {
      interview = await prisma.interview.update({
        where: { patientId },
        data, // ✅ ya sin patientId adentro
      });
      console.log("🔄 Entrevista actualizada:", patientId);
    } else {
      interview = await prisma.interview.create({
        data: {
          ...data,
          patient: { connect: { id: patientId } }, // 🔗 relación correcta con Patient
        },
      });
      console.log("🆕 Entrevista creada:", patientId);
    }

    res.json(interview);
  } catch (error) {
    console.error("Error al guardar entrevista:", error);
    res.status(500).json({ message: "Error al guardar entrevista" });
  }
});

// ========================= 🩷 AUTENTICACIÓN =========================

// Registro + verificación
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, isVerified: false },
    });

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.verificationToken.create({
      data: { userId: user.id, token, createdAt: new Date() },
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });

    const verifyUrl = `${process.env.BASE_URL}/verify/${token}`;
    const html = `
      <div style="font-family:Poppins;text-align:center;padding:40px;">
        <h2 style="color:#ffadad;">¡Hola ${name}!</h2>
        <p>Verificá tu cuenta haciendo clic abajo:</p>
        <a href="${verifyUrl}" style="background:#ffadad;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;">Verificar cuenta</a>
      </div>`;

    await transporter.sendMail({
      from: `"BeautyCare Pro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verificá tu cuenta 💖",
      html,
    });

    res.json({ message: "Correo de verificación enviado." });
  } catch (err) {
    console.error("Error en registro:", err);
    res.status(500).json({ error: "Error al registrar usuario" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "Usuario no encontrado" });
  if (!user.isVerified) return res.status(403).json({ error: "Cuenta no verificada" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(400).json({ error: "Contraseña incorrecta" });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "2h" });
  res.json({ message: `Bienvenida, ${user.name}!`, token, user });
});

// Verificación de correo
app.get("/verify/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const record = await prisma.verificationToken.findUnique({ where: { token } });
    if (!record) return res.status(400).send("Token inválido o expirado");
    await prisma.user.update({ where: { id: record.userId }, data: { isVerified: true } });
    await prisma.verificationToken.delete({ where: { token } });
    res.redirect(`${process.env.FRONTEND_URL}/login/login.html?verified=success`);
  } catch {
    res.status(500).send("Error al verificar cuenta");
  }
});

// ========================= 📊 ESTADÍSTICAS =========================
app.get("/stats", authenticateToken, async (req, res) => {
  try {
    // 💡 Cálculo de fecha local (Argentina)
    const now = new Date();
    const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    const today = new Date(localNow.toISOString().split("T")[0]);

    // 👥 Total de pacientes
    const totalPatients = await prisma.patient.count({
      where: { userId: req.user.id },
    });

    // 💆‍♀️ Total de turnos (appointment)
    const totalAppointments = await prisma.appointment.count({
      where: { userId: req.user.id },
    });

    // ✅ Turnos completados
    const completedAppointments = await prisma.appointment.count({
      where: { userId: req.user.id, completed: true },
    });

    // 🔮 Turnos futuros (desde appointments y simpleAppointments)
    const upcomingAppointmentsFromAppointments = await prisma.appointment.count({
      where: {
        userId: req.user.id,
        date: { gte: today },
      },
    });

    const upcomingAppointmentsFromSimple = await prisma.simpleAppointment.count({
      where: {
        userId: req.user.id,
        date: { gte: today },
      },
    });

    const upcomingAppointments = upcomingAppointmentsFromAppointments + upcomingAppointmentsFromSimple;

    // 🧩 Debug temporal
    console.log("📊 Stats Debug → user:", req.user.id);
    console.log("Appointments futuros:", upcomingAppointmentsFromAppointments);
    console.log("Simple futuros:", upcomingAppointmentsFromSimple);
    console.log("Total futuros:", upcomingAppointments);

    res.json({
      totalPatients,
      totalAppointments,
      completedAppointments,
      upcomingAppointments,
    });
  } catch (err) {
    console.error("Error en /stats:", err);
    res.status(500).json({ error: "Error al obtener estadísticas." });
  }
});


app.get("/next-appointments", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 🔹 Asegura incluir los de hoy

    const appointments = await prisma.appointment.findMany({
      where: { userId: req.user.id, date: { gte: today } },
      orderBy: { date: "asc" },
      include: { patient: true },
      take: 4,
    });

    const simpleAppointments = await prisma.simpleAppointment.findMany({
      where: { userId: req.user.id, date: { gte: today } },
      orderBy: { date: "asc" },
    });

    const all = [
      ...appointments.map(a => ({
        id: a.id,
        patientName: a.patient?.fullName || a.treatment || "Sin nombre",
        date: a.date,
        time: a.time,
      })),
      ...simpleAppointments.map(s => ({
        id: s.id,
        patientName: s.name,
        date: s.date,
        time: s.time,
      })),
    ];

    res.json(all);
  } catch (err) {
    console.error("Error en /next-appointments:", err);
    res.status(500).json({ error: "Error al obtener turnos." });
  }
});

// ========================= 👤 EDITAR PERFIL =========================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads/profile-images";
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `user_${req.user.id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });
app.use("/uploads", express.static("uploads"));

app.put("/edit-profile", authenticateToken, upload.single("profileImage"), async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, profession, phone, password } = req.body;
    const name = `${firstName || ""} ${lastName || ""}`.trim();
    const file = req.file;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    let hashed = user.password;
    if (password && password.trim() !== "") hashed = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || user.name,
        profession: profession || user.profession,
        phone: phone || user.phone,
        password: hashed,
        profileImage: file ? `/uploads/profile-images/${file.filename}` : user.profileImage,
      },
    });

    res.json({ message: "Perfil actualizado correctamente", user: updated });
  } catch (err) {
  console.error("❌ Error al actualizar perfil:", err);
  res.status(500).json({ error: "Error al actualizar perfil", details: err.message });
}
});

// ========================= 📅 AGENDA SIMPLE =========================

// ✅ Crear turno simple (corrige la fecha al guardarla)
app.post("/simple-appointments", authenticateToken, async (req, res) => {
  try {
    const { name, date, time } = req.body;

    if (!name || !date || !time) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // 🧭 CORRECCIÓN de zona horaria (Argentina u otra local)
    const localDate = new Date(date + "T00:00:00");
    localDate.setHours(localDate.getHours() + 3); // 🇦🇷 UTC-3 (Argentina)

    const appointment = await prisma.simpleAppointment.create({
      data: {
        name,
        date: localDate,
        time,
        userId: req.user.id,
      },
    });

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error al crear simple appointment:", error);
    res.status(500).json({ error: "Error al crear simple appointment" });
  }
});


// ✅ Obtener todos los turnos (une viejos y nuevos)
app.get("/simple-appointments", authenticateToken, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Turnos de la tabla nueva
    const simpleAppointments = await prisma.simpleAppointment.findMany({
      where: { userId: req.user.id, date: { gte: today } },
      orderBy: { date: "asc" },
    });

    // Turnos antiguos (sin pacienteId) en Appointment
    const oldAppointments = await prisma.appointment.findMany({
      where: { patientId: null, userId: req.user.id },
      orderBy: { date: "asc" },
    });

    // Unimos ambos conjuntos
    const all = [
      ...simpleAppointments.map(t => ({
        id: t.id,
        name: t.name,
        date: t.date,
        time: t.time,
      })),
      ...oldAppointments.map(t => ({
        id: t.id,
        name: t.treatment || "Sin nombre",
        date: t.date,
        time: t.time,
      })),
    ];

    res.json(all);
  } catch (error) {
    console.error("Error al obtener simple appointments:", error);
    res.status(500).json({ error: "Error al obtener simple appointments" });
  }
});


// ✅ Eliminar turno simple (de ambas tablas)
app.delete("/simple-appointments/:id", authenticateToken, async (req, res) => {
  try {
    const id = Number(req.params.id);
    // Intentar borrar de ambas tablas
    await prisma.simpleAppointment.deleteMany({
      where: { id, userId: req.user.id },
    });
    await prisma.appointment.deleteMany({
      where: { id, userId: req.user.id }, // 🔒 seguridad extra
    });
    res.json({ message: "Turno eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar simple appointment:", error);
    res.status(500).json({ error: "Error al eliminar simple appointment" });
  }
});

// ========================= 🚀 SERVIDOR =========================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 MiGabinete corriendo en http://0.0.0.0:${PORT}`);
}).on("error", (err) => {
  console.error("❌ Error al iniciar el servidor:", err.message);
  console.error(err);
});

