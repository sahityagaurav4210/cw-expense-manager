import axiosInstance from "../api/axiosInstance";

export const setBudgetApi = async (budgetData) => {
  const response = await axiosInstance.post("/budgets", budgetData);
  return response.data;
};

export const getBudgetsApi = async () => {
  const response = await axiosInstance.get("/budgets");
  return response.data;
};

export const addBudgetInflowApi = async (budgetId, inflowData) => {
  const response = await axiosInstance.post(`/budgets/${budgetId}/inflow`, inflowData);
  return response.data;
};
