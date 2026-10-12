import React from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Button,
  Divider,
  Stack,
  Collapse,
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TopDownAnimation from "../animation/TopDownAnimation";

const ActiveBudgetCard = ({ budget, onAddInflow }) => {
  const [showInflows, setShowInflows] = React.useState(false);

  if (!budget) return null;
  const totalEffectiveAmount = parseFloat(budget?.amount || 0);
  const inflows = budget.inflows || [];
  const totalInflows = inflows.reduce(
    (sum, inf) => sum + parseFloat(inf.amount || 0),
    0,
  );
  const baseIncome = Math.max(0, totalEffectiveAmount - totalInflows);

  return (
    <Card
      elevation={4}
      sx={{
        borderRadius: 3,
        border: "2px solid #000080",
        bgcolor: "#ffffff",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0, 0, 128, 0.12)",
      }}
    >
      {/* Top accent badge */}
      <Box
        sx={{
          bgcolor: "primary.main",
          color: "#ffffff",
          px: 2,
          py: 0.75,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <CheckCircleIcon sx={{ fontSize: 18 }} />
          <Typography variant="caption" fontWeight={700} letterSpacing="0.5px">
            ACTIVE CURRENT MONTH BUDGET
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Period: {budget.from_date} to {budget.to_date}
        </Typography>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Total Effective Budget Headline */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
          flexDirection={{ xs: "column", sm: "row" }}
          gap={2}
          mb={2.5}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              Total Effective Budget (Current Month)
            </Typography>
            <TopDownAnimation trigger={totalEffectiveAmount} sx={{ py: 0.5 }}>
              <Typography
                variant="h3"
                fontWeight={800}
                color="primary.main"
                sx={{
                  letterSpacing: "-0.5px",
                  mt: 0.5,
                }}
              >
                ₹
                {totalEffectiveAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </TopDownAnimation>
          </Box>

          {/* Action button to add inflow / top-up */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => onAddInflow(budget)}
            sx={{
              fontWeight: 700,
              textTransform: "none",
              borderRadius: 2.5,
              px: 2.5,
              py: 1,
              boxShadow: "0 4px 12px rgba(0, 0, 128, 0.2)",
            }}
          >
            Add Inflow / Top-Up
          </Button>
        </Box>

        {/* Breakdown Row: Base Salary + Inflows Received */}
        <Box
          display="flex"
          justifyContent="space-between"
          p={2}
          borderRadius={2}
          bgcolor="#f8fafc"
          border="1px solid #e2e8f0"
          mb={2}
        >
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              Base Monthly Income
            </Typography>
            <Typography variant="h6" fontWeight={700} color="#334155">
              ₹
              {baseIncome.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </Typography>
          </Box>

          <Divider orientation="vertical" flexItem />

          <Box textAlign="right">
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              Additional Inflows Received
            </Typography>
            <Typography variant="h6" fontWeight={700} color="success.main">
              +₹
              {totalInflows.toLocaleString("en-IN", {
                minimumFractionDigits: 2,
              })}
            </Typography>
          </Box>
        </Box>

        {/* Detailed Inflows Accordion */}
        <Box>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ cursor: "pointer", py: 0.5 }}
            onClick={() => setShowInflows(!showInflows)}
          >
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.secondary"
            >
              Received Amounts ({inflows.length})
            </Typography>
            <Button
              size="small"
              endIcon={showInflows ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ textTransform: "none", fontWeight: 600, p: 0 }}
            >
              {showInflows ? "Hide Inflows" : "View Inflows"}
            </Button>
          </Box>

          <Collapse in={showInflows}>
            {inflows.length === 0 ? (
              <Box
                p={2}
                mt={1}
                borderRadius={2}
                bgcolor="#f8fafc"
                border="1px dashed #cbd5e1"
                textAlign="center"
              >
                <Typography variant="caption" color="text.secondary">
                  No extra funds logged yet. If you receive money from someone
                  this month, click "Add Inflow / Top-Up" to augment your
                  budget.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1} mt={1}>
                {inflows.map((inf) => (
                  <Box
                    key={inf.id}
                    p={1.5}
                    borderRadius={2}
                    bgcolor="#f0fdf4"
                    border="1px solid #bbf7d0"
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        fontWeight={700}
                        color="#166534"
                      >
                        {inf.source}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Date: {inf.received_date}{" "}
                        {inf.notes ? `• ${inf.notes}` : ""}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle2"
                      fontWeight={800}
                      color="success.dark"
                    >
                      +₹
                      {parseFloat(inf.amount).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Collapse>
        </Box>
      </CardContent>
    </Card>
  );
};

export default React.memo(ActiveBudgetCard);
