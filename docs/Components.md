# Predefine React Components

1. OptionCard

```jsx
import React from "react";
import { Box, Checkbox, Typography, useTheme, alpha } from "@mui/material";

/**
 * Reusable OptionCard component for option selection across forms.
 *
 * @param {boolean} checked - Whether the option card is selected
 * @param {string|React.ReactNode} label - Label to display
 * @param {function} onClick - Click handler callback
 * @param {boolean} [disabled=false] - Disabled state
 * @param {object} [sx={}] - Additional MUI styling overrides
 * @param {React.ReactNode} [children] - Optional nested content
 */
const OptionCard = ({
  checked,
  label,
  onClick,
  disabled = false,
  sx = {},
  children,
}) => {
  const theme = useTheme();

  return (
    <Box
      onClick={() => !disabled && onClick && onClick()}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        px: 2,
        py: 0.85,
        borderRadius: 2,
        border: "1.5px solid",
        borderColor: checked ? theme.palette.primary.main : "divider",
        bgcolor: checked
          ? alpha(theme.palette.primary.main, 0.08)
          : theme.palette.background.paper,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        userSelect: "none",
        boxShadow: checked
          ? `0 2px 8px ${alpha(theme.palette.primary.main, 0.2)}`
          : "none",
        "&:hover": {
          borderColor: disabled ? "divider" : theme.palette.primary.main,
          bgcolor: disabled
            ? theme.palette.background.paper
            : alpha(theme.palette.primary.main, 0.04),
        },
        ...sx,
      }}
    >
      <Checkbox
        size="small"
        checked={Boolean(checked)}
        disabled={disabled}
        sx={{ p: 0, mr: 1 }}
      />
      {typeof label === "string" ? (
        <Typography
          variant="body2"
          sx={{
            fontWeight: checked ? 700 : 500,
            color: checked ? theme.palette.primary.main : "text.primary",
          }}
        >
          {label}
        </Typography>
      ) : (
        label
      )}
      {children}
    </Box>
  );
};

export default React.memo(OptionCard);
```

2. FileUploader

```jsx
import React, { useState } from "react";
import { Box, Button, Typography, Avatar, IconButton } from "@mui/material";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteIcon from "@mui/icons-material/Delete";
import { useUI } from "../context/UIContext";

const FileUploader = ({
  onFileSelected,
  onFileSelect,
  currentImageUrl,
  initialPreview,
  onClear,
  maxSizeMB = 2,
}) => {
  const { showAlert } = useUI();
  const [preview, setPreview] = useState(null);

  const validateMagicBytes = (arrayBuffer) => {
    const uint8 = new Uint8Array(arrayBuffer);
    if (uint8.length < 4) return false;

    // JPEG: FF D8 FF
    const isJpeg = uint8[0] === 0xff && uint8[1] === 0xd8 && uint8[2] === 0xff;
    // PNG: 89 50 4E 47
    const isPng =
      uint8[0] === 0x89 &&
      uint8[1] === 0x50 &&
      uint8[2] === 0x4e &&
      uint8[3] === 0x47;

    return isJpeg || isPng;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Extension check
    const validExtensions = ["jpg", "jpeg", "png"];
    const ext = file.name.split(".").pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      showAlert(
        "Invalid extension. Only *.jpg, *.jpeg, and *.png files are allowed.",
        "error",
      );
      e.target.value = "";
      return;
    }

    // 2. Size check (2MB)
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      showAlert(`File size exceeds limit of ${maxSizeMB} MB.`, "error");
      e.target.value = "";
      return;
    }

    // 3. Magic Bytes check
    const reader = new FileReader();
    reader.onloadend = (event) => {
      const buffer = event.target.result;
      if (!validateMagicBytes(buffer)) {
        showAlert(
          "Security Validation Failed: File header magic bytes do not match JPEG or PNG format. Fake extension modification detected.",
          "error",
        );
        e.target.value = "";
        return;
      }

      // Validated successfully
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      if (onFileSelected) onFileSelected(file, objectUrl);
      if (onFileSelect) onFileSelect(file, objectUrl);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRemove = () => {
    setPreview(null);
    if (onClear) onClear();
  };

  const displayImage = preview || currentImageUrl || initialPreview;

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={1}
      my={1}
    >
      <Box position="relative">
        <Avatar
          src={displayImage || undefined}
          sx={{
            width: 90,
            height: 90,
            bgcolor: "primary.main",
            fontSize: 32,
            border: "2px solid gainsboro",
          }}
        >
          {!displayImage && <PhotoCameraIcon fontSize="large" />}
        </Avatar>
        {displayImage && (
          <IconButton
            size="small"
            color="error"
            onClick={handleRemove}
            sx={{
              position: "absolute",
              top: -4,
              right: -4,
              bgcolor: "background.paper",
              boxShadow: 2,
              "&:hover": { bgcolor: "error.light", color: "#fff" },
            }}
            title="Remove Profile Photo"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Button
        variant="outlined"
        component="label"
        size="small"
        startIcon={<PhotoCameraIcon />}
        sx={{ textTransform: "none" }}
      >
        Upload Photo
        <input
          type="file"
          hidden
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileChange}
        />
      </Button>
      <Typography variant="caption" color="text.secondary">
        Max file size: 2MB (*.jpg, *.jpeg, *.png)
      </Typography>
    </Box>
  );
};

export default FileUploader;
```

3. Footer

```jsx
import React from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import NavbarLogo from "./NavbarLogo";

/**
 * Footer component that displays the application copyright information,
 * creator attribution, and links to Terms & Conditions and Privacy Policy.
 *
 * @param {Object} props - The component props.
 * @param {function(string): void} [props.onNavigate] - Callback function to navigate between different views (e.g., 'terms', 'privacy').
 * @returns {JSX.Element} The rendered Footer component.
 */
const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        p: 1,
        textAlign: "center",
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        zIndex: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 1,
        fontFamily: "Roboto, Arial, sans-serif",
      }}
    >
      <Stack direction="row">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          &copy; {currentYear} Gaurav Sahitya || All rights reserved ||
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Made with ❤️ in
          </Typography>

          <NavbarLogo src="/ind.svg" height={16} hidePadding hideTooltip />
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        sx={{ fontFamily: "Roboto, Arial, sans-serif", fontSize: "14px" }}
      >
        <Link
          component="button"
          onClick={() => onNavigate && onNavigate("terms")}
          sx={{
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            color: "primary.main",
            verticalAlign: "baseline",
          }}
        >
          Terms & Condition
        </Link>

        <Link
          component="button"
          onClick={() => onNavigate && onNavigate("privacy")}
          sx={{
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            color: "primary.main",
            verticalAlign: "baseline",
          }}
        >
          Privacy Policy
        </Link>
      </Stack>
    </Box>
  );
};

export default React.memo(Footer);
```

4. ConfirmationDialog

```jsx
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
} from "@mui/material";
import React from "react";
import Heading from "./Heading";
import BeenhereIcon from "@mui/icons-material/Beenhere";
import CancelIcon from "@mui/icons-material/Cancel";
import { useTranslation } from "react-i18next";
import PaperComponent from "./PaperComponent";
import useAppCss from "../../hooks/AppCss";

function ConfirmationDialog({
  open,
  isLoading,
  text,
  heading,
  Icon,
  onSuccess,
  onCancel,
  okBtnTxt = "ok",
  cancelBtnTxt = "cancel",
  maxWidth = "xs",
}) {
  const theme = useTheme();
  const { t } = useTranslation();
  const { GlobalDialogDividerCss } = useAppCss();

  const style = {
    p: 1,
    outline: "none",
  };

  if (!open) return <></>;

  return (
    <>
      <Dialog
        open={open}
        disableEscapeKeyDown
        onClose={() => {}}
        aria-labelledby="cnf-dialog-title"
        aria-describedby="cnf-dialog-description"
        maxWidth={maxWidth}
        fullWidth
        PaperComponent={PaperComponent}
      >
        <Box component="div" sx={style}>
          <DialogTitle
            id="cnf-dialog-title"
            sx={{
              cursor: "move",
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Heading
              Icon={Icon}
              color={theme.palette.primary.main}
              iconColor={theme.palette.warning.main}
              text={heading || t("confirmation")}
              mb={0}
              hideAnimation={false}
            />
          </DialogTitle>

          <DialogContent sx={GlobalDialogDividerCss}>
            <Box component="div" my={1}>
              {text}
            </Box>
          </DialogContent>

          <DialogActions>
            {onCancel && (
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                type="button"
                onClick={onCancel}
                autoFocus
                size="small"
                disabled={isLoading}
                color="error"
              >
                {t(cancelBtnTxt)}
              </Button>
            )}

            <Button
              variant="contained"
              color="success"
              startIcon={
                !isLoading ? (
                  <BeenhereIcon fontSize="small" />
                ) : (
                  <CircularProgress size={16} color="success" />
                )
              }
              type="button"
              onClick={onSuccess}
              autoFocus={!onCancel}
              size="small"
              disabled={isLoading}
            >
              {t(okBtnTxt)}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
      {/* <Modal open={open} aria-labelledby="modal-revoke-cnf">
        <Box sx={style}>
          <Heading
            Icon={Icon}
            color={theme.palette.primary.main}
            iconColor={theme.palette.warning.main}
            text={heading || t("confirmation")}
            mb={0}
          />

          <Divider sx={{ my: 1 }} />

          {text}

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: 2,
              mt: 4,
            }}
          >
            {onCancel && (
              <Button
                variant="contained"
                startIcon={<CancelIcon />}
                type="button"
                onClick={onCancel}
                sx={{ backgroundColor: theme.palette.error.main }}
                autoFocus
                size="small"
                disabled={isLoading}
              >
                {t("cancel")}
              </Button>
            )}

            <Button
              variant="contained"
              startIcon={
                !isLoading ? (
                  <BeenhereIcon fontSize="small" />
                ) : (
                  <CircularProgress size={16} color="success" />
                )
              }
              type="button"
              onClick={onSuccess}
              autoFocus={!onCancel}
              sx={{ backgroundColor: theme.palette.success.main }}
              size="small"
              disabled={isLoading}
            >
              {t("ok")}
            </Button>
          </Box>
        </Box>
      </Modal> */}
    </>
  );
}

export default React.memo(ConfirmationDialog);
```

**Note:** Kindly remove usetranslation hook from it as i do not need translation services in it.

5. AppTheme:

```jsx
import { createTheme } from "@mui/material";

const AppTheme = (fontSize) =>
  createTheme({
    typography: {
      fontFamily: "Inter, sans-serif",
      fontSize: fontSize,
    },
    palette: {
      primary: { main: "#000080", A700: "#2563eb", hover: "#000066" },
      secondary: {
        main: "#737373",
        A100: "#cbd5e1",
        A200: "#e2e8f0",
        A50: "#f1f5f9",
        A700: "#e0e0e0",
      },
      success: { main: "#228B22", hover: "#1e7b1e", A400: "#34d399" },
      error: { main: "#b91c1c", hover: "#dc2626" },
      info: { main: "#2196f3", 700: "#67e8f9", 100: "#cffafe" },
      warning: { main: "#ff9933", hover: "#e68a00", A100: "#f7e8ec" },
      chip: { main: "#e3f2fd" },
      viewDetail: {
        main: "#3b82f6",
        hover: "#1d4ed8",
        hoverBackground: "#eff6ff",
      },
      edit: {
        main: "#eab308",
        hover: "#a16207",
        hoverBackground: "#fffbeb",
      },
      addRevoke: {
        main: "#ef4444",
        hover: "#dc2626",
        hoverBackground: "#fef2f2",
      },
      markAttendance: {
        main: "#9C27B0",
        hover: "#7B1FA2",
        hoverBackground: "#F3E5F5",
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif",
            fontWeight: "bold",
            padding: "0.50rem 1.5rem",
            transition: "all 0.35s ease-in-out",
            "&:active": {
              transform: "scale(1.02)",
              cursor: "pointer",
            },
            "&:hover": {
              cursor: "pointer",
            },
          },
        },
      },
      MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
      MuiChip: { styleOverrides: { root: { borderRadius: 16 } } },
      MuiTextField: {
        defaultProps: {
          variant: "outlined",
          size: "small",
        },
      },
      MuiSelect: {
        defaultProps: {
          variant: "outlined",
          size: "small",
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            backgroundColor: "#e0e0e0",
            fontWeight: "bold",
            color: "#333",
            whiteSpace: "nowrap",
          },
          body: {
            padding: "8px 16px",
            whiteSpace: "nowrap",
          },
        },
      },
      muiTableHeadCellProps: {
        sx: {
          fontWeight: "bold",
          color: "#000080",
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          "*": {
            "::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            "::-webkit-scrollbar-thumb": {
              backgroundColor: "#cbd5e1",
              borderRadius: "8px",
            },
          },
        },
      },
    },
  });

export default AppTheme;
```
