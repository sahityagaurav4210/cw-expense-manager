import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {
  public static async getMetrics(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      let monthYear = req.query.month as string | string[];
      if (Array.isArray(monthYear)) monthYear = monthYear[0];
      const metrics = await DashboardService.getDashboardMetrics(userId, monthYear);

      return res.status(200).json({ status: "success", data: metrics });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }
}
