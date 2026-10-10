import { useMemo } from "react";
import { Chip, IconButton, Tooltip, Typography } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import dayjs from "dayjs";

export const useExpenseColumns = ({ onDelete }) => {
  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 70,
      },
      {
        accessorKey: "name",
        header: "Expense Name",
        size: 200,
      },
      {
        accessorKey: "amount",
        header: "Amount (₹)",
        size: 130,
        Cell: ({ row }) => (
          <Typography variant="body2" fontWeight={700} color="primary.main">
            ₹{parseFloat(row.original.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Typography>
        ),
      },
      {
        accessorKey: "Category.name",
        header: "Category",
        size: 160,
        Cell: ({ row }) => (
          <Chip
            label={row.original.Category?.name || "Not Defined"}
            size="small"
            color={row.original.Category?.name ? "primary" : "secondary"}
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 130,
        Cell: ({ row }) => (
          <Chip
            label={row.original.type}
            size="small"
            color={row.original.type === "Fixed" ? "warning" : "info"}
          />
        ),
      },
      {
        accessorKey: "expense_date",
        header: "Expense Date",
        size: 140,
        Cell: ({ row }) => (
          <Typography variant="caption">
            {row.original.expense_date ? dayjs(row.original.expense_date).format("YYYY-MM-DD") : "N/A"}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 100,
        Cell: ({ row }) => (
          <Tooltip title="Delete Expense">
            <IconButton size="small" color="error" onClick={() => onDelete(row.original)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ),
      },
    ],
    [onDelete]
  );
};
