import { Router } from "express";
import { authenticate } from "../../core/middlewares/authenticate.js";
import { createSale, listSales, deleteSale, updateSale} from "./sales.controller.js";

const router = Router();

router.get("/", authenticate, listSales);
router.post("/", authenticate, createSale);
router.put("/:id", authenticate, updateSale);
router.delete("/:id", authenticate, deleteSale);

export default router;