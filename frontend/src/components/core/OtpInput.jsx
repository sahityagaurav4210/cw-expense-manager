import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Button, Link, CircularProgress } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useOtpInput } from "../../hooks/core/useOtpInput";
import CaptchaDialog from "../dialog/CaptchaDialog";

/**
 * Plug-and-play OtpInput component.
 * Primary Responsibility:
 * 1. Takes 6-digit OTP input from the user (fully responsive cells).
 * 2. Verifies the OTP using the backend verification API.
 * 3. Handles Resend OTP via CaptchaDialog and the backend resend-otp API.
 */
const OtpInput = ({
  length = 6,
  value,
  onChange,
  tempToken,
  onVerified,
  onResendSuccess,
  disabled = false,
  autoFocus = true,
  submitBtnText = "Verify & Login",
  hideResend = false,
}) => {
  const {
    otp,
    digits,
    setInputRef,
    otpError,
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
  } = useOtpInput({
    length,
    value,
    onChange,
    tempToken,
    onVerified,
    onResendSuccess,
    disabled,
    autoFocus,
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      sx={{ width: "100%", maxWidth: "100%", boxSizing: "border-box" }}
    >
      {/* Digit Input Cells - Fully responsive on all mobile viewports */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={{ xs: 0.5, sm: 1.25 }}
        onPaste={handlePaste}
        sx={{
          width: "100%",
          maxWidth: { xs: 340, sm: 380 },
          my: { xs: 1, sm: 1.5 },
          px: { xs: 0.25, sm: 0 },
        }}
      >
        {digits.map((digit, index) => (
          <Box
            key={index}
            component="input"
            ref={setInputRef(index)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled || otpLoading}
            value={digit}
            onChange={(e) => handleInputChange(index, e)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onFocus={handleFocus}
            sx={{
              flex: "1 1 0",
              minWidth: 0,
              maxWidth: { xs: 42, sm: 50 },
              height: { xs: 44, sm: 52 },
              fontSize: { xs: "1.15rem", sm: "1.45rem" },
              fontWeight: 700,
              textAlign: "center",
              borderRadius: 2,
              p: 0,
              boxSizing: "border-box",
              border: (theme) =>
                `2px solid ${
                  otpError
                    ? theme.palette.error.main
                    : digit
                      ? theme.palette.primary.main
                      : theme.palette.mode === "dark"
                        ? "#475569"
                        : "#cbd5e1"
                }`,
              backgroundColor: (theme) =>
                disabled || otpLoading
                  ? theme.palette.action.disabledBackground
                  : theme.palette.mode === "dark"
                    ? "#1e293b"
                    : "#ffffff",
              color: (theme) =>
                otpError ? theme.palette.error.main : theme.palette.text.primary,
              outline: "none",
              transition: "all 0.2s ease-in-out",
              boxShadow: (theme) =>
                otpError
                  ? `0 0 0 2px ${theme.palette.error.light}40`
                  : digit
                    ? `0 0 0 2px ${theme.palette.primary.light}40`
                    : "none",
              "&:focus": {
                borderColor: (theme) =>
                  otpError ? theme.palette.error.main : theme.palette.primary.main,
                boxShadow: (theme) =>
                  otpError
                    ? `0 0 0 3px ${theme.palette.error.light}60`
                    : `0 0 0 3px ${theme.palette.primary.light}60`,
              },
            }}
          />
        ))}
      </Box>

      {/* Error Feedback */}
      {otpError && (
        <Typography
          variant="caption"
          color="error"
          sx={{
            mt: 0.5,
            mb: 0.5,
            textAlign: "center",
            fontWeight: 600,
            fontSize: { xs: "0.75rem", sm: "0.8125rem" },
            px: 1,
          }}
        >
          {otpError}
        </Typography>
      )}

      {/* Verify & Login Button */}
      <Button
        variant="contained"
        color="primary"
        fullWidth
        size="large"
        disabled={otp.length !== length || otpLoading || disabled}
        onClick={() => handleVerify(otp)}
        startIcon={
          otpLoading ? <CircularProgress size={18} color="inherit" /> : null
        }
        sx={{
          mt: { xs: 1.5, sm: 2 },
          py: { xs: 1, sm: 1.2 },
          fontWeight: 700,
          fontSize: { xs: "0.9rem", sm: "1rem" },
          textTransform: "none",
          borderRadius: 2,
        }}
      >
        {otpLoading ? "Verifying..." : submitBtnText}
      </Button>

      {/* Resend OTP Link - Only displayed when hideResend is false (e.g. Email OTP mode) */}
      {!hideResend && (
        <>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            gap={0.75}
            mt={2}
            flexWrap="wrap"
            sx={{ textAlign: "center" }}
          >
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
            >
              Didn't receive the OTP?
            </Typography>

            {resendCooldown > 0 ? (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 600, fontSize: { xs: "0.8125rem", sm: "0.875rem" } }}
              >
                Resend in {resendCooldown}s
              </Typography>
            ) : (
              <Link
                component="button"
                type="button"
                onClick={handleResendClick}
                disabled={disabled || resendLoading || otpLoading}
                sx={{
                  cursor: "pointer",
                  fontWeight: 600,
                  fontSize: { xs: "0.8125rem", sm: "0.875rem" },
                  color: "primary.main",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.5,
                  background: "none",
                  border: "none",
                  p: 0,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    color: "primary.dark",
                    textDecoration: "underline",
                  },
                  "&:disabled": {
                    cursor: "not-allowed",
                    color: "text.disabled",
                    textDecoration: "none",
                  },
                }}
              >
                <RefreshIcon sx={{ fontSize: "1rem" }} />
                {resendLoading ? "Resending..." : "Resend OTP"}
              </Link>
            )}
          </Box>

          {/* Plug-and-play CaptchaDialog for verifying before calling resend-otp */}
          <CaptchaDialog
            {...captchaDialog}
            title="Verify to Resend OTP"
            subtitle="Please enter the CAPTCHA code below to verify your request and receive a new OTP."
            submitBtnText="Verify & Resend OTP"
          />
        </>
      )}
    </Box>
  );
};

OtpInput.propTypes = {
  length: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func,
  tempToken: PropTypes.string,
  onVerified: PropTypes.func,
  onResendSuccess: PropTypes.func,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
  submitBtnText: PropTypes.string,
};

export default React.memo(OtpInput);
