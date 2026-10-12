import React from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Grid,
  CircularProgress,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import PaperComponent from "../core/PaperComponent";
import CaptchaComponent from "../core/CaptchaComponent";
import ConfirmationDialog from "../core/ConfirmationDialog";
import AppDialogTitle from "../core/AppDialogTitle";

const BudgetInflowDialog = ({
  open,
  onClose,
  budget,
  formData,
  errors,
  loading,
  confirmDialog,
  setCaptchaId,
  onChange,
  onDateChange,
  onSubmit,
  onConfirmSuccess,
  onConfirmCancel,
}) => {
  if (!budget) return null;

  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        PaperComponent={PaperComponent}
        aria-labelledby="budget-inflow-dialog-title"
      >
        <AppDialogTitle
          title="Add Extra Income / Received Amount"
          onClose={onClose}
          Icon={
            <AddCircleOutlineIcon
              fontSize="large"
              sx={{ color: "white", pr: 1 }}
            />
          }
        />

        <Box
          component="form"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          noValidate
        >
          <DialogContent dividers sx={{ p: 3 }}>
            <Box
              mb={2.5}
              p={1.5}
              bgcolor="#eff6ff"
              borderRadius={2}
              border="1px solid #bfdbfe"
            >
              <Typography
                variant="caption"
                color="text.secondary"
                fontWeight={600}
                display="block"
              >
                Active Budget:
              </Typography>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="primary.main"
              >
                Current Total Budget: ₹
                {parseFloat(budget.amount).toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {/* Amount */}
              <Grid item xs={12}>
                <TextField
                  label="Received Amount (₹) *"
                  type="number"
                  fullWidth
                  required
                  value={formData.amount}
                  onChange={onChange("amount")}
                  onKeyDown={handleKeyDownNumber}
                  error={Boolean(errors.amount)}
                  helperText={
                    errors.amount || "Enter amount received (e.g. 5000)"
                  }
                />
              </Grid>

              {/* Source / Description */}
              <Grid item xs={12}>
                <TextField
                  label="Source / Description *"
                  type="text"
                  fullWidth
                  required
                  placeholder="e.g. Received from Rahul, Gift, Bonus, Freelance"
                  value={formData.source}
                  onChange={onChange("source")}
                  error={Boolean(errors.source)}
                  helperText={
                    errors.source || "Specify where the amount came from"
                  }
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>

              {/* Received Date (Disable future dates) */}
              <Grid item xs={12}>
                <DatePicker
                  label="Received Date *"
                  format="YYYY-MM-DD"
                  value={
                    formData.received_date
                      ? dayjs(formData.received_date)
                      : null
                  }
                  onChange={onDateChange}
                  maxDate={dayjs()}
                  disableFuture
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small",
                      error: Boolean(errors.received_date),
                      helperText:
                        errors.received_date || "Future dates are disabled",
                    },
                  }}
                />
              </Grid>

              {/* Notes (Optional) */}
              <Grid item xs={12}>
                <TextField
                  label="Notes / Remarks (Optional)"
                  type="text"
                  fullWidth
                  multiline
                  rows={2}
                  placeholder="Additional context or notes..."
                  value={formData.notes}
                  onChange={onChange("notes")}
                  inputProps={{ maxLength: 255 }}
                />
              </Grid>

              {/* CAPTCHA */}
              <Grid item xs={12}>
                <CaptchaComponent
                  value={formData.captchaText}
                  onChange={onChange("captchaText")}
                  onCaptchaIdChange={setCaptchaId}
                  error={Boolean(errors.captchaText)}
                  helperText={errors.captchaText}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: "#f8fafc" }}>
            <Button
              onClick={onClose}
              variant="outlined"
              color="secondary"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : null
              }
              sx={{ fontWeight: 700 }}
            >
              {loading ? "Adding..." : "Add to Active Budget"}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Confirmation Dialog before adding inflow */}
      {confirmDialog && (
        <ConfirmationDialog
          open={confirmDialog.open || false}
          isLoading={confirmDialog.loading || false}
          heading={confirmDialog.heading || "Confirm Inflow Addition"}
          text={confirmDialog.text}
          onSuccess={onConfirmSuccess}
          onCancel={onConfirmCancel}
          okBtnTxt="Confirm & Add"
          cancelBtnTxt="Cancel"
        />
      )}
    </LocalizationProvider>
  );
};

export default React.memo(BudgetInflowDialog);
