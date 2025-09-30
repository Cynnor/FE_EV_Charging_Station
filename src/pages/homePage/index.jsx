import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ChargingMap from "../../components/ChargingMap";
// import Layout from "../../components/layout";
import "./index.scss";

const features = [
  {
    icon: "🗺️",
    title: "Tìm kiếm trụ sạc gần bạn",
    description:
      "Dễ dàng tìm kiếm các trụ sạc xe điện gần nhất với vị trí hiện tại của bạn trên bản đồ",
  },
  {
    icon: "⚡",
    title: "Thông tin chi tiết trụ sạc",
    description:
      "Xem thông tin đầy đủ về loại sạc, công suất, giá cả và tình trạng hoạt động",
  },
  {
    icon: "📱",
    title: "Đặt chỗ trước",
    description:
      "Đặt trước chỗ sạc để đảm bảo có sẵn khi bạn đến, tiết kiệm thời gian chờ đợi",
  },
  {
    icon: "💳",
    title: "Thanh toán tiện lợi",
    description:
      "Thanh toán dễ dàng qua ví điện tử, thẻ ngân hàng hoặc QR code ngay trên ứng dụng",
  },
  {
    icon: "📊",
    title: "Theo dõi quá trình sạc",
    description:
      "Giám sát thời gian sạc, mức pin hiện tại và chi phí trong thời gian thực",
  },
  {
    icon: "🔔",
    title: "Thông báo thông minh",
    description:
      "Nhận thông báo khi sạc hoàn tất, cảnh báo khi trụ sạc gặp sự cố",
  },
];

const statistics = [
  { number: "500+", label: "Trụ sạc khả dụng" },
  { number: "50,000+", label: "Người dùng tin tưởng" },
  { number: "99.5%", label: "Độ tin cậy" },
  { number: "24/7", label: "Hỗ trợ khách hàng" },
];

// Dữ liệu trạm sạc cho map thật (format tương thích với ChargingMap)
const mapStations = [
  { id: 1, name: "Trạm sạc Vincom Đồng Khởi", speed: "50 kW", price: "3.500 đ/kWh", coords: [10.7769, 106.7009], type: "DC" },
  { id: 2, name: "Trạm sạc Landmark 81", speed: "150 kW", price: "4.000 đ/kWh", coords: [10.7944, 106.7219], type: "DC" },
  { id: 3, name: "Trạm sạc Crescent Mall", speed: "50 kW", price: "3.200 đ/kWh", coords: [10.7374, 106.7223], type: "DC" },
  { id: 4, name: "Trạm sạc AEON Bình Tân", speed: "22 kW", price: "2.800 đ/kWh", coords: [10.7500, 106.6000], type: "AC" },
  { id: 5, name: "Trạm sạc GIGAMALL", speed: "50 kW", price: "3.300 đ/kWh", coords: [10.8500, 106.7500], type: "DC" },
];

const chargingStations = [
  {
    id: 1,
    name: "Trạm sạc Vincom Đồng Khởi",
    address: "72 Lê Thánh Tôn, Q1, TP.HCM",
    status: "available",
    type: "fast",
    price: "3,500 VNĐ/kWh",
  },
  {
    id: 2,
    name: "Trạm sạc Landmark 81",
    address: "720A Điện Biên Phủ, Bình Thạnh, TP.HCM",
    status: "busy",
    type: "ultra-fast",
    price: "4,000 VNĐ/kWh",
  },
  {
    id: 3,
    name: "Trạm sạc Crescent Mall",
    address: "101 Tôn Dật Tiên, Q7, TP.HCM",
    status: "available",
    type: "fast",
    price: "3,200 VNĐ/kWh",
  },
  {
    id: 4,
    name: "Trạm sạc AEON Bình Tân",
    address: "1 Đường số 17A, Bình Tân, TP.HCM",
    status: "maintenance",
    type: "normal",
    price: "2,800 VNĐ/kWh",
  },
  {
    id: 5,
    name: "Trạm sạc GIGAMALL",
    address: "240-242 Phạm Văn Đồng, Thủ Đức, TP.HCM",
    status: "available",
    type: "fast",
    price: "3,300 VNĐ/kWh",
  },
];

const HomePage = () => {
  const featuresRef = useRef(null);
  const statsRef = useRef(null);
  const stepsRef = useRef(null);

  // Highlight a station when a marker is clicked and scroll it into view
  const [selectedId, setSelectedId] = useState(null);
  const itemRefs = useRef({});

  const handleMarkerClick = (id) => {
    setSelectedId(id);
    requestAnimationFrame(() => {
      itemRefs.current[id]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  };

  // Nút đặt chỗ sẽ dẫn thẳng đến trang booking (không check login)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
          }
        });
      },
      window.scrollTo(0, 0),
      { threshold: 0.1 }
    );

    if (featuresRef.current) observer.observe(featuresRef.current);
    if (statsRef.current) observer.observe(statsRef.current);
    if (stepsRef.current) observer.observe(stepsRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="homepage">
      <main className="homepage__main">
        {/* Hero Section */}
        <section className="homepage__hero">
          <div className="homepage__hero-content">
            <h1>Tìm trụ sạc xe điện dễ dàng, sạc nhanh chóng</h1>
            <p>
              Ứng dụng tìm kiếm và sử dụng trụ sạc xe điện hàng đầu Việt Nam.
              Hơn 500 trụ sạc trên toàn quốc, đặt chỗ trước, thanh toán tiện
              lợi.
            </p>
            <div className="homepage__hero-actions">
              <button className="btn btn--primary">Tìm trụ sạc ngay</button>
              <button className="btn btn--secondary">Tải ứng dụng</button>
            </div>
          </div>
          <div className="homepage__hero-image">
            <div className="hero-visual">
              <div className="charging-station">🚗</div>
              <div className="dashboard">⚡</div>
              <div className="mobile-app">📱</div>
            </div>
          </div>
        </section>

        {/* Quick Search */}
        <section className="homepage__search">
          <div className="search-container">
            <h2>Tìm trụ sạc gần bạn</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Nhập địa chỉ hoặc tên địa điểm..."
              />
              <button className="search-btn">Tìm kiếm</button>
            </div>
            <div className="quick-filters">
              <button className="filter-btn active">Tất cả</button>
              <button className="filter-btn">Sạc nhanh</button>
              <button className="filter-btn">Sạc siêu tốc</button>
              <button className="filter-btn">Miễn phí</button>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="homepage__stats" ref={statsRef}>
          {statistics.map((stat, idx) => (
            <div key={idx} className="stat-item">
              <div className="stat-number">{stat.number}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </section>

        {/* Map Section */}
        <section className="homepage__map">
          <div className="section-header">
            <h2>Bản đồ trụ sạc</h2>
            <p>Tìm kiếm và xem thông tin chi tiết các trụ sạc gần bạn</p>
          </div>
          <div className="map-container">
            <div className="map-view">
              <ChargingMap
                stations={mapStations}
                center={[10.7769, 106.7009]}
                zoom={12}
                onSelect={(station) => handleMarkerClick(station.id)}
                selectedStation={selectedId ? mapStations.find(s => s.id === selectedId) : null}
              />
            </div>
            <div className="station-list">
              <h3>Trụ sạc gần bạn</h3>
              <div className="station-scroll">
                {chargingStations.map((station) => (
                  <div
                    key={station.id}
                    ref={(el) => (itemRefs.current[station.id] = el)}
                    className={`station-item ${selectedId === station.id ? "is-selected" : ""
                      }`}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(station.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        setSelectedId(station.id);
                    }}
                    aria-selected={selectedId === station.id}
                  >
                    <div className="station-header">
                      <h4>{station.name}</h4>
                      <div
                        className={`station-status status-${station.status}`}
                      >
                        {station.status === "available" && "Sẵn sàng"}
                        {station.status === "busy" && "Đang sử dụng"}
                        {station.status === "maintenance" && "Bảo trì"}
                      </div>
                    </div>
                    <p className="station-address">{station.address}</p>
                    <div className="station-details">
                      <div className="station-type">
                        {station.type === "ultra-fast" &&
                          "⚡ Sạc siêu tốc (150kW)"}
                        {station.type === "fast" && "⚡ Sạc nhanh (50kW)"}
                        {station.type === "normal" && "🔌 Sạc thường (22kW)"}
                      </div>
                      <div className="station-price">{station.price}</div>
                    </div>
                    <div className="station-actions">
                      <Link to="/charging-stations">
                        <button className="btn-small btn-primary">Đặt chỗ</button>
                      </Link>
                      <button className="btn-small btn-secondary">Chi tiết</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
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

        {/* How to use */}
        <section className="homepage__howto" ref={stepsRef}>
          <div className="section-header">
            <h2>Cách sử dụng đơn giản</h2>
            <p>Chỉ với 4 bước đơn giản để sạc xe điện</p>
          </div>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Tìm trụ sạc</h3>
              <p>Sử dụng bản đồ để tìm trụ sạc gần nhất</p>
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
          <p>Tải ứng dụng ngay để trải nghiệm sạc xe điện tiện lợi nhất</p>
          <div className="cta-buttons">
            <button className="btn btn--primary btn--large">
              Tải cho Android
            </button>
            <button className="btn btn--primary btn--large">Tải cho iOS</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
