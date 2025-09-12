import React from "react";
import "./index.scss";

const Header = () => {
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
          </div>
          <nav className="header__nav">
            <a href="#" className="active">
              Nền Tảng
            </a>
            <div className="dropdown">
              <a href="#">
                Giải Pháp <span>▼</span>
              </a>
            </div>
            <a href="#">Trụ sạc</a>
            <a href="#">Khách hàng</a>
            <div className="dropdown">
              <a href="#">
                Tài Nguyên <span>▼</span>
              </a>
            </div>
            <a href="#">Blog</a>
            <button className="header__contact">Liên Hệ</button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
