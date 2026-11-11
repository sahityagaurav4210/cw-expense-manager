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
import PaymentsIcon from '@mui/icons-material/Payments';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import dayjs from 'dayjs';
import PaperComponent from '../core/PaperComponent';
import AppDialogTitle from '../core/AppDialogTitle';
import PDFViewer from '../core/PDFViewer';
import { useUI } from '../../context/UIContext';
import {
  getPaymentModesPreviewApi,
  downloadPaymentModesPdfApi,
} from '../../services/reports.service';

/**
 * Generates month selection options (past 24 months + next 6 months).
 */
const generateMonthOptions = () => {
  const current = dayjs();
  const currentKey = current.format('YYYY-MM');
  const options = [];

  for (let i = 6; i >= -24; i--) {
    const d = current.add(i, 'month');
    const key = d.format('YYYY-MM');
    const isCurrent = key === currentKey;
    options.push({
      label: isCurrent ? `${d.format('MMMM YYYY')} (Current Month)` : d.format('MMMM YYYY'),
      value: key,
      isCurrent,
    });
  }
  return options;
};

/**
 * PaymentModesReportDialog component.
 * Allows user to choose a target month via Autocomplete and previews the rendered All Payment Mode Report,
 * with PDF generation and binary download from the backend.
 */
const PaymentModesReportDialog = ({ open, onClose, initialMonth = null }) => {
  const { showAlert } = useUI();
  const monthOptions = useMemo(() => generateMonthOptions(), []);

  const defaultOption = useMemo(() => {
    if (initialMonth) {
      const match = monthOptions.find((o) => o.value === initialMonth);
      if (match) return match;
    }
    return monthOptions.find((o) => o.isCurrent) || monthOptions[6];
  }, [monthOptions, initialMonth]);

  const [selectedOption, setSelectedOption] = useState(defaultOption);

  useEffect(() => {
    if (open && initialMonth) {
      const match = monthOptions.find((o) => o.value === initialMonth);
      if (match) {
        setSelectedOption(match);
      }
    }
  }, [open, initialMonth, monthOptions]);
  const [htmlReport, setHtmlReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchPreview = useCallback(
    async (monthKey) => {
      setLoading(true);
      try {
        const html = await getPaymentModesPreviewApi(monthKey);
        setHtmlReport(html);
      } catch (err) {
        showAlert(
          err.response?.data?.message || err.message || 'Failed to load Payment Mode Report preview.',
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

  const handleMonthChange = (event, newOption) => {
    if (newOption) {
      setSelectedOption(newOption);
    }
  };

  const handleDownloadPdf = async () => {
    if (!selectedOption?.value || downloading) return;
    setDownloading(true);
    try {
      const response = await downloadPaymentModesPdfApi(selectedOption.value);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf',
      });

      let filename = `CW-Payment-Mode-Report-${selectedOption.value}.pdf`;
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
        err.response?.data?.message || err.message || 'Failed to download Payment Mode Report PDF.',
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
        title="All Payment Mode Expenditure Report"
        onClose={onClose}
        Icon={<PaymentsIcon sx={{ color: 'white' }} />}
      />

      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {/* Top Control Bar: Month Selector via MUI Autocomplete */}
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
              <CalendarMonthIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                Select Report Month:
              </Typography>
            </Box>

            <Autocomplete
              options={monthOptions}
              getOptionLabel={(option) => option.label || ''}
              isOptionEqualToValue={(option, val) => option.value === val?.value}
              value={selectedOption}
              onChange={handleMonthChange}
              disableClearable
              size="small"
              sx={{ width: { xs: '100%', sm: 280 } }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Choose Month"
                  variant="outlined"
                  size="small"
                />
              )}
            />
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={selectedOption?.label || 'Current Month'}
              color="primary"
              variant="outlined"
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
              Generating Payment Mode Expenditure Report for {selectedOption?.label}...
            </Typography>
          </Box>
        ) : htmlReport ? (
          <PDFViewer
            pdfData={new Blob([htmlReport], { type: 'text/html' })}
            title={`CW Payment Mode Report - ${selectedOption?.value}`}
            filename={`CW-Payment-Mode-Report-${selectedOption?.value}.pdf`}
            height="650px"
            onDownload={handleDownloadPdf}
            downloading={downloading}
          />
        ) : (
          <Box py={8} textAlign="center">
            <Typography color="text.secondary">
              Unable to generate payment mode report. Please select another month.
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

PaymentModesReportDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialMonth: PropTypes.string,
};

export default React.memo(PaymentModesReportDialog);
