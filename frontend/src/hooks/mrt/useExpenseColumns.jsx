import React, { useState, useMemo } from "react";
import {
  Box,
  Chip,
  IconButton,
  Tooltip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import VisibilityIcon from "@mui/icons-material/Visibility";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloseIcon from "@mui/icons-material/Close";
import dayjs from "dayjs";
import {
  downloadExpenseBillApi,
  uploadExpenseBillApi,
} from "../../services/expense.service";
import PDFViewer from "../../components/core/PDFViewer";
import FileUploaderV2 from "../../components/core/FileUploaderV2";
import AppDialogTitle from "../../components/core/AppDialogTitle";
import { useUI } from "../../context/UIContext";

export const expenseDefaultSorting = [{ id: "id", desc: true }];

export const useExpenseColumns = ({ onDelete, onViewBill, onBillUploaded }) => {
  const { showAlert } = useUI();
  const [activePdf, setActivePdf] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [uploadDialog, setUploadDialog] = useState(null);

  const handleDownloadBill = async (expense) => {
    try {
      const res = await downloadExpenseBillApi(expense.id);
      const mimeType = res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      let filename = expense.bill_original_name || `bill-${expense.id}.pdf`;
      if (mimeType.includes("pdf") && !filename.toLowerCase().endsWith(".pdf")) {
        filename += ".pdf";
      }
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error("Failed to download decrypted bill:", err);
    }
  };

  const handleOpenPdfViewer = async (expense) => {
    if (onViewBill) {
      onViewBill(expense);
      return;
    }
    setPdfLoading(true);
    const title = expense.bill_original_name || expense.name || "Expense Bill Preview";
    setActivePdf({
      open: true,
      id: expense.id,
      title,
      filename: expense.bill_original_name || `bill-${expense.id}.pdf`,
      blob: null,
    });

    try {
      const res = await downloadExpenseBillApi(expense.id);
      const mimeType = res.headers["content-type"] || "application/pdf";
      const blob = new Blob([res.data], { type: mimeType });
      setActivePdf({
        open: true,
        id: expense.id,
        title,
        filename: expense.bill_original_name || `bill-${expense.id}.pdf`,
        blob,
      });
    } catch (err) {
      console.error("Failed to load PDF bill for preview:", err);
      setActivePdf(null);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleClosePdf = () => {
    setActivePdf(null);
  };

  const handleOpenUploadDialog = (expense) => {
    setUploadDialog({
      open: true,
      expense,
      file: null,
      isReady: true,
      uploading: false,
    });
  };

  const handleCloseUploadDialog = () => {
    setUploadDialog(null);
  };

  const handleUploadFileChange = (file) => {
    setUploadDialog((prev) => (prev ? { ...prev, file } : null));
  };

  const handleUploadReadyChange = (isReady) => {
    setUploadDialog((prev) => (prev ? { ...prev, isReady } : null));
  };

  const handleSubmitUpload = async () => {
    if (!uploadDialog?.file || !uploadDialog?.expense) return;
    if (!uploadDialog.isReady) {
      showAlert("Please wait for file processing to complete.", "warning");
      return;
    }

    setUploadDialog((prev) => ({ ...prev, uploading: true }));
    try {
      await uploadExpenseBillApi(uploadDialog.expense.id, uploadDialog.file);
      showAlert("Bill file attached and encrypted successfully!", "success");
      setUploadDialog(null);
      if (onBillUploaded) {
        onBillUploaded();
      }
    } catch (err) {
      showAlert(
        err.response?.data?.message || "Failed to upload bill file.",
        "error"
      );
      setUploadDialog((prev) => (prev ? { ...prev, uploading: false } : null));
    }
  };

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        size: 70,
        sortDescFirst: true,
      },
      {
        accessorKey: "name",
        header: "Expense Name",
        size: 180,
      },
      {
        accessorKey: "amount",
        header: "Amount (₹)",
        size: 130,
        Cell: ({ row }) => (
          <Typography variant="body2" fontWeight={700} color="primary.main">
            ₹{parseFloat(row.original.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </Typography>
        ),
      },
      {
        accessorKey: "Category.name",
        header: "Category",
        size: 150,
        Cell: ({ row }) => (
          <Chip
            label={row.original.Category?.name || "Not Defined"}
            size="small"
            color={row.original.Category?.name ? "primary" : "secondary"}
            variant="outlined"
          />
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 120,
        Cell: ({ row }) => (
          <Chip
            label={row.original.type}
            size="small"
            color={row.original.type === "Fixed" ? "warning" : "info"}
          />
        ),
      },
      {
        accessorKey: "expense_date",
        header: "Expense Date",
        size: 130,
        Cell: ({ row }) => (
          <Typography variant="caption">
            {row.original.expense_date ? dayjs(row.original.expense_date).format("YYYY-MM-DD") : "N/A"}
          </Typography>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 160,
        Cell: ({ row }) => (
          <Box display="flex" alignItems="center" gap={0.5}>
            {row.original.bill_url && (
              <>
                <Tooltip title="View Bill (PDF Viewer)">
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenPdfViewer(row.original)}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download Decrypted Bill">
                  <IconButton
                    size="small"
                    color="secondary"
                    onClick={() => handleDownloadBill(row.original)}
                  >
                    <DownloadIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </>
            )}

            {/* Option to add or update bill file */}
            <Tooltip
              title={
                row.original.bill_url
                  ? "Update / Replace Bill File"
                  : "Add Bill File"
              }
            >
              <IconButton
                size="small"
                color="info"
                onClick={() => handleOpenUploadDialog(row.original)}
              >
                <UploadFileIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete Expense">
              <IconButton size="small" color="error" onClick={() => onDelete(row.original)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            {/* Modal for adding/updating bill file using FileUploaderV2 */}
            {uploadDialog?.open && uploadDialog.expense?.id === row.original.id && (
              <Dialog
                open={uploadDialog.open}
                onClose={handleCloseUploadDialog}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
              >
                <AppDialogTitle
                  title={
                    uploadDialog.expense.bill_url
                      ? `Update Attached Bill - ${uploadDialog.expense.name}`
                      : `Attach Bill File - ${uploadDialog.expense.name}`
                  }
                  onClose={handleCloseUploadDialog}
                  Icon={<UploadFileIcon sx={{ color: "white" }} />}
                />
                <DialogContent dividers sx={{ p: 2.5 }}>
                  {uploadDialog.expense.bill_url && (
                    <Box
                      mb={2}
                      p={1.5}
                      bgcolor="#f1f5f9"
                      borderRadius={2}
                      border="1px solid #e2e8f0"
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color="text.secondary"
                        display="block"
                      >
                        Currently Attached File:
                      </Typography>
                      <Typography variant="body2" fontWeight={700} color="primary.main">
                        {uploadDialog.expense.bill_original_name || "Existing Bill"}
                      </Typography>
                    </Box>
                  )}

                  <Typography
                    variant="body2"
                    fontWeight={600}
                    color="text.primary"
                    mb={1.5}
                  >
                    {uploadDialog.expense.bill_url
                      ? "Select a new file to replace the existing bill:"
                      : "Upload a receipt or invoice file for this expense:"}
                  </Typography>

                  <FileUploaderV2
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    maxSizeMB={5}
                    label="Drag & drop bill or click to browse (PDF, JPG, PNG up to 5MB)"
                    onFileChange={handleUploadFileChange}
                    onReadyChange={handleUploadReadyChange}
                  />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                  <Button
                    onClick={handleCloseUploadDialog}
                    variant="outlined"
                    color="secondary"
                    disabled={uploadDialog.uploading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitUpload}
                    variant="contained"
                    color="primary"
                    disabled={
                      !uploadDialog.file ||
                      !uploadDialog.isReady ||
                      uploadDialog.uploading
                    }
                    startIcon={
                      uploadDialog.uploading ? (
                        <CircularProgress size={16} color="inherit" />
                      ) : null
                    }
                  >
                    {uploadDialog.uploading
                      ? "Uploading..."
                      : uploadDialog.expense.bill_url
                      ? "Update Bill"
                      : "Attach Bill"}
                  </Button>
                </DialogActions>
              </Dialog>
            )}

            {/* Embedded PDF Viewer Modal for the selected row */}
            {activePdf?.open && activePdf.id === row.original.id && (
              <Dialog
                open={activePdf.open}
                onClose={handleClosePdf}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
              >
                <AppDialogTitle
                  title={activePdf.title || "Bill Preview"}
                  onClose={handleClosePdf}
                  Icon={<VisibilityIcon sx={{ color: "white" }} />}
                />
                <DialogContent dividers sx={{ p: 2 }}>
                  {pdfLoading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" p={6}>
                      <CircularProgress color="primary" />
                    </Box>
                  ) : activePdf.blob ? (
                    <PDFViewer
                      pdfData={activePdf.blob}
                      title={activePdf.title}
                      filename={activePdf.filename}
                      height="650px"
                    />
                  ) : (
                    <Typography color="text.secondary" align="center" p={4}>
                      Unable to load document preview.
                    </Typography>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </Box>
        ),
      },
    ],
    [onDelete, activePdf, pdfLoading, uploadDialog]
  );
};
