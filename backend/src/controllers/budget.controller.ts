import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { BudgetService } from "../services/budget.service";
import { budgetSchema } from "../validators";

export class BudgetController {
  public static async setBudget(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });

      const { error, value } = budgetSchema.validate(req.body);
      if (error) {
        return res
          .status(400)
          .json({ status: "error", message: error.details[0].message });
      }

      const budget = await BudgetService.setBudget(userId, value);
      return res
        .status(201)
        .json({
          status: "success",
          message: "Budget allocated successfully.",
          data: budget,
        });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async getBudgets(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });

      const budgets = await BudgetService.getUserBudgets(userId);
      return res.status(200).json({ status: "success", data: budgets });
    } catch (err) {
      return res
        .status(500)
        .json({ status: "error", message: (err as Error).message });
    }
  }

  public static async addInflow(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId)
        return res
          .status(401)
          .json({ status: "error", message: "Unauthorized" });

      const { id } = req.params;
      const { amount, source, received_date, notes, captchaText, captchaId } =
        req.body;

      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "Valid inflow amount greater than 0 is required.",
          });
      }

      if (!source || !source.trim()) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "Source description of received amount is required.",
          });
      }

      const result = await BudgetService.addBudgetInflow(
        userId,
        parseInt(id, 10),
        {
          amount,
          source,
          received_date,
          notes,
          captchaText,
          captchaId,
        },
      );

      return res.status(201).json({
        status: "success",
        message: "Income top-up added to current budget successfully.",
        data: result,
      });
    } catch (err) {
      return res
        .status(400)
        .json({ status: "error", message: (err as Error).message });
    }
  }
}
