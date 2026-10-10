import React from "react";
import { Box, Link, Stack, Typography } from "@mui/material";
import NavbarLogo from "./NavbarLogo";

/**
 * Footer component that displays the application copyright information,
 * creator attribution, and links to Terms & Conditions and Privacy Policy.
 *
 * @param {Object} props - The component props.
 * @param {function(string): void} [props.onNavigate] - Callback function to navigate between different views (e.g., 'terms', 'privacy').
 * @returns {JSX.Element} The rendered Footer component.
 */
const Footer = ({ onNavigate }) => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        p: 1.5,
        textAlign: "center",
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        zIndex: 10,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: "center",
        gap: { xs: 1.5, sm: 1 },
        fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
      }}
    >
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 0.5 }} alignItems="center">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700 }}
        >
          &copy; {currentYear} Gaurav Sahitya || All rights reserved 
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}> ||</Box>
        </Typography>

        <Stack direction="row" spacing={0.5} alignItems="center">
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            Made with ❤️ in
          </Typography>

          <NavbarLogo src="/ind.svg" height={16} hidePadding hideTooltip />
        </Stack>
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          fontFamily: "'Inter', 'Roboto', Arial, sans-serif",
          fontSize: "14px",
        }}
      >
        <Link
          component="button"
          onClick={() => onNavigate && onNavigate("terms")}
          sx={{
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            color: "primary.main",
            verticalAlign: "baseline",
            fontWeight: 600,
          }}
        >
          Terms & Condition
        </Link>

        <Link
          component="button"
          onClick={() => onNavigate && onNavigate("privacy")}
          sx={{
            fontFamily: "inherit",
            fontSize: "inherit",
            textDecoration: "underline",
            color: "primary.main",
            verticalAlign: "baseline",
            fontWeight: 600,
          }}
        >
          Privacy Policy
        </Link>
      </Stack>
    </Box>
  );
};

export default React.memo(Footer);
