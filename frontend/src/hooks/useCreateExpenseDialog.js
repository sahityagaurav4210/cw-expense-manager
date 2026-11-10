import { useState } from "react";
import dayjs from "dayjs";
import { createExpenseApi, updateExpenseApi } from "../services/expense.service";
import { expenseZodSchema, editExpenseZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const useCreateExpenseDialog = ({ onSuccess, onConfirmRequest }) => {
  const { showAlert } = useUI();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    category_id: "",
    type: "Variable",
    expense_date: dayjs().format("YYYY-MM-DD"),
    payment_mode: "Cash",
    is_cc_payment: false,
    captchaText: "",
  });
  const [billFile, setBillFile] = useState(null);
  const [isBillReady, setIsBillReady] = useState(true);
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOpenModal = () => {
    setEditingExpense(null);
    setFormData({
      name: "",
      amount: "",
      category_id: "",
      type: "Variable",
      expense_date: dayjs().format("YYYY-MM-DD"),
      payment_mode: "Cash",
      is_cc_payment: false,
      captchaText: "",
    });
    setBillFile(null);
    setIsBillReady(true);
    setErrors({});
    setModalOpen(true);
  };

  const handleOpenEditModal = (expense) => {
    setEditingExpense(expense);
    setFormData({
      name: expense.name || "",
      amount: expense.amount !== undefined ? String(expense.amount) : "",
      category_id: expense.category_id
        ? String(expense.category_id)
        : expense.Category?.id
        ? String(expense.Category.id)
        : "",
      type: expense.type || "Variable",
      expense_date: expense.expense_date
        ? dayjs(expense.expense_date).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
      payment_mode: expense.payment_mode || "Cash",
      is_cc_payment: Boolean(
        expense.is_cc_payment ||
        /credit\s*card\s*bill/i.test(expense.name || "")
      ),
      captchaText: "",
    });
    setBillFile(null);
    setIsBillReady(true);
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingExpense(null);
    setBillFile(null);
    setIsBillReady(true);
    setErrors({});
  };

  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const requestCreateConfirmation = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isBillReady) {
      showAlert("Please wait for the bill file upload to complete processing.", "warning");
      return;
    }

    const schema = editingExpense ? editExpenseZodSchema : expenseZodSchema;
    const result = schema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => (formatted[err.path[0]] = err.message));
      setErrors(formatted);
      showAlert("Please fix validation errors.", "error");
      return;
    }

    if (onConfirmRequest) {
      if (editingExpense) {
        onConfirmRequest({
          heading: "Update Expense Record",
          text: `Confirm updating expense "${formData.name}" (₹${parseFloat(
            formData.amount
          ).toLocaleString("en-IN")})?`,
          actionType: "UPDATE",
          targetExpense: editingExpense,
        });
      } else {
        onConfirmRequest({
          heading: "Add Expense Record",
          text: `Confirm adding expense "${formData.name}" of amount ₹${parseFloat(
            formData.amount
          ).toLocaleString("en-IN")}${billFile ? " with attached bill" : ""}?`,
          actionType: "CREATE",
        });
      }
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
    payload.append("payment_mode", formData.payment_mode || "Cash");
    payload.append("is_cc_payment", formData.is_cc_payment ? "true" : "false");
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

  const executeUpdateExpense = async () => {
    if (!editingExpense) return;
    const payload = new FormData();
    payload.append("name", formData.name);
    payload.append("amount", formData.amount);
    if (formData.category_id) {
      payload.append("category_id", formData.category_id);
    }
    payload.append("type", formData.type);
    payload.append("expense_date", formData.expense_date);
    payload.append("payment_mode", formData.payment_mode || "Cash");
    payload.append("is_cc_payment", formData.is_cc_payment ? "true" : "false");
    if (formData.captchaText) {
      payload.append("captchaText", formData.captchaText);
    }
    if (captchaId) {
      payload.append("captchaId", captchaId);
    }
    if (billFile) {
      payload.append("bill", billFile);
    }

    await updateExpenseApi(editingExpense.id, payload);
    showAlert("Expense updated successfully!", "success");
    handleCloseModal();
    if (onSuccess) onSuccess();
  };

  return {
    modalOpen,
    isEdit: Boolean(editingExpense),
    editingExpense,
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
    handleOpenEditModal,
    handleCloseModal,
    handleKeyDownNumber,
    requestCreateConfirmation,
    executeCreateExpense,
    executeUpdateExpense,
  };
};
