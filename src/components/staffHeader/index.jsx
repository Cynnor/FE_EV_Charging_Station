import { useState } from "react";
import "./index.scss";

const StaffHeader = ({ title, subtitle }) => {
    const [showNotifications, setShowNotifications] = useState(false);

    const notifications = [
        {
            id: 1,
            type: "alert",
            title: "Trụ sạc #001 cần kiểm tra",
            message: "Khách hàng báo lỗi kết nối",
            time: "5 phút trước",
            unread: true,
        },
        {
            id: 2,
            type: "info",
            title: "Phiên sạc hoàn thành",
            message: "Xe 51A-12345 đã sạc xong",
            time: "15 phút trước",
            unread: true,
        },
        {
            id: 3,
            type: "success",
            title: "Thanh toán thành công",
            message: "Khách hàng đã thanh toán 150,000đ",
            time: "30 phút trước",
            unread: false,
        },
    ];

    return (
        <>
            <header className="staff-header">
                <div className="header-left">
                    <h1>{title}</h1>
                    <p>{subtitle}</p>
                </div>

                <div className="header-right">
                    <div className="header-actions">
                        <button
                            className="notification-btn"
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <span className="icon">🔔</span>
                            <span className="badge">3</span>
                        </button>

                        <div className="staff-avatar">
                            <span>S</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Notifications Dropdown */}
            {showNotifications && (
                <div
                    className="notifications-overlay"
                    onClick={() => setShowNotifications(false)}
                >
                    <div
                        className="notifications-dropdown"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="notifications-header">
                            <h4>Thông báo</h4>
                            <button
                                className="close-btn"
                                onClick={() => setShowNotifications(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="notifications-content">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.type}`}
                                >
                                    <div className="notification-content">
                                        <h5>{notification.title}</h5>
                                        <p>{notification.message}</p>
                                        <span className="notification-time">
                                            {notification.time}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default StaffHeader;
