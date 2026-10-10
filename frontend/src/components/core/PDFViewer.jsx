import React, { useEffect, useState } from "react";
import { Box, CircularProgress, Typography, Button, Paper } from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";

/**
 * PDFViewer component for showing PDF blobs received from backend API.
 *
 * @param {Blob|File|string} pdfData - Blob, File object, or URL representing the PDF
 * @param {string} [title="Document Preview"] - Title displayed above viewer
 * @param {string} [filename="report.pdf"] - Download filename
 * @param {number|string} [height="600px"] - Height of PDF viewer container
 */
const PDFViewer = ({ pdfData, title = "Expense Report PDF", filename = "expense_report.pdf", height = "600px" }) => {
  const [objectUrl, setObjectUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const iframeRef = React.useRef(null);

  useEffect(() => {
    if (!pdfData) return;

    let url = "";
    if (typeof pdfData === "string") {
      url = pdfData;
    } else if (pdfData instanceof Blob || pdfData instanceof File) {
      url = URL.createObjectURL(pdfData);
    }

    setObjectUrl(url);
    setLoading(false);

    return () => {
      if (url && (pdfData instanceof Blob || pdfData instanceof File)) {
        URL.revokeObjectURL(url);
      }
    };
  }, [pdfData]);

  const handleDownload = () => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.focus();
      iframeRef.current.contentWindow.print();
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!objectUrl) {
    return (
      <Paper sx={{ p: 3, textAlign: "center", bgcolor: "background.default" }}>
        <PictureAsPdfIcon sx={{ fontSize: 48, color: "text.secondary", mb: 1 }} />
        <Typography color="text.secondary">No PDF document available to display.</Typography>
      </Paper>
    );
  }

  return (
    <Box display="flex" flexDirection="column" gap={1.5} width="100%">
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" sx={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 1 }}>
          <PictureAsPdfIcon color="error" />
          {title}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<DownloadIcon />}
          onClick={handleDownload}
          sx={{ textTransform: "none" }}
        >
          Download PDF
        </Button>
      </Box>
      <Paper elevation={2} sx={{ overflow: "hidden", borderRadius: 2 }}>
        <iframe
          ref={iframeRef}
          src={objectUrl}
          title={title}
          width="100%"
          height={height}
          style={{ border: "none" }}
        />
      </Paper>
    </Box>
  );
};

export default React.memo(PDFViewer);
