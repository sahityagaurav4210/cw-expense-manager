import axiosInstance from "../api/axiosInstance";

export const getDebtsApi = async () => {
  const response = await axiosInstance.get("/debts");
  return response.data;
};

export const createDebtApi = async (debtData) => {
  const response = await axiosInstance.post("/debts", debtData);
  return response.data;
};

export const addDebtSettlementApi = async (id, settlementData) => {
  const response = await axiosInstance.post(`/debts/${id}/settle`, settlementData);
  return response.data;
};

export const writeOffDebtApi = async (id, payload = { recordAsExpense: true }) => {
  const response = await axiosInstance.post(`/debts/${id}/write-off`, payload);
  return response.data;
};

export const deleteDebtApi = async (id) => {
  const response = await axiosInstance.post(`/debts/${id}/delete`);
  return response.data;
};
