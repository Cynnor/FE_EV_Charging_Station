import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChargingMap from "../../components/chargingMap";
import "./index.scss";
import api from "../../config/api";

// ===== Static Data =====
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
      <div className="section-header">
        <h2>Về chúng tôi</h2>
        <p>Hệ thống trạm sạc xe điện hàng đầu Việt Nam</p>
      </div>
    </section>
  );
};

// ===== HomePage =====
const SAMPLE_TRANSACTION = {
  success: true,
  message: "OK",
  data: {
    vehicle: {
      owner: "68d9f66de455b8d4cf0c5b39",
      make: "VinFast",
      model: "VF8",
      year: 2022,
      color: "White",
      plateNumber: "51H-123.45",
      vin: "WVWAA71K08W201030",
      type: "car",
      batteryCapacityKwh: 82,
      connectorType: "DC",
      status: "active",
      createdAt: "2025-10-13T03:27:40.357Z",
      updatedAt: "2025-10-13T03:27:40.357Z",
      id: "68ec71acb40ef939ab19bc97",
    },
    items: [
      {
        slot: {
          port: "68f0633908aa255495796a00",
          order: 1,
          status: "available",
          nextAvailableAt: null,
          createdAt: "2025-10-20T02:40:10.877Z",
          updatedAt: "2025-10-20T02:40:10.877Z",
          id: "68f5a10a00b136b8c9dae65d",
        },
        startAt: "2025-10-01T10:00:00.000Z",
        endAt: "2025-10-01T11:00:00.000Z",
      },
    ],
    status: "pending",
    qrCheck: false,
    createdAt: "2025-10-20T02:55:31.929Z",
    updatedAt: "2025-10-20T02:55:31.929Z",
    id: "68f5a4a300b136b8c9dae88a",
  },
};

const HomePage = () => {
  const featuresRef = useRef(null);
  const stepsRef = useRef(null);
  const mapSectionRef = useRef(null);
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [mapStations, setMapStations] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyStations, setNearbyStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // const [transaction, setTransaction] = useState(null);
  // const [txLoading, setTxLoading] = useState(true);
  const itemRefs = useRef({});

  // ===== Fetch Station Data from API =====
  useEffect(() => {
    let isMounted = true; // tránh lỗi khi unmount

    const fetchStations = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stations");
        // console.log("Station API result:", res.data);

        // Trường hợp API trả về mảng hoặc object
        let stationsData = [];
        if (Array.isArray(res.data)) {
          stationsData = res.data;
        } else if (Array.isArray(res.data.items)) {
          stationsData = res.data.items;
        } else if (res.data && typeof res.data === "object") {
          stationsData = [res.data];
        }

        // Lọc trạm có tọa độ hợp lệ
        stationsData = stationsData.filter((s) => s.latitude && s.longitude);

        // Format lại dữ liệu
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
          console.log("✅ Cập nhật danh sách trạm:", formatted);
        }
      } catch (err) {
        console.error("Error fetching stations:", err);
        if (isMounted) setError("Không thể tải dữ liệu trạm sạc.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    // Gọi lần đầu
    fetchStations();

    // 🔁 Gọi lại API mỗi 30 giây để cập nhật danh sách trạm mới
    const interval = setInterval(fetchStations, 1000000);

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

  const handleBooking = (stationId) => {
    const token = localStorage.getItem("token");
    const redirectUrl = `/booking/${stationId}`;
    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(redirectUrl);
    }
  };

  // // fetch latest transaction
  // useEffect(() => {
  //   let mounted = true;
  //   const fetchLatestTransaction = async () => {
  //     try {
  //       setTxLoading(true);
  //       const res = await api.get("/transactions/latest");
  //       const payload = res?.data?.data ?? res?.data ?? null;
  //       if (mounted) {
  //         setTransaction(payload ?? SAMPLE_TRANSACTION.data);
  //       }
  //     } catch (err) {
  //       console.error("Error fetching transaction:", err);
  //       if (mounted) setTransaction(SAMPLE_TRANSACTION.data);
  //     } finally {
  //       if (mounted) setTxLoading(false);
  //     }
  //   };

  //   fetchLatestTransaction();

  //   return () => {
  //     mounted = false;
  //   };
  // }, []);

  // ===== Render =====
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
      {/* move all page sections below a content wrapper so they are shifted under the header */}
      <div
        className="homepage__content"
        style={{ paddingTop: 80 }} // adjust 80 to match your header height
      >
        {/* ===== Hero Section ===== */}
        <section className="homepage__hero">
          <div className="homepage__hero-content">
            <h1>Tìm trạm sạc xe điện dễ dàng, sạc nhanh chóng</h1>
            <p>
              Ứng dụng tìm kiếm và sử dụng trụ sạc xe điện hàng đầu Việt Nam.
              Hơn 500 trạm sạc trên toàn quốc, đặt chỗ trước, thanh toán tiện
              lợi.
            </p>
            <div className="homepage__hero-actions">
              <button
                className="btn btn--primary"
                onClick={() => {
                  if (mapSectionRef.current) {
                    const topPos =
                      mapSectionRef.current.getBoundingClientRect().top +
                      window.scrollY;
                    window.scrollTo({ top: topPos, behavior: "smooth" });
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
                <img
                  src="/src/assets/logo.jpg"
                  alt="Logo"
                  className="hero-logo"
                />
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
            <h2>Bản đồ trạm sạc</h2>
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
                    className={`station-item ${selectedId === station.id ? "is-selected" : ""
                      }`}
                    onClick={() => setSelectedId(station.id)}
                  >
                    <div className="station-header">
                      <h4>{station.name}</h4>
                      {station.distance && (
                        <span className="distance">
                          {station.distance.toFixed(1)} km
                        </span>
                      )}
                      <div className={`status-indicator ${station.status}`}>
                        {station.status === "available" && "🟢"}
                        {station.status === "busy" && "🟡"}
                        {station.status === "maintenance" && "🔴"}
                      </div>
                    </div>
                    <div className="station-details">
                      <div className="item">⚡ {station.speed}</div>
                      <div className="item">💰 {station.price}</div>
                      <div className="item">
                        🔌 AC: {station.slots.ac} | DC: {station.slots.dc} |
                        Ultra: {station.slots.ultra}
                      </div>
                      <div className="item">📍 {station.address}</div>
                    </div>
                    <div className="station-actions">
                      <button
                        className="btn-small btn-primary"
                        onClick={() => handleBooking(station.id)}
                      >
                        Đặt chỗ
                      </button>
                    </div>
                  </div>
                ))}
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

        {/* ===== Recent transaction (new) =====
        <section className="homepage__transaction" aria-live="polite">
          <div className="section-header">
            <h2>Giao dịch mới nhất</h2>
          </div>

          {txLoading ? (
            <div className="tx-loading">Đang tải giao dịch...</div>
          ) : transaction ? (
            <div className="tx-card">
              <div className="tx-row">
                <div className="tx-label">Booking ID</div>
                <div className="tx-value">{transaction.id}</div>
              </div>

              <div className="tx-row">
                <div className="tx-label">Trạng thái</div>
                <div className="tx-value">{transaction.status}</div>
              </div>

              <div className="tx-divider" />

              <h4>Thông tin xe</h4>
              <div className="tx-row">
                <div className="tx-label">Biển số</div>
                <div className="tx-value">{transaction.vehicle?.plateNumber}</div>
              </div>
              <div className="tx-row">
                <div className="tx-label">Xe</div>
                <div className="tx-value">
                  {transaction.vehicle?.make} {transaction.vehicle?.model} ({transaction.vehicle?.year})
                </div>
              </div>

              <div className="tx-divider" />

              <h4>Slot & Thời gian</h4>
              {transaction.items && transaction.items.length > 0 ? (
                <>
                  <div className="tx-row">
                    <div className="tx-label">Cổng (port)</div>
                    <div className="tx-value">{transaction.items[0].slot?.port}</div>
                  </div>
                  <div className="tx-row">
                    <div className="tx-label">Thứ tự</div>
                    <div className="tx-value">{transaction.items[0].slot?.order}</div>
                  </div>
                  <div className="tx-row">
                    <div className="tx-label">Trạng thái slot</div>
                    <div className="tx-value">{transaction.items[0].slot?.status}</div>
                  </div>
                  <div className="tx-row">
                    <div className="tx-label">Bắt đầu</div>
                    <div className="tx-value">
                      {transaction.items[0].startAt ? new Date(transaction.items[0].startAt).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div className="tx-row">
                    <div className="tx-label">Kết thúc</div>
                    <div className="tx-value">
                      {transaction.items[0].endAt ? new Date(transaction.items[0].endAt).toLocaleString() : "-"}
                    </div>
                  </div>
                </>
              ) : (
                <div>Không có thông tin slot</div>
              )}

              <div className="tx-divider" />
              <div className="tx-row">
                <div className="tx-label">QR Check</div>
                <div className="tx-value">{String(transaction.qrCheck)}</div>
              </div>
              <div className="tx-row">
                <div className="tx-label">Tạo lúc</div>
                <div className="tx-value">{transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : "-"}</div>
              </div>
            </div>
          ) : (
            <div>Không có giao dịch nào.</div>
          )}
        </section> */}

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
          <h2>Bắt đầu hành trình xe điện </h2>
        </section>

        {/* About Section */}
        <About />

      </div>

    </div>
  );
};

export default HomePage;
