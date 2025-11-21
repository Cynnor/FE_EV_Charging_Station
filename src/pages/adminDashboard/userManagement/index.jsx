import { useState, useEffect, useMemo } from "react"; // Import các hooks React cần thiết
import "./index.scss"; // Import file styles SCSS
import api from "../../../config/api"; // Import cấu hình API để gọi backend
import { formatDate } from "../../../config/yob"; // Import hàm format date từ config

const UserManagement = () => {
  // ==================== STATE QUẢN LÝ SEARCH & FILTER ====================
  const [searchTerm, setSearchTerm] = useState(""); // State lưu từ khóa tìm kiếm
  const [roleFilter, setRoleFilter] = useState("all"); // State lưu bộ lọc theo vai trò (all/admin/staff/user)
  const [statusFilter, setStatusFilter] = useState("all"); // State lưu bộ lọc theo trạng thái (all/active/disabled)

  // ==================== STATE QUẢN LÝ USERS ====================
  const [users, setUsers] = useState([]); // State lưu danh sách người dùng
  const [loading, setLoading] = useState(true); // State theo dõi trạng thái loading khi fetch data
  const [error, setError] = useState(null); // State lưu thông báo lỗi nếu có

  // ==================== STATE QUẢN LÝ MODALS ====================
  const [showViewModal, setShowViewModal] = useState(false); // State điều khiển hiển thị modal xem chi tiết
  const [showEditModal, setShowEditModal] = useState(false); // State điều khiển hiển thị modal chỉnh sửa
  const [showAddModal, setShowAddModal] = useState(false); // State điều khiển hiển thị modal thêm mới
  const [selectedUser, setSelectedUser] = useState(null); // State lưu user được chọn để xem chi tiết
  const [editingUser, setEditingUser] = useState(null); // State lưu user đang được chỉnh sửa

  // ==================== STATE FORM DATA ====================
  const [formData, setFormData] = useState({
    // State lưu dữ liệu form chỉnh sửa user
    fullName: "", // Họ và tên
    email: "", // Email
    phoneNumber: "", // Số điện thoại
    address: "", // Địa chỉ
    role: "USER", // Vai trò mặc định là USER
  });

  const [addFormData, setAddFormData] = useState({
    // State lưu dữ liệu form thêm user mới
    username: "", // Tên đăng nhập
    password: "", // Mật khẩu
    email: "", // Email
    fullName: "", // Họ và tên
    dob: "", // Ngày sinh
    address: "", // Địa chỉ
    numberphone: "", // Số điện thoại
  });

  // ==================== STATE PAGINATION ====================
  const [currentPage, setCurrentPage] = useState(1); // State lưu trang hiện tại
  const pageSize = 10; // Số lượng user hiển thị mỗi trang (constant)

  // ==================== EFFECT SCROLL TO TOP ====================
  useEffect(() => {
    // Effect chạy khi component mount
    window.scrollTo(0, 0); // Cuộn trang về đầu
  }, []); // Empty dependency array - chỉ chạy 1 lần khi mount

  // ==================== HÀM FETCH USERS ====================
  const fetchUsers = async () => {
    // Hàm async lấy danh sách users từ API
    try {
      setLoading(true); // Bật trạng thái loading
      const response = await api.get("/users/get-all"); // Gọi API lấy tất cả users

      console.log("Users response:", response.data); // Log response để debug

      let usersData = []; // Biến tạm lưu dữ liệu users
      if (Array.isArray(response.data)) {
        // Nếu response.data là array
        usersData = response.data; // Lấy trực tiếp
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Nếu response.data.data là array
        usersData = response.data.data; // Lấy từ data.data
      }

      setUsers(usersData); // Cập nhật state users
      setError(null); // Reset lỗi về null
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching users:", err); // Log lỗi ra console
      setError(err.message); // Set error message vào state
    } finally {
      setLoading(false); // Tắt loading trong mọi trường hợp
    }
  };

  // ==================== HÀM FETCH USER DETAIL ====================
  const fetchUserDetail = async (userId) => {
    // Hàm async lấy chi tiết 1 user theo ID
    try {
      const response = await api.get(`/users/detail/${userId}`); // Gọi API lấy detail user
      const userData = response.data.data || response.data; // Lấy data từ response
      return userData; // Trả về user data
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching user detail:", err); // Log lỗi
      alert("Không thể tải thông tin người dùng!"); // Alert thông báo lỗi
      return null; // Trả về null
    }
  };

  // ==================== HÀM UPDATE USER ====================
  const handleUpdateUser = async (e) => {
    // Hàm xử lý cập nhật user
    e.preventDefault(); // Ngăn form submit mặc định reload trang

    try {
      const response = await api.put(
        // Gọi API PUT để update user
        `/users/detail/${editingUser.userId}`, // Endpoint với userId
        formData // Dữ liệu form để update
      );

      console.log("Update response:", response.data); // Log response để debug

      alert("Cập nhật thông tin người dùng thành công!"); // Thông báo thành công
      setShowEditModal(false); // Đóng modal edit
      setEditingUser(null); // Clear user đang edit

      await fetchUsers(); // Fetch lại danh sách users để cập nhật
    } catch (err) {
      // Bắt lỗi
      console.error("Error updating user:", err); // Log lỗi
      alert("Có lỗi xảy ra khi cập nhật thông tin người dùng!"); // Alert lỗi
    }
  };

  // ==================== HÀM ADD USER ====================
  const handleAddUser = async (e) => {
    // Hàm xử lý thêm user mới
    e.preventDefault(); // Ngăn reload trang
    try {
      console.log("Creating new user:", addFormData); // Log data để debug

      const response = await api.post("/users/create", addFormData); // Gọi API POST để tạo user mới

      console.log("Create user response:", response.data); // Log response

      alert("Tạo người dùng mới thành công!"); // Thông báo thành công
      setShowAddModal(false); // Đóng modal add
      resetAddForm(); // Reset form về trạng thái ban đầu

      await fetchUsers(); // Fetch lại danh sách
    } catch (err) {
      // Bắt lỗi
      console.error("Error creating user:", err); // Log lỗi
      if (err.response?.data?.message) {
        // Nếu có message từ server
        alert(`Lỗi: ${err.response.data.message}`); // Alert message cụ thể
      } else {
        alert("Có lỗi xảy ra khi tạo người dùng!"); // Alert message chung
      }
    }
  };

  // ==================== HÀM DELETE USER ====================
  const handleDeleteUser = async (userId) => {
    // Hàm xử lý vô hiệu hóa user (soft delete)
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa người dùng này?")) {
      // Xác nhận trước khi xóa
      return; // Nếu không confirm thì return
    }

    try {
      await api.put(`/users/${userId}`, {
        // Gọi API PUT để update status
        status: "disabled", // Set status thành disabled
      });

      alert("Vô hiệu hóa người dùng thành công!"); // Thông báo thành công

      await fetchUsers(); // Fetch lại danh sách
    } catch (err) {
      // Bắt lỗi
      console.error("Error disabling user:", err); // Log lỗi

      if (err.response?.status === 404) {
        // Nếu lỗi 404
        alert("Người dùng không tồn tại!"); // Alert user không tồn tại
      } else if (err.response?.status === 403) {
        // Nếu lỗi 403
        alert("Bạn không có quyền vô hiệu hóa người dùng này!"); // Alert không có quyền
      } else {
        alert("Có lỗi xảy ra khi vô hiệu hóa người dùng. Vui lòng thử lại!"); // Alert lỗi chung
      }
    }
  };

  // ==================== HÀM RESET FORM ====================
  const resetAddForm = () => {
    // Hàm reset form thêm mới về trạng thái ban đầu
    setAddFormData({
      // Set lại toàn bộ form data về giá trị mặc định
      username: "",
      password: "",
      email: "",
      fullName: "",
      dob: "",
      address: "",
      numberphone: "",
    });
  };

  // ==================== HÀM HANDLE INPUT CHANGE ====================
  const handleAddInputChange = (e) => {
    // Hàm xử lý thay đổi input trong form add
    const { name, value } = e.target; // Lấy name và value từ input
    setAddFormData((prev) => ({
      // Cập nhật state addFormData
      ...prev, // Giữ nguyên các field cũ
      [name]: value, // Cập nhật field được thay đổi
    }));
  };

  // ==================== HÀM MỞ MODAL EDIT ====================
  const openEditModal = async (user) => {
    // Hàm mở modal edit với data từ API
    const userData = await fetchUserDetail(user.userId); // Fetch chi tiết user từ API
    if (userData) {
      // Nếu có data
      setEditingUser(userData); // Set user đang edit
      setFormData({
        // Điền dữ liệu vào form
        fullName: userData.fullName || "", // Họ tên
        email: userData.email || "", // Email
        phoneNumber: userData.phone || userData.phoneNumber || "", // Số điện thoại (có thể là phone hoặc phoneNumber)
        address: coerceAddressValue(userData.address), // Xử lý address
        role: userData.role || "USER", // Vai trò
      });
      setShowEditModal(true); // Mở modal edit
    }
  };

  // ==================== HÀM ĐÓNG MODAL ====================
  const closeEditModal = () => {
    // Hàm đóng modal edit
    setShowEditModal(false); // Set state về false
  };

  const closeAddModal = () => {
    // Hàm đóng modal add
    setShowAddModal(false); // Set state về false
    resetAddForm(); // Reset form về trạng thái ban đầu
  };

  const openViewModal = async (user) => {
    // Hàm mở modal xem chi tiết
    const userData = await fetchUserDetail(user.userId); // Fetch chi tiết user
    if (userData) {
      // Nếu có data
      setSelectedUser(userData); // Set user được chọn
      setShowViewModal(true); // Mở modal view
    }
  };

  const closeViewModal = () => {
    // Hàm đóng modal view
    setShowViewModal(false); // Set state về false
    setSelectedUser(null); // Clear user đã chọn
  };

  // ==================== EFFECT SCROLL MODAL TO TOP ====================
  useEffect(() => {
    // Effect chạy khi modal được mở
    if (showAddModal || showEditModal) {
      // Nếu có modal nào đang mở
      setTimeout(() => {
        // Delay nhỏ để đảm bảo modal đã render
        const modalBody = document.querySelector(".modal-body"); // Lấy element modal body
        if (modalBody) {
          // Nếu tìm thấy
          modalBody.scrollTop = 0; // Cuộn về đầu
        }
      }, 50); // Delay 50ms
    }
  }, [showAddModal, showEditModal]); // Dependencies - chạy lại khi 2 state này thay đổi

  // ==================== HÀM HANDLE INPUT CHANGE ====================
  const handleInputChange = (e) => {
    // Hàm xử lý thay đổi input trong form edit
    const { name, value } = e.target; // Lấy name và value
    setFormData((prev) => ({
      // Cập nhật state formData
      ...prev, // Giữ nguyên các field cũ
      [name]: value, // Cập nhật field được thay đổi
    }));
  };

  // ==================== EFFECT FETCH USERS ====================
  useEffect(() => {
    // Effect chạy khi component mount
    fetchUsers(); // Gọi hàm fetch users
  }, []); // Empty deps - chỉ chạy 1 lần

  // ==================== EFFECT RESET PAGE ====================
  useEffect(() => {
    // Effect reset về trang 1 khi filter thay đổi
    setCurrentPage(1); // Set currentPage về 1
  }, [searchTerm, roleFilter, statusFilter]); // Chạy lại khi 3 filter này thay đổi

  // ==================== TÍNH TOÁN THỐNG KÊ ====================
  const safeUsers = Array.isArray(users) ? users : []; // Đảm bảo users luôn là array
  const totalUsers = safeUsers.length; // Tổng số users
  const adminCount = safeUsers.filter((u) => u.role === "admin").length; // Đếm số admin
  const staffCount = safeUsers.filter((u) => u.role === "staff").length; // Đếm số staff
  const userCount = safeUsers.filter((u) => u.role === "user").length; // Đếm số user
  const activeUsers = safeUsers.filter((u) => u.status !== "disabled").length; // Đếm số user đang hoạt động
  const disabledUsers = safeUsers.filter((u) => u.status === "disabled").length; // Đếm số user bị vô hiệu

  const heroHighlights = [
    // Mảng các thống kê hiển thị ở hero section
    { label: "Tổng người dùng", value: totalUsers }, // Card tổng user
    { label: "Đang hoạt động", value: activeUsers }, // Card user active
    { label: "Đang vô hiệu", value: disabledUsers }, // Card user disabled
  ];

  const roleBreakdown = [
    // Mảng phân bổ theo vai trò
    { label: "Admin", value: adminCount }, // Card admin
    { label: "Staff", value: staffCount }, // Card staff
    { label: "User", value: userCount }, // Card user
  ];

  const statusSummary = [
    // Mảng tóm tắt trạng thái
    { label: "Tài khoản hoạt động", value: activeUsers, tone: "success" }, // Card active với tone success
    { label: "Đã vô hiệu hoá", value: disabledUsers, tone: "danger" }, // Card disabled với tone danger
    { label: "Tổng số tài khoản", value: totalUsers, tone: "primary" }, // Card tổng với tone primary
  ];

  // ==================== HÀM FORMAT DỮ LIỆU ====================
  const formatDateDisplay = (value) => {
    // Hàm format ngày tháng
    if (!value) return "—"; // Nếu không có giá trị thì trả về "—"
    try {
      return formatDate(value); // Gọi hàm formatDate từ config
    } catch (err) {
      // Nếu lỗi
      return value; // Trả về giá trị gốc
    }
  };

  const formatAddressDisplay = (value) => {
    // Hàm format địa chỉ (xử lý nhiều kiểu dữ liệu)
    if (!value) return "—"; // Không có giá trị thì return "—"
    if (typeof value === "string") return value; // Nếu là string thì return luôn
    if (Array.isArray(value)) {
      // Nếu là array
      const parts = value
        .filter(Boolean)
        .map((item) => formatAddressDisplay(item)); // Map qua từng item và format
      return parts.length ? parts.join(", ") : "—"; // Join bằng dấu phẩy hoặc "—" nếu rỗng
    }
    if (typeof value === "object") {
      // Nếu là object
      const parts = Object.values(value) // Lấy tất cả values
        .filter(Boolean) // Lọc bỏ falsy values
        .map((item) =>
          typeof item === "object" ? JSON.stringify(item) : item
        ); // Convert object thành string
      return parts.length ? parts.join(", ") : "—"; // Join hoặc "—"
    }
    return String(value); // Convert sang string
  };

  const coerceAddressValue = (
    value // Hàm chuyển đổi address thành string cho input
  ) =>
    typeof value === "string"
      ? value
      : formatAddressDisplay(value).replace(/^—$/, ""); // Nếu là string thì giữ nguyên, không thì format và remove "—"

  // ==================== FILTER USERS ====================
  const filteredUsers = safeUsers.filter((user) => {
    // Filter users theo search và filter
    const matchesSearch = // Kiểm tra có match search term không
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || // Tìm trong fullName
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || // Tìm trong email
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) || // Tìm trong username
      user.phone?.includes(searchTerm); // Tìm trong phone
    const matchesRole = roleFilter === "all" || user.role === roleFilter; // Kiểm tra filter role
    const matchesStatus = // Kiểm tra filter status
      statusFilter === "all" || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus; // Return true nếu match tất cả
  });

  // ==================== PAGINATION ====================
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize)); // Tính tổng số trang (tối thiểu 1)
  const paginatedUsers = filteredUsers.slice(
    // Lấy users cho trang hiện tại
    (currentPage - 1) * pageSize, // Vị trí bắt đầu
    currentPage * pageSize // Vị trí kết thúc
  );

  const paginationItems = useMemo(() => {
    // Tính toán các item pagination (sử dụng useMemo để tối ưu)
    if (totalPages <= 7) {
      // Nếu tổng số trang <= 7
      return Array.from({ length: totalPages }, (_, index) => index + 1); // Trả về array [1, 2, 3, ..., totalPages]
    }

    const items = [1]; // Luôn có trang 1
    const start = Math.max(2, currentPage - 1); // Vị trí bắt đầu (tối thiểu là 2)
    const end = Math.min(totalPages - 1, currentPage + 1); // Vị trí kết thúc (tối đa là totalPages - 1)

    if (start > 2) items.push("ellipsis-left"); // Nếu có khoảng cách thì thêm ellipsis

    for (let page = start; page <= end; page += 1) {
      // Loop từ start đến end
      items.push(page); // Thêm các trang vào array
    }

    if (end < totalPages - 1) items.push("ellipsis-right"); // Nếu có khoảng cách thì thêm ellipsis

    items.push(totalPages); // Luôn có trang cuối
    return items; // Trả về array các items
  }, [currentPage, totalPages]); // Dependencies

  // ==================== EFFECT CLAMP CURRENT PAGE ====================
  useEffect(() => {
    // Effect đảm bảo currentPage không vượt quá totalPages
    const newTotal = Math.max(1, Math.ceil(filteredUsers.length / pageSize)); // Tính total mới
    if (currentPage > newTotal) setCurrentPage(newTotal); // Nếu currentPage > total thì set về total
  }, [filteredUsers.length, currentPage, pageSize]); // Dependencies

  // ==================== HÀM GET ROLE BADGE ====================
  const getRoleBadge = (role = "") => {
    // Hàm trả về thông tin badge cho role
    const normalized = role?.toString().toUpperCase(); // Chuyển role về uppercase
    const roleMap = {
      // Map role sang object chứa label và tone
      ADMIN: { label: "Admin", tone: "admin" },
      STAFF: { label: "Staff", tone: "staff" },
      USER: { label: "User", tone: "user" },
    };
    return (
      roleMap[normalized] || {
        // Trả về object từ map hoặc default
        label: normalized || "Khác", // Label là role hoặc "Khác"
        tone: "default", // Tone mặc định
      }
    );
  };

  // ==================== HÀM GET STATUS DISPLAY ====================
  const getStatusDisplay = (status) => {
    // Hàm trả về thông tin hiển thị cho status
    const normalized = status?.toString().toLowerCase(); // Chuyển status về lowercase
    switch (
      normalized // Switch case theo status
    ) {
      case "active": // Nếu là active
      case "enabled": // Hoặc enabled
        return { text: "Hoạt động", tone: "success" }; // Trả về text và tone success
      case "disabled": // Nếu là disabled
        return { text: "Vô hiệu hoá", tone: "danger" }; // Trả về text và tone danger
      default: // Các trường hợp khác
        return { text: status || "Chưa xác định", tone: "default" }; // Trả về status gốc hoặc "Chưa xác định"
    }
  };

  // ==================== RENDER LOADING STATE ====================
  if (loading) {
    // Nếu đang loading
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  // ==================== RENDER ERROR STATE ====================
  if (error) {
    // Nếu có lỗi
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
            Theo dõi sức khỏe hệ thống tài khoản, phân quyền và đảm bảo trải
            nghiệm nhất quán trên toàn bộ nền tảng.
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
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
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
              Hiển thị {paginatedUsers.length} / {filteredUsers.length} tài
              khoản phù hợp bộ lọc hiện tại
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
                        <span
                          className={`status-pill status-${statusDisplay.tone}`}
                        >
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
          <div
            className="modal modal-large"
            onClick={(e) => e.stopPropagation()}
          >
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
                  <strong>
                    {selectedUser.phone || selectedUser.phoneNumber || "—"}
                  </strong>
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
