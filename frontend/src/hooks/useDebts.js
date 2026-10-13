import { useState, useEffect, useCallback, useMemo } from "react";
import {
  getDebtsApi,
  writeOffDebtApi,
  deleteDebtApi,
} from "../services/debt.service";
import { useUI } from "../context/UIContext";
import { useCreateDebtDialog } from "./useCreateDebtDialog";
import { useSettleDebtDialog } from "./useSettleDebtDialog";
import dayjs from "dayjs";

export const useDebts = () => {
  const { showAlert } = useUI();
  const [debts, setDebts] = useState([]);
  const [summary, setSummary] = useState({
    totalLent: 0,
    totalRecovered: 0,
    totalPendingReceivable: 0,
    totalBorrowed: 0,
    totalRepaid: 0,
    totalPendingPayable: 0,
    overdueCount: 0,
  });
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState("ALL"); // 'ALL' | 'LENT' | 'BORROWED' | 'PENDING' | 'SETTLED'

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE_DEBT' | 'SETTLE_DEBT' | 'WRITE_OFF' | 'DELETE_DEBT'
    targetDebt: null,
    loading: false,
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDebtsApi();
      setDebts(res.data || []);
      if (res.summary) {
        setSummary(res.summary);
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to load debts & receivables.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfirmRequest = useCallback(
    ({ heading, text, actionType, targetDebt = null }) => {
      setConfirmDialog({
        open: true,
        heading,
        text,
        actionType,
        targetDebt,
        loading: false,
      });
    },
    []
  );

  const createDialog = useCreateDebtDialog({
    onSuccess: fetchData,
    onConfirmRequest: handleConfirmRequest,
  });

  const settleDialog = useSettleDebtDialog({
    onSuccess: fetchData,
    onConfirmRequest: handleConfirmRequest,
  });

  const requestWriteOffConfirmation = (debt) => {
    const balance = Math.max(
      0,
      parseFloat(debt.initial_amount || 0) - parseFloat(debt.settled_amount || 0)
    );
    handleConfirmRequest({
      heading: "Write Off Unrecovered Balance",
      text:
        debt.type === "LENT"
          ? `Mark the remaining ₹${balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })} lent to "${
              debt.person_name
            }" as unrecoverable and automatically log it as a Bad Debt Expense?`
          : `Mark the remaining ₹${balance.toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            })} borrowed from "${debt.person_name}" as waived/written-off?`,
      actionType: "WRITE_OFF",
      targetDebt: debt,
    });
  };

  const requestDeleteConfirmation = (debt) => {
    handleConfirmRequest({
      heading: "Delete Record",
      text: `Are you sure you want to delete the ${
        debt.type === "LENT" ? "receivable" : "debt"
      } record for "${debt.person_name}"?`,
      actionType: "DELETE_DEBT",
      targetDebt: debt,
    });
  };

  const handleCopyReminder = (debt) => {
    const balance = Math.max(
      0,
      parseFloat(debt.initial_amount || 0) - parseFloat(debt.settled_amount || 0)
    );
    const lentDateStr = debt.lent_date
      ? dayjs(debt.lent_date).format("DD-MMM-YYYY")
      : "";
    const dueStr = debt.due_date
      ? ` (Due: ${dayjs(debt.due_date).format("DD-MMM-YYYY")})`
      : "";
    const msg = `Hi ${debt.person_name}, a friendly reminder regarding the ₹${balance.toLocaleString(
      "en-IN",
      { minimumFractionDigits: 2 }
    )} lent on ${lentDateStr}${dueStr}. Please let me know when you can settle it. Thank you!`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(msg);
      showAlert("Payment reminder message copied to clipboard!", "success");
    } else {
      showAlert(msg, "info");
    }
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.actionType === "CREATE_DEBT") {
        await createDialog.executeCreateDebt();
      } else if (confirmDialog.actionType === "SETTLE_DEBT") {
        await settleDialog.executeSettleDebt();
      } else if (
        confirmDialog.actionType === "WRITE_OFF" &&
        confirmDialog.targetDebt
      ) {
        const res = await writeOffDebtApi(confirmDialog.targetDebt.id, {
          recordAsExpense: true,
        });
        showAlert(res.message || "Record marked as written off.", "success");
        fetchData();
      } else if (
        confirmDialog.actionType === "DELETE_DEBT" &&
        confirmDialog.targetDebt
      ) {
        await deleteDebtApi(confirmDialog.targetDebt.id);
        showAlert("Record deleted successfully!", "success");
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
        targetDebt: null,
        loading: false,
      });
    }
  };

  const filteredDebts = useMemo(() => {
    return debts.filter((d) => {
      if (filterTab === "LENT") return d.type === "LENT";
      if (filterTab === "BORROWED") return d.type === "BORROWED";
      if (filterTab === "PENDING") {
        return d.status === "PENDING" || d.status === "PARTIALLY_SETTLED";
      }
      if (filterTab === "SETTLED") {
        return d.status === "SETTLED" || d.status === "WRITTEN_OFF";
      }
      return true;
    });
  }, [debts, filterTab]);

  return {
    debts: filteredDebts,
    allDebts: debts,
    summary,
    loading,
    filterTab,
    setFilterTab,
    fetchData,
    ...createDialog,
    ...settleDialog,
    confirmDialog,
    setConfirmDialog,
    requestWriteOffConfirmation,
    requestDeleteConfirmation,
    handleCopyReminder,
    executeConfirmedAction,
  };
};
