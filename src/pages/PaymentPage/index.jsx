import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  // Dữ liệu từ chargingSession page
  const chargingData = state?.chargingData || null;
  const reservationId = localStorage.getItem("reservationId");

  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Kiểm tra dữ liệu chargingSession
  if (!chargingData) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2" fill="#ffe6e6"/>
              <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1>Không tìm thấy dữ liệu</h1>
          <p>
            Không tìm thấy dữ liệu phiên sạc. Vui lòng quay lại trang trước.
          </p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Lấy giá từ chargingSession
  const pricePerKwh = chargingData.chargingInfo?.energyPricePerKwh || 3858;
  const totalAmount = chargingData.chargingInfo?.totalCost || 0;

  const handleSandboxPay = async () => {
    setIsPaying(true);

    try {
      // Lấy vehicleId từ chargingData
      const vehicleId = chargingData.vehicleInfo?.id || chargingData.vehicleInfo?.vehicleId;
      
      if (!vehicleId) {
        throw new Error("Không tìm thấy thông tin xe");
      }

      console.log('💳 Creating VNPay payment URL for vehicle:', vehicleId);
      console.log('💳 Total Amount:', totalAmount);
      console.log('💳 Reservation ID:', reservationId);

      // Gọi API mới: POST /vnpay/checkout-url với vehicleId
      const response = await api.post("/vnpay/checkout-url", {
        vehicleId: vehicleId,
        locale: "vn",
        orderType: "other"
      });

      console.log('💳 VNPay Response:', response.data);

      if (response.data?.success && response.data?.data?.paymentUrl) {
        const pricingDetails = response.data.data.pricingDetails;
        
        console.log('💳 Pricing Details:', pricingDetails);
        console.log('  - Total Sessions:', pricingDetails?.totalSessions);
        console.log('  - Total Minutes:', pricingDetails?.totalMinutes);
        console.log('  - Total Cost:', pricingDetails?.total);
        
        // Lưu vehicleId và reservationId vào localStorage để sử dụng ở payment success page
        localStorage.setItem('paymentVehicleId', vehicleId);
        if (reservationId) {
          localStorage.setItem('paymentReservationId', reservationId);
        }
        
        // Redirect đến VNPay
        window.location.href = response.data.data.paymentUrl;
        return;
      } else {
        throw new Error("Không thể tạo URL thanh toán");
      }
    } catch (error) {
      console.error("Payment error:", error);
      console.error("Error details:", error.response?.data);
      setIsPaying(false);
      
      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xử lý thanh toán";
      alert(errorMessage + "\n\nVui lòng thử lại!");
    }
  };

  return (
    <div className="payment-page">
      <div className="payment-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Quay lại
          </button>
          <h1 className="page-title">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Thanh toán phiên sạc
          </h1>
          <p className="page-subtitle">Hoàn tất thanh toán để kết thúc phiên sạc của bạn</p>
        </div>
      </div>

      <div className="payment-container">
        {/* LEFT - Charging Session Details */}
        <div className="left-section">
          <div className="info-card vehicle-card">
            <div className="card-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 17l-2 4m10-4l2 4m-10 0h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3>Thông tin xe</h3>
            </div>
            <div className="card-body">
              <div className="vehicle-display">
                <div className="vehicle-icon-large">🚗</div>
                <div className="vehicle-details">
                  <div className="plate-number">{chargingData.vehicleInfo?.plateNumber || "—"}</div>
                  <div className="vehicle-model">{chargingData.vehicleInfo?.make} {chargingData.vehicleInfo?.model}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="info-card session-card">
            <div className="card-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Thông tin phiên sạc</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Bắt đầu lúc</span>
                    <span className="info-value">
                      {chargingData.chargingInfo?.startTime
                        ? new Date(chargingData.chargingInfo.startTime).toLocaleString("vi-VN")
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Thời gian sạc</span>
                    <span className="info-value">{chargingData.chargingInfo?.timeElapsed || 0} phút</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2"/>
                      <path d="M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Mức sạc hiện tại</span>
                    <span className="info-value highlight">{chargingData.chargingInfo?.currentCharge || 0}%</span>
                  </div>
                </div>

                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Năng lượng tiêu thụ</span>
                    <span className="info-value">{chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Payment Summary */}
        <div className="right-section">
          <div className="payment-summary-card">
            <div className="summary-header">
              <h3>Tổng quan thanh toán</h3>
              <span className="secure-badge">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                An toàn & Bảo mật
              </span>
            </div>

            <div className="breakdown-section">
              <div className="breakdown-item">
                <div className="item-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Phí đặt lịch</span>
                </div>
                <span className="item-value">
                  {chargingData.chargingInfo?.bookingCost?.toLocaleString("vi-VN") || 0} VNĐ
                </span>
              </div>

              <div className="breakdown-item">
                <div className="item-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Phí điện</span>
                  <span className="sub-label">({chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh × {pricePerKwh.toLocaleString("vi-VN")} VNĐ)</span>
                </div>
                <span className="item-value">
                  {chargingData.chargingInfo?.energyCost?.toLocaleString("vi-VN") || 0} VNĐ
                </span>
              </div>

              <div className="divider"></div>

              <div className="total-amount-section">
                <div className="total-label">Tổng thanh toán</div>
                <div className="total-value">{totalAmount.toLocaleString("vi-VN")} <span className="currency">VNĐ</span></div>
              </div>
            </div>

            <div className="payment-method-section">
              <div className="method-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <span>Phương thức thanh toán</span>
              </div>
              <div className="vnpay-badge">
                <div className="vnpay-logo">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwNTFBNSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5WTjwvdGV4dD4KPC9zdmc+" alt="VNPay"/>
                </div>
                <div className="vnpay-info">
                  <div className="vnpay-name">VNPay</div>
                  <div className="vnpay-desc">Thanh toán qua cổng VNPay</div>
                </div>
              </div>
            </div>

            <button
              className="pay-button"
              disabled={isPaying}
              onClick={handleSandboxPay}
            >
              {isPaying ? (
                <>
                  <div className="spinner"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span>Thanh toán {totalAmount.toLocaleString("vi-VN")} VNĐ</span>
                </>
              )}
            </button>

            <div className="payment-note">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <p>Bạn sẽ được chuyển đến trang thanh toán VNPay để hoàn tất giao dịch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
