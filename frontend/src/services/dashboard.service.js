import axiosInstance from "../api/axiosInstance";

export const getDashboardMetricsApi = async (params = {}) => {
  let queryParams = {};
  if (typeof params === "string") {
    queryParams.month = params;
  } else if (typeof params === "object" && params !== null) {
    queryParams = { ...params };
  }
  const response = await axiosInstance.get("/dashboard/metrics", { params: queryParams });
  return response.data;
};
