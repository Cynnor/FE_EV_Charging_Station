import { useState } from "react";
import "./index.scss";

const ChargingSessions = () => {
    const [activeTab, setActiveTab] = useState("current");
    const [selectedSession, setSelectedSession] = useState(null);

    const currentSessions = [
        {
            id: 1,
            stationId: "ST001",
            licensePlate: "51A-12345",
            customerName: "Nguyễn Văn A",
            phone: "0901234567",
            startTime: "14:30",
            duration: "45 phút",
            power: "50kW",
            energyDelivered: "37.5 kWh",
            estimatedCost: "₫85,000",
            status: "charging",
            progress: 75,
        },
        {
            id: 2,
            stationId: "ST003",
            licensePlate: "30A-67890",
            customerName: "Trần Thị B",
            phone: "0907654321",
            startTime: "15:15",
            duration: "20 phút",
            power: "22kW",
            energyDelivered: "7.3 kWh",
            estimatedCost: "₫35,000",
            status: "charging",
            progress: 30,
        },
        {
            id: 3,
            stationId: "ST005",
            licensePlate: "29A-11111",
            customerName: "Lê Văn C",
            phone: "0909876543",
            startTime: "16:00",
            duration: "5 phút",
            power: "150kW",
            energyDelivered: "12.5 kWh",
            estimatedCost: "₫25,000",
            status: "charging",
            progress: 15,
        },
    ];

    const completedSessions = [
        {
            id: 4,
            stationId: "ST002",
            licensePlate: "51B-99999",
            customerName: "Phạm Thị D",
            phone: "0905555555",
            startTime: "13:00",
            endTime: "14:20",
            duration: "1h 20m",
            power: "50kW",
            energyDelivered: "66.7 kWh",
            totalCost: "₫120,000",
            status: "completed",
            paymentMethod: "QR Code",
        },
        {
            id: 5,
            stationId: "ST004",
            licensePlate: "30A-22222",
            customerName: "Hoàng Văn E",
            phone: "0904444444",
            startTime: "12:30",
            endTime: "13:45",
            duration: "1h 15m",
            power: "22kW",
            energyDelivered: "27.5 kWh",
            totalCost: "₫55,000",
            status: "completed",
            paymentMethod: "Tiền mặt",
        },
    ];

    const handleStartSession = () => {
        // Logic để bắt đầu phiên sạc mới
        console.log("Bắt đầu phiên sạc mới");
    };

    const handleStopSession = (sessionId) => {
        // Logic để dừng phiên sạc
        console.log("Dừng phiên sạc:", sessionId);
    };

    const handlePayment = (sessionId) => {
        // Logic để xử lý thanh toán
        console.log("Xử lý thanh toán:", sessionId);
    };

    return (
        <div className="charging-sessions-content">
            {/* Header */}
            <div className="sessions-header">
                <div className="header-left">
                    <h2>Quản lý phiên sạc</h2>
                    <p>Quản lý các phiên sạc đang diễn ra và lịch sử</p>
                </div>
                <div className="header-right">
                    <button className="btn-primary" onClick={handleStartSession}>
                        <span className="icon">🔌</span>
                        Bắt đầu sạc
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="sessions-tabs">
                <button
                    className={`tab ${activeTab === "current" ? "active" : ""}`}
                    onClick={() => setActiveTab("current")}
                >
                    <span className="icon">🔌</span>
                    Đang sạc ({currentSessions.length})
                </button>
                <button
                    className={`tab ${activeTab === "completed" ? "active" : ""}`}
                    onClick={() => setActiveTab("completed")}
                >
                    <span className="icon">✅</span>
                    Đã hoàn thành ({completedSessions.length})
                </button>
            </div>

            {/* Content */}
            <div className="sessions-content">
                {activeTab === "current" && (
                    <div className="current-sessions">
                        <div className="sessions-grid">
                            {currentSessions.map((session) => (
                                <div key={session.id} className="session-card">
                                    <div className="card-header">
                                        <div className="station-info">
                                            <span className="station-id">{session.stationId}</span>
                                            <span className="license-plate">{session.licensePlate}</span>
                                        </div>
                                        <div className={`session-status ${session.status}`}>
                                            <span className="status-dot"></span>
                                            Đang sạc
                                        </div>
                                    </div>

                                    <div className="customer-info">
                                        <div className="info-item">
                                            <span className="label">Khách hàng:</span>
                                            <span className="value">{session.customerName}</span>
                                        </div>
                                        <div className="info-item">
                                            <span className="label">SĐT:</span>
                                            <span className="value">{session.phone}</span>
                                        </div>
                                    </div>

                                    <div className="session-details">
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="label">Bắt đầu:</span>
                                                <span className="value">{session.startTime}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Thời gian:</span>
                                                <span className="value">{session.duration}</span>
                                            </div>
                                        </div>
                                        <div className="detail-row">
                                            <div className="detail-item">
                                                <span className="label">Công suất:</span>
                                                <span className="value">{session.power}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Năng lượng:</span>
                                                <span className="value">{session.energyDelivered}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="progress-section">
                                        <div className="progress-header">
                                            <span className="label">Tiến độ sạc</span>
                                            <span className="percentage">{session.progress}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${session.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="cost-section">
                                        <div className="estimated-cost">
                                            <span className="label">Tạm tính:</span>
                                            <span className="value">{session.estimatedCost}</span>
                                        </div>
                                    </div>

                                    <div className="session-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => handleStopSession(session.id)}
                                        >
                                            Dừng sạc
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handlePayment(session.id)}
                                        >
                                            Thanh toán
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === "completed" && (
                    <div className="completed-sessions">
                        <div className="sessions-table">
                            <div className="table-header">
                                <div className="col">Trụ sạc</div>
                                <div className="col">Biển số</div>
                                <div className="col">Khách hàng</div>
                                <div className="col">Thời gian</div>
                                <div className="col">Năng lượng</div>
                                <div className="col">Thành tiền</div>
                                <div className="col">Thanh toán</div>
                                <div className="col">Trạng thái</div>
                            </div>
                            <div className="table-body">
                                {completedSessions.map((session) => (
                                    <div key={session.id} className="table-row">
                                        <div className="col">
                                            <span className="station-id">{session.stationId}</span>
                                        </div>
                                        <div className="col">
                                            <span className="license-plate">{session.licensePlate}</span>
                                        </div>
                                        <div className="col">
                                            <div className="customer-info">
                                                <span className="name">{session.customerName}</span>
                                                <span className="phone">{session.phone}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <div className="time-info">
                                                <span className="start">{session.startTime}</span>
                                                <span className="end">{session.endTime}</span>
                                                <span className="duration">({session.duration})</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <span className="energy">{session.energyDelivered}</span>
                                        </div>
                                        <div className="col">
                                            <span className="cost">{session.totalCost}</span>
                                        </div>
                                        <div className="col">
                                            <span className={`payment-method ${session.paymentMethod.toLowerCase().replace(' ', '-')}`}>
                                                {session.paymentMethod}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <span className={`status ${session.status}`}>
                                                <span className="status-dot"></span>
                                                Hoàn thành
                                            </span>
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

export default ChargingSessions;
