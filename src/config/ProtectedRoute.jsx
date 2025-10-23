import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const userStr = localStorage.getItem("user");

  // Nếu chưa đăng nhập
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    // Kiểm tra role của user (hỗ trợ nhiều key khác nhau)
    const userRole = user.role || user.userRole || user.accountRole || "";

    // Nếu không có role hoặc role không được phép
    if (!allowedRoles.includes(userRole)) {
      // Chuyển về trang chủ nếu không có quyền
      return <Navigate to="/" replace />;
    }

    // Cho phép truy cập
    return children;
  } catch (err) {
    console.error("Error parsing user data:", err);
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
