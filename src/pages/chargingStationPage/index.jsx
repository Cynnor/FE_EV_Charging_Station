import { Link } from "react-router-dom";
import React from "react";
import "./index.scss";
import AC10 from "./image/AC10.jpg";
import sacAC4 from "./image/sacAC4.jpg";
import DC60 from "./image/DC60.jpg";
import DC120 from "./image/DC120.jpg";
import Banner from "./image/banner.jpg";


/* ----- Card hiển thị từng trạm sạc ----- */
function ChargingStationCard({
  image,
  title,
  sockets,
  power,
  plugTypes,
  installTypes,
  protection,
}) {
  return (
    <div className="card">
      <img src={image} alt={title} />
      <h3>{title}</h3>
      <ul>
        <li><b>Cách lắp đặt:</b> {installTypes}</li>
        <li><b>Số lượng cổng:</b> {sockets}</li>
        <li><b>Công suất:</b> {power}</li>
        <li><b>Dạng ổ cắm:</b> {plugTypes}</li>
        <li><b>Bảo vệ:</b> {protection}</li>
      </ul>
      <Link to="/charging-stations/card-station">
        <button>Khám phá</button>
      </Link>
    </div>
  );
}

/* ----- Hero section ----- */
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
        <img src={Banner} alt="Banner EV Charging" />
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
  const stations = [
    {
      image: AC10,
      title: "Trạm sạc xe máy xoay chiều AC 4 cổng",
      sockets: "4 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Trụ đứng / Treo tường",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch",
    },
    {
      image: sacAC4,
      title: "Trạm sạc xe máy xoay chiều AC 10 cổng",
      sockets: "10 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Tường nhà / Trụ",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống nước IP54",
    },
    {
      image: DC60,
      title: "Trạm sạc nhanh DC 60 kW",
      sockets: "3 cổng",
      power: "60 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống sét",
    },
    {
      image: DC120,
      title: "Trạm sạc nhanh DC 120 kW",
      sockets: "3 cổng",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
    },
  ];

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