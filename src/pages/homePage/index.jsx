import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChargingMap from "../../components/chargingMap";
import "./index.scss";

const features = [
  { icon: "🗺️", title: "Tìm kiếm trụ sạc gần bạn", description: "Dễ dàng tìm kiếm các trụ sạc xe điện gần nhất với vị trí hiện tại của bạn trên bản đồ" },
  { icon: "⚡", title: "Thông tin chi tiết trụ sạc", description: "Xem thông tin đầy đủ về loại sạc, công suất, giá cả và tình trạng hoạt động" },
  { icon: "📱", title: "Đặt chỗ trước", description: "Đặt trước chỗ sạc để đảm bảo có sẵn khi bạn đến, tiết kiệm thời gian chờ đợi" },
  { icon: "💳", title: "Thanh toán tiện lợi", description: "Thanh toán dễ dàng qua ví điện tử, thẻ ngân hàng hoặc QR code ngay trên ứng dụng" },
  { icon: "📊", title: "Theo dõi quá trình sạc", description: "Giám sát thời gian sạc, mức pin hiện tại và chi phí trong thời gian thực" },
  { icon: "🔔", title: "Thông báo thông minh", description: "Nhận thông báo khi sạc hoàn tất, cảnh báo khi trụ sạc gặp sự cố" },
];

const mapStations = [
  { id: 1, name: "Trạm sạc Vincom Đồng Khởi", speed: "50 kW", price: "3.500 đ/kWh", coords: [10.7769, 106.7009], type: "DC", slots: { ac: 2, dc: 1, ultra: 0 } },
  { id: 2, name: "Trạm sạc Landmark 81", speed: "150 kW", price: "4.000 đ/kWh", coords: [10.7944, 106.7219], type: "DC", slots: { ac: 1, dc: 3, ultra: 1 } },
  { id: 3, name: "Trạm sạc Crescent Mall", speed: "50 kW", price: "3.200 đ/kWh", coords: [10.7374, 106.7223], type: "DC", slots: { ac: 0, dc: 2, ultra: 0 } },
  { id: 4, name: "Trạm sạc AEON Bình Tân", speed: "22 kW", price: "2.800 đ/kWh", coords: [10.75, 106.6], type: "AC", slots: { ac: 4, dc: 0, ultra: 0 } },
  { id: 5, name: "Trạm sạc GIGAMALL", speed: "50 kW", price: "3.300 đ/kWh", coords: [10.85, 106.75], type: "DC", slots: { ac: 1, dc: 1, ultra: 1 } },
];

// Haversine formula
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const HomePage = () => {
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const mapSectionRef = useRef(null);

  const [selectedId, setSelectedId] = useState(null);
  const itemRefs = useRef({});
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const navigate = useNavigate();

  // Lấy vị trí người dùng
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = [latitude, longitude];
          setUserLocation(coords);

          // Cập nhật danh sách trạm gần nhất
          const withDistance = mapStations.map((s) => ({
            ...s,
            distance: getDistanceKm(latitude, longitude, s.coords[0], s.coords[1]),
          }));
          setNearbyStations(withDistance.sort((a, b) => a.distance - b.distance).slice(0, 5));
        },
        (err) => console.error("Không lấy được vị trí:", err),
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    updateLocation();
  }, []);

  const handleMarkerClick = (id) => {
    setSelectedId(id);
  };

 const handleBooking = (stationId) => {
  const token = localStorage.getItem("token");
  const redirectUrl = `/booking?station=${stationId}`;
  if (!token) {
    // encode URL để tránh lỗi query string
    navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
  } else {
    navigate(redirectUrl);
  }
};

  return (
    <div className="homepage">
      <main className="homepage__main">

        {/* Hero Section */}
        <section className="homepage__hero">
          <div className="homepage__hero-content">
            <h1>Tìm trạm sạc xe điện dễ dàng, sạc nhanh chóng</h1>
            <p>
              Ứng dụng tìm kiếm và sử dụng trụ sạc xe điện hàng đầu Việt Nam.
              Hơn 500 trạm sạc trên toàn quốc, đặt chỗ trước, thanh toán tiện lợi.
            </p>
            <div className="homepage__hero-actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  if (mapSectionRef.current) {
                    const topPos = mapSectionRef.current.getBoundingClientRect().top + window.scrollY;
                    window.scrollTo({
                      top: topPos - 70,
                      behavior: "smooth",
                    });
                  }
                }}
              >
                Tìm trạm sạc ngay
              </button>
            </div>
          </div>
          <div className="homepage__hero-image">
            <div className="hero-visual">
              <div className="center-logo">
                <img src="/src/assets/logo.jpg" alt="Logo" className="hero-logo" />
              </div>
              <div className="charging-station">🚗</div>
              <div className="dashboard">⚡</div>
              <div className="mobile-app">📱</div>
            </div>
          </div>
        </section>

        {/* Quick Search
        <section className="homepage__search">
          <div className="search-container">
            <h2>Tìm trạm sạc gần bạn</h2>
            <div className="search-box">
              <input type="text" placeholder="Nhập địa chỉ hoặc tên địa điểm..." />
              <button className="search-btn">Tìm kiếm</button>
            </div>
            <div className="quick-filters">
              <button className="filter-btn active">Tất cả</button>
              <button className="filter-btn">Sạc nhanh</button>
              <button className="filter-btn">Sạc siêu tốc</button>
              <button className="filter-btn">Miễn phí</button>
            </div>
          </div>
        </section> */}

         {/* Map + Station List */}
    <section className="homepage__map" ref={mapSectionRef}>
      <div className="section-header">
            <h2>Bản đồ trụ sạc</h2>
            <p>Tìm kiếm và xem thông tin chi tiết các trụ sạc gần bạn</p>
          </div>
      <div className="map-container">
        <div className="station-list">
          <h3>Trạm sạc gần bạn</h3>
          <div className="station-scroll">
            {nearbyStations.map((station) => (
              <div
                key={station.id}
                ref={(el) => (itemRefs.current[station.id] = el)}
                className={`station-item ${selectedId === station.id ? "is-selected" : ""}`}
                onClick={() => setSelectedId(station.id)}
              >
                <div className="station-header">
                  <h4>{station.name}</h4>
                  <span className="distance">{station.distance.toFixed(1)} km</span>
                </div>
                <div className="station-details">
                  <div>⚡ {station.speed}</div>
                  <div>💰 {station.price}</div>
                  <div>🔌 AC: {station.slots.ac} | DC: {station.slots.dc} | Ultra: {station.slots.ultra}</div>
                </div>
                <div className="station-actions">
                  <button className="btn-small btn-primary" onClick={() => handleBooking(station.id)}>Đặt chỗ</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="map-view">
          <ChargingMap
            stations={mapStations}
            center={userLocation || [10.7769, 106.7009]}
            zoom={12}
            onSelect={(station) => handleMarkerClick(station.id)}
            selectedStation={selectedId ? mapStations.find((s) => s.id === selectedId) : null}
            userLocation={userLocation}
            onUpdateLocation={updateLocation}
          />
        </div>
      </div>
    </section>
        {/* Features Section */}
        <section className="homepage__features" ref={featuresRef}>
          <div className="section-header">
            <h2>Tính năng nổi bật</h2>
            <p>Những tính năng giúp bạn sạc xe điện thuận tiện và tiết kiệm</p>
          </div>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How to use Section */}
        <section className="homepage__howto" ref={stepsRef}>
          <div className="section-header">
            <h2>Cách sử dụng đơn giản</h2>
            <p>Chỉ với 4 bước đơn giản để sạc xe điện</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Tìm trạm sạc</h3>
              <p>Sử dụng bản đồ để tìm trạm sạc gần nhất</p>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Đặt chỗ</h3>
              <p>Đặt trước để đảm bảo có chỗ sạc khi đến</p>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Thanh toán</h3>
              <p>Thanh toán bằng nhiều phương thức</p>
            </div>
            <div className="step-item">
              <div className="step-number">4</div>
              <h3>Kết nối và sạc</h3>
              <p>Cắm sạc và theo dõi quá trình trên ứng dụng</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="homepage__cta">
          <h2>Bắt đầu hành trình xe điện của bạn</h2>
          {/* <p>Tải ứng dụng ngay để trải nghiệm sạc xe điện tiện lợi nhất</p>
          <div className="cta-buttons">
            <button className="btn btn--primary btn--large">Tải cho Android</button>
            <button className="btn btn--primary btn--large">Tải cho iOS</button>
          </div> */}
        </section>

      </main>
    </div>
  );
};

export default HomePage;
