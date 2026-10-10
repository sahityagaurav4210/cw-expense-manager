import { Router } from "express";
import { ExpenseController } from "../controllers/expense.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", authMiddleware, ExpenseController.create);
router.get("/", authMiddleware, ExpenseController.getAll);
router.post("/:id/delete", authMiddleware, ExpenseController.delete);

export default router;
