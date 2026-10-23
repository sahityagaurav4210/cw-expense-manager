import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/expenditure-summary", authMiddleware, ReportController.getExpenditureSummary);
router.get("/statement/preview", authMiddleware, ReportController.getStatementPreview);
router.get("/statement/download", authMiddleware, ReportController.downloadStatementPdf);

export default router;
