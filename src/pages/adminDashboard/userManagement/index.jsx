import { useState } from "react";
import "./index.scss";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Mock user data
  const users = [
    {
      id: 1,
      name: "Nguyễn Văn A",
      email: "nguyenvana@email.com",
      phone: "0901234567",
      joinDate: "2024-01-15",
      status: "active",
      totalUsage: 125,
      totalSpent: 2500000,
      lastSession: "2024-12-20",
      avatar: "👨",
    },
    {
      id: 2,
      name: "Trần Thị B",
      email: "tranthib@email.com",
      phone: "0907654321",
      joinDate: "2024-02-20",
      status: "active",
      totalUsage: 89,
      totalSpent: 1800000,
      lastSession: "2024-12-21",
      avatar: "👩",
    },
    {
      id: 3,
      name: "Lê Văn C",
      email: "levanc@email.com",
      phone: "0903456789",
      joinDate: "2024-03-10",
      status: "suspended",
      totalUsage: 45,
      totalSpent: 950000,
      lastSession: "2024-12-10",
      avatar: "👨",
    },
    {
      id: 4,
      name: "Phạm Thị D",
      email: "phamthid@email.com",
      phone: "0909876543",
      joinDate: "2024-03-25",
      status: "active",
      totalUsage: 67,
      totalSpent: 1400000,
      lastSession: "2024-12-22",
      avatar: "👩",
    },
    {
      id: 5,
      name: "Hoàng Minh E",
      email: "hoangminhe@email.com",
      phone: "0905555666",
      joinDate: "2024-04-10",
      status: "pending",
      totalUsage: 12,
      totalSpent: 300000,
      lastSession: "2024-12-18",
      avatar: "👨",
    },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleViewUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  return (
    <div className="user-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h2>Quản lý người dùng</h2>
          <p>Quản lý tài khoản và hoạt động của người dùng</p>
        </div>
        <button className="btn-primary">
          <span>📊</span> Xuất báo cáo
        </button>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
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
          <option value="suspended">Tạm khóa</option>
          <option value="pending">Chờ xác thực</option>
        </select>
      </div>

      {/* User Statistics */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">50,247</span>
            <span className="stat-label">Tổng người dùng</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">48,956</span>
            <span className="stat-label">Đang hoạt động</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-number">+1,234</span>
            <span className="stat-label">Mới tháng này</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">⭐</div>
          <div className="stat-info">
            <span className="stat-number">4.8/5</span>
            <span className="stat-label">Đánh giá TB</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày tham gia</th>
              <th>Tổng sử dụng</th>
              <th>Chi tiêu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={user.id}>
                <td>#{user.id}</td>
                <td className="user-info">
                  <div className="user-avatar">{user.avatar}</div>
                  <div className="user-details">
                    <span className="user-name">{user.name}</span>
                  </div>
                </td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.joinDate}</td>
                <td>{user.totalUsage} lần</td>
                <td className="revenue">{formatCurrency(user.totalSpent)}</td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === "active" && "🟢 Hoạt động"}
                    {user.status === "suspended" && "🔴 Tạm khóa"}
                    {user.status === "pending" && "🟡 Chờ xác thực"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="btn-icon view"
                      title="Xem chi tiết"
                      onClick={() => handleViewUser(user)}
                    >
                      👁️
                    </button>
                    <button className="btn-icon edit" title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="btn-icon message" title="Gửi tin nhắn">
                      ✉️
                    </button>
                    <button className="btn-icon suspend" title="Khóa/Mở khóa">
                      🔒
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

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết người dùng</h3>
              <button
                className="close-btn"
                onClick={() => setShowUserModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail-content">
                <div className="user-basic-info">
                  <div className="user-avatar-large">{selectedUser.avatar}</div>
                  <div className="user-info-text">
                    <h4>{selectedUser.name}</h4>
                    <p>{selectedUser.email}</p>
                    <p>{selectedUser.phone}</p>
                  </div>
                </div>
                <div className="user-stats-grid">
                  <div className="stat-item">
                    <span className="stat-label">Tổng sử dụng</span>
                    <span className="stat-value">
                      {selectedUser.totalUsage} lần
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Tổng chi tiêu</span>
                    <span className="stat-value">
                      {formatCurrency(selectedUser.totalSpent)}
                    </span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Ngày tham gia</span>
                    <span className="stat-value">{selectedUser.joinDate}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Lần cuối sử dụng</span>
                    <span className="stat-value">
                      {selectedUser.lastSession}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowUserModal(false)}
              >
                Đóng
              </button>
              <button className="btn-primary">Chỉnh sửa thông tin</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
