import { Expense, Category, Budget } from '../db/models';
import { Op } from 'sequelize';
import { sequelize } from '../config/database.config';
import { redisClient } from '../config/redis.config';
import { CaptchaValidationService } from './captchaValidation.service';
import { EncryptionService } from './encryption.service';
import { parseBulkExpenseXlsx, parseAndValidateDate, BulkRowValidationError } from '../utils/xlsxParser';
import { bulkExpenseRowSchema } from '../validators';
import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs';

export class BulkValidationException extends Error {
  public errors: BulkRowValidationError[];
  constructor(message: string, errors: BulkRowValidationError[]) {
    super(message);
    this.name = 'BulkValidationException';
    this.errors = errors;
  }
}

export class ExpenseService {
  public static async createExpense(userId: number, data: any, file?: Express.Multer.File) {
    const captchaCode = data.captchaText || data.captcha;
    const isCaptchaValid = await CaptchaValidationService.validate(captchaCode, data.captchaId || 'default');
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA verification code.');
    }

    let billUrl: string | null = null;
    let billOriginalName: string | null = null;
    let billMimeType: string | null = null;

    if (file && file.buffer) {
      const encryptedBuffer = EncryptionService.encryptBuffer(file.buffer);
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}.enc`;
      const billsDir = path.join(process.cwd(), 'uploads', 'bills');
      if (!fs.existsSync(billsDir)) {
        fs.mkdirSync(billsDir, { recursive: true });
      }
      const filePath = path.join(billsDir, fileName);
      fs.writeFileSync(filePath, encryptedBuffer);

      billUrl = `/uploads/bills/${fileName}`;
      billOriginalName = file.originalname;
      billMimeType = file.mimetype;
    }

    const paymentMode = data.payment_mode || 'Cash';
    const isCcPayment =
      data.is_cc_payment === true ||
      data.is_cc_payment === 'true' ||
      /credit\s*card\s*bill/i.test(data.name || '');

    const expense = await Expense.create({
      user_id: userId,
      name: data.name,
      amount: parseFloat(data.amount),
      category_id: data.category_id ? parseInt(data.category_id, 10) : null,
      type: data.type,
      expense_date: data.expense_date || dayjs().format('YYYY-MM-DD'),
      bill_url: billUrl,
      bill_original_name: billOriginalName,
      bill_mime_type: billMimeType,
      payment_mode: paymentMode,
      is_settled: paymentMode === 'Credit Card' ? false : true,
    });

    if (isCcPayment) {
      // Wipe out all pending credit card dues for this user
      await Expense.update(
        { is_settled: true },
        {
          where: {
            user_id: userId,
            payment_mode: 'Credit Card',
            is_settled: false,
          },
        },
      );
    }

    return expense;
  }

  public static async bulkCreateExpenses(
    userId: number,
    data: { captcha?: string; captchaText?: string; captchaId?: string | number },
    file?: Express.Multer.File,
  ) {
    const captchaCode = data.captcha || data.captchaText || '';
    const isCaptchaValid = await CaptchaValidationService.validate(captchaCode, data.captchaId || 'default');
    if (!isCaptchaValid) {
      throw new Error('Invalid CAPTCHA verification code.');
    }

    if (!file || !file.buffer) {
      throw new Error('Please upload the filled BULK EXPENSE CREATION TEMPLATE.xlsx file.');
    }

    // 1. Parse rows from the uploaded .xlsx template
    const rawRows = parseBulkExpenseXlsx(file.buffer);

    // 2. Fetch active categories from Category table & ensure "Others" exists as default
    let categories = await Category.findAll({
      where: { delete_flag: false },
    });

    let othersCategory = categories.find(
      (c) => c.name.trim().toLowerCase() === 'others' || c.name.trim().toLowerCase() === 'other',
    );

    if (!othersCategory) {
      othersCategory = await Category.create({
        name: 'Others',
        active_flag: true,
        delete_flag: false,
      });
      categories.push(othersCategory);
      await redisClient.del('categories:master:v2').catch(() => {});
    } else if (!othersCategory.active_flag) {
      othersCategory.active_flag = true;
      await othersCategory.save();
      await redisClient.del('categories:master:v2').catch(() => {});
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
      type: 'Fixed' | 'Variable';
      expense_date: string;
      bill_url: null;
      bill_original_name: null;
      bill_mime_type: null;
    }> = [];

    rawRows.forEach((row, index) => {
      const displaySrNo = row.srNo || String(index + 1);

      // Column 1: Sr. No. validation
      if (row.srNo !== '' && !/^[1-9]\d*$/.test(row.srNo)) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Sr. No.',
          message: `Row ${row.excelRowNumber}: Invalid Sr. No. "${row.srNo}". Must be a positive integer.`,
        });
      }

      // Column 2: Expense Name validation (3 to 100 chars, valid pattern)
      const trimmedName = (row.name || '').trim();
      if (!trimmedName) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Expense Name',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Expense Name is required.`,
        });
      } else if (trimmedName.length < 3 || trimmedName.length > 100) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Expense Name',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". It must be of at least 3 characters and can be of at most 100 characters.`,
        });
      } else if (!/^[a-zA-Z0-9\s_\-\/()]+$/.test(trimmedName)) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Expense Name',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Name "${trimmedName}". Only letters, numbers, spaces, dash, underscore, forward slash, and parentheses are allowed.`,
        });
      }

      // Column 3: Expense Amount validation (>= 1, valid decimal, no scientific notation)
      const trimmedAmount = (row.amount || '').trim();
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
          column: 'Expense Amount',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Amount "${trimmedAmount}". Please enter a valid expense amount greater than or equal to 1.`,
        });
      }

      // Column 4: Expense Category validation (default to "Others" if blank)
      const trimmedCategory = (row.category || '').trim();
      let resolvedCategory: Category | undefined;
      if (!trimmedCategory) {
        resolvedCategory = othersCategory;
      } else {
        resolvedCategory = activeCategoryMap.get(trimmedCategory.toLowerCase());
        if (!resolvedCategory) {
          validationErrors.push({
            excelRowNumber: row.excelRowNumber,
            srNo: displaySrNo,
            column: 'Expense Category',
            message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Category "${trimmedCategory}". Please select a valid category (${activeCategoryNames.join(', ')}).`,
          });
        }
      }

      // Column 5: Expense Type validation ("Variable" or "Fixed")
      const trimmedType = (row.type || '').trim();
      let normalizedType: 'Fixed' | 'Variable' | null = null;
      if (trimmedType.toLowerCase() === 'fixed') {
        normalizedType = 'Fixed';
      } else if (trimmedType.toLowerCase() === 'variable') {
        normalizedType = 'Variable';
      } else {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Expense Type',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Type "${trimmedType}". Please select a valid expense type (Variable or Fixed).`,
        });
      }

      // Column 6: Expense Date validation (DD-MM-YYYY or YYYY-MM-DD)
      const trimmedDate = (row.expenseDate || '').trim();
      const dateCheck = parseAndValidateDate(trimmedDate);
      if (!dateCheck.valid || !dateCheck.normalizedDate) {
        validationErrors.push({
          excelRowNumber: row.excelRowNumber,
          srNo: displaySrNo,
          column: 'Expense Date',
          message: `Row ${row.excelRowNumber} (Sr. No. ${displaySrNo}): Invalid Expense Date "${trimmedDate}". Please enter a valid expense date in either DD-MM-YYYY or YYYY-MM-DD format.`,
        });
      }

      // Secondary Joi schema validation check
      const joiCheck = bulkExpenseRowSchema.validate({
        srNo: row.srNo,
        name: trimmedName,
        amount: parsedAmount,
        category: trimmedCategory || 'Others',
        type: normalizedType || trimmedType,
        expenseDate: dateCheck.normalizedDate || trimmedDate,
      });

      if (!joiCheck.error && resolvedCategory && normalizedType && dateCheck.valid && dateCheck.normalizedDate) {
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
              .join(' | ')}${validationErrors.length > 3 ? ' ...' : ''}`;
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
      path.resolve(process.cwd(), 'templates', 'BULK EXPENSE CREATION TEMPLATE.xlsx'),
      path.resolve(__dirname, '../../templates/BULK EXPENSE CREATION TEMPLATE.xlsx'),
    ];
    const foundPath = candidates.find((p) => fs.existsSync(p));
    if (!foundPath) {
      throw new Error('Bulk expense creation template file not found on server.');
    }
    return {
      filePath: foundPath,
      fileName: 'BULK EXPENSE CREATION TEMPLATE.xlsx',
      buffer: fs.readFileSync(foundPath),
    };
  }

  public static async getUserExpenses(userId: number) {
    return await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['id', 'DESC']],
    });
  }

  public static async getPaginatedUserExpenses(userId: number, payload: any = {}) {
    const page = Math.max(0, parseInt(String(payload.page || 0), 10));
    const size = Math.max(1, Math.min(100, parseInt(String(payload.size || 10), 10)));
    const offset = page * size;

    // Fetch user budgets to resolve default period & available options
    const todayStr = dayjs().format('YYYY-MM-DD');
    const userBudgets = await Budget.findAll({
      where: { user_id: userId },
      order: [
        ['from_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    const activeBudget =
      userBudgets.find((b) => todayStr >= b.from_date && todayStr <= b.to_date) ||
      userBudgets[0] ||
      null;

    const whereConditions: any[] = [{ user_id: userId }];

    // Period / Budget range filtering (Approach 1)
    if (payload.from_date && payload.to_date) {
      whereConditions.push({
        expense_date: {
          [Op.between]: [payload.from_date, payload.to_date],
        },
      });
    } else if (payload.budgetId && payload.budgetId !== 'all') {
      let targetBudget = null;
      if (payload.budgetId === 'active') {
        targetBudget = activeBudget;
      } else {
        const bId = Number(payload.budgetId);
        targetBudget = userBudgets.find((b) => b.id === bId) || null;
      }

      if (targetBudget && targetBudget.from_date && targetBudget.to_date) {
        whereConditions.push({
          expense_date: {
            [Op.between]: [targetBudget.from_date, targetBudget.to_date],
          },
        });
      }
    } else if (payload.from_date) {
      whereConditions.push({
        expense_date: { [Op.gte]: payload.from_date },
      });
    } else if (payload.to_date) {
      whereConditions.push({
        expense_date: { [Op.lte]: payload.to_date },
      });
    } else if (payload.budgetId !== 'all' && activeBudget) {
      // Default to active budget period if not explicitly set to 'all'
      whereConditions.push({
        expense_date: {
          [Op.between]: [activeBudget.from_date, activeBudget.to_date],
        },
      });
    }

    // Global Search Term (debouncedSearch from useAppMRTPagination)
    if (payload.searchTerm && String(payload.searchTerm).trim()) {
      const searchStr = `%${String(payload.searchTerm).trim()}%`;
      whereConditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: searchStr } },
          sequelize.where(sequelize.cast(sequelize.col('Expense.amount'), 'text'), {
            [Op.iLike]: searchStr,
          }),
          sequelize.where(sequelize.col('Category.name'), {
            [Op.iLike]: searchStr,
          }),
          { payment_mode: { [Op.iLike]: searchStr } },
          { type: { [Op.iLike]: searchStr } },
        ],
      });
    }

    // Column Filters (from useAppMRTPagination)
    if (Array.isArray(payload.filters) && payload.filters.length > 0) {
      for (const filter of payload.filters) {
        const { fieldName, value, operator } = filter;
        if (value === undefined || value === null || value === '') continue;

        if (fieldName === 'name') {
          whereConditions.push({ name: { [Op.iLike]: `%${value}%` } });
        } else if (fieldName === 'amount') {
          const numVal = parseFloat(value);
          if (!isNaN(numVal)) {
            if (operator === 'GREATER_THAN') {
              whereConditions.push({ amount: { [Op.gt]: numVal } });
            } else if (operator === 'LESS_THAN') {
              whereConditions.push({ amount: { [Op.lt]: numVal } });
            } else {
              whereConditions.push({ amount: numVal });
            }
          }
        } else if (fieldName === 'Category.name' || fieldName === 'category' || fieldName === 'Category_name') {
          whereConditions.push(
            sequelize.where(sequelize.col('Category.name'), {
              [Op.iLike]: `%${value}%`,
            }),
          );
        } else if (fieldName === 'type') {
          whereConditions.push({ type: { [Op.iLike]: `%${value}%` } });
        } else if (fieldName === 'payment_mode') {
          whereConditions.push({ payment_mode: { [Op.iLike]: `%${value}%` } });
        } else if (fieldName === 'expense_date') {
          whereConditions.push({ expense_date: { [Op.iLike]: `%${value}%` } });
        } else if (fieldName === 'id') {
          const idNum = parseInt(value, 10);
          if (!isNaN(idNum)) {
            whereConditions.push({ id: idNum });
          }
        }
      }
    }

    // Sorting (from useAppMRTPagination)
    const orderClause: any[] = [];
    if (Array.isArray(payload.sorting) && payload.sorting.length > 0) {
      for (const s of payload.sorting) {
        const dir = (s.order || 'asc').toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
        if (s.fieldName === 'Category.name' || s.fieldName === 'category' || s.fieldName === 'Category_name') {
          orderClause.push([Category, 'name', dir]);
        } else if (['id', 'name', 'amount', 'type', 'expense_date', 'payment_mode', 'created_at'].includes(s.fieldName)) {
          orderClause.push([s.fieldName, dir]);
        }
      }
    }
    if (orderClause.length === 0) {
      orderClause.push(['id', 'DESC']);
    }

    const { rows, count } = await Expense.findAndCountAll({
      where: { [Op.and]: whereConditions },
      include: [
        {
          model: Category,
          attributes: ['id', 'name'],
          required: false,
        },
      ],
      order: orderClause,
      limit: size,
      offset,
      distinct: true,
    });

    return {
      rows,
      count,
      page,
      size,
      totalPages: Math.ceil(count / size),
      activeBudget: activeBudget
        ? {
            id: activeBudget.id,
            amount: parseFloat(activeBudget.amount as any),
            from_date: activeBudget.from_date,
            to_date: activeBudget.to_date,
            isActive: todayStr >= activeBudget.from_date && todayStr <= activeBudget.to_date,
          }
        : null,
      availableBudgets: userBudgets.map((b) => ({
        id: b.id,
        amount: parseFloat(b.amount as any),
        from_date: b.from_date,
        to_date: b.to_date,
        isActive: todayStr >= b.from_date && todayStr <= b.to_date,
      })),
    };
  }

  public static async getExpenseBill(userId: number, expenseId: number) {
    const expense = await Expense.findOne({ where: { id: expenseId, user_id: userId } });
    if (!expense || !expense.bill_url) {
      throw new Error('Expense bill not found.');
    }

    const fileName = path.basename(expense.bill_url);
    const filePath = path.join(process.cwd(), 'uploads', 'bills', fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error('Bill file not found on server.');
    }

    const encryptedBuffer = fs.readFileSync(filePath);
    const decryptedBuffer = EncryptionService.decryptBuffer(encryptedBuffer);

    return {
      buffer: decryptedBuffer,
      mimeType: expense.bill_mime_type || 'application/octet-stream',
      originalName: expense.bill_original_name || 'bill-download',
    };
  }

  public static async deleteExpense(userId: number, id: number, _captchaText?: string, _captchaId?: string) {
    const expense = await Expense.findOne({ where: { id, user_id: userId } });
    if (!expense) {
      throw new Error('Expense record not found.');
    }

    if (expense.bill_url) {
      const fileName = path.basename(expense.bill_url);
      const filePath = path.join(process.cwd(), 'uploads', 'bills', fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch {}
      }
    }

    await expense.destroy();
    return { success: true, message: 'Expense record deleted successfully.' };
  }

  public static async attachExpenseBill(userId: number, expenseId: number, file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new Error('No bill file provided.');
    }

    const expense = await Expense.findOne({ where: { id: expenseId, user_id: userId } });
    if (!expense) {
      throw new Error('Expense record not found.');
    }

    if (expense.bill_url) {
      const oldFileName = path.basename(expense.bill_url);
      const oldFilePath = path.join(process.cwd(), 'uploads', 'bills', oldFileName);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch {}
      }
    }

    const encryptedBuffer = EncryptionService.encryptBuffer(file.buffer);
    const ext = path.extname(file.originalname).toLowerCase();
    const fileName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}.enc`;
    const billsDir = path.join(process.cwd(), 'uploads', 'bills');
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

  public static async updateExpense(
    userId: number,
    expenseId: number,
    data: any,
    file?: Express.Multer.File,
  ) {
    const expense = await Expense.findOne({ where: { id: expenseId, user_id: userId } });
    if (!expense) {
      throw new Error('Expense record not found.');
    }

    const captchaCode = data.captchaText || data.captcha;
    if (captchaCode) {
      const isCaptchaValid = await CaptchaValidationService.validate(captchaCode, data.captchaId || 'default');
      if (!isCaptchaValid) {
        throw new Error('Invalid CAPTCHA verification code.');
      }
    }

    // Handle new receipt upload
    if (file && file.buffer) {
      if (expense.bill_url) {
        const oldFileName = path.basename(expense.bill_url);
        const oldFilePath = path.join(process.cwd(), 'uploads', 'bills', oldFileName);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch {}
        }
      }

      const encryptedBuffer = EncryptionService.encryptBuffer(file.buffer);
      const ext = path.extname(file.originalname).toLowerCase();
      const fileName = `bill-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}.enc`;
      const billsDir = path.join(process.cwd(), 'uploads', 'bills');
      if (!fs.existsSync(billsDir)) {
        fs.mkdirSync(billsDir, { recursive: true });
      }
      const filePath = path.join(billsDir, fileName);
      fs.writeFileSync(filePath, encryptedBuffer);

      expense.bill_url = `/uploads/bills/${fileName}`;
      expense.bill_original_name = file.originalname;
      expense.bill_mime_type = file.mimetype;
    } else if (data.remove_bill === true || data.remove_bill === 'true') {
      if (expense.bill_url) {
        const oldFileName = path.basename(expense.bill_url);
        const oldFilePath = path.join(process.cwd(), 'uploads', 'bills', oldFileName);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch {}
        }
      }
      expense.bill_url = null;
      expense.bill_original_name = null;
      expense.bill_mime_type = null;
    }

    if (data.name !== undefined) expense.name = data.name;
    if (data.amount !== undefined) expense.amount = parseFloat(data.amount);
    if (data.category_id !== undefined) {
      expense.category_id = data.category_id ? parseInt(data.category_id, 10) : null;
    }
    if (data.type !== undefined) expense.type = data.type;
    if (data.expense_date !== undefined) expense.expense_date = data.expense_date;
    if (data.payment_mode !== undefined) {
      expense.payment_mode = data.payment_mode;
      if (expense.payment_mode === 'Credit Card' && data.is_settled === undefined) {
        expense.is_settled = false;
      }
    }
    if (data.is_settled !== undefined) {
      expense.is_settled = data.is_settled === true || data.is_settled === 'true';
    }

    const isCcPayment =
      data.is_cc_payment === true ||
      data.is_cc_payment === 'true' ||
      /credit\s*card\s*bill/i.test(expense.name || '');

    if (isCcPayment) {
      // Wipe out all pending credit card dues for this user
      await Expense.update(
        { is_settled: true },
        {
          where: {
            user_id: userId,
            payment_mode: 'Credit Card',
            is_settled: false,
          },
        },
      );
    }

    await expense.save();

    return await Expense.findOne({
      where: { id: expense.id },
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });
  }
}
