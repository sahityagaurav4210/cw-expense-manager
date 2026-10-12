import axiosInstance from "../api/axiosInstance";

export const createExpenseApi = async (expenseData) => {
  const isFormData = expenseData instanceof FormData;
  const config = isFormData
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const response = await axiosInstance.post("/expenses", expenseData, config);
  return response.data;
};

export const getExpensesApi = async () => {
  const response = await axiosInstance.get("/expenses");
  return response.data;
};

export const downloadExpenseBillApi = async (id) => {
  const response = await axiosInstance.get(`/expenses/${id}/bill`, {
    responseType: "blob",
  });
  return response;
};

export const deleteExpenseApi = async (id, captchaData) => {
  const response = await axiosInstance.post(`/expenses/${id}/delete`, captchaData);
  return response.data;
};

export const uploadExpenseBillApi = async (id, file) => {
  const formData = new FormData();
  formData.append("bill", file);
  const response = await axiosInstance.post(`/expenses/${id}/bill`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};
