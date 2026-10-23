import { useTheme } from "@mui/material";
import { useMemo } from "react";

function useAppCss() {
  const theme = useTheme();

  const GlobalTableCss = useMemo(
    () => ({
      muiTablePaperProps: {
        elevation: 3,
        sx: {
          borderRadius: "8px",
          overflow: "hidden",
          border: `1px solid ${theme.palette.secondary.A100}`,
        },
      },
      muiTableContainerProps: {
        sx: { minHeight: "150px" },
      },
      muiTableHeadCellProps: {
        sx: {
          fontWeight: "bold",
          color: theme.palette.primary.main,
          // width: "max-content",
          whiteSpace: "normal",
          wordBreak: "break-word",
          textAlign: "center",
          borderRight: `1px solid ${theme.palette.secondary.A100}`,
          borderBottom: `1px solid ${theme.palette.secondary.A100}`,
          borderTop: `1px solid ${theme.palette.secondary.A100}`,
        },
      },
      muiTableBodyCellProps: { sx: { color: "gray", fontWeight: 700 } },
      muiPaginationProps: {
        rowsPerPageOptions: [10, 20, 30, 40, 50, 100],
      },
      enableStickyHeader: true,
    }),
    [theme],
  );

  const GlobalPaperCss = useMemo(
    () => ({
      padding: { xs: "1.5rem", md: "2.5rem" },
      borderRadius: "16px",
      width: "100%",
      border: `1px solid ${theme.palette.secondary["50"]}`,
    }),
    [],
  );

  const GlobalDialogTitle = useMemo(
    () => ({
      display: "flex",
      alignItems: "center",
      gap: 1,
      fontWeight: 700,
      bgcolor: "primary.main",
      color: "white",
      py: 2,
    }),
    [],
  );

  const GlobalDialogDividerCss = useMemo(
    () => ({
      py: 2,
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
    }),
    [theme],
  );

  const RequiredFieldCss = useMemo(() => ({
    "& .MuiInputLabel-asterisk": {
      color: "red",
    },
  }));

  return {
    GlobalTableCss,
    GlobalPaperCss,
    GlobalDialogTitle,
    GlobalDialogDividerCss,
    RequiredFieldCss,
  };
}

export default useAppCss;
