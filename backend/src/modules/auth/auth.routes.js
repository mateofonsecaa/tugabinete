import { Router } from "express";
import * as controller from "./auth.controller.js";
import verifyToken from "./verifyToken.js";
import upload from "../../core/middlewares/upload.js";

const router = Router();

router.post("/register", controller.register);
router.post("/resend-verification", controller.resendVerification);
router.post("/login", controller.login);
router.get("/verify/:token", controller.verifyEmail);

// Obtener usuario actual
router.get("/me", verifyToken, controller.me);

// Editar perfil (datos + imagen)
router.put(
  "/edit-profile",
  verifyToken,
  upload.single("profileImage"),
  controller.updateProfile
);

export default router;