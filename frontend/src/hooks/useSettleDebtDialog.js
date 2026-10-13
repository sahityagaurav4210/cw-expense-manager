import { useState } from "react";
import dayjs from "dayjs";
import { addDebtSettlementApi } from "../services/debt.service";
import { debtSettlementZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const useSettleDebtDialog = ({ onSuccess, onConfirmRequest }) => {
  const { showAlert } = useUI();
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState(null);
  const [settleFormData, setSettleFormData] = useState({
    amount: "",
    settlement_date: dayjs().format("YYYY-MM-DD"),
    payment_mode: "UPI",
    notes: "",
    captchaText: "",
  });
  const [settleCaptchaId, setSettleCaptchaId] = useState("");
  const [settleErrors, setSettleErrors] = useState({});

  const handleOpenSettleModal = (debt) => {
    const balance = Math.max(
      0,
      parseFloat(debt.initial_amount || 0) - parseFloat(debt.settled_amount || 0)
    );
    setSelectedDebt(debt);
    setSettleFormData({
      amount: balance > 0 ? String(balance.toFixed(2)) : "",
      settlement_date: dayjs().format("YYYY-MM-DD"),
      payment_mode: "UPI",
      notes: "",
      captchaText: "",
    });
    setSettleErrors({});
    setSettleModalOpen(true);
  };

  const handleCloseSettleModal = () => {
    setSettleModalOpen(false);
    setSelectedDebt(null);
    setSettleErrors({});
  };

  const handleSettleChange = (field) => (e) => {
    setSettleFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (settleErrors[field]) {
      setSettleErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const requestSettleConfirmation = (e) => {
    e.preventDefault();
    if (!selectedDebt) return;

    const result = debtSettlementZodSchema.safeParse(settleFormData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => {
        formatted[err.path[0]] = err.message;
      });
      setSettleErrors(formatted);
      showAlert("Please fix validation errors.", "error");
      return;
    }

    const balance = Math.max(
      0,
      parseFloat(selectedDebt.initial_amount || 0) -
        parseFloat(selectedDebt.settled_amount || 0)
    );
    const enteredAmount = parseFloat(settleFormData.amount);

    if (enteredAmount > balance + 0.001) {
      setSettleErrors({
        amount: `Amount cannot exceed remaining balance of ₹${balance.toLocaleString(
          "en-IN"
        )}`,
      });
      showAlert("Settlement amount exceeds remaining balance.", "error");
      return;
    }

    if (onConfirmRequest) {
      onConfirmRequest({
        heading: "Confirm Settlement Payment",
        text: `Record ${
          selectedDebt.type === "LENT" ? "recovery" : "repayment"
        } of ₹${enteredAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })} via ${settleFormData.payment_mode} for "${
          selectedDebt.person_name
        }"?`,
        actionType: "SETTLE_DEBT",
        targetDebt: selectedDebt,
      });
    }
  };

  const executeSettleDebt = async () => {
    if (!selectedDebt) return;
    await addDebtSettlementApi(selectedDebt.id, {
      ...settleFormData,
      amount: parseFloat(settleFormData.amount),
      captchaId: settleCaptchaId,
    });
    showAlert("Settlement payment recorded successfully!", "success");
    handleCloseSettleModal();
    if (onSuccess) onSuccess();
  };

  return {
    settleModalOpen,
    selectedDebt,
    settleFormData,
    settleCaptchaId,
    setSettleCaptchaId,
    settleErrors,
    handleOpenSettleModal,
    handleCloseSettleModal,
    handleSettleChange,
    requestSettleConfirmation,
    executeSettleDebt,
  };
};
