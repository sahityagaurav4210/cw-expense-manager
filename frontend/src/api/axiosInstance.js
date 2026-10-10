import axios from "axios";

const BFF_BASE_URL = import.meta.env.VITE_BFF_URL || "http://localhost:4000/api/v1";

const axiosInstance = axios.create({
  baseURL: BFF_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      console.warn("Rate limit reached. Please wait before retrying.");
    }

    // Broadcast API error event across application to reload CAPTCHA automatically
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cw-api-error", { detail: error }));
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
