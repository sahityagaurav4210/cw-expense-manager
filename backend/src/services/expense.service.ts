import { Expense, Category } from "../models";
import { CaptchaValidationService } from "./captchaValidation.service";
import { EncryptionService } from "./encryption.service";
import dayjs from "dayjs";
import path from "path";
import fs from "fs";

export class ExpenseService {
  public static async createExpense(userId: number, data: any, file?: Express.Multer.File) {
    const isCaptchaValid = await CaptchaValidationService.validate(data.captchaText, data.captchaId || "default");
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    let billUrl: string | null = null;
    let billOriginalName: string | null = null;
    let billMimeType: string | null = null;

    if (file && file.buffer) {
      const encryptedBuffer = EncryptionService.encryptBuffer(file.buffer);
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}.enc`;
      const billsDir = path.join(process.cwd(), "uploads", "bills");
      if (!fs.existsSync(billsDir)) {
        fs.mkdirSync(billsDir, { recursive: true });
      }
      const filePath = path.join(billsDir, fileName);
      fs.writeFileSync(filePath, encryptedBuffer);

      billUrl = `/uploads/bills/${fileName}`;
      billOriginalName = file.originalname;
      billMimeType = file.mimetype;
    }

    const expense = await Expense.create({
      user_id: userId,
      name: data.name,
      amount: parseFloat(data.amount),
      category_id: data.category_id ? parseInt(data.category_id, 10) : null,
      type: data.type,
      expense_date: data.expense_date || dayjs().format("YYYY-MM-DD"),
      bill_url: billUrl,
      bill_original_name: billOriginalName,
      bill_mime_type: billMimeType,
    });

    return expense;
  }

  public static async getUserExpenses(userId: number) {
    return await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["id", "DESC"]],
    });
  }

  public static async getExpenseBill(userId: number, expenseId: number) {
    const expense = await Expense.findOne({ where: { id: expenseId, user_id: userId } });
    if (!expense || !expense.bill_url) {
      throw new Error("Expense bill not found.");
    }

    const fileName = path.basename(expense.bill_url);
    const filePath = path.join(process.cwd(), "uploads", "bills", fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error("Bill file not found on server.");
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = EncryptionService.decryptBuffer(encryptedBuffer);

    return {
      buffer: decryptedBuffer,
      mimeType: expense.bill_mime_type || "application/octet-stream",
      originalName: expense.bill_original_name || "bill-download",
    };
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

    if (expense.bill_url) {
      const fileName = path.basename(expense.bill_url);
      const filePath = path.join(process.cwd(), "uploads", "bills", fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }

    await expense.destroy();
    return { success: true, message: "Expense record deleted successfully." };
  }

  public static async attachExpenseBill(userId: number, expenseId: number, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error("No bill file provided.");
    }

    const expense = await Expense.findOne({ where: { id: expenseId, user_id: userId } });
    if (!expense) {
      throw new Error("Expense record not found.");
    }

    if (expense.bill_url) {
      const oldFileName = path.basename(expense.bill_url);
      const oldFilePath = path.join(process.cwd(), "uploads", "bills", oldFileName);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {}
      }
    }

    const encryptedBuffer = EncryptionService.encryptBuffer(file.buffer);
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}.enc`;
    const billsDir = path.join(process.cwd(), "uploads", "bills");
    if (!fs.existsSync(billsDir)) {
      fs.mkdirSync(billsDir, { recursive: true });
    }
    const filePath = path.join(billsDir, fileName);
    fs.writeFileSync(filePath, encryptedBuffer);

    expense.bill_url = `/uploads/bills/${fileName}`;
    expense.bill_original_name = file.originalname;
    expense.bill_mime_type = file.mimetype;
    await expense.save();

    return expense;
  }
}
