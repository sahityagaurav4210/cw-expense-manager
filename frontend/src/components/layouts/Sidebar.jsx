import React, { useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Avatar,
  IconButton,
  useTheme,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import CategoryIcon from "@mui/icons-material/Category";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { resolvePhotoUrl } from "../../views/Profile/UserProfile";

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 76;

const Sidebar = ({
  open,
  onClose,
  onLogout,
  isExpanded: controlledExpanded,
  expandable = false,
  onExpandChange,
}) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [internalExpanded, setInternalExpanded] = useState(true);

  const isExpanded =
    controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  const currentWidth =
    expandable && !isExpanded ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

  const navItems = [
    { label: "User Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "Reports", path: "/reports", icon: <AssessmentIcon /> },
    { label: "My Profile", path: "/profile", icon: <PersonIcon /> },
    {
      label: "Category Management",
      path: "/categories",
      icon: <CategoryIcon />,
    },
    {
      label: "Budget Allocation",
      path: "/budget",
      icon: <AccountBalanceWalletIcon />,
    },
    {
      label: "Expense Management",
      path: "/expenses",
      icon: <ReceiptLongIcon />,
    },
  ];

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Box
        p={isExpanded ? 2 : 1}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bgcolor="primary.main"
        color="#fff"
        sx={{ transition: "padding 0.3s", position: "relative", minHeight: 68 }}
      >
        {(() => {
          const photoUrl = resolvePhotoUrl(user?.profile_photo || user?.profile_photo_url);
          return isExpanded ? (
            <Box display="flex" alignItems="center" gap={1.5} width="100%">
              <Avatar
                src={photoUrl || undefined}
                sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
              >
                {!photoUrl && <AccountCircleIcon />}
              </Avatar>

              <Box overflow="hidden" flexGrow={1}>
                <Typography variant="subtitle2" fontWeight={700} noWrap>
                  {user?.name || "CW User"}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ opacity: 0.8 }}
                  noWrap
                  display="block"
                >
                  {user?.employment_type || "Salaried"}
                </Typography>
              </Box>
            </Box>
          ) : (
            <Avatar
              src={photoUrl || undefined}
              sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
            >
              {!photoUrl && <AccountCircleIcon />}
            </Avatar>
          );
        })()}

        {/* Mobile close button overrides expandable */}
        {onClose && !expandable && (
          <IconButton
            onClick={onClose}
            sx={{ color: "#fff", position: "absolute", right: 8 }}
            size="small"
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, py: 1 }}>
        {navItems.map((item) => {
          const isSelected = location.pathname === item.path;
          const buttonContent = (
            <ListItemButton
              selected={isSelected}
              onClick={() => {
                navigate(item.path);
                if (onClose) onClose();
              }}
              sx={{
                mx: isExpanded ? 1 : 0.5,
                px: isExpanded ? 2 : 0,
                justifyContent: isExpanded ? "flex-start" : "center",
                borderRadius: 2,
                "&.Mui-selected": {
                  bgcolor: "primary.main",
                  color: "#fff",
                  "& .MuiListItemIcon-root": { color: "#fff" },
                  "&:hover": { bgcolor: "primary.hover" },
                },
                transition: "margin 0.3s, padding 0.3s",
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: isExpanded ? 40 : "auto",
                  color: isSelected ? "#fff" : "primary.main",
                  justifyContent: "center",
                }}
              >
                {item.icon}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? 600 : 500,
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.path} disablePadding sx={{ display: "block", mb: 0.5 }}>
              {!isExpanded ? (
                <Tooltip title={item.label} placement="right" arrow>
                  {buttonContent}
                </Tooltip>
              ) : (
                buttonContent
              )}
            </ListItem>
          );
        })}
      </List>

      <Divider />

      <Box p={isExpanded ? 2 : 1} textAlign="center">
        {isExpanded ? (
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2,
              color: "error.main",
              "&:hover": { bgcolor: "error.light", color: "error.contrastText" },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
            />
          </ListItemButton>
        ) : (
          <Tooltip title="Logout" placement="right" arrow>
            <IconButton onClick={onLogout} color="error" size="small">
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: DRAWER_WIDTH_EXPANDED,
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Persistent / Responsive Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: currentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: currentWidth,
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
            borderRight: "1px solid rgba(0, 0, 0, 0.12)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default React.memo(Sidebar);
