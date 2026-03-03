const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4000",
  "https://tugabinete.com",
  "https://tugabinete.pages.dev"
];

export const corsConfig = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // permitir Postman, server-to-server

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
};