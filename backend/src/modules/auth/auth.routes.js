import { Router } from "express";
import * as controller from "./auth.controller.js";
import verifyToken from "./verifyToken.js";
import upload from "../../core/middlewares/upload.js";
import { createRateLimit } from "../../core/middlewares/rateLimit.js";
import { normalizeEmail } from "./auth.validation.js";

const router = Router();

const forgotPasswordIpRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `forgot-password:ip:${req.ip}`,
  message:
    "Demasiados intentos. Esperá unos minutos antes de volver a solicitar el restablecimiento.",
});

const forgotPasswordIdentifierRateLimit = createRateLimit({
  windowMs: 30 * 60 * 1000,
  max: 5,
  keyGenerator: (req) =>
    `forgot-password:email:${normalizeEmail(req.body?.email || "") || "empty"}`,
  message:
    "Demasiadas solicitudes para este correo. Esperá unos minutos e intentá nuevamente.",
});

const resetPasswordValidateRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  keyGenerator: (req) => `reset-password-validate:ip:${req.ip}`,
  message:
    "Demasiadas validaciones del enlace. Esperá unos minutos e intentá nuevamente.",
});

const resetPasswordSubmitRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `reset-password-submit:ip:${req.ip}`,
  message:
    "Demasiados intentos de restablecimiento. Esperá unos minutos e intentá nuevamente.",
});

router.post("/register", controller.register);
router.post("/resend-verification", controller.resendVerification);
router.post("/login", controller.login);
router.get("/verify/:token", controller.verifyEmail);

router.post(
  "/forgot-password",
  forgotPasswordIpRateLimit,
  forgotPasswordIdentifierRateLimit,
  controller.forgotPassword
);

router.post(
  "/reset-password/validate",
  resetPasswordValidateRateLimit,
  controller.validateResetToken
);

router.post(
  "/reset-password",
  resetPasswordSubmitRateLimit,
  controller.resetPassword
);

router.get("/me", verifyToken, controller.me);

router.put(
  "/edit-profile",
  verifyToken,
  upload.single("profileImage"),
  controller.updateProfile
);

export default router;