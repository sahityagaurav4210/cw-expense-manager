import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Avatar,
  Typography,
} from "@mui/material";
import HandshakeIcon from "@mui/icons-material/Handshake";
import { DatePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";
import CaptchaComponent from "../core/CaptchaComponent";
import PaperComponent from "../core/PaperComponent";
import AppDialogTitle from "../core/AppDialogTitle";
import { getContactsListApi } from "../../services/contact.service";

const CreateDebtDialog = ({
  open,
  onClose,
  formData,
  errors = {},
  setCaptchaId,
  handleChange,
  handleKeyDownNumber,
  onSubmit,
}) => {
  const isLent = formData.type === "LENT";
  const [contacts, setContacts] = useState([]);
  const [selectedContactMode, setSelectedContactMode] = useState("OTHERS");

  // Fetch lightweight contacts list when dialog opens
  useEffect(() => {
    if (open) {
      getContactsListApi()
        .then((res) => {
          const list = res.data || [];
          setContacts(list);

          // Check if current contact_info matches any contact
          if (formData.contact_info) {
            const matched = list.find(
              (c) =>
                c.phone === formData.contact_info ||
                c.email === formData.contact_info
            );
            if (matched) {
              setSelectedContactMode(
                matched.phone || matched.email || String(matched.id)
              );
              return;
            }
          }
          setSelectedContactMode("OTHERS");
        })
        .catch(() => {
          setContacts([]);
          setSelectedContactMode("OTHERS");
        });
    }
  }, [open, formData.contact_info]);

  const handleContactSelectChange = (e) => {
    const val = e.target.value;
    setSelectedContactMode(val);

    if (val === "OTHERS") {
      // User chose Others; existing flow continues
      return;
    }

    const matched = contacts.find(
      (c) =>
        (c.phone && c.phone === val) ||
        (c.email && c.email === val) ||
        String(c.id) === val
    );

    if (matched) {
      // Pass their email or phone number to the backend
      const backendVal = matched.phone || matched.email || "";
      handleChange("contact_info")({ target: { value: backendVal } });

      // Auto-fill person_name if currently empty
      if (!formData.person_name || formData.person_name.trim() === "") {
        handleChange("person_name")({ target: { value: matched.name } });
      }
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperComponent={PaperComponent}
    >
      <AppDialogTitle
        title={
          isLent
            ? "Record Money Lent (Receivable)"
            : "Record Money Borrowed (Payable)"
        }
        onClose={onClose}
        Icon={<HandshakeIcon sx={{ color: "white" }} />}
      />
      <Box component="form" onSubmit={onSubmit}>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2}>
            {/* Transaction Type */}
            <TextField
              select
              label="Record Type *"
              fullWidth
              required
              value={formData.type}
              onChange={handleChange("type")}
              error={Boolean(errors.type)}
              helperText={
                errors.type ||
                (isLent
                  ? "Money Lent: Someone owes you money (Receivable Asset)"
                  : "Money Borrowed: You owe someone money (Payable Liability)")
              }
            >
              <MenuItem value="LENT">Money Lent (I am Owed)</MenuItem>
              <MenuItem value="BORROWED">Money Borrowed (I Owe)</MenuItem>
            </TextField>

            {/* Person / Entity Name */}
            <TextField
              label={isLent ? "Borrower Name *" : "Lender Name *"}
              type="text"
              fullWidth
              required
              value={formData.person_name}
              onChange={handleChange("person_name")}
              error={Boolean(errors.person_name)}
              helperText={
                errors.person_name || "3–100 chars (e.g., Rahul Sharma)"
              }
              inputProps={{ minLength: 3, maxLength: 100 }}
            />

            {/* Contact Number / Email Field */}
            <TextField
              select
              label="Contact Number / Email"
              fullWidth
              value={selectedContactMode}
              onChange={handleContactSelectChange}
              error={Boolean(errors.contact_info)}
              helperText={
                errors.contact_info ||
                (selectedContactMode === "OTHERS"
                  ? "Enter contact number/email manually below"
                  : "Contact details will be passed to backend")
              }
              SelectProps={{
                renderValue: (val) => {
                  if (val === "OTHERS") return "Others (Enter Manually)";
                  const c = contacts.find(
                    (item) =>
                      (item.phone && item.phone === val) ||
                      (item.email && item.email === val) ||
                      String(item.id) === val
                  );
                  return c ? c.name : "Others (Enter Manually)";
                },
              }}
            >
              <MenuItem value="OTHERS">
                <em>Others (Enter Manually)</em>
              </MenuItem>
              {contacts.map((c) => {
                const itemVal = c.phone || c.email || String(c.id);
                return (
                  <MenuItem key={c.id} value={itemVal}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar
                        src={c.profile_photo}
                        sx={{
                          width: 24,
                          height: 24,
                          fontSize: 12,
                          bgcolor: "primary.main",
                        }}
                      >
                        {c.name ? c.name.charAt(0).toUpperCase() : "?"}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>
                        {c.name}
                      </Typography>
                      {(c.phone || c.email) && (
                        <Typography variant="caption" color="text.secondary">
                          ({c.phone || c.email})
                        </Typography>
                      )}
                    </Box>
                  </MenuItem>
                );
              })}
            </TextField>

            {/* When Others is selected, show manual contact info input (existing flow) */}
            {selectedContactMode === "OTHERS" && (
              <TextField
                label="Manual Contact Number / Email (Optional)"
                type="text"
                fullWidth
                value={formData.contact_info}
                onChange={handleChange("contact_info")}
                error={Boolean(errors.contact_info)}
                helperText={
                  errors.contact_info ||
                  "Useful for sending payment reminders"
                }
                inputProps={{ maxLength: 100 }}
                placeholder="Enter phone or email"
              />
            )}

            {/* Amount */}
            <TextField
              label="Amount (₹) *"
              type="number"
              fullWidth
              required
              value={formData.initial_amount}
              onChange={handleChange("initial_amount")}
              onKeyDown={handleKeyDownNumber}
              error={Boolean(errors.initial_amount)}
              helperText={
                errors.initial_amount ||
                "Positive amount without scientific notation"
              }
            />

            {/* Lent / Borrowed Date & Due Date */}
            <Box
              display="grid"
              gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }}
              gap={2}
            >
              <DatePicker
                label={isLent ? "Lent Date *" : "Borrowed Date *"}
                format="YYYY-MM-DD"
                value={formData.lent_date ? dayjs(formData.lent_date) : null}
                onChange={(date) => {
                  const formatted = date
                    ? dayjs(date).format("YYYY-MM-DD")
                    : "";
                  handleChange("lent_date")({
                    target: { value: formatted },
                  });
                }}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />

              <DatePicker
                label="Expected Return Due Date (Optional)"
                format="YYYY-MM-DD"
                value={formData.due_date ? dayjs(formData.due_date) : null}
                onChange={(date) => {
                  const formatted = date
                    ? dayjs(date).format("YYYY-MM-DD")
                    : "";
                  handleChange("due_date")({
                    target: { value: formatted },
                  });
                }}
                slotProps={{
                  textField: { fullWidth: true, size: "small" },
                }}
              />
            </Box>

            {/* Notes / Reason */}
            <TextField
              label="Reason / Notes (Optional)"
              type="text"
              fullWidth
              multiline
              rows={2}
              value={formData.notes}
              onChange={handleChange("notes")}
              error={Boolean(errors.notes)}
              helperText={
                errors.notes ||
                "E.g., Emergency medical help, dinner bill split (Max 255 chars)"
              }
              inputProps={{ maxLength: 255 }}
            />

            {/* CAPTCHA */}
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
          <Button onClick={onClose} variant="outlined" color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {isLent ? "Save Receivable" : "Save Borrowed Debt"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default React.memo(CreateDebtDialog);
