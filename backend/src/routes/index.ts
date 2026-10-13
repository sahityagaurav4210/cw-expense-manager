import { Router } from "express";
import authRoutes from "./auth.routes";
import categoryRoutes from "./category.routes";
import budgetRoutes from "./budget.routes";
import expenseRoutes from "./expense.routes";
import dashboardRoutes from "./dashboard.routes";
import appRoutes from "./app.routes";
import userRoutes from "./user.routes";
import reportRoutes from "./report.routes";
import debtRoutes from "./debt.routes";
import contactRoutes from "./contact.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/categories", categoryRoutes);
router.use("/budgets", budgetRoutes);
router.use("/expenses", expenseRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/app", appRoutes);
router.use("/users", userRoutes);
router.use("/reports", reportRoutes);
router.use("/debts", debtRoutes);
router.use("/contacts", contactRoutes);

export default router;
