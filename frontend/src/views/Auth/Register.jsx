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
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useRegister } from "../../hooks/useRegister";
import FileUploader from "../../components/core/FileUploader";
import OptionCard from "../../components/core/OptionCard";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const {
    formData,
    setCaptchaId,
    errors,
    loading,
    handleChange,
    handleSelectEmployment,
    handleFileSelect,
    handleFileClear,
    handleSubmit,
  } = useRegister();

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: "50%",
              bgcolor: "primary.main",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 1,
            }}
          >
            <PersonAddIcon fontSize="medium" />
          </Box>
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
              />
            </Grid>

            {/* Password with Visibility Toggle */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                type={showPassword ? "text" : "password"}
                fullWidth
                required
                value={formData.password}
                onChange={handleChange("password")}
                error={Boolean(errors.password)}
                helperText={
                  errors.password || "8-25 chars, uppercase, lowercase & symbol"
                }
                inputProps={{ maxLength: 25 }}
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
                }}
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
                  Employment Type *
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
                  <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
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

            {/* Submit Button */}
            <Grid item xs={12} mt={1}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : null
                }
              >
                {loading ? "Registering..." : "Create Account"}
              </Button>
            </Grid>
          </Grid>
        </Box>

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
      </Paper>
    </Container>
  );
};

export default Register;
