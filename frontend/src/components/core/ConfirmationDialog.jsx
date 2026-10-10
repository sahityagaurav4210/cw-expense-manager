import React from "react";
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
import Heading from "./Heading";
import BeenhereIcon from "@mui/icons-material/Beenhere";
import CancelIcon from "@mui/icons-material/Cancel";
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
  okBtnTxt = "OK",
  cancelBtnTxt = "Cancel",
  maxWidth = "xs",
}) {
  const theme = useTheme();
  const { GlobalDialogDividerCss } = useAppCss();

  const style = {
    p: 1,
    outline: "none",
  };

  if (!open) return <></>;

  return (
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
            text={heading || "Confirmation"}
            mb={0}
            hideAnimation={false}
          />
        </DialogTitle>

        <DialogContent sx={GlobalDialogDividerCss}>
          <Box component="div" my={1}>
            {text}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 1.5 }}>
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
              {cancelBtnTxt}
            </Button>
          )}

          <Button
            variant="contained"
            color="success"
            startIcon={
              !isLoading ? (
                <BeenhereIcon fontSize="small" />
              ) : (
                <CircularProgress size={16} color="inherit" />
              )
            }
            type="button"
            onClick={onSuccess}
            autoFocus={!onCancel}
            size="small"
            disabled={isLoading}
          >
            {okBtnTxt}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default React.memo(ConfirmationDialog);
