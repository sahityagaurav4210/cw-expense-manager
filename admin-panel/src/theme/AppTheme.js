import { createTheme } from "@mui/material";

const AppTheme = (fontSize = 14) =>
  createTheme({
    typography: {
      fontFamily: "'Inter', 'Roboto', 'Arial', sans-serif",
      fontSize: fontSize,
    },
    palette: {
      primary: { main: "#000080", hover: "#000066" },
      secondary: { main: "#737373" },
      background: { default: "#f8fafc", paper: "#ffffff" },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: "6px",
            fontWeight: "bold",
            "&:focus-visible": {
              outline: "3px solid #ff9933",
            },
          },
        },
      },
    },
  });

export default AppTheme;
