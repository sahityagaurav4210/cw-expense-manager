import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useExpense } from "../../hooks/useExpense";
import {
  useExpenseColumns,
  expenseDefaultSorting,
} from "../../hooks/mrt/useExpenseColumns";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import PaperComponent from "../../components/core/PaperComponent";
import FileUploaderV2 from "../../components/core/FileUploaderV2";
import AppDialogTitle from "../../components/core/AppDialogTitle";
import useAppCss from "../../hooks/css/useAppCss";

const ExpenseManager = () => {
  const { GlobalTableCss, GlobalPaperCss } = useAppCss();
  const {
    expenses,
    categories,
    loading,
    modalOpen,
    formData,
    billFile,
    setBillFile,
    setIsBillReady,
    setCaptchaId,
    errors,
    confirmDialog,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    requestCreateConfirmation,
    requestDeleteConfirmation,
    executeConfirmedAction,
    fetchData,
  } = useExpense();

  const columns = useExpenseColumns({
    onDelete: requestDeleteConfirmation,
    onBillUploaded: fetchData,
  });

  const table = useMaterialReactTable({
    columns,
    data: expenses,
    initialState: {
      sorting: expenseDefaultSorting,
    },
    state: { isLoading: loading },
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaperProps: { elevation: 2, sx: { borderRadius: 3 } },
    ...GlobalTableCss,
  });

  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  const activeCategories = categories.filter(
    (c) => c.active_flag && !c.delete_flag,
  );
  const selectedCategory =
    activeCategories.find(
      (c) => String(c.id) === String(formData.category_id),
    ) || null;

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            <ReceiptLongIcon color="primary" sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Expense Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track and log individual expenditure items
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Add New Expense
          </Button>
        </Box>

        <MaterialReactTable table={table} />

        {/* Create Expense Dialog */}
        <Dialog
          open={modalOpen}
          onClose={handleCloseModal}
          maxWidth="sm"
          fullWidth
          PaperComponent={PaperComponent}
        >
          <AppDialogTitle
            title="Record Expense Item"
            onClose={handleCloseModal}
            Icon={<ReceiptLongIcon sx={{ color: "white" }} />}
          />
          <Box component="form" onSubmit={requestCreateConfirmation}>
            <DialogContent dividers>
              <Box display="flex" flexDirection="column" gap={2}>
                {/* Expense Name */}
                <TextField
                  label="Expense Name *"
                  type="text"
                  fullWidth
                  required
                  value={formData.name}
                  onChange={handleChange("name")}
                  error={Boolean(errors.name)}
                  helperText={
                    errors.name || "Max 64 chars (letters and numbers only)"
                  }
                  inputProps={{ maxLength: 64 }}
                />

                {/* Expense Amount */}
                <TextField
                  label="Expense Amount (₹) *"
                  type="number"
                  fullWidth
                  required
                  value={formData.amount}
                  onChange={handleChange("amount")}
                  onKeyDown={handleKeyDownNumber}
                  error={Boolean(errors.amount)}
                  helperText={
                    errors.amount || "Numbers only, no scientific notation"
                  }
                />

                {/* Expense Category (Autocomplete from Master) */}
                <Autocomplete
                  options={activeCategories}
                  getOptionLabel={(option) => option.name || "Not Defined"}
                  value={selectedCategory}
                  onChange={(event, newValue) => {
                    handleChange("category_id")({
                      target: { value: newValue ? String(newValue.id) : "" },
                    });
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Expense Category (Optional)"
                      helperText="Defaults to Not Defined option"
                    />
                  )}
                />

                {/* Expense Type (Fixed vs Variable) */}
                <TextField
                  select
                  label="Expense Type *"
                  fullWidth
                  required
                  value={formData.type}
                  onChange={handleChange("type")}
                  error={Boolean(errors.type)}
                  helperText={errors.type}
                >
                  <MenuItem value="Fixed">Fixed Expense</MenuItem>
                  <MenuItem value="Variable">Variable Expense</MenuItem>
                </TextField>

                {/* Expense Date */}
                <DatePicker
                  label="Expense Date (Optional)"
                  format="YYYY-MM-DD"
                  value={
                    formData.expense_date ? dayjs(formData.expense_date) : null
                  }
                  onChange={(date) => {
                    const formatted = date
                      ? dayjs(date).format("YYYY-MM-DD")
                      : "";
                    handleChange("expense_date")({
                      target: { value: formatted },
                    });
                  }}
                  slotProps={{
                    textField: { fullWidth: true, size: "small" },
                  }}
                />

                {/* Bill / Receipt Upload using FileUploaderV2 */}
                <Box>
                  <Typography variant="body2" fontWeight={600} color="primary" mb={1}>
                    Attach Bill / Receipt (Optional - PDF, JPG, PNG up to 5MB)
                  </Typography>
                  <FileUploaderV2
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    maxSizeMB={5}
                    label="Drag & drop bill or click to browse"
                    onFileChange={(file) => setBillFile(file)}
                    onReadyChange={(ready) => setIsBillReady(ready)}
                  />
                  {billFile && (
                    <Box display="flex" justifyContent="flex-end" mt={0.5}>
                      <Button
                        size="small"
                        color="error"
                        onClick={() => {
                          setBillFile(null);
                          setIsBillReady(true);
                        }}
                      >
                        Clear Attached File
                      </Button>
                    </Box>
                  )}
                </Box>

                {/* CAPTCHA */}
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
                Save Expense
              </Button>
            </DialogActions>
          </Box>
        </Dialog>

        {/* Confirmation Dialog */}
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
    </LocalizationProvider>
  );
};

export default ExpenseManager;
