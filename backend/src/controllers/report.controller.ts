import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ReportService } from "../services/report.service";

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
}
