import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import * as controller from "./files.controller.js";

const router = Router();

router.get("/private/:fileId/access", authenticate, controller.getPrivateFileAccess);

export default router;