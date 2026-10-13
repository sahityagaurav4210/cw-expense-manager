import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Paper,
  Alert,
  AlertTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import DownloadIcon from "@mui/icons-material/Download";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CaptchaComponent from "../core/CaptchaComponent";
import PaperComponent from "../core/PaperComponent";
import FileUploaderV2 from "../core/FileUploaderV2";
import AppDialogTitle from "../core/AppDialogTitle";

const BulkExpenseDialog = ({
  open,
  onClose,
  bulkFile,
  isBulkFileReady,
  setIsBulkFileReady,
  isPreviewLoading,
  bulkParsedRows = [],
  bulkValidationErrors = [],
  bulkParseError,
  bulkCaptcha,
  setBulkCaptchaId,
  bulkErrors = {},
  handleBulkFileChange,
  handleClearBulkFile,
  handleBulkCaptchaChange,
  handleDownloadBulkTemplate,
  onSubmit,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title="Bulk Expense Creation (Excel Template)"
        onClose={onClose}
        Icon={<UploadFileIcon sx={{ color: "white" }} />}
      />
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2.5}>
            {/* Template Guidelines & Download Banner */}
            <Box
              p={2}
              borderRadius={2}
              bgcolor="#f8fafc"
              border="1px solid #cbd5e1"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              flexWrap="wrap"
              gap={1.5}
            >
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="primary.main"
                >
                  Official Bulk Expense Creation Template (.xlsx)
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  Columns: <strong>Sr. No.</strong> |{" "}
                  <strong>Expense Name</strong> (3–100 chars) |{" "}
                  <strong>Expense Amount</strong> (&ge; 1) |{" "}
                  <strong>Expense Category</strong> (Optional, defaults to{" "}
                  <em>Others</em>) | <strong>Expense Type</strong> (Fixed /
                  Variable) | <strong>Expense Date</strong> (DD-MM-YYYY or
                  YYYY-MM-DD)
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadIcon />}
                onClick={handleDownloadBulkTemplate}
                sx={{ textTransform: "none", fontWeight: 700 }}
              >
                Download Template
              </Button>
            </Box>

            {/* Excel File Uploader */}
            <Box>
              <Typography
                variant="body2"
                fontWeight={600}
                color="primary"
                mb={1}
              >
                Upload Filled Template (.xlsx up to 5MB) *
              </Typography>
              <FileUploaderV2
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                maxSizeMB={5}
                label="Drag & drop BULK EXPENSE CREATION TEMPLATE.xlsx or click to browse"
                onFileChange={handleBulkFileChange}
                onReadyChange={(ready) => setIsBulkFileReady(ready)}
              />
              {bulkFile && (
                <Box display="flex" justifyContent="flex-end" mt={0.5}>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleClearBulkFile}
                  >
                    Clear Selected Template
                  </Button>
                </Box>
              )}
              {bulkErrors.file && (
                <Typography variant="caption" color="error" fontWeight={600}>
                  {bulkErrors.file}
                </Typography>
              )}
            </Box>

            {/* Loading Indicator while data preview is being prepared */}
            {isPreviewLoading && (
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                gap={2}
                p={2.5}
                borderRadius={2}
                bgcolor="#eff6ff"
                border="1px solid #93c5fd"
              >
                <CircularProgress size={24} color="primary" />
                <Typography
                  variant="body2"
                  fontWeight={600}
                  color="primary.main"
                >
                  Please wait, your data preview is loading...
                </Typography>
              </Box>
            )}

            {/* Template Parse Error */}
            {!isPreviewLoading && bulkParseError && (
              <Alert severity="error">
                <AlertTitle>Template Format Error</AlertTitle>
                {bulkParseError}
              </Alert>
            )}

            {/* Validation Errors List */}
            {!isPreviewLoading && bulkValidationErrors.length > 0 && (
              <Alert severity="error">
                <AlertTitle>
                  Data Validation Failed ({bulkValidationErrors.length} error
                  {bulkValidationErrors.length > 1 ? "s" : ""} found)
                </AlertTitle>
                <Box
                  component="ul"
                  sx={{ m: 0, pl: 2.5, maxHeight: 150, overflowY: "auto" }}
                >
                  {bulkValidationErrors.map((err, idx) => (
                    <li key={idx}>
                      <Typography variant="caption" fontWeight={600}>
                        {err.message}
                      </Typography>
                    </li>
                  ))}
                </Box>
              </Alert>
            )}

            {/* Validation Success Summary */}
            {!isPreviewLoading &&
              bulkParsedRows.length > 0 &&
              bulkValidationErrors.length === 0 &&
              !bulkParseError && (
                <Alert severity="success">
                  <AlertTitle>
                    All Data Columns Validated Successfully
                  </AlertTitle>
                  {bulkParsedRows.length} expense record(s) validated and ready
                  to be inserted in one go.
                  {bulkParsedRows.some((r) => r.isDefaultCategory) && (
                    <Typography variant="caption" display="block" mt={0.5}>
                      Note: Blank Expense Category values have been
                      automatically set to <strong>Others</strong>.
                    </Typography>
                  )}
                </Alert>
              )}

            {/* Preview Table of Parsed Rows */}
            {!isPreviewLoading && bulkParsedRows.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight={700}
                  color="primary.main"
                  mb={1}
                >
                  Template Data Preview ({bulkParsedRows.length} Row
                  {bulkParsedRows.length > 1 ? "s" : ""})
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{ maxHeight: 240, borderRadius: 2 }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Sr. No.
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Expense Name
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Amount (₹)
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Category
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Type
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Expense Date
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, bgcolor: "#f1f5f9" }}>
                          Validation
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkParsedRows.map((row) => (
                        <TableRow
                          key={row.excelRowNumber}
                          sx={{
                            bgcolor: row.isValid ? "inherit" : "#fef2f2",
                          }}
                        >
                          <TableCell>{row.srNo}</TableCell>
                          <TableCell>{row.name || "-"}</TableCell>
                          <TableCell>
                            {row.amount && !isNaN(Number(row.amount))
                              ? `₹${Number(row.amount).toLocaleString("en-IN", {
                                  minimumFractionDigits: 2,
                                })}`
                              : row.amount || "-"}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={
                                row.isDefaultCategory
                                  ? `${row.category} (Default)`
                                  : row.category
                              }
                              size="small"
                              color={
                                row.isDefaultCategory ? "secondary" : "primary"
                              }
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={row.type || "N/A"}
                              size="small"
                              color={
                                row.type === "Fixed"
                                  ? "warning"
                                  : row.type === "Variable"
                                    ? "info"
                                    : "error"
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {row.normalizedDate || row.expenseDate || "-"}
                          </TableCell>
                          <TableCell>
                            {row.isValid ? (
                              <Chip
                                icon={<CheckCircleOutlineIcon />}
                                label="Valid"
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                icon={<ErrorOutlineIcon />}
                                label="Invalid"
                                size="small"
                                color="error"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* CAPTCHA Verification */}
            <CaptchaComponent
              value={bulkCaptcha}
              onChange={handleBulkCaptchaChange}
              onCaptchaIdChange={setBulkCaptchaId}
              error={Boolean(bulkErrors.captcha)}
              helperText={bulkErrors.captcha}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={
              !bulkFile ||
              !isBulkFileReady ||
              isPreviewLoading ||
              Boolean(bulkParseError) ||
              bulkValidationErrors.length > 0 ||
              bulkParsedRows.length === 0
            }
          >
            Upload & Create Bulk Expenses
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(BulkExpenseDialog);
