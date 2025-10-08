import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  );
}

/* ----- Title Support ----- */
function TitleSupport() {
  return (
    <section className="intro-banner">
      <h2>Support</h2>
    </section>
  );
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
    },
    {
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
  ];

  // Không kiểm tra login, chỉ hiển thị danh sách và nút điều hướng sang booking

  return (
    <div>
      {/* Hero giới thiệu */}
      <ChargingStationHero />

      <section className="title-support">
        <h2>Các loại trụ sạc</h2>
      </section>

      {/* Danh sách card */}
      <section id="charging-stations" className="charging-stations">
        {stations.map((s, idx) => (
          <ChargingStationCard key={idx} {...s} />
        ))}
      </section>
    </div>
  );
}

export default ChargingStationsPage;
