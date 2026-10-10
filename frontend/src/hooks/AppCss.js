import { useTheme } from "@mui/material";

export default function useAppCss() {
  const theme = useTheme();

  return {
    GlobalDialogDividerCss: {
      py: 2,
      borderTop: `1px solid ${theme.palette.divider}`,
      borderBottom: `1px solid ${theme.palette.divider}`,
    },
  };
}
