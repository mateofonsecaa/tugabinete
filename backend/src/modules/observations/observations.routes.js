import { Router } from "express";
import * as controller from "./observations.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";

const router = Router();

router.get("/:patientId", authenticate, controller.getByPatient);
router.post("/", authenticate, controller.upsert);

export default router;
