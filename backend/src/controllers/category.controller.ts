import { Request, Response } from "express";
import { CategoryService } from "../services/category.service";
import { categorySchema } from "../validators";

export class CategoryController {
  public static async getAll(req: Request, res: Response) {
    try {
      const categories = await CategoryService.getAllCategories();
      return res.status(200).json({ status: "success", data: categories });
    } catch (err) {
      return res.status(500).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async create(req: Request, res: Response) {
    try {
      const { error, value } = categorySchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const category = await CategoryService.createCategory(value);
      return res.status(201).json({ status: "success", message: "Category created successfully.", data: category });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async toggleActive(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { captchaText, captchaId } = req.body;
      if (!captchaText) {
        return res.status(400).json({ status: "error", message: "CAPTCHA text is required." });
      }

      const updated = await CategoryService.toggleActiveStatus(parseInt(id, 10), captchaText, captchaId);
      return res.status(200).json({ status: "success", message: "Category active status toggled.", data: updated });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { captchaText, captchaId } = req.body;
      if (!captchaText) {
        return res.status(400).json({ status: "error", message: "CAPTCHA text is required." });
      }

      const result = await CategoryService.deleteCategory(parseInt(id, 10), captchaText, captchaId);
      return res.status(200).json({ status: "success", message: result.message });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}
