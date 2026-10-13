import React from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Tabs,
  Tab,
  Stack,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import ContactsIcon from "@mui/icons-material/Contacts";
import StarIcon from "@mui/icons-material/Star";
import {
  MaterialReactTable,
  useMaterialReactTable,
} from "material-react-table";
import { useContacts } from "../../../hooks/useContacts";
import {
  useContactColumns,
  contactDefaultSorting,
} from "../../../hooks/mrt/useContactColumns";
import CreateContactDialog from "../../../components/dialog/CreateContactDialog";
import EditContactDialog from "../../../components/dialog/EditContactDialog";
import ConfirmationDialog from "../../../components/core/ConfirmationDialog";
import useAppCss from "../../../hooks/css/useAppCss";

const CATEGORY_TABS = [
  "ALL",
  "Friend",
  "Family",
  "Colleague",
  "Business",
  "Client",
  "Vendor",
  "Other",
];

const ContactsManager = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { GlobalTableCss, GlobalPaperCss } = useAppCss();

  const {
    contacts,
    loading,
    filterCategory,
    setFilterCategory,
    // Create Modal
    createModalOpen,
    handleOpenCreateModal,
    handleCloseCreateModal,
    handleSubmitCreate,
    // Edit Modal
    editModalOpen,
    handleOpenEditModal,
    handleCloseEditModal,
    handleSubmitEdit,
    // Form & Files
    formData,
    errors,
    photoPreview,
    setCaptchaId,
    handleChange,
    handleFileChange,
    handleRemovePhoto,
    // Actions & Confirmations
    confirmDialog,
    setConfirmDialog,
    requestDeleteConfirmation,
    executeConfirmedDelete,
    handleToggleFavorite,
  } = useContacts();

  const columns = useContactColumns({
    onEdit: handleOpenEditModal,
    onDelete: requestDeleteConfirmation,
    onToggleFavorite: handleToggleFavorite,
  });

  const table = useMaterialReactTable({
    columns,
    data: contacts,
    initialState: {
      sorting: contactDefaultSorting,
    },
    state: { isLoading: loading },
    enableColumnActions: true,
    enableColumnFilters: true,
    enablePagination: true,
    enableSorting: true,
    muiTablePaperProps: { elevation: 2, sx: { borderRadius: 3 } },
    ...GlobalTableCss,
  });

  const favoritesCount = contacts.filter((c) => c.is_favorite).length;

  return (
    <Paper variant="elevation" elevation={3} sx={GlobalPaperCss}>
      {/* Header Row */}
      <Box display="flex" alignItems="center" gap={1.2}>
        <ContactsIcon color="primary" sx={{ fontSize: 34 }} />
        <Box>
          <Typography variant="h5" fontWeight={700} color="primary.main">
            Contacts Directory
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your personal and business contacts for debts, lending, and
            fast lookup
          </Typography>
        </Box>
      </Box>

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        flexWrap="wrap"
        my={1}
        justifyContent="flex-end"
        gap={1}
      >
        <Chip
          icon={<StarIcon sx={{ color: "#f59e0b !important" }} />}
          label={`${favoritesCount} Favorites`}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Chip
          label={`${contacts.length} Total`}
          color="primary"
          size="small"
          variant="outlined"
          sx={{ fontWeight: 600 }}
        />
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAddIcon />}
          onClick={handleOpenCreateModal}
          sx={{ fontWeight: 700, textTransform: "none" }}
        >
          Add Contact
        </Button>
      </Stack>

      {/* Category Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={filterCategory}
          onChange={(e, val) => setFilterCategory(val)}
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
        >
          {CATEGORY_TABS.map((tab) => (
            <Tab
              key={tab}
              label={tab === "ALL" ? "All Contacts" : tab}
              value={tab}
              sx={{ fontWeight: 700, textTransform: "none" }}
            />
          ))}
        </Tabs>
      </Box>

      {/* MRT Table */}
      <MaterialReactTable table={table} />

      {/* Create Contact Dialog */}
      <CreateContactDialog
        open={createModalOpen}
        onClose={handleCloseCreateModal}
        formData={formData}
        errors={errors}
        photoPreview={photoPreview}
        setCaptchaId={setCaptchaId}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        handleRemovePhoto={handleRemovePhoto}
        onSubmit={handleSubmitCreate}
      />

      {/* Edit Contact Dialog */}
      <EditContactDialog
        open={editModalOpen}
        onClose={handleCloseEditModal}
        formData={formData}
        errors={errors}
        photoPreview={photoPreview}
        setCaptchaId={setCaptchaId}
        handleChange={handleChange}
        handleFileChange={handleFileChange}
        handleRemovePhoto={handleRemovePhoto}
        onSubmit={handleSubmitEdit}
      />

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialog.open}
        heading={confirmDialog.heading}
        text={confirmDialog.text}
        loading={confirmDialog.loading}
        onConfirm={executeConfirmedDelete}
        onCancel={() =>
          setConfirmDialog({
            open: false,
            heading: "",
            text: "",
            targetContact: null,
            loading: false,
          })
        }
      />
    </Paper>
  );
};

export default React.memo(ContactsManager);
