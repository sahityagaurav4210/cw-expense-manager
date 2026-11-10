import { Router } from "express";
import { PaymentOptionController } from "../controllers/paymentOption.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", PaymentOptionController.getAll);
router.post("/", authMiddleware, PaymentOptionController.create);
router.patch("/:id/toggle", authMiddleware, PaymentOptionController.toggleActive);
router.post("/:id/delete", authMiddleware, PaymentOptionController.delete);

export default router;
