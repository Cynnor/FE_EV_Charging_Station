import { useState } from "react";
import "./index.scss";

const Analytics = () => {
  const [timeFilter, setTimeFilter] = useState("30days");

  const analyticsData = {
    overview: {
      totalSessions: 15847,
      avgSessionTime: "42 phút",
      peakHours: "18:00 - 20:00",
      customerSatisfaction: "4.8/5",
    },
    usagePatterns: [
      { day: "T2", usage: 85 },
      { day: "T3", usage: 92 },
      { day: "T4", usage: 78 },
      { day: "T5", usage: 95 },
      { day: "T6", usage: 100 },
      { day: "T7", usage: 88 },
      { day: "CN", usage: 65 },
    ],
    demographics: [
      { age: "18-25", percentage: 25, color: "#3b82f6" },
      { age: "26-35", percentage: 35, color: "#7ed321" },
      { age: "36-45", percentage: 25, color: "#f59e0b" },
      { age: "46+", percentage: 15, color: "#ef4444" },
    ],
    stationPerformance: [
      {
        name: "Vincom Đồng Khởi",
        efficiency: 95,
        uptime: 99.2,
        satisfaction: 4.9,
      },
      { name: "Landmark 81", efficiency: 87, uptime: 97.8, satisfaction: 4.7 },
      {
        name: "Crescent Mall",
        efficiency: 78,
        uptime: 98.5,
        satisfaction: 4.6,
      },
      {
        name: "AEON Bình Tân",
        efficiency: 82,
        uptime: 96.3,
        satisfaction: 4.5,
      },
    ],
  };

  // Pie chart calculation
  const totalPercent = analyticsData.demographics.reduce(
    (sum, d) => sum + d.percentage,
    0
  );
  let lastAngle = 0;
  const pieSegments = analyticsData.demographics.map((item, idx) => {
    const angle = (item.percentage / totalPercent) * 360;
    const style = {
      background: item.color,
      transform: `rotate(${lastAngle}deg) skewY(${90 - angle}deg)`,
    };
    lastAngle += angle;
    return <div key={idx} className="pie-segment" style={style}></div>;
  });

  return (
    <div className="analytics-page">
      <div className="page-header">
        <div className="header-content">
          <h2>Phân tích dữ liệu</h2>
          <p>Phân tích chi tiết về hiệu suất và xu hướng sử dụng</p>
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
          <button className="btn-primary">
            <span>📊</span> Xuất báo cáo
          </button>
        </div>
      </div>

      {/* Tổng quan nhanh */}
      <div className="analytics-overview">
        <div className="analytics-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h3>Tổng phiên sạc</h3>
            <div className="card-value">
              {analyticsData.overview.totalSessions.toLocaleString()}
            </div>
            <div className="card-change positive">
              +12.5% so với tháng trước
            </div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="card-icon">⏱️</div>
          <div className="card-content">
            <h3>Thời gian trung bình</h3>
            <div className="card-value">
              {analyticsData.overview.avgSessionTime}
            </div>
            <div className="card-change positive">+5.2% so với tháng trước</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Giờ cao điểm</h3>
            <div className="card-value">{analyticsData.overview.peakHours}</div>
            <div className="card-change neutral">Tối thứ 6</div>
          </div>
        </div>
        <div className="analytics-card">
          <div className="card-icon">⭐</div>
          <div className="card-content">
            <h3>Hài lòng khách hàng</h3>
            <div className="card-value">
              {analyticsData.overview.customerSatisfaction}
            </div>
            <div className="card-change positive">+0.3 điểm</div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="charts-section">
        {/* Biểu đồ cột */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Mô hình sử dụng theo ngày</h3>
          </div>
          <div className="chart-content">
            <div className="usage-chart">
              {analyticsData.usagePatterns.map((item, idx) => (
                <div key={idx} className="usage-bar-container">
                  <div
                    className="usage-bar"
                    style={{ height: `${item.usage}%` }}
                    title={`${item.day}: ${item.usage}%`}
                  ></div>
                  <span className="usage-label">{item.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biểu đồ tròn */}
        <div className="chart-container">
          <div className="chart-header">
            <h3>Phân bố độ tuổi người dùng</h3>
          </div>
          <div className="chart-content">
            <div className="demographics-chart">
              <div className="pie-chart">
                {pieSegments}
                <div className="pie-center">
                  <span>Độ tuổi</span>
                </div>
              </div>
              <div className="demographics-legend">
                {analyticsData.demographics.map((item, idx) => (
                  <div key={idx} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ background: item.color }}
                    ></span>
                    <span>
                      {item.age}: {item.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hiệu suất trạm */}
      <div className="performance-section">
        <div className="section-header">
          <h3>Hiệu suất trạm sạc</h3>
          <p>Đánh giá hiệu suất hoạt động của các trạm sạc</p>
        </div>
        <div className="performance-grid">
          {analyticsData.stationPerformance.map((station, idx) => (
            <div key={idx} className="performance-card">
              <h4>{station.name}</h4>
              <div className="performance-metrics">
                <div className="metric">
                  <span className="metric-label">Hiệu suất</span>
                  <div className="metric-bar">
                    <div
                      className="metric-fill efficiency"
                      style={{ width: `${station.efficiency}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{station.efficiency}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Thời gian hoạt động</span>
                  <div className="metric-bar">
                    <div
                      className="metric-fill uptime"
                      style={{ width: `${station.uptime}%` }}
                    ></div>
                  </div>
                  <span className="metric-value">{station.uptime}%</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Hài lòng khách hàng</span>
                  <div className="rating-stars">
                    {Array.from({ length: 5 }, (_, i) => (
                      <span
                        key={i}
                        className={`star ${
                          i < Math.floor(station.satisfaction) ? "filled" : ""
                        }`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <span className="metric-value">{station.satisfaction}/5</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <div className="insights-header">
          <h3>Thông tin chi tiết</h3>
        </div>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📊</div>
            <h4>Xu hướng sử dụng</h4>
            <p>
              Thứ 6 là ngày có lượng sử dụng cao nhất trong tuần, tập trung vào
              khung giờ 18:00-20:00
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">👥</div>
            <h4>Nhóm khách hàng chính</h4>
            <p>
              Độ tuổi 26-35 chiếm 35% tổng số người dùng, là nhóm khách hàng
              tiềm năng nhất
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <h4>Hiệu suất trạm</h4>
            <p>
              Vincom Đồng Khởi có hiệu suất cao nhất với 95%, cần nhân rộng mô
              hình này
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <h4>Cơ hội cải thiện</h4>
            <p>
              Crescent Mall có tiềm năng tăng 20% hiệu suất nếu tối ưu hóa thời
              gian bảo trì
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
