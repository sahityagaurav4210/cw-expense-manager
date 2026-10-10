import React, { useState } from "react";
import {
  ThemeProvider,
  CssBaseline,
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Grid,
  Button,
  Chip,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ContrastIcon from "@mui/icons-material/Contrast";
import TextFieldsIcon from "@mui/icons-material/TextFields";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AppTheme from "./theme/AppTheme";

function App() {
  const [fontSize, setFontSize] = useState(14);
  const [highContrast, setHighContrast] = useState(false);

  const theme = AppTheme(fontSize);

  const toggleHighContrast = () => setHighContrast(!highContrast);
  const increaseFont = () => setFontSize((prev) => Math.min(prev + 2, 20));
  const decreaseFont = () => setFontSize((prev) => Math.max(prev - 2, 12));

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          bgcolor: highContrast ? "#000000" : "background.default",
          color: highContrast ? "#ffff00" : "text.primary",
          minHeight: "100vh",
        }}
      >
        {/* GIGW Accessibility Top Strip */}
        <Box
          bgcolor={highContrast ? "#333333" : "#000040"}
          color="#ffffff"
          py={0.5}
          px={2}
        >
          <Container maxWidth="xl">
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography variant="caption" fontWeight={600}>
                Government of India Guidelines for Websites (GIGW) & W3C WCAG
                2.1 Compliant Portal
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Tooltip title="Decrease Text Size">
                  <IconButton
                    size="small"
                    onClick={decreaseFont}
                    sx={{ color: "#fff" }}
                  >
                    <TextFieldsIcon fontSize="small" />-
                  </IconButton>
                </Tooltip>
                <Tooltip title="Increase Text Size">
                  <IconButton
                    size="small"
                    onClick={increaseFont}
                    sx={{ color: "#fff" }}
                  >
                    <TextFieldsIcon fontSize="small" />+
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle High Contrast Mode">
                  <IconButton
                    size="small"
                    onClick={toggleHighContrast}
                    sx={{ color: "#fff" }}
                  >
                    <ContrastIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Admin Navigation Bar */}
        <AppBar
          position="static"
          sx={{ bgcolor: highContrast ? "#1a1a1a" : "primary.main" }}
        >
          <Toolbar>
            <AdminPanelSettingsIcon sx={{ mr: 1.5, fontSize: 32 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flexGrow: 1 }}>
              CW Expense Tracker - Admin Governance Portal
            </Typography>
            <Chip
              icon={<SecurityIcon sx={{ color: "#fff !important" }} />}
              label="GIGW Certified"
              color="success"
              size="small"
            />
          </Toolbar>
        </AppBar>

        {/* Main Governance Content */}
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} md={4}>
              <Card
                elevation={3}
                sx={{ borderRadius: 3, borderTop: "4px solid #000080" }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Registered Users
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="primary.main"
                    mt={1}
                  >
                    1,248
                  </Typography>
                  <Typography
                    variant="caption"
                    color="success.main"
                    mt={0.5}
                    display="block"
                  >
                    Active sessions monitored via Redis
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={3}
                sx={{ borderRadius: 3, borderTop: "4px solid #228B22" }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Master Categories Count
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="success.main"
                    mt={1}
                  >
                    18
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={0.5}
                    display="block"
                  >
                    Stored in master.categories schema
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                elevation={3}
                sx={{ borderRadius: 3, borderTop: "4px solid #ff9933" }}
              >
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary">
                    Security Audit Status (VAPT)
                  </Typography>
                  <Typography
                    variant="h4"
                    fontWeight={700}
                    color="warning.main"
                    mt={1}
                  >
                    PASSED
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    mt={0.5}
                    display="block"
                  >
                    OWASP Top 10 mitigation verified
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Audit Logs Table */}
          <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6" fontWeight={700} color="primary.main">
                System Governance & Security Audit Logs
              </Typography>
              <Chip
                icon={<CheckCircleIcon />}
                label="Winston Log Rotation Active"
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f1f5f9" }}>
                    <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>
                      Service Module
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Event Action</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>2026-10-08 16:40:12</TableCell>
                    <TableCell>BFF Proxy Service</TableCell>
                    <TableCell>Rate Limiter Verification</TableCell>
                    <TableCell>127.0.0.1</TableCell>
                    <TableCell>
                      <Chip label="SUCCESS" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2026-10-08 16:38:05</TableCell>
                    <TableCell>Backend API</TableCell>
                    <TableCell>Category Master Cache Update</TableCell>
                    <TableCell>127.0.0.1</TableCell>
                    <TableCell>
                      <Chip label="CACHED" color="info" size="small" />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2026-10-08 16:35:22</TableCell>
                    <TableCell>CAPTCHA Service</TableCell>
                    <TableCell>Validate Token Request</TableCell>
                    <TableCell>127.0.0.1</TableCell>
                    <TableCell>
                      <Chip label="VERIFIED" color="success" size="small" />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
