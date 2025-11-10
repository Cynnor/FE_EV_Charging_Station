import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MapDirections from "../../components/mapDirections";
import "./index.scss";

const BookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { reservation, station, charger, bookingTime } = location.state || {};
  
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!reservation) {
      navigate("/", { replace: true });
    }
  }, [reservation, navigate]);

  if (!reservation) return null;

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${dayName}, ${day}/${month}/${year} - ${timeStr}`;
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleStartCharging = () => {
    // Lấy vị trí hiện tại của người dùng
    setIsLoadingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
          setShowMap(true);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
          // Nếu không lấy được vị trí, vẫn hiển thị map nhưng không có user location
          alert("Không thể lấy vị trí của bạn. Vui lòng bật định vị GPS và thử lại.");
        }
      );
    } else {
      setIsLoadingLocation(false);
      alert("Trình duyệt của bạn không hỗ trợ định vị GPS.");
    }
  };

  const handleCloseMap = () => {
    setShowMap(false);
    // Navigate đến profile sau khi đóng map
    sessionStorage.setItem("scrollToHistory", "true");
    navigate("/profile", { replace: true });
  };

  // Lấy tọa độ của trạm sạc
  const stationLocation = station?.coords && Array.isArray(station.coords) && station.coords.length === 2
    ? [parseFloat(station.coords[0]), parseFloat(station.coords[1])]
    : null;

  return (
    <div className="booking-success-page">
      {showMap && (
        <MapDirections
          userLocation={userLocation}
          stationLocation={stationLocation}
          stationInfo={{
            name: station?.name,
            address: station?.address,
          }}
          onClose={handleCloseMap}
        />
      )}
      <div className="success-container">
        <div className="success-header">
          <div className="success-icon-wrapper">
            <div className="success-icon">✓</div>
            <div className="success-circle"></div>
          </div>

          <h1 className="success-title">Đặt chỗ thành công!</h1>
          <p className="success-subtitle">
            Mã đặt chỗ: <strong>{String(reservation.id).slice(-8)}</strong>
          </p>
        </div>

        <div
          className="booking-content booking-content--vertical"
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          {/* Cột trái: Thông tin trạm sạc */}
          <div className="booking-details" style={{ width: "100%" }}>
            <div className="detail-section">
              <h3>Thông tin trạm sạc</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Trạm:</span>
                  <span className="value">{station?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Trụ:</span>
                  <span className="value">{charger?.name}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Công suất:</span>
                  <span className="value">{charger?.power}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Thời gian sạc */}
          <div className="booking-details" style={{ width: "100%" }}>
            <div className="detail-section">
              <h3>Thời gian sạc</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Bắt đầu:</span>
                  <span className="value">
                    {bookingTime?.date && bookingTime?.startTime
                      ? formatDateTime(bookingTime.date, bookingTime.startTime)
                      : "—"}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Kết thúc:</span>
                  <span className="value">
                    {bookingTime?.date && bookingTime?.endTime
                      ? formatDateTime(bookingTime.date, bookingTime.endTime)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="action-buttons">
          <button className="btn-home" onClick={handleGoHome}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M3 10l7-7 7 7M5 10v8h10v-8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            Về trang chủ
          </button>
          <button 
            className="btn-start-charging" 
            onClick={handleStartCharging}
            disabled={isLoadingLocation}
          >
            {isLoadingLocation ? (
              <>
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 20 20" 
                  fill="none"
                  className="loading-spinner"
                >
                  <circle 
                    cx="10" 
                    cy="10" 
                    r="8" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeDasharray="40"
                    strokeDashoffset="10"
                  />
                </svg>
                Đang lấy vị trí...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M11 3L6 10h8l-5 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Tiến hành sạc
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
