import { useEffect } from "react";
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
  chargerType,
  price,
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
        <li>
          <b>Giá:</b> {price.toLocaleString()} VNĐ
        </li>
      </ul>
      <div className="card-actions">
        {/* <button className="btn-detail">Chi tiết</button> */}
        <Link
          to={`/booking?type=${chargerType === "DC_SUPER" ? "DC_ULTRA" : chargerType
            }`}
        >
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
        <img src={"./assets/banner.jpg"} alt="Banner EV Charging" />
      </div>
    </section>
  );
}

/* ----- Title Support ----- */
function TitleSupport() {
  return (
    <section className="title-support">
      <div className="title-content">
        {/* <span className="title-subtitle">Sản phẩm của chúng tôi</span> */}
        <h2>Các loại trụ sạc</h2>
        {/* <p>Giải pháp sạc điện toàn diện cho mọi nhu cầu</p> */}
      </div>

      <div className="title-deczoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
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
      image: "./assets/AC4.jpg",
      title: "Trụ sạc xe máy xoay chiều AC 7 kW",
      power: "7 kW / cổng",
      plugTypes: "2 chấu /3 chấu",
      installTypes: "Trụ đứng / Treo tường",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch",
      locationType: "Nhà riêng / Công cộng",
      chargerType: "AC",
      price: 5000,
    },
    {
      image: "./assets/AC10.jpg",
      title: "Trụ sạc xe máy xoay chiều AC 22 kW",
      power: "22 kW",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Tường nhà / Trụ",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống nước IP54",
      locationType: "Công cộng / Bãi xe",
      chargerType: "AC",
      price: 10000,
    },
    {
      image: "./assets/DC60.jpg",
      title: "Trụ sạc nhanh DC 60 kW",
      power: "60 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống sét",
      locationType: "Bãi xe / Trạm xăng",
      chargerType: "DC",
      price: 15000,
    },
    {
      image: "./assets/DC120.jpg",
      title: "Trụ sạc nhanh DC 120 kW",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection:
        "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
      locationType: "Cao tốc / Bãi xe",
      chargerType: "DC",
      price: 20000,
    },
    {
      image: "./assets/DC150.jpg",
      title: "Trụ sạc siêu nhanh DC 150 kW",
      power: "150 kW / cổng",
      plugTypes: "CCS2 DC",
      installTypes: "Tủ đứng ngoài trời",
      protection: "Quá tải / Quá nhiệt / Ngắn mạch / IP54",
      locationType: "Cao tốc / Lộ trình dài",
      chargerType: "DC_SUPER",
      price: 25000,
    },
    {
      image: "./assets/DC250.jpg",
      title: "Trụ sạc siêu nhanh DC 250 kW",
      power: "250 kW / cổng",
      plugTypes: "CCS2 DC",
      installTypes: "Tủ đứng ngoài trời",
      protection: "Quá tải / Quá nhiệt / Ngắn mạch / IP54",
      locationType: "Cao tốc / Lộ trình dài",
      chargerType: "DC_SUPER",
      price: 30000,
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
    </div>
  );
}

export default ChargingStationsPage;
