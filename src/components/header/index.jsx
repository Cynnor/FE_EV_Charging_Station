import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./index.scss";
import "../../assets/logo.jpg"
const Header = () => {
  const [currentLang, setCurrentLang] = useState("vi");
  const location = useLocation();

  const toggleLanguage = () => {
    setCurrentLang(currentLang === "vi" ? "en" : "vi");
  };

  const isActive = (path) => {
    return location.pathname === path;
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
            <div className="header__auth">
              <Link to="/login" className="header__login">
                Đăng nhập
              </Link>
              <span className="header__auth-divider">|</span>
              <Link to="/register" className="header__register">
                Đăng ký
              </Link>
            </div>
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
