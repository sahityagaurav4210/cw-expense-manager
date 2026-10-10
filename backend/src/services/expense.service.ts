import { Expense, Category } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import dayjs from "dayjs";

export class ExpenseService {
  public static async createExpense(userId: number, data: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(data.captchaText, data.captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const expense = await Expense.create({
      user_id: userId,
      name: data.name,
      amount: parseFloat(data.amount),
      category_id: data.category_id ? parseInt(data.category_id, 10) : null,
      type: data.type,
      expense_date: data.expense_date || dayjs().format("YYYY-MM-DD"),
    });

    return expense;
  }

  public static async getUserExpenses(userId: number) {
    return await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["expense_date", "DESC"]],
    });
  }

  public static async deleteExpense(userId: number, id: number, captchaText: string, captchaId?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(captchaText, captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const expense = await Expense.findOne({ where: { id, user_id: userId } });
    if (!expense) {
      throw new Error("Expense record not found.");
    }

    await expense.destroy();
    return { success: true, message: "Expense record deleted successfully." };
  }
}
