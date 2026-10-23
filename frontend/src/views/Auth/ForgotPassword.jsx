import React from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  CircularProgress,
  Link,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import KeyIcon from "@mui/icons-material/Key";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import NavbarLogo from "../../components/core/NavbarLogo";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import { useForgotPassword } from "../../hooks/useForgotPassword";

const ForgotPassword = () => {
  const {
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
  } = useForgotPassword();

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 3, sm: 6 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="xs" sx={{ p: "0 !important" }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2.5, sm: 4 },
            borderRadius: 3,
            width: "100%",
            transition: "all 0.3s ease",
          }}
        >
          {/* Header & Logo */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Divider sx={{ width: "100%" }}>
              <NavbarLogo
                alt="Expense Manager"
                src="/logo.png"
                height={96}
                hidePadding
                hideTooltip
              />
            </Divider>

            <Typography variant="h5" fontWeight={700} color="primary.main">
              {step === "EMAIL" && "Forgot Password"}
              {step === "OTP" && "Verify Email"}
              {step === "PASSWORD" && "Reset Password"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              align="center"
              sx={{ mt: 0.5, px: 1 }}
            >
              {step === "EMAIL" &&
                "Enter your registered email to receive an OTP verification code"}
              {step === "OTP" &&
                "Enter the 6-digit verification code sent to your email"}
              {step === "PASSWORD" &&
                "Create a strong new password for your account"}
            </Typography>
          </Box>

          {/* STEP 1: ENTER EMAIL */}
          {step === "EMAIL" && (
            <Box component="form" onSubmit={handleEmailSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    label="Email Address"
                    type="email"
                    fullWidth
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError("email");
                    }}
                    error={Boolean(errors.email)}
                    helperText={errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* CAPTCHA */}
                <Grid item xs={12}>
                  <CaptchaComponent
                    value={captcha}
                    onChange={(e) => {
                      setCaptcha(e.target.value);
                      clearError("captcha");
                    }}
                    onCaptchaIdChange={setCaptchaId}
                    error={Boolean(errors.captcha)}
                    helperText={errors.captcha}
                  />
                </Grid>

                <Grid item xs={12} mt={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading || !email.trim()}
                    startIcon={
                      loading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : null
                    }
                    sx={{
                      py: 1.1,
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.95rem",
                    }}
                  >
                    {loading ? "Sending OTP..." : "Send Verification Code"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* STEP 2: VERIFY OTP */}
          {step === "OTP" && (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              width="100%"
            >
              {/* Email Chip & Change Link */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={1}
                mb={2}
                flexWrap="wrap"
              >
                <Chip
                  label={email}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={<MarkEmailReadOutlinedIcon fontSize="small" />}
                  sx={{
                    fontWeight: 600,
                    maxWidth: 240,
                    "& .MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    },
                  }}
                />
                <Link
                  component="button"
                  type="button"
                  onClick={handleBackToEmail}
                  sx={{
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                    color: "primary.main",
                    textDecoration: "underline",
                    textUnderlineOffset: "3px",
                  }}
                >
                  Change Email
                </Link>
              </Box>

              {/* 6 Digit Cells */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={{ xs: 0.5, sm: 1 }}
                onPaste={handleOtpPaste}
                sx={{
                  width: "100%",
                  maxWidth: { xs: 320, sm: 360 },
                  my: 1,
                }}
              >
                {otpDigits.map((digit, index) => (
                  <Box
                    key={index}
                    component="input"
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={1}
                    disabled={loading}
                    value={digit}
                    onChange={(e) =>
                      handleOtpDigitChange(index, e.target.value)
                    }
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    sx={{
                      flex: "1 1 0",
                      minWidth: 0,
                      maxWidth: { xs: 44, sm: 50 },
                      height: { xs: 46, sm: 52 },
                      fontSize: { xs: "1.2rem", sm: "1.4rem" },
                      fontWeight: 700,
                      textAlign: "center",
                      borderRadius: 2,
                      p: 0,
                      boxSizing: "border-box",
                      border: (theme) =>
                        `2px solid ${
                          errors.otp
                            ? theme.palette.error.main
                            : digit
                              ? theme.palette.primary.main
                              : theme.palette.mode === "dark"
                                ? "#475569"
                                : "#cbd5e1"
                        }`,
                      backgroundColor: (theme) =>
                        loading
                          ? theme.palette.action.disabledBackground
                          : theme.palette.mode === "dark"
                            ? "#1e293b"
                            : "#ffffff",
                      color: (theme) =>
                        errors.otp
                          ? theme.palette.error.main
                          : theme.palette.text.primary,
                      outline: "none",
                      transition: "all 0.2s ease-in-out",
                      boxShadow: (theme) =>
                        errors.otp
                          ? `0 0 0 2px ${theme.palette.error.light}40`
                          : digit
                            ? `0 0 0 2px ${theme.palette.primary.light}40`
                            : "none",
                      "&:focus": {
                        borderColor: (theme) =>
                          errors.otp
                            ? theme.palette.error.main
                            : theme.palette.primary.main,
                        boxShadow: (theme) =>
                          errors.otp
                            ? `0 0 0 3px ${theme.palette.error.light}60`
                            : `0 0 0 3px ${theme.palette.primary.light}60`,
                      },
                    }}
                  />
                ))}
              </Box>

              {/* OTP Error Feedback */}
              {errors.otp && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    mt: 0.5,
                    mb: 0.5,
                    textAlign: "center",
                    fontWeight: 600,
                    fontSize: "0.8125rem",
                  }}
                >
                  {errors.otp}
                </Typography>
              )}

              {/* Verify OTP Button */}
              <Button
                variant="contained"
                color="primary"
                fullWidth
                size="large"
                disabled={otp.length !== 6 || loading}
                onClick={() => handleVerifyOtp(otp)}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
                sx={{
                  mt: 2,
                  py: 1.1,
                  fontWeight: 700,
                  fontSize: "0.95rem",
                  textTransform: "none",
                  borderRadius: 2,
                }}
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>

              {/* Resend OTP */}
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={0.75}
                mt={2}
                flexWrap="wrap"
              >
                <Typography variant="body2" color="text.secondary">
                  Didn't receive the OTP?
                </Typography>
                {resendCooldown > 0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontWeight: 600 }}
                  >
                    Resend in {resendCooldown}s
                  </Typography>
                ) : (
                  <Link
                    component="button"
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    sx={{
                      cursor: "pointer",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      color: "primary.main",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.5,
                    }}
                  >
                    <RefreshIcon sx={{ fontSize: "1rem" }} />
                    Resend OTP
                  </Link>
                )}
              </Box>
            </Box>
          )}

          {/* STEP 3: RESET PASSWORD */}
          {step === "PASSWORD" && (
            <Box component="form" onSubmit={handleResetPassword} noValidate>
              <Grid container spacing={2}>
                {/* New Password with Visibility Toggle & Lock Icon */}
                <Grid item xs={12}>
                  <TextField
                    label="New Password"
                    type={showNewPassword ? "text" : "password"}
                    fullWidth
                    required
                    autoFocus
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      clearError("password");
                    }}
                    error={Boolean(errors.password)}
                    helperText={
                      errors.password ||
                      "8-25 chars, uppercase, lowercase & special character"
                    }
                    inputProps={{ maxLength: 25 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlinedIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle new password visibility"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Confirm Password with Visibility Toggle & Key Icon */}
                <Grid item xs={12}>
                  <TextField
                    label="Confirm New Password"
                    type={showConfirmPassword ? "text" : "password"}
                    fullWidth
                    required
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      clearError("confirmPassword");
                    }}
                    error={Boolean(errors.confirmPassword)}
                    helperText={errors.confirmPassword}
                    inputProps={{ maxLength: 25 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <KeyIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle confirm password visibility"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            onMouseDown={(e) => e.preventDefault()}
                            edge="end"
                            size="small"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOff fontSize="small" />
                            ) : (
                              <Visibility fontSize="small" />
                            )}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Submit Reset Password */}
                <Grid item xs={12} mt={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    fullWidth
                    disabled={loading || !newPassword || !confirmPassword}
                    startIcon={
                      loading ? (
                        <CircularProgress size={18} color="inherit" />
                      ) : null
                    }
                    sx={{
                      py: 1.1,
                      fontWeight: 700,
                      borderRadius: 2,
                      textTransform: "none",
                      fontSize: "0.95rem",
                    }}
                  >
                    {loading ? "Resetting Password..." : "Reset Password"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Bottom Back to Login Link */}
          <Box display="flex" justifyContent="center" mt={3}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate("/login")}
              sx={{
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                color: "primary.main",
                fontSize: "0.875rem",
                textDecoration: "none",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              <ArrowBackIcon fontSize="small" />
              Back to Login
            </Link>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default React.memo(ForgotPassword);
