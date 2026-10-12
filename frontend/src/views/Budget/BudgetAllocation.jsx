import React from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  useMediaQuery,
} from "@mui/material";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";
import { useBudget } from "../../hooks/useBudget";
import { useBudgetInflow } from "../../hooks/useBudgetInflow";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import ActiveBudgetCard from "../../components/budget/ActiveBudgetCard";
import BudgetHistoryList from "../../components/budget/BudgetHistoryList";
import BudgetInflowDialog from "../../components/dialogs/BudgetInflowDialog";
import useAppCss from "../../hooks/css/useAppCss";

const BudgetAllocation = () => {
  const { GlobalPaperCss } = useAppCss();
  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("sm"));

  // 1. Core Budget Hook
  const {
    activeBudget,
    historicalBudgets,
    fetchBudgets,
    formData,
    setCaptchaId,
    errors,
    confirmDialog,
    setConfirmDialog,
    handleChange,
    handleDateChange,
    requestConfirmation,
    executeSetBudget,
  } = useBudget();

  // 2. Budget Inflow Hook
  const {
    open: inflowDialogOpen,
    selectedBudget: inflowTargetBudget,
    formData: inflowFormData,
    errors: inflowErrors,
    loading: inflowLoading,
    confirmDialog: inflowConfirmDialog,
    setCaptchaId: setInflowCaptchaId,
    handleOpen: handleOpenInflowDialog,
    handleClose: handleCloseInflowDialog,
    handleChange: handleInflowChange,
    handleDateChange: handleInflowDateChange,
    requestConfirmation: handleInflowRequestConfirmation,
    handleCancelConfirmation: handleCancelInflowConfirmation,
    executeConfirmedInflow: handleExecuteInflow,
  } = useBudgetInflow();

  // Prevent entering 'e', 'E', '+', '-' in number field
  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
        {/* Header */}
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Box
            sx={{
              width: isMobile ? 64 : 48,
              height: 48,
              borderRadius: "12px",
              bgcolor: "primary.main",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(0, 0, 128, 0.2)",
            }}
          >
            <AccountBalanceWalletIcon sx={{ fontSize: 28 }} />
          </Box>

          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Budget Allocation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Allocate monthly income budget, validity period & augment with
              received funds
            </Typography>
          </Box>
        </Box>

        {/* Active Month Budget Card (Option A Top-Up Hub) */}
        {activeBudget && (
          <Box mb={3}>
            <ActiveBudgetCard
              budget={activeBudget}
              onAddInflow={handleOpenInflowDialog}
            />
          </Box>
        )}

        <Grid container spacing={3}>
          {/* Form to Allocate Primary Income */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={1}
                color="primary.main"
              >
                {activeBudget
                  ? "Allocate Next Month / Update Income"
                  : "Allocate Monthly Income"}
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Set your primary base monthly income budget for the selected
                date range.
              </Typography>

              <Box component="form" onSubmit={requestConfirmation} noValidate>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      label="Monthly Income Budget Amount (₹) *"
                      type="number"
                      fullWidth
                      required
                      value={formData.amount}
                      onChange={handleChange("amount")}
                      onKeyDown={handleKeyDownNumber}
                      error={Boolean(errors.amount)}
                      helperText={
                        errors.amount ||
                        "Enter base income (numbers only, no scientific notation)"
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

          {/* Past Budget History Records (Locked) */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3, height: "100%" }}>
              <Typography
                variant="h6"
                fontWeight={700}
                mb={1}
                color="primary.main"
              >
                Past Budget History
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Historical budget periods are closed and read-only for reporting
                integrity.
              </Typography>

              <Divider sx={{ mb: 2 }} />

              <BudgetHistoryList budgets={historicalBudgets} />
            </Paper>
          </Grid>
        </Grid>

        {/* Confirmation Dialog for Initial Budget Allocation */}
        <ConfirmationDialog
          open={confirmDialog.open}
          isLoading={confirmDialog.loading}
          heading={confirmDialog.heading}
          text={confirmDialog.text}
          onSuccess={executeSetBudget}
          onCancel={() =>
            setConfirmDialog &&
            setConfirmDialog({
              open: false,
              heading: "",
              text: "",
              loading: false,
            })
          }
        />

        {/* Budget Inflow Dialog (Add received funds to active budget) */}
        {inflowDialogOpen && (
          <BudgetInflowDialog
            open={inflowDialogOpen}
            onClose={handleCloseInflowDialog}
            budget={inflowTargetBudget}
            formData={inflowFormData}
            errors={inflowErrors}
            loading={inflowLoading}
            confirmDialog={inflowConfirmDialog}
            setCaptchaId={setInflowCaptchaId}
            onChange={handleInflowChange}
            onDateChange={handleInflowDateChange}
            onSubmit={handleInflowRequestConfirmation}
            onConfirmSuccess={() => handleExecuteInflow(fetchBudgets)}
            onConfirmCancel={handleCancelInflowConfirmation}
          />
        )}
      </Paper>
    </LocalizationProvider>
  );
};

export default BudgetAllocation;
