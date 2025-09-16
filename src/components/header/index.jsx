import React, { useState } from "react";
import "./index.scss";

const Header = () => {
  const [currentLang, setCurrentLang] = useState("vi");

  const toggleLanguage = () => {
    setCurrentLang(currentLang === "vi" ? "en" : "vi");
  };

  return (
    <header className="header">
      <div className="header__wrapper">
        <div className="header__container">
          <div className="header__logo">
            <img
              src="https://stouch.vn/wp-content/uploads/2024/05/S.TOUCH_Logo_Tren-Website-01-1.svg"
              alt="S. TOUCH Logo"
              className="header__logo-img"
            />
            <div className="header__logo-text">
              <span className="header__logo-sub">Touch To Charge</span>
            </div>
          </div>
          <nav className="header__nav">
            <a href="/" className="active">
              Trang chủ
            </a>
            <a href="/chargingStations">Trụ sạc</a>
            <a href="/about">Giới thiệu</a>
            <a href="/support">Hỗ trợ</a>
          </nav>
          <div className="header__actions">
            <div className="header__auth">
              <button className="header__login">Đăng nhập</button>
              <span className="header__auth-divider">|</span>
              <button className="header__register">Đăng ký</button>
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
