import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Paper,
  CircularProgress,
  Avatar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import EditIcon from "@mui/icons-material/Edit";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { getProfileApi, updateProfileApi } from "../../services/user.service";
import { useDispatch, useSelector } from "react-redux";
import { setAuth } from "../../store/authSlice";
import { useUI } from "../../context/UIContext";
import CaptchaComponent from "../../components/core/CaptchaComponent";
import ConfirmationDialog from "../../components/core/ConfirmationDialog";
import useAppCss from "../../hooks/css/useAppCss";

export const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const clean = url.startsWith("/") ? url : `/${url}`;
  return `http://localhost:5000${clean}`;
};

const UserProfile = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { showAlert } = useUI();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const { GlobalPaperCss } = useAppCss();

  const [formData, setFormData] = useState({
    name: user?.name || "",
    phone_no: user?.phone_no || "",
    employment_type: user?.employment_type || "Salaried",
    annual_income: user?.annual_income !== undefined && user?.annual_income !== null ? user.annual_income : "",
    captchaText: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    resolvePhotoUrl(user?.profile_photo || user?.profile_photo_url)
  );

  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user && !profilePhoto) {
      const photo = user.profile_photo || user.profile_photo_url;
      if (photo) {
        setPhotoPreview(resolvePhotoUrl(photo));
      }
      setFormData((prev) => ({
        ...prev,
        name: user.name || prev.name,
        phone_no: user.phone_no || prev.phone_no,
        employment_type: user.employment_type || prev.employment_type,
        annual_income:
          user.annual_income !== undefined && user.annual_income !== null
            ? user.annual_income
            : prev.annual_income,
      }));
      if (user.email) setEmail(user.email);
    }
  }, [user, profilePhoto]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getProfileApi();

      if (res.status === "success" && res.data) {
        setFormData({
          name: res.data.name || "",
          phone_no: res.data.phone_no || "",
          employment_type: res.data.employment_type || "Salaried",
          annual_income:
            res.data.annual_income !== null && res.data.annual_income !== undefined
              ? res.data.annual_income
              : "",
          captchaText: "",
        });
        setEmail(res.data.email || "");
        const photo = res.data.profile_photo || res.data.profile_photo_url;
        if (photo) {
          setPhotoPreview(resolvePhotoUrl(photo));
        }
        dispatch(setAuth({ user: res.data })); // Sync Redux state with latest profile
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Failed to fetch profile",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        showAlert("File size exceeds 2MB limit", "error");
        return;
      }
      setProfilePhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const requestUpdate = (e) => {
    e.preventDefault();
    if (!formData.captchaText) {
      showAlert("Please enter the CAPTCHA code", "warning");
      return;
    }
    setConfirmDialog(true);
  };

  const executeUpdate = async () => {
    setConfirmDialog(false);
    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("name", formData.name);
      data.append("phone_no", formData.phone_no);
      data.append("employment_type", formData.employment_type);
      data.append("annual_income", formData.annual_income);
      data.append("captchaText", formData.captchaText);
      if (captchaId) data.append("captchaId", captchaId);
      if (profilePhoto) data.append("profile_photo", profilePhoto);

      const res = await updateProfileApi(data);
      if (res.status === "success") {
        showAlert("Profile updated successfully", "success");
        dispatch(setAuth({ user: res.data }));
        const photo = res.data?.profile_photo || res.data?.profile_photo_url;
        if (photo) {
          setPhotoPreview(resolvePhotoUrl(photo));
        }
        setFormData((prev) => ({ ...prev, captchaText: "" }));
      }
    } catch (error) {
      showAlert(
        error.response?.data?.message || "Failed to update profile",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box component="div">
      <Paper elevation={2} sx={GlobalPaperCss}>
        <Box display="flex" alignItems="center" gap={1.5} mb={4}>
          <PersonIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700} color="primary.main">
            My Profile
          </Typography>
        </Box>
        <Box
          component="form"
          onSubmit={requestUpdate}
          display="flex"
          flexDirection="column"
          gap={3}
        >
          <Box display="flex" justifyContent="center" mb={2}>
            <Box position="relative">
              <Avatar
                src={photoPreview || undefined}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: "secondary.main",
                  fontSize: 48,
                }}
              >
                {!photoPreview && <PersonIcon fontSize="inherit" />}
              </Avatar>
              <IconButton
                color="primary"
                sx={{
                  position: "absolute",
                  bottom: -8,
                  right: -8,
                  bgcolor: "background.paper",
                  boxShadow: 1,
                  "&:hover": { bgcolor: "background.default" },
                }}
                onClick={() => fileInputRef.current.click()}
              >
                <PhotoCamera fontSize="small" />
              </IconButton>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                ref={fileInputRef}
                onChange={handlePhotoChange}
              />
            </Box>
          </Box>

          <TextField
            label="Email Address"
            value={email}
            disabled
            fullWidth
            helperText="Email address cannot be changed."
          />
          <TextField
            label="Full Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            fullWidth
            inputProps={{ maxLength: 32 }}
          />
          <TextField
            label="Phone Number"
            name="phone_no"
            value={formData.phone_no}
            onChange={handleChange}
            fullWidth
            inputProps={{ maxLength: 10 }}
            helperText="10-digit Indian mobile number"
          />
          <TextField
            select
            label="Employment Type *"
            name="employment_type"
            value={formData.employment_type}
            onChange={handleChange}
            required
            fullWidth
          >
            <MenuItem value="Salaried">Salaried</MenuItem>
            <MenuItem value="Self-Employed">Self-Employed</MenuItem>
          </TextField>

          <TextField
            label="Annual Income (INR)"
            name="annual_income"
            type="number"
            value={formData.annual_income}
            onChange={handleChange}
            fullWidth
            inputProps={{ min: 0, step: "any" }}
            helperText={
              formData.annual_income
                ? `₹${Number(formData.annual_income).toLocaleString("en-IN")} per annum`
                : "Optional (in Indian Rupees ₹)"
            }
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupeeIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <CaptchaComponent
            value={formData.captchaText}
            onChange={handleChange}
            onCaptchaIdChange={setCaptchaId}
            name="captchaText"
          />

          <Box mt={2} display="flex" justifyContent="flex-end">
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={submitting}
              sx={{ fontWeight: 700 }}
              startIcon={<EditIcon />}
            >
              {submitting ? "Updating..." : "Update Profile"}
            </Button>
          </Box>
        </Box>
      </Paper>

      <ConfirmationDialog
        open={confirmDialog}
        heading="Confirm Profile Update"
        text="Are you sure you want to update your profile details?"
        isLoading={submitting}
        onSuccess={executeUpdate}
        onCancel={() => setConfirmDialog(false)}
        okBtnTxt="Yes, Update"
      />
    </Box>
  );
};

export default UserProfile;
