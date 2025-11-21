import { useEffect, useState } from "react"; // Import React hooks để quản lý state và side effects
import { useLocation, useNavigate } from "react-router-dom"; // Import hooks để lấy state từ navigation và điều hướng
import {
  MapPin,
  Navigation,
  Clock,
  Zap,
  Car,
  Calendar,
  CheckCircle,
} from "lucide-react"; // Import các icon từ lucide-react
import MapDirections from "../../components/mapDirections"; // Import component hiển thị bản đồ chỉ đường
import "./index.scss"; // Import file SCSS cho styling

const BookingSuccessPage = () => {
  // Component trang thành công sau khi đặt chỗ
  const location = useLocation(); // Hook lấy location object chứa state từ navigation
  const navigate = useNavigate(); // Hook để điều hướng sang trang khác

  const { reservation, station, charger, vehicle, bookingTime } =
    location.state || {}; // Destructure dữ liệu từ state được truyền qua navigation

  const [showMap, setShowMap] = useState(true); // State điều khiển hiển thị bản đồ
  const [userLocation, setUserLocation] = useState(null); // State lưu vị trí GPS của người dùng
  const [isLoadingLocation, setIsLoadingLocation] = useState(true); // State hiển thị trạng thái đang tải vị trí

  useEffect(() => {
    // Hook chạy khi component mount
    window.scrollTo(0, 0); // Cuộn về đầu trang
    if (!reservation) {
      // Kiểm tra nếu không có dữ liệu reservation
      navigate("/", { replace: true }); // Chuyển về trang chủ nếu không có reservation
      return;
    }

    // Automatically get user location on mount
    if (navigator.geolocation) {
      // Kiểm tra trình duyệt có hỗ trợ GPS không
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // Callback khi lấy vị trí thành công
          setUserLocation([
            // Lưu tọa độ người dùng vào state
            position.coords.latitude, // Vĩ độ
            position.coords.longitude, // Kinh độ
          ]);
          setIsLoadingLocation(false); // Tắt trạng thái loading
        },
        (error) => {
          // Callback khi lấy vị trí thất bại
          console.error("Error getting location:", error); // Log lỗi
          setIsLoadingLocation(false); // Tắt trạng thái loading dù thất bại
        }
      );
    } else {
      setIsLoadingLocation(false); // Tắt loading nếu trình duyệt không hỗ trợ GPS
    }
  }, [reservation, navigate]); // Dependencies: chạy lại khi reservation hoặc navigate thay đổi

  if (!reservation) return null; // Không render gì nếu không có reservation

  const formatDateTime = (dateStr, timeStr) => {
    // Hàm format ngày giờ thành chuỗi dễ đọc
    const date = new Date(dateStr); // Tạo Date object từ chuỗi ngày
    const days = [
      // Mảng tên các ngày trong tuần tiếng Việt
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const dayName = days[date.getDay()]; // Lấy tên ngày trong tuần
    const day = date.getDate().toString().padStart(2, "0"); // Lấy ngày và pad thành 2 chữ số
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Lấy tháng (cộng 1 vì getMonth() trả về 0-11)
    const year = date.getFullYear(); // Lấy năm
    return `${dayName}, ${day}/${month}/${year} - ${timeStr}`; // Trả về chuỗi đã format
  };

  const handleGoHome = () => {
    // Handler khi click nút về trang chủ
    navigate("/", { replace: true }); // Điều hướng về trang chủ và thay thế history
  };

  const handleGoToChargingSession = () => {
    // Handler khi click nút "Bạn đã tới nơi?"
    // Extract port information from reservation
    const firstItem = reservation?.items?.[0]; // Lấy item đầu tiên từ reservation

    // Try to get port ID from different sources:
    // 1. If slot is an object with port property
    const portFromSlot =
      typeof firstItem?.slot === "object" // Kiểm tra slot có phải object không
        ? firstItem.slot.port?._id ||
          firstItem.slot.port?.id ||
          firstItem.slot.port // Lấy port ID từ slot
        : null;

    // 2. Use charger ID as fallback (charger is essentially the port/trụ sạc)
    const portId = portFromSlot || charger?.id || charger?._id; // Lấy portId ưu tiên từ slot, fallback sang charger

    // Debug: Log the data we're working with
    console.log("📍 ===== NAVIGATE TO CHARGING SESSION PAGE ====="); // Log tiêu đề debug
    console.log("This is ONLY navigation, NOT starting the charging yet!"); // Log cảnh báo: chỉ là navigation
    console.log(
      "User needs to click 'Bắt đầu sạc' button on charging session page to actually start."
    ); // Log hướng dẫn
    console.log("Reservation:", reservation); // Log reservation data
    console.log("First Item:", firstItem); // Log item đầu tiên
    console.log("Slot:", firstItem?.slot); // Log slot
    console.log("Charger:", charger); // Log charger
    console.log("Extracted Port ID:", portId); // Log portId đã extract

    const navigationState = {
      // Tạo state object để truyền qua navigation
      reservation: {
        ...reservation, // Spread toàn bộ reservation data
        id: reservation?.id || reservation?._id, // Chuẩn hóa ID
        portId: portId, // Thêm portId
        powerKw: charger?.power || 150, // Công suất (mặc định 150 nếu không có)
        status: reservation?.status || "pending", // Trạng thái (mặc định pending)
        startAt: firstItem?.startAt, // Thời gian bắt đầu
        endAt: firstItem?.endAt, // Thời gian kết thúc
        items: reservation?.items || [], // Danh sách items
      },
      vehicle: {
        // Thông tin xe
        id: vehicle?.id || vehicle?._id, // ID xe
        plateNumber: vehicle?.plateNumber, // Biển số
        make: vehicle?.make, // Hãng xe
        model: vehicle?.model, // Model xe
        batteryCapacityKwh: vehicle?.batteryCapacityKwh, // Dung lượng pin
        connectorType: vehicle?.connectorType, // Loại đầu cắm
      },
    };

    console.log("Navigation State:", navigationState); // Log state sẽ được truyền đi

    // Persist identifiers for downstream payment flow (PaymentPage/PaymentSuccessPage expect these)
    const normalizedReservationId = reservation?.id || reservation?._id; // Chuẩn hóa reservation ID
    const normalizedVehicleId = // Chuẩn hóa vehicle ID từ nhiều nguồn
      vehicle?.id ||
      vehicle?._id ||
      reservation?.vehicle?.id ||
      reservation?.vehicle?._id;

    if (normalizedReservationId) {
      // Nếu có reservation ID
      localStorage.setItem("reservationId", normalizedReservationId); // Lưu vào localStorage để dùng sau
    } else {
      console.warn(
        // Log cảnh báo nếu không có reservation ID
        "⚠️ Unable to persist reservationId before navigating to charging session",
        reservation
      );
    }

    if (normalizedVehicleId) {
      // Nếu có vehicle ID
      localStorage.setItem("vehicleId", normalizedVehicleId); // Lưu vào localStorage
    } else {
      console.warn(
        // Log cảnh báo nếu không có vehicle ID
        "⚠️ Unable to persist vehicleId before navigating to charging session",
        vehicle || reservation?.vehicle
      );
    }

    navigate("/chargingSession", {
      // Điều hướng sang trang charging session
      replace: true, // Thay thế history
      state: navigationState, // Truyền state
    });
  };

  const handleCloseMap = () => {
    // Handler khi đóng bản đồ
    setShowMap(false); // Ẩn bản đồ
    sessionStorage.setItem("scrollToHistory", "true"); // Lưu flag để scroll đến history trong profile
    navigate("/profile", { replace: true }); // Điều hướng sang trang profile
  };

  // Calculate distance and estimated time
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    // Hàm tính khoảng cách giữa 2 điểm GPS (công thức Haversine)
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = ((lat2 - lat1) * Math.PI) / 180; // Chênh lệch vĩ độ (radian)
    const dLon = ((lon2 - lon1) * Math.PI) / 180; // Chênh lệch kinh độ (radian)
    const a = // Công thức Haversine
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); // Góc trung tâm
    return R * c; // Trả về khoảng cách (km)
  };

  const distance =
    userLocation && station?.coords // Tính khoảng cách nếu có vị trí user và trạm
      ? getDistanceKm(
          userLocation[0],
          userLocation[1],
          station.coords[0],
          station.coords[1]
        )
      : null;

  const estimatedTime = distance ? Math.ceil(distance * 2) : null; // Ước tính thời gian di chuyển (khoảng cách * 2 phút/km)

  // Lấy tọa độ của trạm sạc
  const stationLocation = // Chuẩn hóa tọa độ trạm thành mảng [lat, lng]
    station?.coords &&
    Array.isArray(station.coords) &&
    station.coords.length === 2
      ? [parseFloat(station.coords[0]), parseFloat(station.coords[1])] // Parse thành số thực
      : null;

  return (
    <div className="booking-success-page">
      {" "}
      {/* Container ngoài cùng */}
      <div className="success-layout">
        {" "}
        {/* Layout chính chia 2 panel */}
        {/* Left Panel - Booking Details */}
        <div className="success-details-panel">
          {" "}
          {/* Panel bên trái chứa thông tin booking */}
          <div className="success-header">
            {" "}
            {/* Header với icon success */}
            <div className="success-icon-wrapper">
              {" "}
              {/* Wrapper icon */}
              <CheckCircle size={48} strokeWidth={2.5} />{" "}
              {/* Icon check circle */}
            </div>
            <h1 className="success-title">Đặt chỗ thành công!</h1>{" "}
            {/* Tiêu đề */}
            {reservation?.status !== "confirmed" && ( // Nếu chưa thanh toán
              <p className="success-subtitle">
                {" "}
                {/* Subtitle thông báo giữ chỗ */}
                Slot sạc của bạn sẽ được giữ chỗ trong vòng 15 phút
              </p>
            )}
            {reservation?.status === "confirmed" && ( // Nếu đã thanh toán
              <p className="success-subtitle" style={{ color: "#28a745" }}>
                {" "}
                {/* Subtitle xanh */}✅ Đã thanh toán - Sẵn sàng để sạc
              </p>
            )}
          </div>
          <div className="booking-details-content">
            {" "}
            {/* Container các card thông tin */}
            {/* Giờ đặt lịch */}
            <div className="detail-card">
              {" "}
              {/* Card thông tin giờ đặt */}
              <div className="card-header">
                {" "}
                {/* Header card */}
                <Calendar size={20} /> {/* Icon lịch */}
                <h3>Giờ đặt lịch</h3> {/* Tiêu đề */}
              </div>
              <div className="card-body">
                {" "}
                {/* Body card */}
                <div className="info-row highlight">
                  {" "}
                  {/* Row thông tin highlight */}
                  <Clock size={16} /> {/* Icon đồng hồ */}
                  <span className="info-value">
                    {" "}
                    {/* Giá trị giờ đặt đã format */}
                    {bookingTime?.date && bookingTime?.startTime
                      ? formatDateTime(bookingTime.date, bookingTime.startTime)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
            {/* Thông tin trạm & trụ */}
            <div className="detail-card">
              {" "}
              {/* Card thông tin trạm và trụ */}
              <div className="card-header">
                {" "}
                {/* Header card */}
                <Zap size={20} /> {/* Icon sét */}
                <h3>Thông tin trạm & trụ</h3> {/* Tiêu đề */}
              </div>
              <div className="card-body">
                {" "}
                {/* Body card */}
                <div className="info-row">
                  {" "}
                  {/* Row tên trạm */}
                  <span className="info-label">Trạm sạc</span> {/* Label */}
                  <span className="info-value">
                    {station?.name || "—"}
                  </span>{" "}
                  {/* Giá trị */}
                </div>
                <div className="info-row">
                  {" "}
                  {/* Row tên trụ */}
                  <span className="info-label">Trụ sạc</span>
                  <span className="info-value">{charger?.name || "—"}</span>
                </div>
                <div className="info-row">
                  {" "}
                  {/* Row công suất */}
                  <span className="info-label">Công suất</span>
                  <span className="info-value">{charger?.power || "—"}</span>
                </div>
                <div className="info-row address-row">
                  {" "}
                  {/* Row địa chỉ */}
                  <MapPin size={16} /> {/* Icon vị trí */}
                  <span className="info-value">
                    {station?.address || "—"}
                  </span>{" "}
                  {/* Địa chỉ */}
                </div>
                {distance && ( // Chỉ hiển thị nếu đã tính được khoảng cách
                  <>
                    <div className="info-row">
                      {" "}
                      {/* Row khoảng cách */}
                      <Navigation size={16} /> {/* Icon điều hướng */}
                      <span className="info-label">Khoảng cách</span>
                      <span className="info-value">
                        {distance.toFixed(1)} km
                      </span>{" "}
                      {/* Khoảng cách làm tròn 1 chữ số */}
                    </div>
                    <div className="info-row">
                      {" "}
                      {/* Row thời gian di chuyển */}
                      <Clock size={16} /> {/* Icon đồng hồ */}
                      <span className="info-label">Thời gian di chuyển</span>
                      <span className="info-value">
                        ~{estimatedTime} phút
                      </span>{" "}
                      {/* Thời gian ước tính */}
                    </div>
                  </>
                )}
              </div>
            </div>
            {/* Phương tiện */}
            <div className="detail-card">
              {" "}
              {/* Card thông tin xe */}
              <div className="card-header">
                {" "}
                {/* Header card */}
                <Car size={20} /> {/* Icon xe */}
                <h3>Phương tiện của tôi</h3> {/* Tiêu đề */}
              </div>
              <div className="card-body">
                {" "}
                {/* Body card */}
                <div className="vehicle-info">
                  {" "}
                  {/* Wrapper thông tin xe */}
                  <div className="vehicle-icon">🏍️</div> {/* Emoji xe */}
                  <div className="vehicle-details">
                    {" "}
                    {/* Chi tiết xe */}
                    <div className="vehicle-plate">
                      {vehicle?.plateNumber || "—"}
                    </div>{" "}
                    {/* Biển số */}
                    <div className="vehicle-model">
                      {" "}
                      {/* Hãng và model */}
                      {vehicle?.make || "—"} {vehicle?.model || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="action-buttons">
            {" "}
            {/* Container các nút action */}
            <button
              type="button"
              className="btn-secondary"
              onClick={handleGoHome}
            >
              {" "}
              {/* Nút về trang chủ */}
              Về trang chủ
            </button>
            <button
              type="button"
              className="btn-primary-custom"
              onClick={handleGoToChargingSession}
            >
              {" "}
              {/* Nút đến trang charging session */}
              Bạn đã tới nơi?
            </button>
          </div>
        </div>
        {/* Right Panel - Map */}
        <div className="success-map-panel">
          {" "}
          {/* Panel bên phải hiển thị bản đồ */}
          {showMap && userLocation && stationLocation ? ( // Kiểm tra có đủ dữ liệu để hiển thị map không
            <MapDirections // Component hiển thị bản đồ chỉ đường
              userLocation={userLocation} // Vị trí người dùng
              stationLocation={stationLocation} // Vị trí trạm
              stationInfo={{
                // Thông tin trạm
                name: station?.name,
                address: station?.address,
              }}
              onClose={handleCloseMap} // Handler khi đóng map
            />
          ) : (
            <div className="map-loading">
              {" "}
              {/* Container loading/error state */}
              {isLoadingLocation ? ( // Nếu đang loading
                <div className="loading-content">
                  {" "}
                  {/* Nội dung loading */}
                  <div className="spinner"></div> {/* Spinner animation */}
                  <p>Đang tải bản đồ...</p> {/* Text loading */}
                </div>
              ) : (
                <div className="loading-content">
                  {" "}
                  {/* Nội dung khi không thể hiển thị map */}
                  <MapPin size={48} /> {/* Icon map pin */}
                  <p>Không thể hiển thị bản đồ</p> {/* Text lỗi */}
                  <small>Vui lòng bật định vị GPS</small> {/* Hướng dẫn */}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage; // Export component
