import { useState } from "react";
import "./index.scss";

const AdminHeader = ({ title, subtitle }) => {
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 1,
      type: "alert",
      title: "Trạm sạc Landmark 81 lỗi",
      message: "Cần kiểm tra ngay",
      time: "2 phút trước",
      unread: true,
    },
    {
      id: 2,
      type: "info",
      title: "Báo cáo doanh thu tháng",
      message: "Đã tạo báo cáo tháng 12",
      time: "30 phút trước",
      unread: true,
    },
    {
      id: 3,
      type: "success",
      title: "Trạm sạc mới hoạt động",
      message: "Vinhomes Grand Park đã online",
      time: "1 giờ trước",
      unread: false,
    },
  ];

  return (
    <>
      <header className="admin-header">
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

            <div className="admin-avatar">
              <span>H</span>
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

export default AdminHeader;
