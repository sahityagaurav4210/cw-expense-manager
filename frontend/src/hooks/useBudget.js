import { useState, useEffect, useCallback } from "react";
import { setBudgetApi, getBudgetsApi } from "../services/budget.service";
import { budgetZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";

dayjs.extend(isBetween);

export const useBudget = () => {
  const { showAlert } = useUI();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    from_date: dayjs().startOf("month").format("YYYY-MM-DD"),
    to_date: dayjs().endOf("month").format("YYYY-MM-DD"),
    captchaText: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    loading: false,
  });

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBudgetsApi();
      setBudgets(res.data || []);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load budget history.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleDateChange = (field, date) => {
    const formatted = date ? dayjs(date).format("YYYY-MM-DD") : "";
    setFormData((prev) => ({ ...prev, [field]: formatted }));
  };

  const requestConfirmation = (e) => {
    e.preventDefault();
    const result = budgetZodSchema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => (formatted[err.path[0]] = err.message));
      setErrors(formatted);
      showAlert("Please correct the form errors.", "error");
      return;
    }

    setConfirmDialog({
      open: true,
      heading: "Confirm Budget Allocation",
      text: `Are you sure you want to allocate monthly income budget of ₹${parseFloat(formData.amount).toLocaleString("en-IN")} from ${formData.from_date} to ${formData.to_date}?`,
      loading: false,
    });
  };

  const executeSetBudget = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      await setBudgetApi({ ...formData, captchaId });
      showAlert("Monthly budget income allocated successfully!", "success");
      setFormData({
        amount: "",
        from_date: dayjs().startOf("month").format("YYYY-MM-DD"),
        to_date: dayjs().endOf("month").format("YYYY-MM-DD"),
        captchaText: "",
      });
      fetchBudgets();
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to save budget.", "error");
    } finally {
      setConfirmDialog({ open: false, heading: "", text: "", loading: false });
    }
  };

  const isCurrentMonthBudget = useCallback((b) => {
    if (!b || !b.from_date) return false;
    const today = dayjs();
    const currentMonthKey = today.format("YYYY-MM");
    const budgetMonthKey = dayjs(b.from_date).format("YYYY-MM");
    return (
      budgetMonthKey === currentMonthKey ||
      today.isBetween(dayjs(b.from_date), dayjs(b.to_date), "day", "[]")
    );
  }, []);

  const activeBudget = budgets.find((b) => isCurrentMonthBudget(b)) || null;
  const historicalBudgets = budgets.filter((b) => !isCurrentMonthBudget(b));

  return {
    budgets,
    activeBudget,
    historicalBudgets,
    isCurrentMonthBudget,
    fetchBudgets,
    loading,
    formData,
    captchaId,
    setCaptchaId,
    errors,
    confirmDialog,
    setConfirmDialog,
    handleChange,
    handleDateChange,
    requestConfirmation,
    executeSetBudget,
  };
};
