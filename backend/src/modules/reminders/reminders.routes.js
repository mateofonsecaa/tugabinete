import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import * as ctrl from "./reminders.controller.js";

const router = Router();

// LISTAR
router.get("/", authenticate, ctrl.list);

// CREAR
router.post("/", authenticate, ctrl.create);

// ELIMINAR
router.delete("/:id", authenticate, ctrl.remove);

export default router;
