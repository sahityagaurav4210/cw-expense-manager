import { useState, useEffect, useCallback } from "react";
import { getDashboardMetricsApi } from "../services/dashboard.service";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";

export const useDashboard = () => {
  const { showAlert } = useUI();
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboardMetricsApi(selectedMonth);
      setMetrics(res.data);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load dashboard metrics.", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, showAlert]);

  useEffect(() => {
    fetchMetrics();
    
    const intervalMinutes = parseInt(import.meta.env.VITE_METRICS_INTERVAL_MINUTES || "2", 10);
    const intervalId = setInterval(() => {
      fetchMetrics();
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [fetchMetrics]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleOpenPdfModal = () => setPdfModalOpen(true);
  const handleClosePdfModal = () => setPdfModalOpen(false);

  return {
    selectedMonth,
    metrics,
    loading,
    pdfModalOpen,
    handleMonthChange,
    handleOpenPdfModal,
    handleClosePdfModal,
    fetchMetrics,
  };
};
