import { useState } from "react";
import "./index.scss";

const Payment = () => {
    const [activeTab, setActiveTab] = useState("process");
    const [selectedSession, setSelectedSession] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [amount, setAmount] = useState("");
    const [showQRCode, setShowQRCode] = useState(false);

    const pendingSessions = [
        {
            id: 1,
            stationId: "ST001",
            licensePlate: "51A-12345",
            customerName: "Nguyễn Văn A",
            phone: "0901234567",
            startTime: "14:30",
            duration: "45 phút",
            energyDelivered: "37.5 kWh",
            totalCost: "₫85,000",
            status: "pending_payment",
        },
        {
            id: 2,
            stationId: "ST003",
            licensePlate: "30A-67890",
            customerName: "Trần Thị B",
            phone: "0907654321",
            startTime: "15:15",
            duration: "20 phút",
            energyDelivered: "7.3 kWh",
            totalCost: "₫35,000",
            status: "pending_payment",
        },
    ];

    const paymentHistory = [
        {
            id: 1,
            sessionId: "SES001",
            stationId: "ST002",
            licensePlate: "51B-99999",
            customerName: "Phạm Thị D",
            amount: "₫120,000",
            paymentMethod: "QR Code",
            paymentTime: "14:25",
            status: "completed",
            receiptNumber: "RCP001",
        },
        {
            id: 2,
            sessionId: "SES002",
            stationId: "ST004",
            licensePlate: "30A-22222",
            customerName: "Hoàng Văn E",
            amount: "₫55,000",
            paymentMethod: "Tiền mặt",
            paymentTime: "13:50",
            status: "completed",
            receiptNumber: "RCP002",
        },
        {
            id: 3,
            sessionId: "SES003",
            stationId: "ST006",
            licensePlate: "29A-33333",
            customerName: "Lê Thị F",
            amount: "₫75,000",
            paymentMethod: "Thẻ",
            paymentTime: "12:30",
            status: "completed",
            receiptNumber: "RCP003",
        },
    ];

    const handleSelectSession = (session) => {
        setSelectedSession(session);
        setAmount(session.totalCost);
    };

    const handlePaymentMethodChange = (method) => {
        setPaymentMethod(method);
        if (method === "qr") {
            setShowQRCode(true);
        } else {
            setShowQRCode(false);
        }
    };

    const handleProcessPayment = () => {
        if (!selectedSession || !paymentMethod) {
            alert("Vui lòng chọn phiên sạc và phương thức thanh toán");
            return;
        }

        // Logic xử lý thanh toán
        console.log("Xử lý thanh toán:", {
            session: selectedSession,
            method: paymentMethod,
            amount: amount
        });

        // Reset form
        setSelectedSession(null);
        setPaymentMethod("");
        setAmount("");
        setShowQRCode(false);
    };

    const handlePrintReceipt = (payment) => {
        console.log("In hóa đơn:", payment);
    };

    return (
        <div className="payment-content">
            {/* Header */}
            <div className="payment-header">
                <div className="header-left">
                    <h2>Thanh toán tại trạm</h2>
                    <p>Xử lý thanh toán và tạo hóa đơn cho khách hàng</p>
                </div>
                <div className="header-right">
                    <div className="payment-stats">
                        <div className="stat-item">
                            <span className="label">Doanh thu hôm nay:</span>
                            <span className="value">₫1.2M</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Giao dịch:</span>
                            <span className="value">15</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="payment-tabs">
                <button
                    className={`tab ${activeTab === "process" ? "active" : ""}`}
                    onClick={() => setActiveTab("process")}
                >
                    <span className="icon">💳</span>
                    Xử lý thanh toán
                </button>
                <button
                    className={`tab ${activeTab === "history" ? "active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                    <span className="icon">📋</span>
                    Lịch sử thanh toán
                </button>
            </div>

            {/* Content */}
            <div className="payment-content-area">
                {activeTab === "process" && (
                    <div className="process-payment">
                        <div className="payment-grid">
                            {/* Pending Sessions */}
                            <div className="pending-sessions">
                                <div className="section-header">
                                    <h3>Phiên sạc chờ thanh toán</h3>
                                    <p>Chọn phiên sạc cần xử lý thanh toán</p>
                                </div>
                                <div className="sessions-list">
                                    {pendingSessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className={`session-item ${selectedSession?.id === session.id ? "selected" : ""}`}
                                            onClick={() => handleSelectSession(session)}
                                        >
                                            <div className="session-header">
                                                <div className="station-info">
                                                    <span className="station-id">{session.stationId}</span>
                                                    <span className="license-plate">{session.licensePlate}</span>
                                                </div>
                                                <div className="cost">{session.totalCost}</div>
                                            </div>
                                            <div className="session-details">
                                                <div className="detail-item">
                                                    <span className="label">Khách hàng:</span>
                                                    <span className="value">{session.customerName}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Thời gian:</span>
                                                    <span className="value">{session.duration}</span>
                                                </div>
                                                <div className="detail-item">
                                                    <span className="label">Năng lượng:</span>
                                                    <span className="value">{session.energyDelivered}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Payment Form */}
                            <div className="payment-form">
                                <div className="section-header">
                                    <h3>Thông tin thanh toán</h3>
                                    <p>Nhập thông tin và chọn phương thức thanh toán</p>
                                </div>

                                {selectedSession ? (
                                    <div className="form-content">
                                        <div className="session-summary">
                                            <div className="summary-item">
                                                <span className="label">Phiên sạc:</span>
                                                <span className="value">{selectedSession.stationId} - {selectedSession.licensePlate}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="label">Khách hàng:</span>
                                                <span className="value">{selectedSession.customerName}</span>
                                            </div>
                                            <div className="summary-item">
                                                <span className="label">Số điện thoại:</span>
                                                <span className="value">{selectedSession.phone}</span>
                                            </div>
                                            <div className="summary-item total">
                                                <span className="label">Tổng tiền:</span>
                                                <span className="value">{selectedSession.totalCost}</span>
                                            </div>
                                        </div>

                                        <div className="payment-methods">
                                            <h4>Phương thức thanh toán</h4>
                                            <div className="methods-grid">
                                                <button
                                                    className={`method-btn ${paymentMethod === "cash" ? "selected" : ""}`}
                                                    onClick={() => handlePaymentMethodChange("cash")}
                                                >
                                                    <span className="icon">💵</span>
                                                    <span className="label">Tiền mặt</span>
                                                </button>
                                                <button
                                                    className={`method-btn ${paymentMethod === "card" ? "selected" : ""}`}
                                                    onClick={() => handlePaymentMethodChange("card")}
                                                >
                                                    <span className="icon">💳</span>
                                                    <span className="label">Thẻ</span>
                                                </button>
                                                <button
                                                    className={`method-btn ${paymentMethod === "qr" ? "selected" : ""}`}
                                                    onClick={() => handlePaymentMethodChange("qr")}
                                                >
                                                    <span className="icon">📱</span>
                                                    <span className="label">QR Code</span>
                                                </button>
                                            </div>
                                        </div>

                                        {showQRCode && (
                                            <div className="qr-section">
                                                <h4>Mã QR thanh toán</h4>
                                                <div className="qr-code">
                                                    <div className="qr-placeholder">
                                                        <span className="qr-icon">📱</span>
                                                        <p>Mã QR Code</p>
                                                        <p className="amount">{selectedSession.totalCost}</p>
                                                    </div>
                                                </div>
                                                <p className="qr-instruction">
                                                    Khách hàng quét mã QR để thanh toán
                                                </p>
                                            </div>
                                        )}

                                        <div className="form-actions">
                                            <button className="btn-secondary" onClick={() => setSelectedSession(null)}>
                                                Hủy
                                            </button>
                                            <button className="btn-primary" onClick={handleProcessPayment}>
                                                Xác nhận thanh toán
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="no-selection">
                                        <div className="no-selection-content">
                                            <span className="icon">💳</span>
                                            <h4>Chọn phiên sạc</h4>
                                            <p>Vui lòng chọn một phiên sạc từ danh sách bên trái để xử lý thanh toán</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="payment-history">
                        <div className="history-table">
                            <div className="table-header">
                                <div className="col">Mã phiên</div>
                                <div className="col">Trụ sạc</div>
                                <div className="col">Biển số</div>
                                <div className="col">Khách hàng</div>
                                <div className="col">Số tiền</div>
                                <div className="col">Phương thức</div>
                                <div className="col">Thời gian</div>
                                <div className="col">Trạng thái</div>
                                <div className="col">Thao tác</div>
                            </div>
                            <div className="table-body">
                                {paymentHistory.map((payment) => (
                                    <div key={payment.id} className="table-row">
                                        <div className="col">
                                            <span className="session-id">{payment.sessionId}</span>
                                        </div>
                                        <div className="col">
                                            <span className="station-id">{payment.stationId}</span>
                                        </div>
                                        <div className="col">
                                            <span className="license-plate">{payment.licensePlate}</span>
                                        </div>
                                        <div className="col">
                                            <span className="customer-name">{payment.customerName}</span>
                                        </div>
                                        <div className="col">
                                            <span className="amount">{payment.amount}</span>
                                        </div>
                                        <div className="col">
                                            <span className={`payment-method ${payment.paymentMethod.toLowerCase().replace(' ', '-')}`}>
                                                {payment.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <span className="payment-time">{payment.paymentTime}</span>
                                        </div>
                                        <div className="col">
                                            <span className={`status ${payment.status}`}>
                                                <span className="status-dot"></span>
                                                Hoàn thành
                                            </span>
                                        </div>
                                        <div className="col">
                                            <button
                                                className="btn-small"
                                                onClick={() => handlePrintReceipt(payment)}
                                            >
                                                In hóa đơn
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
