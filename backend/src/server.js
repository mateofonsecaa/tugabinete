import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

const PORT = process.env.PORT || 4000;

// Opcional: log para debug (podés borrar después)
console.log("PORT:", PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✅ set" : "❌ missing");

app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Backend MiGabinete escuchando en http://0.0.0.0:${PORT}`);
});
