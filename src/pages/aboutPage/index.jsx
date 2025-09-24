import { useEffect } from "react";
import "./index.scss";

const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="about-page">
      {/* Banner */}
      <section className="about-banner">
        <div className="overlay">
          <h1>Đội ngũ Touch To Charge</h1>
          <p>Cam kết mang đến trải nghiệm sạc xe điện hiệu quả và thuận tiện nhất</p>
        </div>
      </section>

      {/* Phần mô tả */}
      <section className="about-intro">
        <div className="intro-flex">
          {/* Hình minh họa bên trái */}
          <div className="intro-image">
            <img
              src="https://i.pinimg.com/originals/74/55/ac/7455ac1f11bdb1a92ea69d1f80897996.jpg"
              alt="Giải pháp hợp lý"
            />
          </div>

          {/* Nội dung bên phải */}
          <div className="intro-content">
            <h2>GIẢI PHÁP HỢP LÝ CHO VẤN ĐỀ CỦA BẠN</h2>
            <p>
              Touch To Charge không chỉ cung cấp hệ thống trạm sạc xe điện mà còn mang đến những
              giải pháp quản lý, thanh toán và kết nối thông minh thông qua Internet.
            </p>
            <p>
              Trong bối cảnh công nghệ và xu hướng xe điện ngày càng phổ biến, việc sở hữu hệ thống
              trạm sạc hiện đại, an toàn và chuyên nghiệp sẽ giúp bạn tiếp cận khách hàng một cách hiệu quả.
            </p>
            <p>
              Chúng tôi sử dụng công nghệ tiên tiến, đảm bảo an toàn, dễ sử dụng và mang lại trải nghiệm tuyệt vời
              cho khách hàng của bạn.
            </p>
          </div>
        </div>
      </section>

      {/* Đội ngũ */}
      <section className="about-team">
        <div className="container">
          <h2>Đội ngũ kỹ thuật chuyên nghiệp</h2>
          <div className="team-grid">
            <div className="team-card">
              <h3>Bạn cần sự hỗ trợ nhanh chóng?</h3>
              <p>Đội ngũ kỹ thuật của chúng tôi luôn sẵn sàng 24/7 để xử lý mọi sự cố về trạm sạc.</p>
            </div>
            <div className="team-card">
              <h3>Bạn muốn tối ưu chi phí vận hành?</h3>
              <p>Chúng tôi mang đến giải pháp quản lý minh bạch, giảm chi phí cho doanh nghiệp.</p>
            </div>
            <div className="team-card">
              <h3>Bạn mong muốn sự tiện lợi?</h3>
              <p>Ứng dụng thân thiện, dễ dùng, hỗ trợ đặt chỗ, thanh toán điện tử và nhiều tính năng khác.</p>
            </div>
            <div className="team-card">
              <h3>Bạn cần mở rộng mạng lưới?</h3>
              <p>Chúng tôi cung cấp giải pháp kết nối mở, dễ dàng tích hợp với hệ thống của bạn.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
