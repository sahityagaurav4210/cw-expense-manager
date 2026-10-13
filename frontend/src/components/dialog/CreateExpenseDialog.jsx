import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Autocomplete,
} from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import CaptchaComponent from "../core/CaptchaComponent";
import PaperComponent from "../core/PaperComponent";
import FileUploaderV2 from "../core/FileUploaderV2";
import AppDialogTitle from "../core/AppDialogTitle";

const CreateExpenseDialog = ({
  open,
  onClose,
  formData,
  errors,
  categories = [],
  billFile,
  setBillFile,
  setIsBillReady,
  setCaptchaId,
  handleChange,
  handleKeyDownNumber,
  onSubmit,
}) => {
  const activeCategories = categories.filter(
    (c) => c.active_flag && !c.delete_flag
  );
  const selectedCategory =
    activeCategories.find(
      (c) => String(c.id) === String(formData.category_id)
    ) || null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title="Record Expense Item"
        onClose={onClose}
        Icon={<ReceiptLongIcon sx={{ color: "white" }} />}
      />
      <Box component="form" onSubmit={onSubmit}>
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
                errors.name || "3–100 chars (letters and numbers)"
              }
              inputProps={{ minLength: 3, maxLength: 100 }}
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
              value={formData.expense_date ? dayjs(formData.expense_date) : null}
              onChange={(date) => {
                const formatted = date ? dayjs(date).format("YYYY-MM-DD") : "";
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
              <Typography
                variant="body2"
                fontWeight={600}
                color="primary"
                mb={1}
              >
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
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            Save Expense
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(CreateExpenseDialog);
