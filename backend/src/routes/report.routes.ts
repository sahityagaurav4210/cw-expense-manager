import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/expenditure-summary", authMiddleware, ReportController.getExpenditureSummary);

export default router;
