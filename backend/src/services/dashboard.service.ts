import { Expense, Budget, Category, Debt, User, BudgetInflow } from "../models";
import dayjs from "dayjs";

export class DashboardService {
  public static async getDashboardMetrics(userId: number, monthYear?: string) {
    const targetMonth = monthYear || dayjs().format("YYYY-MM");
    const startOfMonth = `${targetMonth}-01`;
    const endOfMonth = dayjs(startOfMonth).endOf("month").format("YYYY-MM-DD");
    const daysInMonth = dayjs(startOfMonth).daysInMonth() || 30;

    // Fetch user details for report branding
    const userRecord = await User.findByPk(userId, {
      attributes: ["id", "name", "email", "employment_type", "phone_no", "annual_income"],
    });
    const userProfile = userRecord
      ? {
          name: userRecord.name,
          email: userRecord.email,
          employment_type: userRecord.employment_type,
          phone_no: userRecord.phone_no,
          annual_income: userRecord.annual_income !== null && userRecord.annual_income !== undefined ? Number(userRecord.annual_income) : null,
        }
      : null;

    // Fetch user's latest budget
    const budgetRecord = await Budget.findOne({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
    const monthlyIncome = budgetRecord
      ? parseFloat(budgetRecord.amount as any)
      : 0;

    // Fetch user expenses
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    // Filter current month expenses
    const monthlyExpenses = expenses.filter((e) => {
      const expDate = e.expense_date
        ? dayjs(e.expense_date).format("YYYY-MM")
        : dayjs(e.created_at).format("YYYY-MM");
      return expDate === targetMonth;
    });

    let totalExpenseIncurred = 0;
    let fixedExpensesTotal = 0;
    let variableExpensesTotal = 0;

    monthlyExpenses.forEach((e) => {
      const amt = parseFloat(e.amount as any);
      totalExpenseIncurred += amt;
      if (e.type === "Fixed") {
        fixedExpensesTotal += amt;
      } else {
        variableExpensesTotal += amt;
      }
    });

    totalExpenseIncurred = parseFloat(totalExpenseIncurred.toFixed(2));
    fixedExpensesTotal = parseFloat(fixedExpensesTotal.toFixed(2));
    variableExpensesTotal = parseFloat(variableExpensesTotal.toFixed(2));

    const amountMoneyLeft = Math.max(0, parseFloat((monthlyIncome - totalExpenseIncurred).toFixed(2)));

    // Group expenses by category
    const categoryBreakdownMap: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      const categoryName = (e as any).Category?.name || "Not Defined";
      categoryBreakdownMap[categoryName] =
        (categoryBreakdownMap[categoryName] || 0) + parseFloat(e.amount as any);
    });

    const categoryBreakdown = Object.keys(categoryBreakdownMap).map((cat) => ({
      category: cat,
      amount: parseFloat(categoryBreakdownMap[cat].toFixed(2)),
      percentage:
        totalExpenseIncurred > 0
          ? parseFloat(
              (
                (categoryBreakdownMap[cat] / totalExpenseIncurred) *
                100
              ).toFixed(2),
            )
          : 0,
    })).sort((a, b) => b.amount - a.amount);

    // Detailed Itemized Expenses List (Sorted latest to earliest)
    const expensesList = monthlyExpenses
      .sort((a, b) => {
        const dateA = a.expense_date || a.created_at;
        const dateB = b.expense_date || b.created_at;
        return dayjs(dateB).valueOf() - dayjs(dateA).valueOf();
      })
      .map((e) => ({
        id: e.id,
        name: e.name,
        amount: parseFloat(e.amount as any),
        type: e.type,
        category: (e as any).Category?.name || "General",
        expense_date: e.expense_date || dayjs(e.created_at).format("YYYY-MM-DD"),
        hasReceipt: Boolean(e.bill_url),
        bill_url: e.bill_url,
      }));

    // Inflows for target month
    const allInflows = await BudgetInflow.findAll({
      where: { user_id: userId },
      order: [["received_date", "DESC"]],
    }).catch(() => []);

    const monthlyInflows = (allInflows || [])
      .filter((inf) => {
        const infDate = inf.received_date
          ? dayjs(inf.received_date).format("YYYY-MM")
          : dayjs(inf.created_at).format("YYYY-MM");
        return infDate === targetMonth;
      })
      .map((inf) => ({
        id: inf.id,
        source: inf.source,
        amount: parseFloat(inf.amount as any),
        received_date: inf.received_date || dayjs(inf.created_at).format("YYYY-MM-DD"),
        notes: inf.notes,
      }));

    // Fetch user debts & receivables for KPI metrics
    const debts = await Debt.findAll({
      where: { user_id: userId },
      order: [["lent_date", "DESC"]],
    }).catch(() => []);

    const today = dayjs().format("YYYY-MM-DD");
    let totalLent = 0;
    let totalRecovered = 0;
    let totalPendingReceivable = 0;
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let totalPendingPayable = 0;
    let overdueReceivablesCount = 0;

    const debtsList = (debts || []).map((d) => {
      const initial = parseFloat(String(d.initial_amount || 0));
      const settled = parseFloat(String(d.settled_amount || 0));
      const balance = Math.max(0, parseFloat((initial - settled).toFixed(2)));
      const isOverdue =
        Boolean(d.due_date) &&
        (d.due_date as string) < today &&
        d.status !== "SETTLED" &&
        d.status !== "WRITTEN_OFF" &&
        balance > 0;

      if (d.type === "LENT") {
        totalLent += initial;
        totalRecovered += settled;
        if (d.status !== "SETTLED" && d.status !== "WRITTEN_OFF") {
          totalPendingReceivable += balance;
          if (isOverdue) overdueReceivablesCount += 1;
        }
      } else {
        totalBorrowed += initial;
        totalRepaid += settled;
        if (d.status !== "SETTLED" && d.status !== "WRITTEN_OFF") {
          totalPendingPayable += balance;
        }
      }

      return {
        id: d.id,
        type: d.type,
        person_name: d.person_name,
        contact_info: d.contact_info,
        initial_amount: initial,
        settled_amount: settled,
        balance,
        lent_date: d.lent_date,
        due_date: d.due_date,
        status: d.status,
        isOverdue,
      };
    });

    const debtsSummary = {
      totalLent: parseFloat(totalLent.toFixed(2)),
      totalRecovered: parseFloat(totalRecovered.toFixed(2)),
      totalPendingReceivable: parseFloat(totalPendingReceivable.toFixed(2)),
      totalBorrowed: parseFloat(totalBorrowed.toFixed(2)),
      totalRepaid: parseFloat(totalRepaid.toFixed(2)),
      totalPendingPayable: parseFloat(totalPendingPayable.toFixed(2)),
      overdueReceivablesCount,
    };

    // Financial Analytics
    const budgetUsagePercent =
      monthlyIncome > 0
        ? parseFloat(((totalExpenseIncurred / monthlyIncome) * 100).toFixed(1))
        : 0;

    const savingsRate =
      monthlyIncome > 0
        ? parseFloat(((amountMoneyLeft / monthlyIncome) * 100).toFixed(1))
        : 0;

    const dailyAverageExpense = parseFloat((totalExpenseIncurred / daysInMonth).toFixed(2));

    return {
      monthlyIncome,
      totalExpenseIncurred,
      amountMoneyLeft,
      fixedExpensesTotal,
      variableExpensesTotal,
      targetMonth,
      categoryBreakdown,
      expenseCount: monthlyExpenses.length,
      expensesList,
      monthlyInflows,
      debtsList,
      userProfile,
      budgetDateRange: budgetRecord
        ? { from: budgetRecord.from_date, to: budgetRecord.to_date }
        : null,
      pendingReceivables: parseFloat(totalPendingReceivable.toFixed(2)),
      pendingPayables: parseFloat(totalPendingPayable.toFixed(2)),
      debtsSummary,
      analytics: {
        budgetUsagePercent,
        savingsRate,
        dailyAverageExpense,
        daysInMonth,
      },
    };
  }
}
