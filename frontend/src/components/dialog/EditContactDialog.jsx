import React, { useRef } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  IconButton,
  FormControlLabel,
  Checkbox,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PaperComponent from "../core/PaperComponent";
import AppDialogTitle from "../core/AppDialogTitle";
import CaptchaComponent from "../core/CaptchaComponent";

const CONTACT_CATEGORIES = [
  "Friend",
  "Family",
  "Colleague",
  "Business",
  "Client",
  "Vendor",
  "Other",
];

const EditContactDialog = ({
  open,
  onClose,
  formData,
  errors = {},
  photoPreview,
  setCaptchaId,
  handleChange,
  handleFileChange,
  handleRemovePhoto,
  onSubmit,
}) => {
  const fileInputRef = useRef(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title="Edit Contact"
        onClose={onClose}
        Icon={<EditIcon sx={{ color: "white" }} />}
      />
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Avatar / Profile Photo Upload */}
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              p={1.5}
              borderRadius={2}
              bgcolor="#f8fafc"
              border="1px dashed #cbd5e1"
            >
              <Avatar
                src={photoPreview}
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: "primary.main",
                  fontSize: 24,
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                {formData.name ? formData.name.trim().charAt(0).toUpperCase() : "?"}
              </Avatar>

              <Box flex={1}>
                <Typography variant="subtitle2" fontWeight={700}>
                  Profile Photo
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Update or remove contact profile picture
                </Typography>

                <Box display="flex" alignItems="center" gap={1} mt={0.8}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileChange}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<PhotoCameraIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    sx={{ textTransform: "none", fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    Change Photo
                  </Button>

                  {photoPreview && (
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => {
                        handleRemovePhoto();
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Name & Category */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={7}>
                <TextField
                  label="Contact Name *"
                  type="text"
                  fullWidth
                  required
                  value={formData.name || ""}
                  onChange={handleChange("name")}
                  error={Boolean(errors.name)}
                  helperText={errors.name || "Full name"}
                  inputProps={{ minLength: 2, maxLength: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  label="Category"
                  fullWidth
                  value={formData.category || "Other"}
                  onChange={handleChange("category")}
                  error={Boolean(errors.category)}
                  helperText={errors.category || "Group / Relation"}
                >
                  {CONTACT_CATEGORIES.map((cat) => (
                    <MenuItem key={cat} value={cat}>
                      {cat}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {/* Phone & Email */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Phone Number *"
                  type="tel"
                  fullWidth
                  required
                  value={formData.phone || ""}
                  onChange={handleChange("phone")}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone}
                  inputProps={{ minLength: 7, maxLength: 20 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Email Address (Optional)"
                  type="email"
                  fullWidth
                  value={formData.email || ""}
                  onChange={handleChange("email")}
                  error={Boolean(errors.email)}
                  helperText={errors.email}
                  inputProps={{ maxLength: 150 }}
                />
              </Grid>
            </Grid>

            {/* Company & Job Title */}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Company / Organization (Optional)"
                  type="text"
                  fullWidth
                  value={formData.company || ""}
                  onChange={handleChange("company")}
                  error={Boolean(errors.company)}
                  helperText={errors.company}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Designation / Job Title (Optional)"
                  type="text"
                  fullWidth
                  value={formData.job_title || ""}
                  onChange={handleChange("job_title")}
                  error={Boolean(errors.job_title)}
                  helperText={errors.job_title}
                  inputProps={{ maxLength: 100 }}
                />
              </Grid>
            </Grid>

            {/* Address */}
            <TextField
              label="Address / Location (Optional)"
              type="text"
              fullWidth
              value={formData.address || ""}
              onChange={handleChange("address")}
              error={Boolean(errors.address)}
              helperText={errors.address}
              inputProps={{ maxLength: 255 }}
            />

            {/* Notes */}
            <TextField
              label="Notes / Description (Optional)"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.notes || ""}
              onChange={handleChange("notes")}
              error={Boolean(errors.notes)}
              helperText={errors.notes}
              inputProps={{ maxLength: 255 }}
            />

            {/* Star as Favorite */}
            <FormControlLabel
              control={
                <Checkbox
                  checked={Boolean(formData.is_favorite)}
                  onChange={(e) =>
                    handleChange("is_favorite")({
                      target: { value: e.target.checked },
                    })
                  }
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600}>
                  ⭐ Mark as favorite contact (pinned to top)
                </Typography>
              }
            />

            {/* CAPTCHA */}
            {setCaptchaId && (
              <CaptchaComponent
                value={formData.captchaText || ""}
                onChange={handleChange("captchaText")}
                onCaptchaIdChange={setCaptchaId}
                error={Boolean(errors.captchaText)}
                helperText={errors.captchaText}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary" sx={{ fontWeight: 700 }}>
            Update Contact
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(EditContactDialog);
