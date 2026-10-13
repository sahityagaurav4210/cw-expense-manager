import React from "react";
import {
  Box,
  Typography,
  Stack,
  Divider,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Grid,
  Chip,
  LinearProgress,
} from "@mui/material";
import BarChartIcon from "@mui/icons-material/BarChart";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import TimelineIcon from "@mui/icons-material/Timeline";
import PieChartIcon from "@mui/icons-material/PieChart";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SavingsIcon from "@mui/icons-material/Savings";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CategoryIcon from "@mui/icons-material/Category";
import ExpenditureChart from "../reports/ExpenditureChart";
import { useDashboardGraph } from "../../hooks/useDashboardGraph";

const DashboardGraphView = ({ metrics, selectedMonth }) => {
  const {
    graphType,
    setGraphType,
    metricType,
    setMetricType,
    chartOption,
  } = useDashboardGraph(metrics, selectedMonth);

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

  const budgetUsagePercent =
    monthlyIncome > 0
      ? Math.min(100, Math.round((totalExpense / monthlyIncome) * 100))
      : 0;

  return (
    <Box>
      {/* 1. Quick KPI Summary Pill Row in Graph View */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              borderLeft: "4px solid #2196f3",
              bgcolor: "#f0f9ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Allocated Income
              </Typography>
              <Typography variant="h6" fontWeight={700} color="primary.main">
                ₹{monthlyIncome.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <AccountBalanceWalletIcon color="info" sx={{ fontSize: 28 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              borderLeft: "4px solid #b91c1c",
              bgcolor: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Total Expenses
              </Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">
                ₹{totalExpense.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <ShoppingCartIcon color="error" sx={{ fontSize: 28 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              borderLeft: "4px solid #228B22",
              bgcolor: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Money Left
              </Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">
                ₹{moneyLeft.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <SavingsIcon color="success" sx={{ fontSize: 28 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              borderLeft: "4px solid #7c3aed",
              bgcolor: "#faf5ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Pending Lent
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#7c3aed" }}>
                ₹{pendingReceivables.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <HandshakeIcon sx={{ color: "#7c3aed", fontSize: 28 }} />
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={2.4}>
          <Paper
            elevation={1}
            sx={{
              p: 1.5,
              borderRadius: 2.5,
              borderLeft: "4px solid #ea580c",
              bgcolor: "#fff7ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Pending Borrowed
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: "#ea580c" }}>
                ₹{pendingPayables.toLocaleString("en-IN")}
              </Typography>
            </Box>
            <AccountBalanceWalletIcon sx={{ color: "#ea580c", fontSize: 28 }} />
          </Paper>
        </Grid>
      </Grid>

      {/* 2. Main Graph Card referencing GraphViewDialog */}
      <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, mb: 3 }}>
        {/* Controls Bar: Dimension Selector & Graph Type Toggle */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          gap={2}
          mb={2.5}
        >
          {/* Dimension Selector */}
          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Metric Dimension:
            </Typography>
            <ToggleButtonGroup
              value={metricType}
              exclusive
              onChange={(e, nextMetric) => {
                if (nextMetric !== null) setMetricType(nextMetric);
              }}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  px: 1.5,
                  py: 0.5,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              }}
            >
              <ToggleButton value="category">
                <CategoryIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Category Breakdown
              </ToggleButton>
              <ToggleButton value="cashflow">
                <AccountBalanceWalletIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Cashflow &amp; Budget
              </ToggleButton>
              <ToggleButton value="debts">
                <HandshakeIcon sx={{ fontSize: 16, mr: 0.5 }} />
                Debts &amp; Receivables
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>

          {/* Graph Type Toggles (Direct reference from GraphViewDialog) */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="caption" fontWeight={600} color="text.secondary">
              Graph Type:
            </Typography>
            <ToggleButtonGroup
              value={graphType}
              exclusive
              onChange={(e, nextType) => {
                if (nextType !== null) setGraphType(nextType);
              }}
              size="small"
              sx={{
                bgcolor: "#f1f5f9",
                borderRadius: 2,
                "& .MuiToggleButton-root": {
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  px: 1.5,
                  py: 0.5,
                  border: "none",
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "#ffffff",
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                },
              }}
            >
              <ToggleButton value="bar" aria-label="bar chart">
                <BarChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Bar
              </ToggleButton>
              <ToggleButton value="line" aria-label="line chart">
                <ShowChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Line
              </ToggleButton>
              <ToggleButton value="area" aria-label="area chart">
                <TimelineIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Area
              </ToggleButton>
              <ToggleButton value="pie" aria-label="pie chart">
                <PieChartIcon sx={{ fontSize: 18, mr: 0.5 }} />
                Pie / Donut
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        </Box>

        <Divider sx={{ mb: 2.5 }} />

        {/* ECharts Chart Container */}
        <Box sx={{ width: "100%", height: 440 }}>
          <ExpenditureChart option={chartOption} height={440} />
        </Box>
      </Paper>

      {/* 3. Bottom Contextual Insights Card */}
      {metricType === "category" && categoryBreakdown.length > 0 && (
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
          <Box display="flex" alignItems="center" gap={1} mb={1.5}>
            <PieChartIcon color="primary" />
            <Typography variant="subtitle1" fontWeight={700} color="primary.main">
              Category Distribution Summary ({selectedMonth})
            </Typography>
          </Box>
          <Grid container spacing={2}>
            {categoryBreakdown.map((cat, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Box
                  p={1.5}
                  borderRadius={2}
                  border="1px solid #e2e8f0"
                  bgcolor="#fafafa"
                >
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="body2" fontWeight={700}>
                      {cat.category}
                    </Typography>
                    <Typography variant="body2" fontWeight={700} color="primary.main">
                      ₹{cat.amount.toLocaleString("en-IN")}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {cat.percentage}% of total
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={cat.percentage}
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {metricType === "cashflow" && (
        <Paper elevation={2} sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle1" fontWeight={700} color="primary.main" mb={1}>
            Cashflow Budget Efficiency
          </Typography>
          <Box display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <Typography variant="body2">
              Budget Usage:{" "}
              <strong style={{ color: budgetUsagePercent > 90 ? "#dc2626" : "#16a34a" }}>
                {budgetUsagePercent}%
              </strong>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2">
              Net Savings Remaining:{" "}
              <strong style={{ color: "#16a34a" }}>
                ₹{moneyLeft.toLocaleString("en-IN")}
              </strong>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="body2">
              Net Receivables / Debt Ratio:{" "}
              <strong style={{ color: "#7c3aed" }}>
                ₹{pendingReceivables.toLocaleString("en-IN")} Lent / ₹{pendingPayables.toLocaleString("en-IN")} Borrowed
              </strong>
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default React.memo(DashboardGraphView);
