console.log("DATABASE_URL:", process.env.DATABASE_URL);
console.log("POSTGRES_URL:", process.env.POSTGRES_URL);
console.log("POSTGRES_PRISMA_URL:", process.env.POSTGRES_PRISMA_URL);
console.log("POSTGRES_CONNECTION_STRING:", process.env.POSTGRES_CONNECTION_STRING);

import app from "./app.js";
import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log("API running on", PORT));

app.listen(PORT, "0.0.0.0", () => {
console.log(`🚀 Backend MiGabinete escuchando en http://0.0.0.0:${PORT}`);
});
