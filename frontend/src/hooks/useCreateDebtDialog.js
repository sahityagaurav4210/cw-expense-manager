import { useState } from "react";
import dayjs from "dayjs";
import { createDebtApi } from "../services/debt.service";
import { debtZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const useCreateDebtDialog = ({ onSuccess, onConfirmRequest }) => {
  const { showAlert } = useUI();
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: "LENT",
    person_name: "",
    contact_info: "",
    initial_amount: "",
    lent_date: dayjs().format("YYYY-MM-DD"),
    due_date: "",
    notes: "",
    captchaText: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOpenModal = (defaultType = "LENT") => {
    setFormData({
      type: defaultType === "BORROWED" ? "BORROWED" : "LENT",
      person_name: "",
      contact_info: "",
      initial_amount: "",
      lent_date: dayjs().format("YYYY-MM-DD"),
      due_date: "",
      notes: "",
      captchaText: "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setErrors({});
  };

  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const requestCreateConfirmation = (e) => {
    e.preventDefault();
    const result = debtZodSchema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => {
        formatted[err.path[0]] = err.message;
      });
      setErrors(formatted);
      showAlert("Please fix validation errors.", "error");
      return;
    }

    const isLent = formData.type === "LENT";
    if (onConfirmRequest) {
      onConfirmRequest({
        heading: isLent ? "Confirm Money Lent (Receivable)" : "Confirm Money Borrowed (Debt)",
        text: `Confirm recording ₹${parseFloat(formData.initial_amount).toLocaleString(
          "en-IN",
          { minimumFractionDigits: 2 }
        )} ${isLent ? "lent to" : "borrowed from"} "${formData.person_name}"?`,
        actionType: "CREATE_DEBT",
      });
    }
  };

  const executeCreateDebt = async () => {
    await createDebtApi({
      ...formData,
      initial_amount: parseFloat(formData.initial_amount),
      captchaId,
    });
    showAlert(
      formData.type === "LENT"
        ? "Receivable (Money Lent) recorded successfully!"
        : "Debt (Money Borrowed) recorded successfully!",
      "success"
    );
    handleCloseModal();
    if (onSuccess) onSuccess();
  };

  return {
    modalOpen,
    formData,
    captchaId,
    setCaptchaId,
    errors,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    handleKeyDownNumber,
    requestCreateConfirmation,
    executeCreateDebt,
  };
};
