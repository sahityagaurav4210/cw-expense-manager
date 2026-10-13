import React, { useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  LinearProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import PriceCheckIcon from "@mui/icons-material/PriceCheck";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import dayjs from "dayjs";

export const debtDefaultSorting = [{ id: "id", desc: true }];

export const useDebtColumns = ({
  onSettle,
  onCopyReminder,
  onWriteOff,
  onDelete,
}) => {
  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 70,
        sortDescFirst: true,
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 130,
        Cell: ({ row }) => {
          const isLent = row.original.type === "LENT";
          return (
            <Chip
              label={isLent ? "Money Lent" : "Money Borrowed"}
              size="small"
              color={isLent ? "success" : "warning"}
              variant="outlined"
              sx={{ fontWeight: 700 }}
            />
          );
        },
      },
      {
        accessorKey: "person_name",
        header: "Person / Entity",
        size: 180,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight={700} color="primary.main">
              {row.original.person_name}
            </Typography>
            {row.original.contact_info && (
              <Typography variant="caption" color="text.secondary" display="block">
                {row.original.contact_info}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        accessorKey: "initial_amount",
        header: "Total Amount (₹)",
        size: 140,
        Cell: ({ row }) => (
          <Typography variant="body2" fontWeight={700}>
            ₹
            {parseFloat(row.original.initial_amount || 0).toLocaleString(
              "en-IN",
              { minimumFractionDigits: 2 }
            )}
          </Typography>
        ),
      },
      {
        accessorKey: "balance_amount",
        header: "Outstanding Balance",
        size: 180,
        Cell: ({ row }) => {
          const initial = parseFloat(row.original.initial_amount || 0);
          const settled = parseFloat(row.original.settled_amount || 0);
          const balance = Math.max(0, initial - settled);
          const percent = initial > 0 ? Math.min(100, Math.round((settled / initial) * 100)) : 0;

          return (
            <Box width="100%" pr={1}>
              <Box display="flex" justifyContent="space-between" mb={0.5}>
                <Typography
                  variant="body2"
                  fontWeight={700}
                  color={balance === 0 ? "text.secondary" : "error.main"}
                >
                  ₹{balance.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {percent}% paid
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={percent}
                color={percent === 100 ? "success" : "primary"}
                sx={{ height: 6, borderRadius: 2 }}
              />
            </Box>
          );
        },
      },
      {
        accessorKey: "due_date",
        header: "Due Date",
        size: 130,
        Cell: ({ row }) => {
          const isOverdue = row.original.is_overdue;
          const dueStr = row.original.due_date
            ? dayjs(row.original.due_date).format("YYYY-MM-DD")
            : "No Due Date";

          return (
            <Box display="flex" alignItems="center" gap={0.5}>
              <Typography
                variant="caption"
                fontWeight={isOverdue ? 700 : 500}
                color={isOverdue ? "error.main" : "text.secondary"}
              >
                {dueStr}
              </Typography>
              {isOverdue && (
                <Tooltip title="Payment is past the expected due date!">
                  <WarningAmberIcon color="error" fontSize="small" />
                </Tooltip>
              )}
            </Box>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 130,
        Cell: ({ row }) => {
          const status = row.original.status;
          let label = "Pending";
          let color = "warning";

          if (status === "PARTIALLY_SETTLED") {
            label = "Partial";
            color = "info";
          } else if (status === "SETTLED") {
            label = "Settled";
            color = "success";
          } else if (status === "WRITTEN_OFF") {
            label = "Written Off";
            color = "error";
          }

          return (
            <Chip
              label={label}
              size="small"
              color={color}
              sx={{ fontWeight: 600 }}
            />
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        Cell: ({ row }) => {
          const isSettledOrClosed =
            row.original.status === "SETTLED" ||
            row.original.status === "WRITTEN_OFF";
          const isLent = row.original.type === "LENT";

          return (
            <Box display="flex" alignItems="center" gap={0.5}>
              {!isSettledOrClosed && (
                <Tooltip
                  title={
                    isLent
                      ? "Record Settlement (Payment Received)"
                      : "Record Repayment"
                  }
                >
                  <IconButton
                    size="small"
                    color="success"
                    onClick={() => onSettle(row.original)}
                  >
                    <PriceCheckIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {isLent && !isSettledOrClosed && (
                <Tooltip title="Copy Friendly Payment Reminder to Clipboard">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => onCopyReminder(row.original)}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {isLent && !isSettledOrClosed && (
                <Tooltip title="Write Off Balance (Log as Bad Debt Expense)">
                  <IconButton
                    size="small"
                    color="warning"
                    onClick={() => onWriteOff(row.original)}
                  >
                    <MoneyOffIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              <Tooltip title="Delete Record">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => onDelete(row.original)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },
    ],
    [onSettle, onCopyReminder, onWriteOff, onDelete]
  );
};
