import { useState } from "react";
import "./index.scss";

const Overview = () => {
  const [timeFilter, setTimeFilter] = useState("today");

  const stats = [
    {
      title: "Tổng trụ sạc",
      value: "524",
      change: "+12",
      changeType: "increase",
      icon: "⚡",
      color: "blue",
    },
    {
      title: "Đang hoạt động",
      value: "498",
      change: "+8",
      changeType: "increase",
      icon: "🟢",
      color: "green",
    },
    {
      title: "Đang bảo trì",
      value: "26",
      change: "-3",
      changeType: "decrease",
      icon: "🔧",
      color: "orange",
    },
    {
      title: "Doanh thu hôm nay",
      value: "₫2.4M",
      change: "+15%",
      changeType: "increase",
      icon: "💰",
      color: "purple",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "success",
      title: "Trạm sạc mới đã được thêm",
      message: "Vinhomes Grand Park - 150kW",
      time: "5 phút trước",
    },
    {
      id: 2,
      type: "warning",
      title: "Trạm sạc cần bảo trì",
      message: "Landmark 81 - Kiểm tra định kỳ",
      time: "1 giờ trước",
    },
    {
      id: 3,
      type: "info",
      title: "Người dùng mới đăng ký",
      message: "50 tài khoản mới hôm nay",
      time: "2 giờ trước",
    },
  ];

  return (
    <div className="overview-content">
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
          <option value="year">12 tháng qua</option>
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
        {/* Charts Section */}
        <section className="charts-section">
          <div className="chart-card main-chart">
            <div className="card-header">
              <div className="header-content">
                <h3>Biểu đồ sử dụng</h3>
                <p>Thống kê sử dụng trụ sạc theo thời gian</p>
              </div>
            </div>
            <div className="chart-content">
              <div className="chart-placeholder">
                <div className="chart-visual">
                  <div className="chart-bars">
                    {Array.from({ length: 7 }, (_, i) => (
                      <div
                        key={i}
                        className="bar"
                        style={{ height: `${Math.random() * 80 + 20}%` }}
                      ></div>
                    ))}
                  </div>
                  <div className="chart-labels">
                    <span>T2</span>
                    <span>T3</span>
                    <span>T4</span>
                    <span>T5</span>
                    <span>T6</span>
                    <span>T7</span>
                    <span>CN</span>
                  </div>
                </div>
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
            <div className="action-icon">➕</div>
            <div className="action-content">
              <h4>Thêm trạm sạc</h4>
              <p>Thêm trạm sạc mới vào hệ thống</p>
            </div>
          </button>
          <button className="action-card">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h4>Xem báo cáo</h4>
              <p>Tạo và xuất báo cáo chi tiết</p>
            </div>
          </button>
          <button className="action-card">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h4>Quản lý người dùng</h4>
              <p>Xem và quản lý tài khoản</p>
            </div>
          </button>
          <button className="action-card">
            <div className="action-icon">⚙️</div>
            <div className="action-content">
              <h4>Cài đặt hệ thống</h4>
              <p>Cấu hình và tùy chỉnh</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Overview;
