import { Budget } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";

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
      order: [["from_date", "DESC"]],
    });
  }

  public static async getLatestBudget(userId: number) {
    return await Budget.findOne({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
  }
}
