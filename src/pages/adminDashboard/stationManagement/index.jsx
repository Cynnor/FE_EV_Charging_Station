import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../../config/api";

const StationManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
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
        newSlots: [], // Slots mới chưa lưu (chỉ tồn tại local)
      },
    ],
  });

  // State riêng cho việc quản lý slots
  const [portSlots, setPortSlots] = useState({}); // { portId: [slots] }
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [selectedPort, setSelectedPort] = useState(null);
  const [newSlot, setNewSlot] = useState({
    slotNumber: 1,
    status: "available",
  });

  // Thêm state cho modal xem chi tiết
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewStation, setViewStation] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  // GET - Lấy danh sách trạm sạc
  const fetchStations = async () => {
    try {
      setLoading(true);
      const response = await api.get("/stations");
      // Xử lý nhiều cấu trúc response khác nhau
      let stationsData = [];
      if (response.data.items && Array.isArray(response.data.items)) {
        stationsData = response.data.items;
      } else if (Array.isArray(response.data.data)) {
        stationsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        stationsData = response.data;
      }

      // console.log("Processed stations data:", stationsData);
      setStations(stationsData);
      setError(null); // Clear any previous errors
    } catch (err) {
      // console.error("Error fetching stations:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // POST - Thêm trạm sạc mới VÀ tạo slots cho các ports
  const handleAddStation = async (e) => {
    e.preventDefault();
    try {
      // console.log("Sending station data:", formData);

      // Tách newSlots ra khỏi ports trước khi gửi
      const portsWithoutNewSlots = formData.ports.map(
        ({ newSlots, ...port }) => port
      );
      const stationDataToSend = {
        ...formData,
        ports: portsWithoutNewSlots,
      };

      const response = await api.post("/stations", stationDataToSend);
      // console.log("Add station response:", response);

      // Xử lý response data
      const newStation = response.data.data || response.data;

      // Tạo slots cho các ports vừa tạo
      if (newStation.ports && Array.isArray(newStation.ports)) {
        for (let i = 0; i < formData.ports.length; i++) {
          const formPort = formData.ports[i];
          const createdPort = newStation.ports[i];

          if (
            createdPort?.id &&
            formPort.newSlots &&
            formPort.newSlots.length > 0
          ) {
            for (const slot of formPort.newSlots) {
              try {
                await api.post(`/stations/ports/${createdPort.id}/slots`, {
                  slotNumber: slot.slotNumber,
                  status: slot.status,
                });
              } catch (slotErr) {
                console.error(
                  `Error creating slot for port ${createdPort.id}:`,
                  slotErr
                );
              }
            }
          }
        }
      }

      setStations((prev) => [...prev, newStation]);
      setShowAddModal(false);
      resetForm();
      alert("Thêm trạm sạc và slots thành công!");

      // Refresh danh sách để đảm bảo đồng bộ
      await fetchStations();
    } catch (err) {
      // console.error("Error adding station:", err);

      if (err.response?.status === 400) {
        const errorMessage =
          err.response?.data?.message || "Dữ liệu không hợp lệ";
        alert(`Lỗi: ${errorMessage}`);
      } else if (err.response?.status === 422) {
        alert("Dữ liệu nhập vào không đúng định dạng. Vui lòng kiểm tra lại!");
      } else {
        alert("Có lỗi xảy ra khi thêm trạm sạc. Vui lòng thử lại!");
      }
    }
  };

  // PUT - Cập nhật trạm sạc VÀ tạo các slots mới (bao gồm cả slots của ports mới)
  const handleEditStation = async (e) => {
    // console.log("Current formData:", formData);
    e.preventDefault();
    try {
      // console.log("=== Starting Edit Station ===");

      // Tách newSlots ra khỏi ports trước khi gửi
      const portsWithoutNewSlots = formData.ports.map(
        ({ newSlots, ...port }) => port
      );
      const stationDataToSend = {
        ...formData,
        ports: portsWithoutNewSlots,
      };

      // console.log("Sending station update:", stationDataToSend);

      // 1. Cập nhật thông tin trạm sạc (bao gồm thêm ports mới)
      const response = await api.put(
        `/stations/${editingStation.id}`,
        stationDataToSend
      );
      const updatedStation = response.data.data || response.data;

      // console.log("Updated station response:", updatedStation);

      // 2. Map ports mới từ response với formData để biết port nào cần tạo slots
      if (updatedStation.ports && Array.isArray(updatedStation.ports)) {
        // console.log("Processing slots for ports...");

        for (let i = 0; i < formData.ports.length; i++) {
          const formPort = formData.ports[i];

          // Tìm port tương ứng trong response (theo index hoặc ID)
          let matchedPort;
          if (formPort.id) {
            // Port cũ - tìm theo ID
            matchedPort = updatedStation.ports.find(
              (p) => p.id === formPort.id
            );
          } else {
            // Port mới - lấy theo index (giả sử thứ tự không đổi)
            const newPortsInResponse = updatedStation.ports.filter(
              (p) => !formData.ports.some((fp) => fp.id === p.id)
            );
            const newPortIndex =
              formData.ports.slice(0, i + 1).filter((fp) => !fp.id).length - 1;
            matchedPort = newPortsInResponse[newPortIndex];
          }

          if (!matchedPort) {
            console.warn(`Cannot find matched port for index ${i}`);
            continue;
          }

          const portId = matchedPort.id;
          console.log(
            `Port ${i}: ID=${portId}, newSlots=${
              formPort.newSlots?.length || 0
            }`
          );

          // Tạo slots nếu có
          if (portId && formPort.newSlots && formPort.newSlots.length > 0) {
            console.log(
              `Creating ${formPort.newSlots.length} slots for port ${portId}`
            );

            for (const newSlot of formPort.newSlots) {
              try {
                const slotResponse = await api.post(
                  `/stations/ports/${portId}/slots`,
                  {
                    slotNumber: newSlot.slotNumber,
                    status: newSlot.status,
                  }
                );
                console.log(`Slot created:`, slotResponse.data);
              } catch (slotErr) {
                console.error(
                  `Error creating slot for port ${portId}:`,
                  slotErr
                );
              }
            }

            // Refresh lại slots sau khi tạo xong
            await fetchPortSlots(portId);
            console.log(`Refreshed slots for port ${portId}`);
          }
        }
      }

      // console.log("=== Edit Station Complete ===");

      // Cập nhật UI state
      setStations((prev) =>
        prev.map((station) =>
          station.id === editingStation.id ? updatedStation : station
        )
      );

      // Đóng modal và reset
      setShowEditModal(false);
      setEditingStation(null);
      resetForm();

      // Refresh lại danh sách từ server
      await fetchStations();

      // Hiện thông báo CUỐI CÙNG sau khi tất cả đã xong
      alert("Cập nhật trạm sạc, trụ sạc và slots thành công!");
    } catch (err) {
      console.error("Error updating station:", err);
      alert("Có lỗi xảy ra khi cập nhật trạm sạc");
    }
  };

  // DELETE - Cập nhật trạng thái trạm sạc thành inactive
  const handleDeleteStation = async (stationId) => {
    if (!window.confirm("Bạn có chắc chắn muốn vô hiệu hóa trạm sạc này?")) {
      return;
    }

    try {
      // Thay vì xóa, chúng ta sẽ cập nhật status thành inactive
      const response = await api.put(`/stations/${stationId}`, {
        status: "inactive",
      });
      console.log("Update status response:", response);

      // Cập nhật state local
      setStations((prev) =>
        prev.map((station) =>
          station.id === stationId
            ? { ...station, status: "inactive" }
            : station
        )
      );
      alert("Vô hiệu hóa trạm sạc thành công!");

      // Refresh lại danh sách để đảm bảo đồng bộ với server
      await fetchStations();
    } catch (err) {
      console.error("Error updating station status:", err);

      // Xử lý các loại lỗi khác nhau
      if (err.response?.status === 404) {
        alert("Trạm sạc không tồn tại!");
        await fetchStations();
      } else if (err.response?.status === 403) {
        alert("Bạn không có quyền vô hiệu hóa trạm sạc này!");
      } else {
        alert("Có lỗi xảy ra khi vô hiệu hóa trạm sạc. Vui lòng thử lại!");
      }
    }
  };

  // Helper: lấy portId an toàn từ object port
  const getPortId = (port) => port?.id ?? port?.portId ?? port?._id;

  // Helper: chuẩn hóa danh sách slots từ API để luôn có slotNumber
  const normalizeSlots = (slots) =>
    Array.isArray(slots)
      ? slots.map((s) => ({
          ...s,
          slotNumber:
            s.slotNumber ?? s.order ?? s.number ?? s.index ?? s.position ?? 0,
        }))
      : [];

  // API: Lấy danh sách slots của một port
  const fetchPortSlots = async (portId) => {
    try {
      setLoadingSlots(true);
      const response = await api.get(`/stations/ports/${portId}/slots`);

      // console.log(`Raw response for port ${portId}:`, response.data);

      // Hỗ trợ nhiều cấu trúc response: items | data | data.items | array
      let raw = [];
      if (Array.isArray(response.data)) {
        raw = response.data;
      } else if (Array.isArray(response.data.items)) {
        raw = response.data.items;
      } else if (Array.isArray(response.data.data)) {
        raw = response.data.data;
      } else if (
        response.data?.data?.items &&
        Array.isArray(response.data.data.items)
      ) {
        raw = response.data.data.items;
      }

      const slotsData = normalizeSlots(raw);

      // console.log(
      //   `Processed ${slotsData.length} slots for port ${portId}:`,
      //   slotsData
      // );

      setPortSlots((prev) => ({
        ...prev,
        [portId]: slotsData,
      }));
    } catch (err) {
      console.error(`Error fetching slots for port ${portId}:`, err);
      setPortSlots((prev) => ({
        ...prev,
        [portId]: [],
      }));
    } finally {
      setLoadingSlots(false);
    }
  };

  // Thêm slot tạm thời - cho phép thêm ngay cả khi port chưa có ID
  const addTempSlotToPort = (portIndex) => {
    const port = formData.ports[portIndex];
    const pid = getPortId(port);

    // Tính số thứ tự slot tiếp theo
    const existingSlots = pid ? portSlots[pid] || [] : [];
    const newSlots = port.newSlots || [];
    const nextSlotNumber = existingSlots.length + newSlots.length + 1;

    // Thêm slot mới vào mảng tạm
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map((p, i) =>
        i === portIndex
          ? {
              ...p,
              newSlots: [
                ...(p.newSlots || []),
                {
                  tempId: Date.now(), // ID tạm để React key
                  slotNumber: nextSlotNumber,
                  status: "available",
                },
              ],
            }
          : p
      ),
    }));
  };

  // Xóa slot tạm thời (chưa lưu)
  const removeTempSlot = (portIndex, tempId) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map((p, i) =>
        i === portIndex
          ? {
              ...p,
              newSlots: (p.newSlots || []).filter(
                (slot) => slot.tempId !== tempId
              ),
            }
          : p
      ),
    }));
  };

  // Xóa slot đã lưu (gọi API ngay)
  const removeExistingSlot = async (portIndex, slotId) => {
    const port = formData.ports[portIndex];
    const pid = getPortId(port);
    if (!pid) return;
    if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) return;

    try {
      await api.delete(`/stations/slots/${slotId}`);
      alert("Xóa slot thành công!");
      await fetchPortSlots(pid);
    } catch (err) {
      console.error("Error deleting slot:", err);
      alert("Có lỗi xảy ra khi xóa slot!");
    }
  };

  // Cập nhật trạng thái slot tạm thời
  const handleTempSlotChange = (portIndex, tempId, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map((p, i) =>
        i === portIndex
          ? {
              ...p,
              newSlots: (p.newSlots || []).map((slot) =>
                slot.tempId === tempId ? { ...slot, [field]: value } : slot
              ),
            }
          : p
      ),
    }));
  };

  // Cập nhật trạng thái slot đã lưu (gọi API ngay)
  const handleExistingSlotChange = async (portIndex, slotId, field, value) => {
    const port = formData.ports[portIndex];
    const pid = getPortId(port);
    if (!pid) return;

    const currentSlot = portSlots[pid]?.find((slot) => slot.id === slotId);
    if (!currentSlot) return;

    const updatedSlotData = { ...currentSlot, [field]: value };

    try {
      await api.put(`/stations/slots/${slotId}`, updatedSlotData);
      await fetchPortSlots(pid);
    } catch (err) {
      console.error("Error updating slot:", err);
      alert("Có lỗi xảy ra khi cập nhật slot!");
    }
  };

  // Utility functions
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
          newSlots: [],
        },
      ],
    });
  };

  // Đóng modal + reset form
  const closeStationModal = () => {
    resetForm();
    setEditingStation(null);
    setShowAddModal(false);
    setShowEditModal(false);
    setPortSlots({});
  };

  // Mở modal thêm mới
  const openAddModal = () => {
    resetForm();
    setEditingStation(null);
    setShowAddModal(true);
  };

  // Hàm mở modal chỉnh sửa
  const openEditModal = (station) => {
    setEditingStation(station);
    setFormData({
      name: station.name || "",
      longitude: station.longitude ?? "",
      latitude: station.latitude ?? "",
      status: station.status || "active",
      address: station.address || "",
      provider: station.provider || "",
      ports:
        Array.isArray(station.ports) && station.ports.length > 0
          ? station.ports.map((port) => ({
              ...port,
              newSlots: [], // Khởi tạo mảng slots mới rỗng
            }))
          : [
              {
                type: "DC",
                status: "available",
                powerKw: 120,
                speed: "fast",
                price: 3858,
                newSlots: [],
              },
            ],
    });

    // Fetch slots cho tất cả các ports
    if (Array.isArray(station.ports)) {
      station.ports.forEach((port) => {
        const pid = getPortId(port);
        if (pid) fetchPortSlots(pid);
      });
    }

    setShowEditModal(true);
  };

  // Hàm mở modal xem chi tiết
  const openViewModal = (station) => {
    setViewStation(station);

    // Fetch slots cho tất cả các ports
    if (Array.isArray(station.ports)) {
      station.ports.forEach((port) => {
        const pid = getPortId(port);
        if (pid) fetchPortSlots(pid);
      });
    }

    setShowViewModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "ports" ||
        name === "price" ||
        name === "longitude" ||
        name === "latitude"
          ? parseFloat(value) || 0
          : value,
    }));
  };

  const handlePortChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      ports: prev.ports.map((port, i) =>
        i === index
          ? {
              ...port,
              [field]:
                field === "powerKw" || field === "price"
                  ? parseInt(value) || 0
                  : value,
            }
          : port
      ),
    }));
  };

  const addPort = () => {
    setFormData((prev) => ({
      ...prev,
      ports: [
        ...prev.ports,
        {
          type: "DC",
          status: "available",
          powerKw: 120,
          speed: "fast",
          price: 3858,
          newSlots: [],
        },
      ],
    }));
  };

  const removePort = (index) => {
    if (formData.ports.length > 1) {
      setFormData((prev) => ({
        ...prev,
        ports: prev.ports.filter((_, i) => i !== index),
      }));
    }
  };

  useEffect(() => {
    fetchStations();
  }, []);

  // Reset to first page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, locationFilter]);

  // Tính toán thống kê từ data - đảm bảo stations là array
  const safeStations = Array.isArray(stations) ? stations : [];
  const totalStations = safeStations.length;
  const activeStations = safeStations.filter(
    (s) => s.status === "active"
  ).length;
  const maintenanceStations = safeStations.filter(
    (s) => s.status === "maintenance"
  ).length;
  const inactiveStations = safeStations.filter(
    (s) => s.status === "inactive"
  ).length;

  // Danh sách quận tại TP.HCM
  const hcmDistricts = [
    "Quận 1",
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

  const filteredStations = safeStations.filter((station) => {
    const matchesSearch =
      station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || station.status === statusFilter;
    const matchesLocation =
      locationFilter === "all" ||
      station.address?.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesStatus && matchesLocation;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStations.length / pageSize));
  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Clamp current page if data shrinks
  useEffect(() => {
    const newTotal = Math.max(1, Math.ceil(filteredStations.length / pageSize));
    if (currentPage > newTotal) setCurrentPage(newTotal);
  }, [filteredStations.length, currentPage, pageSize]);

  const getStatusText = (status) => {
    switch (status) {
      case "active":
        return "🟢 Hoạt động";
      case "maintenance":
        return "🔧 Bảo trì";
      case "inactive":
        return "🔴 Vô hiệu hóa";
      default:
        return status;
    }
  };

  // Hiển thị lỗi authentication trước khi load data
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
            <option value="inactive">Vô hiệu hóa</option>
          </select>
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
        <button className="btn-primary" onClick={openAddModal}>
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
          <div className="stat-icon">🔴</div>
          <div className="stat-info">
            <span className="stat-number">{inactiveStations}</span>
            <span className="stat-label">Vô hiệu hóa</span>
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
              <th>Số trụ</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStations.length > 0 ? (
              paginatedStations.map((station) => (
                <tr key={station.id}>
                  <td className="station-name">
                    <div className="name-with-icon">
                      <span className="station-icon">⚡</span>
                      {station.name}
                    </div>
                  </td>
                  <td>{station.address}</td>
                  <td>
                    <span className={`status-badge ${station.status}`}>
                      {getStatusText(station.status)}
                    </span>
                  </td>
                  <td>
                    {station.ports && Array.isArray(station.ports)
                      ? station.ports.length
                      : station.connectors || 0}{" "}
                    trụ
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon view"
                        title="Xem chi tiết"
                        onClick={() => openViewModal(station)}
                      >
                        👁️
                      </button>
                      <button
                        className="btn-icon edit"
                        title="Chỉnh sửa"
                        onClick={() => openEditModal(station)}
                      >
                        ✏️
                      </button>
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
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  Không tìm thấy trạm sạc nào
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

      {/* Station Modal - Dùng chung cho Add và Edit */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editingStation ? "Chỉnh sửa trạm sạc" : "Thêm trạm sạc mới"}
              </h3>
              <button className="close-btn" onClick={closeStationModal}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form
                className="station-form"
                onSubmit={editingStation ? handleEditStation : handleAddStation}
              >
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

                <div className="chargers-section">
                  <div className="chargers-header">
                    <label>Trụ sạc</label>
                  </div>

                  {formData.ports.map((port, index) => {
                    const pid = getPortId(port);
                    const existingSlots = pid ? portSlots[pid] || [] : [];
                    const newSlots = port.newSlots || [];
                    const totalSlots = existingSlots.length + newSlots.length;

                    return (
                      <div key={index} className="charger-item">
                        <div className="charger-header">
                          <h4>Trụ sạc {index + 1}</h4>
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

                        {/* Port fields: type, status, powerKw, speed, price */}
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

                        {/* Slots Section - Luôn hiển thị */}
                        <div className="slots-section">
                          <div className="slots-header">
                            <label>Slots sạc ({totalSlots})</label>
                            <button
                              type="button"
                              className="btn-add-slot"
                              onClick={() => addTempSlotToPort(index)}
                            >
                              + Thêm slot
                            </button>
                          </div>

                          {loadingSlots ? (
                            <p className="loading-slots">Đang tải slots...</p>
                          ) : (
                            <>
                              {/* Hiển thị slots đã lưu (chỉ khi edit) */}
                              {pid && existingSlots.length > 0 && (
                                <div className="slots-list">
                                  <h5 className="slots-group-title">
                                    Đã lưu ({existingSlots.length})
                                  </h5>
                                  {existingSlots.map((slot) => (
                                    <div
                                      key={slot.id}
                                      className="slot-item existing"
                                    >
                                      <div className="slot-info">
                                        <div className="form-group-inline">
                                          <label>Slot #{slot.slotNumber}</label>
                                        </div>
                                        <div className="form-group-inline">
                                          <label>Trạng thái:</label>
                                          <select
                                            value={slot.status}
                                            onChange={(e) =>
                                              handleExistingSlotChange(
                                                index,
                                                slot.id,
                                                "status",
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value="available">
                                              Có sẵn
                                            </option>
                                            <option value="in_use">
                                              Đang dùng
                                            </option>
                                            <option value="booked">
                                              Đã đặt
                                            </option>
                                            <option value="inactive">
                                              Vô hiệu
                                            </option>
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn-remove-slot"
                                          onClick={() =>
                                            removeExistingSlot(index, slot.id)
                                          }
                                          title="Xóa slot"
                                        >
                                          🗑️
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Hiển thị slots mới chưa lưu */}
                              {newSlots.length > 0 && (
                                <div className="slots-list">
                                  <h5 className="slots-group-title">
                                    {editingStation
                                      ? "Mới thêm"
                                      : "Slots sẽ tạo"}{" "}
                                    ({newSlots.length})
                                    {editingStation && " - Chưa lưu"}
                                  </h5>
                                  {newSlots.map((slot) => (
                                    <div
                                      key={slot.tempId}
                                      className="slot-item new"
                                    >
                                      <div className="slot-info">
                                        <div className="form-group-inline">
                                          <label>Slot {slot.slotNumber}</label>
                                        </div>
                                        <div className="form-group-inline">
                                          <label>Trạng thái:</label>
                                          <select
                                            value={slot.status}
                                            onChange={(e) =>
                                              handleTempSlotChange(
                                                index,
                                                slot.tempId,
                                                "status",
                                                e.target.value
                                              )
                                            }
                                          >
                                            <option value="available">
                                              Có sẵn
                                            </option>
                                            <option value="in_use">
                                              Đang dùng
                                            </option>
                                            <option value="booked">
                                              Đã đặt
                                            </option>
                                            <option value="inactive">
                                              Vô hiệu
                                            </option>
                                          </select>
                                        </div>
                                        <button
                                          type="button"
                                          className="btn-remove-slot"
                                          onClick={() =>
                                            removeTempSlot(index, slot.tempId)
                                          }
                                          title="Xóa slot"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {totalSlots === 0 && (
                                <p className="no-slots">
                                  Nhấn "Thêm slot" để tạo slots cho trụ này.
                                </p>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    className="btn-add-charger"
                    onClick={addPort}
                  >
                    + Thêm trụ sạc
                  </button>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeStationModal}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    {editingStation ? "Cập nhật trạm sạc" : "Tạo trạm sạc"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Station Modal - giữ nguyên */}
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
            <div className="modal-body">
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

                          {/* Danh sách slots */}
                          {(() => {
                            const pid = getPortId(port);
                            return (
                              pid && (
                                <div className="slots-section">
                                  <div className="slots-header">
                                    <label>
                                      Danh sách slots (
                                      {portSlots[pid]?.length || 0})
                                    </label>
                                  </div>

                                  {loadingSlots ? (
                                    <p className="loading-slots">
                                      Đang tải slots...
                                    </p>
                                  ) : portSlots[pid] &&
                                    portSlots[pid].length > 0 ? (
                                    <div className="slots-list">
                                      {portSlots[pid].map((slot) => (
                                        <div
                                          key={slot.id}
                                          className="slot-item"
                                        >
                                          <div className="slot-info">
                                            <div className="form-group-inline">
                                              <label>
                                                Slot #{slot.slotNumber}
                                              </label>
                                            </div>
                                            <div className="form-group-inline">
                                              <label>Trạng thái:</label>
                                              <select
                                                value={slot.status}
                                                disabled
                                              >
                                                <option value="available">
                                                  Có sẵn
                                                </option>
                                                <option value="in_use">
                                                  Đang sử dụng
                                                </option>
                                                <option value="maintenance">
                                                  Bảo trì
                                                </option>
                                                <option value="inactive">
                                                  Vô hiệu
                                                </option>
                                              </select>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="no-slots">Chưa có slot nào</p>
                                  )}
                                </div>
                              )
                            );
                          })()}
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

      {/* Slot Modal - Thêm slot mới */}
      {showSlotModal && selectedPort && (
        <div className="modal-overlay" onClick={() => setShowSlotModal(false)}>
          <div
            className="modal modal-small"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Thêm Slot cho Trụ sạc {selectedPort.type}</h3>
              <button
                className="close-btn"
                onClick={() => setShowSlotModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddSlot(selectedPort.id, newSlot);
                }}
              >
                <div className="form-group">
                  <label>Số thứ tự slot</label>
                  <input
                    type="number"
                    value={newSlot.slotNumber}
                    onChange={(e) =>
                      setNewSlot({
                        ...newSlot,
                        slotNumber: parseInt(e.target.value),
                      })
                    }
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={newSlot.status}
                    onChange={(e) =>
                      setNewSlot({ ...newSlot, status: e.target.value })
                    }
                    required
                  >
                    <option value="available">Có sẵn</option>
                    <option value="in_use">Đang sử dụng</option>
                    <option value="maintenance">Bảo trì</option>
                    <option value="inactive">Vô hiệu</option>
                  </select>
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setShowSlotModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Thêm Slot
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
