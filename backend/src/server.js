import "dotenv/config";
import * as appModule from "./app.js";

const app = appModule.default ?? appModule.app;

if (!app) {
  throw new Error("app.js no exporta default ni export { app }");
}

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend escuchando en http://0.0.0.0:${PORT}`);
});
