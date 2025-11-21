import axios from "axios"; // Import thư viện axios để thực hiện các HTTP request

const api = axios.create({
  // Tạo một instance axios tùy chỉnh
  baseURL: "https://private-eve-evchargingstation-7d82d2a9.koyeb.app", // URL cơ sở của API backend
  //baseURL: "http://localhost:3000", // URL cho môi trường development (đang bị comment)
  headers: { "Content-Type": "application/json" }, // Thiết lập header mặc định cho các request
});

api.interceptors.request.use(
  // Thêm interceptor để xử lý trước khi gửi request
  (config) => {
    // Hàm callback xử lý config của request
    let token = localStorage.getItem("token"); // Lấy token từ localStorage với key "token"

    // Fallbacks in case token key is missing but user data still exists
    if (!token) {
      // Kiểm tra nếu không tìm thấy token
      try {
        // Bắt đầu block try-catch để xử lý lỗi
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}"); // Parse dữ liệu user từ localStorage, nếu không có thì trả về object rỗng
        token =
          storedUser?.token || // Kiểm tra và lấy token từ thuộc tính token
          storedUser?.accessToken || // Hoặc lấy từ accessToken
          storedUser?.idToken || // Hoặc lấy từ idToken
          storedUser?.authToken; // Hoặc lấy từ authToken
      } catch (_) {
        // Bắt lỗi nếu parse JSON thất bại
        // ignore parse errors, will treat as unauthenticated
      }
    }

    if (token) {
      // Kiểm tra nếu đã có token
      config.headers.Authorization = `Bearer ${token}`; // Thêm token vào header Authorization với định dạng Bearer
    }
    return config; // Trả về config đã được xử lý để tiếp tục request
  },
  (error) => Promise.reject(error) // Xử lý lỗi bằng cách reject Promise
);

api.interceptors.response.use(
  // Thêm interceptor để xử lý response trả về từ server
  (response) => response, // Nếu response thành công thì trả về response đó
  (error) => {
    // Hàm xử lý khi có lỗi trong response
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      // Kiểm tra nếu lỗi 401 (Unauthorized) và đang chạy trong môi trường browser
      // Clear stale credentials and redirect to login for re-authentication
      localStorage.removeItem("token"); // Xóa token khỏi localStorage
      localStorage.removeItem("user"); // Xóa thông tin user khỏi localStorage

      const redirect = encodeURIComponent(
        // Encode URL hiện tại để sử dụng làm tham số redirect
        `${window.location.pathname}${window.location.search}` // Lấy đường dẫn và query string hiện tại
      );
      if (!window.location.pathname.startsWith("/login")) {
        // Kiểm tra nếu không đang ở trang login
        window.location.replace(`/login?redirect=${redirect}`); // Chuyển hướng về trang login kèm theo URL redirect
      }
    }
    return Promise.reject(error); // Reject Promise với lỗi để component có thể xử lý tiếp
  }
);

export default api; // Export instance axios đã được cấu hình
