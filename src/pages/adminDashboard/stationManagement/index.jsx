// Import các thư viện cần thiết
import { useState, useEffect, useRef, useMemo } from "react"; // React hooks để quản lý state và side effects
import "./index.scss"; // File CSS cho component này
import api from "../../../config/api"; // Axios instance đã config để gọi API

// Chuẩn hoá text để so sánh không phân biệt dấu/hoa thường
const normalizeText = (value = "") =>
  value
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

// Tính tổng số cổng sạc cho mỗi trạm dù dữ liệu trả về khác nhau
const resolvePortCount = (station = {}) => {
  if (!station || typeof station !== "object") return 0;
  if (Array.isArray(station.ports)) return station.ports.length;
  if (Array.isArray(station.chargers)) return station.chargers.length;
  if (typeof station.ports === "number") return station.ports;
  if (typeof station.portCount === "number") return station.portCount;
  if (typeof station.totalPorts === "number") return station.totalPorts;
  if (station.ports && typeof station.ports === "object") {
    return Object.keys(station.ports).length;
  }
  return 0;
};

// Lấy khu vực chính từ địa chỉ (ví dụ Quận/huyện)
const extractCoverageKey = (address = "") => {
  if (!address) return "";
  const [district] = address.split(",");
  return district?.trim() || address.trim();
};

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

  // Reset phân trang mỗi khi bộ lọc thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter]);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Danh sách khu vực cố định tại TP. Hồ Chí Minh
  const hcmDistricts = [
    "Quận 1",
    "Quận 2",
    "Quận 3",
    "Quận 4",
    "Quận 5",
    "Quận 6",
    "Quận 7",
    "Quận 8",
    "Quận 9",
    "Quận 10",
    "Quận 11",
    "Quận 12",
    "Quận Bình Thạnh",
    "Quận Gò Vấp",
    "Quận Phú Nhuận",
    "Quận Tân Bình",
    "Quận Tân Phú",
    "Thành phố Thủ Đức",
    "Huyện Bình Chánh",
    "Huyện Cần Giờ",
    "Huyện Củ Chi",
    "Huyện Hóc Môn",
    "Huyện Nhà Bè",
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

  const handleClearSearch = () => {
    setSearchTerm("");
    setCurrentPage(1);
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
      active: { text: "Hoạt động", tone: "success" },
      maintenance: { text: "Bảo trì", tone: "warning" },
      inactive: { text: "Vô hiệu hóa", tone: "danger" },
    };
    return statusMap[status] || {
      text: status || "Không xác định",
      tone: "default",
    };
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

  // Cổng sạc & vùng phủ
  const totalPorts = useMemo(
    () => safeStations.reduce((sum, station) => sum + resolvePortCount(station), 0),
    [safeStations]
  );
  const averagePorts =
    totalStations > 0 ? (totalPorts / totalStations).toFixed(1) : 0;

  const coverageCount = useMemo(() => {
    const coverage = new Set();
    safeStations.forEach((station) => {
      const key = extractCoverageKey(station.address);
      if (key) coverage.add(normalizeText(key));
    });
    return coverage.size;
  }, [safeStations]);

  const providerLeaders = useMemo(() => {
    const providerCounter = safeStations.reduce((acc, station) => {
      const providerName = station.provider?.trim();
      if (!providerName) return acc;
      acc[providerName] = (acc[providerName] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(providerCounter)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [safeStations]);

  const uptimeRate =
    totalStations > 0 ? Math.round((activeStations / totalStations) * 100) : 0;
  const attentionStations = maintenanceStations + inactiveStations;
  const uptimeDegree = Math.min(100, Math.max(0, uptimeRate)) * 3.6;
  const uptimeChartStyle = {
    background: `conic-gradient(#12b76a ${uptimeDegree}deg, rgba(255, 255, 255, 0.08) 0)`,
  };

  const inlineStats = [
    { icon: "⚡", label: "Tổng trạm", value: totalStations },
    { icon: "🟢", label: "Hoạt động", value: activeStations },
    { icon: "🔧", label: "Bảo trì", value: maintenanceStations },
    { icon: "🔴", label: "Vô hiệu hoá", value: inactiveStations },
  ];

  const normalizedSearchTerm = normalizeText(searchTerm);
  const normalizedLocationFilter =
    locationFilter === "all" ? "" : normalizeText(locationFilter);

  /**
   * Lọc danh sách trạm theo các điều kiện
   */
  const filteredStations = safeStations.filter((station) => {
    const searchTarget = `${station.name || ""} ${station.address || ""} ${
      station.provider || ""
    } ${station.status || ""}`;

    // Kiểm tra từ khóa tìm kiếm theo dạng bỏ dấu
    const matchesSearch =
      !normalizedSearchTerm ||
      normalizeText(searchTarget).includes(normalizedSearchTerm);

    // Kiểm tra bộ lọc trạng thái
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;

    // Kiểm tra bộ lọc địa điểm (cũng bỏ dấu)
    const matchesLocation =
      locationFilter === "all" ||
      normalizeText(station.address || "").includes(normalizedLocationFilter);

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
      <section className="page-hero">
        <div className="hero-copy">
          <p className="eyebrow">Trung tâm vận hành</p>
          <h2>Quản lý trạm sạc</h2>
          <p className="hero-description">
            Theo dõi trạng thái mạng lưới, lập kế hoạch bảo trì và triển khai trạm
            mới trên cùng một bảng điều khiển.
          </p>

          <div className="hero-actions">
            <button type="button" className="cta-button" onClick={openAddModal}>
              <span>+</span> Thêm trạm mới
            </button>
            <button
              type="button"
              className="ghost-button"
              onClick={() => fetchStations()}
            >
              Làm mới dữ liệu
            </button>
          </div>

          <div className="hero-metrics">
            <div className="metric">
              <span>Trạm hiện có</span>
              <strong>{totalStations}</strong>
            </div>
            <div className="metric">
              <span>Vùng phủ</span>
              <strong>{coverageCount || 0}</strong>
            </div>
            <div className="metric">
              <span>Cổng sạc/trạm</span>
              <strong>{averagePorts}</strong>
            </div>
          </div>
        </div>

        <div className="hero-visual">
          <div className="radial-chart" style={uptimeChartStyle}>
            <div className="chart-center">
              <strong>{uptimeRate}%</strong>
              <span>Uptime</span>
            </div>
          </div>
          <p className="chart-caption">
            {attentionStations} trạm cần xử lý
          </p>

          <div className="provider-leaderboard">
            <p>Nhà cung cấp dẫn đầu</p>
            {providerLeaders.length > 0 ? (
              <ul>
                {providerLeaders.map(([provider, count]) => (
                  <li key={provider}>
                    <span>{provider}</span>
                    <span>{count} trạm</span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="empty-provider">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
      </section>

      {/* PHẦN BỘ LỌC VÀ TÌM KIẾM */}
      <div className="filters-section">
        <div className="filters-top">
          <form className="search-box" onSubmit={(e) => e.preventDefault()}>
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
                placeholder="Tìm kiếm trạm sạc theo tên, địa chỉ hoặc nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={handleClearSearch}
                >
                  Xoá
                </button>
              )}
            </div>
          </form>

          <div className="inline-stats">
            {inlineStats.map((item) => (
              <div key={item.label} className="stat-pill">
                <span className="pill-icon">{item.icon}</span>
                <div>
                  <p>{item.label}</p>
                  <strong>{item.value}</strong>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="filters-row">
          <div className="filter-field">
            <label>Trạng thái</label>
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
          </div>

          <div className="filter-field">
            <label>Khu vực</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="location-filter"
            >
              <option value="all">Tất cả khu vực</option>
              {hcmDistricts.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filter-actions">
          <button type="button" className="btn-primary" onClick={openAddModal}>
            <span>+</span> Thêm trạm
          </button>
        </div>
      </div>

      {/* BẢNG DANH SÁCH TRẠM */}
      <div className="table-card">
        <div className="table-headline">
          <div>
            <h3>Danh sách trạm</h3>
            <p>
              Hiển thị {paginatedStations.length} / {filteredStations.length} trạm
              đáp ứng tiêu chí hiện tại
            </p>
          </div>
        </div>
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
                      <span
                        className={`status-badge status-${statusDisplay.tone}`}
                      >
                        <span className="status-dot" aria-hidden="true"></span>
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
                        <button
                          className="btn-pill neutral"
                          type="button"
                          title="Xem chi tiết"
                          onClick={() => openViewModal(station)}
                        >
                          Xem
                        </button>
                        <button
                          className="btn-pill warning"
                          type="button"
                          title="Chỉnh sửa"
                          onClick={() => openEditModal(station)}
                        >
                          Sửa
                        </button>
                        <button
                          className="btn-pill danger"
                          type="button"
                          title="Vô hiệu hóa"
                          onClick={() => handleDeleteStation(station.id)}
                        >
                          Vô hiệu
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
      </div>

      {/* PHÂN TRANG */}
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
                <section className="form-panel primary-panel">
                  <div className="panel-heading">
                    <p className="panel-eyebrow">Thông tin chung</p>
                  </div>

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
                </section>

                <section className="form-panel ports-panel">
                  <div className="panel-heading">
                    <p className="panel-eyebrow">Trụ sạc</p>
                    <button
                      type="button"
                      className="btn-add-port"
                      onClick={addPort}
                    >
                      + Thêm trụ sạc
                    </button>
                  </div>

                  <div className="ports-wrapper">
                    {formData.ports.map((port, index) => (
                      <div key={index} className="charger-card">
                        <div className="charger-header">
                          <div>
                            <p>Trụ sạc {index + 1}</p>
                            <span>Tùy chỉnh loại và giá</span>
                          </div>
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

                        <div className="port-grid">
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
                                handlePortChange(index, "status", e.target.value)
                              }
                              required
                            >
                              <option value="available">Có sẵn</option>
                              <option value="in_use">Đang sử dụng</option>
                              <option value="inactive">Không hoạt động</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>Công suất (kW)</label>
                            <input
                              type="number"
                              value={port.powerKw}
                              onChange={(e) =>
                                handlePortChange(index, "powerKw", e.target.value)
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

                          <div className="form-group full-width">
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
                  </div>
                </section>

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
