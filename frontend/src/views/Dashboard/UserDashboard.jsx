import React, { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardHeader,
  CardActionArea,
  CardContent,
  LinearProgress,
  TextField,
  Button,
  Stack,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SavingsIcon from "@mui/icons-material/Savings";
import PieChartIcon from "@mui/icons-material/PieChart";
import HandshakeIcon from "@mui/icons-material/Handshake";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import BarChartIcon from "@mui/icons-material/BarChart";
import PaymentsIcon from "@mui/icons-material/Payments";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import CategoryIcon from "@mui/icons-material/Category";
import PaymentIcon from "@mui/icons-material/Payment";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { useDashboard } from "../../hooks/useDashboard";
import useAppCss from "../../hooks/css/useAppCss";
import TopDownAnimation from "../../components/animation/TopDownAnimation";
import { Wallet } from "@mui/icons-material";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import DashboardGraphView from "../../components/dashboard/DashboardGraphView";

const getPaymentModeIcon = (modeName) => {
  const normalized = (modeName || "").toLowerCase();
  if (normalized.includes("credit")) return CreditCardIcon;
  if (normalized.includes("debit")) return CreditCardIcon;
  if (normalized.includes("upi")) return QrCodeScannerIcon;
  if (normalized.includes("net") || normalized.includes("bank")) return AccountBalanceIcon;
  if (normalized.includes("cash")) return PaymentsIcon;
  return PaymentIcon;
};

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
    selectedBudgetId,
    selectedMonth,
    metrics,
    handleBudgetChange,
    handleMonthChange,
  } = useDashboard();

  const monthlyIncome = metrics?.monthlyIncome || 0;
  const totalExpense = metrics?.totalExpenseIncurred || 0;
  const moneyLeft =
    metrics?.amountofMoneyLeft !== undefined
      ? metrics.amountofMoneyLeft
      : metrics?.amountMoneyLeft || 0;
  const categoryBreakdown = metrics?.categoryBreakdown || [];
  const pendingCreditCardDues = metrics?.pendingCreditCardDues || 0;
  const creditCardExpensesTotal = metrics?.creditCardExpensesTotal || 0;

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

  const budgetDateRange = metrics?.budgetDateRange;
  const startDate = budgetDateRange?.from;
  const endDate = budgetDateRange?.to;
  const daysInPeriod = budgetDateRange?.daysInPeriod || 30;
  const isActiveBudget = budgetDateRange?.isActive;
  const periodLabel =
    budgetDateRange?.label ||
    (startDate && endDate ? `${startDate} to ${endDate}` : selectedMonth);
  const availableBudgets = metrics?.availableBudgets || [];

  const paymentModesList = useMemo(() => {
    if (metrics?.paymentModeBreakdown && metrics.paymentModeBreakdown.length > 0) {
      return metrics.paymentModeBreakdown;
    }
    const expensesList = metrics?.expensesList || [];
    const map = {
      Cash: { mode: "Cash", amount: 0, count: 0 },
      UPI: { mode: "UPI", amount: 0, count: 0 },
      "Credit Card": { mode: "Credit Card", amount: 0, count: 0 },
      "Debit Card": { mode: "Debit Card", amount: 0, count: 0 },
      "Net Banking": { mode: "Net Banking", amount: 0, count: 0 },
    };
    let totalAll = 0;
    expensesList.forEach((e) => {
      const mode = (e.payment_mode || "Cash").trim();
      const amt = parseFloat(e.amount) || 0;
      if (!map[mode]) {
        map[mode] = { mode, amount: 0, count: 0 };
      }
      map[mode].amount += amt;
      map[mode].count += 1;
      totalAll += amt;
    });
    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage:
          totalAll > 0
            ? parseFloat(((item.amount / totalAll) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount || b.count - a.count);
  }, [metrics?.paymentModeBreakdown, metrics?.expensesList]);

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
            {startDate && endDate
              ? `Budget Period: ${startDate} to ${endDate} (${daysInPeriod} Days)`
              : "Allocated budget, expenses, and category analytics"}
          </Typography>
        </Box>
      </Box>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="flex-end"
        my={isMobile ? 2 : 1}
      >
        {availableBudgets.length > 0 && (
          <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 320 } }}>
            <InputLabel id="budget-period-select-label">
              Allocated Budget Period
            </InputLabel>
            <Select
              labelId="budget-period-select-label"
              id="budget-period-select"
              value={selectedBudgetId || metrics?.selectedBudget?.id || ""}
              label="Allocated Budget Period"
              onChange={handleBudgetChange}
              sx={{ bgcolor: "#ffffff", borderRadius: 2 }}
            >
              {availableBudgets.map((b) => (
                <MenuItem key={b.id} value={b.id}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    width="100%"
                    gap={1}
                  >
                    <Typography
                      variant="body2"
                      fontWeight={b.isActive ? 700 : 500}
                    >
                      {b.from_date} to {b.to_date}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={0.75}>
                      <Typography variant="caption" color="text.secondary">
                        ₹{b.amount.toLocaleString("en-IN")}
                      </Typography>
                      {b.isActive && (
                        <Chip
                          label="Active"
                          color="success"
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                          }}
                        />
                      )}
                    </Box>
                  </Box>
                </MenuItem>
              ))}
              <MenuItem value="month">
                <Typography
                  variant="body2"
                  color="primary.main"
                  fontWeight={600}
                >
                  📅 Custom Calendar Month...
                </Typography>
              </MenuItem>
            </Select>
          </FormControl>
        )}

        {(selectedBudgetId === "month" || availableBudgets.length === 0) && (
          <TextField
            type="month"
            label="Select Month"
            size="small"
            value={selectedMonth}
            onChange={handleMonthChange}
            fullWidth={isMobile}
            sx={{ minWidth: { sm: 180 } }}
            InputLabelProps={{ shrink: true }}
          />
        )}
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
        <DashboardGraphView metrics={metrics} selectedMonth={periodLabel} />
      ) : (
        <>
          {/* Active / Selected Budget Period Banner */}
          {startDate && endDate && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1.5}
              p={1.5}
              px={2}
              mb={3}
              borderRadius={2.5}
              bgcolor="#f0fdf4"
              border="1px solid #bbf7d0"
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <AccountBalanceWalletIcon color="success" sx={{ fontSize: 28 }} />
                <Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={700} color="#166534">
                      Allocated Budget Period: {startDate} to {endDate}
                    </Typography>
                    {isActiveBudget && (
                      <Chip
                        label="ACTIVE BUDGET"
                        color="success"
                        size="small"
                        sx={{ height: 20, fontSize: "0.68rem", fontWeight: 800 }}
                      />
                    )}
                    <Chip
                      label={`${daysInPeriod} Days`}
                      size="small"
                      variant="outlined"
                      color="success"
                      sx={{ height: 20, fontSize: "0.68rem", fontWeight: 600 }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    All expenses, receipts, and inflows are calculated strictly within this allocated validity period.
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="outlined"
                color="primary"
                onClick={() => navigate("/budget")}
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  borderRadius: 2,
                }}
              >
                Manage Budget
              </Button>
            </Box>
          )}

          {/* Pending Credit Card Dues Banner */}
          {pendingCreditCardDues > 0 && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1.5}
              p={1.5}
              px={2}
              mb={3}
              borderRadius={2.5}
              bgcolor="#fdf4ff"
              border="1px solid #f0abfc"
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <CreditCardIcon sx={{ color: "#c026d3", fontSize: 28 }} />
                <Box>
                  <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <Typography variant="subtitle2" fontWeight={700} color="#86198f">
                      Pending Credit Card Dues: ₹{pendingCreditCardDues.toLocaleString("en-IN")}
                    </Typography>
                    <Chip
                      label="DEFERRED FOR NEXT MONTH"
                      size="small"
                      sx={{
                        bgcolor: "#fae8ff",
                        color: "#86198f",
                        fontWeight: 800,
                        height: 20,
                        fontSize: "0.68rem",
                      }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Credit Card expenses do not take away from your current allocated budget. They will be wiped out when you record a Credit Card Bill Payment.
                  </Typography>
                </Box>
              </Box>

              <Button
                size="small"
                variant="outlined"
                onClick={() => navigate("/expenses")}
                sx={{
                  color: "#86198f",
                  borderColor: "#c026d3",
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  borderRadius: 2,
                  "&:hover": { borderColor: "#a21caf", bgcolor: "#fdf4ff" },
                }}
              >
                View Expenses
              </Button>
            </Box>
          )}

          {/* Metrics Summary Cards - Styled like SettingsView */}
          <Grid container spacing={2.5} mb={3}>
            {/* 1. Monthly Income Budget */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: "primary.main",
                  borderWidth: 1.5,
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate("/budget")}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        Allocated Budget Income
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        {startDate && endDate
                          ? `${startDate} to ${endDate}`
                          : "Allocated Period"}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ position: "relative", pt: 0 }}>
                    <TopDownAnimation trigger={monthlyIncome} delay={0.05}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="primary.main"
                        mb={1}
                      >
                        ₹{monthlyIncome.toLocaleString("en-IN")}
                      </Typography>
                    </TopDownAnimation>

                    <Chip
                      label="Allocated Income"
                      color="primary"
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />

                    <AccountBalanceWalletIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        fontSize: 60,
                        opacity: 0.2,
                        color: (theme) => theme.palette.primary.main,
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* 2. Total Incurred Expense */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: "primary.main",
                  borderWidth: 1.5,
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate("/expenses")}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        Total Incurred Expense
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        {creditCardExpensesTotal > 0
                          ? `+ ₹${creditCardExpensesTotal.toLocaleString("en-IN")} on CC`
                          : "Within allocated period"}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ position: "relative", pt: 0 }}>
                    <TopDownAnimation trigger={totalExpense} delay={0.15}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="error.main"
                        mb={1}
                      >
                        ₹{totalExpense.toLocaleString("en-IN")}
                      </Typography>
                    </TopDownAnimation>

                    <Chip
                      label={`${budgetUsagePercent}% Utilized`}
                      color="error"
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />

                    <ShoppingCartIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        fontSize: 60,
                        opacity: 0.2,
                        color: (theme) => theme.palette.error.main,
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* 3. Remaining Money Left */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: "primary.main",
                  borderWidth: 1.5,
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate("/budget")}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        Amount of Money Left
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary">
                        Out of ₹{monthlyIncome.toLocaleString("en-IN")}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ position: "relative", pt: 0 }}>
                    <TopDownAnimation trigger={moneyLeft} delay={0.25}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        color="success.main"
                        mb={1}
                      >
                        ₹{moneyLeft.toLocaleString("en-IN")}
                      </Typography>
                    </TopDownAnimation>

                    <Chip
                      label={`${Math.max(0, 100 - budgetUsagePercent)}% Remaining`}
                      color="success"
                      size="small"
                      variant="outlined"
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    />

                    <SavingsIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        fontSize: 60,
                        opacity: 0.2,
                        color: (theme) => theme.palette.success.main,
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* 4. Pending Receivables (Debts) */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: "primary.main",
                  borderWidth: 1.5,
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(124, 58, 237, 0.18)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate("/debts")}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        Pending Receivables
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {overdueCount > 0
                          ? `⚠️ ${overdueCount} Overdue`
                          : totalLent > 0
                            ? `Total Lent: ₹${totalLent.toLocaleString("en-IN")}`
                            : "Click to manage"}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ position: "relative", pt: 0 }}>
                    <TopDownAnimation trigger={pendingReceivables} delay={0.35}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{ color: "#7c3aed" }}
                        mb={1}
                      >
                        ₹{pendingReceivables.toLocaleString("en-IN")}
                      </Typography>
                    </TopDownAnimation>

                    <Chip
                      label={`${debtRecoveryPercent}% Recovered`}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#7c3aed",
                        borderColor: "#7c3aed",
                        borderRadius: 2,
                        fontWeight: 600,
                      }}
                    />

                    <HandshakeIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        fontSize: 60,
                        opacity: 0.2,
                        color: "#7c3aed",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>

            {/* 5. Pending Payables (Borrowed) */}
            <Grid item xs={12} sm={6} md={4}>
              <Card
                variant="outlined"
                sx={{
                  height: "100%",
                  borderColor: "primary.main",
                  borderWidth: 1.5,
                  borderRadius: 3,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    boxShadow: "0 6px 20px rgba(234, 88, 12, 0.18)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardActionArea
                  onClick={() => navigate("/debts")}
                  sx={{ height: "100%", p: 1 }}
                >
                  <CardHeader
                    title={
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 700, color: "text.primary" }}
                      >
                        Pending Payables
                      </Typography>
                    }
                    subheader={
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {totalBorrowed > 0
                          ? `Total Borrowed: ₹${totalBorrowed.toLocaleString("en-IN")}`
                          : "Click to manage"}
                      </Typography>
                    }
                  />
                  <CardContent sx={{ position: "relative", pt: 0 }}>
                    <TopDownAnimation trigger={pendingPayables} delay={0.45}>
                      <Typography
                        variant="h4"
                        fontWeight={700}
                        sx={{ color: "#ea580c" }}
                        mb={1}
                      >
                        ₹{pendingPayables.toLocaleString("en-IN")}
                      </Typography>
                    </TopDownAnimation>

                    <Chip
                      label={`${borrowedRepaidPercent}% Repaid`}
                      size="small"
                      variant="outlined"
                      sx={{
                        color: "#ea580c",
                        borderColor: "#ea580c",
                        borderRadius: 2,
                        fontWeight: 600,
                      }}
                    />

                    <AccountBalanceWalletIcon
                      sx={{
                        position: "absolute",
                        bottom: 0,
                        right: -2,
                        fontSize: 60,
                        opacity: 0.2,
                        color: "#ea580c",
                        pointerEvents: "none",
                        zIndex: 2,
                      }}
                    />
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          </Grid>

          {/* Payment Modes Expenditure KPI Cards Section */}
          <Box mb={3}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              gap={1}
              mb={2}
            >
              <Box display="flex" alignItems="center" gap={1.2}>
                <PaymentsIcon color="primary" sx={{ fontSize: 30 }} />
                <Box>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    Payment Modes Summary
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total sum expenditure incurred per payment mode during {periodLabel}
                  </Typography>
                </Box>
              </Box>
              <Chip
                label={`${paymentModesList.length} Payment Modes`}
                color="primary"
                size="small"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              />
            </Box>

            <Grid container spacing={2.5}>
              {paymentModesList.map((mode, idx) => {
                const IconComp = getPaymentModeIcon(mode.mode);
                const isCreditCard = mode.mode === "Credit Card";
                return (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderColor: "primary.main",
                        borderWidth: 1.5,
                        borderRadius: 3,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => navigate("/expenses")}
                        sx={{ height: "100%", p: 1 }}
                      >
                        <CardHeader
                          title={
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700, color: "text.primary" }}
                            >
                              {mode.mode}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="caption" color="text.secondary">
                              {mode.count} transaction{mode.count === 1 ? "" : "s"}
                            </Typography>
                          }
                        />

                        <CardContent sx={{ position: "relative", pt: 0 }}>
                          <TopDownAnimation trigger={mode.amount} delay={0.05 * (idx + 1)}>
                            <Typography
                              variant="h4"
                              fontWeight={700}
                              color="primary.main"
                              mb={1}
                            >
                              ₹{mode.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Typography>
                          </TopDownAnimation>

                          <Box display="flex" alignItems="center" gap={0.75} flexWrap="wrap">
                            <Chip
                              label={`${mode.percentage}% of Spends`}
                              color="primary"
                              size="small"
                              variant="outlined"
                              sx={{ borderRadius: 2, fontWeight: 600 }}
                            />
                            {isCreditCard && pendingCreditCardDues > 0 && (
                              <Chip
                                label={`Pending: ₹${pendingCreditCardDues.toLocaleString("en-IN")}`}
                                color="warning"
                                size="small"
                                sx={{
                                  borderRadius: 2,
                                  fontWeight: 700,
                                  height: 22,
                                  fontSize: "0.68rem",
                                }}
                              />
                            )}
                          </Box>

                          <IconComp
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              right: -2,
                              fontSize: 60,
                              opacity: 0.2,
                              color: (theme) => theme.palette.primary.main,
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          />
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

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
                  Budget Utilization Ratio ({periodLabel})
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
                No category expenses recorded for {periodLabel}.
              </Typography>
            ) : (
              <Grid container spacing={2.5}>
                {categoryBreakdown.map((cat, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <Card
                      variant="outlined"
                      sx={{
                        height: "100%",
                        borderColor: "primary.main",
                        borderWidth: 1.5,
                        borderRadius: 3,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <CardActionArea
                        onClick={() => navigate("/expenses")}
                        sx={{ height: "100%", p: 1 }}
                      >
                        <CardHeader
                          title={
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 700, color: "text.primary" }}
                            >
                              {cat.category}
                            </Typography>
                          }
                          subheader={
                            <Typography variant="caption" color="text.secondary">
                              {cat.percentage}% of total expenses
                            </Typography>
                          }
                        />

                        <CardContent sx={{ position: "relative", pt: 0 }}>
                          <TopDownAnimation trigger={cat.amount} delay={0.05 * (idx + 1)}>
                            <Typography
                              variant="h4"
                              fontWeight={700}
                              color="primary.main"
                              mb={1}
                            >
                              ₹{cat.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </Typography>
                          </TopDownAnimation>

                          <LinearProgress
                            variant="determinate"
                            value={cat.percentage}
                            sx={{ height: 6, borderRadius: 3, mb: 1.5 }}
                          />

                          <Chip
                            label={`${cat.percentage}% of Total`}
                            color="primary"
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                          />

                          <CategoryIcon
                            sx={{
                              position: "absolute",
                              bottom: 0,
                              right: -2,
                              fontSize: 60,
                              opacity: 0.2,
                              color: (theme) => theme.palette.primary.main,
                              pointerEvents: "none",
                              zIndex: 2,
                            }}
                          />
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </>
      )}
    </Paper>
  );
};

export default UserDashboard;
