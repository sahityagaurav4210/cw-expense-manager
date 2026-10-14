import React from "react";
import PropTypes from "prop-types";
import { Box, Typography, Chip, Link, Alert, Tooltip } from "@mui/material";
import MarkEmailReadOutlinedIcon from "@mui/icons-material/MarkEmailReadOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckIcon from "@mui/icons-material/Check";
import OtpInput from "./OtpInput";
import { useOTPWrapper } from "../../hooks/core/useOTPWrapper";

/**
 * Plug-and-play OTPWrapper component.
 * Primary Responsibility:
 * 1. Defines the Two-Factor Authentication presentation layout (icon, title, subtitle).
 * 2. Displays the user's registered email with an accessible "Change Account" link right beside it.
 * 3. Shows local environment default OTP helper banner when available.
 * 4. Embeds the focused OtpInput component for digit entry and verification.
 * 5. Fully responsive across desktop, tablet, and small mobile viewports.
 */
const OTPWrapper = ({
  email = "",
  tempToken = "",
  defaultOtp,
  onChangeAccount,
  onVerified,
  onResendSuccess,
  length = 6,
  title = "Two-Factor Authentication",
  subtitle = "Enter the 6-digit verification code sent to",
}) => {
  const {
    displayEmail,
    handleChangeAccountClick,
    handleCopyDefaultOtp,
    copied,
  } = useOTPWrapper({
    email,
    defaultOtp,
    onChangeAccount,
    onVerified,
  });

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      width="100%"
      sx={{
        boxSizing: "border-box",
        maxWidth: "100%",
        px: { xs: 0, sm: 1 },
      }}
    >
      {/* 2FA Header Icon */}
      <Box
        sx={{
          width: { xs: 44, sm: 50 },
          height: { xs: 44, sm: 50 },
          borderRadius: "50%",
          bgcolor: "secondary.main",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 1.5,
          boxShadow: 2,
        }}
      >
        <MarkEmailReadOutlinedIcon fontSize="medium" />
      </Box>

      {/* Title & Subtitle */}
      <Typography
        variant="h5"
        fontWeight={700}
        color="text.primary"
        align="center"
        sx={{
          fontSize: { xs: "1.25rem", sm: "1.5rem" },
          lineHeight: 1.3,
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        align="center"
        sx={{
          mt: 0.75,
          fontSize: { xs: "0.8125rem", sm: "0.875rem" },
          px: { xs: 1, sm: 0 },
        }}
      >
        {subtitle}
      </Typography>

      {/* Email Display & Accessible Change Account Link Side-by-Side */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={{ xs: 0.75, sm: 1 }}
        mt={1}
        mb={2}
        flexWrap="wrap"
        sx={{ width: "100%", textAlign: "center" }}
      >
        {displayEmail && (
          <Chip
            label={displayEmail}
            size="small"
            color="primary"
            variant="outlined"
            sx={{
              fontWeight: 600,
              fontSize: { xs: "0.75rem", sm: "0.8125rem" },
              maxWidth: { xs: 210, sm: 280 },
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        )}

        {onChangeAccount && (
          <Link
            component="button"
            type="button"
            onClick={handleChangeAccountClick}
            sx={{
              cursor: "pointer",
              fontWeight: 600,
              fontSize: { xs: "0.8125rem", sm: "0.85rem" },
              color: "primary.main",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              background: "none",
              border: "none",
              p: 0,
              display: "inline-flex",
              alignItems: "center",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                color: "primary.dark",
                textDecoration: "underline",
              },
            }}
          >
            Change Account
          </Link>
        )}
      </Box>

      {/* Embedded Clean & Responsive OtpInput */}
      <OtpInput
        length={length}
        tempToken={tempToken}
        onVerified={onVerified}
        onResendSuccess={onResendSuccess}
        autoFocus
      />
    </Box>
  );
};

OTPWrapper.propTypes = {
  email: PropTypes.string,
  tempToken: PropTypes.string,
  defaultOtp: PropTypes.string,
  onChangeAccount: PropTypes.func,
  onVerified: PropTypes.func.isRequired,
  onResendSuccess: PropTypes.func,
  length: PropTypes.number,
  title: PropTypes.string,
  subtitle: PropTypes.string,
};

export default React.memo(OTPWrapper);
