import { useState } from "react";
import "./index.scss";

const RevenueManagement = () => {
  const [timeFilter, setTimeFilter] = useState("30days");

  // Mock revenue data
  const revenueStats = [
    {
      title: "Doanh thu hôm nay",
      value: "₫2,450,000",
      change: "+15.2%",
      changeType: "increase",
      icon: "💰",
      comparison: "so với hôm qua",
    },
    {
      title: "Doanh thu tháng này",
      value: "₫68,200,000",
      change: "+8.7%",
      changeType: "increase",
      icon: "📈",
      comparison: "so với tháng trước",
    },
    {
      title: "Trung bình/ngày",
      value: "₫2,100,000",
      change: "-2.1%",
      changeType: "decrease",
      icon: "📊",
      comparison: "so với tháng trước",
    },
    {
      title: "Mục tiêu tháng",
      value: "85%",
      change: "₫58M/₫70M",
      changeType: "increase",
      icon: "🎯",
      comparison: "hoàn thành",
    },
  ];

  // Mock station revenue data
  const stationRevenue = [
    {
      id: 1,
      name: "Vincom Đồng Khởi",
      revenue: 450000,
      percentage: 85,
      growth: 12.5,
    },
    {
      id: 2,
      name: "Landmark 81",
      revenue: 380000,
      percentage: 72,
      growth: 8.3,
    },
    {
      id: 3,
      name: "Crescent Mall",
      revenue: 320000,
      percentage: 60,
      growth: -2.1,
    },
    {
      id: 4,
      name: "AEON Bình Tân",
      revenue: 290000,
      percentage: 55,
      growth: 15.7,
    },
    { id: 5, name: "GIGAMALL", revenue: 270000, percentage: 51, growth: 5.4 },
  ];

  // Mock transaction data
  const recentTransactions = [
    {
      id: 1,
      user: "Nguyễn Văn A",
      station: "Vincom Đồng Khởi",
      amount: 45000,
      date: "2024-12-22 14:30",
      status: "completed",
    },
    {
      id: 2,
      user: "Trần Thị B",
      station: "Landmark 81",
      amount: 67500,
      date: "2024-12-22 13:15",
      status: "completed",
    },
    {
      id: 3,
      user: "Lê Văn C",
      station: "Crescent Mall",
      amount: 32000,
      date: "2024-12-22 12:45",
      status: "pending",
    },
    {
      id: 4,
      user: "Phạm Thị D",
      station: "AEON Bình Tân",
      amount: 28000,
      date: "2024-12-22 11:20",
      status: "completed",
    },
    {
      id: 5,
      user: "Hoàng Minh E",
      station: "GIGAMALL",
      amount: 55000,
      date: "2024-12-22 10:30",
      status: "failed",
    },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="revenue-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h2 className="main-title">Báo cáo doanh thu</h2>
          <p className="main-desc">
            Thống kê chi tiết về doanh thu và hiệu quả kinh doanh
          </p>
        </div>
        <div className="header-actions">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="time-filter"
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="3months">3 tháng qua</option>
            <option value="year">Năm nay</option>
          </select>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="revenue-overview">
        {revenueStats.map((stat, index) => (
          <div key={index} className="revenue-card">
            <div className="revenue-icon">{stat.icon}</div>
            <div className="revenue-content">
              <h3 className="card-title">{stat.title}</h3>
              <div className="revenue-amount">{stat.value}</div>
              <div className={`revenue-change ${stat.changeType}`}>
                {stat.change} {stat.comparison}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="card-header">
            <h3 className="card-title">Biểu đồ doanh thu 30 ngày qua</h3>
            <div className="chart-controls">
              <button className="chart-type-btn active">Cột</button>
              <button className="chart-type-btn">Đường</button>
              <button className="chart-type-btn">Vùng</button>
            </div>
          </div>
          <div className="chart-content">
            <div className="revenue-chart">
              <div className="chart-bars">
                {Array.from({ length: 30 }, (_, i) => (
                  <div
                    key={i}
                    className="revenue-bar"
                    style={{ height: `${Math.random() * 80 + 20}%` }}
                    title={`Ngày ${i + 1}: ${formatCurrency(
                      Math.random() * 3000000 + 1000000
                    )}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3 className="card-title">Doanh thu theo trạm</h3>
          </div>
          <div className="chart-content">
            <div className="station-revenue-list">
              {stationRevenue.map((station) => (
                <div key={station.id} className="station-revenue-item">
                  <div className="station-info">
                    <span className="station-name">{station.name}</span>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${station.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="revenue-details">
                    <span className="revenue-amount">
                      {formatCurrency(station.revenue)}
                    </span>
                    <span
                      className={`growth ${
                        station.growth >= 0 ? "positive" : "negative"
                      }`}
                    >
                      {station.growth >= 0 ? "↗" : "↘"}{" "}
                      {Math.abs(station.growth)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="transactions-section">
        <div className="section-header">
          <h3 className="card-title">Giao dịch gần đây</h3>
          <button className="btn-link">Xem tất cả</button>
        </div>
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Trạm sạc</th>
                <th>Số tiền</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>#{transaction.id}</td>
                  <td className="user-name">{transaction.user}</td>
                  <td>{transaction.station}</td>
                  <td className="amount">
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>{transaction.date}</td>
                  <td>
                    <span className={`status-badge ${transaction.status}`}>
                      {transaction.status === "completed" && "✅ Hoàn thành"}
                      {transaction.status === "pending" && "🟡 Đang xử lý"}
                      {transaction.status === "failed" && "❌ Thất bại"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="analysis-section">
        <div className="analysis-card">
          <div className="card-header">
            <h3 className="card-title">Phân tích chi tiết</h3>
          </div>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">Doanh thu cao nhất</div>
              <div className="analysis-value">₫2,850,000</div>
              <div className="analysis-date">15/12/2024</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Trạm hiệu quả nhất</div>
              <div className="analysis-value">Vincom Đồng Khởi</div>
              <div className="analysis-date">₫15,2K/ngày</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Thời gian cao điểm</div>
              <div className="analysis-value">18:00 - 20:00</div>
              <div className="analysis-date">Tối thứ 6</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Tăng trưởng tháng</div>
              <div className="analysis-value">+12.5%</div>
              <div className="analysis-date">So với tháng trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
