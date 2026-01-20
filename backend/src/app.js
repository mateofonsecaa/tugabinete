import cors from "cors";

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5500",
  "https://tugabinete.com",
  "https://www.tugabinete.com",
  // si querés permitir tu Netlify temporal:
  "https://gleeful-moxie-181612.netlify.app",
];

const corsOptions = {
  origin: (origin, cb) => {
    // Permite requests sin Origin (Postman, server-to-server)
    if (!origin) return cb(null, true);

    if (allowedOrigins.includes(origin)) return cb(null, true);

    return cb(null, false); // no setea headers CORS -> el browser lo bloquea
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
export default app;
export { app };