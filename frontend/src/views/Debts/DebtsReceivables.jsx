import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Chip,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import HandshakeIcon from "@mui/icons-material/Handshake";
import CallReceivedIcon from "@mui/icons-material/CallReceived";
import CallMadeIcon from "@mui/icons-material/CallMade";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useDebts } from "../../hooks/useDebts";
import {
  useDebtColumns,
  debtDefaultSorting,
} from "../../hooks/mrt/useDebtColumns";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import CreateDebtDialog from "../../components/dialog/CreateDebtDialog";
import SettleDebtDialog from "../../components/dialog/SettleDebtDialog";
import useAppCss from "../../hooks/css/useAppCss";

const DebtsReceivables = () => {
  const { GlobalTableCss, GlobalPaperCss } = useAppCss();
  const {
    debts,
    summary,
    loading,
    filterTab,
    setFilterTab,
    // Create Debt Dialog
    modalOpen,
    formData,
    setCaptchaId,
    errors,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    handleKeyDownNumber,
    requestCreateConfirmation,
    // Settle Debt Dialog
    settleModalOpen,
    selectedDebt,
    settleFormData,
    setSettleCaptchaId,
    settleErrors,
    handleOpenSettleModal,
    handleCloseSettleModal,
    handleSettleChange,
    requestSettleConfirmation,
    // Actions & Confirmation
    confirmDialog,
    setConfirmDialog,
    requestWriteOffConfirmation,
    requestDeleteConfirmation,
    handleCopyReminder,
    executeConfirmedAction,
  } = useDebts();

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const columns = useDebtColumns({
    onSettle: handleOpenSettleModal,
    onCopyReminder: handleCopyReminder,
    onWriteOff: requestWriteOffConfirmation,
    onDelete: requestDeleteConfirmation,
  });

  const table = useMaterialReactTable({
    columns,
    data: debts,
    initialState: {
      sorting: debtDefaultSorting,
    },
    state: { isLoading: loading },
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaperProps: { elevation: 2, sx: { borderRadius: 3 } },
    ...GlobalTableCss,
  });

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
        {/* Header */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={1.5}
          mb={2.5}
        >
          <Box display="flex" alignItems="center" gap={1.2}>
            <HandshakeIcon color="primary" sx={{ fontSize: 34 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                Debts & Receivables
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track money lent to others (receivables), borrowed funds, and
                repayment settlements
              </Typography>
            </Box>
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button
              variant="outlined"
              color="warning"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal("BORROWED")}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {isMobile ? "Add Borrowed" : "Record Money Borrowed"}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => handleOpenModal("LENT")}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              {isMobile ? "Lend Money" : "Record Money Lent"}
            </Button>
          </Stack>
        </Box>

        {/* KPI Summary Cards */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "primary.main",
                borderWidth: 1.5,
                bgcolor: "#f8fafc",
              }}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    TOTAL MONEY LENT
                  </Typography>
                  <CallMadeIcon color="primary" fontSize="small" />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  color="primary.main"
                  mt={0.5}
                >
                  ₹
                  {(summary.totalLent || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "success.main",
                borderWidth: 1.5,
                bgcolor: "#f0fdf4",
              }}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    TOTAL RECOVERED
                  </Typography>
                  <CheckCircleOutlineIcon color="success" fontSize="small" />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  color="success.main"
                  mt={0.5}
                >
                  ₹
                  {(summary.totalRecovered || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "error.main",
                borderWidth: 1.5,
                bgcolor: "#fef2f2",
              }}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    PENDING TO COLLECT
                  </Typography>
                  <CallReceivedIcon color="error" fontSize="small" />
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  mt={0.5}
                >
                  <Typography variant="h6" fontWeight={800} color="error.main">
                    ₹
                    {(summary.totalPendingReceivable || 0).toLocaleString(
                      "en-IN",
                      { minimumFractionDigits: 2 }
                    )}
                  </Typography>
                  {summary.overdueCount > 0 && (
                    <Chip
                      label={`${summary.overdueCount} Overdue`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                borderColor: "warning.main",
                borderWidth: 1.5,
                bgcolor: "#fffbeb",
              }}
            >
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                  >
                    PENDING TO PAY (BORROWED)
                  </Typography>
                  <AccountBalanceWalletIcon color="warning" fontSize="small" />
                </Box>
                <Typography
                  variant="h6"
                  fontWeight={800}
                  color="warning.dark"
                  mt={0.5}
                >
                  ₹
                  {(summary.totalPendingPayable || 0).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            value={filterTab}
            onChange={(e, val) => setFilterTab(val)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab
              label="All Records"
              value="ALL"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
            <Tab
              label="Money Lent (Receivables)"
              value="LENT"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
            <Tab
              label="Money Borrowed (Payables)"
              value="BORROWED"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
            <Tab
              label="Active / Pending"
              value="PENDING"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
            <Tab
              label="Settled / Closed"
              value="SETTLED"
              sx={{ textTransform: "none", fontWeight: 700 }}
            />
          </Tabs>
        </Box>

        {/* Table */}
        <MaterialReactTable table={table} />

        {/* Create Debt / Receivable Dialog */}
        <CreateDebtDialog
          open={modalOpen}
          onClose={handleCloseModal}
          formData={formData}
          errors={errors}
          setCaptchaId={setCaptchaId}
          handleChange={handleChange}
          handleKeyDownNumber={handleKeyDownNumber}
          onSubmit={requestCreateConfirmation}
        />

        {/* Settle Debt / Receivable Dialog */}
        <SettleDebtDialog
          open={settleModalOpen}
          onClose={handleCloseSettleModal}
          debt={selectedDebt}
          formData={settleFormData}
          errors={settleErrors}
          setCaptchaId={setSettleCaptchaId}
          handleChange={handleSettleChange}
          onSubmit={requestSettleConfirmation}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={confirmDialog.open}
          isLoading={confirmDialog.loading}
          heading={confirmDialog.heading}
          text={confirmDialog.text}
          onSuccess={executeConfirmedAction}
          onCancel={() =>
            setConfirmDialog((prev) => ({ ...prev, open: false }))
          }
        />
      </Paper>
    </LocalizationProvider>
  );
};

export default DebtsReceivables;
