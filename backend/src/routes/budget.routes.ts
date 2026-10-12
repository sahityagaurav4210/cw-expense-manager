import { Router } from "express";
import { BudgetController } from "../controllers/budget.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, BudgetController.setBudget);
router.get("/", authMiddleware, BudgetController.getBudgets);
router.post("/:id/inflow", authMiddleware, BudgetController.addInflow);

export default router;
