import axios from "axios";

/** Shared Axios instance — do not create other instances */
export const apiClient = axios.create({
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Automatically retry once with refresh token on 401
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      await axios.post("/api/auth/refresh", {}, { withCredentials: true });
      return apiClient(original);
    }
    return Promise.reject(error);
  }
);
