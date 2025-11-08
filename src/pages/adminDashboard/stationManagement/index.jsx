// Import các thư viện cần thiết
import { useState, useEffect, useRef } from "react"; // React hooks để quản lý state và side effects
import "./index.scss"; // File CSS cho component này
import api from "../../../config/api"; // Axios instance đã config để gọi API

const StationManagement = () => {
  // ===== KHỞI TẠO CÁC STATE =====

  // State cho tìm kiếm và bộ lọc
  const [searchTerm, setSearchTerm] = useState(""); // Từ khóa tìm kiếm
  const [statusFilter, setStatusFilter] = useState("all"); // Bộ lọc theo trạng thái (all/active/maintenance/inactive)
  const [locationFilter, setLocationFilter] = useState("all"); // Bộ lọc theo quận/huyện

  // State cho các modal (popup)
  const [showAddModal, setShowAddModal] = useState(false); // Hiển thị modal thêm trạm mới
  const [showEditModal, setShowEditModal] = useState(false); // Hiển thị modal chỉnh sửa trạm
  const [showViewModal, setShowViewModal] = useState(false); // Hiển thị modal xem chi tiết trạm

  // State cho dữ liệu trạm sạc
  const [stations, setStations] = useState([]); // Danh sách tất cả trạm sạc từ API
  const [loading, setLoading] = useState(true); // Trạng thái đang tải dữ liệu
  const [error, setError] = useState(null); // Lưu lỗi nếu có
  const [editingStation, setEditingStation] = useState(null); // Trạm đang được chỉnh sửa
  const [viewStation, setViewStation] = useState(null); // Trạm đang được xem chi tiết

  // State cho phân trang
  const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
  const pageSize = 7; // Số lượng trạm hiển thị mỗi trang

  // Ref để scroll modal về đầu trang
  const modalBodyRef = useRef(null); // Reference đến phần body của modal

  // State chứa dữ liệu form (cho cả thêm mới và chỉnh sửa)
  const [formData, setFormData] = useState({
    name: "", // Tên trạm sạc
    longitude: "", // Kinh độ (vị trí GPS)
    latitude: "", // Vĩ độ (vị trí GPS)
    status: "active", // Trạng thái mặc định là hoạt động
    address: "", // Địa chỉ đầy đủ
    provider: "", // Nhà cung cấp (VinFast, EVOne...)
    ports: [
      // Mảng chứa các trụ sạc (cổng sạc)
      {
        type: "DC", // Loại sạc: AC (chậm), DC (nhanh), Ultra (siêu nhanh)
        status: "available", // Trạng thái: available/in_use/inactive
        powerKw: 120, // Công suất tính bằng kW
        speed: "fast", // Tốc độ sạc: slow/fast/super_fast
        price: 3858, // Giá tiền VNĐ/kWh
      },
    ],
  });

  // Danh sách các quận/huyện ở TP.HCM để lọc
  const hcmDistricts = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Q. Bình Thạnh",
    "Q. Gò Vấp",
    "Q. Phú Nhuận",
    "Q. Tân Bình",
    "P. Tân Phú",
    "Thủ Đức",
    "H. Bình Chánh",
    "H. Cần Giờ",
    "H. Củ Chi",
    "H. Hóc Môn",
    "H. Nhà Bè",
  ];

  // ===== HÀM GỌI API =====

  /**
   * Fetch danh sách tất cả trạm sạc từ API
   * Được gọi khi component mount và sau khi thêm/sửa/xóa
   */
  const fetchStations = async () => {
    try {
      setLoading(true); // Bật trạng thái loading
      const response = await api.get("/stations"); // Gọi API GET /stations

      // Xử lý response từ API (có thể có nhiều format khác nhau)
      let stationsData = [];
      if (response.data.items && Array.isArray(response.data.items)) {
        stationsData = response.data.items; // Format: { items: [...] }
      } else if (Array.isArray(response.data.data)) {
        stationsData = response.data.data; // Format: { data: [...] }
      } else if (Array.isArray(response.data)) {
        stationsData = response.data; // Format: [...]
      }

      setStations(stationsData); // Lưu data vào state
      setError(null); // Clear error nếu thành công
    } catch (err) {
      setError(err.message); // Lưu error message nếu fail
    } finally {
      setLoading(false); // Tắt loading dù thành công hay thất bại
    }
  };

  /**
   * Chuẩn bị dữ liệu ports để gửi lên API
   * @param {Array} ports - Mảng các trụ sạc từ form
   * @returns {Array} - Mảng ports đã format đúng
   */
  const buildPortsPayload = (ports) =>
    ports.map((p) => ({
      ...(p?.id ? { id: p.id } : {}), // Giữ lại ID nếu đang edit (có ID)
      type: p.type, // Loại sạc
      status: p.status, // Trạng thái
      powerKw: Number(p.powerKw) || 0, // Convert sang number
      speed: p.speed, // Tốc độ
      price: Number(p.price) || 0, // Convert sang number
    }));

  /**
   * Xử lý thêm trạm sạc mới
   * @param {Event} e - Submit event
   */
  const handleAddStation = async (e) => {
    e.preventDefault(); // Ngăn form reload trang
    try {
      // Chuẩn bị payload với ports đã format
      const payload = { ...formData, ports: buildPortsPayload(formData.ports) };

      // Gọi API POST để tạo trạm mới
      const response = await api.post("/stations", payload);
      const newStation = response.data.data || response.data; // Lấy data trạm mới

      // Thêm trạm mới vào danh sách hiện tại (optimistic update)
      setStations((prev) => [...prev, newStation]);

      setShowAddModal(false); // Đóng modal
      resetForm(); // Reset form về trạng thái ban đầu
      alert("Thêm trạm sạc thành công!"); // Thông báo thành công
      await fetchStations(); // Fetch lại để sync với server
    } catch (err) {
      // Xử lý lỗi
      const errorMsg = err.response?.data?.message || "Có lỗi xảy ra!";
      alert(`Lỗi: ${errorMsg}`);
    }
  };

  /**
   * Xử lý chỉnh sửa trạm sạc
   * @param {Event} e - Submit event
   */
  const handleEditStation = async (e) => {
    e.preventDefault(); // Ngăn form reload trang
    try {
      // Chuẩn bị payload
      const payload = { ...formData, ports: buildPortsPayload(formData.ports) };

      // Gọi API PUT để update trạm
      const response = await api.put(`/stations/${editingStation.id}`, payload);
      const updatedStation = response.data.data || response.data;

      // Update trạm trong danh sách (optimistic update)
      setStations((prev) =>
        prev.map((s) => (s.id === editingStation.id ? updatedStation : s))
      );

      setShowEditModal(false); // Đóng modal
      setEditingStation(null); // Clear trạm đang edit
      resetForm(); // Reset form
      alert("Cập nhật trạm sạc thành công!");
      await fetchStations(); // Fetch lại để sync
    } catch (err) {
      alert("Có lỗi xảy ra khi cập nhật trạm sạc!");
    }
  };

  /**
   * Xử lý vô hiệu hóa trạm sạc (soft delete)
   * @param {string} stationId - ID của trạm cần xóa
   */
  const handleDeleteStation = async (stationId) => {
    // Confirm trước khi xóa
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa trạm sạc này?"))
      return;

    try {
      // Gọi API PUT để update status thành inactive (không xóa hẳn)
      await api.put(`/stations/${stationId}`, { status: "inactive" });

      // Update status trong danh sách
      setStations((prev) =>
        prev.map((station) =>
          station.id === stationId
            ? { ...station, status: "inactive" }
            : station
        )
      );

      alert("Vô hiệu hóa trạm sạc thành công!");
      await fetchStations(); // Fetch lại để sync
    } catch (err) {
      alert("Có lỗi xảy ra khi vô hiệu hóa trạm sạc!");
    }
  };

  // ===== CÁC HÀM XỬ LÝ FORM =====

  /**
   * Reset form về trạng thái ban đầu
   */
  const resetForm = () => {
    setFormData({
      name: "",
      longitude: "",
      latitude: "",
      status: "active",
      address: "",
      provider: "",
      ports: [
        {
          type: "DC",
          status: "available",
          powerKw: 120,
          speed: "fast",
          price: 3858,
        },
      ],
    });
  };

  /**
   * Đóng modal và reset form
   */
  const closeStationModal = () => {
    // Scroll modal về đầu trang
    if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0;
    resetForm(); // Reset form
    setEditingStation(null); // Clear trạm đang edit
    setShowAddModal(false); // Đóng modal thêm
    setShowEditModal(false); // Đóng modal sửa
  };

  /**
   * Mở modal thêm trạm mới
   */
  const openAddModal = () => {
    resetForm(); // Reset form trước khi mở
    setShowAddModal(true); // Hiển thị modal
  };

  /**
   * Mở modal chỉnh sửa trạm
   * @param {Object} station - Trạm cần chỉnh sửa
   */
  const openEditModal = (station) => {
    setEditingStation(station); // Lưu trạm đang edit

    // Đổ dữ liệu trạm vào form
    setFormData({
      name: station.name || "",
      longitude: station.longitude ?? "",
      latitude: station.latitude ?? "",
      status: station.status || "active",
      address: station.address || "",
      provider: station.provider || "",
      // Copy ports nếu có, nếu không thì tạo 1 port mặc định
      ports:
        Array.isArray(station.ports) && station.ports.length > 0
          ? station.ports.map(({ ...port }) => port) // Clone ports
          : [
              {
                type: "DC",
                status: "available",
                powerKw: 120,
                speed: "fast",
                price: 3858,
              },
            ],
    });

    setShowEditModal(true); // Hiển thị modal
  };

  /**
   * Mở modal xem chi tiết trạm
   * @param {Object} station - Trạm cần xem
   */
  const openViewModal = (station) => {
    setViewStation(station); // Lưu trạm đang xem
    setShowViewModal(true); // Hiển thị modal
  };

  /**
   * Xử lý thay đổi input trong form
   * @param {Event} e - Change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target; // Lấy name và value từ input

    setFormData((prev) => ({
      ...prev, // Giữ nguyên data cũ
      // Update field tương ứng
      [name]:
        name === "longitude" || name === "latitude"
          ? parseFloat(value) || 0 // Convert sang number cho longitude/latitude
          : value, // Giữ nguyên cho các field khác
    }));
  };

  /**
   * Xử lý thay đổi thông tin của 1 port (trụ sạc)
   * @param {number} index - Vị trí của port trong mảng
   * @param {string} field - Tên field cần update
   * @param {any} value - Giá trị mới
   */
  const handlePortChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map(
        (port, i) =>
          i === index // Chỉ update port tại index được chọn
            ? {
                ...port,
                // Update field tương ứng
                [field]:
                  field === "powerKw" || field === "price"
                    ? parseInt(value) || 0 // Convert sang integer
                    : value,
              }
            : port // Giữ nguyên các port khác
      ),
    }));
  };

  /**
   * Thêm 1 port mới vào form
   */
  const addPort = () => {
    setFormData((prev) => ({
      ...prev,
      ports: [
        ...prev.ports, // Giữ nguyên ports cũ
        // Thêm port mới với giá trị mặc định
        {
          type: "DC",
          status: "available",
          powerKw: 120,
          speed: "fast",
          price: 3858,
        },
      ],
    }));
  };

  /**
   * Xóa 1 port khỏi form
   * @param {number} index - Vị trí của port cần xóa
   */
  const removePort = (index) => {
    // Chỉ cho phép xóa nếu còn > 1 port (phải có ít nhất 1 port)
    if (formData.ports.length > 1) {
      setFormData((prev) => ({
        ...prev,
        ports: prev.ports.filter((_, i) => i !== index), // Loại bỏ port tại index
      }));
    }
  };

  /**
   * Lấy icon và text hiển thị cho trạng thái
   * @param {string} status - Trạng thái của trạm
   * @returns {Object} - Object chứa icon và text
   */
  const getStatusDisplay = (status) => {
    const statusMap = {
      active: { icon: "🟢", text: "Hoạt động" },
      maintenance: { icon: "🔧", text: "Bảo trì" },
      inactive: { icon: "🔴", text: "Vô hiệu hóa" },
    };
    return statusMap[status] || { icon: "❓", text: status };
  };

  // ===== EFFECTS (Side effects) =====

  /**
   * Effect: Fetch danh sách trạm khi component mount
   */
  useEffect(() => {
    fetchStations();
  }, []); // Dependency array rỗng = chỉ chạy 1 lần khi mount

  /**
   * Effect: Reset về trang 1 khi thay đổi bộ lọc
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter]); // Chạy khi 1 trong 3 filter thay đổi

  /**
   * Effect: Scroll modal về đầu trang khi mở modal
   */
  useEffect(() => {
    if (
      (showAddModal || showEditModal || showViewModal) && // Nếu có modal đang mở
      modalBodyRef.current
    ) {
      setTimeout(() => {
        if (modalBodyRef.current) modalBodyRef.current.scrollTop = 0; // Scroll về đầu
      }, 100); // Delay 100ms để đảm bảo modal đã render xong
    }
  }, [showAddModal, showEditModal, showViewModal]); // Chạy khi modal open/close

  /**
   * Effect: Khóa scroll của body khi mở modal
   * Tránh scroll cả trang khi modal đang mở
   */
  useEffect(() => {
    // Set overflow = hidden khi có modal mở
    document.body.style.overflow =
      showAddModal || showEditModal || showViewModal ? "hidden" : "unset";

    // Cleanup: Reset lại khi component unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showAddModal, showEditModal, showViewModal]);

  // ===== TÍNH TOÁN DỮ LIỆU HIỂN THỊ =====

  // Đảm bảo stations luôn là array (tránh crash nếu null/undefined)
  const safeStations = Array.isArray(stations) ? stations : [];

  // Tính toán thống kê
  const totalStations = safeStations.length; // Tổng số trạm
  const activeStations = safeStations.filter(
    (s) => s.status === "active"
  ).length; // Số trạm hoạt động
  const maintenanceStations = safeStations.filter(
    (s) => s.status === "maintenance"
  ).length; // Số trạm bảo trì
  const inactiveStations = safeStations.filter(
    (s) => s.status === "inactive"
  ).length; // Số trạm vô hiệu hóa

  /**
   * Lọc danh sách trạm theo các điều kiện
   */
  const filteredStations = safeStations.filter((station) => {
    // Kiểm tra từ khóa tìm kiếm (tên hoặc địa chỉ)
    const matchesSearch =
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address?.toLowerCase().includes(searchTerm.toLowerCase());

    // Kiểm tra bộ lọc trạng thái
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;

    // Kiểm tra bộ lọc địa điểm
    const matchesLocation =
      locationFilter === "all" ||
      station.address?.toLowerCase().includes(locationFilter.toLowerCase());

    // Chỉ giữ lại trạm thỏa mãn TẤT CẢ điều kiện
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Tính toán phân trang
  const totalPages = Math.max(1, Math.ceil(filteredStations.length / pageSize)); // Tổng số trang

  // Lấy danh sách trạm của trang hiện tại
  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * pageSize, // Vị trí bắt đầu
    currentPage * pageSize // Vị trí kết thúc
  );

  /**
   * Effect: Điều chỉnh trang hiện tại nếu vượt quá tổng số trang
   * VD: Đang ở trang 5 nhưng chỉ còn 3 trang sau khi lọc -> chuyển về trang 3
   */
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filteredStations.length / pageSize));
    if (currentPage > newTotal) setCurrentPage(newTotal);
  }, [filteredStations.length, currentPage]);

  // ===== RENDER UI =====

  // Hiển thị loading spinner khi đang tải dữ liệu
  if (loading) {
    return (
      <div className="station-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Đang tải danh sách trạm sạc...</p>
        </div>
      </div>
    );
  }

  // Hiển thị thông báo lỗi nếu có
  if (error) {
    return (
      <div className="station-management">
        <div className="error-container">
          <p>❌ Lỗi: {error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  // Render UI chính
  return (
    <div className="station-management">
      {/* PHẦN BỘ LỌC VÀ TÌM KIẾM */}
      <div className="filters-section">
        {/* Ô tìm kiếm */}
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm trạm sạc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        {/* Nhóm các bộ lọc */}
        <div className="filters-group">
          {/* Lọc theo trạng thái */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-filter"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="maintenance">Bảo trì</option>
            <option value="inactive">Vô hiệu hóa</option>
          </select>

          {/* Lọc theo quận/huyện */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="location-filter"
          >
            <option value="all">Tất cả quận</option>
            {hcmDistricts.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        {/* Nút thêm trạm mới */}
        <button className="btn-primary" onClick={openAddModal}>
          <span>➕</span> Thêm trạm sạc
        </button>
      </div>

      {/* PHẦN THỐNG KÊ */}
      <div className="stats-overview">
        {/* Card tổng số trạm */}
        <div className="stat-mini">
          <div className="stat-icon">⚡</div>
          <div className="stat-info">
            <span className="stat-number">{totalStations}</span>
            <span className="stat-label">Tổng trạm</span>
          </div>
        </div>

        {/* Card trạm hoạt động */}
        <div className="stat-mini">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <span className="stat-number">{activeStations}</span>
            <span className="stat-label">Hoạt động</span>
          </div>
        </div>

        {/* Card trạm bảo trì */}
        <div className="stat-mini">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <span className="stat-number">{maintenanceStations}</span>
            <span className="stat-label">Bảo trì</span>
          </div>
        </div>

        {/* Card trạm vô hiệu hóa */}
        <div className="stat-mini">
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <span className="stat-number">{inactiveStations}</span>
            <span className="stat-label">Vô hiệu hóa</span>
          </div>
        </div>
      </div>

      {/* BẢNG DANH SÁCH TRẠM */}
      <div className="table-container">
        <table className="stations-table">
          {/* Header của bảng */}
          <thead>
            <tr>
              <th>Tên trạm</th>
              <th>Địa điểm</th>
              <th>Trạng thái</th>
              <th>Số trụ</th>
              <th>Thao tác</th>
            </tr>
          </thead>

          {/* Body của bảng */}
          <tbody>
            {paginatedStations.length > 0 ? (
              // Nếu có dữ liệu, render từng dòng
              paginatedStations.map((station) => {
                const statusDisplay = getStatusDisplay(station.status);
                return (
                  <tr key={station.id}>
                    {/* Cột tên trạm */}
                    <td className="station-name">
                      <div className="name-with-icon">
                        <span className="station-icon">⚡</span>
                        {station.name}
                      </div>
                    </td>

                    {/* Cột địa chỉ */}
                    <td>{station.address}</td>

                    {/* Cột trạng thái với badge màu */}
                    <td className="status-cell">
                      <span className={`status-badge ${station.status}`}>
                        <span className="status-icon">
                          {statusDisplay.icon}
                        </span>
                        <span className="status-text">
                          {statusDisplay.text}
                        </span>
                      </span>
                    </td>

                    {/* Cột số lượng trụ */}
                    <td>
                      {station.ports && Array.isArray(station.ports)
                        ? station.ports.length
                        : station.connectors || 0}{" "}
                      trụ
                    </td>

                    {/* Cột các nút thao tác */}
                    <td>
                      <div className="action-buttons">
                        {/* Nút xem chi tiết */}
                        <button
                          className="btn-icon view"
                          title="Xem chi tiết"
                          onClick={() => openViewModal(station)}
                        >
                          👁️
                        </button>

                        {/* Nút chỉnh sửa */}
                        <button
                          className="btn-icon edit"
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(station)}
                        >
                          ✏️
                        </button>

                        {/* Nút vô hiệu hóa */}
                        <button
                          className="btn-icon delete"
                          title="Vô hiệu hóa"
                          onClick={() => handleDeleteStation(station.id)}
                        >
                          🚫
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              // Nếu không có dữ liệu, hiển thị thông báo
              <tr>
                <td colSpan="5" className="no-data">
                  Không tìm thấy trạm sạc nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PHÂN TRANG */}
      <div className="pagination">
        {/* Nút trang trước */}
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          ‹ Trước
        </button>

        {/* Các nút số trang */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button
            key={p}
            className={`page-btn ${p === currentPage ? "active" : ""}`}
            onClick={() => setCurrentPage(p)}
          >
            {p}
          </button>
        ))}

        {/* Nút trang sau */}
        <button
          className="page-btn"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          Sau ›
        </button>
      </div>

      {/* MODAL THÊM/SỬA TRẠM */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={closeStationModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {/* Header modal */}
            <div className="modal-header">
              <h3>
                {editingStation ? "Chỉnh sửa trạm sạc" : "Thêm trạm sạc mới"}
              </h3>
              <button className="close-btn" onClick={closeStationModal}>
                ✕
              </button>
            </div>

            {/* Body modal - phần scroll được */}
            <div className="modal-body" ref={modalBodyRef}>
              <form
                className="station-form"
                onSubmit={editingStation ? handleEditStation : handleAddStation}
              >
                {/* PHẦN THÔNG TIN CƠ BẢN */}
                <div className="basic-info-section">
                  {/* Tên trạm */}
                  <div className="form-group">
                    <label>Tên trạm sạc</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Nhập tên trạm sạc"
                      required
                    />
                  </div>

                  {/* Kinh độ và vĩ độ */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Kinh độ</label>
                      <input
                        type="number"
                        step="0.000001"
                        name="longitude"
                        value={formData.longitude}
                        onChange={handleInputChange}
                        placeholder="106.700981"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Vĩ độ</label>
                      <input
                        type="number"
                        step="0.000001"
                        name="latitude"
                        value={formData.latitude}
                        onChange={handleInputChange}
                        placeholder="10.776889"
                        required
                      />
                    </div>
                  </div>

                  {/* Trạng thái và nhà cung cấp */}
                  <div className="form-row">
                    <div className="form-group">
                      <label>Trạng thái</label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="active">Hoạt động</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="inactive">Vô hiệu hóa</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Nhà cung cấp</label>
                      <input
                        type="text"
                        name="provider"
                        value={formData.provider}
                        onChange={handleInputChange}
                        placeholder="VinFast, EVOne, ..."
                        required
                      />
                    </div>
                  </div>

                  {/* Địa chỉ */}
                  <div className="form-group">
                    <label>Địa chỉ</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Nhập địa chỉ đầy đủ"
                      required
                    />
                  </div>
                </div>

                {/* PHẦN DANH SÁCH TRỤ SẠC */}
                <div className="chargers-section">
                  <div className="section-header">
                    <h3>Trụ sạc</h3>
                  </div>

                  {/* Render từng trụ sạc */}
                  {formData.ports.map((port, index) => (
                    <div key={index} className="charger-item">
                      {/* Header của trụ sạc */}
                      <div className="charger-header">
                        <h4>Trụ sạc {index + 1}</h4>
                        {/* Nút xóa (chỉ hiện nếu có > 1 trụ) */}
                        {formData.ports.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-charger"
                            onClick={() => removePort(index)}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Các field của trụ sạc */}
                      <div className="charger-fields">
                        {/* Loại và trạng thái */}
                        <div className="form-row">
                          <div className="form-group">
                            <label>Loại</label>
                            <select
                              value={port.type}
                              onChange={(e) =>
                                handlePortChange(index, "type", e.target.value)
                              }
                              required
                            >
                              <option value="AC">AC</option>
                              <option value="DC">DC</option>
                              <option value="Ultra">Ultra</option>
                            </select>
                          </div>
                          <div className="form-group">
                            <label>Trạng thái</label>
                            <select
                              value={port.status}
                              onChange={(e) =>
                                handlePortChange(
                                  index,
                                  "status",
                                  e.target.value
                                )
                              }
                              required
                            >
                              <option value="available">Có sẵn</option>
                              <option value="in_use">Đang sử dụng</option>
                              <option value="inactive">Không hoạt động</option>
                            </select>
                          </div>
                        </div>

                        {/* Công suất và tốc độ */}
                        <div className="form-row">
                          <div className="form-group">
                            <label>Công suất (kW)</label>
                            <input
                              type="number"
                              value={port.powerKw}
                              onChange={(e) =>
                                handlePortChange(
                                  index,
                                  "powerKw",
                                  e.target.value
                                )
                              }
                              min="1"
                              max="350"
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Tốc độ</label>
                            <select
                              value={port.speed}
                              onChange={(e) =>
                                handlePortChange(index, "speed", e.target.value)
                              }
                              required
                            >
                              <option value="slow">Chậm</option>
                              <option value="fast">Nhanh</option>
                              <option value="super_fast">Siêu nhanh</option>
                            </select>
                          </div>
                        </div>

                        {/* Giá tiền */}
                        <div className="form-group">
                          <label>Giá tiền (VNĐ/kWh)</label>
                          <input
                            type="number"
                            value={port.price}
                            onChange={(e) =>
                              handlePortChange(index, "price", e.target.value)
                            }
                            min="1000"
                            max="10000"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Nút thêm trụ sạc mới */}
                  <button
                    type="button"
                    className="btn-add-charger"
                    onClick={addPort}
                  >
                    + Thêm trụ sạc
                  </button>
                </div>

                {/* Footer modal - nút Hủy và Submit */}
                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={closeStationModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-submit">
                    {editingStation ? "Cập nhật" : "Tạo mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL XEM CHI TIẾT (chỉ đọc, không chỉnh sửa được) */}
      {showViewModal && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chi tiết trạm sạc</h3>
              <button
                className="close-btn"
                onClick={() => setShowViewModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body" ref={modalBodyRef}>
              <form className="station-form">
                <div className="form-group">
                  <label>Tên trạm sạc</label>
                  <input
                    type="text"
                    value={viewStation?.name || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>Địa chỉ</label>
                  <input
                    type="text"
                    value={viewStation?.address || ""}
                    readOnly
                    disabled
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Kinh độ</label>
                    <input
                      type="number"
                      value={viewStation?.longitude ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                  <div className="form-group">
                    <label>Vĩ độ</label>
                    <input
                      type="number"
                      value={viewStation?.latitude ?? ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Trạng thái</label>
                    <select value={viewStation?.status || ""} disabled>
                      <option value="active">Hoạt động</option>
                      <option value="maintenance">Bảo trì</option>
                      <option value="inactive">Vô hiệu hóa</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Nhà cung cấp</label>
                    <input
                      type="text"
                      value={viewStation?.provider || ""}
                      readOnly
                      disabled
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Số trụ</label>
                  <input
                    type="number"
                    value={
                      Array.isArray(viewStation?.ports)
                        ? viewStation.ports.length
                        : viewStation?.connectors || 0
                    }
                    readOnly
                    disabled
                  />
                </div>

                {Array.isArray(viewStation?.ports) &&
                  viewStation.ports.length > 0 && (
                    <div className="chargers-section">
                      <div className="chargers-header">
                        <label>Danh sách trụ sạc</label>
                      </div>

                      {viewStation.ports.map((port, index) => (
                        <div key={index} className="charger-item">
                          <div className="charger-header">
                            <h4>Trụ sạc {index + 1}</h4>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Loại</label>
                              <select value={port.type} disabled>
                                <option value="AC">AC</option>
                                <option value="DC">DC</option>
                                <option value="Ultra">Ultra</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label>Trạng thái</label>
                              <select value={port.status} disabled>
                                <option value="available">Có sẵn</option>
                                <option value="in_use">Đang sử dụng</option>
                                <option value="inactive">
                                  Không hoạt động
                                </option>
                              </select>
                            </div>
                          </div>

                          <div className="form-row">
                            <div className="form-group">
                              <label>Công suất (kW)</label>
                              <input
                                type="number"
                                value={port.powerKw}
                                readOnly
                                disabled
                              />
                            </div>
                            <div className="form-group">
                              <label>Tốc độ</label>
                              <select value={port.speed} disabled>
                                <option value="slow">Chậm</option>
                                <option value="fast">Nhanh</option>
                                <option value="super_fast">Siêu nhanh</option>
                              </select>
                            </div>
                          </div>

                          <div className="form-group">
                            <label>Giá tiền (VNĐ/kWh)</label>
                            <input
                              type="number"
                              value={port.price}
                              readOnly
                              disabled
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowViewModal(false)}
                  >
                    Đóng
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

export default StationManagement;
