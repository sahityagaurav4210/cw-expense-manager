import { Debt, DebtSettlement, Expense, Category, Budget, BudgetInflow } from "../models";
import { sequelize } from "../config/database.config";
import { CaptchaValidationService } from "./captchaValidation.service";
import { Op } from "sequelize";
import dayjs from "dayjs";

export class DebtService {
  public static async createDebt(userId: number, data: any) {
    const captchaCode = data.captchaText || data.captcha;
    const isCaptchaValid = await CaptchaValidationService.validate(
      captchaCode,
      data.captchaId || "default"
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const initialAmount = parseFloat(String(data.initial_amount));
    if (isNaN(initialAmount) || initialAmount <= 0) {
      throw new Error("Please enter a valid amount greater than 0.");
    }

    const debt = await Debt.create({
      user_id: userId,
      type: data.type === "BORROWED" ? "BORROWED" : "LENT",
      person_name: String(data.person_name).trim(),
      contact_info: data.contact_info ? String(data.contact_info).trim() : null,
      initial_amount: parseFloat(initialAmount.toFixed(2)),
      settled_amount: 0,
      lent_date: data.lent_date || dayjs().format("YYYY-MM-DD"),
      due_date: data.due_date || null,
      status: "PENDING",
      notes: data.notes ? String(data.notes).trim() : null,
    });

    return debt;
  }

  public static async getUserDebts(userId: number) {
    const debts = await Debt.findAll({
      where: { user_id: userId },
      include: [
        {
          model: DebtSettlement,
          as: "settlements",
        },
      ],
      order: [
        ["id", "DESC"],
        [{ model: DebtSettlement, as: "settlements" }, "id", "DESC"],
      ],
    });

    const today = dayjs().format("YYYY-MM-DD");
    let totalLent = 0;
    let totalRecovered = 0;
    let totalPendingReceivable = 0;
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let totalPendingPayable = 0;
    let overdueCount = 0;

    const formattedDebts = debts.map((d) => {
      const plain = d.get({ plain: true }) as any;
      const initial = parseFloat(String(plain.initial_amount || 0));
      const settled = parseFloat(String(plain.settled_amount || 0));
      const balance = Math.max(0, parseFloat((initial - settled).toFixed(2)));
      const isOverdue =
        Boolean(plain.due_date) &&
        plain.due_date < today &&
        plain.status !== "SETTLED" &&
        plain.status !== "WRITTEN_OFF" &&
        balance > 0;

      if (plain.type === "LENT") {
        totalLent += initial;
        totalRecovered += settled;
        if (plain.status !== "SETTLED" && plain.status !== "WRITTEN_OFF") {
          totalPendingReceivable += balance;
        }
      } else {
        totalBorrowed += initial;
        totalRepaid += settled;
        if (plain.status !== "SETTLED" && plain.status !== "WRITTEN_OFF") {
          totalPendingPayable += balance;
        }
      }

      if (isOverdue) {
        overdueCount += 1;
      }

      return {
        ...plain,
        initial_amount: initial,
        settled_amount: settled,
        balance_amount: balance,
        is_overdue: isOverdue,
      };
    });

    return {
      debts: formattedDebts,
      summary: {
        totalLent: parseFloat(totalLent.toFixed(2)),
        totalRecovered: parseFloat(totalRecovered.toFixed(2)),
        totalPendingReceivable: parseFloat(totalPendingReceivable.toFixed(2)),
        totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
        totalRepaid: parseFloat(totalRepaid.toFixed(2)),
        totalPendingPayable: parseFloat(totalPendingPayable.toFixed(2)),
        overdueCount,
      },
    };
  }

  public static async addSettlement(userId: number, debtId: number, data: any) {
    const captchaCode = data.captchaText || data.captcha;
    const isCaptchaValid = await CaptchaValidationService.validate(
      captchaCode,
      data.captchaId || "default"
    );
    if (!isCaptchaValid) {
      throw new Error("Invalid CAPTCHA verification code.");
    }

    const debt = await Debt.findOne({ where: { id: debtId, user_id: userId } });
    if (!debt) {
      throw new Error("Debt / Receivable record not found.");
    }

    if (debt.status === "SETTLED" || debt.status === "WRITTEN_OFF") {
      throw new Error(
        `This record is already marked as ${debt.status.replace("_", " ")}.`
      );
    }

    const initialAmount = parseFloat(String(debt.initial_amount || 0));
    const currentSettled = parseFloat(String(debt.settled_amount || 0));
    const remainingBalance = parseFloat((initialAmount - currentSettled).toFixed(2));
    const paymentAmount = parseFloat(String(data.amount));

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new Error("Please enter a valid settlement amount greater than 0.");
    }

    if (paymentAmount > remainingBalance + 0.001) {
      throw new Error(
        `Settlement amount (₹${paymentAmount.toLocaleString(
          "en-IN"
        )}) cannot exceed remaining balance (₹${remainingBalance.toLocaleString(
          "en-IN"
        )}).`
      );
    }

    const newSettled = parseFloat((currentSettled + paymentAmount).toFixed(2));
    const newStatus =
      newSettled >= initialAmount - 0.001 ? "SETTLED" : "PARTIALLY_SETTLED";

    const result = await sequelize.transaction(async (t) => {
      const settlement = await DebtSettlement.create(
        {
          debt_id: debt.id,
          user_id: userId,
          amount: parseFloat(paymentAmount.toFixed(2)),
          settlement_date: data.settlement_date || dayjs().format("YYYY-MM-DD"),
          payment_mode: data.payment_mode || "UPI",
          notes: data.notes ? String(data.notes).trim() : null,
        },
        { transaction: t }
      );

      debt.settled_amount = newSettled;
      debt.status = newStatus;
      await debt.save({ transaction: t });

      // If user has lended the money (type === "LENT"), record this payment as a Budget Inflow!
      if (debt.type === "LENT") {
        const today = dayjs();
        const settlementDate = data.settlement_date || today.format("YYYY-MM-DD");
        const startOfMonth = today.startOf("month").format("YYYY-MM-DD");
        const endOfMonth = today.endOf("month").format("YYYY-MM-DD");

        let budget = await Budget.findOne({
          where: {
            user_id: userId,
            from_date: { [Op.lte]: settlementDate },
            to_date: { [Op.gte]: settlementDate },
          },
          transaction: t,
        });

        if (!budget) {
          budget = await Budget.findOne({
            where: { user_id: userId },
            order: [["from_date", "DESC"], ["created_at", "DESC"]],
            transaction: t,
          });
        }

        if (!budget) {
          budget = await Budget.create(
            {
              user_id: userId,
              amount: parseFloat(paymentAmount.toFixed(2)),
              from_date: startOfMonth,
              to_date: endOfMonth,
            },
            { transaction: t }
          );
        } else {
          const currentAmount = parseFloat(String(budget.amount || 0));
          budget.amount = parseFloat((currentAmount + paymentAmount).toFixed(2));
          await budget.save({ transaction: t });
        }

        const source = `Debt Recovery: ${debt.person_name}`;
        const inflowNotes = data.notes
          ? `${data.notes} (Mode: ${data.payment_mode || "UPI"})`
          : `Recovery payment received from ${debt.person_name} (${data.payment_mode || "UPI"})`;

        await BudgetInflow.create(
          {
            budget_id: budget.id,
            user_id: userId,
            amount: parseFloat(paymentAmount.toFixed(2)),
            source,
            received_date: settlementDate,
            notes: inflowNotes,
          },
          { transaction: t }
        );
      }

      return { debt, settlement };
    });

    return result;
  }

  public static async writeOffDebt(
    userId: number,
    debtId: number,
    recordAsExpense: boolean = true
  ) {
    const debt = await Debt.findOne({ where: { id: debtId, user_id: userId } });
    if (!debt) {
      throw new Error("Debt / Receivable record not found.");
    }

    if (debt.status === "SETTLED" || debt.status === "WRITTEN_OFF") {
      throw new Error("This record is already settled or written off.");
    }

    const initialAmount = parseFloat(String(debt.initial_amount || 0));
    const currentSettled = parseFloat(String(debt.settled_amount || 0));
    const unrecoveredBalance = parseFloat(
      Math.max(0, initialAmount - currentSettled).toFixed(2)
    );

    await sequelize.transaction(async (t) => {
      debt.status = "WRITTEN_OFF";
      await debt.save({ transaction: t });

      // If this was money lent (LENT) and user chose to log unrecovered amount as an expense
      if (debt.type === "LENT" && recordAsExpense && unrecoveredBalance >= 1) {
        let othersCat = await Category.findOne({
          where: { name: "Others", delete_flag: false },
          transaction: t,
        });
        if (!othersCat) {
          othersCat = await Category.create(
            {
              name: "Others",
              active_flag: true,
              delete_flag: false,
            },
            { transaction: t }
          );
        }

        const safeName = `Bad Debt WriteOff ${debt.person_name}`
          .replace(/[^a-zA-Z0-9\s_\-\/]/g, "")
          .trim()
          .slice(0, 100);

        await Expense.create(
          {
            user_id: userId,
            category_id: othersCat.id,
            name: safeName.length >= 3 ? safeName : "Bad Debt WriteOff",
            amount: unrecoveredBalance,
            type: "Variable",
            expense_date: dayjs().format("YYYY-MM-DD"),
          },
          { transaction: t }
        );
      }
    });

    return debt;
  }

  public static async deleteDebt(userId: number, debtId: number) {
    const debt = await Debt.findOne({ where: { id: debtId, user_id: userId } });
    if (!debt) {
      throw new Error("Debt / Receivable record not found.");
    }
    await debt.destroy();
    return { success: true, message: "Record deleted successfully." };
  }
}
