import { useEffect } from "react";
import { FaBolt, FaMoneyBillWave, FaMobileAlt, FaProjectDiagram } from "react-icons/fa";
import "./index.scss";

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Hero Banner Video */}
      <section className="about-banner">
        <video autoPlay muted loop playsInline className="video-bg">
          <source src="/assets/videobanner.mp4" type="video/mp4" />
        </video>
        {/* <div className="overlay">
          <h1>Touch To Charge</h1>
          <p>“Chạm để kết nối – Sạc để vươn xa”</p>
        </div> */}
      </section>

      {/* Giới thiệu */}
      <section className="about-intro">
        <div className="intro-flex">
          <div className="intro-image">
            <img
              src="/assets/banner.jpg"
              alt="Giới thiệu Touch To Charge"
            />
          </div>

          <div className="intro-content">
            <h2>Giới thiệu về Touch To Charge</h2>
            <p>
              Touch To Charge là đơn vị tiên phong trong việc phát triển và vận hành hệ thống
              trạm sạc xe điện thông minh tại Việt Nam. Với định hướng
              <strong> “Xanh – Tiện lợi – Hiệu quả”</strong>, chúng tôi cam kết mang đến cho khách
              hàng trải nghiệm sạc xe hiện đại, an toàn và nhanh chóng.
            </p>

            <h3>Touch To Charge</h3>
            <p className="slogan">“Chạm để kết nối – Sạc để vươn xa”</p>

            <h3>Giá trị cốt lõi</h3>
            <ul>
              <ul>
                <li>
                  <span className="icon">🌱</span>
                  <span><strong>Khách hàng là trung tâm</strong> luôn lắng nghe và nâng cao trải nghiệm người dùng.</span>
                </li>
                <li>
                  <span className="icon">⚡</span>
                  <span><strong>Công nghệ tiên tiến</strong> áp dụng giải pháp sạc nhanh, thanh toán điện tử và quản lý thông minh.</span>
                </li>
                <li>
                  <span className="icon">🤝</span>
                  <span><strong>Kết nối mở rộng</strong> dễ dàng tích hợp với hệ thống và đối tác để phát triển mạng lưới.</span>
                </li>
                <li>
                  <span className="icon">🌍</span>
                  <span><strong>Phát triển bền vững</strong> góp phần thúc đẩy giao thông xanh và bảo vệ môi trường.</span>
                </li>
              </ul>

            </ul>
          </div>
        </div>
      </section>

      {/* Đội ngũ */}
      <section className="about-team">
        <div className="container">
          <h2>Đội ngũ kỹ thuật chuyên nghiệp</h2>
          <div className="team-grid">
            <div className="team-card">
              <FaBolt className="icon" />
              <h3>Bạn cần sự hỗ trợ nhanh chóng?</h3>
              <p>Đội ngũ kỹ thuật sẵn sàng 24/7 để xử lý mọi sự cố trạm sạc.</p>
            </div>
            <div className="team-card">
              <FaMoneyBillWave className="icon" />
              <h3>Bạn muốn tối ưu chi phí vận hành?</h3>
              <p>Giải pháp quản lý minh bạch, giúp doanh nghiệp tiết kiệm chi phí.</p>
            </div>
            <div className="team-card">
              <FaMobileAlt className="icon" />
              <h3>Bạn mong muốn sự tiện lợi?</h3>
              <p>Ứng dụng thân thiện, đặt chỗ nhanh chóng, thanh toán điện tử dễ dàng.</p>
            </div>
            <div className="team-card">
              <FaProjectDiagram className="icon" />
              <h3>Bạn cần mở rộng mạng lưới?</h3>
              <p>Giải pháp kết nối mở, dễ dàng tích hợp với hệ thống có sẵn.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
