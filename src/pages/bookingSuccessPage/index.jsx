import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../config/api";
import "./index.scss";

const BookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { reservation, station, charger, vehicle, bookingTime } =
    location.state || {};
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);

    // Nếu không có dữ liệu, redirect về trang chủ
    if (!reservation) {
      navigate("/", { replace: true });
    }

    // Fetch user info
    const fetchUserData = async () => {
      try {
        const response = await api.get("/users/profile");
        if (response.data.data) {
          setUserInfo({
            fullname: response.data.data.fullName || "Chưa cập nhật",
            email: response.data.data.email || "Chưa cập nhật",
            phone: response.data.data.phone || "Chưa cập nhật",
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
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
    // Lưu flag để scroll đến phần lịch sử
    sessionStorage.setItem("scrollToHistory", "true");
    navigate("/profile", { replace: true });
  };

  return (
    <div className="booking-success-page">
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

        <div className="booking-content">
          {/* Cột trái */}
          <div className="booking-details">
            {/* Ô 1: Thông tin xe - Trái trên */}
            <div className="detail-section">
              <h3>Thông tin xe</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Biển số:</span>
                  <span className="value">{vehicle?.plateNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Xe:</span>
                  <span className="value">
                    {vehicle?.make} {vehicle?.model}
                  </span>
                </div>
              </div>
            </div>

            {/* Ô 2: Thông tin trạm sạc - Trái dưới */}
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

          {/* Cột phải */}
          <div className="booking-details">
            {/* Ô 3: Thời gian sạc - Phải trên */}
            <div className="detail-section">
              <h3>Thời gian sạc</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Bắt đầu:</span>
                  <span className="value">
                    {formatDateTime(bookingTime?.date, bookingTime?.startTime)}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Kết thúc:</span>
                  <span className="value">
                    {formatDateTime(bookingTime?.date, bookingTime?.endTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ô 4: Thông tin người dùng - Phải dưới */}
            <div className="detail-section">
              <h3>Thông tin người dùng</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <span className="label">Tên:</span>
                  <span className="value">
                    {userInfo?.fullname || "Đang tải..."}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Email:</span>
                  <span className="value">
                    {userInfo?.email || "Đang tải..."}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">SĐT:</span>
                  <span className="value">
                    {userInfo?.phone || "Đang tải..."}
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
          <button className="btn-start-charging" onClick={handleStartCharging}>
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
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
