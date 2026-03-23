import { Router } from "express";
import * as controller from "./appointments.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import appointmentUpload from "./appointments.upload.js";

const router = Router();

router.get("/", authenticate, controller.getAll);
router.get("/patient/:id", authenticate, controller.getByPatient);
router.get("/:id/photos", authenticate, controller.getPhotos);
router.get("/completed/count", authenticate, controller.getCompletedCount);

router.post("/", authenticate, appointmentUpload, controller.create);
router.put("/:id", authenticate, appointmentUpload, controller.update);
router.delete("/:id", authenticate, controller.remove);

export default router;