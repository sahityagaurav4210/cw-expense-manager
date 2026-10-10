import React from "react";
import { Box, Container, Typography, Paper, Divider, Button } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SecurityIcon from "@mui/icons-material/Security";

const PrivacyPolicy = ({ onBack }) => {
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
          <SecurityIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight={700} color="primary.main">
            Privacy Policy
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" mb={3}>
          Effective Date: October 2026 | CW Expense Tracker Application
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <Box display="flex" flexDirection="column" gap={2.5}>
          <Typography variant="h6" fontWeight={600}>
            1. Information We Collect
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            CW Expense Tracker collects personal user registration details (Name, Email Address, optional Indian Mobile Number, Password hashes, and Employment Type), profile photo uploads, and user financial records (categories, budget allocations, and expense items).
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            2. How We Use Your Data
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Your information is used strictly to provide expense tracking, dashboard metrics, income-vs-expense analytics, and personalized financial reports. Passwords are stored as salted BCrypt hashes, and sensitive data is encrypted using AES-256 bit encryption.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            3. Data Protection & Security
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            We enforce secure HTTP-Only cookies for session handling, rate limiting on all endpoints, CORS boundaries, Helmet security headers, OWASP Top 10 mitigation practices, and magic-byte verification on user uploads.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            4. Cookies & Session Storage
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Secure HTTP-Only cookies and Redis session caching are used to authenticate requests between the frontend, Backend for Frontend (BFF), API Gateway, and backend microservices.
          </Typography>

          <Typography variant="h6" fontWeight={600}>
            5. Contact Information
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            For privacy inquiries or account data requests, contact: works.sahitya@gmail.com.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;
