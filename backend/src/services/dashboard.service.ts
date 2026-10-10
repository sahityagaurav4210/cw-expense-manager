import { Expense, Budget, Category } from "../models";
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
    const monthlyIncome = budgetRecord ? parseFloat(budgetRecord.amount as any) : 0;

    // Fetch user expenses
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ["id", "name"] }],
    });

    // Filter current month expenses
    const monthlyExpenses = expenses.filter((e) => {
      const expDate = e.expense_date ? dayjs(e.expense_date).format("YYYY-MM") : dayjs(e.created_at).format("YYYY-MM");
      return expDate === targetMonth;
    });

    const totalExpenseIncurred = monthlyExpenses.reduce((sum, e) => sum + parseFloat(e.amount as any), 0);
    const amountMoneyLeft = Math.max(0, monthlyIncome - totalExpenseIncurred);

    // Group expenses by category
    const categoryBreakdownMap: { [key: string]: number } = {};
    monthlyExpenses.forEach((e) => {
      const categoryName = (e as any).Category?.name || "Not Defined";
      categoryBreakdownMap[categoryName] = (categoryBreakdownMap[categoryName] || 0) + parseFloat(e.amount as any);
    });

    const categoryBreakdown = Object.keys(categoryBreakdownMap).map((cat) => ({
      category: cat,
      amount: categoryBreakdownMap[cat],
      percentage: totalExpenseIncurred > 0 ? parseFloat(((categoryBreakdownMap[cat] / totalExpenseIncurred) * 100).toFixed(2)) : 0,
    }));

    return {
      monthlyIncome,
      totalExpenseIncurred,
      amountMoneyLeft,
      targetMonth,
      categoryBreakdown,
      expenseCount: monthlyExpenses.length,
      budgetDateRange: budgetRecord ? { from: budgetRecord.from_date, to: budgetRecord.to_date } : null,
    };
  }
}
