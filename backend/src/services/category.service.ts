import { Category } from "../models";
import { redisClient } from "../config/redis.config";
import { CaptchaValidationService } from "./captchaValidation.service";
import { logger } from "../config/logger.config";

const REDIS_CATEGORY_KEY = "categories:master";

export class CategoryService {
  public static async getAllCategories() {
    // Try Redis cache first
    try {
      const cached = await redisClient.get(REDIS_CATEGORY_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`Redis category fetch failed: ${(err as Error).message}`);
    }

    const categories = await Category.findAll({
      where: { delete_flag: false },
      order: [["name", "ASC"]],
    });

    try {
      await redisClient.set(REDIS_CATEGORY_KEY, JSON.stringify(categories), "EX", 3600);
    } catch {}

    return categories;
  }

  public static async createCategory(data: any) {
    const isCaptchaValid = await CaptchaValidationService.validate(data.captchaText, data.captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const category = await Category.create({
      name: data.name,
      active_flag: data.active_flag !== undefined ? data.active_flag : true,
      delete_flag: false,
    });

    await redisClient.del(REDIS_CATEGORY_KEY).catch(() => {});
    return category;
  }

  public static async toggleActiveStatus(id: number, captchaText: string, captchaId?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(captchaText, captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const category = await Category.findByPk(id);
    if (!category || category.delete_flag) {
      throw new Error("Category not found.");
    }

    category.active_flag = !category.active_flag;
    await category.save();

    await redisClient.del(REDIS_CATEGORY_KEY).catch(() => {});
    return category;
  }

  public static async deleteCategory(id: number, captchaText: string, captchaId?: string) {
    const isCaptchaValid = await CaptchaValidationService.validate(captchaText, captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const category = await Category.findByPk(id);
    if (!category) {
      throw new Error("Category not found.");
    }

    category.delete_flag = true;
    category.active_flag = false;
    await category.save();

    await redisClient.del(REDIS_CATEGORY_KEY).catch(() => {});
    return { success: true, message: "Category marked as deleted." };
  }
}
