import React from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Stack,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { useExpense } from '../../hooks/useExpense';
import { useExpenseColumns, expenseDefaultSorting } from '../../hooks/mrt/useExpenseColumns';
import ConfirmationDialog from '../../components/core/ConfirmationDialog';
import CreateExpenseDialog from '../../components/dialog/CreateExpenseDialog';
import BulkExpenseDialog from '../../components/dialog/BulkExpenseDialog';
import useAppCss from '../../hooks/css/useAppCss';

const ExpenseManager = () => {
  const { GlobalTableCss, GlobalPaperCss } = useAppCss();
  const {
    expenses,
    categories,
    loading,
    // Pagination & MRT state
    pagination,
    setPagination,
    sorting,
    setSorting,
    columnFilters,
    setColumnFilters,
    searchText,
    setSearchText,
    totalRecords,
    // Period & Budget Filtering
    selectedBudgetId,
    selectedMonth,
    availableBudgets,
    activeBudget,
    handleBudgetChange,
    handleMonthChange,
    // Single Expense Dialog
    modalOpen,
    isEdit,
    editingExpense,
    formData,
    billFile,
    setBillFile,
    setIsBillReady,
    setCaptchaId,
    errors,
    handleChange,
    handleOpenModal,
    handleOpenEditModal,
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

  const isMobile = useMediaQuery((theme) => theme.breakpoints.down('md'));

  const columns = useExpenseColumns({
    onEdit: handleOpenEditModal,
    onDelete: requestDeleteConfirmation,
    onBillUploaded: fetchData,
  });

  const table = useMaterialReactTable({
    columns,
    data: expenses,
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    rowCount: totalRecords,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnFiltersChange: (updater) => {
      setColumnFilters(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    onGlobalFilterChange: (updater) => {
      setSearchText(updater);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    },
    state: {
      isLoading: loading,
      pagination,
      sorting,
      columnFilters,
      globalFilter: searchText,
    },
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
        {/* Header Title */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <ReceiptLongIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Expense Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {activeBudget
                ? `Active Budget Period: ${activeBudget.from_date} to ${activeBudget.to_date} (${totalRecords} record${totalRecords === 1 ? '' : 's'})`
                : `Track and log individual or bulk expenditure items (${totalRecords} record${totalRecords === 1 ? '' : 's'})`}
            </Typography>
          </Box>
        </Box>

        {/* Action Buttons - Left Aligned above Filter Period, Responsive */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="flex-end"
          spacing={1.5}
          mb={2}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            color="primary"
            startIcon={<UploadFileIcon />}
            onClick={handleOpenBulkModal}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isMobile ? 'Bulk Upload' : 'Bulk Upload Expenses'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {isMobile ? 'Add' : 'Add New Expense'}
          </Button>
        </Stack>

        {/* Period / Budget Filter Toolbar */}
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          mb={2}
          p={1.5}
          bgcolor="#f8fafc"
          borderRadius={2}
          border="1px solid #e2e8f0"
        >
          <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
            <Typography variant="body2" fontWeight={600} color="text.secondary">
              Filter Period:
            </Typography>
            <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 300 } }}>
              <InputLabel id="expense-budget-select-label">Allocated Budget / Period</InputLabel>
              <Select
                labelId="expense-budget-select-label"
                id="expense-budget-select"
                value={
                  selectedBudgetId || activeBudget?.id || (availableBudgets.length > 0 ? availableBudgets[0].id : 'all')
                }
                label="Allocated Budget / Period"
                onChange={handleBudgetChange}
                sx={{ bgcolor: '#ffffff', borderRadius: 1.5 }}
              >
                {availableBudgets.map((b) => (
                  <MenuItem key={b.id} value={b.id}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" gap={1}>
                      <Typography variant="body2" fontWeight={b.isActive ? 700 : 500}>
                        {b.from_date} to {b.to_date}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.75}>
                        <Typography variant="caption" color="text.secondary">
                          ₹{b.amount.toLocaleString('en-IN')}
                        </Typography>
                        {b.isActive && (
                          <Chip
                            label="Active"
                            color="success"
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.65rem',
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                  </MenuItem>
                ))}
                <MenuItem value="month">
                  <Typography variant="body2" color="primary.main" fontWeight={600}>
                    📅 Custom Calendar Month...
                  </Typography>
                </MenuItem>
                <MenuItem value="all">
                  <Typography variant="body2" color="text.primary" fontWeight={600}>
                    🌐 All Time (All Expenses)
                  </Typography>
                </MenuItem>
              </Select>
            </FormControl>

            {selectedBudgetId === 'month' && (
              <TextField
                type="month"
                label="Select Month"
                size="small"
                value={selectedMonth}
                onChange={handleMonthChange}
                sx={{ minWidth: { xs: '100%', sm: 180 }, bgcolor: '#ffffff' }}
                InputLabelProps={{ shrink: true }}
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            <Chip
              label={`Total Records: ${totalRecords}`}
              color="primary"
              variant="outlined"
              size="small"
              sx={{ fontWeight: 600 }}
            />
          </Box>
        </Stack>

        <MaterialReactTable table={table} />

        {/* Create / Edit Single Expense Dialog */}
        <CreateExpenseDialog
          open={modalOpen}
          onClose={handleCloseModal}
          isEdit={isEdit}
          editingExpense={editingExpense}
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
          onCancel={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        />
      </Paper>
    </LocalizationProvider>
  );
};

export default ExpenseManager;
