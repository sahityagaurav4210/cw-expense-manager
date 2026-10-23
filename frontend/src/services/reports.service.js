import axiosInstance from "../api/axiosInstance";

export const getExpenditureSummaryApi = async (params = {}) => {
  const response = await axiosInstance.get("/reports/expenditure-summary", {
    params,
  });
  return response.data;
};

export const getStatementPreviewApi = async (month) => {
  const params = month ? { month } : {};
  const response = await axiosInstance.get("/reports/statement/preview", {
    params,
    responseType: "text",
  });
  return response.data;
};

export const downloadStatementPdfApi = async (month) => {
  const params = month ? { month } : {};
  const response = await axiosInstance.get("/reports/statement/download", {
    params,
    responseType: "blob",
  });
  return response;
};

