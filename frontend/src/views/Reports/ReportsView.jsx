import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Fab,
  Tooltip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  AccordionActions,
  Chip,
} from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BarChartIcon from '@mui/icons-material/BarChart';
import RefreshIcon from '@mui/icons-material/Refresh';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PaymentsIcon from '@mui/icons-material/Payments';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import dayjs from 'dayjs';
import { useReports } from '../../hooks/useReports';
import { useDurationFilter } from '../../hooks/useDurationFilter';
import { useGraphView } from '../../hooks/useGraphView';
import { useUI } from '../../context/UIContext';
import {
  downloadStatementPdfApi,
  downloadPaymentModesPdfApi,
  downloadFinancialYearPdfApi,
} from '../../services/reports.service';
import ExpenditureCard from '../../components/reports/ExpenditureCard';
import DurationFilter from '../../components/reports/DurationFilter';
import GraphViewDialog from '../../components/dialogs/GraphViewDialog';
import ExportPdfDialog from '../../components/reports/ExportPdfDialog';
import PaymentModesReportDialog from '../../components/reports/PaymentModesReportDialog';
import FinancialYearReportDialog from '../../components/reports/FinancialYearReportDialog';
import MonthSelector from '../../components/core/MonthSelector';
import FinancialYearSelector, {
  getCurrentFinancialYearStart,
  formatFinancialYearKey,
} from '../../components/core/FinancialYearSelector';
import useAppCss from '../../hooks/css/useAppCss';
import useMobile from '../../hooks/core/useMobile';
import { Download, ExpandMore, Preview } from '@mui/icons-material';

const ReportsView = () => {
  const { GlobalPaperCss } = useAppCss();
  const { isMobile } = useMobile();
  const { showAlert } = useUI();

  // Accordion 1: Financial Statement state
  const [financialMonth, setFinancialMonth] = useState(dayjs().format('YYYY-MM'));
  const [downloadingFinancialPdf, setDownloadingFinancialPdf] = useState(false);

  // Accordion 2: All Payment Mode Report state
  const [paymentModesMonth, setPaymentModesMonth] = useState(dayjs().format('YYYY-MM'));
  const [downloadingPaymentModesPdf, setDownloadingPaymentModesPdf] = useState(false);
  const [paymentModesModalOpen, setPaymentModesModalOpen] = useState(false);

  // Accordion 3: Annual Financial Year Statement state
  const currentFyStart = getCurrentFinancialYearStart();
  const currentFyKey = formatFinancialYearKey(currentFyStart);
  const [financialYear, setFinancialYear] = useState(currentFyKey);
  const [downloadingFinancialYearPdf, setDownloadingFinancialYearPdf] = useState(false);
  const [financialYearModalOpen, setFinancialYearModalOpen] = useState(false);

  // 1. Core Reports Data Hook
  const { reportItems, loading, pdfModalOpen, handleOpenPdfModal, handleClosePdfModal, handleFilterChange, refetch } =
    useReports();

  // Financial statement PDF download handler (for chosen financialMonth)
  const handleDownloadFinancialStatement = async () => {
    if (downloadingFinancialPdf) return;
    setDownloadingFinancialPdf(true);
    const targetMonth = financialMonth || dayjs().format('YYYY-MM');
    try {
      const response = await downloadStatementPdfApi(targetMonth);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });
      let filename = `CW-Financial-Statement-${targetMonth}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      showAlert(`Downloaded "${filename}" successfully.`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Failed to download statement PDF.', 'error');
    } finally {
      setDownloadingFinancialPdf(false);
    }
  };

  // Payment Mode PDF download handler (for chosen paymentModesMonth)
  const handleDownloadPaymentModes = async () => {
    if (downloadingPaymentModesPdf) return;
    setDownloadingPaymentModesPdf(true);
    const targetMonth = paymentModesMonth || dayjs().format('YYYY-MM');
    try {
      const response = await downloadPaymentModesPdfApi(targetMonth);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });
      let filename = `CW-Payment-Mode-Report-${targetMonth}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      showAlert(`Downloaded "${filename}" successfully.`, 'success');
    } catch (err) {
      showAlert(err.response?.data?.message || err.message || 'Failed to download Payment Mode Report PDF.', 'error');
    } finally {
      setDownloadingPaymentModesPdf(false);
    }
  };

  // Financial Year PDF download handler (for chosen financialYear)
  const handleDownloadFinancialYear = async () => {
    if (downloadingFinancialYearPdf) return;
    setDownloadingFinancialYearPdf(true);
    const targetYear = financialYear || currentFyKey;
    try {
      const response = await downloadFinancialYearPdfApi(targetYear);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });
      let filename = `CW-Financial-Year-Statement-${targetYear}.pdf`;
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(downloadUrl), 1000);
      showAlert(`Downloaded "${filename}" successfully.`, 'success');
    } catch (err) {
      showAlert(
        err.response?.data?.message || err.message || 'Failed to download Financial Year Report PDF.',
        'error',
      );
    } finally {
      setDownloadingFinancialYearPdf(false);
    }
  };

  // 2. Duration Filter Hook
  const {
    duration,
    startDate,
    endDate,
    isCustom,
    options,
    maxDate,
    handleDurationChange,
    handleStartDateChange,
    handleEndDateChange,
  } = useDurationFilter(handleFilterChange);

  // 3. Graph View Hook
  const {
    open: graphModalOpen,
    graphType,
    chartOption,
    handleOpen: handleOpenGraphModal,
    handleClose: handleCloseGraphModal,
    handleGraphTypeChange,
  } = useGraphView(reportItems);

  // Reusable duration filter element
  const durationFilterElement = (
    <DurationFilter
      duration={duration}
      startDate={startDate}
      endDate={endDate}
      isCustom={isCustom}
      options={options}
      maxDate={maxDate}
      onDurationChange={handleDurationChange}
      onStartDateChange={handleStartDateChange}
      onEndDateChange={handleEndDateChange}
    />
  );

  // Array of configurable reports rendered via loop in the Other Reports accordion section
  const otherReports = [
    {
      id: 'monthly-financial',
      title: 'Monthly Financial Statement & Audit Report',
      icon: <PictureAsPdfIcon color="error" fontSize="small" />,
      badgeLabel: dayjs(`${financialMonth}-01`).format('MMMM YYYY'),
      isCurrent: financialMonth === dayjs().format('YYYY-MM'),
      description:
        'Select the statement month below to preview and download your complete end-to-end financial audit statement with income, expenses, category breakdown, and debt ledgers.',
      selector: (
        <MonthSelector
          value={financialMonth}
          onChange={(newMonth) => setFinancialMonth(newMonth)}
          label="Select Statement Month:"
        />
      ),
      onPreview: handleOpenPdfModal,
      onDownload: handleDownloadFinancialStatement,
      downloading: downloadingFinancialPdf,
    },
    {
      id: 'payment-modes',
      title: 'All Payment Mode Report',
      icon: <PaymentsIcon color="primary" fontSize="small" />,
      badgeLabel: dayjs(`${paymentModesMonth}-01`).format('MMMM YYYY'),
      isCurrent: paymentModesMonth === dayjs().format('YYYY-MM'),
      description:
        'Select the report month below to preview and download expenditure distribution across all payment modes (UPI, Credit Card, Cash, Debit Card, Net Banking).',
      selector: (
        <MonthSelector
          value={paymentModesMonth}
          onChange={(newMonth) => setPaymentModesMonth(newMonth)}
          label="Select Report Month:"
        />
      ),
      onPreview: () => setPaymentModesModalOpen(true),
      onDownload: handleDownloadPaymentModes,
      downloading: downloadingPaymentModesPdf,
    },
    {
      id: 'financial-year',
      title: 'Annual Financial Year Statement & Audit Report',
      icon: <AccountBalanceWalletIcon color="success" fontSize="small" />,
      badgeLabel: `FY ${financialYear}`,
      isCurrent: financialYear === currentFyKey,
      description:
        'Select the financial year (April - March) below to preview and download your comprehensive annual audit statement with fiscal quarter progression, category distribution, and payment mode breakdowns.',
      selector: (
        <FinancialYearSelector
          value={financialYear}
          onChange={(newFy) => setFinancialYear(newFy)}
          label="Select Financial Year:"
        />
      ),
      onPreview: () => setFinancialYearModalOpen(true),
      onDownload: handleDownloadFinancialYear,
      downloading: downloadingFinancialYearPdf,
    },
  ];

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      {/* Page Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={1}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <AssessmentIcon sx={{ fontSize: 30 }} color="primary" />

          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Expenditure Reports
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'justify' }}>
              Monthly expenditure breakdown, variance analysis & graph analytics
            </Typography>
          </Box>
        </Box>

        {/* Action Controls */}
        <Stack
          direction="row"
          spacing={1}
          gap={1}
          alignItems="center"
          flexWrap="wrap"
          width="100%"
          justifyContent="flex-end"
        >
          {isMobile ? (
            <Tooltip title="Click here to refresh the reports" arrow>
              <Fab size="small" disabled={loading} onClick={refetch} color="primary">
                <RefreshIcon />
              </Fab>
            </Tooltip>
          ) : (
            <Button
              variant="outlined"
              size="medium"
              onClick={refetch}
              disabled={loading}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 600, textTransform: 'none' }}
            >
              Refresh
            </Button>
          )}

          {isMobile ? (
            <Tooltip title="Click here to view your report bar chart" arrow>
              <Fab size="small" disabled={loading} onClick={handleOpenGraphModal} color="primary">
                <BarChartIcon />
              </Fab>
            </Tooltip>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="medium"
              onClick={handleOpenGraphModal}
              startIcon={<BarChartIcon />}
              sx={{
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(0, 0, 128, 0.25)',
              }}
            >
              Graph View
            </Button>
          )}
        </Stack>
      </Box>

      {/* Filter Toolbar row */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        p={2}
        mb={3}
        bgcolor="#f8fafc"
        borderRadius={2.5}
        border="1px solid #e2e8f0"
      >
        {durationFilterElement}

        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Showing {reportItems.length} {reportItems.length === 1 ? 'month' : 'months'}
        </Typography>
      </Box>

      {/* Loading Indicator */}
      {loading && (
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={8} gap={1.5}>
          <CircularProgress size={40} color="primary" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Loading expenditure reports...
          </Typography>
        </Box>
      )}

      {/* Empty State */}
      {!loading && reportItems.length === 0 && (
        <Alert severity="info" sx={{ my: 4, borderRadius: 2 }}>
          No expenditure records found for the selected time duration. Try choosing a different range or add new expenses.
        </Alert>
      )}

      {/* List of Monthly Expenditure Cards */}
      {!loading && reportItems.length > 0 && (
        <Grid container spacing={3}>
          {reportItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.month}>
              <ExpenditureCard item={item} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && reportItems.length > 0 && (
        <>
          <Divider sx={{ my: 1 }} />

          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Other Reports
          </Typography>

          {otherReports.map((report) => (
            <Accordion
              key={report.id}
              sx={(theme) => ({
                my: 2,
                border: `1px solid ${theme.palette.secondary.A100}`,
                borderRadius: 2,
              })}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`${report.id}-report-content`}
                id={`${report.id}-header`}
              >
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  width="100%"
                  pr={{ xs: 1, sm: 2 }}
                  flexWrap="wrap"
                  gap={1}
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    {report.icon}
                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                      {report.title}
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    label={report.badgeLabel}
                    color={report.isCurrent ? 'primary' : 'default'}
                    variant={report.isCurrent ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                  />
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Typography sx={{ textAlign: 'justify', mb: 2 }} variant="body2" color="text.secondary">
                  {report.description}
                </Typography>
                {report.selector}
              </AccordionDetails>

              <AccordionActions sx={{ px: 2, pb: 1.5, gap: 1 }}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  startIcon={<Preview fontSize="small" />}
                  onClick={report.onPreview}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Preview
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  startIcon={
                    report.downloading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <Download fontSize="small" />
                    )
                  }
                  onClick={report.onDownload}
                  disabled={report.downloading || loading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  {report.downloading ? 'Downloading...' : 'Download'}
                </Button>
              </AccordionActions>
            </Accordion>
          ))}
        </>
      )}

      {/* Graph View Modal Dialog */}
      <GraphViewDialog
        open={graphModalOpen}
        onClose={handleCloseGraphModal}
        chartOption={chartOption}
        graphType={graphType}
        onGraphTypeChange={handleGraphTypeChange}
        durationFilterComponent={durationFilterElement}
      />

      {/* PDF Export Modal */}
      {pdfModalOpen && <ExportPdfDialog open={pdfModalOpen} onClose={handleClosePdfModal} initialMonth={financialMonth} />}

      {/* Payment Modes Report Modal */}
      {paymentModesModalOpen && (
        <PaymentModesReportDialog
          open={paymentModesModalOpen}
          onClose={() => setPaymentModesModalOpen(false)}
          initialMonth={paymentModesMonth}
        />
      )}

      {/* Financial Year Report Modal */}
      {financialYearModalOpen && (
        <FinancialYearReportDialog
          open={financialYearModalOpen}
          onClose={() => setFinancialYearModalOpen(false)}
          initialYear={financialYear}
        />
      )}
    </Paper>
  );
};

export default ReportsView;
