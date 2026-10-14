import React, { useState } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  LinearProgress,
  TextField,
  Button,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SavingsIcon from "@mui/icons-material/Savings";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PieChartIcon from "@mui/icons-material/PieChart";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import BarChartIcon from "@mui/icons-material/BarChart";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useDashboard } from "../../hooks/useDashboard";
import PDFViewer from "../../components/core/PDFViewer";
import PaperComponent from "../../components/core/PaperComponent";
import AppDialogTitle from "../../components/core/AppDialogTitle";
import useAppCss from "../../hooks/css/useAppCss";
import TopDownAnimation from "../../components/animation/TopDownAnimation";
import { Wallet } from "@mui/icons-material";
import DashboardGraphView from "../../components/dashboard/DashboardGraphView";

const UserDashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { GlobalPaperCss } = useAppCss();
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem("cw_dashboard_view_mode") || "cards";
  });

  const handleViewModeChange = (e, nextMode) => {
    if (nextMode !== null) {
      setViewMode(nextMode);
      localStorage.setItem("cw_dashboard_view_mode", nextMode);
    }
  };
  const {
    selectedMonth,
    metrics,
    pdfModalOpen,
    handleMonthChange,
    handleOpenPdfModal,
    handleClosePdfModal,
  } = useDashboard();

  const monthlyIncome = metrics?.monthlyIncome || 0;
  const totalExpense = metrics?.totalExpenseIncurred || 0;
  const moneyLeft =
    metrics?.amountofMoneyLeft !== undefined
      ? metrics.amountofMoneyLeft
      : metrics?.amountMoneyLeft || 0;
  const categoryBreakdown = metrics?.categoryBreakdown || [];

  const pendingReceivables =
    metrics?.pendingReceivables !== undefined
      ? metrics.pendingReceivables
      : metrics?.debtsSummary?.totalPendingReceivable || 0;
  const pendingPayables =
    metrics?.pendingPayables !== undefined
      ? metrics.pendingPayables
      : metrics?.debtsSummary?.totalPendingPayable || 0;
  const overdueCount = metrics?.debtsSummary?.overdueReceivablesCount || 0;

  const totalLent = metrics?.debtsSummary?.totalLent || 0;
  const totalRecovered = metrics?.debtsSummary?.totalRecovered || 0;
  const totalBorrowed = metrics?.debtsSummary?.totalBorrowed || 0;
  const totalRepaid = metrics?.debtsSummary?.totalRepaid || 0;
  const debtRecoveryPercent =
    totalLent > 0
      ? Math.min(100, Math.round((totalRecovered / totalLent) * 100))
      : 0;
  const borrowedRepaidPercent =
    totalBorrowed > 0
      ? Math.min(100, Math.round((totalRepaid / totalBorrowed) * 100))
      : 0;

  const budgetUsagePercent =
    monthlyIncome > 0
      ? Math.min(100, Math.round((totalExpense / monthlyIncome) * 100))
      : 0;

  const htmlReport = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Monthly Financial Report - ${selectedMonth}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
        .header { text-align: center; border-bottom: 3px solid #1976d2; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #1976d2; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
        .header p { margin: 5px 0 0; color: #666; font-size: 14px; }
        .summary-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 5px solid #1976d2; }
        .summary-box h2 { margin-top: 0; font-size: 20px; color: #1976d2; }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px dashed #ccc; padding-bottom: 8px; }
        .stat-label { font-weight: bold; color: #555; }
        .stat-value { font-weight: bold; color: #111; }
        .value-green { color: #2e7d32; }
        .value-red { color: #d32f2f; }
        .value-purple { color: #7c3aed; }
        .value-orange { color: #ea580c; }
        .category-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        .category-table th { background: #1976d2; color: white; padding: 12px; text-align: left; }
        .category-table td { padding: 12px; border-bottom: 1px solid #ddd; }
        .category-table tr:nth-child(even) { background-color: #f9f9f9; }
        .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>CW Expense Tracker</h1>
        <p>Monthly Financial Report - <strong>${selectedMonth}</strong></p>
        <p>Generated Date: ${dayjs().format("YYYY-MM-DD HH:mm")}</p>
      </div>

      <div class="summary-box">
        <h2>Financial Summary</h2>
        <div class="stat-row">
          <span class="stat-label">Monthly Income Allocated:</span>
          <span class="stat-value">₹${monthlyIncome.toLocaleString("en-IN")}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total Incurred Expense:</span>
          <span class="stat-value value-red">₹${totalExpense.toLocaleString("en-IN")}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Remaining Money Left:</span>
          <span class="stat-value value-green">₹${moneyLeft.toLocaleString("en-IN")}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pending Receivables (Money Lent):</span>
          <span class="stat-value value-purple">₹${pendingReceivables.toLocaleString("en-IN")}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Pending Payables (Money Borrowed):</span>
          <span class="stat-value value-orange">₹${pendingPayables.toLocaleString("en-IN")}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Money Lent Recovery Rate:</span>
          <span class="stat-value value-purple">${debtRecoveryPercent}% (₹${totalRecovered.toLocaleString("en-IN")} of ₹${totalLent.toLocaleString("en-IN")})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Money Borrowed Repayment Rate:</span>
          <span class="stat-value value-orange">${borrowedRepaidPercent}% (₹${totalRepaid.toLocaleString("en-IN")} of ₹${totalBorrowed.toLocaleString("en-IN")})</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Budget Consumption Rate:</span>
          <span class="stat-value ${budgetUsagePercent > 90 ? "value-red" : "value-green"}">${budgetUsagePercent}%</span>
        </div>
      </div>

      <h2>Category Breakdown</h2>
      <table class="category-table">
        <thead>
          <tr>
            <th>Category Name</th>
            <th>Amount Spent (₹)</th>
            <th>% of Total</th>
          </tr>
        </thead>
        <tbody>
          ${
            categoryBreakdown.length > 0
              ? categoryBreakdown
                  .map(
                    (c) => `
              <tr>
                <td><strong>${c.category}</strong></td>
                <td>₹${c.amount.toLocaleString("en-IN")}</td>
                <td>${c.percentage}%</td>
              </tr>
            `,
                  )
                  .join("")
              : '<tr><td colspan="3" style="text-align: center;">No expenses recorded</td></tr>'
          }
        </tbody>
      </table>

      <div class="footer">
        Confidential Report • Generated by CW Expense Tracker
      </div>
    </body>
    </html>
  `;

  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      <Box display="flex" alignItems="center" gap={1.5}>
        <DashboardIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            User Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly expenses, income budget, and category analytics
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        justifyContent="flex-end"
        my={isMobile ? 2 : 0}
        rowGap={isMobile ? 1 : 0}
      >
        <TextField
          type="month"
          label="Select Month"
          size="small"
          value={selectedMonth}
          onChange={handleMonthChange}
          fullWidth={isMobile}
          InputLabelProps={{ shrink: true }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<PictureAsPdfIcon />}
          onClick={handleOpenPdfModal}
          sx={{ fontWeight: 700, textTransform: "none" }}
        >
          Export PDF Report
        </Button>
      </Stack>

      {/* Dashboard View Switcher - Hidden on smaller/mobile devices */}
      {!isMobile && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          my={1}
          sx={{ display: { xs: "none", md: "flex" } }}
        >
          <Typography
            variant="body2"
            fontWeight={600}
            color="text.secondary"
            sx={{ pl: 1 }}
          >
            Dashboard View:
          </Typography>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={handleViewModeChange}
            size="small"
            sx={{
              bgcolor: "#f1f5f9",
              borderRadius: 2,
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                px: 2,
                py: 0.6,
                border: "none",
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "#ffffff",
                  "&:hover": { bgcolor: "primary.dark" },
                },
              },
            }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <ViewModuleIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Cards View
            </ToggleButton>
            <ToggleButton value="graph" aria-label="graph view">
              <BarChartIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Graph View
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      )}

      {/* Conditionally Render: Graph View OR Existing Cards View (Graph View totally hidden on smaller/mobile devices) */}
      {!isMobile && viewMode === "graph" ? (
        <DashboardGraphView metrics={metrics} selectedMonth={selectedMonth} />
      ) : (
        <>
          {/* Metrics Summary Cards */}
          <Grid container spacing={2.5} mb={3}>
            {/* Monthly Income Budget */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  borderLeft: "6px solid #2196f3",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Allocated Monthly Income
                      </Typography>
                      <TopDownAnimation trigger={monthlyIncome} delay={0.05}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color="primary.main"
                          mt={0.5}
                        >
                          ₹{monthlyIncome.toLocaleString("en-IN")}
                        </Typography>
                      </TopDownAnimation>
                    </Box>
                    <AccountBalanceWalletIcon
                      color="info"
                      sx={{ fontSize: 40 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Total Incurred Expense */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  borderLeft: "6px solid #b91c1c",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Total Incurred Expense
                      </Typography>
                      <TopDownAnimation trigger={totalExpense} delay={0.15}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color="error.main"
                          mt={0.5}
                        >
                          ₹{totalExpense.toLocaleString("en-IN")}
                        </Typography>
                      </TopDownAnimation>
                    </Box>
                    <ShoppingCartIcon color="error" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Remaining Money Left */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                elevation={3}
                sx={{
                  borderRadius: 3,
                  borderLeft: "6px solid #228B22",
                  height: "100%",
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                      >
                        Amount of Money Left
                      </Typography>
                      <TopDownAnimation trigger={moneyLeft} delay={0.25}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          color="success.main"
                          mt={0.5}
                        >
                          ₹{moneyLeft.toLocaleString("en-IN")}
                        </Typography>
                      </TopDownAnimation>
                    </Box>
                    <SavingsIcon color="success" sx={{ fontSize: 40 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Receivables (Debts) */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                elevation={3}
                onClick={() => navigate("/debts")}
                sx={{
                  borderRadius: 3,
                  borderLeft: "6px solid #7c3aed",
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.2)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box overflow="hidden" pr={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        noWrap
                        display="block"
                      >
                        Pending Receivables (Lent)
                      </Typography>
                      <TopDownAnimation
                        trigger={pendingReceivables}
                        delay={0.35}
                      >
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{ color: "#7c3aed" }}
                          mt={0.5}
                          noWrap
                        >
                          ₹{pendingReceivables.toLocaleString("en-IN")}
                        </Typography>
                      </TopDownAnimation>
                      {overdueCount > 0 ? (
                        <Typography
                          variant="caption"
                          color="error.main"
                          fontWeight={700}
                          display="block"
                          mt={0.5}
                        >
                          ⚠️ {overdueCount} Overdue
                        </Typography>
                      ) : totalLent > 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={0.5}
                          noWrap
                        >
                          Total Lent: ₹{totalLent.toLocaleString("en-IN")}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={0.5}
                        >
                          Click to manage
                        </Typography>
                      )}
                    </Box>
                    <HandshakeIcon
                      sx={{ color: "#7c3aed", fontSize: 40, flexShrink: 0 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Pending Payables (Borrowed) */}
            <Grid item xs={12} sm={6} md={4} lg={2.4}>
              <Card
                elevation={3}
                onClick={() => navigate("/debts")}
                sx={{
                  borderRadius: 3,
                  borderLeft: "6px solid #ea580c",
                  height: "100%",
                  cursor: "pointer",
                  transition: "transform 0.2s, box-shadow 0.2s",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: "0 6px 20px rgba(234, 88, 12, 0.2)",
                  },
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box overflow="hidden" pr={1}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        fontWeight={600}
                        noWrap
                        display="block"
                      >
                        Pending Payables (Borrowed)
                      </Typography>
                      <TopDownAnimation trigger={pendingPayables} delay={0.45}>
                        <Typography
                          variant="h4"
                          fontWeight={700}
                          sx={{ color: "#ea580c" }}
                          mt={0.5}
                          noWrap
                        >
                          ₹{pendingPayables.toLocaleString("en-IN")}
                        </Typography>
                      </TopDownAnimation>
                      {totalBorrowed > 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={0.5}
                          noWrap
                        >
                          Total Borrowed: ₹
                          {totalBorrowed.toLocaleString("en-IN")}
                        </Typography>
                      ) : (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          mt={0.5}
                        >
                          Click to manage
                        </Typography>
                      )}
                    </Box>
                    <AccountBalanceWalletIcon
                      sx={{ color: "#ea580c", fontSize: 40, flexShrink: 0 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Budget Consumption Bar */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={1}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <Wallet fontSize="small" sx={{ color: "#7c3aed" }} />

                <Typography variant="subtitle1" fontWeight={700}>
                  Monthly Budget Utilization Ratio
                </Typography>
              </Stack>

              <Typography
                variant="subtitle2"
                fontWeight={700}
                color={budgetUsagePercent > 90 ? "error.main" : "primary.main"}
              >
                {budgetUsagePercent}% Utilized
              </Typography>
            </Box>

            <LinearProgress
              variant="determinate"
              value={budgetUsagePercent}
              color={
                budgetUsagePercent > 90
                  ? "error"
                  : budgetUsagePercent > 70
                    ? "warning"
                    : "success"
              }
              sx={{ height: 12, borderRadius: 6 }}
            />
          </Paper>

          {/* Debts & Receivables Recovery / Consumption Bar */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1}
              mb={2.5}
            >
              <Box display="flex" alignItems="center" gap={1}>
                <HandshakeIcon sx={{ color: "#7c3aed", fontSize: 26 }} />
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Debts &amp; Receivables Overview
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Track recovery of lent money and repayment of borrowed money
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* 1. Money Lent (Receivables Recovery) Progress Bar */}
            <Box mb={3}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mb={1}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <HandshakeIcon sx={{ color: "#7c3aed", fontSize: 18 }} />
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: "#7c3aed" }}
                  >
                    Money Lent (Recovery Ratio)
                  </Typography>
                </Stack>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{
                    color:
                      debtRecoveryPercent === 100
                        ? "success.main"
                        : debtRecoveryPercent > 50
                          ? "#7c3aed"
                          : "warning.main",
                  }}
                >
                  {totalLent > 0
                    ? `${debtRecoveryPercent}% Recovered`
                    : "0% (No active loans lent)"}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={debtRecoveryPercent}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: "#ede9fe",
                  "& .MuiLinearProgress-bar": {
                    bgcolor:
                      debtRecoveryPercent === 100
                        ? "#16a34a"
                        : debtRecoveryPercent > 50
                          ? "#7c3aed"
                          : "#d97706",
                    borderRadius: 6,
                  },
                }}
              />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mt={1}
              >
                <Typography variant="caption" color="text.secondary">
                  <strong>Recovered:</strong> ₹
                  {totalRecovered.toLocaleString("en-IN")} |{" "}
                  <strong>Pending to Collect:</strong> ₹
                  {pendingReceivables.toLocaleString("en-IN")} |{" "}
                  <strong>Total Lent:</strong> ₹
                  {totalLent.toLocaleString("en-IN")}
                </Typography>
                {overdueCount > 0 && (
                  <Typography
                    variant="caption"
                    color="error.main"
                    fontWeight={700}
                  >
                    ⚠️ {overdueCount} Overdue
                  </Typography>
                )}
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 2. Money Borrowed (Payables Repayment) Progress Bar */}
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mb={1}
              >
                <Stack direction="row" spacing={1} alignItems="center">
                  <AccountBalanceWalletIcon
                    sx={{ color: "#ea580c", fontSize: 18 }}
                  />
                  <Typography
                    variant="body2"
                    fontWeight={700}
                    sx={{ color: "#ea580c" }}
                  >
                    Money Borrowed (Repayment Ratio)
                  </Typography>
                </Stack>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  sx={{
                    color:
                      borrowedRepaidPercent === 100
                        ? "success.main"
                        : borrowedRepaidPercent > 50
                          ? "#ea580c"
                          : "warning.main",
                  }}
                >
                  {totalBorrowed > 0
                    ? `${borrowedRepaidPercent}% Repaid`
                    : "0% (No borrowed debts)"}
                </Typography>
              </Box>

              <LinearProgress
                variant="determinate"
                value={borrowedRepaidPercent}
                sx={{
                  height: 12,
                  borderRadius: 6,
                  bgcolor: "#ffedd5",
                  "& .MuiLinearProgress-bar": {
                    bgcolor:
                      borrowedRepaidPercent === 100
                        ? "#16a34a"
                        : borrowedRepaidPercent > 50
                          ? "#ea580c"
                          : "#d97706",
                    borderRadius: 6,
                  },
                }}
              />

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mt={1}
              >
                <Typography variant="caption" color="text.secondary">
                  <strong>Repaid:</strong> ₹
                  {totalRepaid.toLocaleString("en-IN")} |{" "}
                  <strong>Pending to Repay:</strong> ₹
                  {pendingPayables.toLocaleString("en-IN")} |{" "}
                  <strong>Total Borrowed:</strong> ₹
                  {totalBorrowed.toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Expense Incurred by Category Breakdown */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <PieChartIcon color="primary" />
              <Typography variant="h6" fontWeight={700} color="primary.main">
                Expense Incurred by Category
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            {categoryBreakdown.length === 0 ? (
              <Typography color="text.secondary" py={2}>
                No category expenses recorded for {selectedMonth}.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {categoryBreakdown.map((cat, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Box
                      p={2}
                      border="1px solid gainsboro"
                      borderRadius={2}
                      bgcolor="background.paper"
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          {cat.category}
                        </Typography>
                        <Typography
                          variant="subtitle2"
                          fontWeight={700}
                          color="primary.main"
                        >
                          ₹{cat.amount.toLocaleString("en-IN")}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {cat.percentage}% of total expenses
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={cat.percentage}
                        sx={{ height: 6, borderRadius: 3, mt: 1 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}

      {/* PDF Export Modal */}
      <Dialog
        open={pdfModalOpen}
        onClose={handleClosePdfModal}
        maxWidth="md"
        fullWidth
        PaperComponent={PaperComponent}
      >
        <AppDialogTitle
          title="Monthly Financial Report Preview"
          onClose={handleClosePdfModal}
          Icon={<PictureAsPdfIcon sx={{ color: "white" }} />}
        />
        <DialogContent dividers>
          <PDFViewer
            pdfData={new Blob([htmlReport], { type: "text/html" })}
            title={`Report-${selectedMonth}`}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={handleClosePdfModal}
            variant="contained"
            color="primary"
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserDashboard;
