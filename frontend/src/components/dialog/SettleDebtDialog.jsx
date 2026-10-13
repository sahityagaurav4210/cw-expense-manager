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
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip,
} from "@mui/material";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import CaptchaComponent from "../core/CaptchaComponent";
import PaperComponent from "../core/PaperComponent";
import AppDialogTitle from "../core/AppDialogTitle";

const SettleDebtDialog = ({
  open,
  onClose,
  debt,
  formData,
  errors = {},
  setCaptchaId,
  handleChange,
  onSubmit,
}) => {
  if (!debt) return null;

  const isLent = debt.type === "LENT";
  const initial = parseFloat(debt.initial_amount || 0);
  const settled = parseFloat(debt.settled_amount || 0);
  const balance = Math.max(0, initial - settled);
  const settlements = debt.settlements || [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title={
          isLent
            ? `Record Recovery - ${debt.person_name}`
            : `Record Repayment - ${debt.person_name}`
        }
        onClose={onClose}
        Icon={<PriceCheckIcon sx={{ color: "white" }} />}
      />
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* Summary Banner */}
            <Box
              p={2}
              borderRadius={2}
              bgcolor="#f8fafc"
              border="1px solid #cbd5e1"
              display="flex"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1.5}
            >
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Total {isLent ? "Lent" : "Borrowed"}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700}>
                  ₹{initial.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Settled So Far
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="success.main"
                >
                  ₹{settled.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Remaining Balance
                </Typography>
                <Typography
                  variant="subtitle1"
                  fontWeight={700}
                  color="error.main"
                >
                  ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Box>

            {/* Previous Settlements History */}
            {settlements.length > 0 && (
              <Box>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="primary.main"
                  display="block"
                  mb={1}
                >
                  Previous Installments ({settlements.length})
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mode</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {settlements.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>
                          {s.settlement_date
                            ? dayjs(s.settlement_date).format("YYYY-MM-DD")
                            : "-"}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>
                          ₹
                          {parseFloat(s.amount || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={s.payment_mode || "UPI"}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{s.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Divider sx={{ mt: 1.5 }} />
              </Box>
            )}

            {/* Settlement Amount */}
            <TextField
              label={
                isLent
                  ? "Amount Received Now (₹) *"
                  : "Amount Repaid Now (₹) *"
              }
              type="number"
              fullWidth
              required
              value={formData.amount}
              onChange={handleChange("amount")}
              error={Boolean(errors.amount)}
              helperText={
                errors.amount ||
                `Enter partial or full amount (Max: ₹${balance.toLocaleString(
                  "en-IN",
                  { minimumFractionDigits: 2 }
                )})`
              }
            />

            {/* Payment Mode & Date */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
              gap={2}
            >
              <TextField
                select
                label="Payment Mode *"
                fullWidth
                size="small"
                required
                value={formData.payment_mode}
                onChange={handleChange("payment_mode")}
                error={Boolean(errors.payment_mode)}
                helperText={errors.payment_mode}
              >
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>

              <DatePicker
                label="Settlement Date *"
                format="YYYY-MM-DD"
                value={
                  formData.settlement_date
                    ? dayjs(formData.settlement_date)
                    : null
                }
                onChange={(date) => {
                  const formatted = date
                    ? dayjs(date).format("YYYY-MM-DD")
                    : "";
                  handleChange("settlement_date")({
                    target: { value: formatted },
                  });
                }}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />
            </Box>

            {/* Notes */}
            <TextField
              label="Settlement Notes (Optional)"
              type="text"
              fullWidth
              size="small"
              value={formData.notes}
              onChange={handleChange("notes")}
              inputProps={{ maxLength: 255 }}
            />

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
          <Button type="submit" variant="contained" color="success">
            Record Settlement
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(SettleDebtDialog);
