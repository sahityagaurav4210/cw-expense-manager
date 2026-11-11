import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Chip,
  CircularProgress,
} from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import dayjs from 'dayjs';
import PaperComponent from '../core/PaperComponent';
import AppDialogTitle from '../core/AppDialogTitle';
import PDFViewer from '../core/PDFViewer';
import { useUI } from '../../context/UIContext';
import {
  getFinancialYearPreviewApi,
  downloadFinancialYearPdfApi,
} from '../../services/reports.service';
import {
  getCurrentFinancialYearStart,
  formatFinancialYearKey,
} from '../core/FinancialYearSelector';

/**
 * Generates financial year options for dialog selector
 */
const generateFinancialYearOptions = (pastYears = 8, futureYears = 1) => {
  const currentFyStart = getCurrentFinancialYearStart();
  const options = [];

  for (let i = futureYears; i >= -pastYears; i--) {
    const start = currentFyStart + i;
    const end = start + 1;
    const key = `${start}-${String(end).slice(-2)}`;
    const isCurrent = start === currentFyStart;

    options.push({
      label: isCurrent ? `FY ${start}-${String(end).slice(-2)} (Current FY)` : `FY ${start}-${String(end).slice(-2)}`,
      displayLabel: `FY ${start}-${String(end).slice(-2)}`,
      value: key,
      isCurrent,
    });
  }
  return options;
};

/**
 * FinancialYearReportDialog component.
 * Previews and downloads the Annual Financial Year Statement & Audit Report.
 */
const FinancialYearReportDialog = ({ open, onClose, initialYear = null }) => {
  const { showAlert } = useUI();
  const fyOptions = useMemo(() => generateFinancialYearOptions(), []);

  const defaultOption = useMemo(() => {
    if (initialYear) {
      const match = fyOptions.find((o) => o.value === initialYear);
      if (match) return match;
    }
    return fyOptions.find((o) => o.isCurrent) || fyOptions[1] || fyOptions[0];
  }, [fyOptions, initialYear]);

  const [selectedOption, setSelectedOption] = useState(defaultOption);
  const [htmlReport, setHtmlReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && initialYear) {
      const match = fyOptions.find((o) => o.value === initialYear);
      if (match) {
        setSelectedOption(match);
      }
    }
  }, [open, initialYear, fyOptions]);

  const fetchPreview = useCallback(
    async (fyKey) => {
      setLoading(true);
      try {
        const html = await getFinancialYearPreviewApi(fyKey);
        setHtmlReport(html);
      } catch (err) {
        showAlert(
          err.response?.data?.message || err.message || 'Failed to load Financial Year Report preview.',
          'error',
        );
      } finally {
        setLoading(false);
      }
    },
    [showAlert],
  );

  useEffect(() => {
    if (open && selectedOption?.value) {
      fetchPreview(selectedOption.value);
    }
  }, [open, selectedOption, fetchPreview]);

  const handleYearChange = (event, newOption) => {
    if (newOption) {
      setSelectedOption(newOption);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedOption?.value || downloading) return;
    setDownloading(true);
    try {
      const response = await downloadFinancialYearPdfApi(selectedOption.value);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });

      let filename = `CW-Financial-Year-Statement-${selectedOption.value}.pdf`;
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
        err.response?.data?.message || err.message || 'Failed to download Financial Year PDF.',
        'error',
      );
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title="Annual Financial Year Statement & Audit Report"
        onClose={onClose}
        Icon={<AccountBalanceWalletIcon sx={{ color: 'white' }} />}
      />

      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {/* Top Control Bar: Financial Year Selector */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flexWrap="wrap"
          gap={2}
          p={1.5}
          mb={2}
          sx={{
            bgcolor: '#f8fafc',
            borderRadius: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.75}>
              <DateRangeIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Select Financial Year:
              </Typography>
            </Box>

            <Autocomplete
              options={fyOptions}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, val) => option.value === val?.value}
              value={selectedOption}
              onChange={handleYearChange}
              disableClearable
              size="small"
              sx={{ width: { xs: '100%', sm: 280 } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Choose FY"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={selectedOption?.displayLabel || 'Selected FY'}
              color={selectedOption?.isCurrent ? 'primary' : 'default'}
              variant={selectedOption?.isCurrent ? 'filled' : 'outlined'}
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Box>

        {/* Report Preview or Loading State */}
        {loading ? (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            py={10}
            gap={2}
          >
            <CircularProgress size={42} color="primary" />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Generating Annual Financial Year Statement for {selectedOption?.label}...
            </Typography>
          </Box>
        ) : htmlReport ? (
          <PDFViewer
            pdfData={new Blob([htmlReport], { type: 'text/html' })}
            title={`CW Financial Year Statement - ${selectedOption?.value}`}
            filename={`CW-Financial-Year-Statement-${selectedOption?.value}.pdf`}
            height="650px"
            onDownload={handleDownloadPdf}
            downloading={downloading}
          />
        ) : (
          <Box py={8} textAlign="center">
            <Typography color="text.secondary">
              Unable to generate financial year report. Please select another financial year.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

FinancialYearReportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialYear: PropTypes.string,
};

export default React.memo(FinancialYearReportDialog);
