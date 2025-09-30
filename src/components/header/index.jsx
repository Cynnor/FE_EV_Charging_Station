import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import api from "../../config/api";
import "./index.scss";
import "../../assets/logo.jpg"
const Header = () => {
  const [currentLang, setCurrentLang] = useState("vi");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("User");
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

  const toggleLanguage = () => {
    setCurrentLang(currentLang === "vi" ? "en" : "vi");
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    // Redirect về trang chủ sau khi đăng xuất
    window.location.href = "/";
  };

  return (
    <header className="header">
      <div className="header__wrapper">
        <div className="header__container">
          <div className="header__logo">
            <img
              src="https://i.postimg.cc/15px6VJv/logo-part-1.png"
              alt="S. TOUCH Logo"
              className="header__logo-img"
            />
            <div className="header__logo-text">
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
              Trụ sạc
            </Link>
            <Link to="/about" className={isActive("/about") ? "active" : ""}>
              Giới thiệu
            </Link>
            <Link
              to="/support"
              className={isActive("/support") ? "active" : ""}
            >
              Hỗ trợ
            </Link>
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
            <button className="header__lang-toggle" onClick={toggleLanguage}>
              <span
                className={`lang-flag ${currentLang === "vi" ? "active" : ""}`}
              >
                🇻🇳
              </span>
              <span
                className={`lang-flag ${currentLang === "en" ? "active" : ""}`}
              >
                🇺🇸
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
