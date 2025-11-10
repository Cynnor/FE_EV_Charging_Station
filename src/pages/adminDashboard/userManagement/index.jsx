import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../../config/api";
import { formatDate } from "../../../config/yob";

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ New status filter
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

  // ✅ GET - Lấy thông tin user theo ID để edit
  const fetchUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      const userData = response.data.data || response.data;
      return userData;
    } catch (err) {
      console.error("Error fetching user by ID:", err);
      alert("Không thể tải thông tin người dùng!");
      return null;
    }
  };

  // PUT - Cập nhật thông tin user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // ✅ Use userId from editingUser
      const response = await api.put(`/users/${editingUser.userId}`, formData);

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

  // DELETE - Vô hiệu hóa người dùng bằng cách cập nhật status thành disabled
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) {
      return;
    }

    try {
      await api.put(`/users/${userId}`, {
        status: "disabled",
      });

      alert("Vô hiệu hóa người dùng thành công!");

      // Refresh lại danh sách
      await fetchUsers();
    } catch (err) {
      console.error("Error disabling user:", err);

      if (err.response?.status === 404) {
        alert("Người dùng không tồn tại!");
      } else if (err.response?.status === 403) {
        alert("Bạn không có quyền vô hiệu hóa người dùng này!");
      } else {
        alert("Có lỗi xảy ra khi vô hiệu hóa người dùng. Vui lòng thử lại!");
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

  // ✅ Mở modal Edit - Load data from API theo userId
  const openEditModal = async (user) => {
    const userData = await fetchUserById(user.userId);
    if (userData) {
      setEditingUser(userData);
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        phoneNumber: userData.phone || userData.phoneNumber || "",
        address: userData.address || "",
        role: userData.role || "USER",
      });
      setShowEditModal(true);
    }
  };

  // Close modal functions - Prevent data reset for edit modal
  const closeEditModal = () => {
    setShowEditModal(false);
    // Keep formData as is for edit modal
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    resetAddForm(); // Reset for add modal
  };

  // ✅ Scroll modal to top when opened
  useEffect(() => {
    if (showAddModal || showEditModal) {
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        const modalBody = document.querySelector(".modal-body");
        if (modalBody) {
          modalBody.scrollTop = 0;
        }
      }, 50);
    }
  }, [showAddModal, showEditModal]);

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
  }, [searchTerm, roleFilter, statusFilter]); // ✅ Added statusFilter

  // Tính toán thống kê - cập nhật để bao gồm status
  const safeUsers = Array.isArray(users) ? users : [];
  const totalUsers = safeUsers.length;
  const adminCount = safeUsers.filter((u) => u.role === "admin").length;
  const staffCount = safeUsers.filter((u) => u.role === "staff").length;
  const userCount = safeUsers.filter((u) => u.role === "user").length;
  const activeUsers = safeUsers.filter((u) => u.status !== "disabled").length;
  const disabledUsers = safeUsers.filter((u) => u.status === "disabled").length;

  // Filter users - Updated role values
  const filteredUsers = safeUsers.filter((user) => {
    const matchesSearch =
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
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

  // ✅ Updated function to return status display
  const getStatusDisplay = (status) => {
    switch (status) {
      case "active":
      case "enabled":
        return { icon: "🟢", text: "Hoạt động" };
      case "disabled":
        return { icon: "🔴", text: "Vô hiệu hóa" };
      default:
        return { icon: "❓", text: status || "Chưa xác định" };
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
      {/* Filters - Updated role options */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filters-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="role-filter"
          >
            <option value="all">Tất cả vai trò</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="staff">Staff</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="disabled">Vô hiệu hóa</option>
          </select>
        </div>
        <button
          className="btn-primary full-width"
          onClick={() => setShowAddModal(true)}
        >
          <span>➕</span> Thêm người dùng
        </button>
      </div>

      {/* Statistics - Updated role counts */}
      <div className="stats-overview">
        <div className="stat-mini">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <span className="stat-number">{totalUsers}</span>
            <span className="stat-label">Tổng người dùng</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">{activeUsers}</span>
            <span className="stat-label">Hoạt động</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <span className="stat-number">{disabledUsers}</span>
            <span className="stat-label">Vô hiệu hóa</span>
          </div>
        </div>
        <div className="stat-mini">
          <div className="stat-icon">👑</div>
          <div className="stat-info">
            <span className="stat-number">{adminCount}</span>
            <span className="stat-label">Admin</span>
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
              <th>Vai trò</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => {
                const statusDisplay = getStatusDisplay(user.status);
                return (
                  <tr key={user.userId}>
                    <td className="user-info">
                      <div className="user-details">
                        <span className="user-name">{user.username}</span>
                      </div>
                    </td>
                    <td>{user.fullName}</td>
                    <td>{user.email}</td>
                    <td>
                      <span
                        className={`role-badge ${user.role?.toLowerCase()}`}
                      >
                        {getRoleBadge(user.role)}
                      </span>
                    </td>
                    <td className="status-cell">
                      <span
                        className={`status-badge ${
                          user.status === "disabled" ? "disabled" : "active"
                        }`}
                      >
                        <span className="status-icon">
                          {statusDisplay.icon}
                        </span>
                        <span className="status-text">
                          {statusDisplay.text}
                        </span>
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon edit"
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(user)}
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-icon delete"
                          title="Vô hiệu hóa"
                          onClick={() => handleDeleteUser(user.userId)}
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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

      {/* Edit User Modal - ✅ Fixed scroll issue */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="modal-header">
              <h3>Chỉnh sửa thông tin người dùng</h3>
              <button className="close-btn" onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ overflowY: "auto", flex: 1 }}>
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
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeEditModal}
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

      {/* Add User Modal - ✅ Fixed scroll issue */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm người dùng mới</h3>
              <button className="close-btn" onClick={closeAddModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form className="user-form" onSubmit={handleAddUser}>
                <p className="info-message">
                  💡 Vui lòng điền đầy đủ thông tin bên dưới. Role sẽ tự động
                  được set thành <strong>USER</strong>
                </p>
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
                <div className="form-row">
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
                </div>
                <div className="form-row">
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
                    <label>Số điện thoại</label>
                    <input
                      type="tel"
                      name="numberphone"
                      value={addFormData.numberphone}
                      onChange={handleAddInputChange}
                      placeholder="+84901234567"
                    />
                  </div>
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
              </form>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={closeAddModal}
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn-primary"
                onClick={handleAddUser}
              >
                Tạo người dùng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
