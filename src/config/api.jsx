import axios from "axios";

const api = axios.create({
  baseURL: "https://private-eve-evchargingstation-7d82d2a9.koyeb.app",
  //baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    let token = localStorage.getItem("token");

    // Fallbacks in case token key is missing but user data still exists
    if (!token) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
        token =
          storedUser?.token ||
          storedUser?.accessToken ||
          storedUser?.idToken ||
          storedUser?.authToken;
      } catch (_) {
        // ignore parse errors, will treat as unauthenticated
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      // Clear stale credentials and redirect to login for re-authentication
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      const redirect = encodeURIComponent(
        `${window.location.pathname}${window.location.search}`
      );
      if (!window.location.pathname.startsWith("/login")) {
        window.location.replace(`/login?redirect=${redirect}`);
      }
    }
    return Promise.reject(error);
  }
);

export default api;
