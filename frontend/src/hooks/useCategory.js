import { useState, useEffect, useCallback } from "react";
import {
  getCategoriesApi,
  createCategoryApi,
  toggleCategoryActiveApi,
  deleteCategoryApi,
} from "../services/category.service";
import { categoryZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

export const useCategory = () => {
  const { showAlert } = useUI();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", captchaText: "" });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    actionType: null, // 'CREATE' | 'TOGGLE' | 'DELETE'
    targetCategory: null,
    loading: false,
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCategoriesApi();
      const items = (res.data || []).slice().sort((a, b) => Number(b.id) - Number(a.id));
      setCategories(items);
    } catch (err) {
      showAlert(err.response?.data?.message || "Failed to load categories.", "error");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleOpenCreateModal = () => {
    setFormData({ name: "", captchaText: "" });
    setErrors({});
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const requestCreateConfirmation = (e) => {
    e.preventDefault();
    const result = categoryZodSchema.safeParse(formData);
    if (!result.success) {
      const formatted = {};
      result.error.errors.forEach((err) => (formatted[err.path[0]] = err.message));
      setErrors(formatted);
      return;
    }
    setConfirmDialog({
      open: true,
      heading: "Create New Category",
      text: `Are you sure you want to create category "${formData.name}"?`,
      actionType: "CREATE",
      targetCategory: null,
      loading: false,
    });
  };

  const requestToggleConfirmation = (category) => {
    setConfirmDialog({
      open: true,
      heading: "Toggle Category Status",
      text: `Are you sure you want to ${category.active_flag ? "deactivate" : "activate"} category "${category.name}"?`,
      actionType: "TOGGLE",
      targetCategory: category,
      loading: false,
    });
  };

  const requestDeleteConfirmation = (category) => {
    setConfirmDialog({
      open: true,
      heading: "Delete Category",
      text: `Are you sure you want to delete category "${category.name}"?`,
      actionType: "DELETE",
      targetCategory: category,
      loading: false,
    });
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      if (confirmDialog.actionType === "CREATE") {
        await createCategoryApi({ ...formData, captchaId });
        showAlert("Category created successfully!", "success");
        setModalOpen(false);
        fetchCategories();
      } else if (confirmDialog.actionType === "TOGGLE" && confirmDialog.targetCategory) {
        await toggleCategoryActiveApi(confirmDialog.targetCategory.id, {
          captchaText: "VALIDATED",
          captchaId,
        });
        showAlert("Category status updated!", "success");
        fetchCategories();
      } else if (confirmDialog.actionType === "DELETE" && confirmDialog.targetCategory) {
        await deleteCategoryApi(confirmDialog.targetCategory.id, {
          captchaText: "VALIDATED",
          captchaId,
        });
        showAlert("Category deleted successfully!", "success");
        fetchCategories();
      }
    } catch (err) {
      showAlert(err.response?.data?.message || "Operation failed.", "error");
    } finally {
      setConfirmDialog({ open: false, heading: "", text: "", actionType: null, targetCategory: null, loading: false });
    }
  };

  return {
    categories,
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
