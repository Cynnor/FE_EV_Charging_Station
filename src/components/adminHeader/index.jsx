import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./index.scss";

const AdminHeader = ({ title, subtitle }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const profileRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (!storedUser) return;
      const parsedUser = JSON.parse(storedUser);
      const resolvedName =
        parsedUser?.fullName || parsedUser?.name || parsedUser?.email || "Admin";
      setAdminName(resolvedName);
    } catch (err) {
      console.error("Không thể đọc thông tin quản trị:", err);
    }
  }, []);

  useEffect(() => {
    if (!showProfileMenu) return;
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showProfileMenu]);

  const initials = adminName
    .split(" ")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase())
    .join("")
    .slice(0, 2) || "AD";

  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      localStorage.setItem("token", "");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setShowProfileMenu(false);

      navigate("/");
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="profile-cluster" ref={profileRef}>
          <button
            type="button"
            className="admin-avatar"
            aria-label="Tài khoản quản trị"
            onClick={() => setShowProfileMenu((prev) => !prev)}
          >
            <span>{initials}</span>
          </button>

          {showProfileMenu && (
            <div className="profile-popover">
              <div className="profile-summary">
                <p className="profile-name">{adminName}</p>
                <p className="profile-role">Quản trị viên</p>
              </div>
              <button type="button" className="menu-item logout" onClick={handleLogout}>
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
