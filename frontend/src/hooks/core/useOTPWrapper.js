import { useState, useCallback } from "react";

/**
 * Custom hook for OTPWrapper component.
 * Manages two-factor authentication presentation concerns:
 * - Email display & formatting
 * - Account change triggers
 * - Default OTP handling for local development environment
 */
export const useOTPWrapper = ({
  email,
  defaultOtp,
  onChangeAccount,
  onVerified,
} = {}) => {
  const [copied, setCopied] = useState(false);

  // Formats or truncates long emails for clean mobile display if needed
  const displayEmail = email || "";

  const handleChangeAccountClick = useCallback(
    (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (onChangeAccount) {
        onChangeAccount();
      }
    },
    [onChangeAccount]
  );

  const handleCopyDefaultOtp = useCallback(() => {
    if (defaultOtp && navigator.clipboard) {
      navigator.clipboard.writeText(defaultOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [defaultOtp]);

  return {
    displayEmail,
    defaultOtp,
    copied,
    handleChangeAccountClick,
    handleCopyDefaultOtp,
    onVerified,
  };
};

export default useOTPWrapper;
