import React from "react";
import "./index.scss";

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__main">
        <div className="footer__top">
          <div className="footer__brand">
            <img
              src="https://stouch.vn/wp-content/uploads/2024/05/S.TOUCH_Logo_Tren-Website-01-1.svg"
              alt="S. TOUCH Logo"
              className="footer__logo-img"
            />
            <div className="footer__brand-text">
              <span className="footer__brand-title">S. TOUCH</span>
              <span className="footer__brand-sub">Touch To Charge</span>
            </div>
          </div>
          <div className="footer__contacts">
            <div className="footer__contact-item">
              <span className="footer__contact-icon">
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg"
                  alt="Hotline"
                  style={{
                    width: 24,
                    height: 24,
                    background: "#fff",
                    borderRadius: "50%",
                  }}
                />
              </span>
              <span className="footer__contact-label">Hotline</span>
              <span className="footer__contact-value">0912.210.210</span>
            </div>
            <div className="footer__contact-item">
              <span className="footer__contact-icon">
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/whatsapp.svg"
                  alt="Hotline"
                  style={{
                    width: 24,
                    height: 24,
                    background: "#fff",
                    borderRadius: "50%",
                  }}
                />
              </span>
              <span className="footer__contact-label">Hotline</span>
              <span className="footer__contact-value">0983.535.110</span>
            </div>
            <div className="footer__contact-item">
              <span className="footer__contact-icon">
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mail-dot-ru.svg"
                  alt="Sales"
                  style={{
                    width: 24,
                    height: 24,
                    background: "#fff",
                    borderRadius: "50%",
                  }}
                />
              </span>
              <span className="footer__contact-label">Sales</span>
              <span className="footer__contact-value">hello@stouch.vn</span>
            </div>
            <div className="footer__contact-item">
              <span className="footer__contact-icon">
                <img
                  src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/mail-dot-ru.svg"
                  alt="Email"
                  style={{
                    width: 24,
                    height: 24,
                    background: "#fff",
                    borderRadius: "50%",
                  }}
                />
              </span>
              <span className="footer__contact-label">Email</span>
              <span className="footer__contact-value">Support@stouch.vn</span>
            </div>
          </div>
        </div>
        <div className="footer__info">
          <div className="footer__col">
            <div className="footer__col-title">Địa chỉ</div>
            <div className="footer__col-content">
              <div>Số nhà 243, Tổ 23, Xã Thư Lâm, TP Hà Nội</div>
              <div>
                <b>Văn phòng Hà Nội</b>
              </div>
              <div>Tầng 2, Số 42, ngõ 178 Thái Hà, Phường Đống Đa, Hà Nội</div>
              <div>
                <b>Website</b>: www.stouch.vn
              </div>
            </div>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Giải Pháp</div>
            <div className="footer__col-content">
              <div>Văn phòng công sở</div>
              <div>Trung tâm thương hiệu</div>
              <div>Công ty năng lượng và kinh doanh BDS</div>
              <div>Nhà khai thác điểm đỗ xe có phí</div>
            </div>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Tài Nguyên</div>
            <div className="footer__col-content">
              <div>Bài viết</div>
              <div>Sự kiện</div>
              <div>
                <b>Sách điện tử</b>
              </div>
              <div>Hướng dẫn sử dụng</div>
              <div>Ưu đãi</div>
              <div>Trang quản trị</div>
            </div>
          </div>
          <div className="footer__col">
            <div className="footer__col-title">Công ty</div>
            <div className="footer__col-content">
              <div>Nền tảng</div>
              <div>Giải pháp</div>
              <div>Đối tác</div>
              <div>Tài nguyên</div>
              <div>Blog</div>
              <div>Liên hệ</div>
            </div>
          </div>
        </div>
      </div>
      <div className="footer__bottom">
        <div className="footer__copyright">
          2024 © Mọi quyền được bảo lưu. Bản quyền thuộc <b>S.Touch</b>
        </div>
        <div className="footer__links">
          <a href="#">Về Chúng Tôi</a>
          <a href="#">Hướng dẫn sử dụng và hỏi đáp</a>
          <a href="#">Chính sách quyền riêng tư</a>
          <a href="#">Điều khoản và điều kiện sử dụng</a>
        </div>
        <div className="footer__social">
          <a href="#">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/facebook.svg"
              alt="Facebook"
            />
          </a>
          <a href="#">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/linkedin.svg"
              alt="LinkedIn"
            />
          </a>
          <a href="#">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/google.svg"
              alt="Google"
            />
          </a>
          <a href="#">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/instagram.svg"
              alt="Instagram"
            />
          </a>
          <a href="#">
            <img
              src="https://cdn.jsdelivr.net/gh/simple-icons/simple-icons/icons/youtube.svg"
              alt="YouTube"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
