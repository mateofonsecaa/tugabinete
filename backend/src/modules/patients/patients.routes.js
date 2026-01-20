import { Router } from "express";
import * as controller from "./patients.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";

const router = Router();

// Obtener todos los pacientes
router.get("/", authenticate, controller.getAll);

// Obtener paciente completo
router.get("/:id", authenticate, controller.getById);

// Crear paciente
router.post("/", authenticate, controller.create);

// Actualizar paciente
router.put("/:id", authenticate, controller.update);

// Eliminar paciente
router.delete("/:id", authenticate, controller.remove);

export default router;
