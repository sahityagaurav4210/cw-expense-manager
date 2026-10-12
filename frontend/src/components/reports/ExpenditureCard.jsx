import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Stack,
  Divider,
} from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import ReceiptIcon from "@mui/icons-material/Receipt";
import TopDownAnimation from "../animation/TopDownAnimation";
import CountDownAnimation from "../animation/CountDownAnimation";

const ExpenditureCard = ({ item }) => {
  if (!item) return null;

  const {
    monthName,
    totalExpenditure = 0,
    expenseCount = 0,
    isCurrentMonth = false,
    isLastMonth = false,
    categoryBreakdown = [],
    comparison,
  } = item;

  return (
    <Card
      elevation={isCurrentMonth ? 4 : 2}
      sx={{
        borderRadius: 3,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        border: isCurrentMonth ? "2px solid #000080" : "1px solid #e2e8f0",
        transition: "all 0.25s ease-in-out",
        "&:hover": {
          boxShadow: "0 8px 24px rgba(0, 0, 128, 0.12)",
          transform: "translateY(-3px)",
        },
      }}
    >
      {/* Top accent bar */}
      <Box
        sx={{
          height: 6,
          bgcolor: isCurrentMonth
            ? "primary.main"
            : isLastMonth
              ? "#2563eb"
              : "#cbd5e1",
        }}
      />

      <CardContent
        sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        {/* Header row with Month Name & Badge */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={1.5}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <CalendarMonthIcon
              sx={{
                color: isCurrentMonth ? "primary.main" : "text.secondary",
                fontSize: 22,
              }}
            />
            <Typography variant="h6" fontWeight={700} color="text.primary">
              {monthName}
            </Typography>
          </Box>

          {isCurrentMonth && (
            <Chip
              label="Current Month"
              size="small"
              sx={{
                bgcolor: "primary.main",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.72rem",
                height: 24,
              }}
            />
          )}

          {!isCurrentMonth && isLastMonth && (
            <Chip
              label="Last Month"
              size="small"
              sx={{
                bgcolor: "#e0f2fe",
                color: "#0369a1",
                fontWeight: 700,
                fontSize: "0.72rem",
                height: 24,
              }}
            />
          )}
        </Box>

        {/* Amount */}
        <Box my={1}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Total Expenditure
          </Typography>

          <TopDownAnimation
            trigger={totalExpenditure}
            delay={0.25}
            duration={0.85}
          >
            <CountDownAnimation
              value={totalExpenditure}
              prefix="₹"
              decimals={2}
              variant="h3"
              fontWeight={800}
              duration={1}
              color="primary.main"
            />
          </TopDownAnimation>
        </Box>

        {/* Current Month Only Comparison Badge */}
        {isCurrentMonth && comparison && (
          <Box
            sx={{
              p: 1.5,
              mt: 1.5,
              mb: 1.5,
              borderRadius: 2,
              bgcolor: comparison.isHigher
                ? "#fef2f2"
                : comparison.isLower
                  ? "#f0fdf4"
                  : "#f8fafc",
              border: "1px solid",
              borderColor: comparison.isHigher
                ? "#fecaca"
                : comparison.isLower
                  ? "#bbf7d0"
                  : "#e2e8f0",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              {comparison.isHigher ? (
                <TrendingUpIcon sx={{ color: "#dc2626", fontSize: 22 }} />
              ) : comparison.isLower ? (
                <TrendingDownIcon sx={{ color: "#16a34a", fontSize: 22 }} />
              ) : (
                <TrendingFlatIcon sx={{ color: "#64748b", fontSize: 22 }} />
              )}

              <Box flexGrow={1}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  sx={{
                    color: comparison.isHigher
                      ? "#dc2626"
                      : comparison.isLower
                        ? "#16a34a"
                        : "#64748b",
                  }}
                >
                  {comparison.isHigher &&
                    `▲ ${comparison.percentChange}% higher than last month`}
                  {comparison.isLower &&
                    `▼ ${comparison.percentChange}% lower than last month`}
                  {comparison.isEqual && "0% difference from last month"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Last Month: ₹
                  {Number(comparison.previousMonthAmount).toLocaleString(
                    "en-IN",
                    {
                      maximumFractionDigits: 2,
                    },
                  )}
                  &nbsp;•&nbsp;
                  {comparison.isHigher
                    ? "Spent ₹"
                    : comparison.isLower
                      ? "Saved ₹"
                      : "Diff ₹"}
                  {Number(comparison.differenceAmount).toLocaleString("en-IN")}
                </Typography>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Meta items count */}
        <Box display="flex" alignItems="center" gap={0.75} mt={0.5} mb={2}>
          <ReceiptIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          <Typography variant="caption" color="text.secondary" fontWeight={500}>
            {expenseCount}{" "}
            {expenseCount === 1 ? "expense entry" : "expense entries"} recorded
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Category Breakdown Preview */}
        <Box mt={1} flexGrow={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing="0.5px"
          >
            Category Distribution
          </Typography>

          {categoryBreakdown.length === 0 ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ py: 1, fontStyle: "italic" }}
            >
              No categorized expenses for this month.
            </Typography>
          ) : (
            <Stack spacing={1.25} mt={1}>
              {categoryBreakdown.slice(0, 3).map((cat, idx) => (
                <Box key={idx}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={600}
                      color="#334155"
                      noWrap
                    >
                      {cat.category}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color="primary.main"
                    >
                      ₹{cat.amount.toLocaleString("en-IN")} ({cat.percentage}%)
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(100, cat.percentage)}
                    sx={{
                      height: 5,
                      borderRadius: 3,
                      bgcolor: "#f1f5f9",
                      "& .MuiLinearProgress-bar": {
                        bgcolor:
                          idx === 0
                            ? "primary.main"
                            : idx === 1
                              ? "#2563eb"
                              : "#38bdf8",
                      },
                    }}
                  />
                </Box>
              ))}

              {categoryBreakdown.length > 3 && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  align="right"
                  display="block"
                >
                  +{categoryBreakdown.length - 3} more categories
                </Typography>
              )}
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ExpenditureCard);
