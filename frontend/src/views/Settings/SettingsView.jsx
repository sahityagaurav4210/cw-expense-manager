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
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import DescriptionIcon from "@mui/icons-material/Description";
import DownloadIcon from "@mui/icons-material/Download";
import PersonIcon from "@mui/icons-material/Person";
import TableViewIcon from "@mui/icons-material/TableView";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContactsIcon from "@mui/icons-material/Contacts";
import { useLocation } from "react-router-dom";
import UserProfile from "../Profile/UserProfile";
import ContactsManager from "./Contacts/ContactsManager";
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
  const [activeView, setActiveView] = useState(null); // null | 'templates' | 'profile'
  const [downloadingId, setDownloadingId] = useState(null);

  // Reset to initial card view when navigating to /settings
  useEffect(() => {
    setActiveView(null);
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

  // Initial Card View
  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      <Box display="flex" alignItems="center" gap={1.2} mb={3}>
        <SettingsIcon color="primary" sx={{ fontSize: 32 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Settings
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Select a card below to manage templates, your profile, or your contact directory
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Templates Card */}
        <Grid item xs={12} sm={6} md={4}>
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
              onClick={() => setActiveView("templates")}
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
                      <DescriptionIcon color="primary" fontSize="large" />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      Templates
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  View available data templates and download the official Bulk
                  Expense Creation Excel template.
                </Typography>

                <Chip
                  label={`${AVAILABLE_TEMPLATES.length} Template Available`}
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Profile Card */}
        <Grid item xs={12} sm={6} md={4}>
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
              onClick={() => setActiveView("profile")}
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
                      <PersonIcon color="primary" fontSize="large" />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      Profile
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  View and update your personal profile details, employment
                  type, phone number, and profile photo.
                </Typography>

                <Chip
                  label="Manage Profile"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Contacts Card */}
        <Grid item xs={12} sm={6} md={4}>
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
              onClick={() => setActiveView("contacts")}
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
                      <ContactsIcon color="primary" fontSize="large" />
                    </Box>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      color="primary.main"
                    >
                      Contacts
                    </Typography>
                  </Box>
                  <ChevronRightIcon color="primary" />
                </Box>

                <Typography variant="body2" color="text.secondary" mb={2}>
                  Manage your personal and business contact directory for debts,
                  lending records, and quick communications.
                </Typography>

                <Chip
                  label="Manage Contacts"
                  color="primary"
                  size="small"
                  variant="outlined"
                />
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SettingsView;
