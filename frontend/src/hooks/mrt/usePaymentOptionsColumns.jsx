import { useMemo } from "react";
import { Chip, Switch, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export const paymentOptionsDefaultSorting = [{ id: "id", desc: true }];

export const usePaymentOptionsColumns = ({ onToggleActive, onDelete }) => {
  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 70,
        sortDescFirst: true,
      },
      {
        accessorKey: "payment_name",
        header: "Payment Name",
        size: 220,
      },
      {
        accessorKey: "is_active",
        header: "Active Status",
        size: 150,
        Cell: ({ row }) => {
          const isActive = Boolean(row.original.is_active ?? row.original.isActive);
          return (
            <Chip
              icon={isActive ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
              label={isActive ? "Active" : "Inactive"}
              color={isActive ? "success" : "default"}
              size="small"
              variant="outlined"
            />
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        Cell: ({ row }) => {
          const isActive = Boolean(row.original.is_active ?? row.original.isActive);
          return (
            <>
              <Tooltip title={isActive ? "Deactivate Payment Option" : "Activate Payment Option"}>
                <Switch
                  size="small"
                  checked={isActive}
                  onChange={() => onToggleActive(row.original)}
                  color="success"
                />
              </Tooltip>
              <Tooltip title="Delete Payment Option">
                <IconButton size="small" color="error" onClick={() => onDelete(row.original)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          );
        },
      },
    ],
    [onToggleActive, onDelete]
  );
};
