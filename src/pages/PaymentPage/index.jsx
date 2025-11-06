import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

export default function PaymentPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const navigate = useNavigate();
  const { state } = useLocation();

  // D? li?u t? chargingSession page
  const chargingData = state?.chargingData || null;
  const reservationId = localStorage.getItem("reservationId");

  const [paymentMethod, setPaymentMethod] = useState("e_wallet"); // e_wallet | banking | card | cod
  const [isPaying, setIsPaying] = useState(false);
  const [invoice, setInvoice] = useState(null);

  // Ki?m tra d? li?u chargingSession
  if (!chargingData) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <h1>L?i</h1>
          <p>
            Không tìm th?y d? li?u phiên s?c. Vui lòng quay l?i trang tru?c.
          </p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            Quay l?i
          </button>
        </div>
      </div>
    );
  }

  // L?y giá t? chargingSession
  const pricePerKwh = chargingData.chargingInfo?.energyPricePerKwh || 3858;
  const totalAmount = chargingData.chargingInfo?.totalCost || 0;

  const handleSandboxPay = async () => {
    setIsPaying(true);

    try {
      if (reservationId) {
        // Thanh toán cho chargingSession v?i reservationId
        const response = await api.post("/vnpay/checkout-url", {
          amount: Math.round(totalAmount),
          orderInfo: `Thanh toan phi s?c - ${
            chargingData.vehicleInfo?.plateNumber || "N/A"
          }`,
          reservationId: reservationId,
          locale: "vn",
        });

        if (response.data?.success && response.data?.data?.paymentUrl) {
          // Redirect d?n VNPay
          window.location.href = response.data.data.paymentUrl;
          return;
        }
      }

      // Fallback: gi? l?p thanh toán thành công và chuy?n d?n success page
      setTimeout(() => {
        setIsPaying(false);
        navigate("/payment-success", {
          state: {
            reservationId: reservationId,
            amount: totalAmount,
            orderInfo: `Thanh toan phi s?c - ${
              chargingData.vehicleInfo?.plateNumber || "N/A"
            }`,
            vehicleInfo: chargingData.vehicleInfo,
            chargingInfo: chargingData.chargingInfo,
            paymentMethod: paymentMethod,
          },
        });
      }, 1200);
    } catch (error) {
      console.error("Payment error:", error);
      setIsPaying(false);
      alert("Có l?i x?y ra khi x? lý thanh toán. Vui lòng th? l?i!");
    }
  };

  const [showInvoice, setShowInvoice] = useState(false);

  return (
    <div className="payment-page">
      <div className="payment-container">
        <div className="left">
          <h1>Thanh toán</h1>

          <div className="summary-card">
            <h3>Thông tin phiên s?c</h3>
            <p>
              <b>Xe:</b> {chargingData.vehicleInfo?.plateNumber || "—"}
            </p>
            <p>
              <b>Hãng xe:</b> {chargingData.vehicleInfo?.make}{" "}
              {chargingData.vehicleInfo?.model}
            </p>
            <p>
              <b>M?c s?c hi?n t?i:</b>{" "}
              {chargingData.chargingInfo?.currentCharge || 0}%
            </p>
            <p>
              <b>Th?i gian s?c:</b>{" "}
              {chargingData.chargingInfo?.timeElapsed || 0} phút
            </p>
            <p>
              <b>Nang lu?ng tiêu th?:</b>{" "}
              {chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh
            </p>
            <p>
              <b>B?t d?u lúc:</b>{" "}
              {chargingData.chargingInfo?.startTime
                ? new Date(chargingData.chargingInfo.startTime).toLocaleString(
                    "vi-VN"
                  )
                : "—"}
            </p>
          </div>

          <div className="plan-card">
            <h3>Chi ti?t thanh toán</h3>
            <div className="charging-details">
              <div className="detail-item">
                <span>S? kWh</span>
                <span>{chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0}</span>
              </div>
              <div className="detail-item">
                <span>Ðon giá</span>
                <span>{pricePerKwh.toLocaleString("vi-VN")} VNÐ/kWh</span>
              </div>
              <div className="detail-item">
                <span>Th?i gian s?c</span>
                <span>{chargingData.chargingInfo?.timeElapsed || 0} phút</span>
              </div>
            </div>

            <div className="amount-info">
              <div className="amount-item">
                <span>Chi phí u?c tính</span>
                <span>{totalAmount.toLocaleString("vi-VN")} VNÐ</span>
              </div>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Phuong th?c thanh toán</h3>
            <div className="methods">
              <label>
                <input
                  type="radio"
                  value="e_wallet"
                  checked={paymentMethod === "e_wallet"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Ví di?n t?
              </label>
              <label>
                <input
                  type="radio"
                  value="banking"
                  checked={paymentMethod === "banking"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Chuy?n kho?n ngân hàng
              </label>
              <label>
                <input
                  type="radio"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Th? tín d?ng
              </label>
              <label>
                <input
                  type="radio"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                Thanh toán t?i tr?m
              </label>
            </div>
          </div>
        </div>

        <div className="right">
          <div className="total-card">
            <h3>T?ng thanh toán</h3>
            <div className="row">
              <span>Phí d?t l?ch</span>
              <span className="value">
                {chargingData.chargingInfo?.bookingCost?.toLocaleString(
                  "vi-VN"
                ) || 0}{" "}
                VNÐ
              </span>
            </div>
            <div className="row">
              <span>
                Phí di?n (
                {chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh)
              </span>
              <span className="value">
                {chargingData.chargingInfo?.energyCost?.toLocaleString(
                  "vi-VN"
                ) || 0}{" "}
                VNÐ
              </span>
            </div>
            <div className="row total-row">
              <span>T?ng c?ng</span>
              <span className="value">
                {totalAmount.toLocaleString("vi-VN")} VNÐ
              </span>
            </div>
            <button
              className="pay-btn"
              disabled={isPaying}
              onClick={handleSandboxPay}
            >
              {isPaying ? "Ðang x? lý..." : "Thanh toán ngay"}
            </button>
            <button
              className="invoice-btn"
              onClick={() => setInvoice({
                code: `INV-${Date.now()}`,
                createdAt: new Date().toLocaleString("vi-VN"),
                vehicleInfo: chargingData.vehicleInfo,
                chargingInfo: chargingData.chargingInfo,
                totalAmount: totalAmount,
                paymentMethod: paymentMethod,
              })}
            >
              Xem hóa don
            </button>
          </div>

          {invoice && (
            <div className="invoice-card">
              <h3>Hóa don chi ti?t</h3>
              <p>
                <b>Mã hóa don:</b> {invoice.code}
              </p>
              <p>
                <b>Ngày t?o:</b> {invoice.createdAt}
              </p>
              <p>
                <b>Bi?n s? xe:</b> {invoice.vehicleInfo?.plateNumber}
              </p>
              <p>
                <b>Hãng xe:</b> {invoice.vehicleInfo?.make}{" "}
                {invoice.vehicleInfo?.model}
              </p>
              <p>
                <b>Phí d?t l?ch:</b>{" "}
                {invoice.chargingInfo?.bookingCost?.toLocaleString("vi-VN")} VNÐ
              </p>
              <p>
                <b>Phí di?n:</b>{" "}
                {invoice.chargingInfo?.energyCost?.toLocaleString("vi-VN")} VNÐ
              </p>
              <p>
                <b>Thanh toán qua:</b> {paymentMethod}
              </p>
              <p className="grand-total">
                <b>T?ng ti?n:</b> {invoice.totalAmount.toLocaleString("vi-VN")} VNÐ
              </p>
              <div className="invoice-actions">
                <button
                  className="print-btn"
                  onClick={() => setShowInvoice(true)}
                >
                  ??? In hóa don
                </button>
                <button className="close-btn" onClick={() => setInvoice(null)}>
                  ?? Ðóng
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showInvoice && invoice && (
        <div className="invoice-print-container">
          <div className="invoice-print-content">
            <div className="invoice-header">
              <div className="invoice-title">HÓA ÐON ÐI?N T?</div>
              <div className="invoice-code">Mã hóa don: {invoice.code}</div>
              <div className="invoice-date">Ngày t?o: {invoice.createdAt}</div>
            </div>

            <div className="invoice-info">
              <div className="info-section">
                <h3>Thông tin xe</h3>
                <div className="info-item">
                  <span className="info-label">Bi?n s?:</span>
                  <span className="info-value">
                    {invoice.vehicleInfo?.plateNumber}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Hãng xe:</span>
                  <span className="info-value">
                    {invoice.vehicleInfo?.make} {invoice.vehicleInfo?.model}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">M?c s?c:</span>
                  <span className="info-value">
                    {invoice.chargingInfo?.currentCharge}%
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Th?i gian s?c:</span>
                  <span className="info-value">
                    {invoice.chargingInfo?.timeElapsed} phút
                  </span>
                </div>
              </div>

              <div className="info-section">
                <h3>Chi ti?t thanh toán</h3>
                <div className="info-item">
                  <span className="info-label">Phí d?t l?ch:</span>
                  <span className="info-value">
                    {invoice.chargingInfo?.bookingCost?.toLocaleString("vi-VN")} VNÐ
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">
                    Phí di?n ({invoice.chargingInfo?.energyKwh?.toFixed(2)} kWh):
                  </span>
                  <span className="info-value">
                    {invoice.chargingInfo?.energyCost?.toLocaleString("vi-VN")} VNÐ
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Thanh toán qua:</span>
                  <span className="info-value">{invoice.paymentMethod}</span>
                </div>
              </div>
            </div>

            <div className="total-section">
              <div className="total-label">T?ng ti?n</div>
              <div className="total-amount">
                {invoice.totalAmount.toLocaleString()} d
              </div>
            </div>

            <div className="invoice-footer">
              <p>C?m on b?n dã s? d?ng d?ch v? s?c xe di?n!</p>
              <p>Hóa don này du?c t?o t? d?ng b?i h? th?ng</p>
            </div>

            <div className="invoice-actions no-print">
              <button className="print-btn" onClick={() => window.print()}>
                ??? In hóa don
              </button>
              <button
                className="close-btn"
                onClick={() => setShowInvoice(false)}
              >
                ?? Ðóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
