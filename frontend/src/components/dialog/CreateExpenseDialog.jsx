import React from 'react';
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
  Alert,
} from '@mui/material';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import EditIcon from '@mui/icons-material/Edit';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import CaptchaComponent from '../core/CaptchaComponent';
import PaperComponent from '../core/PaperComponent';
import FileUploaderV2 from '../core/FileUploaderV2';
import AppDialogTitle from '../core/AppDialogTitle';
import OptionCard from '../core/OptionCard';

const PAYMENT_MODES = ['Cash', 'UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Bank Transfer'];

const CreateExpenseDialog = ({
  open,
  onClose,
  isEdit = false,
  editingExpense = null,
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
  const activeCategories = categories.filter((c) => c.active_flag && !c.delete_flag);
  const selectedCategory = activeCategories.find((c) => String(c.id) === String(formData.category_id)) || null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperComponent={PaperComponent}>
      <AppDialogTitle
        title={isEdit ? 'Edit Expense Item' : 'Record Expense Item'}
        onClose={onClose}
        Icon={isEdit ? <EditIcon sx={{ color: 'white' }} /> : <ReceiptLongIcon sx={{ color: 'white' }} />}
      />
      <Box
        component="form"
        onSubmit={onSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <DialogContent dividers sx={{ overflowY: 'auto' }}>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Expense Name */}
            <TextField
              label="Expense Name *"
              type="text"
              fullWidth
              required
              value={formData.name}
              onChange={handleChange('name')}
              error={Boolean(errors.name)}
              helperText={errors.name || '3–100 chars (letters, numbers, (), etc.)'}
              inputProps={{ minLength: 3, maxLength: 100 }}
            />

            {/* Expense Amount */}
            <TextField
              label="Expense Amount (₹) *"
              type="number"
              fullWidth
              required
              value={formData.amount}
              onChange={handleChange('amount')}
              onKeyDown={handleKeyDownNumber}
              error={Boolean(errors.amount)}
              helperText={errors.amount || 'Numbers only, no scientific notation'}
            />

            {/* Payment Mode Selection */}
            <TextField
              select
              label="Payment Mode *"
              fullWidth
              required
              value={formData.payment_mode || 'Cash'}
              onChange={handleChange('payment_mode')}
              error={Boolean(errors.payment_mode)}
              helperText={errors.payment_mode || 'Choose how this expense was paid'}
            >
              {PAYMENT_MODES.map((mode) => (
                <MenuItem key={mode} value={mode}>
                  {mode}
                </MenuItem>
              ))}
            </TextField>

            {/* Credit Card Spend Alert */}
            {formData.payment_mode === 'Credit Card' && (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" display="block">
                  <strong>Credit Card Spend:</strong> This expense does not immediately deduct from your allocated budget
                  cash flow. It accumulates as <strong>pending credit card dues</strong> for next month.
                </Typography>
              </Alert>
            )}

            {/* Credit Card Bill Payment Option Card */}
            <OptionCard
              checked={Boolean(formData.is_cc_payment)}
              onClick={() =>
                handleChange('is_cc_payment')({
                  target: { type: 'checkbox', checked: !formData.is_cc_payment },
                })
              }
              label="This is a Credit Card Bill Payment (Settles pending CC dues)"
              sx={{ width: '100%', py: 1 }}
            />

            {formData.is_cc_payment && (
              <Alert severity="success" sx={{ borderRadius: 2 }}>
                <Typography variant="caption" display="block">
                  <strong>Bill Settlement:</strong> This expense will deduct from your active budget and wipe out all
                  unsettled Credit Card expenses.
                </Typography>
              </Alert>
            )}

            {/* Expense Category (Autocomplete from Master) */}
            <Autocomplete
              options={activeCategories}
              getOptionLabel={(option) => option.name || 'Not Defined'}
              value={selectedCategory}
              onChange={(event, newValue) => {
                handleChange('category_id')({
                  target: { value: newValue ? String(newValue.id) : '' },
                });
              }}
              renderInput={(params) => (
                <TextField {...params} label="Expense Category (Optional)" helperText="Defaults to Not Defined option" />
              )}
            />

            {/* Expense Type (Fixed vs Variable) */}
            <TextField
              select
              label="Expense Type *"
              fullWidth
              required
              value={formData.type}
              onChange={handleChange('type')}
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
                const formatted = date ? dayjs(date).format('YYYY-MM-DD') : '';
                handleChange('expense_date')({
                  target: { value: formatted },
                });
              }}
              slotProps={{
                textField: { fullWidth: true, size: 'small' },
              }}
            />

            {/* Existing bill notice for Edit mode */}
            {isEdit && editingExpense?.bill_url && (
              <Box p={1.5} bgcolor="#f8fafc" borderRadius={2} border="1px solid #e2e8f0">
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">
                  Currently Attached Receipt:
                </Typography>
                <Typography variant="body2" fontWeight={700} color="primary.main">
                  {editingExpense.bill_original_name || 'Existing Receipt File'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Upload a new file below if you wish to replace it.
                </Typography>
              </Box>
            )}

            {/* Bill / Receipt Upload using FileUploaderV2 */}
            <Box>
              <Typography variant="body2" fontWeight={600} color="primary" mb={1}>
                {isEdit && editingExpense?.bill_url
                  ? 'Replace Bill / Receipt (Optional - PDF, JPG, PNG up to 5MB)'
                  : 'Attach Bill / Receipt (Optional - PDF, JPG, PNG up to 5MB)'}
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

            {/* CAPTCHA (Required only for new expense creation) */}
            {!isEdit && (
              <CaptchaComponent
                value={formData.captchaText}
                onChange={handleChange('captchaText')}
                onCaptchaIdChange={setCaptchaId}
                error={Boolean(errors.captchaText)}
                helperText={errors.captchaText}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isEdit ? 'Update Expense' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(CreateExpenseDialog);
