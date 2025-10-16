import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole = "admin" }) => {
  const userStr = localStorage.getItem("user");

  if (!userStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userStr);

    if (user.role !== requiredRole && user.userRole !== requiredRole) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
