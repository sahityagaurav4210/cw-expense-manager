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
