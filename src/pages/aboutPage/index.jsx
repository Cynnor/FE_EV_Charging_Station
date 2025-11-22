import { useEffect } from "react";
import {
  FaBolt,
  FaMoneyBillWave,
  FaMobileAlt,
  FaProjectDiagram,
} from "react-icons/fa";
import "./index.scss";

const teamFeatures = [
  {
    icon: <FaBolt className="icon" />,
    title: "Bạn cần sự hỗ trợ nhanh chóng?",
    desc: "Đội ngũ kỹ thuật sẵn sàng 24/7 để xử lý mọi sự cố trạm sạc.",
  },
  {
    icon: <FaMoneyBillWave className="icon" />,
    title: "Bạn muốn tối ưu chi phí vận hành?",
    desc: "Giải pháp quản lý minh bạch, giúp doanh nghiệp tiết kiệm chi phí.",
  },
  {
    icon: <FaMobileAlt className="icon" />,
    title: "Bạn mong muốn sự tiện lợi?",
    desc: "Ứng dụng thân thiện, đặt chỗ nhanh chóng, thanh toán điện tử dễ dàng.",
  },
  {
    icon: <FaProjectDiagram className="icon" />,
    title: "Bạn cần mở rộng mạng lưới?",
    desc: "Giải pháp kết nối mở, dễ dàng tích hợp với hệ thống có sẵn.",
  },
];

const AboutPage = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      {/* Banner */}
      <section className="about-banner">
        <video autoPlay muted loop playsInline className="video-bg">
          <source src="/assets/videobanner.mp4" type="video/mp4" />
        </video>
      </section>

      {/* Intro Section */}
      <section className="about-intro">
        <div className="intro-flex">
          <div className="intro-image">
            <img src="/assets/banner.jpg" alt="Ảnh giới thiệu 1" />
            <img src="/assets/about_img.jpg" alt="Ảnh giới thiệu 2" />
          </div>

          <div className="intro-content">
            <h2>Giới thiệu Touch To Charge</h2>
            <p>
              Touch To Charge là đơn vị tiên phong trong việc phát triển và vận
              hành hệ thống trạm sạc xe điện thông minh tại Việt Nam. Với định
              hướng <strong>“Xanh – Tiện lợi – Hiệu quả”</strong>, chúng tôi cam
              kết mang đến cho khách hàng trải nghiệm sạc xe hiện đại, an toàn
              và nhanh chóng.
            </p>

            <h3>Touch To Charge</h3>
            <p className="slogan">“Chạm để kết nối – Sạc để vươn xa”</p>

            <h3>Giá trị cốt lõi</h3>
            <ul>
              <li>
                <strong>Khách hàng là trung tâm:</strong> luôn lắng nghe và nâng
                cao trải nghiệm người dùng.
              </li>
              <li>
                <strong>Công nghệ tiên tiến:</strong> áp dụng sạc nhanh, thanh
                toán điện tử và quản lý thông minh.
              </li>
              <li>
                <strong>Kết nối mở rộng:</strong> dễ dàng tích hợp với hệ thống
                và đối tác.
              </li>
              <li>
                <strong>Phát triển bền vững:</strong> góp phần thúc đẩy giao
                thông xanh và bảo vệ môi trường.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="about-team">
        <div className="container">
          <h2>Đội ngũ kỹ thuật chuyên nghiệp</h2>
          <div className="team-grid">
            {teamFeatures.map((item, index) => (
              <div key={index} className="team-card">
                {item.icon}
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
