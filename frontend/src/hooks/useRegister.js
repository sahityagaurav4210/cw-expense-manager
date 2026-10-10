import { useState } from "react";
import { registerUserApi } from "../services/auth.service";
import { registerZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";
import { useNavigate } from "react-router-dom";

export const useRegister = () => {
  const { showAlert } = useUI();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone_no: "",
    password: "",
    employment_type: "Salaried",
    captcha: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectEmployment = (type) => () => {
    setFormData((prev) => ({ ...prev, employment_type: type }));
  };

  const handleFileSelect = (file) => {
    setProfilePhoto(file);
  };

  const handleFileClear = () => {
    setProfilePhoto(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = registerZodSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors = {};
      result.error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      showAlert("Please correct the form errors before submitting.", "error");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => data.append(key, formData[key]));
      data.append("captchaId", captchaId);

      if (profilePhoto) {
        data.append("profile_photo", profilePhoto);
      }

      await registerUserApi(data);
      showAlert("Registration successful! Redirecting to login...", "success");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setFormData((prev) => ({ ...prev, captcha: "" }));
      showAlert(
        err.response?.data?.message || err.message || "Registration failed.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    captchaId,
    setCaptchaId,
    errors,
    loading,
    handleChange,
    handleSelectEmployment,
    handleFileSelect,
    handleFileClear,
    handleSubmit,
  };
};
