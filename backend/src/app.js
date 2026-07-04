import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import cookieParser from "cookie-parser";
import routes from "./routes.js";

const app = express();

// Variable de entorno para saber si estamos en producción
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);

// Separamos los orígenes locales
const localOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
];

// Dejamos solo los dominios reales en producción
// NOTA VITAL: Asegúrate de que los links de Netlify/Pages sigan siendo tuyos y no hayan caducado
const prodOrigins = [
  "https://tugabinete.com",
  "https://www.tugabinete.com",
  "https://api.tugabinete.com",
  "https://tugabinete.pages.dev",
  "https://gleeful-moxie-181612.netlify.app",
];

// Construimos la lista dinámicamente según el entorno
const allowedOrigins = isProd ? prodOrigins : [...localOrigins, ...prodOrigins];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // 🛡️ BLINDAJE DE RED (PASO 3): Rechazo silencioso. 
      // Al pasar 'false', CORS bloquea la petición a nivel de navegador sin lanzar un Error 500
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Authorization", "Content-Type"],
  })
);

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));
app.use(cookieParser());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "tugabinete-backend" });
});

app.use("/api", routes);

app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "La imagen supera el tamaño máximo permitido.",
      code: "FILE_TOO_LARGE",
    });
  }

  return next(err);
});

app.use((err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.status || 500).json({
    error: err.message || "Error inesperado",
    code: err.code || "INTERNAL_ERROR",
  });
});

export default app;