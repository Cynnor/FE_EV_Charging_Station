import axios from "axios";

// Set the base URL for your API
axios.defaults.baseURL = "https://private-eve-evchargingstation-7d82d2a9.koyeb.app";
// Create an axios instance with custom headers
const axiosClient = axios.create({
  baseURL: axios.defaults.baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Hàng đợi để chờ khi refresh token
let isRefreshing = false;
let failedQueue = [];

// Hàm xử lý các yêu cầu trong hàng đợi
const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (token) {
      prom.resolve(token);
    } else {
      prom.reject(error);
    }
  });

  failedQueue = [];
};

// Add a request interceptor to add token to headers
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle token refresh and other errors
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 403 && !originalRequest._retry) {
      if (isRefreshing) {
        // Nếu đang refresh token, thêm yêu cầu vào hàng đợi
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers["Authorization"] = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gửi request để lấy token mới bằng refresh token
        const refreshToken = localStorage.getItem("refresh_token");
        const response = await axios.post("https://ch-api.arisavinh.dev/api/v1/auth/refresh", {
          token: refreshToken,
        });

        // Cập nhật lại token mới
        const newToken = response.data.token;
        localStorage.setItem("token", newToken);
        localStorage.setItem("refresh_token", `Bearer ${response.data.refreshToken}`);

        // Thêm token vào request ban đầu và gửi lại
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        processQueue(null, newToken);

        return axiosClient(originalRequest);
      } catch (refreshError) {
        // Xử lý nếu refresh token hết hạn (có thể redirect về trang đăng nhập)
        processQueue(refreshError, null);
        console.error("Refresh token expired. Redirect to login.");
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
