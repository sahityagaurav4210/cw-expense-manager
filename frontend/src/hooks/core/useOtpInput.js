import { useState, useRef, useEffect, useCallback } from "react";
import { verifyOtpApi, resendOtpApi } from "../../services/auth.service";
import { useCaptchaDialog } from "../dialog/useCaptchaDialog";
import { useUI } from "../../context/UIContext";

/**
 * Custom hook encapsulating the logic for OTP input components.
 * Manages:
 * - Digit-by-digit separate cell input and keyboard navigation
 * - Auto-focus and clipboard paste distribution across cells
 * - Calling backend OTP verification API
 * - Calling backend Resend OTP API with CaptchaDialog integration
 * - Resend countdown cooldown timer
 */
export const useOtpInput = ({
  length = 6,
  value: externalValue,
  onChange: externalOnChange,
  tempToken,
  onVerified,
  onResendSuccess,
  disabled = false,
  autoFocus = true,
}) => {
  const { showAlert } = useUI();
  const inputRefs = useRef([]);

  const [internalOtp, setInternalOtp] = useState(externalValue || "");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendLoading, setResendLoading] = useState(false);

  // Sync internal state with externalValue if controlled
  useEffect(() => {
    if (externalValue !== undefined) {
      setInternalOtp(externalValue);
    }
  }, [externalValue]);

  // Ensure inputRefs array length matches length prop
  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, length);
  }, [length]);

  // Focus the first input on initial mount if autoFocus is true
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      const timer = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus, disabled]);

  // Resend cooldown timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const currentOtp = externalValue !== undefined ? externalValue : internalOtp;
  const digits = Array.from({ length }, (_, i) => currentOtp[i] || "");

  const setInputRef = useCallback(
    (index) => (el) => {
      inputRefs.current[index] = el;
    },
    []
  );

  const updateOtp = useCallback(
    (newOtp) => {
      if (externalValue === undefined) {
        setInternalOtp(newOtp);
      }
      if (externalOnChange) {
        externalOnChange(newOtp);
      }
      if (otpError) {
        setOtpError("");
      }
    },
    [externalValue, externalOnChange, otpError]
  );

  /**
   * Verifies the OTP with backend API
   */
  const handleVerify = useCallback(
    async (otpToVerify = currentOtp) => {
      const trimmed = (otpToVerify || "").trim();
      if (trimmed.length !== length) {
        setOtpError(`Please enter the complete ${length}-digit verification code.`);
        return;
      }

      if (!tempToken) {
        if (onVerified) onVerified({ otp: trimmed });
        return;
      }

      setOtpLoading(true);
      setOtpError("");
      try {
        const res = await verifyOtpApi({ tempToken, otp: trimmed });
        if (onVerified) {
          onVerified(res.data);
        }
      } catch (err) {
        const errMsg =
          err.response?.data?.message || err.message || "Invalid verification code.";
        setOtpError(errMsg);
        if (showAlert) {
          showAlert(errMsg, "error");
        }
      } finally {
        setOtpLoading(false);
      }
    },
    [currentOtp, length, tempToken, onVerified, showAlert]
  );

  const handleInputChange = useCallback(
    (index, e) => {
      const rawVal = e.target.value;
      const digit = rawVal.replace(/\D/g, "").slice(-1);

      const newDigits = [...digits];
      newDigits[index] = digit;
      const newOtp = newDigits.join("");

      updateOtp(newOtp);

      // Auto-advance to next input cell
      if (digit && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // If all digits filled, automatically attempt verification
      if (newOtp.length === length && !newOtp.includes(" ")) {
        handleVerify(newOtp);
      }
    },
    [digits, length, updateOtp, handleVerify]
  );

  const handleKeyDown = useCallback(
    (index, e) => {
      if (disabled || otpLoading) return;

      if (e.key === "Backspace") {
        if (!digits[index] && index > 0) {
          inputRefs.current[index - 1]?.focus();
          const newDigits = [...digits];
          newDigits[index - 1] = "";
          updateOtp(newDigits.join(""));
          e.preventDefault();
        } else if (digits[index]) {
          const newDigits = [...digits];
          newDigits[index] = "";
          updateOtp(newDigits.join(""));
          e.preventDefault();
        }
      } else if (e.key === "ArrowLeft" && index > 0) {
        inputRefs.current[index - 1]?.focus();
        e.preventDefault();
      } else if (e.key === "ArrowRight" && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
        e.preventDefault();
      }
    },
    [digits, disabled, otpLoading, length, updateOtp]
  );

  const handlePaste = useCallback(
    (e) => {
      e.preventDefault();
      if (disabled || otpLoading) return;

      const pastedData = e.clipboardData.getData("text/plain").trim();
      const numericData = pastedData.replace(/\D/g, "").slice(0, length);
      if (!numericData) return;

      const newDigits = Array.from({ length }, (_, i) => numericData[i] || "");
      const newOtp = newDigits.join("");

      updateOtp(newOtp);

      const nextIndex = Math.min(numericData.length, length - 1);
      inputRefs.current[nextIndex]?.focus();

      if (newOtp.length === length) {
        handleVerify(newOtp);
      }
    },
    [disabled, otpLoading, length, updateOtp, handleVerify]
  );

  const handleFocus = useCallback((e) => {
    e.target.select();
  }, []);

  /**
   * Resends OTP via backend API after CAPTCHA validation
   */
  const handleResendOtp = useCallback(
    async (captchaData = {}) => {
      if (!tempToken) return;

      setResendLoading(true);
      try {
        const res = await resendOtpApi({
          tempToken,
          captchaText: captchaData.captchaText,
          captchaId: captchaData.captchaId,
        });

        setResendCooldown(30);
        setOtpError("");
        if (showAlert) {
          showAlert(res.message || "A new verification code has been sent.", "success");
        }
        if (onResendSuccess) {
          onResendSuccess(res.data);
        }
      } catch (err) {
        const errMsg =
          err.response?.data?.message || err.message || "Failed to resend OTP.";
        if (showAlert) {
          showAlert(errMsg, "error");
        }
        throw err;
      } finally {
        setResendLoading(false);
      }
    },
    [tempToken, showAlert, onResendSuccess]
  );

  const captchaDialog = useCaptchaDialog({
    onSuccess: handleResendOtp,
  });

  const handleResendClick = useCallback(() => {
    if (resendCooldown > 0 || resendLoading || disabled) return;
    captchaDialog.handleOpen();
  }, [resendCooldown, resendLoading, disabled, captchaDialog]);

  return {
    otp: currentOtp,
    digits,
    inputRefs,
    setInputRef,
    otpError,
    setOtpError,
    otpLoading,
    resendCooldown,
    resendLoading,
    handleInputChange,
    handleKeyDown,
    handlePaste,
    handleFocus,
    handleVerify,
    captchaDialog,
    handleResendClick,
    setOtpDirectly: updateOtp,
  };
};
