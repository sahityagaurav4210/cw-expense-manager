import { Expense, Budget, Category, Debt, User, BudgetInflow, PaymentOptionsMaster } from '../db/models';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

export interface DashboardMetricsQuery {
  monthYear?: string;
  budgetId?: number | string;
  from_date?: string;
  to_date?: string;
}

export class DashboardService {
  /**
   * Finds the best matching budget for a given calendar month (YYYY-MM).
   * 1. Exact calendar month match: from_date and to_date both fall in targetMonth.
   * 2. Majority overlap match: Budget with the highest number of overlapping days in targetMonth (min 10 days overlap and >= 35% of total budget period).
   */
  public static findBudgetForMonth(userBudgets: any[], targetMonth: string) {
    if (!userBudgets || userBudgets.length === 0 || !targetMonth) return null;

    // 1. Exact calendar month match (e.g. 2026-10-01 to 2026-10-31)
    const exactMatch = userBudgets.find((b) => {
      if (!b.from_date || !b.to_date) return false;
      const fromMonth = dayjs(b.from_date).format('YYYY-MM');
      const toMonth = dayjs(b.to_date).format('YYYY-MM');
      return fromMonth === targetMonth && toMonth === targetMonth;
    });
    if (exactMatch) return exactMatch;

    // 2. Maximum overlap match (useful for salary cycles like 25th to 24th)
    const mStart = dayjs(`${targetMonth}-01`);
    const mEnd = mStart.endOf('month');

    let bestBudget: any = null;
    let maxOverlapDays = 0;

    for (const b of userBudgets) {
      if (!b.from_date || !b.to_date) continue;
      const bStart = dayjs(b.from_date);
      const bEnd = dayjs(b.to_date);

      if (bEnd.isBefore(mStart, 'day') || bStart.isAfter(mEnd, 'day')) {
        continue;
      }

      const start = bStart.isAfter(mStart) ? bStart : mStart;
      const end = bEnd.isBefore(mEnd) ? bEnd : mEnd;
      const overlap = end.diff(start, 'day') + 1;
      const budgetTotalDays = bEnd.diff(bStart, 'day') + 1;

      // Only consider if overlap is substantial (at least 10 days and at least 35% of the budget cycle)
      if (overlap >= 10 && overlap / budgetTotalDays >= 0.35) {
        if (overlap > maxOverlapDays) {
          maxOverlapDays = overlap;
          bestBudget = b;
        }
      }
    }

    return bestBudget;
  }

  public static async getDashboardMetrics(
    userId: number,
    queryParam?: string | DashboardMetricsQuery,
  ) {
    const today = dayjs();
    const todayStr = today.format('YYYY-MM-DD');

    let options: DashboardMetricsQuery = {};
    if (typeof queryParam === 'string') {
      options = { monthYear: queryParam };
    } else if (typeof queryParam === 'object' && queryParam !== null) {
      options = queryParam;
    }

    // Fetch user details for report branding
    const userRecord = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'employment_type', 'phone_no', 'annual_income'],
    });
    const userProfile = userRecord
      ? {
          name: userRecord.name,
          email: userRecord.email,
          employment_type: userRecord.employment_type,
          phone_no: userRecord.phone_no,
          annual_income:
            userRecord.annual_income !== null && userRecord.annual_income !== undefined
              ? Number(userRecord.annual_income)
              : null,
        }
      : null;

    // Fetch all user budgets with their inflows
    const userBudgets = await Budget.findAll({
      where: { user_id: userId },
      include: [{ model: BudgetInflow, as: 'inflows' }],
      order: [
        ['from_date', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });

    const isBudgetActive = (b: any) => {
      if (!b || !b.from_date || !b.to_date) return false;
      return (
        (todayStr >= b.from_date && todayStr <= b.to_date) ||
        today.isBetween(dayjs(b.from_date), dayjs(b.to_date), 'day', '[]')
      );
    };

    let targetBudget: any = null;

    // Check if user specifically requested a budget by ID
    if (options.budgetId && options.budgetId !== 'month' && options.budgetId !== 'all') {
      const bId = Number(options.budgetId);
      targetBudget = userBudgets.find((b) => b.id === bId) || null;
    }

    // Check if explicit date range was passed
    if (!targetBudget && options.from_date && options.to_date) {
      targetBudget = userBudgets.find(
        (b) => b.from_date === options.from_date && b.to_date === options.to_date,
      );
    }

    // Month mode is active if explicitly requested or if a month is targeted without a specific budget ID
    const isMonthMode = options.budgetId === 'month' || Boolean(options.monthYear && !targetBudget);

    // Determine effective date range and income
    let startDate: string;
    let endDate: string;
    let daysInPeriod: number;
    let monthlyIncome = 0;
    let targetMonth = options.monthYear || today.format('YYYY-MM');
    let periodLabel = '';

    if (isMonthMode) {
      // Calendar month mode (used by reports and calendar month dashboard view)
      const startOfMonth = `${targetMonth}-01`;
      startDate = startOfMonth;
      endDate = dayjs(startOfMonth).endOf('month').format('YYYY-MM-DD');
      daysInPeriod = dayjs(startOfMonth).daysInMonth() || 30;
      periodLabel = dayjs(startOfMonth).format('MMMM YYYY');

      targetBudget = DashboardService.findBudgetForMonth(userBudgets, targetMonth);
      monthlyIncome = targetBudget ? parseFloat(targetBudget.amount as any) || 0 : 0;
    } else if (targetBudget) {
      // Specific budget cycle explicitly selected by ID or date range
      startDate = targetBudget.from_date;
      endDate = targetBudget.to_date;
      daysInPeriod = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);
      monthlyIncome = parseFloat(targetBudget.amount as any) || 0;
      targetMonth = dayjs(startDate).format('YYYY-MM');
      periodLabel = `${startDate} to ${endDate}`;
    } else {
      // Default: active budget or latest allocated budget
      const activeBudget = userBudgets.find((b) => isBudgetActive(b)) || userBudgets[0];
      if (activeBudget) {
        targetBudget = activeBudget;
        startDate = targetBudget.from_date;
        endDate = targetBudget.to_date;
        daysInPeriod = Math.max(1, dayjs(endDate).diff(dayjs(startDate), 'day') + 1);
        monthlyIncome = parseFloat(targetBudget.amount as any) || 0;
        targetMonth = dayjs(startDate).format('YYYY-MM');
        periodLabel = `${startDate} to ${endDate}`;
      } else {
        const startOfMonth = `${targetMonth}-01`;
        startDate = startOfMonth;
        endDate = dayjs(startOfMonth).endOf('month').format('YYYY-MM-DD');
        daysInPeriod = dayjs(startOfMonth).daysInMonth() || 30;
        periodLabel = dayjs(startOfMonth).format('MMMM YYYY');
        monthlyIncome = 0;
      }
    }

    // Fetch user expenses
    const expenses = await Expense.findAll({
      where: { user_id: userId },
      include: [{ model: Category, attributes: ['id', 'name'] }],
    });

    // Filter expenses within the allocated budget validity period [startDate, endDate]
    const periodExpenses = expenses.filter((e) => {
      const expDate = e.expense_date || dayjs(e.created_at).format('YYYY-MM-DD');
      return expDate >= startDate && expDate <= endDate;
    });

    let totalExpenseIncurred = 0;
    let fixedExpensesTotal = 0;
    let variableExpensesTotal = 0;
    let periodCreditCardExpense = 0;

    periodExpenses.forEach((e) => {
      const amt = parseFloat(e.amount as any);
      if (e.payment_mode === 'Credit Card') {
        // Credit card spends do not deduct immediately from allocated budget cash flow
        periodCreditCardExpense += amt;
      } else {
        totalExpenseIncurred += amt;
        if (e.type === 'Fixed') {
          fixedExpensesTotal += amt;
        } else {
          variableExpensesTotal += amt;
        }
      }
    });

    totalExpenseIncurred = parseFloat(totalExpenseIncurred.toFixed(2));
    fixedExpensesTotal = parseFloat(fixedExpensesTotal.toFixed(2));
    variableExpensesTotal = parseFloat(variableExpensesTotal.toFixed(2));
    periodCreditCardExpense = parseFloat(periodCreditCardExpense.toFixed(2));

    const amountMoneyLeft = Math.max(0, parseFloat((monthlyIncome - totalExpenseIncurred).toFixed(2)));

    // Pending Credit Card dues across all unsettled credit card expenses for this user
    const pendingCreditCardDues = expenses
      .filter((e) => e.payment_mode === 'Credit Card' && !e.is_settled)
      .reduce((acc, curr) => acc + parseFloat(curr.amount as any), 0);

    // Group expenses by category
    const categoryBreakdownMap: { [key: string]: number } = {};
    periodExpenses.forEach((e) => {
      const categoryName = (e as any).Category?.name || 'Not Defined';
      categoryBreakdownMap[categoryName] =
        (categoryBreakdownMap[categoryName] || 0) + parseFloat(e.amount as any);
    });

    const categoryBreakdown = Object.keys(categoryBreakdownMap)
      .map((cat) => ({
        category: cat,
        amount: parseFloat(categoryBreakdownMap[cat].toFixed(2)),
        percentage:
          totalExpenseIncurred > 0
            ? parseFloat(((categoryBreakdownMap[cat] / totalExpenseIncurred) * 100).toFixed(2))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // Group expenses by payment mode
    const paymentModeBreakdownMap: { [key: string]: { totalAmount: number; count: number } } = {};

    // Fetch master payment options if available
    try {
      const dbPaymentOptions = await PaymentOptionsMaster.findAll({
        where: { is_active: true, is_deleted: false },
        order: [['payment_name', 'ASC']],
      });
      dbPaymentOptions.forEach((p) => {
        const name = (p.payment_name || '').trim();
        if (name && !paymentModeBreakdownMap[name]) {
          paymentModeBreakdownMap[name] = { totalAmount: 0, count: 0 };
        }
      });
    } catch {}

    // Ensure standard modes are always represented
    ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking'].forEach((mode) => {
      if (!paymentModeBreakdownMap[mode]) {
        paymentModeBreakdownMap[mode] = { totalAmount: 0, count: 0 };
      }
    });

    periodExpenses.forEach((e) => {
      const mode = (e.payment_mode || 'Cash').trim();
      const amt = parseFloat(e.amount as any) || 0;
      if (!paymentModeBreakdownMap[mode]) {
        paymentModeBreakdownMap[mode] = { totalAmount: 0, count: 0 };
      }
      paymentModeBreakdownMap[mode].totalAmount += amt;
      paymentModeBreakdownMap[mode].count += 1;
    });

    const allPeriodSpends = totalExpenseIncurred + periodCreditCardExpense;
    const paymentModeBreakdown = Object.keys(paymentModeBreakdownMap)
      .map((mode) => ({
        mode,
        amount: parseFloat(paymentModeBreakdownMap[mode].totalAmount.toFixed(2)),
        count: paymentModeBreakdownMap[mode].count,
        percentage:
          allPeriodSpends > 0
            ? parseFloat(
                (
                  (paymentModeBreakdownMap[mode].totalAmount / allPeriodSpends) *
                  100
                ).toFixed(1),
              )
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount || b.count - a.count || a.mode.localeCompare(b.mode));

    // Detailed Itemized Expenses List (Sorted latest to earliest)
    const expensesList = periodExpenses
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
        category: (e as any).Category?.name || 'General',
        payment_mode: e.payment_mode || 'Cash',
        is_settled: Boolean(e.is_settled),
        expense_date: e.expense_date || dayjs(e.created_at).format('YYYY-MM-DD'),
        hasReceipt: Boolean(e.bill_url),
        bill_url: e.bill_url,
      }));

    // Inflows for target budget / period
    const allInflows = await BudgetInflow.findAll({
      where: { user_id: userId },
      order: [['received_date', 'DESC']],
    }).catch(() => []);

    const periodInflows = (allInflows || [])
      .filter((inf) => {
        if (targetBudget && inf.budget_id === targetBudget.id) return true;
        const infDate = inf.received_date || dayjs(inf.created_at).format('YYYY-MM-DD');
        return infDate >= startDate && infDate <= endDate;
      })
      .map((inf) => ({
        id: inf.id,
        source: inf.source,
        amount: parseFloat(inf.amount as any),
        received_date: inf.received_date || dayjs(inf.created_at).format('YYYY-MM-DD'),
        notes: inf.notes,
      }));

    // Fetch user debts & receivables for KPI metrics
    const debts = await Debt.findAll({
      where: { user_id: userId },
      order: [['lent_date', 'DESC']],
    }).catch(() => []);

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
        (d.due_date as string) < todayStr &&
        d.status !== 'SETTLED' &&
        d.status !== 'WRITTEN_OFF' &&
        balance > 0;

      if (d.type === 'LENT') {
        totalLent += initial;
        totalRecovered += settled;
        if (d.status !== 'SETTLED' && d.status !== 'WRITTEN_OFF') {
          totalPendingReceivable += balance;
          if (isOverdue) overdueReceivablesCount += 1;
        }
      } else {
        totalBorrowed += initial;
        totalRepaid += settled;
        if (d.status !== 'SETTLED' && d.status !== 'WRITTEN_OFF') {
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

    // Financial Analytics based on allocated budget period
    const budgetUsagePercent =
      monthlyIncome > 0
        ? parseFloat(((totalExpenseIncurred / monthlyIncome) * 100).toFixed(1))
        : 0;

    const savingsRate =
      monthlyIncome > 0
        ? parseFloat(((amountMoneyLeft / monthlyIncome) * 100).toFixed(1))
        : 0;

    const dailyAverageExpense = parseFloat((totalExpenseIncurred / daysInPeriod).toFixed(2));

    return {
      monthlyIncome,
      totalExpenseIncurred,
      amountMoneyLeft,
      fixedExpensesTotal,
      variableExpensesTotal,
      targetMonth,
      categoryBreakdown,
      expenseCount: periodExpenses.length,
      expensesList,
      monthlyInflows: periodInflows,
      debtsList,
      userProfile,
      budgetDateRange: {
        from: startDate,
        to: endDate,
        daysInPeriod,
        label: periodLabel,
        budgetId: targetBudget?.id || null,
        isActive: targetBudget ? isBudgetActive(targetBudget) : false,
      },
      selectedBudget: targetBudget
        ? {
            id: targetBudget.id,
            amount: parseFloat(targetBudget.amount as any),
            from_date: targetBudget.from_date,
            to_date: targetBudget.to_date,
            isActive: isBudgetActive(targetBudget),
          }
        : null,
      availableBudgets: userBudgets.map((b) => ({
        id: b.id,
        amount: parseFloat(b.amount as any),
        from_date: b.from_date,
        to_date: b.to_date,
        isActive: isBudgetActive(b),
      })),
      pendingReceivables: parseFloat(totalPendingReceivable.toFixed(2)),
      pendingPayables: parseFloat(totalPendingPayable.toFixed(2)),
      pendingCreditCardDues: parseFloat(pendingCreditCardDues.toFixed(2)),
      creditCardExpensesTotal: periodCreditCardExpense,
      paymentModeBreakdown,
      debtsSummary,
      analytics: {
        budgetUsagePercent,
        savingsRate,
        dailyAverageExpense,
        daysInMonth: daysInPeriod,
      },
    };
  }
}
