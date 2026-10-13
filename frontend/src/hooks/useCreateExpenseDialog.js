import { useState } from "react";
import dayjs from "dayjs";
import { createExpenseApi } from "../services/expense.service";
import { expenseZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const useCreateExpenseDialog = ({ onSuccess, onConfirmRequest }) => {
  const { showAlert } = useUI();
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

  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
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

    if (onConfirmRequest) {
      onConfirmRequest({
        heading: "Add Expense Record",
        text: `Confirm adding expense "${formData.name}" of amount ₹${parseFloat(
          formData.amount
        ).toLocaleString("en-IN")}${billFile ? " with attached bill" : ""}?`,
        actionType: "CREATE",
      });
    }
  };

  const executeCreateExpense = async () => {
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
    handleCloseModal();
    if (onSuccess) onSuccess();
  };

  return {
    modalOpen,
    formData,
    billFile,
    setBillFile,
    isBillReady,
    setIsBillReady,
    captchaId,
    setCaptchaId,
    errors,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    handleKeyDownNumber,
    requestCreateConfirmation,
    executeCreateExpense,
  };
};
