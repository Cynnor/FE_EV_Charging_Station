import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../../config/api";

const Overview = () => {
  const [timeFilter, setTimeFilter] = useState("today");
  const [stats, setStats] = useState({
    totalStations: 0,
    activeStations: 0,
    maintenanceStations: 0,
    inactiveStations: 0,
    totalUsers: 0,
    totalChargers: 0,
    activeChargers: 0,
    maintenanceChargers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [recentStations, setRecentStations] = useState([]);
  const navigate = useNavigate();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch overview statistics
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch stations data
      const stationsResponse = await api.get("/stations");

      // ✅ Handle different response formats
      let stations = [];
      if (
        stationsResponse.data.items &&
        Array.isArray(stationsResponse.data.items)
      ) {
        stations = stationsResponse.data.items;
      } else if (Array.isArray(stationsResponse.data.data)) {
        stations = stationsResponse.data.data;
      } else if (Array.isArray(stationsResponse.data)) {
        stations = stationsResponse.data;
      }

      // Fetch users data
      const usersResponse = await api.get("/users/get-all");
      const users = Array.isArray(usersResponse.data)
        ? usersResponse.data
        : usersResponse.data.data || [];

      // Calculate station statistics
      const totalStations = stations.length;
      const activeStations = stations.filter(
        (s) => s.status === "active" || s.status === "available"
      ).length;
      const maintenanceStations = stations.filter(
        (s) => s.status === "maintenance"
      ).length;
      const inactiveStations = stations.filter(
        (s) => s.status === "inactive"
      ).length;

      // ✅ Calculate charger statistics from ports
      let totalChargers = 0;
      let activeChargers = 0;
      let maintenanceChargers = 0;

      stations.forEach((station) => {
        // Check both 'ports' and 'chargers' fields
        const chargers = station.ports || station.chargers;
        if (chargers && Array.isArray(chargers)) {
          totalChargers += chargers.length;
          activeChargers += chargers.filter(
            (c) => c.status === "available" || c.status === "active"
          ).length;
          maintenanceChargers += chargers.filter(
            (c) => c.status === "maintenance"
          ).length;
        }
      });

      setStats({
        totalStations,
        activeStations,
        maintenanceStations,
        inactiveStations,
        totalUsers: users.length,
        totalChargers,
        activeChargers,
        maintenanceChargers,
      });

      // Generate weekly data for chart (mock data based on active stations)
      const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
      const generatedWeeklyData = days.map((day, index) => ({
        day,
        value: Math.floor(activeStations * (0.7 + Math.random() * 0.3)),
      }));
      setWeeklyData(generatedWeeklyData);

      // ✅ Get 5 most recent stations - use 'id' field
      const sortedStations = [...stations]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA;
        })
        .slice(0, 5);
      setRecentStations(sortedStations);

      // Generate activities based on real data
      const activities = [];

      if (activeStations > 0) {
        activities.push({
          id: 1,
          type: "success",
          title: "Hệ thống hoạt động ổn định",
          message: `${activeStations}/${totalStations} trạm sạc đang hoạt động`,
          time: "Vừa xong",
        });
      }

      if (users.length > 0) {
        activities.push({
          id: 2,
          type: "info",
          title: "Tổng số người dùng",
          message: `${users.length} tài khoản đã đăng ký`,
          time: "Hôm nay",
        });
      }

      if (maintenanceStations > 0) {
        activities.push({
          id: 3,
          type: "warning",
          title: "Trạm cần bảo trì",
          message: `${maintenanceStations} trạm đang bảo trì`,
          time: "Hôm nay",
        });
      } else {
        activities.push({
          id: 3,
          type: "success",
          title: "Tất cả trạm hoạt động tốt",
          message: "Không có trạm nào cần bảo trì",
          time: "Hôm nay",
        });
      }

      setRecentActivities(activities);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeFilter]);

  const statsCards = [
    {
      title: "Tổng trạm sạc",
      value: stats.totalStations,
      subtitle: `${stats.activeStations} đang hoạt động`,
      icon: "🔌",
      color: "blue",
      onClick: () => navigate("/admin/station-management"),
    },
    {
      title: "Trạm bảo trì",
      value: stats.maintenanceStations,
      subtitle: `${stats.inactiveStations} không hoạt động`,
      icon: "🔧",
      color: "orange",
      onClick: () => navigate("/admin/station-management"),
    },
    {
      title: "Người dùng",
      value: stats.totalUsers,
      subtitle: "Tài khoản đã đăng ký",
      icon: "👥",
      color: "purple",
      onClick: () => navigate("/admin/user-management"),
    },
  ];

  if (loading) {
    return (
      <div className="overview-content">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="overview-content">
      {/* Filter Section */}
      <div className="overview-header">
        <div className="header-title">
          <h2>Tổng quan hệ thống</h2>
          <p>Cập nhật lúc: {new Date().toLocaleString("vi-VN")}</p>
        </div>
        <button
          className="refresh-btn"
          onClick={fetchStats}
          title="Làm mới dữ liệu"
        >
          🔄 Làm mới
        </button>
      </div>

      {/* Stats Grid */}
      <section className="stats-section">
        <div className="stats-grid">
          {statsCards.map((stat, index) => (
            <div
              key={index}
              className={`stat-card ${stat.color}`}
              onClick={stat.onClick}
              style={{ cursor: "pointer" }}
            >
              <div className="stat-header">
                <div className="stat-icon">
                  <span>{stat.icon}</span>
                </div>
              </div>
              <div className="stat-content">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-title">{stat.title}</p>
                <p className="stat-subtitle">{stat.subtitle}</p>
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
                <h3>Trạm sạc hoạt động trong tuần</h3>
                <p>Số lượng trạm đang hoạt động theo ngày</p>
              </div>
            </div>
            <div className="chart-content">
              <div className="chart-visual">
                <div className="chart-bars">
                  {weeklyData.map((data, i) => {
                    const maxValue = Math.max(
                      ...weeklyData.map((d) => d.value)
                    );
                    const height =
                      maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                    return (
                      <div key={i} className="bar-container">
                        <div
                          className="bar"
                          style={{ height: `${height}%` }}
                          title={`${data.day}: ${data.value} trạm`}
                        >
                          <span className="bar-value">{data.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="chart-labels">
                  {weeklyData.map((data, i) => (
                    <span key={i}>{data.day}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Activity Feed */}
        <section className="activity-section">
          <div className="activity-card">
            <div className="card-header">
              <h3>Hoạt động hệ thống</h3>
              <button
                className="btn-link"
                onClick={() => navigate("/admin/stations")}
              >
                Xem chi tiết
              </button>
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

      {/* Recent Stations */}
      {recentStations.length > 0 && (
        <section className="recent-section">
          <div className="section-header">
            <h3>Trạm sạc gần đây</h3>
            <button
              className="btn-link"
              onClick={() => navigate("/admin/station-management")}
            >
              Xem tất cả
            </button>
          </div>
          <div className="recent-grid">
            {recentStations.map((station) => (
              <div
                key={station.id}
                className="station-card"
                onClick={() => navigate("/admin/station-management")}
              >
                <div className="station-header">
                  <h4>{station.name || "Không có tên"}</h4>
                  <span className={`status-badge ${station.status}`}>
                    {station.status === "active"
                      ? "🟢 Hoạt động"
                      : station.status === "maintenance"
                      ? "🔧 Bảo trì"
                      : "⚪ Không hoạt động"}
                  </span>
                </div>
                <p className="station-location">
                  📍 {station.address || "Chưa có địa chỉ"}
                </p>
                <div className="station-info">
                  <span>
                    ⚡ {(station.ports || station.chargers)?.length || 0} cổng
                    sạc
                  </span>
                  <span>🏢 {station.provider || "Chưa có nhà cung cấp"}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="quick-actions">
        <h3>Thao tác nhanh</h3>
        <div className="actions-grid">
          <button
            className="action-card primary"
            onClick={() => navigate("/admin/station-management")}
          >
            <div className="action-icon">🔌</div>
            <div className="action-content">
              <h4>Quản lý trạm sạc</h4>
              <p>Xem và quản lý {stats.totalStations} trạm sạc</p>
            </div>
          </button>
          <button
            className="action-card"
            onClick={() => navigate("/admin/user-management")}
          >
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h4>Quản lý người dùng</h4>
              <p>Quản lý {stats.totalUsers} tài khoản</p>
            </div>
          </button>
        </div>
      </section>
    </div>
  );
};

export default Overview;
