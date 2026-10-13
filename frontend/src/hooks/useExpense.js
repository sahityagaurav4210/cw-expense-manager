import { useState, useEffect, useCallback } from "react";
import {
  getExpensesApi,
  deleteExpenseApi,
} from "../services/expense.service";
import { getCategoriesApi } from "../services/category.service";
import { useUI } from "../context/UIContext";
import { useCreateExpenseDialog } from "./useCreateExpenseDialog";
import { useBulkExpenseDialog } from "./useBulkExpenseDialog";

export const useExpense = () => {
  const { showAlert } = useUI();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE' | 'DELETE' | 'BULK_CREATE'
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

  const handleConfirmRequest = useCallback(({ heading, text, actionType, targetExpense = null }) => {
    setConfirmDialog({
      open: true,
      heading,
      text,
      actionType,
      targetExpense,
      loading: false,
    });
  }, []);

  const createDialog = useCreateExpenseDialog({
    onSuccess: fetchData,
    onConfirmRequest: handleConfirmRequest,
  });

  const bulkDialog = useBulkExpenseDialog({
    categories,
    onSuccess: fetchData,
    onConfirmRequest: handleConfirmRequest,
  });

  const requestDeleteConfirmation = (expense) => {
    handleConfirmRequest({
      heading: "Delete Expense",
      text: `Are you sure you want to delete expense record "${expense.name}"?`,
      actionType: "DELETE",
      targetExpense: expense,
    });
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.actionType === "CREATE") {
        await createDialog.executeCreateExpense();
      } else if (confirmDialog.actionType === "BULK_CREATE") {
        await bulkDialog.executeBulkCreateExpense();
      } else if (confirmDialog.actionType === "DELETE" && confirmDialog.targetExpense) {
        await deleteExpenseApi(confirmDialog.targetExpense.id);
        showAlert("Expense deleted successfully!", "success");
        fetchData();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setConfirmDialog({
        open: false,
        heading: "",
        text: "",
        actionType: null,
        targetExpense: null,
        loading: false,
      });
    }
  };

  return {
    expenses,
    categories,
    loading,
    fetchData,
    // Create Expense Dialog Hook values
    ...createDialog,
    // Bulk Expense Dialog Hook values
    ...bulkDialog,
    // Confirmation Dialog & Delete
    confirmDialog,
    setConfirmDialog,
    requestDeleteConfirmation,
    executeConfirmedAction,
  };
};
