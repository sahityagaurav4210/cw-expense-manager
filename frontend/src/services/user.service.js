import axiosInstance from "../api/axiosInstance";

export const getProfileApi = async () => {
  const response = await axiosInstance.get("/users/profile");
  return response.data;
};

export const updateProfileApi = async (formData) => {
  const response = await axiosInstance.put("/users/profile", formData);
  return response.data;
};
