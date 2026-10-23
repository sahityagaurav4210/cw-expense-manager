import { useState, useEffect } from "react";
import {
  loginUserApi,
  verifyOtpApi,
  resendOtpApi,
  switchLogin2faMethodApi,
} from "../services/auth.service";
import { loginZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const { showAlert } = useUI();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Step state: "CREDENTIALS" or "OTP"
  const [step, setStep] = useState("CREDENTIALS");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    captcha: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // OTP-specific states
  const [twoFactorMethod, setTwoFactorMethod] = useState("EMAIL");
  const [tempToken, setTempToken] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [defaultOtp, setDefaultOtp] = useState(undefined);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrors({});

    const result = loginZodSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors = {};
      result.error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      showAlert("Please enter all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUserApi({ ...formData, captchaId });

      if (res.data?.requiresOtp) {
        setTwoFactorMethod(res.data.twoFactorMethod || "EMAIL");
        setTempToken(res.data.tempToken);
        setOtpEmail(res.data.email || formData.email);
        setDefaultOtp(res.data.defaultOtp);
        setStep("OTP");
        setResendCooldown(30);
        showAlert(
          res.message || "Please complete two-factor authentication to continue.",
          "info"
        );
      } else {
        // Fallback direct login if OTP not required
        dispatch(
          setAuth({
            user: res.data.user,
            accessToken: res.data.accessToken,
          })
        );
        showAlert("Login successful! Welcome back.", "success");
        navigate("/dashboard");
      }
    } catch (err) {
      setFormData((prev) => ({ ...prev, captcha: "" }));
      showAlert(err.response?.data?.message || err.message || "Login failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (newOtp) => {
    setOtp(newOtp);
    if (otpError) setOtpError("");
  };

  const handleVerifyOtp = async (otpToVerify = otp) => {
    const trimmedOtp = (otpToVerify || "").trim();
    if (trimmedOtp.length !== 6) {
      setOtpError("Please enter the complete 6-digit verification code.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");
    try {
      const res = await verifyOtpApi({ tempToken, otp: trimmedOtp });
      dispatch(
        setAuth({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );
      showAlert("Login successful! Welcome back.", "success");
      navigate("/dashboard");
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || "Invalid OTP code.";
      setOtpError(errMsg);
      showAlert(errMsg, "error");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async (captchaData = {}) => {
    if (resendCooldown > 0 || otpLoading) return;

    setOtpLoading(true);
    try {
      const res = await resendOtpApi({
        tempToken,
        captchaText: captchaData.captchaText,
        captchaId: captchaData.captchaId,
      });
      if (res.data?.defaultOtp) {
        setDefaultOtp(res.data.defaultOtp);
      }
      setResendCooldown(30);
      showAlert(res.message || "A new verification code has been sent.", "success");
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || "Failed to resend OTP.", "error");
      throw err;
    } finally {
      setOtpLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setStep("CREDENTIALS");
    setOtp("");
    setOtpError("");
    setFormData((prev) => ({ ...prev, captcha: "" }));
  };

  const handleUseDefaultOtp = () => {
    if (defaultOtp) {
      setOtp(defaultOtp);
      handleVerifyOtp(defaultOtp);
    }
  };

  const handleVerifiedSuccess = (data) => {
    dispatch(
      setAuth({
        user: data.user,
        accessToken: data.accessToken,
      })
    );
    showAlert("Login successful! Welcome back.", "success");
    navigate("/dashboard");
  };

  const handleSwitch2faMethod = async () => {
    if (!tempToken || loading) return;
    setLoading(true);
    try {
      const res = await switchLogin2faMethodApi({ tempToken });
      setTwoFactorMethod(res.data.twoFactorMethod);
      setDefaultOtp(res.data.defaultOtp);
      setOtp("");
      setOtpError("");
      showAlert(res.message, "info");
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || "Failed to switch 2FA method.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    formData,
    captchaId,
    setCaptchaId,
    errors,
    loading,
    handleChange,
    handleSubmit,

    // OTP
    twoFactorMethod,
    tempToken,
    otpEmail,
    defaultOtp,
    handleVerifiedSuccess,
    handleBackToLogin,
    handleSwitch2faMethod,
    otp,
    otpError,
    otpLoading,
    resendCooldown,
    handleOtpChange,
    handleVerifyOtp,
    handleResendOtp,
    handleUseDefaultOtp,
  };
};
