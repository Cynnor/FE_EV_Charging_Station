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
      if (reservationId) {
        // Thanh toán cho chargingSession với reservationId
        const response = await api.post("/vnpay/checkout-url", {
          amount: Math.round(totalAmount),
          orderInfo: `Thanh toán phiên sạc - ${chargingData.vehicleInfo?.plateNumber || "N/A"
            }`,
          reservationId: reservationId,
          locale: "vn",
        });

        if (response.data?.success && response.data?.data?.paymentUrl) {
          // Redirect đến VNPay
          window.location.href = response.data.data.paymentUrl;
          return;
        }
      }

      // Fallback: giả lập thanh toán thành công và chuyển đến success page
      setTimeout(() => {
        setIsPaying(false);
        navigate("/payment-success", {
          state: {
            reservationId,
            amount: totalAmount,
            orderInfo: `Thanh toán phiên sạc - ${chargingData.vehicleInfo?.plateNumber || "N/A"
              }`,
            vehicleInfo: chargingData.vehicleInfo,
            chargingInfo: chargingData.chargingInfo,
          },
        });
      }, 1200);
    } catch (error) {
      console.error("Payment error:", error);
      setIsPaying(false);
      alert("Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại!");
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
