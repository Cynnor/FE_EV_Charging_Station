import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

export default function PaymentSuccessPage() {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [paymentInfo, setPaymentInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState('processing');

    useEffect(() => {
        window.scrollTo(0, 0);
        handlePaymentReturn();
    }, []);

    const handlePaymentReturn = async () => {
        try {
            setIsLoading(true);

            // Lấy thông tin từ URL params (VNPay return)
            const urlParams = new URLSearchParams(window.location.search);
            const vnpParams = {
                vnp_Amount: urlParams.get('vnp_Amount'),
                vnp_BankCode: urlParams.get('vnp_BankCode'),
                vnp_BankTranNo: urlParams.get('vnp_BankTranNo'),
                vnp_CardType: urlParams.get('vnp_CardType'),
                vnp_OrderInfo: urlParams.get('vnp_OrderInfo'),
                vnp_PayDate: urlParams.get('vnp_PayDate'),
                vnp_ResponseCode: urlParams.get('vnp_ResponseCode'),
                vnp_TmnCode: urlParams.get('vnp_TmnCode'),
                vnp_TransactionNo: urlParams.get('vnp_TransactionNo'),
                vnp_TransactionStatus: urlParams.get('vnp_TransactionStatus'),
                vnp_TxnRef: urlParams.get('vnp_TxnRef'),
                vnp_SecureHash: urlParams.get('vnp_SecureHash')
            };

            // Kiểm tra xem có phải VNPay return không
            if (vnpParams.vnp_ResponseCode) {
                // Kiểm tra xem có phải subscription payment không
                const orderInfo = decodeURIComponent(vnpParams.vnp_OrderInfo || '');
                const isSubscriptionPayment = orderInfo.toLowerCase().includes('gói') ||
                    orderInfo.toLowerCase().includes('goi') ||
                    orderInfo.toLowerCase().includes('subscription') ||
                    orderInfo.toLowerCase().includes('thanh toan goi');

                // Lấy subscriptionId từ localStorage (đã lưu khi tạo payment)
                const pendingSubscriptionId = localStorage.getItem('pendingSubscriptionId');

                if (isSubscriptionPayment && pendingSubscriptionId) {
                    // Xử lý subscription payment
                    try {
                        const response = await api.post('/subscriptions/check-payment-status', {
                            subscriptionId: pendingSubscriptionId,
                            vnp_Amount: vnpParams.vnp_Amount,
                            vnp_BankCode: vnpParams.vnp_BankCode,
                            vnp_BankTranNo: vnpParams.vnp_BankTranNo,
                            vnp_CardType: vnpParams.vnp_CardType,
                            vnp_OrderInfo: vnpParams.vnp_OrderInfo,
                            vnp_PayDate: vnpParams.vnp_PayDate,
                            vnp_ResponseCode: vnpParams.vnp_ResponseCode,
                            vnp_TmnCode: vnpParams.vnp_TmnCode,
                            vnp_TransactionNo: vnpParams.vnp_TransactionNo,
                            vnp_TransactionStatus: vnpParams.vnp_TransactionStatus,
                            vnp_TxnRef: vnpParams.vnp_TxnRef,
                            vnp_SecureHash: vnpParams.vnp_SecureHash
                        });

                        if (response.data?.success) {
                            const paymentData = response.data.data || response.data;
                            const status = paymentData.paymentStatus || response.data.paymentStatus ||
                                (vnpParams.vnp_ResponseCode === '00' ? 'success' : 'failed');

                            setPaymentStatus(status);

                            if (status === 'success' || vnpParams.vnp_ResponseCode === '00') {
                                // Xóa pendingSubscriptionId sau khi xử lý thành công
                                localStorage.removeItem('pendingSubscriptionId');

                                const subscriptionInfo = paymentData.subscription || paymentData.subscriptionData || paymentData;

                                setPaymentInfo({
                                    subscriptionId: pendingSubscriptionId,
                                    amount: parseInt(vnpParams.vnp_Amount) / 100,
                                    orderInfo: decodeURIComponent(vnpParams.vnp_OrderInfo || ''),
                                    transactionNo: vnpParams.vnp_TransactionNo,
                                    bankCode: vnpParams.vnp_BankCode,
                                    cardType: vnpParams.vnp_CardType,
                                    payDate: vnpParams.vnp_PayDate,
                                    paymentMethod: 'vnpay',
                                    isSubscription: true,
                                    subscriptionInfo: subscriptionInfo
                                });
                            } else if (status === 'failed') {
                                setPaymentStatus('error');
                            } else if (status === 'cancelled') {
                                setPaymentStatus('cancelled');
                            }
                        }
                    } catch (subError) {
                        console.error('Error checking subscription payment:', subError);
                        setPaymentStatus('error');
                    }
                } else {
                    // Xử lý booking payment (reservation)
                    const reservationId = vnpParams.vnp_TxnRef || localStorage.getItem("reservationId");

                    if (reservationId) {
                        // Gọi API để kiểm tra trạng thái thanh toán
                        const response = await api.post('/vnpay/check-payment-status', {
                            reservationId: reservationId,
                            ...vnpParams
                        });

                        if (response.data?.success) {
                            const paymentData = response.data.data;
                            const status = paymentData.paymentStatus || response.data.paymentStatus;
                            setPaymentStatus(status);

                            // Xử lý các trạng thái: success, failed, cancelled
                            if (status === 'success') {
                                setPaymentInfo({
                                    reservationId: reservationId,
                                    amount: parseInt(vnpParams.vnp_Amount) / 100, // VNPay trả về amount * 100
                                    orderInfo: decodeURIComponent(vnpParams.vnp_OrderInfo || ''),
                                    transactionNo: vnpParams.vnp_TransactionNo,
                                    bankCode: vnpParams.vnp_BankCode,
                                    cardType: vnpParams.vnp_CardType,
                                    payDate: vnpParams.vnp_PayDate,
                                    vehicleInfo: state?.vehicleInfo,
                                    chargingInfo: state?.chargingInfo,
                                    paymentMethod: state?.paymentMethod || 'vnpay'
                                });
                            } else if (status === 'failed') {
                                setPaymentStatus('error');
                            } else if (status === 'cancelled') {
                                setPaymentStatus('cancelled');
                            }
                        }
                    }
                }
            } else if (state?.reservationId) {
                // Trường hợp chuyển từ PaymentPage (fallback)
                setPaymentInfo({
                    reservationId: state.reservationId,
                    amount: state.amount,
                    orderInfo: state.orderInfo,
                    vehicleInfo: state.vehicleInfo,
                    chargingInfo: state.chargingInfo,
                    paymentMethod: state.paymentMethod
                });
                setPaymentStatus('success');
            }
        } catch (error) {
            console.error('Error handling payment return:', error);
            setPaymentStatus('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoToProfile = () => {
        navigate("/profile");
    };

    const handleGoToHome = () => {
        navigate("/");
    };

    const handleGoToMembership = () => {
        navigate("/membership");
    };

    const formatPayDate = (payDate) => {
        if (!payDate) return new Date().toLocaleString("vi-VN");
        // VNPay format: YYYYMMDDHHmmss
        const year = payDate.substring(0, 4);
        const month = payDate.substring(4, 6);
        const day = payDate.substring(6, 8);
        const hour = payDate.substring(8, 10);
        const minute = payDate.substring(10, 12);
        const second = payDate.substring(12, 14);
        return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString("vi-VN");
    };

    if (isLoading) {
        return (
            <div className="payment-success-page">
                <div className="success-container">
                    <div className="loading-animation">
                        <div className="spinner"></div>
                        <div className="loading-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                    <h1>Đang xử lý thanh toán...</h1>
                    <p>Vui lòng đợi trong giây lát</p>
                </div>
            </div>
        );
    }

    // Xử lý 3 trạng thái: error (failed), cancelled, và success
    if (paymentStatus === 'error') {
        return (
            <div className="payment-success-page">
                <div className="success-container error-container">
                    <div className="error-icon">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2" fill="#ffe6e6" />
                            <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="error-title">Thanh toán thất bại</h1>
                    <p className="error-message">
                        Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
                    </p>
                    <div className="action-buttons">
                        <button className="retry-btn" onClick={() => navigate(-1)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Thử lại
                        </button>
                        <button className="home-btn" onClick={handleGoToHome}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Trạng thái cancelled (hủy thanh toán)
    if (paymentStatus === 'cancelled') {
        return (
            <div className="payment-success-page">
                <div className="success-container cancelled-container">
                    <div className="cancelled-icon">
                        <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#f39c12" strokeWidth="2" fill="#fff3cd" />
                            <path d="M12 8v4M12 16h.01" stroke="#f39c12" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="cancelled-title">Đã hủy thanh toán</h1>
                    <p className="cancelled-message">
                        Bạn đã hủy quá trình thanh toán. Nếu bạn muốn tiếp tục, vui lòng thử lại.
                    </p>
                    <div className="action-buttons">
                        <button className="retry-btn" onClick={() => navigate(-1)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M1 4v6h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Thử lại
                        </button>
                        <button className="home-btn" onClick={handleGoToHome}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Về trang chủ
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-success-page">
            <div className="success-container">
                {/* Success Animation */}
                <div className="success-animation">
                    <div className="checkmark">
                        <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="#4CAF50" strokeWidth="2" fill="#e8f5e8" />
                            <path d="M9 12l2 2 4-4" stroke="#4CAF50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <div className="confetti">
                        <div className="confetti-piece"></div>
                        <div className="confetti-piece"></div>
                        <div className="confetti-piece"></div>
                        <div className="confetti-piece"></div>
                        <div className="confetti-piece"></div>
                    </div>
                </div>

                {/* Success Content */}
                <div className="success-content">
                    <h1 className="success-title">
                        {paymentInfo?.isSubscription ? 'Đăng ký gói thành công!' : 'Thanh toán thành công!'}
                    </h1>
                    <p className="success-message">
                        {paymentInfo?.isSubscription
                            ? 'Gói đăng ký của bạn đã được kích hoạt tự động. Bạn có thể bắt đầu sử dụng ngay!'
                            : 'Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện của chúng tôi.'}
                    </p>

                    {paymentInfo && (
                        <div className="payment-details-card">
                            <div className="card-header">
                                <h3>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                        <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
                                        <line x1="12" y1="17" x2="12" y2="21" stroke="currentColor" strokeWidth="2" />
                                    </svg>
                                    {paymentInfo.isSubscription ? 'Chi tiết đăng ký gói' : 'Chi tiết giao dịch'}
                                </h3>
                            </div>

                            <div className="details-grid">
                                {paymentInfo.isSubscription ? (
                                    <>
                                        <div className="detail-item">
                                            <span className="label">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Mã subscription
                                            </span>
                                            <span className="value">#{paymentInfo.subscriptionId?.slice(-8) || 'N/A'}</span>
                                        </div>
                                        {paymentInfo.subscriptionInfo?.plan?.name && (
                                            <div className="detail-item">
                                                <span className="label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Tên gói
                                                </span>
                                                <span className="value">{paymentInfo.subscriptionInfo.plan.name}</span>
                                            </div>
                                        )}
                                        {paymentInfo.subscriptionInfo?.plan?.type && (
                                            <div className="detail-item">
                                                <span className="label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Loại gói
                                                </span>
                                                <span className="value">{paymentInfo.subscriptionInfo.plan.type.toUpperCase()}</span>
                                            </div>
                                        )}
                                        {paymentInfo.amount && (
                                            <div className="detail-item highlight">
                                                <span className="label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Số tiền
                                                </span>
                                                <span className="value amount">{paymentInfo.amount.toLocaleString('vi-VN')} VNĐ</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="detail-item">
                                            <span className="label">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Mã lịch
                                            </span>
                                            <span className="value">#{paymentInfo.reservationId}</span>
                                        </div>

                                        {paymentInfo.amount && (
                                            <div className="detail-item highlight">
                                                <span className="label">
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                        <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" />
                                                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                    Số tiền
                                                </span>
                                                <span className="value amount">{paymentInfo.amount.toLocaleString('vi-VN')} VNĐ</span>
                                            </div>
                                        )}
                                    </>
                                )}

                                {paymentInfo.transactionNo && (
                                    <div className="detail-item">
                                        <span className="label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                                <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Mã giao dịch
                                        </span>
                                        <span className="value">{paymentInfo.transactionNo}</span>
                                    </div>
                                )}

                                {paymentInfo.bankCode && (
                                    <div className="detail-item">
                                        <span className="label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                            Ngân hàng
                                        </span>
                                        <span className="value">{paymentInfo.bankCode}</span>
                                    </div>
                                )}

                                <div className="detail-item">
                                    <span className="label">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                            <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Thời gian
                                    </span>
                                    <span className="value">{formatPayDate(paymentInfo.payDate)}</span>
                                </div>

                                {!paymentInfo.isSubscription && paymentInfo.vehicleInfo && (
                                    <div className="detail-item">
                                        <span className="label">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                <path d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                <polygon points="5,17 5,21 1,21 1,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                            Xe
                                        </span>
                                        <span className="value">{paymentInfo.vehicleInfo.plateNumber}</span>
                                    </div>
                                )}

                                {!paymentInfo.isSubscription && paymentInfo.chargingInfo && (
                                    <>
                                        <div className="detail-item">
                                            <span className="label">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                                                    <line x1="8" y1="21" x2="16" y2="21" stroke="currentColor" strokeWidth="2" />
                                                </svg>
                                                Mức sạc
                                            </span>
                                            <span className="value">{paymentInfo.chargingInfo.currentCharge}%</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                                    <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                                Thời gian sạc
                                            </span>
                                            <span className="value">{paymentInfo.chargingInfo.timeElapsed} phút</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="action-buttons">
                        {paymentInfo?.isSubscription ? (
                            <>
                                <button className="primary-btn" onClick={handleGoToMembership}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 2L2 7l10 5 10-5-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Xem gói đăng ký
                                </button>
                                <button className="secondary-btn" onClick={handleGoToHome}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Về trang chủ
                                </button>
                            </>
                        ) : (
                            <>
                                <button className="primary-btn" onClick={handleGoToProfile}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Xem lịch đặt
                                </button>
                                <button className="secondary-btn" onClick={handleGoToHome}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Về trang chủ
                                </button>
                            </>
                        )}
                    </div>

                    {/* Tips Section */}
                    <div className="success-tips">
                        <div className="tips-header">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <h4>Lưu ý quan trọng</h4>
                        </div>
                        <ul className="tips-list">
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Phiên sạc đã được thanh toán thành công
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Bạn có thể tiếp tục sử dụng dịch vụ sạc
                            </li>
                            <li>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Liên hệ hotline nếu cần hỗ trợ: 1900-xxxx
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}