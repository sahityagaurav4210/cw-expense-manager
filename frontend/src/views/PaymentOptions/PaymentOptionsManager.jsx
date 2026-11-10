import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import PaymentsIcon from "@mui/icons-material/Payments";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { usePaymentOptions } from "../../hooks/usePaymentOptions";
import {
  usePaymentOptionsColumns,
  paymentOptionsDefaultSorting,
} from "../../hooks/mrt/usePaymentOptionsColumns";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import PaperComponent from "../../components/core/PaperComponent";
import AppDialogTitle from "../../components/core/AppDialogTitle";
import useAppCss from "../../hooks/css/useAppCss";

const PaymentOptionsManager = () => {
  const {
    paymentOptions,
    loading,
    modalOpen,
    formData,
    setCaptchaId,
    errors,
    confirmDialog,
    handleChange,
    handleOpenCreateModal,
    handleCloseModal,
    requestCreateConfirmation,
    requestToggleConfirmation,
    requestDeleteConfirmation,
    executeConfirmedAction,
  } = usePaymentOptions();

  const { GlobalTableCss, GlobalPaperCss } = useAppCss();

  const columns = usePaymentOptionsColumns({
    onToggleActive: requestToggleConfirmation,
    onDelete: requestDeleteConfirmation,
  });

  const table = useMaterialReactTable({
    columns,
    data: paymentOptions,
    initialState: {
      sorting: paymentOptionsDefaultSorting,
    },
    state: { isLoading: loading },
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaperProps: { elevation: 2, sx: { borderRadius: 3 } },
    ...GlobalTableCss,
  });

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <PaymentsIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Payment Options Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage payment methods and status controls
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleOpenCreateModal}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Add New Payment Option
        </Button>
      </Box>

      <MaterialReactTable table={table} />

      {/* Add Payment Option Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
        PaperComponent={PaperComponent}
      >
        <AppDialogTitle
          title="Create Payment Option Master"
          onClose={handleCloseModal}
          Icon={<PaymentsIcon sx={{ color: "white" }} />}
        />
        <Box
          component="form"
          onSubmit={requestCreateConfirmation}
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
            minHeight: 0,
          }}
        >
          <DialogContent dividers sx={{ overflowY: "auto" }}>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Payment Name"
                type="text"
                fullWidth
                required
                value={formData.payment_name}
                onChange={handleChange("payment_name")}
                error={Boolean(errors.payment_name)}
                helperText={
                  errors.payment_name ||
                  "Max 100 chars (letters, numbers, -, _, space, /)"
                }
                inputProps={{ maxLength: 100 }}
              />

              <CaptchaComponent
                value={formData.captchaText}
                onChange={handleChange("captchaText")}
                onCaptchaIdChange={setCaptchaId}
                error={Boolean(errors.captchaText)}
                helperText={errors.captchaText}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save Payment Option
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Reusable Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        isLoading={confirmDialog.loading}
        heading={confirmDialog.heading}
        text={confirmDialog.text}
        onSuccess={executeConfirmedAction}
        onCancel={() =>
          confirmDialog.setConfirmDialog &&
          confirmDialog.setConfirmDialog({ open: false })
        }
      />
    </Paper>
  );
};

export default React.memo(PaymentOptionsManager);
