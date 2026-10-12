import { useMemo } from "react";
import { Chip, Switch, IconButton, Tooltip } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

export const categoryDefaultSorting = [{ id: "id", desc: true }];

export const useCategoryColumns = ({ onToggleActive, onDelete }) => {
  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 70,
        sortDescFirst: true,
      },
      {
        accessorKey: "name",
        header: "Category Name",
        size: 220,
      },
      {
        accessorKey: "active_flag",
        header: "Active Status",
        size: 150,
        Cell: ({ row }) => (
          <Chip
            icon={row.original.active_flag ? <CheckCircleIcon fontSize="small" /> : <CancelIcon fontSize="small" />}
            label={row.original.active_flag ? "Active" : "Inactive"}
            color={row.original.active_flag ? "success" : "default"}
            size="small"
            variant="outlined"
          />
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        Cell: ({ row }) => (
          <>
            <Tooltip title={row.original.active_flag ? "Deactivate Category" : "Activate Category"}>
              <Switch
                size="small"
                checked={Boolean(row.original.active_flag)}
                onChange={() => onToggleActive(row.original)}
                color="success"
              />
            </Tooltip>
            <Tooltip title="Delete Category">
              <IconButton size="small" color="error" onClick={() => onDelete(row.original)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        ),
      },
    ],
    [onToggleActive, onDelete]
  );
};
