import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  Stack,
  Tooltip,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import EventIcon from "@mui/icons-material/Event";

const BudgetHistoryList = ({ budgets = [] }) => {
  if (!budgets || budgets.length === 0) {
    return (
      <Box p={3} textAlign="center" bgcolor="#f8fafc" borderRadius={2} border="1px dashed #cbd5e1">
        <Typography variant="body2" color="text.secondary">
          No historical budget records found.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ maxHeight: 440, overflowY: "auto", pr: 0.5 }}>
      {budgets.map((b) => {
        const totalAmount = parseFloat(b.amount || 0);
        const inflows = b.inflows || [];
        const totalInflows = inflows.reduce(
          (sum, inf) => sum + parseFloat(inf.amount || 0),
          0
        );

        return (
          <Card
            key={b.id}
            variant="outlined"
            sx={{
              borderRadius: 2.5,
              borderColor: "#e2e8f0",
              bgcolor: "#ffffff",
              transition: "all 0.2s ease",
              "&:hover": { borderColor: "#cbd5e1", bgcolor: "#f8fafc" },
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                flexWrap="wrap"
                gap={1}
                mb={1}
              >
                <Typography variant="h6" fontWeight={700} color="#334155">
                  ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>

                <Tooltip title="Historical budget period closed for reporting integrity" arrow>
                  <Chip
                    icon={<LockOutlinedIcon sx={{ fontSize: 14 }} />}
                    label="Closed Period"
                    size="small"
                    sx={{
                      bgcolor: "#f1f5f9",
                      color: "#64748b",
                      fontWeight: 700,
                      fontSize: "0.72rem",
                    }}
                  />
                </Tooltip>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                <Typography variant="caption" color="text.secondary">
                  Validity: {b.from_date} to {b.to_date}
                </Typography>

                {inflows.length > 0 && (
                  <Typography variant="caption" color="success.main" fontWeight={600}>
                    +{inflows.length} {inflows.length === 1 ? "inflow" : "inflows"} (+₹{totalInflows.toLocaleString("en-IN")})
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};

export default React.memo(BudgetHistoryList);
