import axiosInstance from "../api/axiosInstance";

export const getDashboardMetricsApi = async (month) => {
  const params = month ? { month } : {};
  const response = await axiosInstance.get("/dashboard/metrics", { params });
  return response.data;
};
