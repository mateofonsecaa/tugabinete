import express from "express";
import auth from "../../core/middlewares/auth.js";
import { upload } from "./upload.service.js";
import {
  uploadProfileImage,
  uploadPatientImage,
  uploadTreatmentImage
} from "./upload.controller.js";

const router = express.Router();

router.post("/profile", auth, upload.single("file"), uploadProfileImage);
router.post("/patient", auth, upload.single("file"), uploadPatientImage);
router.post("/treatment", auth, upload.single("file"), uploadTreatmentImage);

export default router;
