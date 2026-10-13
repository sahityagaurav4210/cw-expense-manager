import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import { ExpenseService, BulkValidationException } from "../services/expense.service";
import { expenseSchema, bulkExpenseRequestSchema } from "../validators";

export class ExpenseController {
  public static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { error, value } = expenseSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const expense = await ExpenseService.createExpense(userId, value, req.file);
      return res.status(201).json({ status: "success", message: "Expense record created.", data: expense });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async bulkCreate(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { error, value } = bulkExpenseRequestSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ status: "error", message: error.details[0].message });
      }

      const filesArray = Array.isArray(req.files) ? req.files : [];
      const uploadedFile = req.file || filesArray[0];

      if (!uploadedFile) {
        return res.status(400).json({
          status: "error",
          message: "Please attach the filled BULK EXPENSE CREATION TEMPLATE.xlsx file.",
        });
      }

      const createdExpenses = await ExpenseService.bulkCreateExpenses(userId, value, uploadedFile);
      return res.status(201).json({
        status: "success",
        message: `${createdExpenses.length} expense record(s) created in bulk successfully.`,
        count: createdExpenses.length,
        data: createdExpenses,
      });
    } catch (err) {
      if (err instanceof BulkValidationException) {
        return res.status(400).json({
          status: "error",
          message: err.message,
          errors: err.errors,
        });
      }
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async downloadBulkTemplate(req: AuthenticatedRequest, res: Response) {
    try {
      const result = ExpenseService.getBulkTemplateFile();
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${result.fileName}"`
      );
      res.setHeader("Content-Length", result.buffer.length);
      return res.end(result.buffer);
    } catch (err) {
      return res.status(404).json({ status: "error", message: (err as Error).message });
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

  public static async downloadBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { id } = req.params;
      const result = await ExpenseService.getExpenseBill(userId, parseInt(id, 10));

      res.setHeader("Content-Type", result.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${result.originalName}"`);
      res.setHeader("Content-Length", result.buffer.length);
      res.setHeader("Accept-Ranges", "bytes");
      return res.end(result.buffer);
    } catch (err) {
      return res.status(404).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async delete(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { id } = req.params;
      const result = await ExpenseService.deleteExpense(userId, parseInt(id, 10));
      return res.status(200).json({ status: "success", message: result.message });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }

  public static async uploadBill(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ status: "error", message: "Unauthorized" });

      const { id } = req.params;
      if (!req.file) {
        return res.status(400).json({ status: "error", message: "Please provide a bill file." });
      }

      const updated = await ExpenseService.attachExpenseBill(userId, parseInt(id, 10), req.file);
      return res.status(200).json({
        status: "success",
        message: "Bill file uploaded and attached successfully.",
        data: updated,
      });
    } catch (err) {
      return res.status(400).json({ status: "error", message: (err as Error).message });
    }
  }
}

