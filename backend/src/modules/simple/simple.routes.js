import { Router } from "express";
import * as controller from "./simple.controller.js";
import { authenticate } from "../../core/middlewares/authenticate.js";

const router = Router();

router.get("/", authenticate, controller.getAll);
router.post("/", authenticate, controller.create);
router.put("/:id", authenticate, controller.update);
router.delete("/:id", authenticate, controller.remove);

export default router;
