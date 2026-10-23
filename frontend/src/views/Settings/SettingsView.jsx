import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Button,
  Paper,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import TableViewIcon from "@mui/icons-material/TableView";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContactsIcon from "@mui/icons-material/Contacts";
import SecurityIcon from "@mui/icons-material/Security";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import SearchOffIcon from "@mui/icons-material/SearchOff";
import { useLocation } from "react-router-dom";
import UserProfile from "../Profile/UserProfile";
import ContactsManager from "./Contacts/ContactsManager";
import TwoFactorSettings from "./TwoFactorSettings";
import { downloadBulkExpenseTemplateApi } from "../../services/expense.service";
import { useUI } from "../../context/UIContext";
import useAppCss from "../../hooks/css/useAppCss";

const AVAILABLE_TEMPLATES = [
  {
    id: "bulk-expense-template",
    name: "Bulk Expense Creation Template",
    fileName: "BULK EXPENSE CREATION TEMPLATE.xlsx",
    format: "XLSX",
    description:
      "Official Excel template for bulk uploading expense records (Columns: Sr. No., Expense Name [3–100 chars], Expense Amount, Expense Category, Expense Type, Expense Date).",
  },
];

const SettingsView = () => {
  const { GlobalPaperCss } = useAppCss();
  const { showAlert } = useUI();
  const location = useLocation();
  const [activeView, setActiveView] = useState(null); // null | 'templates' | 'profile' | 'contacts' | '2fa'
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset to initial card view when navigating to /settings
  useEffect(() => {
    setActiveView(null);
    setSearchQuery("");
  }, [location.key]);

  const handleDownloadTemplate = async (template) => {
    setDownloadingId(template.id);
    try {
      const res = await downloadBulkExpenseTemplateApi();
      const blob = new Blob([res.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = template.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      showAlert(`Downloaded "${template.fileName}" successfully.`, "success");
    } catch (err) {
      showAlert("Failed to download template file.", "error");
    } finally {
      setDownloadingId(null);
    }
  };

  // Next View: Profile
  if (activeView === "profile") {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveView(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Back to Settings
          </Button>
        </Box>
        <UserProfile />
      </Box>
    );
  }

  // Next View: Contacts
  if (activeView === "contacts") {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveView(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Back to Settings
          </Button>
        </Box>
        <ContactsManager />
      </Box>
    );
  }

  // Next View: Templates
  if (activeView === "templates") {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<ArrowBackIcon />}
            onClick={() => setActiveView(null)}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            Back to Settings
          </Button>
        </Box>

        <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1}
            mb={2}
          >
            <Box display="flex" alignItems="center" gap={1.2}>
              <DescriptionIcon color="primary" sx={{ fontSize: 32 }} />
              <Box>
                <Typography variant="h5" fontWeight={700} color="primary.main">
                  Available Templates
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Download official templates for bulk data uploads
                </Typography>
              </Box>
            </Box>
            <Chip
              label={`${AVAILABLE_TEMPLATES.length} Template Available`}
              color="primary"
              size="small"
              variant="outlined"
            />
          </Box>

          <Divider sx={{ mb: 2.5 }} />

          <List disablePadding>
            {AVAILABLE_TEMPLATES.map((tpl, index) => (
              <ListItem
                key={tpl.id}
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: "#f8fafc",
                  border: "1px solid",
                  borderColor: "primary.main",
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box display="flex" alignItems="flex-start" gap={1.5}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    <TableViewIcon color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={1}
                        flexWrap="wrap"
                      >
                        <Typography
                          variant="subtitle1"
                          fontWeight={700}
                          color="text.primary"
                        >
                          {index + 1}. {tpl.name}
                        </Typography>
                        <Chip
                          label={tpl.fileName}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mt={0.5}
                      >
                        {tpl.description}
                      </Typography>
                    }
                  />
                </Box>

                <Button
                  variant="contained"
                  color="primary"
                  startIcon={
                    downloadingId === tpl.id ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <DownloadIcon />
                    )
                  }
                  disabled={downloadingId === tpl.id}
                  onClick={() => handleDownloadTemplate(tpl)}
                  sx={{
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    alignSelf: { xs: "stretch", sm: "center" },
                  }}
                >
                  {downloadingId === tpl.id
                    ? "Downloading..."
                    : "Download Template"}
                </Button>
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    );
  }

  // Next View: Two-Factor Authentication (2FA)
  if (activeView === "2fa") {
    return (
      <Box display="flex" flexDirection="column" gap={2}>
        <TwoFactorSettings onBack={() => setActiveView(null)} />
      </Box>
    );
  }

  const SETTINGS_CARDS = [
    {
      id: "templates",
      title: "Templates",
      description:
        "View available data templates and download the official Bulk Expense Creation Excel template.",
      icon: DescriptionIcon,
      badge: `${AVAILABLE_TEMPLATES.length} Template Available`,
      keywords: [
        "template",
        "excel",
        "bulk",
        "upload",
        "xlsx",
        "download",
        "expense",
      ],
      onClick: () => setActiveView("templates"),
    },
    {
      id: "profile",
      title: "Profile",
      description:
        "View and update your personal profile details, employment type, phone number, and profile photo.",
      icon: PersonIcon,
      badge: "Manage Profile",
      keywords: [
        "profile",
        "account",
        "user",
        "personal",
        "avatar",
        "photo",
        "phone",
        "email",
        "employment",
      ],
      onClick: () => setActiveView("profile"),
    },
    {
      id: "contacts",
      title: "Contacts",
      description:
        "Manage your personal and business contact directory for debts, lending records, and quick communications.",
      icon: ContactsIcon,
      badge: "Manage Contacts",
      keywords: [
        "contacts",
        "directory",
        "people",
        "phonebook",
        "debt",
        "lending",
        "customer",
        "vendor",
      ],
      onClick: () => setActiveView("contacts"),
    },
    {
      id: "2fa",
      title: "Two-Factor Authentication (2FA)",
      description:
        "Protect your account with Two-Factor Authentication. Choose between Email OTP verification or an Authenticator App (Google Authenticator, Microsoft Authenticator).",
      icon: SecurityIcon,
      badge: "Security & 2FA",
      keywords: [
        "2fa",
        "mfa",
        "two-factor",
        "two factor",
        "authenticator",
        "totp",
        "google authenticator",
        "microsoft authenticator",
        "authy",
        "security",
        "otp",
        "email otp",
        "verification",
        "login",
      ],
      onClick: () => setActiveView("2fa"),
    },
  ];

  const filteredCards = SETTINGS_CARDS.filter((card) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    return (
      card.title.toLowerCase().includes(query) ||
      card.description.toLowerCase().includes(query) ||
      card.keywords.some((kw) => kw.toLowerCase().includes(query))
    );
  });

  // Initial Card View
  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      {/* Header & Title */}
      <Box
        display="flex"
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        flexDirection={{ xs: "column", sm: "row" }}
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.2}>
          <SettingsIcon color="primary" sx={{ fontSize: 34 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Settings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage your preferences, security, profile, and system templates
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Windows 10/11 Style Search Box */}
      <Box
        sx={{
          mb: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <TextField
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Find a setting"
          size="medium"
          fullWidth
          sx={{
            maxWidth: 520,
            "& .MuiOutlinedInput-root": {
              borderRadius: "28px",
              backgroundColor: "#f8fafc",
              transition: "all 0.2s ease-in-out",
              fontSize: "0.95rem",
              "&:hover": {
                backgroundColor: "#ffffff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                borderColor: "primary.main",
              },
              "&.Mui-focused": {
                backgroundColor: "#ffffff",
                boxShadow: "0 4px 14px rgba(0, 0, 128, 0.12)",
                borderColor: "primary.main",
              },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => setSearchQuery("")}
                  edge="end"
                  aria-label="clear search"
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />
        {searchQuery && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Found {filteredCards.length}{" "}
            {filteredCards.length === 1 ? "result" : "results"} for "
            {searchQuery}"
          </Typography>
        )}
      </Box>

      {/* Settings Cards or Empty State */}
      {filteredCards.length === 0 ? (
        <Box
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 3,
            bgcolor: "#f8fafc",
            border: "1px dashed #cbd5e1",
          }}
        >
          <SearchOffIcon
            sx={{ fontSize: 56, color: "text.disabled", mb: 1.5 }}
          />
          <Typography
            variant="h6"
            fontWeight={700}
            color="text.primary"
            gutterBottom
          >
            No settings found matching "{searchQuery}"
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Try searching for something else like "2FA", "profile", "contacts",
            or "templates".
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            size="small"
            onClick={() => setSearchQuery("")}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Clear Search
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredCards.map((card) => {
            const IconComponent = card.icon;
            return (
              <Grid item xs={12} sm={6} md={6} lg={6} key={card.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: "100%",
                    borderColor: "primary.main",
                    borderWidth: 1.5,
                    borderRadius: 3,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      boxShadow: "0 6px 20px rgba(0, 0, 128, 0.14)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={card.onClick}
                    sx={{ height: "100%", p: 1 }}
                  >
                    <CardContent>
                      <Box
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        mb={1.5}
                      >
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Box
                            sx={{
                              p: 1.2,
                              borderRadius: 2,
                              bgcolor: "rgba(0, 0, 128, 0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <IconComponent color="primary" fontSize="large" />
                          </Box>
                          <Typography
                            variant="h6"
                            fontWeight={700}
                            color="primary.main"
                          >
                            {card.title}
                          </Typography>
                        </Box>
                        <ChevronRightIcon color="primary" />
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        mb={2}
                        sx={{
                          minHeight: 40,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {card.description}
                      </Typography>

                      <Chip
                        label={card.badge}
                        color="primary"
                        size="small"
                        variant="outlined"
                      />
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Paper>
  );
};

export default SettingsView;
