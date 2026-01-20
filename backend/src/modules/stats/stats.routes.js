import { Router } from "express";
import * as controller from "./stats.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, controller.getStats);

export default router;
