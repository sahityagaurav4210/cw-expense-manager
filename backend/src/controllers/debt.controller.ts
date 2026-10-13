import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { DebtService } from "../services/debt.service";
import { debtSchema, debtSettlementSchema } from "../validators";

export class DebtController {
  public static async createDebt(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const { error, value } = debtSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ status: "error", message: error.details[0].message });
      }

      const debt = await DebtService.createDebt(userId, value);
      return res.status(201).json({
        status: "success",
        message: `${
          value.type === "BORROWED" ? "Borrowed debt" : "Lent receivable"
        } recorded successfully.`,
        data: debt,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async getDebts(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const result = await DebtService.getUserDebts(userId);
      return res.status(200).json({
        status: "success",
        data: result.debts,
        summary: result.summary,
      });
    } catch (err) {
      return res
        .status(500)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async addSettlement(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const debtId = parseInt(req.params.id, 10);
      if (isNaN(debtId)) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid record ID." });
      }

      const { error, value } = debtSettlementSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ status: "error", message: error.details[0].message });
      }

      const result = await DebtService.addSettlement(userId, debtId, value);
      return res.status(201).json({
        status: "success",
        message: "Settlement payment recorded successfully.",
        data: result,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async writeOffDebt(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const debtId = parseInt(req.params.id, 10);
      if (isNaN(debtId)) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid record ID." });
      }

      const recordAsExpense =
        req.body?.recordAsExpense !== undefined
          ? Boolean(req.body.recordAsExpense)
          : true;

      const debt = await DebtService.writeOffDebt(
        userId,
        debtId,
        recordAsExpense
      );
      return res.status(200).json({
        status: "success",
        message:
          recordAsExpense && debt.type === "LENT"
            ? "Record written off and unrecovered balance logged as an expense."
            : "Record marked as written off.",
        data: debt,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async deleteDebt(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ status: "error", message: "Unauthorized" });
      }

      const debtId = parseInt(req.params.id, 10);
      if (isNaN(debtId)) {
        return res
          .status(400)
          .json({ status: "error", message: "Invalid record ID." });
      }

      const result = await DebtService.deleteDebt(userId, debtId);
      return res.status(200).json({
        status: "success",
        message: result.message,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }
}
