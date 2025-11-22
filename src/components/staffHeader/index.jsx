import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.scss";

const StaffHeader = ({ title, subtitle }) => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const navigate = useNavigate();

    // Đóng menu khi click ra ngoài hoặc đổi route
    useEffect(() => {
        const handleClickOutside = (e) => {
            const menu = document.querySelector('.user-menu');
            const avatar = document.querySelector('.staff-avatar');
            if (showUserMenu && menu && avatar && !menu.contains(e.target) && !avatar.contains(e.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showUserMenu]);


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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

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

                        <div
                            className="staff-avatar"
                            onClick={() => setShowUserMenu((v) => !v)}
                            title="Tài khoản nhân viên"
                        >
                            <span>S</span>
                        </div>
                        {showUserMenu && (
                            <div className="user-menu" onClick={(e) => e.stopPropagation()}>
                                <div className="user-menu-header">
                                    <div className="avatar-small">S</div>
                                    <div className="user-info">
                                        <div className="user-name">Nhân viên</div>
                                        <div className="user-role">Staff</div>
                                    </div>
                                </div>
                                <button
                                    className="user-menu-item"
                                    onClick={() => {
                                        setShowUserMenu(false);
                                        navigate('/staff/profile');
                                    }}
                                >
                                    👤 Hồ sơ cá nhân
                                </button>
                                <div className="menu-divider" />
                                <button className="user-menu-item logout" onClick={handleLogout}>
                                    ⎋ Đăng xuất
                                </button>
                            </div>
                        )}
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
