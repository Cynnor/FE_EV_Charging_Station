import { useState } from "react";
import "./index.scss";

const StationManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const stations = [
    {
      id: 1,
      name: "Vincom Đồng Khởi",
      location: "Q1, TP.HCM",
      status: "active",
      power: "150kW",
      revenue: "₫450K",
      usage: 95,
      connectors: 4,
    },
    {
      id: 2,
      name: "Landmark 81",
      location: "Bình Thạnh, TP.HCM",
      status: "maintenance",
      power: "150kW",
      revenue: "₫380K",
      usage: 87,
      connectors: 6,
    },
    {
      id: 3,
      name: "Crescent Mall",
      location: "Q7, TP.HCM",
      status: "active",
      power: "50kW",
      revenue: "₫320K",
      usage: 78,
      connectors: 2,
    },
    {
      id: 4,
      name: "AEON Bình Tân",
      location: "Bình Tân, TP.HCM",
      status: "active",
      power: "22kW",
      revenue: "₫290K",
      usage: 65,
      connectors: 3,
    },
    {
      id: 5,
      name: "GIGAMALL",
      location: "Thủ Đức, TP.HCM",
      status: "offline",
      power: "50kW",
      revenue: "₫270K",
      usage: 0,
      connectors: 4,
    },
  ];

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="station-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h2>Quản lý trạm sạc</h2>
          <p>Quản lý tất cả trạm sạc trong hệ thống</p>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <span>➕</span> Thêm trạm sạc
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm trạm sạc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="maintenance">Bảo trì</option>
          <option value="offline">Offline</option>
        </select>
      </div>

      {/* Statistics Cards */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-number">524</span>
            <span className="stat-label">Tổng trạm</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">498</span>
            <span className="stat-label">Hoạt động</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <span className="stat-number">26</span>
            <span className="stat-label">Bảo trì</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">📊</div>
          <div className="stat-info">
            <span className="stat-number">85%</span>
            <span className="stat-label">Hiệu suất</span>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="table-container">
        <table className="stations-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên trạm</th>
              <th>Địa điểm</th>
              <th>Công suất</th>
              <th>Trạng thái</th>
              <th>Số cổng</th>
              <th>Sử dụng</th>
              <th>Doanh thu</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((station) => (
              <tr key={station.id}>
                <td>#{station.id}</td>
                <td className="station-name">
                  <div className="name-with-icon">
                    <span className="station-icon">⚡</span>
                    {station.name}
                  </div>
                </td>
                <td>{station.location}</td>
                <td className="power">{station.power}</td>
                <td>
                  <span className={`status-badge ${station.status}`}>
                    {station.status === "active" && "🟢 Hoạt động"}
                    {station.status === "maintenance" && "🔧 Bảo trì"}
                    {station.status === "offline" && "🔴 Offline"}
                  </span>
                </td>
                <td>{station.connectors} cổng</td>
                <td>
                  <div className="usage-indicator">
                    <div className="usage-bar">
                      <div
                        className="usage-fill"
                        style={{ width: `${station.usage}%` }}
                      ></div>
                    </div>
                    <span className="usage-text">{station.usage}%</span>
                  </div>
                </td>
                <td className="revenue">{station.revenue}</td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-icon view" title="Xem chi tiết">
                      👁️
                    </button>
                    <button className="btn-icon edit" title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="btn-icon settings" title="Cài đặt">
                      ⚙️
                    </button>
                    <button className="btn-icon delete" title="Xóa">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button className="page-btn">‹ Trước</button>
        <button className="page-btn active">1</button>
        <button className="page-btn">2</button>
        <button className="page-btn">3</button>
        <button className="page-btn">Sau ›</button>
      </div>

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm trạm sạc mới</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="station-form">
                <div className="form-group">
                  <label>Tên trạm sạc</label>
                  <input type="text" placeholder="Nhập tên trạm sạc" />
                </div>
                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input type="text" placeholder="Nhập địa chỉ đầy đủ" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Công suất (kW)</label>
                    <select>
                      <option value="22">22kW</option>
                      <option value="50">50kW</option>
                      <option value="150">150kW</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Số cổng sạc</label>
                    <input type="number" min="1" max="10" defaultValue="2" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Giá điện (VNĐ/kWh)</label>
                  <input type="number" placeholder="3500" />
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button className="btn-primary">Thêm trạm sạc</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StationManagement;
