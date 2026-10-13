import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useScrollTrigger,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import SessionTimerTypography from "../auth/SessionTimerTypography";

const Header = ({
  sidebarWidth = 240,
  isSidebarExpanded = true,
  onToggleSidebar,
  onToggleMobile,
}) => {
  const [isWindowScrolled, setIsWindowScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      const offset =
        window.pageYOffset || document.documentElement.scrollTop || 0;
      setIsWindowScrolled(offset > 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 0,
  });

  const scrolled = trigger || isWindowScrolled;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="transparent"
      sx={{
        width: { md: `calc(100% - ${sidebarWidth}px)` },
        ml: { md: `${sidebarWidth}px` },
        background: scrolled
          ? "linear-gradient(135deg, rgba(0, 0, 128, 0.38) 0%, rgba(30, 58, 138, 0.28) 50%, rgba(15, 23, 70, 0.34) 100%)"
          : "linear-gradient(135deg, #000080 0%, #1e3a8a 50%, #0f172a 100%)",
        backdropFilter: scrolled ? "blur(16px) saturate(190%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(16px) saturate(190%)" : "none",
        borderBottom: scrolled
          ? "1px solid rgba(255, 255, 255, 0.28)"
          : "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: scrolled
          ? "0 10px 30px 0 rgba(0, 0, 70, 0.22), inset 0 1px 1px 0 rgba(255, 255, 255, 0.38)"
          : "0 2px 10px 0 rgba(0, 0, 60, 0.12)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        transition: (theme) =>
          theme.transitions.create(
            [
              "width",
              "margin",
              "background",
              "backdrop-filter",
              "box-shadow",
              "border-bottom",
            ],
            {
              easing: theme.transitions.easing.easeInOut,
              duration: 250,
            },
          ),
      }}
    >
      <Toolbar sx={{ minHeight: { xs: 56, sm: 64 }, px: { xs: 1.5, sm: 3 } }}>
        {/* Mobile menu toggle */}
        <IconButton
          color="inherit"
          edge="start"
          onClick={onToggleMobile}
          sx={{
            mr: 0.56,
            ml: 0.23,
            display: { md: "none" },
            bgcolor: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            borderRadius: 2,
            "&:hover": {
              bgcolor: "rgba(255, 255, 255, 0.24)",
            },
          }}
          aria-label="Open navigation menu"
        >
          <MenuIcon sx={{ color: "white" }} fontSize="small" />
        </IconButton>

        {/* Heading container with adjacent sidebar toggle arrow on the left */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          sx={{ flexGrow: 1, flexWrap: "wrap", py: 0.5 }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            {/* Desktop Sidebar Toggle Arrow (adjacent to CW Expense Tracker label, left to it) */}
            <IconButton
              color="inherit"
              onClick={onToggleSidebar}
              sx={{
                display: { xs: "none", md: "inline-flex" },
                bgcolor: "rgba(255, 255, 255, 0.12)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: 2,
                p: 0.75,
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: "rgba(255, 255, 255, 0.24)",
                  transform: "scale(1.05)",
                },
              }}
              size="small"
              title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
              aria-label={
                isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"
              }
            >
              {isSidebarExpanded ? (
                <ChevronLeftIcon sx={{ color: "white" }} />
              ) : (
                <ChevronRightIcon sx={{ color: "white" }} />
              )}
            </IconButton>

            <Typography
              variant="h6"
              fontWeight={700}
              noWrap
              sx={{
                fontSize: { xs: "0.95rem", sm: "1.25rem" },
                color: "#ffffff",
                letterSpacing: "0.2px",
                textShadow: "0 2px 4px rgba(0, 0, 0, 0.25)",
              }}
            >
              CW Expense Tracker
            </Typography>
          </Box>

          {/* Session Timer in front of the heading */}
          <SessionTimerTypography
            sx={{
              color: "#ffffff",
              bgcolor: "rgba(255, 255, 255, 0.16)",
              border: "1px solid rgba(255, 255, 255, 0.3)",
              px: { xs: 1, sm: 1.75 },
              py: { xs: 0.4, sm: 0.6 },
              borderRadius: 2.5,
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              display: "inline-flex",
              alignItems: "center",
              boxShadow:
                "0 4px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
              transition: "all 0.2s ease",
              "&:hover": {
                bgcolor: "rgba(255, 255, 255, 0.22)",
                borderColor: "rgba(255, 255, 255, 0.45)",
              },
            }}
          />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default React.memo(Header);
