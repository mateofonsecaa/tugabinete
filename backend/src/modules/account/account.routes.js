import { Router } from "express";
import * as controller from "./account.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { createRateLimit } from "../../core/middlewares/rateLimit.js";
import avatarUpload from "../../core/middlewares/uploadAvatar.js";

const router = Router();

// Rate limit para las modificaciones del perfil.
// Permite hasta 15 solicitudes por minuto por usuario (o por IP si no está autenticado).

const profileRateLimit = createRateLimit({
  windowMs: 60 * 1000,
  max: 15,
  keyGenerator: (req) => `account-profile:${req.user?.id || req.ip}`,
  message: "Demasiados intentos de actualización. Esperá un momento.",
});

// Rate limit para las operaciones relacionadas con el avatar.
// Limita a 10 cambios cada 10 minutos.

const avatarRateLimit = createRateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `account-avatar:${req.user?.id || req.ip}`,
  message: "Demasiados cambios de avatar. Esperá unos minutos.",
});

// Rate limit para operaciones sensibles como cambiar email,
// contraseña o cerrar otras sesiones.

const sensitiveRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyGenerator: (req) => `account-sensitive:${req.user?.id || req.ip}`,
  message: "Demasiados intentos. Esperá unos minutos e intentá nuevamente.",
});

router.get("/", authenticate, controller.getAccount);

router.patch("/profile", authenticate, profileRateLimit, controller.updateProfile);

router.put(
  "/avatar",
  authenticate,
  avatarRateLimit,
  avatarUpload.single("avatar"),
  controller.updateAvatar
);

router.delete("/avatar", authenticate, avatarRateLimit, controller.deleteAvatar);

router.put(
  "/email/request-change",
  authenticate,
  sensitiveRateLimit,
  controller.requestEmailChange
);

router.get("/email/confirm/:token", controller.confirmEmailChange);

router.put(
  "/password",
  authenticate,
  sensitiveRateLimit,
  controller.changePassword
);

router.post(
  "/sessions/logout-others",
  authenticate,
  sensitiveRateLimit,
  controller.logoutOtherSessions
);

export default router;