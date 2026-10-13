import { Expense, Category } from "../models";
import { sequelize } from "../config/database.config";
import { redisClient } from "../config/redis.config";
import { CaptchaValidationService } from "./captchaValidation.service";
import { EncryptionService } from "./encryption.service";
import {
  parseBulkExpenseXlsx,
  parseAndValidateDate,
  BulkRowValidationError,
} from "../utils/xlsxParser";
import { bulkExpenseRowSchema } from "../validators";
import dayjs from "dayjs";
import path from "path";
import fs from "fs";

export class BulkValidationException extends Error {
  public errors: BulkRowValidationError[];
  constructor(message: string, errors: BulkRowValidationError[]) {
    super(message);
    this.name = "BulkValidationException";
    this.errors = errors;
  }
}

export class ExpenseService {
  public static async createExpense(userId: number, data: any, file?: Express.Multer.File) {
    const captchaCode = data.captchaText || data.captcha;
    const isCaptchaValid = await CaptchaValidationService.validate(captchaCode, data.captchaId || "default");
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

  public static async bulkCreateExpenses(
    userId: number,
    data: { captcha?: string; captchaText?: string; captchaId?: string | number },
    file?: Express.Multer.File
  ) {
    const captchaCode = data.captcha || data.captchaText || "";
    const isCaptchaValid = await CaptchaValidationService.validate(
      captchaCode,
      data.captchaId || "default"
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    if (!file || !file.buffer) {
      throw new Error("Please upload the filled BULK EXPENSE CREATION TEMPLATE.xlsx file.");
    }

    // 1. Parse rows from the uploaded .xlsx template
    const rawRows = parseBulkExpenseXlsx(file.buffer);

    // 2. Fetch active categories from Category table & ensure "Others" exists as default
    let categories = await Category.findAll({
      where: { delete_flag: false },
    });

    let othersCategory = categories.find(
      (c) => c.name.trim().toLowerCase() === "others" || c.name.trim().toLowerCase() === "other"
    );

    if (!othersCategory) {
      othersCategory = await Category.create({
        name: "Others",
        active_flag: true,
        delete_flag: false,
      });
      categories.push(othersCategory);
      await redisClient.del("categories:master:v2").catch(() => {});
    } else if (!othersCategory.active_flag) {
      othersCategory.active_flag = true;
      await othersCategory.save();
      await redisClient.del("categories:master:v2").catch(() => {});
    }

    const activeCategoryMap = new Map<string, Category>();
    const activeCategoryNames: string[] = [];
    for (const cat of categories) {
      if (cat.active_flag && !cat.delete_flag) {
        activeCategoryMap.set(cat.name.trim().toLowerCase(), cat);
        activeCategoryNames.push(cat.name.trim());
      }
    }

    // 3. Validate all columns across all rows before inserting
    const validationErrors: BulkRowValidationError[] = [];
    const recordsToCreate: Array<{
      user_id: number;
      category_id: number | null;
      name: string;
      amount: number;
      type: "Fixed" | "Variable";
      expense_date: string;
      bill_url: null;
      bill_original_name: null;
      bill_mime_type: null;
    }> = [];

    rawRows.forEach((row, index) => {
      const displaySrNo = row.srNo || String(index + 1);

      // Column 1: Sr. No. validation
      if (row.srNo !== "" && !/^[1-9]\d*$/.test(row.srNo)) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Sr. No.",
          message: `Row ${row.excelRowNumber}: Invalid Sr. No. "${row.srNo}". Must be a positive integer.`,
        });
      }

      // Column 2: Expense Name validation (3 to 100 chars, valid pattern)
      const trimmedName = (row.name || "").trim();
      if (!trimmedName) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Name",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Expense Name is required.`,
        });
      } else if (trimmedName.length < 3 || trimmedName.length > 100) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Name",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". It must be of at least 3 characters and can be of at most 100 characters.`,
        });
      } else if (!/^[a-zA-Z0-9\s_\-\/]+$/.test(trimmedName)) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Name",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". Only letters, numbers, spaces, dash, underscore, and forward slash are allowed.`,
        });
      }

      // Column 3: Expense Amount validation (>= 1, valid decimal, no scientific notation)
      const trimmedAmount = (row.amount || "").trim();
      const parsedAmount = Number(trimmedAmount);
      if (
        !trimmedAmount ||
        /[eE]/.test(trimmedAmount) ||
        isNaN(parsedAmount) ||
        !isFinite(parsedAmount) ||
        parsedAmount < 1 ||
        parsedAmount > 9999999999.99
      ) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Amount",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Amount "${trimmedAmount}". Please enter a valid expense amount greater than or equal to 1.`,
        });
      }

      // Column 4: Expense Category validation (default to "Others" if blank)
      const trimmedCategory = (row.category || "").trim();
      let resolvedCategory: Category | undefined;
      if (!trimmedCategory) {
        resolvedCategory = othersCategory;
      } else {
        resolvedCategory = activeCategoryMap.get(trimmedCategory.toLowerCase());
        if (!resolvedCategory) {
          validationErrors.push({
            excelRowNumber: row.excelRowNumber,
            srNo: displaySrNo,
            column: "Expense Category",
            message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Category "${trimmedCategory}". Please select a valid category (${activeCategoryNames.join(", ")}).`,
          });
        }
      }

      // Column 5: Expense Type validation ("Variable" or "Fixed")
      const trimmedType = (row.type || "").trim();
      let normalizedType: "Fixed" | "Variable" | null = null;
      if (trimmedType.toLowerCase() === "fixed") {
        normalizedType = "Fixed";
      } else if (trimmedType.toLowerCase() === "variable") {
        normalizedType = "Variable";
      } else {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Type",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Type "${trimmedType}". Please select a valid expense type (Variable or Fixed).`,
        });
      }

      // Column 6: Expense Date validation (DD-MM-YYYY or YYYY-MM-DD)
      const trimmedDate = (row.expenseDate || "").trim();
      const dateCheck = parseAndValidateDate(trimmedDate);
      if (!dateCheck.valid || !dateCheck.normalizedDate) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: "Expense Date",
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Date "${trimmedDate}". Please enter a valid expense date in either DD-MM-YYYY or YYYY-MM-DD format.`,
        });
      }

      // Secondary Joi schema validation check
      const joiCheck = bulkExpenseRowSchema.validate({
        srNo: row.srNo,
        name: trimmedName,
        amount: parsedAmount,
        category: trimmedCategory || "Others",
        type: normalizedType || trimmedType,
        expenseDate: dateCheck.normalizedDate || trimmedDate,
      });

      if (
        !joiCheck.error &&
        resolvedCategory &&
        normalizedType &&
        dateCheck.valid &&
        dateCheck.normalizedDate
      ) {
        recordsToCreate.push({
          user_id: userId,
          category_id: resolvedCategory.id,
          name: trimmedName,
          amount: parseFloat(parsedAmount.toFixed(2)),
          type: normalizedType,
          expense_date: dateCheck.normalizedDate,
          bill_url: null,
          bill_original_name: null,
          bill_mime_type: null,
        });
      }
    });

    if (validationErrors.length > 0) {
      const summaryMsg =
        validationErrors.length === 1
          ? validationErrors[0].message
          : `Template validation failed with ${validationErrors.length} error(s): ${validationErrors
              .slice(0, 3)
              .map((e) => e.message)
              .join(" | ")}${validationErrors.length > 3 ? " ..." : ""}`;
      throw new BulkValidationException(summaryMsg, validationErrors);
    }

    // 4. Insert all validated expenses in one go inside a transaction
    const createdExpenses = await sequelize.transaction(async (t) => {
      return await Expense.bulkCreate(recordsToCreate, {
        transaction: t,
        validate: true,
        returning: true,
      });
    });

    return createdExpenses;
  }

  public static getBulkTemplateFile() {
    const candidates = [
      path.resolve(process.cwd(), "templates", "BULK EXPENSE CREATION TEMPLATE.xlsx"),
      path.resolve(__dirname, "../../templates/BULK EXPENSE CREATION TEMPLATE.xlsx"),
    ];
    const foundPath = candidates.find((p) => fs.existsSync(p));
    if (!foundPath) {
      throw new Error("Bulk expense creation template file not found on server.");
    }
    return {
      filePath: foundPath,
      fileName: "BULK EXPENSE CREATION TEMPLATE.xlsx",
      buffer: fs.readFileSync(foundPath),
    };
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

  public static async deleteExpense(userId: number, id: number, _captchaText?: string, _captchaId?: string) {
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

