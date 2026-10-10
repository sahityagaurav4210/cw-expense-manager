import axiosInstance from "../api/axiosInstance";

export const createExpenseApi = async (expenseData) => {
  const response = await axiosInstance.post("/expenses", expenseData);
  return response.data;
};

export const getExpensesApi = async () => {
  const response = await axiosInstance.get("/expenses");
  return response.data;
};

export const deleteExpenseApi = async (id, captchaData) => {
  const response = await axiosInstance.post(`/expenses/${id}/delete`, captchaData);
  return response.data;
};
