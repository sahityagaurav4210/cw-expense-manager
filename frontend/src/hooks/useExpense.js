import { useState, useEffect, useCallback } from "react";
import dayjs from "dayjs";
import {
  getPaginatedExpensesApi,
  deleteExpenseApi,
} from "../services/expense.service";
import { getCategoriesApi } from "../services/category.service";
import { useUI } from "../context/UIContext";
import { useCreateExpenseDialog } from "./useCreateExpenseDialog";
import { useBulkExpenseDialog } from "./useBulkExpenseDialog";
import useAppMRTPagination from "./core/useAppMRTPagination";

export const useExpense = () => {
  const { showAlert } = useUI();
  const mrtPagination = useAppMRTPagination();
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Approach 1 - Budget Period Filtering states
  const [selectedBudgetId, setSelectedBudgetId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format("YYYY-MM"));
  const [availableBudgets, setAvailableBudgets] = useState([]);
  const [activeBudget, setActiveBudget] = useState(null);

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_CREATE'
    targetExpense: null,
    loading: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const basePayload = mrtPagination.buildPayload();
      const payload = {
        ...basePayload,
        budgetId: selectedBudgetId || "active",
      };

      if (selectedBudgetId === "month" && selectedMonth) {
        payload.from_date = dayjs(selectedMonth).startOf("month").format("YYYY-MM-DD");
        payload.to_date = dayjs(selectedMonth).endOf("month").format("YYYY-MM-DD");
      }

      const [expRes, catRes] = await Promise.all([
        getPaginatedExpensesApi(payload),
        getCategoriesApi(),
      ]);

      setExpenses(expRes.data || []);
      mrtPagination.setTotalRecords(expRes.totalRecords || 0);
      if (expRes.availableBudgets) {
        setAvailableBudgets(expRes.availableBudgets);
      }
      if (expRes.activeBudget) {
        setActiveBudget(expRes.activeBudget);
      }
      setCategories(catRes.data || []);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load expenses data.", "error");
    } finally {
      setLoading(false);
    }
  }, [
    mrtPagination.buildPayload,
    mrtPagination.setTotalRecords,
    selectedBudgetId,
    selectedMonth,
    showAlert,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBudgetChange = (e) => {
    const val = e.target.value;
    setSelectedBudgetId(val);
    mrtPagination.setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleMonthChange = (e) => {
    const val = e.target.value;
    setSelectedMonth(val);
    mrtPagination.setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

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
      } else if (confirmDialog.actionType === "UPDATE") {
        await createDialog.executeUpdateExpense();
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
    // Pagination & MRT state from useAppMRTPagination
    pagination: mrtPagination.pagination,
    setPagination: mrtPagination.setPagination,
    sorting: mrtPagination.sorting,
    setSorting: mrtPagination.setSorting,
    columnFilters: mrtPagination.columnFilters,
    setColumnFilters: mrtPagination.setColumnFilters,
    searchText: mrtPagination.searchText,
    setSearchText: mrtPagination.setSearchText,
    totalRecords: mrtPagination.totalRecords,
    setTotalRecords: mrtPagination.setTotalRecords,
    // Period & Budget Filtering
    selectedBudgetId,
    setSelectedBudgetId,
    selectedMonth,
    setSelectedMonth,
    availableBudgets,
    activeBudget,
    handleBudgetChange,
    handleMonthChange,
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
