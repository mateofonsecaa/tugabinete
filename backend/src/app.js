import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes.js";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

// Necesario para ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================================
   CORS COMPLETO + PREVENTIVO
   =============================================== */
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://gleeful-moxie-181612.netlify.app",
  "https://tugabinete.com",
  "https://www.tugabinete.com",
  "https://tugabinete.pages.dev"
];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }

  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Authorization, Content-Type");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
});

/* ===============================================
   Seguridad + Logs (API)
   =============================================== */
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(morgan("dev"));

/* ===============================================
   Parsers (API)
   =============================================== */
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

/* ===============================================
   Archivos estáticos UPLOADS
   =============================================== */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* ===============================================
   Healthcheck (Render / monitoreo)
   =============================================== */
app.get("/api/health", (req, res) => {
  res.status(200).json({ ok: true, service: "tugabinete-backend" });
});

/* ===============================================
   Rutas API
   =============================================== */
app.use("/api", routes);

/* ===============================================
   Error Handler
   =============================================== */
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "Error inesperado",
  });
});

// Manejo de errores Multer (tamaño, etc.)
app.use((err, req, res, next) => {
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res
      .status(413)
      .json({ error: "La imagen supera el tamaño máximo permitido." });
  }
  return next(err);
});

export default app;
