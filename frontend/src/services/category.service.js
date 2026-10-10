import axiosInstance from "../api/axiosInstance";

export const getCategoriesApi = async () => {
  const response = await axiosInstance.get("/categories");
  return response.data;
};

export const createCategoryApi = async (categoryData) => {
  const response = await axiosInstance.post("/categories", categoryData);
  return response.data;
};

export const toggleCategoryActiveApi = async (id, captchaData) => {
  const response = await axiosInstance.patch(`/categories/${id}/toggle`, captchaData);
  return response.data;
};

export const deleteCategoryApi = async (id, captchaData) => {
  const response = await axiosInstance.post(`/categories/${id}/delete`, captchaData);
  return response.data;
};
