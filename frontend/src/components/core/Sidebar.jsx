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
import CategoryIcon from "@mui/icons-material/Category";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import PersonIcon from "@mui/icons-material/Person";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const DRAWER_WIDTH_EXPANDED = 240;
const DRAWER_WIDTH_COLLAPSED = 76;

const Sidebar = ({ open, onClose, onLogout, expandable = false, onExpandChange }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (onExpandChange) {
      onExpandChange(isExpanded);
    }
  }, [isExpanded, onExpandChange]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const currentWidth = expandable && !isExpanded ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH_EXPANDED;

  const navItems = [
    { label: "User Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
    { label: "My Profile", path: "/profile", icon: <PersonIcon /> },
    { label: "Category Management", path: "/categories", icon: <CategoryIcon /> },
    { label: "Budget Allocation", path: "/budget", icon: <AccountBalanceWalletIcon /> },
    { label: "Expense Management", path: "/expenses", icon: <ReceiptLongIcon /> },
  ];

  const drawerContent = (
    <Box display="flex" flexDirection="column" height="100%">
      <Box p={isExpanded ? 2 : 1} display="flex" alignItems="center" justifyContent="center" bgcolor="primary.main" color="#fff" sx={{ transition: "padding 0.3s", position: "relative", minHeight: 68 }}>
        {isExpanded ? (
          <Box display="flex" alignItems="center" gap={1.5} width="100%">
            <Avatar
              src={user?.profile_photo_url ? `http://localhost:5000${user.profile_photo_url}` : undefined}
              sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
            >
              {!user?.profile_photo_url && <AccountCircleIcon />}
            </Avatar>
            <Box overflow="hidden" flexGrow={1}>
              <Typography variant="subtitle2" fontWeight={700} noWrap>
                {user?.name || "CW User"}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap display="block">
                {user?.employment_type || "Salaried"}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Avatar
            src={user?.profile_photo_url ? `http://localhost:5000${user.profile_photo_url}` : undefined}
            sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
          >
            {!user?.profile_photo_url && <AccountCircleIcon />}
          </Avatar>
        )}
        
        {/* Mobile close button overrides expandable */}
        {onClose && !expandable && (
          <IconButton onClick={onClose} sx={{ color: "#fff", position: "absolute", right: 8 }} size="small">
            <ChevronLeftIcon />
          </IconButton>
        )}

        {/* Desktop Expand Toggle at top right of the profile box, seamlessly integrated */}
        {expandable && (
          <IconButton 
            onClick={toggleExpand} 
            sx={{ 
              color: "#fff", 
              position: "absolute", 
              right: isExpanded ? 4 : "auto",
              display: { xs: "none", md: "flex" }
            }} 
            size="small"
          >
            {isExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
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
              <ListItemIcon sx={{ minWidth: isExpanded ? 40 : "auto", color: isSelected ? "#fff" : "primary.main", mr: isExpanded ? 0 : 0, display: "flex", justifyContent: "center" }}>
                {item.icon}
              </ListItemIcon>
              {isExpanded && (
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: "14px", fontWeight: isSelected ? 700 : 500 }}
                  sx={{ whiteSpace: "nowrap" }}
                />
              )}
            </ListItemButton>
          );

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              {!isExpanded ? (
                <Tooltip title={item.label} placement="right">
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

      <Box p={isExpanded ? 1.5 : 1}>
        <Tooltip title={!isExpanded ? "Logout" : ""} placement="right">
          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2,
              justifyContent: isExpanded ? "flex-start" : "center",
              px: isExpanded ? 2 : 0,
              bgcolor: "error.light",
              color: "#fff",
              "&:hover": { bgcolor: "error.main" },
            }}
          >
            <ListItemIcon sx={{ minWidth: isExpanded ? 40 : "auto", color: "#fff", display: "flex", justifyContent: "center" }}>
              <LogoutIcon />
            </ListItemIcon>
            {isExpanded && <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700, fontSize: "14px" }} sx={{ whiteSpace: "nowrap" }} />}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer (Always full width when open) */}
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH_EXPANDED, boxSizing: "border-box" },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Permanent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          width: currentWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": { 
            width: currentWidth, 
            boxSizing: "border-box",
            transition: theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: "hidden",
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
