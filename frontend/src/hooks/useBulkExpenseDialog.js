import { useState, useEffect, useRef } from "react";
import {
  bulkCreateExpenseApi,
  downloadBulkExpenseTemplateApi,
} from "../services/expense.service";
import { bulkExpenseUploadZodSchema } from "../validators/zodSchemas";
import { parseAndValidateBulkExpenseFile } from "../utils/xlsxParser";
import { useUI } from "../context/UIContext";

export const useBulkExpenseDialog = ({ categories = [], onSuccess, onConfirmRequest }) => {
  const { showAlert } = useUI();
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkFileReady, setIsBulkFileReady] = useState(true);
  const [isParsingPreview, setIsParsingPreview] = useState(false);
  const [bulkParsedRows, setBulkParsedRows] = useState([]);
  const [bulkValidationErrors, setBulkValidationErrors] = useState([]);
  const [bulkParseError, setBulkParseError] = useState("");
  const [bulkCaptcha, setBulkCaptcha] = useState("");
  const [bulkCaptchaId, setBulkCaptchaId] = useState("");
  const [bulkErrors, setBulkErrors] = useState({});

  const pendingNotificationRef = useRef(null);

  const isPreviewLoading =
    Boolean(bulkFile) && (!isBulkFileReady || isParsingPreview);

  // Trigger validation alert once both file upload simulation and parsing complete
  useEffect(() => {
    if (!isPreviewLoading && pendingNotificationRef.current) {
      const { message, severity } = pendingNotificationRef.current;
      pendingNotificationRef.current = null;
      showAlert(message, severity);
    }
  }, [isPreviewLoading, showAlert]);

  const handleOpenBulkModal = () => {
    setBulkFile(null);
    setIsBulkFileReady(true);
    setIsParsingPreview(false);
    setBulkParsedRows([]);
    setBulkValidationErrors([]);
    setBulkParseError("");
    setBulkCaptcha("");
    setBulkErrors({});
    pendingNotificationRef.current = null;
    setBulkModalOpen(true);
  };

  const handleCloseBulkModal = () => {
    setBulkModalOpen(false);
    setBulkFile(null);
    setIsBulkFileReady(true);
    setIsParsingPreview(false);
    setBulkParsedRows([]);
    setBulkValidationErrors([]);
    setBulkParseError("");
    setBulkCaptcha("");
    setBulkErrors({});
    pendingNotificationRef.current = null;
  };

  const handleClearBulkFile = () => {
    setBulkFile(null);
    setIsBulkFileReady(true);
    setIsParsingPreview(false);
    setBulkParsedRows([]);
    setBulkValidationErrors([]);
    setBulkParseError("");
    setBulkErrors((prev) => ({ ...prev, file: null }));
    pendingNotificationRef.current = null;
  };

  const handleBulkFileChange = async (file) => {
    setBulkFile(file);
    setBulkErrors((prev) => ({ ...prev, file: null }));
    setBulkParseError("");
    setBulkParsedRows([]);
    setBulkValidationErrors([]);
    pendingNotificationRef.current = null;

    if (!file) {
      setIsParsingPreview(false);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      const msg = "Only .xlsx Excel template files are allowed.";
      setBulkParseError(msg);
      setIsParsingPreview(false);
      showAlert(msg, "error");
      return;
    }

    setIsParsingPreview(true);
    try {
      const result = await parseAndValidateBulkExpenseFile(file, categories);
      setBulkParsedRows(result.rows || []);
      setBulkValidationErrors(result.errors || []);
      if (result.errors && result.errors.length > 0) {
        pendingNotificationRef.current = {
          message: `Found ${result.errors.length} validation error(s) in the uploaded template. Please review the highlighted issues.`,
          severity: "error",
        };
      } else {
        pendingNotificationRef.current = {
          message: `Template validated successfully! ${result.rows.length} expense row(s) ready for bulk creation.`,
          severity: "success",
        };
      }
    } catch (err) {
      const errMsg = err?.message || "Failed to parse the uploaded Excel template.";
      setBulkParseError(errMsg);
      pendingNotificationRef.current = {
        message: errMsg,
        severity: "error",
      };
    } finally {
      setIsParsingPreview(false);
    }
  };

  const handleBulkCaptchaChange = (e) => {
    setBulkCaptcha(e.target.value);
    if (bulkErrors.captcha) {
      setBulkErrors((prev) => ({ ...prev, captcha: null }));
    }
  };

  const handleDownloadBulkTemplate = async () => {
    try {
      const res = await downloadBulkExpenseTemplateApi();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "BULK EXPENSE CREATION TEMPLATE.xlsx";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      showAlert("Failed to download bulk expense template.", "error");
    }
  };

  const requestBulkCreateConfirmation = (e) => {
    e.preventDefault();
    if (isPreviewLoading || !isBulkFileReady) {
      showAlert("Please wait, your data preview is loading...", "warning");
      return;
    }

    if (!bulkFile) {
      setBulkErrors((prev) => ({
        ...prev,
        file: "Please upload the filled BULK EXPENSE CREATION TEMPLATE.xlsx file.",
      }));
      showAlert("Please upload the filled Excel template file.", "error");
      return;
    }

    if (bulkParseError) {
      showAlert(bulkParseError, "error");
      return;
    }

    if (bulkValidationErrors.length > 0) {
      showAlert(
        `Please fix the ${bulkValidationErrors.length} validation error(s) in your Excel template before uploading.`,
        "error"
      );
      return;
    }

    if (bulkParsedRows.length === 0) {
      showAlert("No valid expense rows found in the uploaded template.", "error");
      return;
    }

    const captchaValidation = bulkExpenseUploadZodSchema.safeParse({
      captcha: bulkCaptcha,
      captchaId: String(bulkCaptchaId || "default"),
    });

    if (!captchaValidation.success) {
      const formatted = {};
      captchaValidation.error.errors.forEach((err) => {
        formatted[err.path[0]] = err.message;
      });
      setBulkErrors(formatted);
      showAlert("Please enter the CAPTCHA verification code.", "error");
      return;
    }

    const totalAmount = bulkParsedRows.reduce(
      (sum, r) => sum + (parseFloat(r.amount) || 0),
      0
    );

    if (onConfirmRequest) {
      onConfirmRequest({
        heading: "Confirm Bulk Expense Creation",
        text: `Are you sure you want to create ${
          bulkParsedRows.length
        } expense record(s) totaling ₹${totalAmount.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
        })} in one go?`,
        actionType: "BULK_CREATE",
      });
    }
  };

  const executeBulkCreateExpense = async () => {
    const payload = new FormData();
    payload.append("template", bulkFile);
    payload.append("captcha", bulkCaptcha);
    payload.append("captchaText", bulkCaptcha);
    payload.append("captchaId", bulkCaptchaId || "default");

    try {
      const res = await bulkCreateExpenseApi(payload);
      showAlert(
        res.message ||
          `${res.count || bulkParsedRows.length} expenses created in bulk successfully!`,
        "success"
      );
      handleCloseBulkModal();
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        setBulkValidationErrors(err.response.data.errors);
      }
      throw err;
    }
  };

  return {
    bulkModalOpen,
    bulkFile,
    isBulkFileReady,
    setIsBulkFileReady,
    isPreviewLoading,
    bulkParsedRows,
    bulkValidationErrors,
    setBulkValidationErrors,
    bulkParseError,
    bulkCaptcha,
    bulkCaptchaId,
    setBulkCaptchaId,
    bulkErrors,
    handleOpenBulkModal,
    handleCloseBulkModal,
    handleBulkFileChange,
    handleClearBulkFile,
    handleBulkCaptchaChange,
    handleDownloadBulkTemplate,
    requestBulkCreateConfirmation,
    executeBulkCreateExpense,
  };
};
