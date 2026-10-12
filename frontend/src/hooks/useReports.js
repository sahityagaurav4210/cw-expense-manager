import { useState, useEffect, useCallback } from "react";
import { getExpenditureSummaryApi } from "../services/reports.service";
import { useUI } from "../context/UIContext";

export const useReports = () => {
  const { showAlert } = useUI();
  const [filterParams, setFilterParams] = useState({
    duration: "last_3_months",
    startDate: undefined,
    endDate: undefined,
  });
  const [reportItems, setReportItems] = useState([]);
  const [currentMonthComparison, setCurrentMonthComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReports = useCallback(
    async (paramsToUse) => {
      setLoading(true);
      try {
        const queryParams = paramsToUse || filterParams;
        const res = await getExpenditureSummaryApi(queryParams);
        if (res.status === "success" && res.data) {
          setReportItems(res.data.items || []);
          setCurrentMonthComparison(res.data.currentMonthComparison || null);
        }
      } catch (err) {
        showAlert(
          err.response?.data?.message || "Failed to load expenditure reports.",
          "error"
        );
      } finally {
        setLoading(false);
      }
    },
    [filterParams, showAlert]
  );

  useEffect(() => {
    fetchReports(filterParams);
  }, [filterParams, fetchReports]);

  const handleFilterChange = useCallback((newParams) => {
    setFilterParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  }, []);

  return {
    reportItems,
    currentMonthComparison,
    loading,
    filterParams,
    handleFilterChange,
    refetch: () => fetchReports(filterParams),
  };
};
