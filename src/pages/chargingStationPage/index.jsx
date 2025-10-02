import { Link } from "react-router-dom";
import React from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import AC10 from "../../assets/AC10.jpg";
import sacAC4 from "../../assets/sacAC4.jpg";
import DC60 from "../../assets/DC60.jpg";
import DC120 from "../../assets/DC120.jpg";
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

/* ----- Hero section ----- */
function ChargingStationHero() {
  return (
    <section className="charging-hero">
      <div className="hero-background-pattern"></div>

      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
            </svg>
            <span>Công nghệ tiên tiến</span>
          </div>

          <h2>BỘ SẠC XE ĐIỆN</h2>
          <p className="highlight">SẠC THÔNG MINH, DỄ DÀNG SỬ DỤNG, LẮP ĐẶT NHANH CHÓNG !</p>
          <p className="description">SẢN PHẨM AN TOÀN, ĐẠT TIÊU CHUẨN OCPP</p>

          <div className="hero-features">
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Tiêu chuẩn OCPP</span>
            </div>
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>An toàn tuyệt đối</span>
            </div>
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Hiệu suất cao</span>
            </div>
          </div>

          <a href="#charging-stations" className="btn">
            <span>Xem chi tiết sản phẩm</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <div className="hero-image">
          <div className="image-decoration"></div>
          <img src={Banner || "/placeholder.svg"} alt="Banner EV Charging" />

          <div className="floating-card">
            <div className="floating-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
              </svg>
            </div>
            <div className="floating-content">
              <span className="floating-label">Sạc nhanh</span>
              <span className="floating-value">Lên đến 120kW</span>
            </div>
          </div>
        </div>
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
  const stations = [
    {
      image: AC10,
      title: "Trạm sạc xe máy xoay chiều AC 4 cổng",
      sockets: "4 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Trụ đứng / Treo tường",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch",
      type: "AC",
    },
    {
      image: sacAC4,
      title: "Trạm sạc xe máy xoay chiều AC 10 cổng",
      sockets: "10 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Tường nhà / Trụ",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống nước IP54",
      type: "AC",
    },
    {
      image: DC60,
      title: "Trạm sạc nhanh DC 60 kW",
      sockets: "3 cổng",
      power: "60 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống sét",
      type: "DC Fast",
    },
    {
      image: DC120,
      title: "Trạm sạc nhanh DC 120 kW",
      sockets: "3 cổng",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
      type: "DC Ultra Fast",
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
