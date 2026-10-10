import axiosInstance from "../api/axiosInstance";

export const registerUserApi = async (formData) => {
  const response = await axiosInstance.post("/auth/register", formData);
  return response.data;
};

export const loginUserApi = async (credentials) => {
  const response = await axiosInstance.post("/auth/login", credentials);
  return response.data;
};

export const logoutUserApi = async () => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
