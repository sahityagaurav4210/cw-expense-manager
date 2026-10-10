import React from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CategoryIcon from "@mui/icons-material/Category";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useCategory } from "../../hooks/useCategory";
import { useCategoryColumns } from "../../hooks/mrt/useCategoryColumns";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import PaperComponent from "../../components/core/PaperComponent";
import useAppCss from "../../hooks/css/useAppCss";

const CategoryManager = () => {
  const {
    categories,
    loading,
    modalOpen,
    formData,
    setCaptchaId,
    errors,
    confirmDialog,
    handleChange,
    handleOpenCreateModal,
    handleCloseModal,
    requestCreateConfirmation,
    requestToggleConfirmation,
    requestDeleteConfirmation,
    executeConfirmedAction,
  } = useCategory();

  const { GlobalTableCss, GlobalPaperCss } = useAppCss();

  const columns = useCategoryColumns({
    onToggleActive: requestToggleConfirmation,
    onDelete: requestDeleteConfirmation,
  });

  const table = useMaterialReactTable({
    columns,
    data: categories,
    state: { isLoading: loading },
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaperProps: { elevation: 2, sx: { borderRadius: 3 } },
    ...GlobalTableCss,
  });

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        gap={2}
        mb={3}
      >
        <Box display="flex" alignItems="center" gap={1.5}>
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Category Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage expense categories and status controls
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddIcon fontSize="small" />}
          onClick={handleOpenCreateModal}
          sx={{ textTransform: "none", fontWeight: 700 }}
        >
          Add New Category
        </Button>
      </Box>

      <MaterialReactTable table={table} />

      {/* Add Category Dialog */}
      <Dialog
        open={modalOpen}
        onClose={handleCloseModal}
        maxWidth="xs"
        fullWidth
        PaperComponent={PaperComponent}
      >
        <DialogTitle sx={{ fontWeight: 700, color: "primary.main" }}>
          Create Category Master
        </DialogTitle>
        <Box component="form" onSubmit={requestCreateConfirmation}>
          <DialogContent dividers>
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Category Name"
                type="text"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange("name")}
                error={Boolean(errors.name)}
                helperText={
                  errors.name ||
                  "Max 100 chars (letters, numbers, -, _, space, /)"
                }
                inputProps={{ maxLength: 100 }}
              />

              <CaptchaComponent
                value={formData.captchaText}
                onChange={handleChange("captchaText")}
                onCaptchaIdChange={setCaptchaId}
                error={Boolean(errors.captchaText)}
                helperText={errors.captchaText}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={handleCloseModal}
              variant="outlined"
              color="secondary"
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" color="primary">
              Save Category
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Reusable Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        isLoading={confirmDialog.loading}
        heading={confirmDialog.heading}
        text={confirmDialog.text}
        onSuccess={executeConfirmedAction}
        onCancel={() =>
          confirmDialog.setConfirmDialog &&
          confirmDialog.setConfirmDialog({ open: false })
        }
      />
    </Paper>
  );
};

export default React.memo(CategoryManager);
