<<<<<<< HEAD
import { Link } from "react-router-dom";
import React from "react";
=======
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
>>>>>>> origin/main
import "./index.scss";

// Icon cho người dùng
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Icon cho trạm AC
const acIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/833/833314.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Icon cho trạm DC
const dcIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/833/833322.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const ChargingMap = ({ stations, center, zoom = 13, onSelect, userLocation, onUpdateLocation }) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker trạm sạc */}
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={station.coords}
          icon={station.type === "AC" ? acIcon : dcIcon}
          eventHandlers={{
            click: () => onSelect && onSelect(station),
          }}
        >
          <Popup>
            <b>{station.name}</b>
            <br />
            ⚡ {station.speed}
            <br />
            💰 {station.price}
          </Popup>
        </Marker>
      ))}

      {/* Marker người dùng */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={userIcon}
          eventHandlers={{
            click: () => {
              if (onUpdateLocation) onUpdateLocation();
            },
          }}
        >
          <Popup>Vị trí của bạn</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

<<<<<<< HEAD
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
      protection:
        "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
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
=======
export default ChargingMap;
>>>>>>> origin/main
