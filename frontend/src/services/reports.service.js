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
  const params = month ? { month, download: "true" } : { download: "true" };
  const response = await axiosInstance.get("/reports/statement/download", {
    params,
    responseType: "blob",
  });
  return response;
};

export const getPaymentModesSummaryApi = async (month) => {
  const params = month ? { month } : {};
  const response = await axiosInstance.get("/reports/payment-modes/summary", {
    params,
  });
  return response.data;
};

export const getPaymentModesPreviewApi = async (month) => {
  const params = month ? { month } : {};
  const response = await axiosInstance.get("/reports/payment-modes/preview", {
    params,
    responseType: "text",
  });
  return response.data;
};

export const downloadPaymentModesPdfApi = async (month) => {
  const params = month ? { month, download: "true" } : { download: "true" };
  const response = await axiosInstance.get("/reports/payment-modes/download", {
    params,
    responseType: "blob",
  });
  return response;
};

export const getFinancialYearSummaryApi = async (year) => {
  const params = year ? { year } : {};
  const response = await axiosInstance.get("/reports/financial-year/summary", {
    params,
  });
  return response.data;
};

export const getFinancialYearPreviewApi = async (year) => {
  const params = year ? { year } : {};
  const response = await axiosInstance.get("/reports/financial-year/preview", {
    params,
    responseType: "text",
  });
  return response.data;
};

export const downloadFinancialYearPdfApi = async (year) => {
  const params = year ? { year, download: "true" } : { download: "true" };
  const response = await axiosInstance.get("/reports/financial-year/download", {
    params,
    responseType: "blob",
  });
  return response;
};

