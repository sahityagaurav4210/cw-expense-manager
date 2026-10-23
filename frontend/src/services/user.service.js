import axiosInstance from "../api/axiosInstance";

export const getMeApi = async () => {
  const response = await axiosInstance.get("/users/get-me");
  return response.data;
};

export const getProfileApi = async () => {
  const response = await axiosInstance.get("/users/profile");
  return response.data;
};

export const updateProfileApi = async (formData) => {
  const response = await axiosInstance.put("/users/profile", formData);
  return response.data;
};

export const get2FaSettingsApi = async () => {
  const response = await axiosInstance.get("/users/2fa");
  return response.data;
};

export const setupAuthenticatorApi = async () => {
  const response = await axiosInstance.post("/users/2fa/authenticator/setup");
  return response.data;
};

export const verifyAuthenticatorSetupApi = async ({ code, setAsDefault }) => {
  const response = await axiosInstance.post("/users/2fa/authenticator/verify", {
    code,
    setAsDefault,
  });
  return response.data;
};

export const update2FaMethodApi = async ({ method }) => {
  const response = await axiosInstance.post("/users/2fa/update-method", {
    method,
  });
  return response.data;
};

export const disableAuthenticatorApi = async () => {
  const response = await axiosInstance.post("/users/2fa/authenticator/disable");
  return response.data;
};
