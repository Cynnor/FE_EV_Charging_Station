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
          <h1>Lỗi</h1>
          <p>
            Không tìm thấy dữ liệu phiên sạc. Vui lòng quay lại trang trước.
          </p>
          <button className="back-btn" onClick={() => navigate(-1)}>
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
      <div className="payment-container">
        {/* LEFT */}
        <div className="left">
          <h1>Thanh toán</h1>

          <div className="summary-card">
            <h3>Thông tin phiên sạc</h3>
            <p>
              <b>Xe:</b> {chargingData.vehicleInfo?.plateNumber || "—"}
            </p>
            <p>
              <b>Hãng xe:</b> {chargingData.vehicleInfo?.make}{" "}
              {chargingData.vehicleInfo?.model}
            </p>
            <p>
              <b>Mức sạc hiện tại:</b>{" "}
              {chargingData.chargingInfo?.currentCharge || 0}%
            </p>
            <p>
              <b>Thời gian sạc:</b>{" "}
              {chargingData.chargingInfo?.timeElapsed || 0} phút
            </p>
            <p>
              <b>Năng lượng tiêu thụ:</b>{" "}
              {chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh
            </p>
            <p>
              <b>Bắt đầu lúc:</b>{" "}
              {chargingData.chargingInfo?.startTime
                ? new Date(chargingData.chargingInfo.startTime).toLocaleString(
                  "vi-VN"
                )
                : "—"}
            </p>
          </div>

          <div className="plan-card">
            <h3>Chi tiết thanh toán</h3>
            <div className="charging-details">
              <div className="detail-item">
                <span>Số kWh</span>
                <span>{chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-item">
                <span>Đơn giá</span>
                <span>{pricePerKwh.toLocaleString("vi-VN")} VNĐ/kWh</span>
              </div>
              <div className="detail-item">
                <span>Thời gian sạc</span>
                <span>{chargingData.chargingInfo?.timeElapsed || 0} phút</span>
              </div>
            </div>

            <div className="amount-info">
              <div className="amount-item">
                <span>Chi phí ước tính</span>
                <span>{totalAmount.toLocaleString("vi-VN")} VNĐ</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="right">
          <div className="total-card">
            <h3>Tổng thanh toán</h3>
            <div className="row">
              <span>Phí đặt lịch</span>
              <span className="value">
                {chargingData.chargingInfo?.bookingCost?.toLocaleString(
                  "vi-VN"
                ) || 0}{" "}
                VNĐ
              </span>
            </div>
            <div className="row">
              <span>
                Phí điện (
                {chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh)
              </span>
              <span className="value">
                {chargingData.chargingInfo?.energyCost?.toLocaleString(
                  "vi-VN"
                ) || 0}{" "}
                VNĐ
              </span>
            </div>
            <div className="row total-row">
              <span>Tổng cộng</span>
              <span className="value">
                {totalAmount.toLocaleString("vi-VN")} VNĐ
              </span>
            </div>
            <button
              className="pay-btn"
              disabled={isPaying}
              onClick={handleSandboxPay}
            >
              {isPaying ? "Đang xử lý..." : "Thanh toán ngay"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
