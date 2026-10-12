import axios from "axios";
import { store } from "../store";
import { setAuth, clearAuth } from "../store/authSlice";

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || "http://localhost:4000/api/v1";

const axiosInstance = axios.create({
  baseURL: BFF_BASE_URL,
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = store.getState().auth?.accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 429) {
      console.warn("Rate limit reached. Please wait before retrying.");
    }

    // Attempt silent refresh on 401 if not already attempted and not an auth attempt
    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register") &&
      !originalRequest.url?.includes("/users/get-me")
    ) {
      originalRequest._retry = true;
      try {
        const refreshRes = await axios.get(`${BFF_BASE_URL}/users/get-me`, {
          withCredentials: true,
        });

        if (refreshRes.data?.data?.accessToken) {
          store.dispatch(
            setAuth({
              user: refreshRes.data.data.user,
              accessToken: refreshRes.data.data.accessToken,
            })
          );
          originalRequest.headers.Authorization = `Bearer ${refreshRes.data.data.accessToken}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshErr) {
        store.dispatch(clearAuth());
      }
    }

    // Broadcast API error event across application to reload CAPTCHA automatically
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cw-api-error", { detail: error }));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
