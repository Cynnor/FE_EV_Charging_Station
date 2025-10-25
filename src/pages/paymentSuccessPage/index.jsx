import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";

export default function PaymentSuccessPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [paymentInfo, setPaymentInfo] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);

        // Lấy thông tin thanh toán từ URL params hoặc state
        const urlParams = new URLSearchParams(window.location.search);
        const reservationId = urlParams.get('reservationId') || state?.reservationId;
        const amount = urlParams.get('amount') || state?.amount;
        const orderInfo = urlParams.get('orderInfo') || state?.orderInfo;

        if (reservationId) {
            setPaymentInfo({
                reservationId,
                amount: amount ? parseInt(amount) : null,
                orderInfo
            });
        }
    }, [state]);

    const handleGoToProfile = () => {
        navigate("/profile");
    };

    const handleGoToHome = () => {
        navigate("/");
    };

    return (
        <div className="payment-success-page">
            <div className="success-container">
                <div className="success-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2" />
                        <path d="M9 12l2 2 4-4" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <h1 className="success-title">Thanh toán thành công!</h1>
                <p className="success-message">
                    Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện của chúng tôi.
                </p>

                {paymentInfo && (
                    <div className="payment-details">
                        <h3>Chi tiết giao dịch</h3>
                        <div className="detail-item">
                            <span className="label">Mã lịch:</span>
                            <span className="value">#{paymentInfo.reservationId}</span>
                        </div>
                        {paymentInfo.amount && (
                            <div className="detail-item">
                                <span className="label">Số tiền:</span>
                                <span className="value amount">{paymentInfo.amount.toLocaleString()} đ</span>
                            </div>
                        )}
                        {paymentInfo.orderInfo && (
                            <div className="detail-item">
                                <span className="label">Mô tả:</span>
                                <span className="value">{paymentInfo.orderInfo}</span>
                            </div>
                        )}
                        <div className="detail-item">
                            <span className="label">Thời gian:</span>
                            <span className="value">{new Date().toLocaleString("vi-VN")}</span>
                        </div>
                    </div>
                )}

                <div className="success-actions">
                    <button className="primary-btn" onClick={handleGoToProfile}>
                        Xem lịch đặt
                    </button>
                    <button className="secondary-btn" onClick={handleGoToHome}>
                        Về trang chủ
                    </button>
                </div>

                <div className="success-tips">
                    <h4>Lưu ý quan trọng:</h4>
                    <ul>
                        <li>Vui lòng đến đúng thời gian đã đặt lịch</li>
                        <li>Mang theo mã lịch để xác nhận tại trạm</li>
                        <li>Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}




