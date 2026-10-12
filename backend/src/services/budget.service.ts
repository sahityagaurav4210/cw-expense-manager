import { Budget, BudgetInflow } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export class BudgetService {
  public static async setBudget(userId: number, data: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(data.captchaText, data.captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const budget = await Budget.create({
      user_id: userId,
      amount: parseFloat(data.amount),
      from_date: data.from_date,
      to_date: data.to_date,
    });

    return budget;
  }

  public static async getUserBudgets(userId: number) {
    return await Budget.findAll({
      where: { user_id: userId },
      include: [
        {
          model: BudgetInflow,
          as: "inflows",
        },
      ],
      order: [["from_date", "DESC"]],
    });
  }

  public static async getLatestBudget(userId: number) {
    return await Budget.findOne({
      where: { user_id: userId },
      include: [
        {
          model: BudgetInflow,
          as: "inflows",
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  public static async addBudgetInflow(userId: number, budgetId: number, data: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(data.captchaText, data.captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const budget = await Budget.findOne({ where: { id: budgetId, user_id: userId } });
    if (!budget) {
      throw new Error("Budget record not found.");
    }

    // Strict current-month check: historical budgets are closed
    const today = dayjs();
    const currentMonthKey = today.format("YYYY-MM");
    const budgetMonthKey = dayjs(budget.from_date).format("YYYY-MM");
    const isCurrent =
      budgetMonthKey === currentMonthKey ||
      today.isBetween(dayjs(budget.from_date), dayjs(budget.to_date), "day", "[]");

    if (!isCurrent) {
      throw new Error("Changes are strictly restricted to the current month's budget. Historical budgets cannot be modified.");
    }

    const inflowAmount = parseFloat(data.amount);
    if (isNaN(inflowAmount) || inflowAmount <= 0) {
      throw new Error("Inflow amount must be a positive number.");
    }

    const receivedDate = data.received_date || today.format("YYYY-MM-DD");
    if (dayjs(receivedDate).isAfter(today, "day")) {
      throw new Error("Received date cannot be in the future.");
    }

    if (!data.source || !data.source.trim()) {
      throw new Error("Source of received amount is required (e.g. Received from Person, Bonus, Gift).");
    }

    const inflow = await BudgetInflow.create({
      budget_id: budget.id,
      user_id: userId,
      amount: inflowAmount,
      source: data.source.trim(),
      received_date: receivedDate,
      notes: data.notes ? data.notes.trim() : null,
    });

    // Update total effective budget amount
    const currentAmount = parseFloat(budget.amount as any || 0);
    budget.amount = parseFloat((currentAmount + inflowAmount).toFixed(2));
    await budget.save();

    return {
      inflow,
      updatedBudget: budget,
    };
  }
}
