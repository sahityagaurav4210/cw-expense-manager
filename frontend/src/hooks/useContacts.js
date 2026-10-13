import { useState, useEffect, useCallback } from "react";
import {
  getContactsApi,
  createContactApi,
  updateContactApi,
  deleteContactApi,
  toggleFavoriteContactApi,
} from "../services/contact.service";
import { contactZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";

const INITIAL_FORM_STATE = {
  name: "",
  phone: "",
  email: "",
  category: "Other",
  company: "",
  job_title: "",
  address: "",
  notes: "",
  is_favorite: false,
  captchaText: "",
};

export const useContacts = () => {
  const { showAlert } = useUI();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState({});
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [captchaId, setCaptchaId] = useState("");

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    heading: "",
    text: "",
    targetContact: null,
    loading: false,
  });

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterCategory && filterCategory !== "ALL") {
        params.category = filterCategory;
      }
      if (searchQuery && searchQuery.trim() !== "") {
        params.search = searchQuery.trim();
      }
      const res = await getContactsApi(params);
      setContacts(res.data || []);
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to load contacts.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [filterCategory, searchQuery, showAlert]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type.toLowerCase())) {
      showAlert("Only JPG, JPEG, or PNG images are allowed.", "error");
      return;
    }

    if (file.size > 1 * 1024 * 1024) {
      showAlert("Profile photo must not exceed 1MB.", "error");
      return;
    }

    setPhotoFile(file);
    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
    setFormData((prev) => ({ ...prev, remove_photo: false }));
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, remove_photo: true }));
  };

  const handleOpenCreateModal = () => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
    setPhotoFile(null);
    setPhotoPreview(null);
    setCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setCreateModalOpen(false);
    setErrors({});
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleOpenEditModal = (contact) => {
    setSelectedContact(contact);
    setFormData({
      name: contact.name || "",
      phone: contact.phone || "",
      email: contact.email || "",
      category: contact.category || "Other",
      company: contact.company || "",
      job_title: contact.job_title || "",
      address: contact.address || "",
      notes: contact.notes || "",
      is_favorite: Boolean(contact.is_favorite),
      captchaText: "",
    });
    setErrors({});
    setPhotoFile(null);
    setPhotoPreview(contact.profile_photo || null);
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedContact(null);
    setErrors({});
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    const result = contactZodSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      showAlert("Please fix validation errors before saving.", "error");
      return;
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          payload.append(key, formData[key]);
        }
      });
      if (photoFile) {
        payload.append("profile_photo", photoFile);
      }
      if (captchaId) {
        payload.append("captchaId", captchaId);
      }

      await createContactApi(payload);
      showAlert(`Contact "${formData.name}" created successfully.`, "success");
      handleCloseCreateModal();
      fetchContacts();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to create contact.",
        "error"
      );
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!selectedContact) return;

    const result = contactZodSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      showAlert("Please fix validation errors before saving.", "error");
      return;
    }

    try {
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== undefined && formData[key] !== null) {
          payload.append(key, formData[key]);
        }
      });
      if (photoFile) {
        payload.append("profile_photo", photoFile);
      }
      if (captchaId) {
        payload.append("captchaId", captchaId);
      }

      await updateContactApi(selectedContact.id, payload);
      showAlert(`Contact "${formData.name}" updated successfully.`, "success");
      handleCloseEditModal();
      fetchContacts();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to update contact.",
        "error"
      );
    }
  };

  const requestDeleteConfirmation = (contact) => {
    setConfirmDialog({
      open: true,
      heading: "Delete Contact",
      text: `Are you sure you want to permanently delete contact "${contact.name}"? This action cannot be undone.`,
      targetContact: contact,
      loading: false,
    });
  };

  const executeConfirmedDelete = async () => {
    if (!confirmDialog.targetContact) return;
    setConfirmDialog((prev) => ({ ...prev, loading: true }));
    try {
      await deleteContactApi(confirmDialog.targetContact.id);
      showAlert(
        `Contact "${confirmDialog.targetContact.name}" deleted successfully.`,
        "success"
      );
      setConfirmDialog({
        open: false,
        heading: "",
        text: "",
        targetContact: null,
        loading: false,
      });
      fetchContacts();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to delete contact.",
        "error"
      );
      setConfirmDialog((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleToggleFavorite = async (contactId) => {
    try {
      // Optimistic update
      setContacts((prev) =>
        prev.map((c) =>
          c.id === contactId ? { ...c, is_favorite: !c.is_favorite } : c
        )
      );
      const res = await toggleFavoriteContactApi(contactId);
      showAlert(res.message || "Contact favorite status updated.", "info");
      fetchContacts();
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to update favorite status.",
        "error"
      );
      fetchContacts();
    }
  };

  return {
    contacts,
    loading,
    filterCategory,
    setFilterCategory,
    searchQuery,
    setSearchQuery,
    fetchContacts,
    // Create Modal
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSubmitCreate,
    // Edit Modal
    editModalOpen,
    selectedContact,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSubmitEdit,
    // Form & Files
    formData,
    errors,
    photoPreview,
    captchaId,
    setCaptchaId,
    handleChange,
    handleFileChange,
    handleRemovePhoto,
    // Actions
    confirmDialog,
    setConfirmDialog,
    requestDeleteConfirmation,
    executeConfirmedDelete,
    handleToggleFavorite,
  };
};
