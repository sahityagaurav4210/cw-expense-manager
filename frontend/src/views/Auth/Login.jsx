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
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import { useLogin } from "../../hooks/useLogin";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const { formData, setCaptchaId, errors, loading, handleChange, handleSubmit } = useLogin();

  return (
    <Container maxWidth="xs" sx={{ py: 6 }}>
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
            <LockOutlinedIcon fontSize="medium" />
          </Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            User Login
          </Typography>
          <Typography variant="body2" color="text.secondary">
            CW Expense Tracker Portal
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
                }}
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

            {/* Submit */}
            <Grid item xs={12} mt={1}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : null}
              >
                {loading ? "Signing in..." : "Login"}
              </Button>
            </Grid>
          </Grid>
        </Box>

        <Box display="flex" justifyContent="center" mt={3}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{" "}
            <Link component="button" type="button" onClick={() => navigate("/register")} sx={{ fontWeight: 700 }}>
              Register Here
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;
