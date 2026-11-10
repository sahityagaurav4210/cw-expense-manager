import { useState, useEffect, useCallback } from "react";
import {
  getPaymentOptionsApi,
  createPaymentOptionApi,
  togglePaymentOptionActiveApi,
  deletePaymentOptionApi,
} from "../services/paymentOption.service";
import { paymentOptionZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const usePaymentOptions = () => {
  const { showAlert } = useUI();
  const [paymentOptions, setPaymentOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ payment_name: "", captchaText: "" });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE' | 'TOGGLE' | 'DELETE'
    targetOption: null,
    loading: false,
  });

  const fetchPaymentOptions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPaymentOptionsApi();
      const items = (res.data || []).slice().sort((a, b) => Number(b.id) - Number(a.id));
      setPaymentOptions(items);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load payment options.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchPaymentOptions();
  }, [fetchPaymentOptions]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOpenCreateModal = () => {
    setFormData({ payment_name: "", captchaText: "" });
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const requestCreateConfirmation = (e) => {
    e.preventDefault();
    const result = paymentOptionZodSchema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => (formatted[err.path[0]] = err.message));
      setErrors(formatted);
      return;
    }
    setConfirmDialog({
      open: true,
      heading: "Create New Payment Option",
      text: `Are you sure you want to create payment option "${formData.payment_name}"?`,
      actionType: "CREATE",
      targetOption: null,
      loading: false,
    });
  };

  const requestToggleConfirmation = (option) => {
    const isActive = Boolean(option.is_active ?? option.isActive);
    const name = option.payment_name || option.PaymentName;
    setConfirmDialog({
      open: true,
      heading: "Toggle Payment Option Status",
      text: `Are you sure you want to ${isActive ? "deactivate" : "activate"} payment option "${name}"?`,
      actionType: "TOGGLE",
      targetOption: option,
      loading: false,
    });
  };

  const requestDeleteConfirmation = (option) => {
    const name = option.payment_name || option.PaymentName;
    setConfirmDialog({
      open: true,
      heading: "Delete Payment Option",
      text: `Are you sure you want to delete payment option "${name}"?`,
      actionType: "DELETE",
      targetOption: option,
      loading: false,
    });
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.actionType === "CREATE") {
        await createPaymentOptionApi({ ...formData, captchaId });
        showAlert("Payment option created successfully!", "success");
        setModalOpen(false);
        fetchPaymentOptions();
      } else if (confirmDialog.actionType === "TOGGLE" && confirmDialog.targetOption) {
        await togglePaymentOptionActiveApi(confirmDialog.targetOption.id, {
          captchaText: "VALIDATED",
          captchaId,
        });
        showAlert("Payment option status updated!", "success");
        fetchPaymentOptions();
      } else if (confirmDialog.actionType === "DELETE" && confirmDialog.targetOption) {
        await deletePaymentOptionApi(confirmDialog.targetOption.id, {
          captchaText: "VALIDATED",
          captchaId,
        });
        showAlert("Payment option deleted successfully!", "success");
        fetchPaymentOptions();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setConfirmDialog({ open: false, heading: "", text: "", actionType: null, targetOption: null, loading: false });
    }
  };

  return {
    paymentOptions,
    loading,
    modalOpen,
    formData,
    captchaId,
    setCaptchaId,
    errors,
    confirmDialog,
    setConfirmDialog,
    handleChange,
    handleOpenCreateModal,
    handleCloseModal,
    requestCreateConfirmation,
    requestToggleConfirmation,
    requestDeleteConfirmation,
    executeConfirmedAction,
  };
};
