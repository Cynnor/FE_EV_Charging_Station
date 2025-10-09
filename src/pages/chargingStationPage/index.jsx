import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./index.scss";
import { Link } from "react-router-dom";

function ChargingStationCard({
  image,
  title,
  //sockets,
  power,
  plugTypes,
  installTypes,
  protection,
  locationType,
}) {
  return (
    <div className="card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <ul>
        <li>
          <b>Kiểu lắp đặt:</b> {installTypes}
        </li>
        {/* <li>
          <b>Số lượng cổng:</b> {sockets}
        </li> */}
        <li>
          <b>Công suất:</b> {power}
        </li>
        <li>
          <b>Dạng ổ cắm:</b> {plugTypes}
        </li>
        <li>
          <b>Bảo vệ:</b> {protection}
        </li>
        <li>
          <b>Vị trí:</b> {locationType}
        </li>
      </ul>
      <div className="card-actions">
        {/* <button className="btn-detail">Chi tiết</button> */}
        <Link to="/booking">
          <button className="btn-rent">Đặt chỗ</button>
        </Link>
      </div>
    </div>
  );
}

// /* ----- Hero section ----- */
function ChargingStationHero() {
  return (
    <section className="charging-hero">
      <div className="hero-text">
        <h2>BỘ SẠC XE ĐIỆN </h2>
        <p className="highlight">
          SẠC THÔNG MINH, DỄ DÀNG SỬ DỤNG, LẮP ĐẶT NHANH CHÓNG !
        </p>
        <p>SẢN PHẨM AN TOÀN, ĐẠT TIÊU CHUẨN OCPP</p>
        <a href="#charging-stations" className="btn">
          Xem chi tiết sản phẩm
        </a>
      </div>
      <div className="hero-image">
        <img src={"./src/assets/banner.jpg"} alt="Banner EV Charging" />

      </div>
    </section>
  )
}

/* ----- Title Support ----- */
function TitleSupport() {
  return (
    <section className="title-support">
      <div className="title-content">
        <span className="title-subtitle">Sản phẩm của chúng tôi</span>
        <h2>Các loại trụ sạc</h2>
        <p>Giải pháp sạc điện toàn diện cho mọi nhu cầu</p>
      </div>

      <div className="title-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </section>
  )
}

/* ----- Trang chính hiển thị danh sách ----- */
function ChargingStationsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const stations = [
    {
      image: "./src/assets/AC4.jpg",
      title: "Trụ sạc xe máy xoay chiều AC 4 cổng",
      power: "2 kW / cổng",
      plugTypes: "2 chấu /3 chấu",
      installTypes: "Trụ đứng / Treo tường",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch",

      locationType: "Nhà riêng / Công cộng",
    },
    {
      image: "./src/assets/AC10.jpg",
      title: "Trụ sạc xe máy xoay chiều AC 10 cổng",
      power: "2 kW / cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Tường nhà / Trụ",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống nước IP54",
      locationType: "Công cộng / Bãi xe"
    },
    {
      image: "./src/assets/DC60.jpg",
      title: "Trụ sạc nhanh DC 60 kW",
      power: "60 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống sét",
      locationType: "Bãi xe / Trạm xăng"
    },
    {
      image: "./src/assets/DC120.jpg",
      title: "Trụ sạc nhanh DC 120 kW",
      sockets: "3 cổng",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection:
        "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",

      image: "./src/assets/DC120.jpg",
      title: "Trụ sạc nhanh DC 120 kW",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
      locationType: "Cao tốc / Bãi xe"
    },
    {
      image: "./src/assets/DC150.jpg",
      title: "Trụ sạc siêu nhanh DC 150 kW",
      power: "150 kW / cổng",
      plugTypes: "CCS2 DC",
      installTypes: "Tủ đứng ngoài trời",
      protection: "Quá tải / Quá nhiệt / Ngắn mạch / IP54",
      locationType: "Cao tốc / Lộ trình dài"
    },
    {
      image: "./src/assets/DC250.jpg",
      title: "Trụ sạc siêu nhanh DC 250 kW",
      power: "250 kW / cổng",
      plugTypes: "CCS2 DC",
      installTypes: "Tủ đứng ngoài trời",
      protection: "Quá tải / Quá nhiệt / Ngắn mạch / IP54",
      locationType: "Cao tốc / Lộ trình dài"
    },
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="charging-stations-page">
      {/* Hero giới thiệu */}
      <ChargingStationHero />

      <TitleSupport />

      {/* Danh sách card */}
      <section id="charging-stations" className="charging-stations">
        {stations.map((s, idx) => (
          <ChargingStationCard key={idx} {...s} />
        ))}
      </section>

      <section className="cta-section">
        <div className="cta-background"></div>
        <div className="cta-content">
          <h2>Sẵn sàng bắt đầu?</h2>
          <p>Liên hệ với chúng tôi để được tư vấn giải pháp sạc điện phù hợp nhất</p>
          <div className="cta-buttons">
            <Link to="/booking" className="btn-cta-primary">
              <span>Đặt chỗ ngay</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <button className="btn-cta-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Liên hệ tư vấn</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ChargingStationsPage;
