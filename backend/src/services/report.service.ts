import { Expense, Category } from "../models";
import dayjs from "dayjs";
import { Op } from "sequelize";

export interface MonthlyReportItem {
  month: string; // YYYY-MM
  monthName: string; // e.g. "October 2026"
  totalExpenditure: number;
  expenseCount: number;
  isCurrentMonth: boolean;
  isLastMonth: boolean;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  comparison?: {
    previousMonthAmount: number;
    percentChange: number;
    isHigher: boolean;
    isLower: boolean;
    isEqual: boolean;
    differenceAmount: number;
  };
}

export class ReportService {
  public static async getExpenditureSummary(
    userId: number,
    options: {
      duration?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<{
    items: MonthlyReportItem[];
    currentMonthComparison: MonthlyReportItem["comparison"] | null;
  }> {
    const now = dayjs();
    const currentMonthKey = now.format("YYYY-MM");
    const lastMonthKey = now.subtract(1, "month").format("YYYY-MM");

    let monthsList: string[] = [];

    const duration = options.duration || "last_3_months";

    if (duration === "custom" && options.startDate && options.endDate) {
      let cur = dayjs(options.startDate).startOf("month");
      const end = dayjs(options.endDate).startOf("month");

      while (cur.isBefore(end) || cur.isSame(end, "month")) {
        monthsList.push(cur.format("YYYY-MM"));
        cur = cur.add(1, "month");
      }
      // Order descending: latest month first
      monthsList.reverse();
    } else {
      let count = 3;
      if (duration === "last_6_months") count = 6;
      else if (duration === "last_year") count = 12;

      for (let i = 0; i < count; i++) {
        monthsList.push(now.subtract(i, "month").format("YYYY-MM"));
      }
    }

    // Always ensure the month preceding current month is included for comparison if current month is in list
    const needsLastMonthForComparison =
      monthsList.includes(currentMonthKey) && !monthsList.includes(lastMonthKey);

    const queryMonths = needsLastMonthForComparison
      ? Array.from(new Set([...monthsList, lastMonthKey]))
      : monthsList;

    // Fetch all expenses for this user
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ["id", "name"] }],
      order: [["expense_date", "ASC"], ["created_at", "ASC"]],
    });

    // Group expenses by YYYY-MM
    const monthlyGroups: { [key: string]: typeof expenses } = {};
    queryMonths.forEach((m) => {
      monthlyGroups[m] = [];
    });

    expenses.forEach((e) => {
      const expDate = e.expense_date
        ? dayjs(e.expense_date).format("YYYY-MM")
        : dayjs(e.created_at).format("YYYY-MM");
      if (monthlyGroups[expDate]) {
        monthlyGroups[expDate].push(e);
      }
    });

    // Helper to calculate totals for a month
    const calculateMonthStats = (monthKey: string) => {
      const monthExpenses = monthlyGroups[monthKey] || [];
      const totalExpenditure = monthExpenses.reduce(
        (sum, e) => sum + parseFloat(e.amount as any || 0),
        0
      );

      const catMap: { [cat: string]: number } = {};
      monthExpenses.forEach((e) => {
        const catName = (e as any).Category?.name || "General";
        catMap[catName] = (catMap[catName] || 0) + parseFloat(e.amount as any || 0);
      });

      const categoryBreakdown = Object.keys(catMap).map((cat) => ({
        category: cat,
        amount: parseFloat(catMap[cat].toFixed(2)),
        percentage:
          totalExpenditure > 0
            ? parseFloat(((catMap[cat] / totalExpenditure) * 100).toFixed(1))
            : 0,
      }));

      return {
        totalExpenditure: parseFloat(totalExpenditure.toFixed(2)),
        expenseCount: monthExpenses.length,
        categoryBreakdown,
      };
    };

    // Calculate current vs last month comparison
    const currentStats = calculateMonthStats(currentMonthKey);
    const lastMonthStats = calculateMonthStats(lastMonthKey);

    let currentMonthComparison: MonthlyReportItem["comparison"] = undefined;
    const prevAmount = lastMonthStats.totalExpenditure;
    const curAmount = currentStats.totalExpenditure;

    let percentChange = 0;
    if (prevAmount === 0) {
      percentChange = curAmount > 0 ? 100 : 0;
    } else {
      percentChange = parseFloat((((curAmount - prevAmount) / prevAmount) * 100).toFixed(1));
    }

    currentMonthComparison = {
      previousMonthAmount: prevAmount,
      percentChange: Math.abs(percentChange),
      isHigher: curAmount > prevAmount,
      isLower: curAmount < prevAmount,
      isEqual: curAmount === prevAmount,
      differenceAmount: parseFloat(Math.abs(curAmount - prevAmount).toFixed(2)),
    };

    // Build the final items list for the requested months
    const items: MonthlyReportItem[] = monthsList.map((mKey) => {
      const stats = calculateMonthStats(mKey);
      const isCur = mKey === currentMonthKey;
      const isLast = mKey === lastMonthKey;

      const item: MonthlyReportItem = {
        month: mKey,
        monthName: dayjs(`${mKey}-01`).format("MMMM YYYY"),
        totalExpenditure: stats.totalExpenditure,
        expenseCount: stats.expenseCount,
        isCurrentMonth: isCur,
        isLastMonth: isLast,
        categoryBreakdown: stats.categoryBreakdown,
      };

      if (isCur) {
        item.comparison = currentMonthComparison;
      }

      return item;
    });

    return {
      items,
      currentMonthComparison,
    };
  }
}
