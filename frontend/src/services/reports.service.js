import axiosInstance from "../api/axiosInstance";

export const getExpenditureSummaryApi = async (params = {}) => {
  const response = await axiosInstance.get("/reports/expenditure-summary", {
    params,
  });
  return response.data;
};
