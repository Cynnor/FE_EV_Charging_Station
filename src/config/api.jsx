import axios from "axios";

const api = axios.create({
  baseURL: "https://ev-charging-management-latest.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  function (config) {
    const token = localStorage.getItem("token");
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  },

  function (error) {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default api;
