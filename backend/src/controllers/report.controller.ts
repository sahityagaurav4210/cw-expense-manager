import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ReportService } from "../services/report.service";
import { PdfReportService } from "../services/pdfReport.service";

export class ReportController {
  public static async getExpenditureSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const { duration, startDate, endDate } = req.query;

      const summary = await ReportService.getExpenditureSummary(userId, {
        duration: duration as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      return res.status(200).json({
        status: "success",
        data: summary,
      });
    } catch (err) {
      return res.status(500).json({
        status: "error",
        message: (err as Error).message || "Failed to retrieve expenditure reports.",
      });
    }
  }

  /**
   * Generates and returns the rendered HTML statement stream for preview
   */
  public static async getStatementPreview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const month = (req.query.month as string) || undefined;
      const { html } = await PdfReportService.generateRenderedHtml(userId, month);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Generates and streams the formal PDF statement download from the backend
   */
  public static async downloadStatementPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const month = (req.query.month as string) || undefined;
      const isDownload = req.query.download === "true";
      const disposition = isDownload ? "attachment" : "inline";

      const result = await PdfReportService.generatePdfBuffer(userId, month);

      res.setHeader("Content-Type", result.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${result.filename}"`);
      res.setHeader("Content-Length", result.buffer.length);
      return res.end(result.buffer);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Retrieves current or specified month's payment mode spending breakdown
   */
  public static async getPaymentModesSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const month = (req.query.month as string) || undefined;
      const data = await ReportService.getPaymentModesSummary(userId, month);

      return res.status(200).json({ status: "success", data });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Generates and returns rendered HTML preview for Payment Modes report
   */
  public static async getPaymentModesPreview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const month = (req.query.month as string) || undefined;
      const { html } = await PdfReportService.generatePaymentModesRenderedHtml(userId, month);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Generates and streams PDF download for Payment Modes report
   */
  public static async downloadPaymentModesPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const month = (req.query.month as string) || undefined;
      const isDownload = req.query.download === "true";
      const disposition = isDownload ? "attachment" : "inline";

      const result = await PdfReportService.generatePaymentModesPdfBuffer(userId, month);

      res.setHeader("Content-Type", result.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${result.filename}"`);
      res.setHeader("Content-Length", result.buffer.length);
      return res.end(result.buffer);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Retrieves comprehensive annual financial year summary
   */
  public static async getFinancialYearSummary(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const year = (req.query.year as string) || (req.query.financialYear as string) || undefined;
      const data = await ReportService.getFinancialYearSummary(userId, year);

      return res.status(200).json({ status: "success", data });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Generates and returns rendered HTML preview for Financial Year report
   */
  public static async getFinancialYearPreview(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const year = (req.query.year as string) || (req.query.financialYear as string) || undefined;
      const { html } = await PdfReportService.generateFinancialYearRenderedHtml(userId, year);

      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  /**
   * Generates and streams PDF download for Financial Year report
   */
  public static async downloadFinancialYearPdf(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const year = (req.query.year as string) || (req.query.financialYear as string) || undefined;
      const isDownload = req.query.download === "true";
      const disposition = isDownload ? "attachment" : "inline";

      const result = await PdfReportService.generateFinancialYearPdfBuffer(userId, year);

      res.setHeader("Content-Type", result.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `${disposition}; filename="${result.filename}"`);
      res.setHeader("Content-Length", result.buffer.length);
      return res.end(result.buffer);
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }
}

