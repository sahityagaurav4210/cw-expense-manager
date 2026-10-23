import { useState, useEffect, useCallback } from "react";
import {
  get2FaSettingsApi,
  setupAuthenticatorApi,
  verifyAuthenticatorSetupApi,
  update2FaMethodApi,
  disableAuthenticatorApi,
} from "../services/user.service";
import { useUI } from "../context/UIContext";

/**
 * Custom hook containing all state, API interactions, and business logic
 * for the Two-Factor Authentication (2FA) settings screen.
 */
export const useTwoFactorSettings = () => {
  const { showAlert } = useUI();

  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    twoFactorMethod: "EMAIL",
    isAuthenticatorEnabled: false,
    email: "",
  });

  // Setup modal states
  const [setupModalOpen, setSetupModalOpen] = useState(false);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupData, setSetupData] = useState(null); // { secret, otpAuthUrl, qrCodeUrl }
  const [verifyCode, setVerifyCode] = useState("");
  const [setAsDefault, setSetAsDefault] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [copied, setCopied] = useState(false);

  // Disable confirmation dialog
  const [disableDialogOpen, setDisableDialogOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);

  // Action loading states
  const [updatingMethod, setUpdatingMethod] = useState(null);

  // Fetch 2FA settings from server
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await get2FaSettingsApi();
      if (res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || "Failed to load 2FA settings.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Initiate Authenticator App Setup
  const handleOpenSetup = async () => {
    setSetupLoading(true);
    setSetupError("");
    setVerifyCode("");
    setSetAsDefault(true);
    setSetupModalOpen(true);
    try {
      const res = await setupAuthenticatorApi();
      setSetupData(res.data);
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Failed to generate authenticator secret.";
      setSetupError(errMsg);
      showAlert(errMsg, "error");
    } finally {
      setSetupLoading(false);
    }
  };

  const handleCloseSetup = () => {
    if (!verifying) {
      setSetupModalOpen(false);
      setSetupError("");
      setVerifyCode("");
    }
  };

  // Copy secret key to clipboard
  const handleCopySecret = () => {
    if (setupData?.secret) {
      navigator.clipboard.writeText(setupData.secret);
      setCopied(true);
      showAlert("Secret key copied to clipboard.", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle verify code input change
  const handleVerifyCodeChange = (e) => {
    const clean = e.target.value.replace(/\D/g, "").slice(0, 6);
    setVerifyCode(clean);
    if (setupError) setSetupError("");
  };

  // Verify and activate Authenticator
  const handleVerifySetup = async () => {
    const trimmed = verifyCode.trim();
    if (trimmed.length !== 6) {
      setSetupError("Please enter the complete 6-digit code from your app.");
      return;
    }

    setVerifying(true);
    setSetupError("");
    try {
      const res = await verifyAuthenticatorSetupApi({
        code: trimmed,
        setAsDefault,
      });
      showAlert(res.message || "Authenticator App activated successfully!", "success");
      setSetupModalOpen(false);
      setSettings((prev) => ({
        ...prev,
        isAuthenticatorEnabled: true,
        twoFactorMethod: "AUTHENTICATOR",
      }));
    } catch (err) {
      const errMsg =
        err.response?.data?.message || err.message || "Invalid verification code.";
      setSetupError(errMsg);
    } finally {
      setVerifying(false);
    }
  };

  // Change default 2FA method
  const handleSetDefaultMethod = async (method) => {
    if (settings.twoFactorMethod === method) return;
    setUpdatingMethod(method);
    try {
      const res = await update2FaMethodApi({ method });
      setSettings((prev) => ({ ...prev, twoFactorMethod: method }));
      showAlert(res.message || `Default 2FA method updated to ${method}.`, "success");
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || "Failed to update default 2FA method.",
        "error"
      );
    } finally {
      setUpdatingMethod(null);
    }
  };

  // Disable Authenticator App dialog controls
  const handleOpenDisableDialog = () => {
    setDisableDialogOpen(true);
  };

  const handleCloseDisableDialog = () => {
    if (!disabling) {
      setDisableDialogOpen(false);
    }
  };

  const handleConfirmDisable = async () => {
    setDisabling(true);
    try {
      const res = await disableAuthenticatorApi();
      setSettings((prev) => ({
        ...prev,
        isAuthenticatorEnabled: false,
        twoFactorMethod: "EMAIL",
      }));
      setDisableDialogOpen(false);
      showAlert(res.message || "Authenticator App disabled.", "success");
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || "Failed to disable Authenticator App.",
        "error"
      );
    } finally {
      setDisabling(false);
    }
  };

  return {
    loading,
    settings,
    setupModalOpen,
    setupLoading,
    setupData,
    verifyCode,
    setAsDefault,
    setSetAsDefault,
    verifying,
    setupError,
    copied,
    disableDialogOpen,
    disabling,
    updatingMethod,
    fetchSettings,
    handleOpenSetup,
    handleCloseSetup,
    handleCopySecret,
    handleVerifyCodeChange,
    handleVerifySetup,
    handleSetDefaultMethod,
    handleOpenDisableDialog,
    handleCloseDisableDialog,
    handleConfirmDisable,
  };
};
