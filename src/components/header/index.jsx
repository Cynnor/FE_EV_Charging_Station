import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../config/api";
import "./index.scss";

const Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");
  // const [notificationCount, setNotificationCount] = useState(3) // Mock notification count
  const location = useLocation();

  // Kiểm tra token và lấy thông tin user
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem("token");
      setIsLoggedIn(!!token);

      if (token) {
        try {
          const response = await api.get("/users/profile");
          if (response.data.data) {
            const name = String(
              response.data.data.fullname || response.data.data.email || "User"
            );
            setUserName(name);
          }
        } catch (error) {
          console.error("Error fetching user data in header:", error);
          setUserName("User");
        }
      }
    };

    checkAuthStatus();
    window.addEventListener("storage", checkAuthStatus);
    return () => window.removeEventListener("storage", checkAuthStatus);
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    // Redirect về trang chủ sau khi đăng xuất
    window.location.href = "/";
  };

  // const handleNotificationClick = () => {
  //   console.log("Notification clicked")
  //   // Add your notification logic here
  // }

  return (
    <header className="header">
      <div className="header__wrapper">
        <div className="header__container">
          <div className="header__logo">
            <Link to="/" className="header__logo-link">
              <img
                src="/assets/logo.jpg"
                alt="S. TOUCH Logo"
                className="header__logo-img"
              />
            </Link>
            <div className="header__logo-text">
              <span className="header__logo-title">S. TOUCH</span>
              <span className="header__logo-sub">Touch To Charge</span>
            </div>
          </div>
          <nav className="header__nav">
            <Link to="/" className={isActive("/") ? "active" : ""}>
              Trang chủ
            </Link>
            <Link
              to="/charging-stations"
              className={isActive("/charging-stations") ? "active" : ""}
            >
              Đặt lịch sạc
            </Link>
            <Link to="/about" className={isActive("/about") ? "active" : ""}>
              Giới thiệu
            </Link>
            <Link to="/membership" className={isActive("/membership") ? "active" : ""}>
              Gói dịch vụ
            </Link>
            {/* <Link
              to="/support"
              className={isActive("/support") ? "active" : ""}
            >
              Hỗ trợ
            </Link> */}
          </nav>
          <div className="header__actions">
            {!isLoggedIn ? (
              <div className="header__auth">
                <Link to="/login" className="header__login">
                  Đăng nhập
                </Link>
                <span className="header__auth-divider">|</span>
                <Link to="/register" className="header__register">
                  Đăng ký
                </Link>
              </div>
            ) : (
              <div className="header__user">
                <Link to="/profile" className="header__avatar-link">
                  <img
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      userName
                    )}&background=7ed321&color=fff`}
                    alt="avatar"
                    className="header__avatar"
                  />
                </Link>
                <button className="header__logout-btn" onClick={handleLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
            {/* {isLoggedIn && (
              <button className="header__notification-btn" onClick={handleNotificationClick} title="Thông báo">
                <svg className="header__notification-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16Z"
                    fill="currentColor"
                  />
                </svg>
                {notificationCount > 0 && <span className="header__notification-badge">{notificationCount}</span>}
              </button>
            )} */}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
