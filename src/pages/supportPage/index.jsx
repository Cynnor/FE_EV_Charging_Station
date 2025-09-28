import { useEffect } from "react";
import "./index.scss";

const Support = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="support-container">
      {/* Thông tin liên hệ */}
      <section className="info-section">
        <h2>Thông tin liên hệ</h2>
        <div className="info-cards">
          <div className="card">
            <h3>Liên hệ</h3>
            <p>📞 0335 165 044</p>
            <p>✉ support@touchtocharge.com</p>
          </div>
          <div className="card">
            <h3>Giờ làm việc</h3>
            <p>Thứ 2 – Thứ 7: 7:00 – 20:00</p>
            <p>Chủ nhật: 8:00 – 18:00</p>
          </div>
          <div className="card">
            <h3>Địa chỉ</h3>
            <p>Hồ Chí Minh, Việt Nam</p>
          </div>
        </div>
      </section>

      {/* Form gửi yêu cầu */}
      <section className="form-section">
        <h2>Yêu cầu hỗ trợ</h2>
        <p>
          Điền thông tin để đội ngũ kỹ thuật của chúng tôi hỗ trợ nhanh nhất
        </p>
        <form>
          <input type="text" placeholder="Họ và tên *" required />
          <input type="text" placeholder="Số điện thoại *" required />
          <input type="email" placeholder="Email *" required />
          <textarea placeholder="Nội dung cần hỗ trợ..." rows="5"></textarea>
          <button type="submit">Gửi yêu cầu</button>
        </form>
      </section>

      {/* Các cam kết dịch vụ */}
      <section className="features">
        <div className="feature">
          <i className="fas fa-shipping-fast"></i>
          <p>Hỗ trợ nhanh chóng</p>
        </div>
        <div className="feature">
          <i className="fas fa-user-shield"></i>
          <p>Bảo mật thông tin</p>
        </div>
        <div className="feature">
          <i className="fas fa-headset"></i>
          <p>Tư vấn tận tình</p>
        </div>
        <div className="feature">
          <i className="fas fa-thumbs-up"></i>
          <p>Đảm bảo chất lượng</p>
        </div>
      </section>
    </div>
  );
};

export default Support;
