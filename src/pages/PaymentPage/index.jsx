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

    // Dữ liệu từ chargingSession page
    const chargingData = state?.chargingData || null;
    const reservationId = localStorage.getItem("reservationId");

    const [paymentMethod, setPaymentMethod] = useState("e_wallet"); // e_wallet | banking | card | cod
    const [isPaying, setIsPaying] = useState(false);
    const [invoice, setInvoice] = useState(null);

    // Kiểm tra dữ liệu chargingSession
    if (!chargingData) {
        return (
            <div className="payment-page">
                <div className="error-container">
                    <h1>Lỗi</h1>
                    <p>Không tìm thấy dữ liệu phiên sạc. Vui lòng quay lại trang trước.</p>
                    <button className="back-btn" onClick={() => navigate(-1)}>Quay lại</button>
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
                const response = await api.post('/vnpay/checkout-url', {
                    amount: Math.round(totalAmount),
                    orderInfo: `Thanh toan phi sạc - ${chargingData.vehicleInfo?.plateNumber || 'N/A'}`,
                    reservationId: reservationId,
                    locale: 'vn'
                });

                if (response.data?.success && response.data?.data?.paymentUrl) {
                    // Redirect đến VNPay
                    window.location.href = response.data.data.paymentUrl;
                    return;
                }
            }

            // Fallback: Giả lập thanh toán thành công và chuyển đến success page
            setTimeout(() => {
                navigate('/payment-success', {
                    state: {
                        reservationId: reservationId,
                        amount: totalAmount,
                        orderInfo: `Thanh toan phi sạc - ${chargingData.vehicleInfo?.plateNumber || 'N/A'}`,
                        vehicleInfo: chargingData.vehicleInfo,
                        chargingInfo: chargingData.chargingInfo,
                        paymentMethod: paymentMethod
                    }
                });
            }, 1200);
        } catch (error) {
            console.error('Payment error:', error);
            setIsPaying(false);
            alert('Có lỗi xảy ra khi xử lý thanh toán. Vui lòng thử lại!');
        }
    };

    const [showInvoice, setShowInvoice] = useState(false);

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="left">
                    <h1>Thanh toán</h1>

                    <div className="summary-card">
                        <h3>Thông tin phiên sạc</h3>
                        <p><b>Xe:</b> {chargingData.vehicleInfo?.plateNumber || "—"}</p>
                        <p><b>Hãng xe:</b> {chargingData.vehicleInfo?.make} {chargingData.vehicleInfo?.model}</p>
                        <p><b>Mức sạc hiện tại:</b> {chargingData.chargingInfo?.currentCharge || 0}%</p>
                        <p><b>Thời gian sạc:</b> {chargingData.chargingInfo?.timeElapsed || 0} phút</p>
                        <p><b>Năng lượng tiêu thụ:</b> {chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh</p>
                        <p><b>Bắt đầu lúc:</b> {chargingData.chargingInfo?.startTime ? new Date(chargingData.chargingInfo.startTime).toLocaleString('vi-VN') : "—"}</p>
                    </div>

                    <div className="plan-card">
                        <h3>Chi tiết thanh toán</h3>
                        <div className="charging-details">
                            <div className="detail-row">
                                <span>Phí đặt lịch:</span>
                                <span>{chargingData.chargingInfo?.bookingCost?.toLocaleString('vi-VN') || 0} VNĐ</span>
                            </div>
                            <div className="detail-row">
                                <span>Phí điện ({chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh):</span>
                                <span>{chargingData.chargingInfo?.energyCost?.toLocaleString('vi-VN') || 0} VNĐ</span>
                            </div>
                            <div className="detail-row total">
                                <span><strong>Tổng cộng:</strong></span>
                                <span><strong>{totalAmount.toLocaleString('vi-VN')} VNĐ</strong></span>
                            </div>
                        </div>
                    </div>

                    {/* <div className="payment-methods">
                        <h3>Phương thức thanh toán</h3>
                        <div className="methods">
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="e_wallet"
                                    checked={paymentMethod === "e_wallet"}
                                    onChange={() => setPaymentMethod("e_wallet")}
                                />
                                Ví điện tử
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="banking"
                                    checked={paymentMethod === "banking"}
                                    onChange={() => setPaymentMethod("banking")}
                                />
                                Banking
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="card"
                                    checked={paymentMethod === "card"}
                                    onChange={() => setPaymentMethod("card")}
                                />
                                Thẻ
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={() => setPaymentMethod("cod")}
                                />
                                Thanh toán tại trạm
                            </label>
                        </div>
                    </div> */}
                </div>

                <div className="right">
                    <div className="total-card">
                        <h3>Tổng thanh toán</h3>
                        <div className="row">
                            <span>Phí đặt lịch</span>
                            <span className="value">{chargingData.chargingInfo?.bookingCost?.toLocaleString('vi-VN') || 0} VNĐ</span>
                        </div>
                        <div className="row">
                            <span>Phí điện ({chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh)</span>
                            <span className="value">{chargingData.chargingInfo?.energyCost?.toLocaleString('vi-VN') || 0} VNĐ</span>
                        </div>
                        <div className="row total-row">
                            <span>Tổng cộng</span>
                            <span className="value">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <button
                            className="pay-btn"
                            disabled={isPaying}
                            onClick={handleSandboxPay}
                        >
                            {isPaying ? "Đang xử lý..." : "Thanh toán"}
                        </button>
                        <button className="back-btn" onClick={() => navigate(-1)}>Quay lại</button>
                    </div>

                    {invoice && (
                        <div className="invoice">
                            <h3>Hóa đơn điện tử</h3>
                            <p><b>Mã hóa đơn:</b> {invoice.code}</p>
                            <p><b>Thời gian:</b> {invoice.createdAt}</p>
                            <p><b>Xe:</b> {invoice.vehicleInfo?.plateNumber}</p>
                            <p><b>Hãng xe:</b> {invoice.vehicleInfo?.make} {invoice.vehicleInfo?.model}</p>
                            <p><b>Phí đặt lịch:</b> {invoice.chargingInfo?.bookingCost?.toLocaleString('vi-VN')} VNĐ</p>
                            <p><b>Phí điện:</b> {invoice.chargingInfo?.energyCost?.toLocaleString('vi-VN')} VNĐ</p>
                            <p><b>Thanh toán qua:</b> {paymentMethod}</p>
                            <p className="grand-total"><b>Tổng tiền:</b> {invoice.totalAmount.toLocaleString('vi-VN')} VNĐ</p>
                            <div className="invoice-actions">
                                <button className="print-btn" onClick={() => setShowInvoice(true)}>🖨️ In hóa đơn</button>
                                <button className="close-btn" onClick={() => setInvoice(null)}>✖️ Đóng</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showInvoice && invoice && (
                <div className="invoice-print-container">
                    <div className="invoice-print-content">
                        <div className="invoice-header">
                            <div className="invoice-title">HÓA ĐƠN ĐIỆN TỬ</div>
                            <div className="invoice-code">Mã hóa đơn: {invoice.code}</div>
                            <div className="invoice-date">Ngày tạo: {invoice.createdAt}</div>
                        </div>

                        <div className="invoice-info">
                            <div className="info-section">
                                <h3>Thông tin xe</h3>
                                <div className="info-item">
                                    <span className="info-label">Biển số:</span>
                                    <span className="info-value">{invoice.vehicleInfo?.plateNumber}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Hãng xe:</span>
                                    <span className="info-value">{invoice.vehicleInfo?.make} {invoice.vehicleInfo?.model}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Mức sạc:</span>
                                    <span className="info-value">{invoice.chargingInfo?.currentCharge}%</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Thời gian sạc:</span>
                                    <span className="info-value">{invoice.chargingInfo?.timeElapsed} phút</span>
                                </div>
                            </div>

                            <div className="info-section">
                                <h3>Chi tiết thanh toán</h3>
                                <div className="info-item">
                                    <span className="info-label">Phí đặt lịch:</span>
                                    <span className="info-value">{invoice.chargingInfo?.bookingCost?.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Phí điện ({invoice.chargingInfo?.energyKwh?.toFixed(2)} kWh):</span>
                                    <span className="info-value">{invoice.chargingInfo?.energyCost?.toLocaleString('vi-VN')} VNĐ</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Thanh toán qua:</span>
                                    <span className="info-value">{invoice.paymentMethod}</span>
                                </div>
                            </div>
                        </div>

                        <div className="total-section">
                            <div className="total-label">Tổng tiền</div>
                            <div className="total-amount">{invoice.totalAmount.toLocaleString()} đ</div>
                        </div>

                        <div className="invoice-footer">
                            <p>Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện!</p>
                            <p>Hóa đơn này được tạo tự động bởi hệ thống</p>
                        </div>

                        <div className="invoice-actions no-print">
                            <button className="print-btn" onClick={() => window.print()}>
                                🖨️ In hóa đơn
                            </button>
                            <button className="close-btn" onClick={() => setShowInvoice(false)}>
                                ✖️ Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}