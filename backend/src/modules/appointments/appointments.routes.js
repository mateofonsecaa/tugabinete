import { Router } from "express";
import * as controller from "./appointments.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";

const router = Router();

// Paginado liviano
router.get("/", authenticate, controller.getAll);

// Por paciente (también paginado)
router.get("/patient/:id", authenticate, controller.getByPatient);

// Solo fotos del tratamiento
router.get("/:id/photos", authenticate, controller.getPhotos);

// Crear
router.post("/", authenticate, controller.create);

// Editar
router.put("/:id", authenticate, controller.update);

// Eliminar
router.delete("/:id", authenticate, controller.remove);

router.get("/completed/count", authenticate, controller.getCompletedCount);


export default router;
