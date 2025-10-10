import { useState } from "react";
import "./index.scss";

const Overview = () => {
    const [timeFilter, setTimeFilter] = useState("today");

    const stats = [
        {
            title: "Điểm sạc hoạt động",
            value: "8/10",
            change: "+2",
            changeType: "increase",
            icon: "🟢",
            color: "green",
        },
        {
            title: "Phiên sạc đang diễn ra",
            value: "3",
            change: "+1",
            changeType: "increase",
            icon: "🔌",
            color: "blue",
        },
        {
            title: "Doanh thu hôm nay",
            value: "₫1.2M",
            change: "+25%",
            changeType: "increase",
            icon: "💰",
            color: "purple",
        },
        {
            title: "Khách hàng hôm nay",
            value: "15",
            change: "+3",
            changeType: "increase",
            icon: "👥",
            color: "orange",
        },
    ];

    const currentSessions = [
        {
            id: 1,
            stationId: "ST001",
            licensePlate: "51A-12345",
            startTime: "14:30",
            duration: "45 phút",
            power: "50kW",
            estimatedCost: "₫85,000",
            status: "charging",
        },
        {
            id: 2,
            stationId: "ST003",
            licensePlate: "30A-67890",
            startTime: "15:15",
            duration: "20 phút",
            power: "22kW",
            estimatedCost: "₫35,000",
            status: "charging",
        },
        {
            id: 3,
            stationId: "ST005",
            licensePlate: "29A-11111",
            startTime: "16:00",
            duration: "5 phút",
            power: "150kW",
            estimatedCost: "₫25,000",
            status: "charging",
        },
    ];

    const recentActivities = [
        {
            id: 1,
            type: "success",
            title: "Phiên sạc hoàn thành",
            message: "Xe 51B-99999 đã sạc xong - 120,000đ",
            time: "5 phút trước",
        },
        {
            id: 2,
            type: "warning",
            title: "Trụ sạc cần kiểm tra",
            message: "ST007 - Khách báo lỗi kết nối",
            time: "15 phút trước",
        },
        {
            id: 3,
            type: "info",
            title: "Khách hàng mới",
            message: "Xe 30A-55555 bắt đầu sạc",
            time: "30 phút trước",
        },
    ];

    return (
        <div className="staff-overview-content">
            {/* Filter Section */}
            <div className="overview-header">
                <select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    className="time-filter"
                >
                    <option value="today">Hôm nay</option>
                    <option value="week">7 ngày qua</option>
                    <option value="month">30 ngày qua</option>
                </select>
            </div>

            {/* Stats Grid */}
            <section className="stats-section">
                <div className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className={`stat-card ${stat.color}`}>
                            <div className="stat-header">
                                <div className="stat-icon">
                                    <span>{stat.icon}</span>
                                </div>
                                <div className={`stat-change ${stat.changeType}`}>
                                    {stat.changeType === "increase" ? "↗" : "↘"} {stat.change}
                                </div>
                            </div>
                            <div className="stat-content">
                                <h3 className="stat-value">{stat.value}</h3>
                                <p className="stat-title">{stat.title}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <div className="dashboard-grid">
                {/* Current Sessions */}
                <section className="sessions-section">
                    <div className="sessions-card">
                        <div className="card-header">
                            <div className="header-content">
                                <h3>Phiên sạc hiện tại</h3>
                                <p>Danh sách các phiên sạc đang diễn ra</p>
                            </div>
                        </div>
                        <div className="sessions-content">
                            <div className="sessions-list">
                                {currentSessions.map((session) => (
                                    <div key={session.id} className="session-item">
                                        <div className="session-header">
                                            <div className="station-info">
                                                <span className="station-id">{session.stationId}</span>
                                                <span className="license-plate">{session.licensePlate}</span>
                                            </div>
                                            <div className={`session-status ${session.status}`}>
                                                <span className="status-dot"></span>
                                                Đang sạc
                                            </div>
                                        </div>
                                        <div className="session-details">
                                            <div className="detail-item">
                                                <span className="label">Bắt đầu:</span>
                                                <span className="value">{session.startTime}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Thời gian:</span>
                                                <span className="value">{session.duration}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Công suất:</span>
                                                <span className="value">{session.power}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Tạm tính:</span>
                                                <span className="value cost">{session.estimatedCost}</span>
                                            </div>
                                        </div>
                                        <div className="session-actions">
                                            <button className="btn-secondary">Dừng sạc</button>
                                            <button className="btn-primary">Thanh toán</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Activity Feed */}
                <section className="activity-section">
                    <div className="activity-card">
                        <div className="card-header">
                            <h3>Hoạt động gần đây</h3>
                            <button className="btn-link">Xem tất cả</button>
                        </div>
                        <div className="activity-list">
                            {recentActivities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className={`activity-item ${activity.type}`}
                                >
                                    <div className="activity-indicator"></div>
                                    <div className="activity-content">
                                        <h4>{activity.title}</h4>
                                        <p>{activity.message}</p>
                                        <span className="activity-time">{activity.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Quick Actions */}
            <section className="quick-actions">
                <h3>Thao tác nhanh</h3>
                <div className="actions-grid">
                    <button className="action-card primary">
                        <div className="action-icon">🔌</div>
                        <div className="action-content">
                            <h4>Bắt đầu sạc</h4>
                            <p>Hỗ trợ khách hàng bắt đầu phiên sạc</p>
                        </div>
                    </button>
                    <button className="action-card">
                        <div className="action-icon">💳</div>
                        <div className="action-content">
                            <h4>Thanh toán</h4>
                            <p>Xử lý thanh toán cho khách hàng</p>
                        </div>
                    </button>
                    <button className="action-card">
                        <div className="action-icon">📡</div>
                        <div className="action-content">
                            <h4>Kiểm tra trụ sạc</h4>
                            <p>Xem trạng thái các trụ sạc</p>
                        </div>
                    </button>
                    <button className="action-card">
                        <div className="action-icon">🧾</div>
                        <div className="action-content">
                            <h4>Báo cáo sự cố</h4>
                            <p>Gửi báo cáo lỗi hoặc sự cố</p>
                        </div>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default Overview;
