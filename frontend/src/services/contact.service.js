import axiosInstance from "../api/axiosInstance";

export const getContactsApi = async (params = {}) => {
  const response = await axiosInstance.get("/contacts", { params });
  return response.data;
};

export const getContactsListApi = async () => {
  const response = await axiosInstance.get("/contacts/list");
  return response.data;
};

export const getContactByIdApi = async (id) => {
  const response = await axiosInstance.get(`/contacts/${id}`);
  return response.data;
};

export const createContactApi = async (formData) => {
  const isMultipart = formData instanceof FormData;
  const config = isMultipart
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const response = await axiosInstance.post("/contacts", formData, config);
  return response.data;
};

export const updateContactApi = async (id, formData) => {
  const isMultipart = formData instanceof FormData;
  const config = isMultipart
    ? { headers: { "Content-Type": "multipart/form-data" } }
    : {};
  const response = await axiosInstance.put(`/contacts/${id}`, formData, config);
  return response.data;
};

export const deleteContactApi = async (id, payload = {}) => {
  const response = await axiosInstance.post(`/contacts/${id}/delete`, payload);
  return response.data;
};

export const toggleFavoriteContactApi = async (id) => {
  try {
    const response = await axiosInstance.post(`/contacts/${id}/favorite`);
    return response.data;
  } catch (err) {
    if (err.response?.status === 404 || err.response?.status === 405) {
      const response = await axiosInstance.patch(`/contacts/${id}/favorite`);
      return response.data;
    }
    throw err;
  }
};
