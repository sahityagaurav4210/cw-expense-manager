import React from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  CircularProgress,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AppDialogTitle from "../core/AppDialogTitle";
import CaptchaComponent from "../core/CaptchaComponent";
import PaperComponent from "../core/PaperComponent";

/**
 * Plug-and-play CaptchaDialog component.
 * Uses AppDialogTitle for standard header styling and CaptchaComponent for the CAPTCHA challenge.
 */
const CaptchaDialog = ({
  open,
  onClose,
  onSubmit,
  title = "CAPTCHA Verification",
  subtitle = "Please enter the characters shown below to verify your request.",
  submitBtnText = "Verify & Proceed",
  loading = false,
  captchaText = "",
  onCaptchaTextChange,
  captchaId = "",
  onCaptchaIdChange,
  error = "",
}) => {
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title={title}
        onClose={onClose}
        Icon={SecurityIcon}
        bgColor="primary.main"
      />

      <Box component="form" onSubmit={handleFormSubmit} noValidate>
        <DialogContent sx={{ pt: 2.5, pb: 1.5 }}>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {subtitle}
            </Typography>
          )}

          <CaptchaComponent
            value={captchaText}
            onChange={onCaptchaTextChange}
            onCaptchaIdChange={onCaptchaIdChange}
            error={Boolean(error)}
            helperText={error || "Enter the characters shown above"}
            disabled={loading}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
          <Button
            variant="outlined"
            color="secondary"
            onClick={onClose}
            disabled={loading}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!captchaText || loading}
            startIcon={
              loading ? <CircularProgress size={18} color="inherit" /> : null
            }
            sx={{ textTransform: "none", minWidth: 130 }}
          >
            {loading ? "Verifying..." : submitBtnText}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

CaptchaDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  submitBtnText: PropTypes.string,
  loading: PropTypes.bool,
  captchaText: PropTypes.string,
  onCaptchaTextChange: PropTypes.func,
  captchaId: PropTypes.string,
  onCaptchaIdChange: PropTypes.func,
  error: PropTypes.string,
};

export default React.memo(CaptchaDialog);
