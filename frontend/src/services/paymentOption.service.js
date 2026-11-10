import axiosInstance from "../api/axiosInstance";

export const getPaymentOptionsApi = async () => {
  const response = await axiosInstance.get("/payment-options");
  return response.data;
};

export const createPaymentOptionApi = async (data) => {
  const response = await axiosInstance.post("/payment-options", data);
  return response.data;
};

export const togglePaymentOptionActiveApi = async (id, captchaData) => {
  const response = await axiosInstance.patch(`/payment-options/${id}/toggle`, captchaData);
  return response.data;
};

export const deletePaymentOptionApi = async (id, captchaData) => {
  const response = await axiosInstance.post(`/payment-options/${id}/delete`, captchaData);
  return response.data;
};
