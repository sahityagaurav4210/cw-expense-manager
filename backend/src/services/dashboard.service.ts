import { Expense, Budget, Category, Debt } from "../models";
import dayjs from "dayjs";

export class DashboardService {
  public static async getDashboardMetrics(userId: number, monthYear?: string) {
    const targetMonth = monthYear || dayjs().format("YYYY-MM");
    const startOfMonth = `${targetMonth}-01`;
    const endOfMonth = dayjs(startOfMonth).endOf("month").format("YYYY-MM-DD");

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

    const totalExpenseIncurred = monthlyExpenses.reduce(
      (sum, e) => sum + parseFloat(e.amount as any),
      0,
    );
    const amountMoneyLeft = Math.max(0, monthlyIncome - totalExpenseIncurred);

    // Group expenses by category
    const categoryBreakdownMap: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      const categoryName = (e as any).Category?.name || "Not Defined";
      categoryBreakdownMap[categoryName] =
        (categoryBreakdownMap[categoryName] || 0) + parseFloat(e.amount as any);
    });

    const categoryBreakdown = Object.keys(categoryBreakdownMap).map((cat) => ({
      category: cat,
      amount: categoryBreakdownMap[cat],
      percentage:
        totalExpenseIncurred > 0
          ? parseFloat(
              (
                (categoryBreakdownMap[cat] / totalExpenseIncurred) *
                100
              ).toFixed(2),
            )
          : 0,
    }));

    // Fetch user debts & receivables for KPI metrics
    const debts = await Debt.findAll({
      where: { user_id: userId },
    });

    const today = dayjs().format("YYYY-MM-DD");
    let totalLent = 0;
    let totalRecovered = 0;
    let totalPendingReceivable = 0;
    let totalBorrowed = 0;
    let totalRepaid = 0;
    let totalPendingPayable = 0;
    let overdueReceivablesCount = 0;

    debts.forEach((d) => {
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

    return {
      monthlyIncome,
      totalExpenseIncurred,
      amountMoneyLeft,
      targetMonth,
      categoryBreakdown,
      expenseCount: monthlyExpenses.length,
      budgetDateRange: budgetRecord
        ? { from: budgetRecord.from_date, to: budgetRecord.to_date }
        : null,
      pendingReceivables: parseFloat(totalPendingReceivable.toFixed(2)),
      pendingPayables: parseFloat(totalPendingPayable.toFixed(2)),
      debtsSummary,
    };
  }
}
