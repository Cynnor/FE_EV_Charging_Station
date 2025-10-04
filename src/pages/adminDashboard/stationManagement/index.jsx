import { useState } from "react";
import "./index.scss";

const StationManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);

  const stations = [
    {
      id: 1,
      name: "Vincom Đồng Khởi",
      location: "Quận 1",
      status: "active",
      connectors: 4,
    },
    {
      id: 2,
      name: "Landmark 81",
      location: "Bình Thạnh",
      status: "maintenance",
      connectors: 6,
    },
    {
      id: 3,
      name: "Crescent Mall",
      location: "Quận 7",
      status: "active",
      connectors: 2,
    },
    {
      id: 4,
      name: "AEON Bình Tân",
      location: "Bình Tân",
      status: "active",
      connectors: 3,
    },
    {
      id: 5,
      name: "GIGAMALL",
      location: "Thủ Đức",
      status: "offline",
      connectors: 4,
    },
    {
      id: 6,
      name: "AEON Tân Phú",
      location: "Tân Phú",
      status: "active",
      connectors: 2,
    },
    {
      id: 7,
      name: "Pearl Plaza",
      location: "Bình Thạnh",
      status: "maintenance",
      connectors: 3,
    },
  ];

  // Tính toán thống kê từ data
  const totalStations = stations.length;
  const activeStations = stations.filter((s) => s.status === "active").length;
  const maintenanceStations = stations.filter(
    (s) => s.status === "maintenance"
  ).length;
  const offlineStations = stations.filter((s) => s.status === "offline").length;
  // const efficiency = Math.round((activeStations / totalStations) * 100);

  // Lấy danh sách quận từ data
  const districts = [
    ...new Set(stations.map((station) => station.location)),
  ].sort();

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    const matchesLocation =
      locationFilter === "all" || station.location === locationFilter;
    return matchesSearch && matchesStatus && matchesLocation;
  });

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "🟢 Hoạt động";
      case "maintenance":
        return "🔧 Bảo trì";
      case "offline":
        return "🔴 Offline";
      default:
        return status;
    }
  };

  return (
    <div className="station-management">
      {/* Filters Section */}
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
        <div className="filters-group">
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
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="location-filter"
          >
            <option value="all">Tất cả quận</option>
            {districts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowAddModal(true)}>
          <span>➕</span> Thêm trạm sạc
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-number">{totalStations}</span>
            <span className="stat-label">Tổng trạm</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">{activeStations}</span>
            <span className="stat-label">Hoạt động</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <span className="stat-number">{maintenanceStations}</span>
            <span className="stat-label">Bảo trì</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">⏸️</div>
          <div className="stat-info">
            <span className="stat-number">{offlineStations}</span>
            <span className="stat-label">Tạm ngưng</span>
          </div>
        </div>
      </div>

      {/* Stations Table */}
      <div className="table-container">
        <table className="stations-table">
          <thead>
            <tr>
              <th>Tên trạm</th>
              <th>Địa điểm</th>
              <th>Trạng thái</th>
              <th>Số cổng</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStations.map((station) => (
              <tr key={station.id}>
                <td className="station-name">
                  <div className="name-with-icon">
                    <span className="station-icon">⚡</span>
                    {station.name}
                  </div>
                </td>
                <td>{station.location}</td>
                <td>
                  <span className={`status-badge ${station.status}`}>
                    {getStatusText(station.status)}
                  </span>
                </td>
                <td>{station.connectors} cổng</td>
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
                    <label>Quận/Huyện</label>
                    <select>
                      <option value="">Chọn quận/huyện</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
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
