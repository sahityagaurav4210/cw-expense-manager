import axiosInstance from "../api/axiosInstance";

export const registerUserApi = async (formData) => {
  const response = await axiosInstance.post("/auth/register", formData);
  return response.data;
};

export const loginUserApi = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const verifyOtpApi = async ({ tempToken, otp }) => {
  const response = await axiosInstance.post("/auth/verify-otp", { tempToken, otp });
  return response.data;
};

export const resendOtpApi = async ({ tempToken, captchaText, captchaId }) => {
  const response = await axiosInstance.post("/auth/resend-otp", {
    tempToken,
    captchaText,
    captchaId,
  });
  return response.data;
};

export const logoutUserApi = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};

export const switchLogin2faMethodApi = async ({ tempToken }) => {
  const response = await axiosInstance.post("/auth/switch-2fa", { tempToken });
  return response.data;
};

export const forgotPasswordSendOtpApi = async ({ email, captcha, captchaId }) => {
  const response = await axiosInstance.post("/auth/forgot-password/send-otp", {
    email,
    captcha,
    captchaId,
  });
  return response.data;
};

export const forgotPasswordVerifyOtpApi = async ({ resetToken, otp }) => {
  const response = await axiosInstance.post("/auth/forgot-password/verify-otp", {
    resetToken,
    otp,
  });
  return response.data;
};

export const forgotPasswordResendOtpApi = async ({ resetToken, captchaText, captchaId }) => {
  const response = await axiosInstance.post("/auth/forgot-password/resend-otp", {
    resetToken,
    captchaText,
    captchaId,
  });
  return response.data;
};

export const forgotPasswordResetApi = async ({ resetToken, password, confirmPassword }) => {
  const response = await axiosInstance.post("/auth/forgot-password/reset-password", {
    resetToken,
    password,
    confirmPassword,
  });
  return response.data;
};
