import React from "react";
import PropTypes from "prop-types";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Paper,
  Grid,
  Chip,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  FormControlLabel,
  Checkbox,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";
import EmailIcon from "@mui/icons-material/Email";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import useAppCss from "../../hooks/css/useAppCss";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import { useTwoFactorSettings } from "../../hooks/useTwoFactorSettings";

/**
 * TwoFactorSettings View Component (Pure UI).
 * All state management, async API communications, and business logic
 * are encapsulated inside the custom hook `useTwoFactorSettings`.
 */
const TwoFactorSettings = ({ onBack }) => {
  const { GlobalPaperCss } = useAppCss();
  const {
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
    handleOpenSetup,
    handleCloseSetup,
    handleCopySecret,
    handleVerifyCodeChange,
    handleVerifySetup,
    handleSetDefaultMethod,
    handleOpenDisableDialog,
    handleCloseDisableDialog,
    handleConfirmDisable,
  } = useTwoFactorSettings();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Back to Settings
        </Button>
      </Box>

      <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
          mb={2.5}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <SecurityIcon color="primary" sx={{ fontSize: 36 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Two-Factor Authentication (2FA)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Select and configure your preferred verification method for secure account sign-in
              </Typography>
            </Box>
          </Box>

          <Chip
            icon={<CheckCircleIcon />}
            label={`Active: ${settings.twoFactorMethod === "AUTHENTICATOR" ? "Authenticator App" : "Email"}`}
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress size={36} color="primary" />
          </Box>
        ) : (
          <Grid container spacing={3}>
            {/* OPTION 1: EMAIL OTP (BY DEFAULT ON) */}
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderColor:
                    settings.twoFactorMethod === "EMAIL"
                      ? "primary.main"
                      : "divider",
                  borderWidth: settings.twoFactorMethod === "EMAIL" ? 2 : 1,
                  bgcolor:
                    settings.twoFactorMethod === "EMAIL"
                      ? "rgba(0, 0, 128, 0.02)"
                      : "background.paper",
                  transition: "all 0.2s ease-in-out",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: "rgba(0, 0, 128, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <EmailIcon color="primary" fontSize="large" />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="text.primary"
                        >
                          Email Verification
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Built-in & Always Available
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label="Enabled"
                      color="success"
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    A 6-digit one-time password (OTP) is sent to your registered
                    email (<strong>{settings.email}</strong>) each time you log in.
                  </Typography>

                  <Alert severity="info" sx={{ py: 0.5, fontSize: "0.8125rem" }}>
                    Standard verification method enabled by default for all accounts.
                  </Alert>
                </CardContent>

                <Box
                  p={2.5}
                  pt={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  {settings.twoFactorMethod === "EMAIL" ? (
                    <Chip
                      icon={<CheckIcon />}
                      label="Current Default Method"
                      color="primary"
                      sx={{ fontWeight: 700 }}
                    />
                  ) : (
                    <Button
                      variant="outlined"
                      color="primary"
                      size="small"
                      disabled={updatingMethod === "EMAIL"}
                      onClick={() => handleSetDefaultMethod("EMAIL")}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      {updatingMethod === "EMAIL" ? "Updating..." : "Set as Default"}
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>

            {/* OPTION 2: AUTHENTICATOR APP (TOTP) */}
            <Grid item xs={12} md={6}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderRadius: 3,
                  borderColor:
                    settings.twoFactorMethod === "AUTHENTICATOR"
                      ? "primary.main"
                      : "divider",
                  borderWidth: settings.twoFactorMethod === "AUTHENTICATOR" ? 2 : 1,
                  bgcolor:
                    settings.twoFactorMethod === "AUTHENTICATOR"
                      ? "rgba(0, 0, 128, 0.02)"
                      : "background.paper",
                  transition: "all 0.2s ease-in-out",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    mb={2}
                  >
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: 2,
                          bgcolor: "rgba(0, 0, 128, 0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <SmartphoneIcon color="primary" fontSize="large" />
                      </Box>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={700}
                          color="text.primary"
                        >
                          Authenticator App
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Google Authenticator, Authy, Microsoft Authenticator
                        </Typography>
                      </Box>
                    </Box>

                    <Chip
                      label={
                        settings.isAuthenticatorEnabled
                          ? "Configured"
                          : "Not Configured"
                      }
                      color={
                        settings.isAuthenticatorEnabled ? "success" : "default"
                      }
                      size="small"
                      sx={{ fontWeight: 700 }}
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" mb={2}>
                    Generate instant 6-digit verification codes using your favorite
                    authenticator app even when you are offline or out of cell coverage.
                  </Typography>

                  {settings.isAuthenticatorEnabled ? (
                    <Alert severity="success" sx={{ py: 0.5, fontSize: "0.8125rem" }}>
                      Authenticator App is active and ready for authentication.
                    </Alert>
                  ) : (
                    <Alert severity="warning" sx={{ py: 0.5, fontSize: "0.8125rem" }}>
                      Not yet configured. Scan a QR code with your mobile app to set up.
                    </Alert>
                  )}
                </CardContent>

                <Box
                  p={2.5}
                  pt={0}
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  flexWrap="wrap"
                  gap={1}
                >
                  {settings.isAuthenticatorEnabled ? (
                    <>
                      <Box display="flex" alignItems="center" gap={1}>
                        {settings.twoFactorMethod === "AUTHENTICATOR" ? (
                          <Chip
                            icon={<CheckIcon />}
                            label="Current Default Method"
                            color="primary"
                            sx={{ fontWeight: 700 }}
                          />
                        ) : (
                          <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            disabled={updatingMethod === "AUTHENTICATOR"}
                            onClick={() => handleSetDefaultMethod("AUTHENTICATOR")}
                            sx={{ textTransform: "none", fontWeight: 700 }}
                          >
                            {updatingMethod === "AUTHENTICATOR"
                              ? "Updating..."
                              : "Set as Default"}
                          </Button>
                        )}
                      </Box>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Button
                          variant="text"
                          color="primary"
                          size="small"
                          onClick={handleOpenSetup}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Reconfigure
                        </Button>
                        <Button
                          variant="text"
                          color="error"
                          size="small"
                          onClick={handleOpenDisableDialog}
                          sx={{ textTransform: "none", fontWeight: 600 }}
                        >
                          Disable
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<QrCode2Icon />}
                      onClick={handleOpenSetup}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      Set Up Authenticator App
                    </Button>
                  )}
                </Box>
              </Card>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* SETUP AUTHENTICATOR MODAL */}
      <Dialog
        open={setupModalOpen}
        onClose={handleCloseSetup}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, p: { xs: 1, sm: 2 } },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1.2}>
            <QrCode2Icon color="primary" sx={{ fontSize: 28 }} />
            <Typography variant="h6" fontWeight={700} color="primary.main">
              Set Up Authenticator App
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Scan the QR code with Google Authenticator, Microsoft Authenticator, or Authy
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {setupLoading ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={4}
              gap={2}
            >
              <CircularProgress size={36} color="primary" />
              <Typography variant="body2" color="text.secondary">
                Generating unique authenticator key...
              </Typography>
            </Box>
          ) : setupData ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2.5}>
              {/* QR Code Container */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "#ffffff",
                  border: "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: 1,
                }}
              >
                <img
                  src={setupData.qrCodeUrl}
                  alt="2FA QR Code"
                  style={{
                    width: 200,
                    height: 200,
                    display: "block",
                    borderRadius: 4,
                  }}
                />
              </Box>

              {/* Manual Secret Key */}
              <Box width="100%">
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={600}
                  sx={{ textTransform: "uppercase" }}
                >
                  Or enter secret key manually:
                </Typography>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  p={1.5}
                  mt={0.5}
                  sx={{
                    bgcolor: "#f8fafc",
                    border: "1px dashed #94a3b8",
                    borderRadius: 2,
                  }}
                >
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{
                      fontFamily: "monospace",
                      letterSpacing: "0.1em",
                      color: "primary.main",
                      wordBreak: "break-all",
                    }}
                  >
                    {setupData.secret}
                  </Typography>
                  <Tooltip title={copied ? "Copied!" : "Copy Key"}>
                    <IconButton size="small" onClick={handleCopySecret} color="primary">
                      {copied ? <CheckIcon fontSize="small" /> : <ContentCopyIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* Enter 6-digit Code to Confirm */}
              <Box width="100%">
                <Typography variant="subtitle2" fontWeight={700} color="text.primary" mb={1}>
                  Enter the 6-digit code shown in your app:
                </Typography>
                <TextField
                  fullWidth
                  placeholder="e.g. 123456"
                  value={verifyCode}
                  onChange={handleVerifyCodeChange}
                  error={Boolean(setupError)}
                  helperText={setupError}
                  inputProps={{
                    maxLength: 6,
                    style: {
                      textAlign: "center",
                      letterSpacing: "0.4em",
                      fontSize: "1.25rem",
                      fontWeight: 700,
                    },
                  }}
                />
              </Box>

              {/* Checkbox: Set as Default */}
              <Box width="100%">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={setAsDefault}
                      onChange={(e) => setSetAsDefault(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2" fontWeight={600}>
                      Set Authenticator App as my default 2FA sign-in method
                    </Typography>
                  }
                />
              </Box>
            </Box>
          ) : null}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={handleCloseSetup}
            disabled={verifying}
            color="inherit"
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleVerifySetup}
            disabled={verifying || verifyCode.trim().length !== 6}
            startIcon={verifying ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{ textTransform: "none", fontWeight: 700, px: 3 }}
          >
            {verifying ? "Activating..." : "Verify & Activate"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* CONFIRM DISABLE AUTHENTICATOR */}
      <ConfirmationDialog
        open={disableDialogOpen}
        heading="Disable Authenticator App?"
        text="Are you sure you want to disable your Authenticator App? Your default 2FA method will automatically revert to Email OTP."
        onSuccess={handleConfirmDisable}
        onCancel={handleCloseDisableDialog}
        okBtnTxt={disabling ? "Disabling..." : "Disable Authenticator"}
      />
    </Box>
  );
};

TwoFactorSettings.propTypes = {
  onBack: PropTypes.func.isRequired,
};

export default React.memo(TwoFactorSettings);
