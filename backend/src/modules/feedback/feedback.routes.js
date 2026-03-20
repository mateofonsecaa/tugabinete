import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { createRateLimit } from "../../core/middlewares/rateLimit.js";
import feedbackUpload from "./feedback.upload.js";
import * as controller from "./feedback.controller.js";

const router = Router();

const createFeedbackRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  max: 6,
  keyGenerator: (req) => `feedback:create:user:${req.user?.id || req.ip}`,
  message: "Hiciste demasiados envíos en poco tiempo. Esperá unos minutos e intentá nuevamente.",
  code: "FEEDBACK_CREATE_RATE_LIMITED",
});

const voteFeedbackRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  keyGenerator: (req) => `feedback:vote:user:${req.user?.id || req.ip}`,
  message: "Demasiadas acciones de voto en poco tiempo. Esperá un momento e intentá nuevamente.",
  code: "FEEDBACK_VOTE_RATE_LIMITED",
});

router.post("/", authenticate, createFeedbackRateLimit, feedbackUpload.single("attachment"), controller.create);
router.get("/", authenticate, controller.listPublic);
router.post("/:id/vote", authenticate, voteFeedbackRateLimit, controller.vote);
router.delete("/:id/vote", authenticate, voteFeedbackRateLimit, controller.unvote);

export default router;