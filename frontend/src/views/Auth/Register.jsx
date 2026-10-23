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
  Stack,
  FormControl,
  FormLabel,
  InputAdornment,
  IconButton,
  Divider,
  useTheme,
} from "@mui/material";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Person,
  Email,
  Phone,
  Key,
  CurrencyRupee,
  PersonAdd,
} from "@mui/icons-material";
import { useRegister } from "../../hooks/useRegister";
import FileUploader from "../../components/core/FileUploader";
import OptionCard from "../../components/core/OptionCard";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import { useNavigate } from "react-router-dom";
import NavbarLogo from "../../components/core/NavbarLogo";
import useAppCss from "../../hooks/useAppCss";
import Notes from "../../components/core/Notes";

const Register = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { RequiredFieldCss } = useAppCss();
  const {
    formData,
    setCaptchaId,
    errors,
    loading,
    handleChange,
    handleSelectEmployment,
    handleToggleTerms,
    handleFileSelect,
    handleFileClear,
    handleSubmit,
  } = useRegister();

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        py: { xs: 3, sm: 5 },
        px: { xs: 2, sm: 3 },
      }}
    >
      <Container maxWidth="md" sx={{ p: "0 !important" }}>
        <Paper elevation={4} sx={{ p: 2, borderRadius: 3, width: "100%" }}>
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
              User Registration
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Create your account to start tracking expenses
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              {/* Profile Photo Upload */}
              <Grid item xs={12}>
                <FileUploader
                  onFileSelect={handleFileSelect}
                  onClear={handleFileClear}
                  maxSizeMB={1}
                />
              </Grid>

              {/* Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Full Name"
                  type="text"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleChange("name")}
                  error={Boolean(errors.name)}
                  helperText={
                    errors.name || "Max 32 chars (letters & space only)"
                  }
                  inputProps={{ maxLength: 32 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Person fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={RequiredFieldCss}
                  autoFocus
                />
              </Grid>

              {/* Email */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={formData.email}
                  onChange={handleChange("email")}
                  error={Boolean(errors.email)}
                  helperText={errors.email || "Max 32 chars (valid RFC email)"}
                  inputProps={{ maxLength: 32 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                  sx={RequiredFieldCss}
                />
              </Grid>

              {/* Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number"
                  type="tel"
                  fullWidth
                  value={formData.phone_no}
                  onChange={handleChange("phone_no")}
                  error={Boolean(errors.phone_no)}
                  helperText={
                    errors.phone_no || "Optional (10-digit Indian number)"
                  }
                  inputProps={{ maxLength: 10 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Phone fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Annual Income (INR) */}
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Annual Income (INR)"
                  type="number"
                  fullWidth
                  value={formData.annual_income}
                  onChange={handleChange("annual_income")}
                  error={Boolean(errors.annual_income)}
                  helperText={
                    errors.annual_income || "Optional (in Indian Rupees ₹)"
                  }
                  inputProps={{ min: 0, step: "any" }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupee fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
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
                  helperText={
                    errors.password ||
                    "8-25 chars, uppercase, lowercase & symbol"
                  }
                  inputProps={{ maxLength: 25 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Key fontSize="small" />
                      </InputAdornment>
                    ),
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
                  }}
                  sx={RequiredFieldCss}
                />
              </Grid>

              {/* Employment Type */}
              <Grid item xs={12}>
                <FormControl
                  component="fieldset"
                  fullWidth
                  error={Boolean(errors.employment_type)}
                >
                  <FormLabel
                    component="legend"
                    sx={{ fontSize: "13px", fontWeight: 600, mb: 1 }}
                  >
                    Employment Type <span style={{ color: "red" }}>*</span>
                  </FormLabel>
                  <Stack direction="row" spacing={2}>
                    <OptionCard
                      checked={formData.employment_type === "Salaried"}
                      label="Salaried"
                      onClick={handleSelectEmployment("Salaried")}
                    />
                    <OptionCard
                      checked={formData.employment_type === "Self-Employed"}
                      label="Self-Employed"
                      onClick={handleSelectEmployment("Self-Employed")}
                    />
                  </Stack>
                  {errors.employment_type && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5 }}
                    >
                      {errors.employment_type}
                    </Typography>
                  )}
                </FormControl>
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

              {/* Terms & Conditions Acceptance */}
              <Grid item xs={12}>
                <OptionCard
                  checked={formData.isTermsAccepted}
                  onClick={handleToggleTerms}
                  sx={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    py: 1,
                    px: 1.5,
                  }}
                  label="By clicking on create account below, I agree to website's Terms & Conditions and its Privacy Policy."
                />
                {errors.isTermsAccepted && (
                  <Typography
                    variant="caption"
                    color="error"
                    sx={{ mt: 0.5, display: "block" }}
                  >
                    {errors.isTermsAccepted}
                  </Typography>
                )}
              </Grid>

              {/* Submit Button */}
              <Grid item xs={12} mt={1}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || !formData.isTermsAccepted}
                  startIcon={
                    loading ? (
                      <CircularProgress size={18} color="inherit" />
                    ) : (
                      <PersonAdd />
                    )
                  }
                >
                  {loading ? "Registering..." : "Create Account"}
                </Button>
              </Grid>
            </Grid>
          </Box>

          <Divider sx={{ width: "100%" }}>
            <Typography
              variant="body1"
              sx={{ fontWeight: 700 }}
              color="secondary"
            >
              OR
            </Typography>
          </Divider>

          <Box display="flex" justifyContent="center" mt={3}>
            <Typography variant="body2" color="text.secondary">
              Already have an account?{" "}
              <Link
                component="button"
                type="button"
                onClick={() => navigate("/login")}
                sx={{ fontWeight: 700 }}
              >
                Login Here
              </Link>
            </Typography>
          </Box>

          <Notes
            note="All fields marked with asterisk (*) are mandatory to fill."
            noteColor={theme.palette.secondary.main}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
