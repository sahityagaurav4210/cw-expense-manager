import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Avatar,
  Stack,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import PhoneIcon from "@mui/icons-material/Phone";
import EmailIcon from "@mui/icons-material/Email";

export const contactDefaultSorting = [
  { id: "is_favorite", desc: true },
  { id: "name", desc: false },
];

const stringToColor = (string) => {
  if (!string) return "#1976d2";
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = "#";
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getCategoryColor = (category) => {
  switch (category) {
    case "Friend":
      return { bgcolor: "#ede9fe", color: "#6d28d9", border: "1px solid #c4b5fd" };
    case "Family":
      return { bgcolor: "#dcfce7", color: "#15803d", border: "1px solid #86efac" };
    case "Colleague":
      return { bgcolor: "#e0f2fe", color: "#0369a1", border: "1px solid #7dd3fc" };
    case "Business":
      return { bgcolor: "#ffedd5", color: "#c2410c", border: "1px solid #fdba74" };
    case "Client":
      return { bgcolor: "#ccfbf1", color: "#0f766e", border: "1px solid #5eead4" };
    case "Vendor":
      return { bgcolor: "#fce7f3", color: "#be185d", border: "1px solid #f9a8d4" };
    default:
      return { bgcolor: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1" };
  }
};

export const useContactColumns = ({ onEdit, onDelete, onToggleFavorite }) => {
  return useMemo(
    () => [
      {
        accessorKey: "profile_photo",
        header: "Photo",
        size: 70,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => {
          const photoUrl = row.original.profile_photo;
          const name = row.original.name || "";
          const initial = name.trim().charAt(0).toUpperCase() || "?";
          return (
            <Avatar
              src={photoUrl ? `${photoUrl}?t=${Date.now()}` : undefined}
              alt={name}
              sx={{
                width: 40,
                height: 40,
                bgcolor: stringToColor(name),
                fontWeight: 700,
                fontSize: 16,
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              }}
            >
              {!photoUrl && initial}
            </Avatar>
          );
        },
      },
      {
        accessorKey: "name",
        header: "Contact Name",
        size: 200,
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={1}>
            <Tooltip
              title={
                row.original.is_favorite
                  ? "Remove from Favorites"
                  : "Mark as Favorite"
              }
            >
              <IconButton
                size="small"
                onClick={() => onToggleFavorite(row.original.id)}
                sx={{
                  color: row.original.is_favorite ? "#f59e0b" : "action.disabled",
                  p: 0.5,
                }}
              >
                {row.original.is_favorite ? (
                  <StarIcon fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Box>
              <Typography variant="body2" fontWeight={700} color="primary.main">
                {row.original.name}
              </Typography>
              {row.original.notes && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  sx={{
                    maxWidth: 180,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.original.notes}
                </Typography>
              )}
            </Box>
          </Box>
        ),
      },
      {
        accessorKey: "phone",
        header: "Phone Number",
        size: 160,
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={0.8}>
            <PhoneIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              variant="body2"
              component="a"
              href={`tel:${row.original.phone}`}
              sx={{
                color: "text.primary",
                textDecoration: "none",
                fontWeight: 600,
                "&:hover": { color: "primary.main", textDecoration: "underline" },
              }}
            >
              {row.original.phone}
            </Typography>
          </Box>
        ),
      },
      {
        accessorKey: "email",
        header: "Email Address",
        size: 200,
        Cell: ({ row }) =>
          row.original.email ? (
            <Box display="flex" alignItems="center" gap={0.8}>
              <EmailIcon sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography
                variant="body2"
                component="a"
                href={`mailto:${row.original.email}`}
                sx={{
                  color: "text.secondary",
                  textDecoration: "none",
                  "&:hover": { color: "primary.main", textDecoration: "underline" },
                }}
              >
                {row.original.email}
              </Typography>
            </Box>
          ) : (
            <Typography variant="body2" color="text.disabled">
              —
            </Typography>
          ),
      },
      {
        accessorKey: "category",
        header: "Category",
        size: 130,
        Cell: ({ row }) => {
          const category = row.original.category || "Other";
          const style = getCategoryColor(category);
          return (
            <Chip
              label={category}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: "0.75rem",
                ...style,
              }}
            />
          );
        },
      },
      {
        accessorKey: "company",
        header: "Organization / Title",
        size: 180,
        Cell: ({ row }) => {
          const company = row.original.company;
          const title = row.original.job_title;
          if (!company && !title) {
            return (
              <Typography variant="body2" color="text.disabled">
                —
              </Typography>
            );
          }
          return (
            <Box>
              {company && (
                <Typography variant="body2" fontWeight={600}>
                  {company}
                </Typography>
              )}
              {title && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {title}
                </Typography>
              )}
            </Box>
          );
        },
      },
      {
        id: "actions",
        header: "Actions",
        size: 110,
        enableSorting: false,
        enableColumnFilter: false,
        Cell: ({ row }) => (
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Tooltip title="Edit Contact">
              <IconButton
                size="small"
                color="primary"
                onClick={() => onEdit(row.original)}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Contact">
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(row.original)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        ),
      },
    ],
    [onEdit, onDelete, onToggleFavorite]
  );
};
