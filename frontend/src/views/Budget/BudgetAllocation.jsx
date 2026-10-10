import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  Card,
  CardContent,
  Stack,
  Chip,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import EventIcon from "@mui/icons-material/Event";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useBudget } from "../../hooks/useBudget";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import useAppCss from "../../hooks/css/useAppCss";

const BudgetAllocation = () => {
  const { GlobalPaperCss } = useAppCss();
  const {
    budgets,
    formData,
    setCaptchaId,
    errors,
    confirmDialog,
    handleChange,
    handleDateChange,
    requestConfirmation,
    executeSetBudget,
  } = useBudget();

  // Prevent entering 'e', 'E', '+', '-' in number field
  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
        <Box display="flex" alignItems="center" gap={1.5} mb={3}>
          <AccountBalanceWalletIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Budget Allocation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter monthly income budget allocation and validity period
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Form */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={2}
                color="primary.main"
              >
                Allocate Monthly Income
              </Typography>

              <Box component="form" onSubmit={requestConfirmation} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Monthly Income Budget Amount (₹)"
                      type="number"
                      fullWidth
                      required
                      value={formData.amount}
                      onChange={handleChange("amount")}
                      onKeyDown={handleKeyDownNumber}
                      error={Boolean(errors.amount)}
                      helperText={
                        errors.amount ||
                        "Enter total monthly income (numbers only, no scientific notation)"
                      }
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="From Date *"
                      format="YYYY-MM-DD"
                      value={
                        formData.from_date ? dayjs(formData.from_date) : null
                      }
                      onChange={(date) => handleDateChange("from_date", date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: Boolean(errors.from_date),
                          helperText: errors.from_date,
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <DatePicker
                      label="To Date *"
                      format="YYYY-MM-DD"
                      value={formData.to_date ? dayjs(formData.to_date) : null}
                      onChange={(date) => handleDateChange("to_date", date)}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          size: "small",
                          error: Boolean(errors.to_date),
                          helperText: errors.to_date,
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <CaptchaComponent
                      value={formData.captchaText}
                      onChange={handleChange("captchaText")}
                      onCaptchaIdChange={setCaptchaId}
                      error={Boolean(errors.captchaText)}
                      helperText={errors.captchaText}
                    />
                  </Grid>

                  <Grid item xs={12} mt={1}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ fontWeight: 700 }}
                    >
                      Allocate Budget
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Paper>
          </Grid>

          {/* Allocation History */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={2}
                color="primary.main"
              >
                Budget History Records
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {budgets.length === 0 ? (
                <Typography color="text.secondary">
                  No budget allocation records found.
                </Typography>
              ) : (
                <Stack spacing={2} sx={{ maxHeight: 420, overflowY: "auto" }}>
                  {budgets.map((b) => (
                    <Card
                      key={b.id}
                      variant="outlined"
                      sx={{ borderRadius: 2 }}
                    >
                      <CardContent sx={{ p: 1 }}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          flexWrap="wrap"
                        >
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="success.main"
                          >
                            ₹
                            {parseFloat(b.amount).toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </Typography>

                          <Chip
                            icon={<EventIcon fontSize="small" />}
                            label="Monthly Income"
                            size="small"
                            color="primary"
                          />
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={1}
                        >
                          Validity: {b.from_date} to {b.to_date}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Paper>
          </Grid>
        </Grid>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={confirmDialog.open}
          isLoading={confirmDialog.loading}
          heading={confirmDialog.heading}
          text={confirmDialog.text}
          onSuccess={executeSetBudget}
          onCancel={() =>
            confirmDialog.setConfirmDialog &&
            confirmDialog.setConfirmDialog({ open: false })
          }
        />
      </Paper>
    </LocalizationProvider>
  );
};

export default BudgetAllocation;
