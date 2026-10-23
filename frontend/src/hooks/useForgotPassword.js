import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUI } from "../context/UIContext";
import {
  forgotPasswordSendOtpApi,
  forgotPasswordVerifyOtpApi,
  forgotPasswordResendOtpApi,
  forgotPasswordResetApi,
} from "../services/auth.service";
import {
  forgotPasswordEmailZodSchema,
  forgotPasswordResetZodSchema,
} from "../validators/zodSchemas";

export const useForgotPassword = () => {
  const navigate = useNavigate();
  const { showAlert } = useUI();

  // Current step: "EMAIL" -> "OTP" -> "PASSWORD"
  const [step, setStep] = useState("EMAIL");

  // Step 1: Email & CAPTCHA
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaId, setCaptchaId] = useState("");

  // Step 2: OTP & Session
  const [resetToken, setResetToken] = useState("");
  const [otp, setOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRefs = useRef([]);

  // Step 3: Passwords
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Feedback
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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

  // Clear specific error field
  const clearError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  /**
   * STEP 1: Handle Send OTP to Email
   */
  const handleEmailSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrors({});

    const validation = forgotPasswordEmailZodSchema.safeParse({ email });
    if (!validation.success) {
      const errs = {};
      validation.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
      });
      if (!captcha || !captcha.trim()) {
        errs.captcha = "CAPTCHA verification is required.";
      }
      setErrors(errs);
      return;
    }

    if (!captcha || !captcha.trim()) {
      setErrors({ captcha: "CAPTCHA verification is required." });
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordSendOtpApi({
        email: email.trim().toLowerCase(),
        captcha: captcha.trim(),
        captchaId,
      });
      setResetToken(res.data?.resetToken || "");
      setStep("OTP");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtp("");
      setCaptcha("");
      setResendCooldown(30);
      showAlert(
        res.message || "A verification code has been sent to your email address.",
        "success"
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to send verification code.";
      setCaptcha("");
      if (errMsg.toLowerCase().includes("captcha")) {
        setErrors({ captcha: errMsg });
      } else {
        setErrors({ email: errMsg });
      }
      showAlert(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 2: Handle OTP input and verification
   */
  const handleOtpDigitChange = (index, value) => {
    const cleanDigit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = cleanDigit;
    setOtpDigits(newDigits);
    const combinedOtp = newDigits.join("");
    setOtp(combinedOtp);
    clearError("otp");

    // Auto-focus next cell
    if (cleanDigit && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (combinedOtp.length === 6 && !combinedOtp.includes(" ")) {
      handleVerifyOtp(combinedOtp);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        setOtp(newDigits.join(""));
        e.preventDefault();
      } else if (otpDigits[index]) {
        const newDigits = [...otpDigits];
        newDigits[index] = "";
        setOtpDigits(newDigits);
        setOtp(newDigits.join(""));
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text/plain").trim();
    const numeric = pasted.replace(/\D/g, "").slice(0, 6);
    if (!numeric) return;

    const newDigits = Array.from({ length: 6 }, (_, i) => numeric[i] || "");
    setOtpDigits(newDigits);
    const combined = newDigits.join("");
    setOtp(combined);
    clearError("otp");

    const nextIndex = Math.min(numeric.length, 5);
    otpInputRefs.current[nextIndex]?.focus();

    if (combined.length === 6) {
      handleVerifyOtp(combined);
    }
  };

  const handleVerifyOtp = async (otpToVerify = otp) => {
    const trimmed = (otpToVerify || "").trim();
    if (trimmed.length !== 6) {
      setErrors({ otp: "Please enter the complete 6-digit verification code." });
      return;
    }

    setLoading(true);
    setErrors({});
    try {
      const res = await forgotPasswordVerifyOtpApi({
        resetToken,
        otp: trimmed,
      });
      if (res.data?.resetToken) {
        setResetToken(res.data.resetToken);
      }
      setStep("PASSWORD");
      showAlert(
        res.message || "OTP verified successfully. You may now create a new password.",
        "success"
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Invalid verification code.";
      setErrors({ otp: errMsg });
      showAlert(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    try {
      const res = await forgotPasswordResendOtpApi({ resetToken });
      setResendCooldown(30);
      setOtpDigits(["", "", "", "", "", ""]);
      setOtp("");
      setErrors({});
      showAlert(
        res.message || "A new verification code has been sent to your email address.",
        "success"
      );
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to resend verification code.";
      showAlert(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  /**
   * STEP 3: Handle Password Reset
   */
  const handleResetPassword = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrors({});

    const validation = forgotPasswordResetZodSchema.safeParse({
      password: newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const errs = {};
      validation.error.errors.forEach((err) => {
        errs[err.path[0]] = err.message;
      });
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await forgotPasswordResetApi({
        resetToken,
        password: newPassword,
        confirmPassword,
      });

      showAlert(
        res.message || "Password reset successful! Please login with your new password.",
        "success"
      );
      navigate("/login");
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to reset password.";
      showAlert(errMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep("EMAIL");
    setOtp("");
    setOtpDigits(["", "", "", "", "", ""]);
    setErrors({});
  };

  return {
    step,
    email,
    setEmail,
    captcha,
    setCaptcha,
    captchaId,
    setCaptchaId,
    otp,
    otpDigits,
    otpInputRefs,
    resendCooldown,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showNewPassword,
    setShowNewPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    loading,
    errors,
    clearError,
    handleEmailSubmit,
    handleOtpDigitChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleVerifyOtp,
    handleResendOtp,
    handleResetPassword,
    handleBackToEmail,
    navigate,
  };
};
