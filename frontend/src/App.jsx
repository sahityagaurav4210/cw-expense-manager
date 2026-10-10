import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AppTheme from "./theme/AppTheme";
import { UIProvider } from "./context/UIContext";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store";
import { clearAuth } from "./store/authSlice";

// Components & Views
import Footer from "./components/core/Footer";
import Sidebar from "./components/core/Sidebar";
import ConfirmationDialog from "./components/core/ConfirmationDialog";
import Terms from "./components/docs/Terms";
import PrivacyPolicy from "./components/docs/PrivacyPolicy";
import Register from "./views/Auth/Register";
import Login from "./views/Auth/Login";
import CategoryManager from "./views/Category/CategoryManager";
import BudgetAllocation from "./views/Budget/BudgetAllocation";
import ExpenseManager from "./views/Expense/ExpenseManager";
import UserDashboard from "./views/Dashboard/UserDashboard";
import UserProfile from "./views/Profile/UserProfile";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// Default Error Page Component
const ErrorPage = () => {
  const navigate = useNavigate();
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="70vh"
    >
      <Typography variant="h2" fontWeight={700} color="error.main">
        404
      </Typography>
      <Typography variant="h6" color="text.secondary" mb={2}>
        Oops! The page you are looking for does not exist.
      </Typography>
      <button
        style={{
          padding: "10px 20px",
          backgroundColor: "#000080",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
        onClick={() => navigate("/dashboard")}
      >
        Return to Dashboard
      </button>
    </Box>
  );
};

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  const sidebarWidth = isSidebarExpanded ? 240 : 76;

  const handleNavigateDoc = (docType) => {
    if (docType === "terms") navigate("/terms");
    if (docType === "privacy") navigate("/privacy");
  };

  const handleLogoutClick = () => {
    setLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    dispatch(clearAuth());
    setLogoutDialog(false);
    navigate("/login");
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const isDocPage =
    location.pathname === "/terms" || location.pathname === "/privacy";

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh" sx={{ maxWidth: "100vw", overflowX: "hidden" }}>
      {/* Top Navbar */}
      {isAuthenticated && !isDocPage && (
        <AppBar
          position="fixed"
          sx={{
            width: { md: `calc(100% - ${sidebarWidth}px)` },
            ml: { md: `${sidebarWidth}px` },
            bgcolor: "primary.main",
            transition: (theme) => theme.transitions.create(["width", "margin"], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2, display: { md: "none" } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              CW Expense Tracker
            </Typography>
          </Toolbar>
        </AppBar>
      )}

      <Box
        display="flex"
        flexGrow={1}
        pt={isAuthenticated && !isDocPage ? { xs: 7, sm: 8 } : 0}
        sx={{ maxWidth: "100vw" }}
      >
        {/* Sidebar */}
        {isAuthenticated && !isAuthPage && !isDocPage && (
          <Sidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onLogout={handleLogoutClick}
            expandable={true}
            onExpandChange={setIsSidebarExpanded}
          />
        )}

        {/* Main Content Area */}
        <Box
          component="main"
          flexGrow={1}
          display="flex"
          flexDirection="column"
          bgcolor="background.default"
          width={{ xs: "100%", md: `calc(100% - ${sidebarWidth}px)` }}
          sx={{
            maxWidth: { xs: "100vw", md: `calc(100vw - ${sidebarWidth}px)` },
            transition: (theme) => theme.transitions.create("width", {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }}
        >
          <Box flexGrow={1} p={2}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/terms"
              element={<Terms onBack={() => navigate(-1)} />}
            />
            <Route
              path="/privacy"
              element={<PrivacyPolicy onBack={() => navigate(-1)} />}
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories"
              element={
                <ProtectedRoute>
                  <CategoryManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <BudgetAllocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <ExpenseManager />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Default Error Page */}
            <Route path="*" element={<ErrorPage />} />
          </Routes>
          </Box>
          {/* Footer */}
          <Footer onNavigate={handleNavigateDoc} />
        </Box>
      </Box>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={logoutDialog}
        heading="Confirm Logout"
        text="Are you sure you want to log out of your session?"
        onSuccess={handleConfirmLogout}
        onCancel={() => setLogoutDialog(false)}
        okBtnTxt="Logout"
      />
    </Box>
  );
};

function App() {
  const theme = AppTheme(14);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <UIProvider>
          <BrowserRouter>
            <MainLayout />
          </BrowserRouter>
        </UIProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
