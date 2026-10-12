import { useState, useCallback } from "react";
import { addBudgetInflowApi } from "../services/budget.service";
import { useUI } from "../context/UIContext";
import dayjs from "dayjs";

export const useBudgetInflow = () => {
  const { showAlert } = useUI();
  const [open, setOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    amount: "",
    source: "",
    received_date: dayjs().format("YYYY-MM-DD"),
    notes: "",
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

  const handleOpen = useCallback((budget) => {
    setSelectedBudget(budget);
    setFormData({
      amount: "",
      source: "",
      received_date: dayjs().format("YYYY-MM-DD"),
      notes: "",
      captchaText: "",
    });
    setErrors({});
    setConfirmDialog({ open: false, heading: "", text: "", loading: false });
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setSelectedBudget(null);
    setErrors({});
    setConfirmDialog({ open: false, heading: "", text: "", loading: false });
  }, []);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleDateChange = (date) => {
    const formatted = date ? dayjs(date).format("YYYY-MM-DD") : "";
    setFormData((prev) => ({ ...prev, received_date: formatted }));
    if (errors.received_date) {
      setErrors((prev) => ({ ...prev, received_date: null }));
    }
  };

  const validate = () => {
    const errs = {};
    const amt = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amt) || amt <= 0) {
      errs.amount = "Please enter a valid amount greater than 0.";
    } else if (/[eE]/.test(String(formData.amount))) {
      errs.amount = "Scientific notation is not allowed.";
    }

    if (!formData.source || !formData.source.trim()) {
      errs.source = "Source / description is required (e.g. Received from Rahul, Gift).";
    }

    if (!formData.received_date) {
      errs.received_date = "Received date is required.";
    } else if (dayjs(formData.received_date).isAfter(dayjs(), "day")) {
      errs.received_date = "Received date cannot be in the future.";
    }

    const cIdStr = String(captchaId || "");
    if (!formData.captchaText || !formData.captchaText.trim()) {
      errs.captchaText = "CAPTCHA verification is required.";
    } else if (cIdStr.startsWith("fallback_")) {
      const parts = cIdStr.split("_");
      if (parts.length >= 3 && parts[1]) {
        try {
          const expected = atob(parts[1]);
          if (formData.captchaText.trim().toUpperCase() !== expected.trim().toUpperCase()) {
            errs.captchaText = "Incorrect CAPTCHA code. Please check and try again.";
          }
        } catch {
          // ignore
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const requestConfirmation = () => {
    if (!selectedBudget) return;
    if (!validate()) {
      showAlert("Please fix the validation errors before proceeding.", "error");
      return false;
    }

    const formattedAmt = parseFloat(formData.amount).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
    });

    setConfirmDialog({
      open: true,
      heading: "Confirm Extra Income Addition",
      text: `Are you sure you want to add ₹${formattedAmt} (Source: "${formData.source.trim()}") to the current active budget (${selectedBudget.from_date} to ${selectedBudget.to_date})?`,
      loading: false,
    });
    return true;
  };

  const handleCancelConfirmation = () => {
    setConfirmDialog({ open: false, heading: "", text: "", loading: false });
  };

  const executeConfirmedInflow = async (onSuccess) => {
    if (!selectedBudget) return;

    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    setLoading(true);

    try {
      await addBudgetInflowApi(selectedBudget.id, {
        amount: formData.amount,
        source: formData.source,
        received_date: formData.received_date,
        notes: formData.notes,
        captchaText: formData.captchaText,
        captchaId: String(captchaId),
      });

      showAlert(
        `Successfully added extra income of ₹${parseFloat(formData.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })} to active budget!`,
        "success"
      );
      setConfirmDialog({ open: false, heading: "", text: "", loading: false });
      handleClose();
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setConfirmDialog((prev) => ({ ...prev, loading: false, open: false }));
      const msg = err.response?.data?.message || "Failed to add budget top-up.";
      showAlert(msg, "error");

      if (msg.toLowerCase().includes("captcha")) {
        setErrors((prev) => ({ ...prev, captchaText: msg }));
        setFormData((prev) => ({ ...prev, captchaText: "" }));
      }
    } finally {
      setLoading(false);
    }
  };

  return {
    open,
    selectedBudget,
    loading,
    formData,
    captchaId,
    setCaptchaId,
    errors,
    confirmDialog,
    handleOpen,
    handleClose,
    handleChange,
    handleDateChange,
    requestConfirmation,
    handleCancelConfirmation,
    executeConfirmedInflow,
    handleSubmit: requestConfirmation,
  };
};
