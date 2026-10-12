import { useState, useEffect, useCallback } from "react";
import { createExpenseApi, getExpensesApi, deleteExpenseApi } from "../services/expense.service";
import { getCategoriesApi } from "../services/category.service";
import { expenseZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";

export const useExpense = () => {
  const { showAlert } = useUI();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category_id: "",
    type: "Variable",
    expense_date: dayjs().format("YYYY-MM-DD"),
    captchaText: "",
  });
  const [billFile, setBillFile] = useState(null);
  const [isBillReady, setIsBillReady] = useState(true);
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE' | 'DELETE'
    targetExpense: null,
    loading: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([getExpensesApi(), getCategoriesApi()]);
      setExpenses(expRes.data || []);
      setCategories(catRes.data || []);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load expenses data.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      amount: "",
      category_id: "",
      type: "Variable",
      expense_date: dayjs().format("YYYY-MM-DD"),
      captchaText: "",
    });
    setBillFile(null);
    setIsBillReady(true);
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setBillFile(null);
    setIsBillReady(true);
  };

  const requestCreateConfirmation = (e) => {
    e.preventDefault();
    if (!isBillReady) {
      showAlert("Please wait for the bill file upload to complete processing.", "warning");
      return;
    }

    const result = expenseZodSchema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => (formatted[err.path[0]] = err.message));
      setErrors(formatted);
      showAlert("Please fix validation errors.", "error");
      return;
    }

    setConfirmDialog({
      open: true,
      heading: "Add Expense Record",
      text: `Confirm adding expense "${formData.name}" of amount ₹${parseFloat(formData.amount).toLocaleString("en-IN")}${billFile ? " with attached bill" : ""}?`,
      actionType: "CREATE",
      targetExpense: null,
      loading: false,
    });
  };

  const requestDeleteConfirmation = (expense) => {
    setConfirmDialog({
      open: true,
      heading: "Delete Expense",
      text: `Are you sure you want to delete expense record "${expense.name}"?`,
      actionType: "DELETE",
      targetExpense: expense,
      loading: false,
    });
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.actionType === "CREATE") {
        const payload = new FormData();
        payload.append("name", formData.name);
        payload.append("amount", formData.amount);
        if (formData.category_id) {
          payload.append("category_id", formData.category_id);
        }
        payload.append("type", formData.type);
        payload.append("expense_date", formData.expense_date);
        payload.append("captchaText", formData.captchaText);
        if (captchaId) {
          payload.append("captchaId", captchaId);
        }
        if (billFile) {
          payload.append("bill", billFile);
        }

        await createExpenseApi(payload);
        showAlert("Expense recorded successfully!", "success");
        setModalOpen(false);
        setBillFile(null);
        fetchData();
      } else if (confirmDialog.actionType === "DELETE" && confirmDialog.targetExpense) {
        await deleteExpenseApi(confirmDialog.targetExpense.id, {
          captchaText: "VALIDATED",
          captchaId,
        });
        showAlert("Expense deleted successfully!", "success");
        fetchData();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setConfirmDialog({ open: false, heading: "", text: "", actionType: null, targetExpense: null, loading: false });
    }
  };

  return {
    expenses,
    categories,
    loading,
    modalOpen,
    formData,
    billFile,
    setBillFile,
    isBillReady,
    setIsBillReady,
    captchaId,
    setCaptchaId,
    errors,
    confirmDialog,
    setConfirmDialog,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    requestCreateConfirmation,
    requestDeleteConfirmation,
    executeConfirmedAction,
    fetchData,
  };
};
