import { useState, useEffect, useCallback } from "react";
import { getDashboardMetricsApi } from "../services/dashboard.service";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";

export const useDashboard = () => {
  const { showAlert } = useUI();
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchMetrics = useCallback(
    async (budgetIdParam, monthParam) => {
      setLoading(true);
      try {
        const bId = budgetIdParam !== undefined ? budgetIdParam : selectedBudgetId;
        const mVal = monthParam !== undefined ? monthParam : selectedMonth;

        const params = {};
        if (bId && bId !== "month") {
          params.budgetId = bId;
        } else if (bId === "month") {
          params.budgetId = "month";
          params.month = mVal;
        }

        const res = await getDashboardMetricsApi(params);
        setMetrics(res.data);

        if (res.data?.selectedBudget?.id && !bId) {
          setSelectedBudgetId(res.data.selectedBudget.id);
        }
        if (res.data?.targetMonth) {
          setSelectedMonth(res.data.targetMonth);
        }
      } catch (err) {
        showAlert(
          err.response?.data?.message || "Failed to load dashboard metrics.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [selectedBudgetId, selectedMonth, showAlert]
  );

  useEffect(() => {
    fetchMetrics();

    const intervalMinutes = parseInt(
      import.meta.env.VITE_METRICS_INTERVAL_MINUTES || "2",
      10
    );
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  const handleBudgetChange = (e) => {
    const val = e.target.value;
    setSelectedBudgetId(val);
    fetchMetrics(val, selectedMonth);
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setSelectedMonth(val);
    fetchMetrics("month", val);
  };

  return {
    selectedBudgetId,
    selectedMonth,
    metrics,
    loading,
    handleBudgetChange,
    handleMonthChange,
    fetchMetrics,
  };
};
