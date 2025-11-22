// ===== IMPORTS =====
// Import các React hooks cần thiết
import { useEffect, useRef, useState } from "react";
// Import hook điều hướng từ React Router
import { useNavigate } from "react-router-dom";
// Import các component UI từ Ant Design
import { Badge, Tag, Tooltip } from "antd";
// Import các icon từ thư viện lucide-react
import {
  MapPin, // Icon vị trí
  Zap, // Icon điện/năng lượng
  DollarSign, // Icon tiền tệ
  Navigation, // Icon định vị
  Clock, // Icon đồng hồ
  Activity, // Icon hoạt động
  CheckCircle, // Icon check/hoàn thành
  AlertCircle, // Icon cảnh báo
} from "lucide-react";
// Import component bản đồ tùy chỉnh
import ChargingMap from "../../components/chargingMap";
// Import file SCSS cho styling
import "./index.scss";
// Import API configuration
import api from "../../config/api";

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Bán kính trung bình của Trái Đất tính bằng km

  // Chuyển đổi độ sang radian
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);

  // Áp dụng công thức Haversine
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;

  // Tính khoảng cách cuối cùng
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// ===== ABOUT COMPONENT =====
/**
 * Component hiển thị phần About/Giới thiệu về dịch vụ
 * Hiện tại component này chỉ có phần header trống, có thể mở rộng sau
 *
 * @returns {JSX.Element} Section About
 */
const About = () => {
  /**
   * Effect: Tự động cuộn lên đầu trang khi component được mount
   * Đảm bảo người dùng luôn thấy nội dung từ đầu trang
   */
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []); // Dependency array rỗng = chỉ chạy 1 lần khi mount

  return (
    <section className="homepage__about">
      <div className="section-header"></div>
    </section>
  );
};

// ===== HOMEPAGE MAIN COMPONENT =====
/**
 * Component chính của trang chủ
 *
 * Chức năng chính:
 * - Hiển thị hero section với CTA (Call To Action)
 * - Hiển thị bản đồ với các trạm sạc
 * - Hiển thị danh sách 5 trạm sạc gần nhất dựa trên vị trí người dùng
 * - Hiển thị hướng dẫn sử dụng dịch vụ (4 bước)
 * - Xử lý các action: đặt chỗ, tìm trạm, thêm xe
 * - Xử lý callback từ VNPay (thanh toán)
 *
 * @returns {JSX.Element} Homepage component
 */
const HomePage = () => {
  // ===== REFS =====
  // Ref để scroll đến section hướng dẫn sử dụng
  const stepsRef = useRef(null);
  // Ref để scroll đến section bản đồ
  const mapSectionRef = useRef(null);
  // Ref lưu các DOM element của từng card trạm sạc (để scroll khi click marker)
  const itemRefs = useRef({});

  // Hook điều hướng trang
  const navigate = useNavigate();

  // ===== STATE MANAGEMENT =====
  // ID của trạm sạc đang được chọn trên bản đồ/danh sách
  const [selectedId, setSelectedId] = useState(null);

  // Mảng chứa tất cả các trạm sạc để hiển thị trên bản đồ
  // Format: [{ id, name, coords: [lat, lng], status, address, speed, price, slots }]
  const [mapStations, setMapStations] = useState([]);

  // Vị trí hiện tại của người dùng
  // Format: [latitude, longitude] hoặc null nếu chưa có
  const [userLocation, setUserLocation] = useState(null);

  // Mảng chứa 5 trạm sạc gần nhất với người dùng (đã sắp xếp theo khoảng cách)
  const [nearbyStations, setNearbyStations] = useState([]);

  // Trạng thái loading khi đang fetch dữ liệu từ API
  const [loading, setLoading] = useState(true);

  // Lưu thông báo lỗi nếu có
  const [error, setError] = useState(null);

  // ===== EFFECT: HANDLE VNPAY CALLBACK =====
  /**
   * Effect xử lý callback từ VNPay sau khi thanh toán
   *
   * Flow:
   * 1. Người dùng thanh toán trên VNPay
   * 2. VNPay redirect về homepage với params ?vnp_ResponseCode=...
   * 3. Effect này detect và redirect sang /payment-success với đầy đủ query params
   *
   * Note: Không sử dụng navigate() vì cần giữ nguyên URL params từ VNPay
   */
  useEffect(() => {
    // Parse URL query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const vnpResponseCode = urlParams.get("vnp_ResponseCode");

    // Nếu có vnp_ResponseCode => đây là callback từ VNPay
    if (vnpResponseCode) {
      const queryString = window.location.search; // Lấy toàn bộ query string
      const newUrl = window.location.origin + "/payment-success" + queryString;

      // Redirect sang trang payment-success với đầy đủ params
      window.location.href = newUrl;
    }
  }, []); // Chỉ chạy 1 lần khi component mount

  // ===== EFFECT: FETCH STATIONS DATA =====
  /**
   * Effect lấy dữ liệu tất cả trạm sạc từ API
   *
   * Flow:
   * 1. Gọi API GET /stations khi component mount
   * 2. Xử lý và format dữ liệu (hỗ trợ nhiều format response)
   * 3. Lọc các trạm có tọa độ hợp lệ
   * 4. Set vào state mapStations
   * 5. Tự động refresh dữ liệu mỗi 5 phút
   *
   * Data format từ API có thể là:
   * - Array trực tiếp: [station1, station2, ...]
   * - Object có field items: { items: [...] }
   * - Single object: { id, name, ... }
   */
  useEffect(() => {
    // Flag để track component có còn mounted không (tránh memory leak)
    let isMounted = true;

    /**
     * Async function để fetch dữ liệu trạm sạc
     */
    const fetchStations = async () => {
      try {
        // Bật loading state
        setLoading(true);

        // Gọi API endpoint /stations
        const res = await api.get("/stations");

        // ===== XỬ LÝ RESPONSE DATA =====
        // Khởi tạo mảng rỗng để lưu dữ liệu
        let stationsData = [];

        // Case 1: Response là array trực tiếp
        if (Array.isArray(res.data)) {
          stationsData = res.data;
        }
        // Case 2: Response là object có field items là array
        else if (Array.isArray(res.data.items)) {
          stationsData = res.data.items;
        }
        // Case 3: Response là single object
        else if (res.data && typeof res.data === "object") {
          stationsData = [res.data];
        }

        // ===== LỌC DỮ LIỆU =====
        // Chỉ giữ lại các trạm có tọa độ hợp lệ (latitude và longitude)
        stationsData = stationsData.filter((s) => s.latitude && s.longitude);

        // ===== FORMAT DỮ LIỆU =====
        // Transform dữ liệu thô thành format chuẩn để sử dụng trong app
        const formatted = stationsData.map((s, index) => ({
          // ID: ưu tiên dùng id từ API, fallback về index+1
          id: s.id || index + 1,

          // Tên trạm: fallback về "Trạm sạc không tên" nếu không có
          name: s.name || "Trạm sạc không tên",

          // Tọa độ: format [latitude, longitude] cho Leaflet
          coords: [s.latitude, s.longitude],

          // Trạng thái: convert "active" thành "available", còn lại là "maintenance"
          status: s.status === "active" ? "available" : "maintenance",

          // Địa chỉ: fallback về "Không rõ địa chỉ"
          address: s.address || "Không rõ địa chỉ",

          // Tốc độ sạc: lấy từ port đầu tiên, fallback về "N/A"
          speed: s.ports?.[0]?.speed || "N/A",

          // Giá: format với dấu phân cách hàng nghìn và thêm đơn vị
          price: s.ports?.[0]?.price
            ? `${s.ports[0].price.toLocaleString()} đ/kWh`
            : "N/A",

          // ===== ĐẾM SỐ LƯỢNG CỔNG SẠC THEO LOẠI =====
          slots: {
            // AC: Sạc chậm (dành cho sạc qua đêm)
            ac: s.ports?.filter((p) => p.type === "AC").length || 0,
            // DC: Sạc nhanh (30-60 phút)
            dc: s.ports?.filter((p) => p.type === "DC").length || 0,
            // Ultra: Sạc siêu nhanh (15-30 phút)
            ultra: s.ports?.filter((p) => p.type === "Ultra").length || 0,
          },
        }));

        // Chỉ update state nếu component vẫn còn mounted
        if (isMounted) {
          setMapStations(formatted);
        }
      } catch (err) {
        // Xử lý lỗi: chỉ set error nếu component vẫn mounted
        if (isMounted) setError("Không thể tải dữ liệu trạm sạc.");
      } finally {
        // Tắt loading state
        if (isMounted) setLoading(false);
      }
    };

    // Gọi function fetch ngay lập tức
    fetchStations();

    // ===== AUTO REFRESH =====
    // Setup interval để tự động refresh dữ liệu mỗi 5 phút (300000ms)
    // Đảm bảo dữ liệu luôn cập nhật (trạng thái trạm, giá, ...)
    const interval = setInterval(fetchStations, 300000);

    // ===== CLEANUP =====
    // Cleanup function chạy khi component unmount
    return () => {
      isMounted = false; // Đánh dấu component đã unmount
      clearInterval(interval); // Clear interval để tránh memory leak
    };
  }, []); // Dependency array rỗng = chỉ chạy 1 lần khi mount

  // ===== FUNCTION: UPDATE USER LOCATION =====
  /**
   * Hàm lấy vị trí hiện tại của người dùng và tính toán trạm sạc gần nhất
   *
   * Flow:
   * 1. Sử dụng Geolocation API để lấy vị trí
   * 2. Tính khoảng cách từ vị trí người dùng đến tất cả các trạm
   * 3. Sắp xếp theo khoảng cách tăng dần
   * 4. Lấy 5 trạm gần nhất và lưu vào state
   *
   * Note: Yêu cầu người dùng cho phép truy cập vị trí
   */
  const updateLocation = () => {
    // Kiểm tra browser có hỗ trợ Geolocation API không
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        // ===== SUCCESS CALLBACK =====
        (pos) => {
          // Lấy tọa độ từ position object
          const { latitude, longitude } = pos.coords;
          const coords = [latitude, longitude];

          // Lưu vị trí người dùng vào state (để hiển thị marker trên map)
          setUserLocation(coords);

          // ===== TÍNH TOÁN TRẠM GẦN NHẤT =====
          if (mapStations.length > 0) {
            // Map qua tất cả các trạm, thêm field distance
            const withDistance = mapStations.map((s) => ({
              ...s, // Spread tất cả properties hiện tại
              // Tính khoảng cách từ vị trí người dùng đến trạm này
              distance: getDistanceKm(
                latitude, // Vĩ độ người dùng
                longitude, // Kinh độ người dùng
                s.coords[0], // Vĩ độ trạm sạc
                s.coords[1] // Kinh độ trạm sạc
              ),
            }));

            // Sắp xếp theo khoảng cách (gần nhất đến xa nhất) và lấy 5 trạm đầu
            setNearbyStations(
              withDistance
                .sort((a, b) => a.distance - b.distance) // Sort tăng dần theo distance
                .slice(0, 5) // Lấy 5 phần tử đầu
            );
          }
        },
        // ===== ERROR CALLBACK =====
        (err) => console.error("Không lấy được vị trí:", err),
        // ===== OPTIONS =====
        {
          enableHighAccuracy: true, // Yêu cầu độ chính xác cao (sử dụng GPS nếu có)
        }
      );
    }
  };

  // ===== EFFECT: AUTO GET LOCATION =====
  /**
   * Effect tự động lấy vị trí người dùng khi đã có dữ liệu trạm sạc
   *
   * Chỉ chạy khi:
   * - mapStations thay đổi (có dữ liệu mới từ API)
   * - mapStations.length > 0 (có ít nhất 1 trạm)
   */
  useEffect(() => {
    if (mapStations.length > 0) updateLocation();
  }, [mapStations]); // Dependency: chạy lại khi mapStations thay đổi

  // ===== EVENT HANDLERS =====

  /**
   * Handler khi click vào marker trên bản đồ
   *
   * @param {number} id - ID của trạm sạc được click
   *
   * Effect:
   * - Highlight card tương ứng trong danh sách
   * - Có thể scroll đến card đó (nếu có logic scroll)
   */
  const handleMarkerClick = (id) => setSelectedId(id);

  /**
   * Handler khi người dùng click nút "Đặt chỗ ngay"
   *
   * Flow:
   * 1. Kiểm tra token trong localStorage (đã đăng nhập chưa)
   * 2. Nếu chưa đăng nhập:
   *    - Redirect đến trang login
   *    - Kèm redirect URL để sau khi login sẽ quay lại trang booking của trạm này
   * 3. Nếu đã đăng nhập:
   *    - Chuyển thẳng đến trang booking của trạm đó
   *
   * @param {number} stationId - ID của trạm sạc cần đặt chỗ
   */
  const handleBooking = (stationId) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem("token");

    // Tạo URL đích (trang booking của trạm này)
    const redirectUrl = `/booking/${stationId}`;

    if (!token) {
      // CHƯA ĐĂNG NHẬP:
      // Chuyển đến trang login, kèm redirect URL đã encode
      // Sau khi login thành công, LoginPage sẽ redirect về URL này
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      // ĐÃ ĐĂNG NHẬP:
      // Chuyển thẳng đến trang booking
      navigate(redirectUrl);
    }
  };

  /**
   * Handler khi click nút "Tìm trạm sạc ngay" ở Hero section
   *
   * Flow tương tự handleBooking nhưng redirect đến trang booking tổng quát
   * (không chọn trước trạm cụ thể)
   */
  const handleFindStation = () => {
    const token = localStorage.getItem("token");
    const redirectUrl = "/booking";

    if (!token) {
      // Chưa đăng nhập: đến login với redirect
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      // Đã đăng nhập: đến booking
      navigate(redirectUrl);
    }
  };

  /**
   * Handler khi click nút "Thêm xe của bạn"
   *
   * Flow:
   * 1. Kiểm tra đăng nhập
   * 2. Redirect đến trang profile
   * 3. URL có query params:
   *    - section=add-vehicle: mở section thêm xe
   *    - action=add: mở form thêm mới (không phải edit)
   *
   * Note: Function này hiện chưa được sử dụng trong UI,
   * có thể thêm nút "Thêm xe" vào hero section sau
   */
  const handleAddVehicle = () => {
    const token = localStorage.getItem("token");
    const redirectUrl = "/profile?section=add-vehicle&action=add";

    if (!token) {
      navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    } else {
      navigate(redirectUrl);
    }
  };

  // ===== CONDITIONAL RENDERING =====

  /**
   * LOADING STATE
   * Hiển thị khi đang fetch dữ liệu từ API
   */
  if (loading) {
    return (
      <div className="homepage__loading">
        <p>Đang tải dữ liệu trạm sạc...</p>
      </div>
    );
  }

  /**
   * ERROR STATE
   * Hiển thị khi có lỗi xảy ra (API failed, network error, ...)
   */
  if (error) {
    return (
      <div className="homepage__error">
        <p>{error}</p>
      </div>
    );
  }

  // ===== MAIN RENDER =====
  return (
    <div className="homepage">
      <div className="homepage__main">
        {/* ===== HERO SECTION ===== */}
        {/* 
          Section giới thiệu chính với:
          - Heading và mô tả dịch vụ
          - CTA button "Tìm trạm sạc ngay"
          - Hero image với logo và animation
        */}
        <section className="homepage__hero">
          {/* Phần nội dung text */}
          <div className="homepage__hero-content">
            <h1>Tìm trạm sạc xe điện dễ dàng, sạc nhanh chóng</h1>
            <p>
              Ứng dụng tìm kiếm và sử dụng trụ sạc xe điện hàng đầu Việt Nam.
              Hơn 100+ trạm sạc trên toàn quốc, đặt chỗ trước, thanh toán tiện
              lợi.
            </p>
            {/* Call To Action buttons */}
            <div className="homepage__hero-actions">
              <button className="btn btn--primary" onClick={handleFindStation}>
                Tìm trạm sạc ngay
              </button>
            </div>
          </div>

          {/* Phần visual với logo và các icon animation */}
          <div className="homepage__hero-image">
            <div className="hero-visual">
              {/* Logo ở giữa */}
              <div className="center-logo">
                <img src="/assets/logo.jpg" alt="Logo" className="hero-logo" />
              </div>
              {/* Các icon trang trí (có thể có animation qua CSS) */}
              <div className="charging-station">🚗</div>
              <div className="dashboard">⚡</div>
              <div className="mobile-app">📱</div>
            </div>
          </div>
        </section>

        {/* ===== MAP + STATION LIST SECTION ===== */}
        {/* 
          Section chính hiển thị:
          - Bên trái: Danh sách 5 trạm sạc gần nhất
          - Bên phải: Bản đồ tương tác với markers
          
          Interaction:
          - Click card → highlight marker trên map
          - Click marker → highlight card tương ứng
          - Click "Đặt chỗ ngay" → chuyển đến booking page
        */}
        <section className="homepage__map" ref={mapSectionRef}>
          <div className="section-header">
            <h2>Trạm sạc gần bạn</h2>
          </div>

          <div className="map-container">
            {/* ===== STATION LIST (Left side) ===== */}
            <div className="station-list">
              <div className="station-scroll">
                {nearbyStations.length === 0 ? (
                  /* ===== EMPTY STATE ===== */
                  /* Hiển thị khi không có trạm nào hoặc chưa bật định vị */
                  <div className="empty-state">
                    <AlertCircle size={48} color="#94a3b8" />
                    <p>Không tìm thấy trạm sạc gần bạn</p>
                    <span>Vui lòng bật định vị để tìm trạm gần nhất</span>
                  </div>
                ) : (
                  /* ===== RENDER STATION CARDS ===== */
                  /* Map qua 5 trạm gần nhất và render card cho mỗi trạm */
                  nearbyStations.map((station) => (
                    <div
                      key={station.id}
                      // Lưu ref để có thể scroll đến card này khi cần
                      ref={(el) => (itemRefs.current[station.id] = el)}
                      // Dynamic className: thêm "selected" nếu đang được chọn
                      className={`station-card ${
                        selectedId === station.id ? "selected" : ""
                      }`}
                      // Click card → select trạm này (highlight card và marker)
                      onClick={() => setSelectedId(station.id)}
                    >
                      {/* ===== CARD TOP: Name, Status, Distance ===== */}
                      <div className="card-top">
                        <div className="station-name-status">
                          {/* Tên trạm */}
                          <h4>{station.name}</h4>

                          {/* Tag hiển thị trạng thái với icon và màu tương ứng */}
                          {station.status === "available" ? (
                            // Sẵn sàng: màu xanh lá, icon check
                            <Tag
                              color="success"
                              icon={<CheckCircle size={12} />}
                            >
                              Sẵn sàng
                            </Tag>
                          ) : station.status === "busy" ? (
                            // Đang bận: màu vàng, icon đồng hồ
                            <Tag color="warning" icon={<Clock size={12} />}>
                              Đang bận
                            </Tag>
                          ) : (
                            // Bảo trì: màu đỏ, icon cảnh báo
                            <Tag color="error" icon={<AlertCircle size={12} />}>
                              Bảo trì
                            </Tag>
                          )}
                        </div>

                        {/* Hiển thị khoảng cách nếu có */}
                        {station.distance && (
                          <div className="distance">
                            <Navigation size={14} />
                            {/* Format: 1 số thập phân + " km" */}
                            <span>{station.distance.toFixed(1)} km</span>
                          </div>
                        )}
                      </div>

                      {/* ===== CARD INFO: Speed, Price, Ports, Address ===== */}
                      <div className="card-info">
                        {/* Grid 2 cột: Tốc độ và Giá */}
                        <div className="info-grid">
                          {/* Cột 1: Tốc độ sạc */}
                          <div className="info-cell">
                            <Zap size={16} color="#16a34a" />
                            <div>
                              <span className="label">Tốc độ</span>
                              <span className="value">{station.speed}</span>
                            </div>
                          </div>

                          {/* Cột 2: Giá cả */}
                          <div className="info-cell">
                            <DollarSign size={16} color="#16a34a" />
                            <div>
                              <span className="label">Giá</span>
                              <span className="value price">
                                {station.price}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* ===== PORTS: Hiển thị các loại cổng sạc ===== */}
                        {/* 
                          Mỗi loại cổng hiển thị:
                          - Badge số lượng
                          - Tag với màu tương ứng
                          - Tooltip giải thích
                        */}
                        <div className="ports">
                          {/* AC - Sạc chậm (màu xanh dương) */}
                          {station.slots.ac > 0 && (
                            <Tooltip title="AC - Sạc chậm">
                              <Badge
                                count={station.slots.ac}
                                style={{ backgroundColor: "#3b82f6" }}
                              >
                                <Tag color="blue">AC</Tag>
                              </Badge>
                            </Tooltip>
                          )}

                          {/* DC - Sạc nhanh (màu xanh lá) */}
                          {station.slots.dc > 0 && (
                            <Tooltip title="DC - Sạc nhanh">
                              <Badge
                                count={station.slots.dc}
                                style={{ backgroundColor: "#16a34a" }}
                              >
                                <Tag color="green">DC</Tag>
                              </Badge>
                            </Tooltip>
                          )}

                          {/* Ultra - Sạc siêu nhanh (màu tím) */}
                          {station.slots.ultra > 0 && (
                            <Tooltip title="Ultra - Sạc siêu nhanh">
                              <Badge
                                count={station.slots.ultra}
                                style={{ backgroundColor: "#8b5cf6" }}
                              >
                                <Tag color="purple">Ultra</Tag>
                              </Badge>
                            </Tooltip>
                          )}
                        </div>

                        {/* ===== ADDRESS ===== */}
                        <div className="address">
                          <MapPin size={14} color="#f59e0b" />
                          <span>{station.address}</span>
                        </div>
                      </div>

                      {/* ===== BOOKING BUTTON ===== */}
                      {/* 
                        Click button:
                        - stopPropagation: tránh trigger onClick của card
                        - Gọi handleBooking với stationId
                      */}
                      <button
                        className="book-btn"
                        onClick={(e) => {
                          e.stopPropagation(); // Ngăn event bubble lên card
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

            {/* ===== MAP VIEW (Right side) ===== */}
            {/* 
              Component bản đồ hiển thị:
              - Tất cả trạm sạc (markers)
              - Vị trí người dùng (marker màu khác)
              - Popup khi click marker
              - Nút "Cập nhật vị trí"
            */}
            <div className="map-view">
              <ChargingMap
                stations={mapStations} // Tất cả trạm sạc
                center={userLocation} // Center map tại vị trí người dùng
                zoom={12} // Zoom level mặc định
                onSelect={(station) => handleMarkerClick(station.id)} // Callback khi click marker
                selectedStation={
                  selectedId
                    ? mapStations.find((s) => s.id === selectedId) // Trạm đang được chọn
                    : null
                }
                userLocation={userLocation} // Vị trí người dùng (hiển thị marker)
                onUpdateLocation={updateLocation} // Callback để refresh vị trí
              />
            </div>
          </div>
        </section>

        {/* ===== HOW TO USE SECTION ===== */}
        {/* 
          Section hướng dẫn sử dụng dịch vụ qua 4 bước đơn giản
          Layout: Grid 4 cột (responsive)
        */}
        <section className="homepage__howto" ref={stepsRef}>
          <div className="section-header">
            <h2>Cách sử dụng đơn giản</h2>
            <p>Chỉ với 4 bước đơn giản để sạc xe điện</p>
          </div>

          {/* Grid 4 bước */}
          <div className="steps-grid">
            {/* Bước 1: Tìm trạm */}
            <div className="step-item">
              <div className="step-number">1</div>
              <h3>Tìm trạm sạc</h3>
              <p>Sử dụng bản đồ để tìm trạm sạc gần nhất</p>
            </div>

            {/* Bước 2: Đặt chỗ */}
            <div className="step-item">
              <div className="step-number">2</div>
              <h3>Đặt chỗ</h3>
              <p>Đặt trước để đảm bảo có chỗ sạc khi đến</p>
            </div>

            {/* Bước 3: Thanh toán */}
            <div className="step-item">
              <div className="step-number">3</div>
              <h3>Thanh toán</h3>
              <p>Thanh toán bằng nhiều phương thức</p>
            </div>

            {/* Bước 4: Sạc xe */}
            <div className="step-item">
              <div className="step-number">4</div>
              <h3>Kết nối và sạc</h3>
              <p>Cắm sạc và theo dõi quá trình trên ứng dụng</p>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        {/* Call to Action cuối trang để khuyến khích người dùng bắt đầu */}
        <section className="homepage__cta">
          <h2>Bắt đầu hành trình xe điện của bạn</h2>
        </section>

        {/* ===== ABOUT SECTION ===== */}
        {/* Section giới thiệu về dịch vụ (hiện đang trống) */}
        <About />
      </div>
    </div>
  );
};

export default HomePage;
