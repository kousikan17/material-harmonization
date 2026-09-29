import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
export const API_HOST = API_URL.replace(/\/api\/?$/, "");

export const api = axios.create({ baseURL: API_URL, timeout: 15_000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("current_user");
      // Don't redirect for /auth/me — AuthContext handles that transition.
      const url = error.config?.url || "";
      const isDemoMode = import.meta.env.VITE_DEMO_MODE === "true";
      if (!isDemoMode && !url.includes("/auth/me") && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.detail) {
      const detail = error.response.data.detail;
      if (typeof detail === "string") return detail;
      if (Array.isArray(detail)) return detail.map((d) => d.msg).join(", ");
    }
    if (error.message === "Network Error") {
      return "Unable to load data from the server. Please try again.";
    }
    if (error.message) {
      return error.message;
    }
  }
  return fallback;
}
