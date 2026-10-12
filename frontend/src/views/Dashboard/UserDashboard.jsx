import React from "react";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SavingsIcon from "@mui/icons-material/Savings";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PieChartIcon from "@mui/icons-material/PieChart";
import dayjs from "dayjs";
import { useDashboard } from "../../hooks/useDashboard";
import PDFViewer from "../../components/core/PDFViewer";
import PaperComponent from "../../components/core/PaperComponent";
import AppDialogTitle from "../../components/core/AppDialogTitle";
import useAppCss from "../../hooks/css/useAppCss";
import TopDownAnimation from "../../components/animation/TopDownAnimation";

const UserDashboard = () => {
  const theme = useTheme();
  const { GlobalPaperCss } = useAppCss();
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
        my={2}
        rowGap={1}
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

      {/* Metrics Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {/* Monthly Income Budget */}
        <Grid item xs={12} sm={4}>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, borderLeft: "6px solid #2196f3" }}
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
                <AccountBalanceWalletIcon color="info" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Incurred Expense */}
        <Grid item xs={12} sm={4}>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, borderLeft: "6px solid #b91c1c" }}
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
        <Grid item xs={12} sm={4}>
          <Card
            elevation={3}
            sx={{ borderRadius: 3, borderLeft: "6px solid #228B22" }}
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
      </Grid>

      {/* Budget Consumption Bar */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={1}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            Monthly Budget Utilization Ratio
          </Typography>
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
