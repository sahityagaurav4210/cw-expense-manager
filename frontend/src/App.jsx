import React, { useState, useEffect } from "react";
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
  Typography,
  CircularProgress,
} from "@mui/material";
import AppTheme from "./theme/AppTheme";
import { UIProvider } from "./context/UIContext";
import { AuthProvider } from "./context/AuthContext";
import { Provider, useSelector, useDispatch } from "react-redux";
import { store } from "./store";
import { setAuth, clearAuth, setInitialized } from "./store/authSlice";
import { getMeApi } from "./services/user.service";
import { logoutUserApi } from "./services/auth.service";

// Components & Views
import Header from "./components/layouts/Header";
import Sidebar from "./components/layouts/Sidebar";
import Footer from "./components/core/Footer";
import ConfirmationDialog from "./components/core/ConfirmationDialog";
import Terms from "./components/docs/Terms";
import PrivacyPolicy from "./components/docs/LegalPrivacy";
import Register from "./views/Auth/Register";
import Login from "./views/Auth/Login";
import CategoryManager from "./views/Category/CategoryManager";
import BudgetAllocation from "./views/Budget/BudgetAllocation";
import ExpenseManager from "./views/Expense/ExpenseManager";
import UserDashboard from "./views/Dashboard/UserDashboard";
import ReportsView from "./views/Reports/ReportsView";
import UserProfile from "./views/Profile/UserProfile";
import SessionTimeoutModal from "./components/auth/SessionTimeoutModal";
import useSmoothScroll, { smoothScrollTo } from "./hooks/useSmoothScroll";

// Protected Route Wrapper
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  if (!isInitialized) return null;
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
  const { isAuthenticated, isInitialized } = useSelector((state) => state.auth);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutDialog, setLogoutDialog] = useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  // Global GSAP Smooth Scrolling
  useSmoothScroll();

  // Smooth scroll to top on route navigation
  useEffect(() => {
    smoothScrollTo(0, { duration: 0.45, ease: "power2.out" });
  }, [location.pathname]);

  // Session hydration on page reload using get-me API
  useEffect(() => {
    let isMounted = true;
    const hydrateSession = async () => {
      try {
        const res = await getMeApi();
        if (isMounted && res.status === "success" && res.data) {
          dispatch(
            setAuth({
              user: res.data.user,
              accessToken: res.data.accessToken,
            }),
          );
        } else if (isMounted) {
          dispatch(setInitialized(true));
        }
      } catch {
        if (isMounted) {
          dispatch(setInitialized(true));
        }
      }
    };

    hydrateSession();
    return () => {
      isMounted = false;
    };
  }, [dispatch]);

  const sidebarWidth = isSidebarExpanded ? 240 : 76;

  const handleNavigateDoc = (docType) => {
    if (docType === "terms") navigate("/terms");
    if (docType === "privacy") navigate("/privacy");
  };

  const handleLogoutClick = () => {
    setLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    try {
      await logoutUserApi().catch(() => {});
    } finally {
      dispatch(clearAuth());
      setLogoutDialog(false);
      navigate("/login");
    }
  };

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const isDocPage =
    location.pathname === "/terms" || location.pathname === "/privacy";

  if (!isInitialized) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="background.default"
        gap={2}
      >
        <CircularProgress size={48} color="primary" />
        <Typography variant="body2" color="text.secondary" fontWeight={500}>
          Restoring secure session...
        </Typography>
      </Box>
    );
  }

  const showSidebar = isAuthenticated && !isAuthPage && !isDocPage;

  return (
    <Box
      display="flex"
      flexDirection="column"
      minHeight="100vh"
      sx={{ width: "100%", maxWidth: "100vw", overflowX: "hidden" }}
    >
      {/* Session Inactivity Timeout Modal */}
      {isAuthenticated && <SessionTimeoutModal />}

      {/* Top Navbar Header */}
      {isAuthenticated && !isDocPage && (
        <Header
          sidebarWidth={sidebarWidth}
          isSidebarExpanded={isSidebarExpanded}
          onToggleSidebar={() => setIsSidebarExpanded(!isSidebarExpanded)}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
        />
      )}

      <Box
        display="flex"
        flexGrow={1}
        width="100%"
        pt={isAuthenticated && !isDocPage ? { xs: 7, sm: 8 } : 0}
        sx={{ maxWidth: "100vw" }}
      >
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            onLogout={handleLogoutClick}
            expandable={true}
            isExpanded={isSidebarExpanded}
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
          width={
            showSidebar
              ? { xs: "100%", md: `calc(100% - ${sidebarWidth}px)` }
              : "100%"
          }
          sx={{
            maxWidth: showSidebar
              ? { xs: "100vw", md: `calc(100vw - ${sidebarWidth}px)` }
              : "100%",
            transition: (theme) =>
              theme.transitions.create("width", {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
          }}
        >
          <Box
            flexGrow={1}
            p={isAuthPage ? 0 : 2}
            display="flex"
            flexDirection="column"
            width="100%"
          >
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
                path="/reports"
                element={
                  <ProtectedRoute>
                    <ReportsView />
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
            <AuthProvider>
              <MainLayout />
            </AuthProvider>
          </BrowserRouter>
        </UIProvider>
      </ThemeProvider>
    </Provider>
  );
}

export default App;
