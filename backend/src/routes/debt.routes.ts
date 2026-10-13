import { Router } from "express";
import { DebtController } from "../controllers/debt.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", authMiddleware, DebtController.getDebts);
router.post("/", authMiddleware, DebtController.createDebt);
router.post("/:id/settle", authMiddleware, DebtController.addSettlement);
router.post("/:id/write-off", authMiddleware, DebtController.writeOffDebt);
router.post("/:id/delete", authMiddleware, DebtController.deleteDebt);

export default router;
