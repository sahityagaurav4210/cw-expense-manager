import { Router } from "express";
import { ReportController } from "../controllers/report.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

router.get("/expenditure-summary", authMiddleware, ReportController.getExpenditureSummary);
router.get("/statement/preview", authMiddleware, ReportController.getStatementPreview);
router.get("/statement/download", authMiddleware, ReportController.downloadStatementPdf);
router.get("/payment-modes/summary", authMiddleware, ReportController.getPaymentModesSummary);
router.get("/payment-modes/preview", authMiddleware, ReportController.getPaymentModesPreview);
router.get("/payment-modes/download", authMiddleware, ReportController.downloadPaymentModesPdf);
router.get("/financial-year/summary", authMiddleware, ReportController.getFinancialYearSummary);
router.get("/financial-year/preview", authMiddleware, ReportController.getFinancialYearPreview);
router.get("/financial-year/download", authMiddleware, ReportController.downloadFinancialYearPdf);

export default router;
