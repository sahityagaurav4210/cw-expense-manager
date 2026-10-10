import React from "react";
import { Box, Container, Typography, Paper, Divider, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import GavelIcon from "@mui/icons-material/Gavel";

const Terms = ({ onBack }) => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {onBack && (
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={onBack}
          sx={{ mb: 2, textTransform: "none" }}
          variant="outlined"
          size="small"
        >
          Back to Application
        </Button>
      )}
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" alignItems="center" gap={1.5} mb={2}>
          <GavelIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight={700} color="primary.main">
            Terms & Conditions
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={3}>
          Last Updated: October 2026 | CW Expense Tracker Application
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box display="flex" flexDirection="column" gap={2.5}>
          <Typography variant="h6" fontWeight={600}>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            By accessing or using the CW Expense Tracker application, you agree to comply with and be bound by these Terms and Conditions. If you do not agree, please do not use this application.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            2. User Account & Responsibilities
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            You are responsible for maintaining the confidentiality of your account credentials (email and password). All activities conducted under your user account are your sole responsibility.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            3. Financial Data & Tracking
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            The financial income, budget allocation, and expense records entered into the application are stored for your personal tracking purposes. CW Expense Tracker provides calculation tools and visual reporting; users are advised to verify financial computations independently.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            4. System Use & Acceptable Behavior
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Users must not attempt to bypass CAPTCHA security, execute unauthorized automated requests, modify file uploads with fake headers, or introduce malicious payloads into the service.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            5. Intellectual Property & Copyright
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            All application code, logos, and UI components are proprietary software © 2026 Gaurav Sahitya. All rights reserved.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default Terms;
