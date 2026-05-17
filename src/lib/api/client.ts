import axios from "axios";

/**
 * Shared Axios instance — do not create other instances.
 * NOTE: No global Content-Type header — Axios sets it per request:
 *   • Plain object data → application/json (Axios default)
 *   • FormData → multipart/form-data with correct boundary (browser auto-set)
 * Setting Content-Type globally would override FormData boundary and break file uploads.
 */
export const apiClient = axios.create({
  withCredentials: true,
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
