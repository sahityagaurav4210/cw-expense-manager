import { useState } from "react";
import { loginUserApi } from "../services/auth.service";
import { loginZodSchema } from "../validators/zodSchemas";
import { useUI } from "../context/UIContext";
import { useDispatch } from "react-redux";
import { setAuth } from "../store/authSlice";
import { useNavigate } from "react-router-dom";

export const useLogin = () => {
  const { showAlert } = useUI();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    captcha: "",
  });
  const [captchaId, setCaptchaId] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    const result = loginZodSchema.safeParse(formData);
    if (!result.success) {
      const formattedErrors = {};
      result.error.errors.forEach((err) => {
        formattedErrors[err.path[0]] = err.message;
      });
      setErrors(formattedErrors);
      showAlert("Please enter all required fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await loginUserApi({ ...formData, captchaId });
      dispatch(
        setAuth({
          user: res.data.user,
          accessToken: res.data.accessToken,
        })
      );
      showAlert("Login successful! Welcome back.", "success");
      navigate("/dashboard");
    } catch (err) {
      setFormData((prev) => ({ ...prev, captcha: "" }));
      showAlert(err.response?.data?.message || err.message || "Login failed.", "error");
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
    handleSubmit,
  };
};
