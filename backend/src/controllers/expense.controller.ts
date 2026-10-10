import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ExpenseService } from "../services/expense.service";
import { expenseSchema } from "../validators";

export class ExpenseController {
  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { error, value } = expenseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const expense = await ExpenseService.createExpense(userId, value);
      return res.status(201).json({ status: "success", message: "Expense record created.", data: expense });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async getAll(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const expenses = await ExpenseService.getUserExpenses(userId);
      return res.status(200).json({ status: "success", data: expenses });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { id } = req.params;
      const { captchaText, captchaId } = req.body;
      if (!captchaText) {
        return res.status(400).json({ status: "error", message: "CAPTCHA text is required." });
      }

      const result = await ExpenseService.deleteExpense(userId, parseInt(id, 10), captchaText, captchaId);
      return res.status(200).json({ status: "success", message: result.message });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}
