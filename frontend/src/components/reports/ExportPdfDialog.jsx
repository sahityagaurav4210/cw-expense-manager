import React from "react";
import PropTypes from "prop-types";
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
} from "@mui/material";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PaperComponent from "../core/PaperComponent";
import AppDialogTitle from "../core/AppDialogTitle";
import PDFViewer from "../core/PDFViewer";
import { useExportPdfReport } from "../../hooks/useExportPdfReport";

/**
 * ExportPdfDialog component (Pure UI).
 * Allows user to choose a target month via Autocomplete and previews the rendered template,
 * while initiating genuine PDF generation and binary download from the backend.
 */
const ExportPdfDialog = ({ open, onClose }) => {
  const {
    monthOptions,
    selectedOption,
    handleMonthChange,
    loading,
    downloading,
    handleDownloadPdf,
    htmlReport,
  } = useExportPdfReport();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title="Monthly Financial Statement & Audit Report"
        onClose={onClose}
        Icon={<PictureAsPdfIcon sx={{ color: "white" }} />}
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
            bgcolor: "#f8fafc",
            borderRadius: 2,
            border: "1px solid #e2e8f0",
          }}
        >
          <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
            <Box display="flex" alignItems="center" gap={0.75}>
              <CalendarMonthIcon color="primary" fontSize="small" />
              <Typography
                variant="subtitle2"
                fontWeight={700}
                color="primary.main"
              >
                Select Statement Month:
              </Typography>
            </Box>

            <Autocomplete
              options={monthOptions}
              getOptionLabel={(option) => option.label || ""}
              isOptionEqualToValue={(option, val) =>
                option.value === val?.value
              }
              value={selectedOption}
              onChange={handleMonthChange}
              disableClearable
              size="small"
              sx={{ width: { xs: "100%", sm: 280 } }}
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
              label={selectedOption?.label || "Current Month"}
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
              Generating comprehensive financial audit statement for{" "}
              {selectedOption?.label}...
            </Typography>
          </Box>
        ) : htmlReport ? (
          <PDFViewer
            pdfData={new Blob([htmlReport], { type: "text/html" })}
            title={`CW Financial Statement - ${selectedOption?.value}`}
            filename={`CW-Financial-Statement-${selectedOption?.value}.pdf`}
            height="650px"
            onDownload={handleDownloadPdf}
            downloading={downloading}
          />
        ) : (
          <Box py={8} textAlign="center">
            <Typography color="text.secondary">
              Unable to generate statement. Please select another month.
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

ExportPdfDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default React.memo(ExportPdfDialog);
