import { Expense, Category, Budget, User } from '../db/models';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { DashboardService } from './dashboard.service';

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
    } = {},
  ): Promise<{
    items: MonthlyReportItem[];
    currentMonthComparison: MonthlyReportItem['comparison'] | null;
  }> {
    const now = dayjs();
    const currentMonthKey = now.format('YYYY-MM');
    const lastMonthKey = now.subtract(1, 'month').format('YYYY-MM');

    let monthsList: string[] = [];

    const duration = options.duration || 'last_3_months';

    if (duration === 'custom' && options.startDate && options.endDate) {
      let cur = dayjs(options.startDate).startOf('month');
      const end = dayjs(options.endDate).startOf('month');

      while (cur.isBefore(end) || cur.isSame(end, 'month')) {
        monthsList.push(cur.format('YYYY-MM'));
        cur = cur.add(1, 'month');
      }
      // Order descending: latest month first
      monthsList.reverse();
    } else {
      let count = 3;
      if (duration === 'last_6_months') count = 6;
      else if (duration === 'last_year') count = 12;

      for (let i = 0; i < count; i++) {
        monthsList.push(now.subtract(i, 'month').format('YYYY-MM'));
      }
    }

    // Always ensure the month preceding current month is included for comparison if current month is in list
    const needsLastMonthForComparison = monthsList.includes(currentMonthKey) && !monthsList.includes(lastMonthKey);

    const queryMonths = needsLastMonthForComparison ? Array.from(new Set([...monthsList, lastMonthKey])) : monthsList;

    // Fetch all expenses for this user
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [
        ['expense_date', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });

    // Group expenses by YYYY-MM
    const monthlyGroups: { [key: string]: typeof expenses } = {};
    queryMonths.forEach((m) => {
      monthlyGroups[m] = [];
    });

    expenses.forEach((e) => {
      const expDate = e.expense_date ? dayjs(e.expense_date).format('YYYY-MM') : dayjs(e.created_at).format('YYYY-MM');
      if (monthlyGroups[expDate]) {
        monthlyGroups[expDate].push(e);
      }
    });

    // Helper to calculate totals for a month
    const calculateMonthStats = (monthKey: string) => {
      const monthExpenses = monthlyGroups[monthKey] || [];
      const totalExpenditure = monthExpenses.reduce((sum, e) => sum + parseFloat((e.amount as any) || 0), 0);

      const catMap: { [cat: string]: number } = {};
      monthExpenses.forEach((e) => {
        const catName = (e as any).Category?.name || 'General';
        catMap[catName] = (catMap[catName] || 0) + parseFloat((e.amount as any) || 0);
      });

      const categoryBreakdown = Object.keys(catMap).map((cat) => ({
        category: cat,
        amount: parseFloat(catMap[cat].toFixed(2)),
        percentage: totalExpenditure > 0 ? parseFloat(((catMap[cat] / totalExpenditure) * 100).toFixed(1)) : 0,
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

    let currentMonthComparison: MonthlyReportItem['comparison'] = undefined;
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
        monthName: dayjs(`${mKey}-01`).format('MMMM YYYY'),
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

  /**
   * Computes a structured payment mode analysis for the given month (defaults to current month)
   */
  public static async getPaymentModesSummary(userId: number, monthKey?: string) {
    const targetMonth = monthKey || dayjs().format('YYYY-MM');
    const targetDate = dayjs(`${targetMonth}-01`);
    const monthName = targetDate.format('MMMM YYYY');

    const metrics = await DashboardService.getDashboardMetrics(userId, {
      monthYear: targetMonth,
      budgetId: 'month',
    });

    const paymentModeBreakdown = metrics.paymentModeBreakdown || [];
    const expensesList = metrics.expensesList || [];

    const totalExpenseIncurred = metrics.totalExpenseIncurred || 0;
    const periodCreditCardExpense = metrics.creditCardExpensesTotal || 0;
    const totalSpent = parseFloat((totalExpenseIncurred + periodCreditCardExpense).toFixed(2));
    const totalTransactions = expensesList.length;

    const dominantMode =
      paymentModeBreakdown.length > 0 && paymentModeBreakdown[0].amount > 0
        ? paymentModeBreakdown[0]
        : { mode: 'None', amount: 0, count: 0, percentage: 0 };

    const avgTransaction =
      totalTransactions > 0 ? parseFloat((totalSpent / totalTransactions).toFixed(2)) : 0;

    return {
      month: targetMonth,
      monthName,
      totalSpent,
      totalTransactions,
      dominantMode,
      avgTransaction,
      paymentModeBreakdown,
      expenses: expensesList,
      userProfile: metrics.userProfile || {},
    };
  }

  /**
   * Helper to parse financial year key (e.g. "2026-27" or "2026") into dates and labels
   */
  public static parseFinancialYear(fyKey?: string) {
    const now = dayjs();
    let startYear: number;

    if (fyKey) {
      const match = fyKey.match(/(\d{4})/);
      startYear = match ? parseInt(match[1], 10) : now.year();
    } else {
      const currentMonth = now.month() + 1; // 1-12
      startYear = currentMonth >= 4 ? now.year() : now.year() - 1;
    }

    const endYear = startYear + 1;
    const fyLabel = `FY ${startYear}-${String(endYear).slice(-2)}`;
    const startDate = `${startYear}-04-01`;
    const endDate = `${endYear}-03-31`;

    return { startYear, endYear, fyLabel, startDate, endDate };
  }

  /**
   * Computes a structured Annual Financial Year Report for the given fiscal year
   */
  public static async getFinancialYearSummary(userId: number, fyKey?: string) {
    const { startYear, endYear, fyLabel, startDate, endDate } = this.parseFinancialYear(fyKey);

    // Fetch user details
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'employment_type'],
    });
    const userProfile = user
      ? {
          name: user.name,
          email: user.email,
          employment_type: user.employment_type,
        }
      : {};

    // Fetch all user budgets in this financial year
    const budgets = await Budget.findAll({
      where: { user_id: userId },
    });

    const fyBudgets = budgets.filter((b) => {
      const bStart = b.from_date;
      const bEnd = b.to_date;
      return (bStart >= startDate && bStart <= endDate) || (bEnd >= startDate && bEnd <= endDate);
    });

    const totalBudget = parseFloat(
      fyBudgets.reduce((sum, b) => sum + parseFloat((b.amount as any) || 0), 0).toFixed(2),
    );

    // Fetch all user expenses in this financial year
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['expense_date', 'DESC']],
    });

    const fyExpenses = expenses.filter((e) => {
      const expDate = e.expense_date || dayjs(e.created_at).format('YYYY-MM-DD');
      return expDate >= startDate && expDate <= endDate;
    });

    let totalExpenseIncurred = 0;
    let periodCreditCardExpense = 0;
    let fixedTotal = 0;
    let variableTotal = 0;

    const categoryMap: { [cat: string]: number } = {};
    const paymentModeMap: { [mode: string]: { amount: number; count: number } } = {};
    ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'].forEach((m) => {
      paymentModeMap[m] = { amount: 0, count: 0 };
    });

    // 12 months progression: Apr (04) of startYear to Mar (03) of endYear
    const monthlyMap: { [monthKey: string]: { amount: number; count: number; name: string } } = {};
    for (let m = 4; m <= 12; m++) {
      const mStr = `${startYear}-${String(m).padStart(2, '0')}`;
      monthlyMap[mStr] = {
        amount: 0,
        count: 0,
        name: dayjs(`${mStr}-01`).format('MMMM YYYY'),
      };
    }
    for (let m = 1; m <= 3; m++) {
      const mStr = `${endYear}-${String(m).padStart(2, '0')}`;
      monthlyMap[mStr] = {
        amount: 0,
        count: 0,
        name: dayjs(`${mStr}-01`).format('MMMM YYYY'),
      };
    }

    fyExpenses.forEach((e) => {
      const amt = parseFloat((e.amount as any) || 0);
      const mode = (e.payment_mode || 'Cash').trim();
      const cat = (e as any).Category?.name || 'General';
      const expDate = e.expense_date || dayjs(e.created_at).format('YYYY-MM-DD');
      const mKey = dayjs(expDate).format('YYYY-MM');

      if (e.payment_mode === 'Credit Card') {
        periodCreditCardExpense += amt;
      } else {
        totalExpenseIncurred += amt;
        if (e.type === 'Fixed') fixedTotal += amt;
        else variableTotal += amt;
      }

      categoryMap[cat] = (categoryMap[cat] || 0) + amt;

      if (!paymentModeMap[mode]) paymentModeMap[mode] = { amount: 0, count: 0 };
      paymentModeMap[mode].amount += amt;
      paymentModeMap[mode].count += 1;

      if (monthlyMap[mKey]) {
        monthlyMap[mKey].amount += amt;
        monthlyMap[mKey].count += 1;
      }
    });

    const totalSpent = parseFloat((totalExpenseIncurred + periodCreditCardExpense).toFixed(2));
    const totalTransactions = fyExpenses.length;
    const netSavings = Math.max(0, parseFloat((totalBudget - totalSpent).toFixed(2)));
    const savingsRate = totalBudget > 0 ? parseFloat(((netSavings / totalBudget) * 100).toFixed(1)) : 0;
    const budgetUsagePercent = totalBudget > 0 ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1)) : 0;

    const categoryBreakdown = Object.keys(categoryMap)
      .map((cat) => ({
        category: cat,
        amount: parseFloat(categoryMap[cat].toFixed(2)),
        percentage: totalSpent > 0 ? parseFloat(((categoryMap[cat] / totalSpent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const paymentModeBreakdown = Object.keys(paymentModeMap)
      .map((mode) => ({
        mode,
        amount: parseFloat(paymentModeMap[mode].amount.toFixed(2)),
        count: paymentModeMap[mode].count,
        percentage: totalSpent > 0 ? parseFloat(((paymentModeMap[mode].amount / totalSpent) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const monthlyBreakdown = Object.keys(monthlyMap).map((mKey) => ({
      month: mKey,
      monthName: monthlyMap[mKey].name,
      amount: parseFloat(monthlyMap[mKey].amount.toFixed(2)),
      count: monthlyMap[mKey].count,
      percentage: totalSpent > 0 ? parseFloat(((monthlyMap[mKey].amount / totalSpent) * 100).toFixed(1)) : 0,
    }));

    return {
      fyKey: `${startYear}-${String(endYear).slice(-2)}`,
      fyLabel,
      startDate,
      endDate,
      totalBudget,
      totalSpent,
      totalTransactions,
      netSavings,
      savingsRate,
      budgetUsagePercent,
      categoryBreakdown,
      paymentModeBreakdown,
      monthlyBreakdown,
      userProfile,
      expenses: fyExpenses.map((e) => ({
        id: e.id,
        name: e.name,
        amount: parseFloat((e.amount as any) || 0),
        category: (e as any).Category?.name || 'General',
        payment_mode: e.payment_mode || 'Cash',
        expense_date: e.expense_date || dayjs(e.created_at).format('YYYY-MM-DD'),
        type: e.type,
      })),
    };
  }
}
