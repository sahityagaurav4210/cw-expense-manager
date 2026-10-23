import React, { useState } from "react";
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
  useTheme,
  Stack,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useLogin } from "../../hooks/useLogin";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import OTPWrapper from "../../components/core/OTPWrapper";
import { Link as RouterLink } from "react-router-dom";
import NavbarLogo from "../../components/core/NavbarLogo";
import { Email, Key, LoginOutlined } from "@mui/icons-material";
import useAppCss from "../../hooks/useAppCss";
import Notes from "../../components/core/Notes";

const Login = () => {
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const { RequiredFieldCss } = useAppCss();

  const {
    step,
    formData,
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
  } = useLogin();

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
          {step === "CREDENTIALS" ? (
            /* STEP 1: CREDENTIALS & CAPTCHA */
            <>
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                mb={3}
              >
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
                  Expense Tracker Login
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  Please sign in to continue
                </Typography>
              </Box>

              <Box component="form" onSubmit={handleSubmit} noValidate>
                <Grid container spacing={2}>
                  {/* Email */}
                  <Grid item xs={12}>
                    <TextField
                      label="Email Address"
                      type="email"
                      fullWidth
                      required
                      value={formData.email}
                      onChange={handleChange("email")}
                      error={Boolean(errors.email)}
                      helperText={errors.email}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={RequiredFieldCss}
                      autoFocus
                    />
                  </Grid>

                  {/* Password with Visibility Toggle */}
                  <Grid item xs={12}>
                    <TextField
                      label="Password"
                      type={showPassword ? "text" : "password"}
                      fullWidth
                      required
                      value={formData.password}
                      onChange={handleChange("password")}
                      error={Boolean(errors.password)}
                      helperText={errors.password}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={() => setShowPassword(!showPassword)}
                              onMouseDown={(e) => e.preventDefault()}
                              edge="end"
                              size="small"
                            >
                              {showPassword ? (
                                <VisibilityOff fontSize="small" />
                              ) : (
                                <Visibility fontSize="small" />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                        startAdornment: (
                          <InputAdornment position="start">
                            <Key fontSize="small" />
                          </InputAdornment>
                        ),
                      }}
                      sx={RequiredFieldCss}
                    />
                  </Grid>

                  {/* CAPTCHA */}
                  <Grid item xs={12}>
                    <CaptchaComponent
                      value={formData.captcha}
                      onChange={handleChange("captcha")}
                      onCaptchaIdChange={setCaptchaId}
                      error={Boolean(errors.captcha)}
                      helperText={errors.captcha}
                    />
                  </Grid>

                  {/* Forgot Password Link */}
                  <Grid item xs={12}>
                    <Stack direction="column" sx={{ alignItems: "flex-end" }}>
                      <Link
                        component={RouterLink}
                        to="/forgot-password"
                        underline="hover"
                        sx={{
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          color: "primary.main",
                          transition: "color 0.15s ease-in-out",
                          "&:hover": {
                            color: "primary.dark",
                          },
                          mb: 0.5,
                        }}
                      >
                        Forgot Password?
                      </Link>

                      <Link
                        component={RouterLink}
                        to="/register"
                        underline="hover"
                        sx={{
                          fontSize: "0.775rem",
                          fontWeight: 600,
                          color: "primary.main",
                          transition: "color 0.15s ease-in-out",
                          "&:hover": {
                            color: "primary.dark",
                          },
                        }}
                      >
                        Don't have an account? Register Here
                      </Link>
                    </Stack>
                  </Grid>

                  {/* Submit */}
                  <Grid item xs={12} mt={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                      startIcon={
                        loading ? (
                          <CircularProgress size={18} color="inherit" />
                        ) : (
                          <LoginOutlined />
                        )
                      }
                    >
                      {loading ? "Signing in..." : "Login"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Notes
                note="All fields marked with asterisk (*) are mandatory to fill."
                noteColor={theme.palette.secondary.main}
              />
            </>
          ) : (
            /* STEP 2: TWO-FACTOR AUTHENTICATION VIA OTPWRAPPER */
            <OTPWrapper
              email={otpEmail}
              tempToken={tempToken}
              defaultOtp={defaultOtp}
              twoFactorMethod={twoFactorMethod}
              onSwitchMethod={handleSwitch2faMethod}
              onChangeAccount={handleBackToLogin}
              onVerified={handleVerifiedSuccess}
            />
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default React.memo(Login);
