import axios from "axios";

const api = axios.create({
  baseURL: "https://private-eve-evchargingstation-7d82d2a9.koyeb.app",
  //baseURL: "http://localhost:3000",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;