import { useState, useCallback } from "react";

/**
 * Custom hook for managing the state and verification of CaptchaDialog.
 *
 * @param {Object} options
 * @param {Function} options.onSuccess - Callback invoked when CAPTCHA is successfully validated: ({ captchaText, captchaId }) => Promise<void> | void
 * @param {Function} [options.onClose] - Optional callback when dialog is closed
 */
export const useCaptchaDialog = ({ onSuccess, onClose: customOnClose } = {}) => {
  const [open, setOpen] = useState(false);
  const [captchaText, setCaptchaText] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleOpen = useCallback(() => {
    setCaptchaText("");
    setError("");
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    if (loading) return;
    setOpen(false);
    setCaptchaText("");
    setError("");
    if (customOnClose) customOnClose();
  }, [loading, customOnClose]);

  const handleCaptchaTextChange = useCallback((e) => {
    setCaptchaText(e.target.value);
    setError("");
  }, []);

  /**
   * Fast client verification for fallback captchas or via direct captcha service
   */
  const verifyCaptchaClient = async (text, id) => {
    const trimmedText = (text || "").trim();
    const cidStr = String(id || "");

    // 1. Check fallback offline captcha format: fallback_<base64Code>_<timestamp>
    if (cidStr.startsWith("fallback_")) {
      const parts = cidStr.split("_");
      if (parts.length >= 3 && parts[1]) {
        try {
          const expected = atob(parts[1]).trim().toUpperCase();
          return trimmedText.toUpperCase() === expected;
        } catch {
          return false;
        }
      }
      return false;
    }

    // 2. Validate against Captcha Service (http://localhost:11905)
    try {
      const res = await fetch("http://localhost:11905/api/v1/captcha/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          captcha: trimmedText,
          captchaId: String(id || "default"),
        }),
      });
      return res.status === 200;
    } catch {
      // If service is unreachable, proceed to backend validation
      return true;
    }
  };

  const handleSubmit = useCallback(
    async (e) => {
      if (e && e.preventDefault) e.preventDefault();

      const trimmedCaptcha = (captchaText || "").trim();
      if (!trimmedCaptcha) {
        setError("Please enter the CAPTCHA text.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const isClientValid = await verifyCaptchaClient(trimmedCaptcha, captchaId);
        if (!isClientValid) {
          setError("Incorrect CAPTCHA code. Please try again.");
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("cw-api-error"));
          }
          setCaptchaText("");
          setLoading(false);
          return;
        }

        if (onSuccess) {
          await onSuccess({
            captchaText: trimmedCaptcha,
            captchaId,
          });
        }

        setOpen(false);
        setCaptchaText("");
      } catch (err) {
        const errMsg =
          err.response?.data?.message || err.message || "CAPTCHA verification failed.";
        setError(errMsg);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cw-api-error"));
        }
        setCaptchaText("");
      } finally {
        setLoading(false);
      }
    },
    [captchaText, captchaId, onSuccess]
  );

  return {
    open,
    setOpen,
    handleOpen,
    handleClose,
    captchaText,
    setCaptchaText,
    captchaId,
    setCaptchaId,
    error,
    setError,
    loading,
    setLoading,
    handleCaptchaTextChange,
    handleSubmit,

    // Aliases for seamless spreading on CaptchaDialog
    onClose: handleClose,
    onSubmit: handleSubmit,
    onCaptchaTextChange: handleCaptchaTextChange,
    onCaptchaIdChange: setCaptchaId,
  };
};

export default useCaptchaDialog;
