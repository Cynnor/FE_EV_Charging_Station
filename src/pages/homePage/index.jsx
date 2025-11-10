import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Tag, Tooltip } from "antd";
import { 
  MapPin, 
  Zap, 
  DollarSign, 
  Navigation, 
  Clock,
  Activity,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import ChargingMap from "../../components/chargingMap";
import "./index.scss";
import api from "../../config/api";

// ===== Helper Function =====
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ===== About Section =====
const About = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <section className="homepage__about">
      <div className="section-header"></div>
    </section>
  );
};

// ===== HomePage =====
const HomePage = () => {
  // const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const mapSectionRef = useRef(null);
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [mapStations, setMapStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const itemRefs = useRef({});

  // ===== Handle VNPay Return =====
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const vnpResponseCode = urlParams.get("vnp_ResponseCode");

    if (vnpResponseCode) {
      const queryString = window.location.search;
      const newUrl =
        window.location.origin + "/payment-success" + queryString;
      window.location.href = newUrl;
    }
  }, []);
  // ===== Fetch Station Data from API =====
  useEffect(() => {
    let isMounted = true;

    const fetchStations = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stations");

        let stationsData = [];
        if (Array.isArray(res.data)) {
          stationsData = res.data;
        } else if (Array.isArray(res.data.items)) {
          stationsData = res.data.items;
        } else if (res.data && typeof res.data === "object") {
          stationsData = [res.data];
        }

        stationsData = stationsData.filter((s) => s.latitude && s.longitude);

        const formatted = stationsData.map((s, index) => ({
          id: s.id || index + 1,
          name: s.name || "Trạm sạc không tên",
          coords: [s.latitude, s.longitude],
          status: s.status === "active" ? "available" : "maintenance",
          address: s.address || "Không rõ địa chỉ",
          speed: s.ports?.[0]?.speed || "N/A",
          price: s.ports?.[0]?.price
            ? `${s.ports[0].price.toLocaleString()} đ/kWh`
            : "N/A",
          slots: {
            ac: s.ports?.filter((p) => p.type === "AC").length || 0,
            dc: s.ports?.filter((p) => p.type === "DC").length || 0,
            ultra: s.ports?.filter((p) => p.type === "Ultra").length || 0,
          },
        }));

        if (isMounted) {
          setMapStations(formatted);
        }
      } catch (err) {
        if (isMounted) setError("Không thể tải dữ liệu trạm sạc.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStations();
    const interval = setInterval(fetchStations, 300000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ===== Get User Location =====
  const updateLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const coords = [latitude, longitude];
          setUserLocation(coords);

          if (mapStations.length > 0) {
            const withDistance = mapStations.map((s) => ({
              ...s,
              distance: getDistanceKm(
                latitude,
                longitude,
                s.coords[0],
                s.coords[1]
              ),
            }));
            setNearbyStations(
              withDistance.sort((a, b) => a.distance - b.distance).slice(0, 5)
            );
          }
        },
        (err) => console.error("Không lấy được vị trí:", err),
        { enableHighAccuracy: true }
      );
    }
  };

  useEffect(() => {
    if (mapStations.length > 0) updateLocation();
  }, [mapStations]);

  const handleMarkerClick = (id) => setSelectedId(id);

  // ✅ Sửa tại đây: Điều hướng sang /booking/:stationId
  const handleBooking = (stationId) => {
    const token = localStorage.getItem("token");
    const redirectUrl = `/booking/${stationId}`;
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(redirectUrl);
    }
  };

  // ✅ Sửa luôn nút “Tìm trạm sạc ngay” → sang trang /booking
  const handleFindStation = () => {
    const token = localStorage.getItem("token");
    const redirectUrl = "/booking";
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(redirectUrl);
    }
  };

  // ✅ Thêm nút "Thêm xe của bạn" → chuyển tới profilePage (section thêm xe)
  const handleAddVehicle = () => {
    const token = localStorage.getItem("token");
    const redirectUrl = "/profile?section=add-vehicle&action=add";
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(redirectUrl);
    }
  };

  if (loading) {
    return (
      <div className="homepage__loading">
        <p>Đang tải dữ liệu trạm sạc...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage__error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="homepage__main">
        {/* ===== Hero Section ===== */}
        <section className="homepage__hero">
          <div className="homepage__hero-content">
            <h1>Tìm trạm sạc xe điện dễ dàng, sạc nhanh chóng</h1>
            <p>
              Ứng dụng tìm kiếm và sử dụng trụ sạc xe điện hàng đầu Việt Nam.
              Hơn 100+ trạm sạc trên toàn quốc, đặt chỗ trước, thanh toán tiện
              lợi.
            </p>
            <div className="homepage__hero-actions">
              <button className="btn btn--primary" onClick={handleFindStation}>
                Tìm trạm sạc ngay
              </button>
            </div>
          </div>
          <div className="homepage__hero-image">
            <div className="hero-visual">
              <div className="center-logo">
                <img src="/assets/logo.jpg" alt="Logo" className="hero-logo" />
              </div>
              <div className="charging-station">🚗</div>
              <div className="dashboard">⚡</div>
              <div className="mobile-app">📱</div>
            </div>
          </div>
        </section>

        {/* ===== Map + Station List ===== */}
        <section className="homepage__map" ref={mapSectionRef}>
          <div className="section-header">
            <h2>Trạm sạc gần bạn</h2>
          </div>
          <div className="map-container">
            <div className="station-list">
              <div className="station-scroll">
                {nearbyStations.length === 0 ? (
                  <div className="empty-state">
                    <AlertCircle size={48} color="#94a3b8" />
                    <p>Không tìm thấy trạm sạc gần bạn</p>
                    <span>Vui lòng bật định vị để tìm trạm gần nhất</span>
                  </div>
                ) : (
                  nearbyStations.map((station) => (
                    <div
                      key={station.id}
                      ref={(el) => (itemRefs.current[station.id] = el)}
                      className={`station-card ${selectedId === station.id ? "selected" : ""}`}
                      onClick={() => setSelectedId(station.id)}
                    >
                      <div className="card-top">
                        <div className="station-name-status">
                          <h4>{station.name}</h4>
                          {station.status === "available" ? (
                            <Tag color="success" icon={<CheckCircle size={12} />}>Sẵn sàng</Tag>
                          ) : station.status === "busy" ? (
                            <Tag color="warning" icon={<Clock size={12} />}>Đang bận</Tag>
                          ) : (
                            <Tag color="error" icon={<AlertCircle size={12} />}>Bảo trì</Tag>
                          )}
                        </div>
                        {station.distance && (
                          <div className="distance">
                            <Navigation size={14} />
                            <span>{station.distance.toFixed(1)} km</span>
                          </div>
                        )}
                      </div>

                      <div className="card-info">
                        <div className="info-grid">
                          <div className="info-cell">
                            <Zap size={16} color="#16a34a" />
                            <div>
                              <span className="label">Tốc độ</span>
                              <span className="value">{station.speed}</span>
                            </div>
                          </div>
                          <div className="info-cell">
                            <DollarSign size={16} color="#16a34a" />
                            <div>
                              <span className="label">Giá</span>
                              <span className="value price">{station.price}</span>
                            </div>
                          </div>
                        </div>

                        <div className="ports">
                          {station.slots.ac > 0 && (
                            <Tooltip title="AC - Sạc chậm">
                              <Badge count={station.slots.ac} style={{ backgroundColor: '#3b82f6' }}>
                                <Tag color="blue">AC</Tag>
                              </Badge>
                            </Tooltip>
                          )}
                          {station.slots.dc > 0 && (
                            <Tooltip title="DC - Sạc nhanh">
                              <Badge count={station.slots.dc} style={{ backgroundColor: '#16a34a' }}>
                                <Tag color="green">DC</Tag>
                              </Badge>
                            </Tooltip>
                          )}
                          {station.slots.ultra > 0 && (
                            <Tooltip title="Ultra - Sạc siêu nhanh">
                              <Badge count={station.slots.ultra} style={{ backgroundColor: '#8b5cf6' }}>
                                <Tag color="purple">Ultra</Tag>
                              </Badge>
                            </Tooltip>
                          )}
                        </div>

                        <div className="address">
                          <MapPin size={14} color="#f59e0b" />
                          <span>{station.address}</span>
                        </div>
                      </div>

                      <button
                        className="book-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBooking(station.id);
                        }}
                      >
                        <Activity size={16} />
                        Đặt chỗ ngay
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="map-view">
              <ChargingMap
                stations={mapStations}
                center={userLocation}
                zoom={12}
                onSelect={(station) => handleMarkerClick(station.id)}
                selectedStation={
                  selectedId
                    ? mapStations.find((s) => s.id === selectedId)
                    : null
                }
                userLocation={userLocation}
                onUpdateLocation={updateLocation}
              />
            </div>
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

        <section className="homepage__cta">
          <h2>Bắt đầu hành trình xe điện của bạn</h2>
        </section>

        <About />
      </div>
    </div>
  );
};

export default HomePage;

