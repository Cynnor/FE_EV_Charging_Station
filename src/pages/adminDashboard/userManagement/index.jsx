import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../../config/api";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    address: "",
    role: "USER",
  });
  const [addFormData, setAddFormData] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    dob: "",
    address: "",
    numberphone: "",
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // GET - Lấy danh sách tất cả users (admin only)
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/users/get-all");

      console.log("Users response:", response.data);

      let usersData = [];
      if (Array.isArray(response.data)) {
        usersData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        usersData = response.data.data;
      }

      setUsers(usersData);
      setError(null);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // GET - Xem thông tin user cụ thể
  const fetchUserProfile = async (userId) => {
    try {
      const response = await api.get(`/users/profile`);
      const userData = response.data.data || response.data;
      setSelectedUser(userData);
      setShowViewModal(true);
    } catch (err) {
      console.error("Error fetching user profile:", err);
      alert("Không thể tải thông tin người dùng!");
    }
  };

  // PUT - Cập nhật thông tin user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put("/users/profile", formData);

      console.log("Update response:", response.data);

      alert("Cập nhật thông tin người dùng thành công!");
      setShowEditModal(false);
      setEditingUser(null);

      // Refresh lại danh sách
      await fetchUsers();
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Có lỗi xảy ra khi cập nhật thông tin người dùng!");
    }
  };

  // POST - Tạo người dùng mới
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      console.log("Creating new user:", addFormData);

      const response = await api.post("/users/create", addFormData);

      console.log("Create user response:", response.data);

      alert("Tạo người dùng mới thành công!");
      setShowAddModal(false);
      resetAddForm();

      // Refresh lại danh sách
      await fetchUsers();
    } catch (err) {
      console.error("Error creating user:", err);
      if (err.response?.data?.message) {
        alert(`Lỗi: ${err.response.data.message}`);
      } else {
        alert("Có lỗi xảy ra khi tạo người dùng!");
      }
    }
  };

  // Reset form thêm mới
  const resetAddForm = () => {
    setAddFormData({
      username: "",
      password: "",
      email: "",
      fullName: "",
      dob: "",
      address: "",
      numberphone: "",
    });
  };

  // Handle input change cho form thêm mới
  const handleAddInputChange = (e) => {
    const { name, value } = e.target;
    setAddFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Mở modal Edit
  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
      address: user.address || "",
      role: user.role || "USER",
    });
    setShowEditModal(true);
  };

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  // Tính toán thống kê
  const safeUsers = Array.isArray(users) ? users : [];
  const totalUsers = safeUsers.length;
  const adminCount = safeUsers.filter((u) => u.role === "ADMIN").length;
  const staffCount = safeUsers.filter((u) => u.role === "STAFF").length;
  const userCount = safeUsers.filter((u) => u.role === "USER").length;

  // Filter users
  const filteredUsers = safeUsers.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phoneNumber?.includes(searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Clamp current page
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    if (currentPage > newTotal) setCurrentPage(newTotal);
  }, [filteredUsers.length, currentPage, pageSize]);

  const getRoleBadge = (role) => {
    switch (role) {
      case "ADMIN":
        return "👑 Admin";
      case "STAFF":
        return "👔 Staff";
      case "USER":
        return "👤 User";
      default:
        return role;
    }
  };

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-management">
        <div className="error-container">
          <p>❌ Lỗi: {error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm người dùng (tên, email, SĐT)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="USER">User</option>
          </select>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>
            <span>➕</span> Thêm người dùng
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{totalUsers}</span>
            <span className="stat-label">Tổng người dùng</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <span className="stat-number">{adminCount}</span>
            <span className="stat-label">Admin</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">👔</div>
          <div className="stat-info">
            <span className="stat-number">{staffCount}</span>
            <span className="stat-label">Staff</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">👤</div>
          <div className="stat-info">
            <span className="stat-number">{userCount}</span>
            <span className="stat-label">User</span>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Họ và tên</th>
              <th>Email</th>
              <th>Ngày sinh</th>
              <th>Số điện thoại</th>
              <th>Địa chỉ</th>
              <th>Vai trò</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr key={user.id}>
                  <td className="user-info">
                    <div className="user-details">
                      <span className="user-name">{user.username}</span>
                    </div>
                  </td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.dob || "N/A"}</td>
                  <td>{user.numberphone || "N/A"}</td>
                  <td>{user.address || "N/A"}</td>
                  <td>
                    <span className={`role-badge ${user.role?.toLowerCase()}`}>
                      {getRoleBadge(user.role)}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon view"
                        title="Xem chi tiết"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowViewModal(true);
                        }}
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon edit"
                        title="Chỉnh sửa"
                        onClick={() => openEditModal(user)}
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-data">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ‹ Trước
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}

        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Sau ›
        </button>
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết người dùng</h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="user-detail-content">
                <div className="detail-group">
                  <label>ID:</label>
                  <span>#{selectedUser.id}</span>
                </div>
                <div className="detail-group">
                  <label>Username:</label>
                  <span>{selectedUser.username}</span>
                </div>
                <div className="detail-group">
                  <label>Họ và tên:</label>
                  <span>{selectedUser.fullName}</span>
                </div>
                <div className="detail-group">
                  <label>Email:</label>
                  <span>{selectedUser.email}</span>
                </div>
                <div className="detail-group">
                  <label>Ngày sinh:</label>
                  <span>{selectedUser.dob || "Chưa cập nhật"}</span>
                </div>
                <div className="detail-group">
                  <label>Số điện thoại:</label>
                  <span>{selectedUser.numberphone || "Chưa cập nhật"}</span>
                </div>
                <div className="detail-group">
                  <label>Địa chỉ:</label>
                  <span>{selectedUser.address || "Chưa cập nhật"}</span>
                </div>
                <div className="detail-group">
                  <label>Vai trò:</label>
                  <span
                    className={`role-badge ${selectedUser.role?.toLowerCase()}`}
                  >
                    {getRoleBadge(selectedUser.role)}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowViewModal(false)}
              >
                Đóng
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowViewModal(false);
                  openEditModal(selectedUser);
                }}
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chỉnh sửa thông tin người dùng</h3>
              <button
                className="close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleUpdateUser}>
                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Nhập email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="form-group">
                  <label>Vai trò *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="USER">User</option>
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Cập nhật
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm người dùng mới</h3>
              <button
                className="close-btn"
                onClick={() => setShowAddModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleAddUser}>
                <div className="form-group">
                  <label>Username *</label>
                  <input
                    type="text"
                    name="username"
                    value={addFormData.username}
                    onChange={handleAddInputChange}
                    placeholder="Nhập username"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={addFormData.password}
                    onChange={handleAddInputChange}
                    placeholder="Nhập password"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={addFormData.email}
                    onChange={handleAddInputChange}
                    placeholder="Nhập email"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Họ và tên *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={addFormData.fullName}
                    onChange={handleAddInputChange}
                    placeholder="Nhập họ và tên"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Ngày sinh</label>
                  <input
                    type="date"
                    name="dob"
                    value={addFormData.dob}
                    onChange={handleAddInputChange}
                    placeholder="YYYY-MM-DD"
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    name="address"
                    value={addFormData.address}
                    onChange={handleAddInputChange}
                    placeholder="Nhập địa chỉ"
                  />
                </div>

                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="numberphone"
                    value={addFormData.numberphone}
                    onChange={handleAddInputChange}
                    placeholder="+84901234567"
                  />
                </div>

                <p className="info-message">
                  💡 Role sẽ tự động được set thành <strong>USER</strong>
                </p>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      resetAddForm();
                    }}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Tạo người dùng
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
