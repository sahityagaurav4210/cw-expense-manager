import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useMediaQuery,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useExpense } from "../../hooks/useExpense";
import {
  useExpenseColumns,
  expenseDefaultSorting,
} from "../../hooks/mrt/useExpenseColumns";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import CreateExpenseDialog from "../../components/dialog/CreateExpenseDialog";
import BulkExpenseDialog from "../../components/dialog/BulkExpenseDialog";
import useAppCss from "../../hooks/css/useAppCss";

const ExpenseManager = () => {
  const { GlobalTableCss, GlobalPaperCss } = useAppCss();
  const {
    expenses,
    categories,
    loading,
    // Single Expense Dialog
    modalOpen,
    formData,
    billFile,
    setBillFile,
    setIsBillReady,
    setCaptchaId,
    errors,
    handleChange,
    handleOpenModal,
    handleCloseModal,
    handleKeyDownNumber,
    requestCreateConfirmation,
    // Bulk Expense Dialog
    bulkModalOpen,
    bulkFile,
    isBulkFileReady,
    setIsBulkFileReady,
    isPreviewLoading,
    bulkParsedRows,
    bulkValidationErrors,
    bulkParseError,
    bulkCaptcha,
    setBulkCaptchaId,
    bulkErrors,
    handleOpenBulkModal,
    handleCloseBulkModal,
    handleBulkFileChange,
    handleClearBulkFile,
    handleBulkCaptchaChange,
    handleDownloadBulkTemplate,
    requestBulkCreateConfirmation,
    // Shared Confirmation & Table Actions
    confirmDialog,
    setConfirmDialog,
    requestDeleteConfirmation,
    executeConfirmedAction,
    fetchData,
  } = useExpense();

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down("md"));

  const columns = useExpenseColumns({
    onDelete: requestDeleteConfirmation,
    onBillUploaded: fetchData,
  });

  const table = useMaterialReactTable({
    columns,
    data: expenses,
    initialState: {
      sorting: expenseDefaultSorting,
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
        <Box display="flex" alignItems="center" gap={1} mb={1}>
          <ReceiptLongIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Expense Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and log individual or bulk expenditure items
            </Typography>
          </Box>
        </Box>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          spacing={1.5}
          mb={1}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenBulkModal}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {isMobile ? "Bulk Upload" : "Bulk Upload Expenses"}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            {isMobile ? "Add" : "Add New Expense"}
          </Button>
        </Stack>

        <MaterialReactTable table={table} />

        {/* Create Single Expense Dialog */}
        <CreateExpenseDialog
          open={modalOpen}
          onClose={handleCloseModal}
          formData={formData}
          errors={errors}
          categories={categories}
          billFile={billFile}
          setBillFile={setBillFile}
          setIsBillReady={setIsBillReady}
          setCaptchaId={setCaptchaId}
          handleChange={handleChange}
          handleKeyDownNumber={handleKeyDownNumber}
          onSubmit={requestCreateConfirmation}
        />

        {/* Bulk Expense Creation Dialog */}
        <BulkExpenseDialog
          open={bulkModalOpen}
          onClose={handleCloseBulkModal}
          bulkFile={bulkFile}
          isBulkFileReady={isBulkFileReady}
          setIsBulkFileReady={setIsBulkFileReady}
          isPreviewLoading={isPreviewLoading}
          bulkParsedRows={bulkParsedRows}
          bulkValidationErrors={bulkValidationErrors}
          bulkParseError={bulkParseError}
          bulkCaptcha={bulkCaptcha}
          setBulkCaptchaId={setBulkCaptchaId}
          bulkErrors={bulkErrors}
          handleBulkFileChange={handleBulkFileChange}
          handleClearBulkFile={handleClearBulkFile}
          handleBulkCaptchaChange={handleBulkCaptchaChange}
          handleDownloadBulkTemplate={handleDownloadBulkTemplate}
          onSubmit={requestBulkCreateConfirmation}
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

export default ExpenseManager;
