import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { createSale, listSales } from "./sales.controller.js";

const router = Router();

router.get("/", authenticate, listSales);
router.post("/", authenticate, createSale);

export default router;
