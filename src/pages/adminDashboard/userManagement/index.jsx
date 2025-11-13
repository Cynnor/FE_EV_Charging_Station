import { useState, useEffect, useMemo } from "react";
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

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // ✅ Lấy thông tin chi tiết user theo ID
  const fetchUserDetail = async (userId) => {
    try {
      const response = await api.get(`/users/detail/${userId}`);
      const userData = response.data.data || response.data;
      return userData;
    } catch (err) {
      console.error("Error fetching user detail:", err);
      alert("Không thể tải thông tin người dùng!");
      return null;
    }
  };

  // PUT - Cập nhật thông tin user
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      // ✅ Use userId from editingUser
      const response = await api.put(
        `/users/detail/${editingUser.userId}`,
        formData
      );

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

  // ✅ Mở modal Edit - Load data từ API detail
  const openEditModal = async (user) => {
    const userData = await fetchUserDetail(user.userId);
    if (userData) {
      setEditingUser(userData);
      setFormData({
        fullName: userData.fullName || "",
        email: userData.email || "",
        phoneNumber: userData.phone || userData.phoneNumber || "",
        address: coerceAddressValue(userData.address),
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

  const openViewModal = async (user) => {
    const userData = await fetchUserDetail(user.userId);
    if (userData) {
      setSelectedUser(userData);
      setShowViewModal(true);
    }
  };

  const closeViewModal = () => {
    setShowViewModal(false);
    setSelectedUser(null);
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

  const heroHighlights = [
    { label: "Tổng người dùng", value: totalUsers },
    { label: "Đang hoạt động", value: activeUsers },
    { label: "Đang vô hiệu", value: disabledUsers },
  ];

  const roleBreakdown = [
    { label: "Admin", value: adminCount },
    { label: "Staff", value: staffCount },
    { label: "User", value: userCount },
  ];

  const statusSummary = [
    { label: "Tài khoản hoạt động", value: activeUsers, tone: "success" },
    { label: "Đã vô hiệu hoá", value: disabledUsers, tone: "danger" },
    { label: "Tổng số tài khoản", value: totalUsers, tone: "primary" },
  ];

  const formatDateDisplay = (value) => {
    if (!value) return "—";
    try {
      return formatDate(value);
    } catch (err) {
      return value;
    }
  };

  const formatAddressDisplay = (value) => {
    if (!value) return "—";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) {
      const parts = value.filter(Boolean).map((item) => formatAddressDisplay(item));
      return parts.length ? parts.join(", ") : "—";
    }
    if (typeof value === "object") {
      const parts = Object.values(value)
        .filter(Boolean)
        .map((item) => (typeof item === "object" ? JSON.stringify(item) : item));
      return parts.length ? parts.join(", ") : "—";
    }
    return String(value);
  };

  const coerceAddressValue = (value) =>
    typeof value === "string" ? value : formatAddressDisplay(value).replace(/^—$/, "");

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

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const items = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) items.push("ellipsis-left");

    for (let page = start; page <= end; page += 1) {
      items.push(page);
    }

    if (end < totalPages - 1) items.push("ellipsis-right");

    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  // Clamp current page
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
    if (currentPage > newTotal) setCurrentPage(newTotal);
  }, [filteredUsers.length, currentPage, pageSize]);

  const getRoleBadge = (role = "") => {
    const normalized = role?.toString().toUpperCase();
    const roleMap = {
      ADMIN: { label: "Admin", tone: "admin" },
      STAFF: { label: "Staff", tone: "staff" },
      USER: { label: "User", tone: "user" },
    };
    return roleMap[normalized] || {
      label: normalized || "Khác",
      tone: "default",
    };
  };

  // ✅ Updated function to return status display
  const getStatusDisplay = (status) => {
    const normalized = status?.toString().toLowerCase();
    switch (normalized) {
      case "active":
      case "enabled":
        return { text: "Hoạt động", tone: "success" };
      case "disabled":
        return { text: "Vô hiệu hoá", tone: "danger" };
      default:
        return { text: status || "Chưa xác định", tone: "default" };
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
      <section className="page-hero">
        <div className="hero-copy">
          <p className="eyebrow">Trung tâm khách hàng</p>
          <h2>Quản lý người dùng</h2>
          <p className="hero-lead">
            Theo dõi sức khỏe hệ thống tài khoản, phân quyền và đảm bảo trải nghiệm
            nhất quán trên toàn bộ nền tảng.
          </p>

          <div className="hero-metrics">
            {heroHighlights.map((item) => (
              <div key={item.label} className="metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-panel">
          <h4>Phân bổ vai trò</h4>
          <div className="role-grid">
            {roleBreakdown.map((role) => (
              <div key={role.label} className="role-card">
                <span>{role.label}</span>
                <strong>{role.value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="filters-card">
        <div className="search-row">
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                d="M11 4a7 7 0 015.61 11.19l3.1 3.1a1 1 0 01-1.42 1.42l-3.1-3.1A7 7 0 1111 4zm0 2a5 5 0 100 10 5 5 0 000-10z"
                fill="currentColor"
              />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setSearchTerm("")}
              >
                Xoá
              </button>
            )}
          </div>

          <button
            type="button"
            className="primary-btn"
            onClick={() => setShowAddModal(true)}
          >
            <span>+</span> Thêm người dùng
          </button>
        </div>

        <div className="filter-row">
          <div className="filter-field">
            <label>Vai trò</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">Tất cả vai trò</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Trạng thái</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="disabled">Vô hiệu hoá</option>
            </select>
          </div>
        </div>

        <div className="snapshot-row">
          {statusSummary.map((item) => (
            <div key={item.label} className={`snapshot-pill ${item.tone}`}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="table-card">
        <div className="table-headline">
          <div>
            <h3>Danh sách người dùng</h3>
            <p>
              Hiển thị {paginatedUsers.length} / {filteredUsers.length} tài khoản phù hợp
              bộ lọc hiện tại
            </p>
          </div>
        </div>

        <div className="table-wrapper">
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
                  const roleDisplay = getRoleBadge(user.role);
                  const initials = (user.fullName || user.username || "?")
                    .charAt(0)
                    .toUpperCase();
                  return (
                    <tr key={user.userId}>
                      <td className="user-cell">
                        <div className="user-stack">
                          <span className="avatar-chip">{initials}</span>
                          <div>
                            <p>{user.username}</p>
                            <span>{user.phone || user.phoneNumber || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td>{user.fullName || "Chưa cập nhật"}</td>
                      <td>{user.email || "—"}</td>
                      <td>
                        <span className={`role-chip role-${roleDisplay.tone}`}>
                          {roleDisplay.label}
                        </span>
                      </td>
                      <td className="status-cell">
                        <span className={`status-pill status-${statusDisplay.tone}`}>
                          {statusDisplay.text}
                        </span>
                      </td>
                      <td>
                        <div className="action-pills">
                          <button
                            type="button"
                            className="pill neutral"
                            onClick={() => openViewModal(user)}
                          >
                            Xem
                          </button>
                          <button
                            type="button"
                            className="pill ghost"
                            onClick={() => openEditModal(user)}
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            type="button"
                            className="pill danger"
                            onClick={() => handleDeleteUser(user.userId)}
                          >
                            Vô hiệu
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="no-data">
                    Không tìm thấy người dùng nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pagination">
        <button
          className="page-btn nav"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          aria-label="Trang trước"
        >
          ‹
        </button>

        {paginationItems.map((item, index) =>
          typeof item === "number" ? (
            <button
              key={item}
              className={`page-btn ${item === currentPage ? "active" : ""}`}
              onClick={() => setCurrentPage(item)}
            >
              {item}
            </button>
          ) : (
            <span key={`${item}-${index}`} className="ellipsis">
              ...
            </span>
          )
        )}

        <button
          className="page-btn nav"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          aria-label="Trang sau"
        >
          ›
        </button>
      </div>

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Thông tin người dùng</h3>
                <p>Toàn bộ dữ liệu hồ sơ và hoạt động gần đây.</p>
              </div>
              <button className="close-btn" onClick={closeViewModal}>
                ✕
              </button>
            </div>
            <div className="modal-body user-detail-modal">
              <div className="detail-grid">
                <div className="detail-item">
                  <span>Họ và tên</span>
                  <strong>{selectedUser.fullName || "Chưa cập nhật"}</strong>
                </div>
                <div className="detail-item">
                  <span>Email</span>
                  <strong>{selectedUser.email || "—"}</strong>
                </div>
                <div className="detail-item">
                  <span>Số điện thoại</span>
                  <strong>{selectedUser.phone || selectedUser.phoneNumber || "—"}</strong>
                </div>
                <div className="detail-item">
                  <span>Vai trò</span>
                  <strong>{getRoleBadge(selectedUser.role).label}</strong>
                </div>
                <div className="detail-item">
                  <span>Trạng thái</span>
                  <strong>{getStatusDisplay(selectedUser.status).text}</strong>
                </div>
                <div className="detail-item">
                  <span>Ngày tạo</span>
                  <strong>{formatDateDisplay(selectedUser.createdAt)}</strong>
                </div>
                <div className="detail-item full-width">
                  <span>Địa chỉ</span>
                  <strong>{formatAddressDisplay(selectedUser.address)}</strong>
                </div>
                <div className="detail-item full-width">
                  <span>Ngày sinh</span>
                  <strong>{formatDateDisplay(selectedUser.dob)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div>
                <h3>Chỉnh sửa thông tin người dùng</h3>
                <p>Cập nhật thông tin hồ sơ và phân quyền cho tài khoản này.</p>
              </div>
              <button className="close-btn" onClick={closeEditModal}>
                ✕
              </button>
            </div>
            <div className="modal-body form-modal">
              <form className="user-form" onSubmit={handleUpdateUser}>
                <div className="modal-section">
                  <p className="section-eyebrow">Thông tin cơ bản</p>
                  <div className="form-row">
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
                  </div>
                  <div className="form-row">
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
                  </div>
                </div>

                <div className="modal-section">
                  <p className="section-eyebrow">Thông tin bổ sung</p>
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
              <div>
                <h3>Thêm người dùng mới</h3>
                <p>Tạo tài khoản truy cập mới với thông tin chi tiết đầy đủ.</p>
              </div>
              <button className="close-btn" onClick={closeAddModal}>
                ✕
              </button>
            </div>
            <div className="modal-body form-modal">
              <form className="user-form" onSubmit={handleAddUser}>
                <div className="modal-section">
                  <p className="section-eyebrow">Thông tin đăng nhập</p>
                  <div className="form-row">
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
                  </div>
                </div>

                <div className="modal-section">
                  <p className="section-eyebrow">Thông tin cá nhân</p>
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
                </div>

                <div className="modal-section">
                  <p className="section-eyebrow">Thông tin bổ sung</p>
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
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeAddModal}
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
