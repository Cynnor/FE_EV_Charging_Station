import { useState, useEffect, useMemo } from "react";
import "./index.scss";
import api from "../../../config/api";

const OverviewStaff = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedStation, setSelectedStation] = useState(null);
    const [portSlots, setPortSlots] = useState({}); // { portId: [slots] }
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [showPortModal, setShowPortModal] = useState(false);
    const [showSlotModal, setShowSlotModal] = useState(false);
    const [selectedPort, setSelectedPort] = useState(null);
    const [editingPort, setEditingPort] = useState(null);
    const [editingSlot, setEditingSlot] = useState(null);
    const [portFormData, setPortFormData] = useState({
        type: "DC",
        status: "available",
        powerKw: 120,
        speed: "fast",
        price: 3858,
    });
    const [slotFormData, setSlotFormData] = useState({
        slotNumber: 1,
        status: "available",
    });

    // Helper function để parse stations data từ API response
    const parseStationsData = (response) => {
        let stationsData = [];
        if (response.data?.items && Array.isArray(response.data.items)) {
            stationsData = response.data.items;
        } else if (Array.isArray(response.data?.data)) {
            stationsData = response.data.data;
        } else if (Array.isArray(response.data)) {
            stationsData = response.data;
        }
        return stationsData;
    };

    // Helper function để refresh stations và update selected station
    const refreshStationsAndSelected = async () => {
        const response = await api.get("/stations", {
            params: { page: 1, limit: 100, includePorts: true },
        });
        const stationsData = parseStationsData(response);
        const activeStations = stationsData.filter((s) => s.status === "active");
        setStations(activeStations);

        if (selectedStation) {
            const updated = stationsData.find((s) => s.id === selectedStation.id);
            if (updated) setSelectedStation(updated);
        }
    };

    // Lấy danh sách trạm từ API (chỉ lấy trạm đang hoạt động)
    const fetchStations = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.get("/stations", {
                params: {
                    page: 1,
                    limit: 100,
                    includePorts: true,
                },
            });

            const stationsData = parseStationsData(response);

            // Lọc chỉ lấy trạm đang hoạt động
            const activeStations = stationsData.filter(
                (station) => station.status === "active"
            );
            setStations(activeStations);
        } catch (err) {
            console.error("Error fetching stations:", err);
            setError(err.message || "Không thể tải danh sách trạm");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStations();
    }, []);

    // Lấy danh sách slots của một port
    const fetchPortSlots = async (portId) => {
        try {
            setLoadingSlots(true);
            const response = await api.get(`/stations/ports/${portId}/slots`);

            let raw = [];
            if (Array.isArray(response.data)) {
                raw = response.data;
            } else if (Array.isArray(response.data?.items)) {
                raw = response.data.items;
            } else if (Array.isArray(response.data?.data)) {
                raw = response.data.data;
            } else if (
                response.data?.data?.items &&
                Array.isArray(response.data.data.items)
            ) {
                raw = response.data.data.items;
            }

            setPortSlots((prev) => ({
                ...prev,
                [portId]: raw || [],
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

    // Lọc trạm theo search term
    const filteredStations = useMemo(() => {
        if (!searchTerm) return stations;

        return stations.filter(
            (station) =>
                station.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                station.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [stations, searchTerm]);

    // Mở modal chi tiết trạm
    const handleStationClick = async (station) => {
        setSelectedStation(station);
        // Fetch slots cho tất cả các ports
        if (Array.isArray(station.ports) && station.ports.length > 0) {
            station.ports.forEach((port) => {
                if (port.id) {
                    fetchPortSlots(port.id);
                }
            });
        }
    };

    // Đóng modal chi tiết
    const handleCloseDetailModal = () => {
        setSelectedStation(null);
        setPortSlots({});
    };

    // Mở modal thêm/sửa port
    const handleOpenPortModal = (station, port = null) => {
        setSelectedStation(station);
        if (port) {
            setEditingPort(port);
            setPortFormData({
                type: port.type || "DC",
                status: port.status || "available",
                powerKw: port.powerKw || 120,
                speed: port.speed || "fast",
                price: port.price || 3858,
            });
        } else {
            setEditingPort(null);
            setPortFormData({
                type: "DC",
                status: "available",
                powerKw: 120,
                speed: "fast",
                price: 3858,
            });
        }
        setShowPortModal(true);
    };

    // Thêm port mới
    const handleAddPort = async (e) => {
        e.preventDefault();
        if (!selectedStation) return;

        try {
            // Thêm port mới vào danh sách ports của station
            const updatedPorts = [
                ...(selectedStation.ports || []),
                { ...portFormData }
            ];

            // Cập nhật station với port mới
            const stationUpdate = {
                ...selectedStation,
                ports: updatedPorts.map(({ id, ...port }) => port), // Loại bỏ id nếu có
            };

            await api.put(
                `/stations/${selectedStation.id}`,
                stationUpdate
            );

            alert("Thêm trụ sạc thành công!");
            setShowPortModal(false);
            await refreshStationsAndSelected();
        } catch (err) {
            console.error("Error adding port:", err);
            alert(err.response?.data?.message || "Có lỗi xảy ra khi thêm trụ sạc!");
        }
    };

    // Cập nhật port
    const handleUpdatePort = async (e) => {
        e.preventDefault();
        if (!selectedStation || !editingPort) return;

        try {
            // Cập nhật port trong danh sách ports của station
            const updatedPorts = (selectedStation.ports || []).map((port) =>
                port.id === editingPort.id
                    ? { ...port, ...portFormData }
                    : port
            );

            // Cập nhật station với port đã chỉnh sửa
            const stationUpdate = {
                ...selectedStation,
                ports: updatedPorts,
            };

            await api.put(`/stations/${selectedStation.id}`, stationUpdate);

            alert("Cập nhật trụ sạc thành công!");
            setShowPortModal(false);
            setEditingPort(null);
            await refreshStationsAndSelected();
        } catch (err) {
            console.error("Error updating port:", err);
            alert(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật trụ sạc!");
        }
    };

    // Xóa port
    const handleDeletePort = async (portId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa trụ sạc này?")) return;

        try {
            // Xóa port khỏi danh sách ports của station
            const updatedPorts = (selectedStation.ports || []).filter(
                (port) => port.id !== portId
            );

            // Cập nhật station với ports đã xóa port
            const stationUpdate = {
                ...selectedStation,
                ports: updatedPorts,
            };

            await api.put(`/stations/${selectedStation.id}`, stationUpdate);

            alert("Xóa trụ sạc thành công!");
            await refreshStationsAndSelected();
        } catch (err) {
            console.error("Error deleting port:", err);
            alert(err.response?.data?.message || "Có lỗi xảy ra khi xóa trụ sạc!");
        }
    };

    // Mở modal thêm/sửa slot
    const handleOpenSlotModal = (port, slot = null) => {
        setSelectedPort(port);
        if (slot) {
            setEditingSlot(slot);
            setSlotFormData({
                slotNumber: slot.slotNumber || 1,
                status: slot.status || "available",
            });
        } else {
            setEditingSlot(null);
            const existingSlots = portSlots[port.id] || [];
            setSlotFormData({
                slotNumber: existingSlots.length + 1,
                status: "available",
            });
        }
        setShowSlotModal(true);
    };

    // Thêm slot mới
    const handleAddSlot = async (e) => {
        e.preventDefault();
        if (!selectedPort) return;

        try {
            await api.post(`/stations/ports/${selectedPort.id}/slots`, slotFormData);
            alert("Thêm slot thành công!");
            setShowSlotModal(false);
            await fetchPortSlots(selectedPort.id);
        } catch (err) {
            console.error("Error adding slot:", err);
            alert("Có lỗi xảy ra khi thêm slot!");
        }
    };

    // Cập nhật slot
    const handleUpdateSlot = async (e) => {
        e.preventDefault();
        if (!selectedPort || !editingSlot) return;

        try {
            await api.put(`/stations/slots/${editingSlot.id}`, slotFormData);
            alert("Cập nhật slot thành công!");
            setShowSlotModal(false);
            setEditingSlot(null);
            await fetchPortSlots(selectedPort.id);
        } catch (err) {
            console.error("Error updating slot:", err);
            alert("Có lỗi xảy ra khi cập nhật slot!");
        }
    };

    // Xóa slot
    const handleDeleteSlot = async (slotId, portId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) return;

        try {
            await api.delete(`/stations/slots/${slotId}`);
            alert("Xóa slot thành công!");
            await fetchPortSlots(portId);
        } catch (err) {
            console.error("Error deleting slot:", err);
            alert("Có lỗi xảy ra khi xóa slot!");
        }
    };

    if (loading) {
        return (
            <div className="staff-overview-content">
                <div className="loading-container">
                    <p>Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="staff-overview-content">
                <div className="error-container">
                    <p>{error}</p>
                    <button onClick={fetchStations}>Thử lại</button>
                </div>
            </div>
        );
    }

    return (
        <div className="staff-overview-content">
            {/* Search Bar */}
            <div className="search-section">
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Tìm kiếm trạm theo tên hoặc địa chỉ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <span className="search-icon">🔍</span>
                </div>
                <div className="search-info">
                    <span>
                        Tìm thấy {filteredStations.length} trạm đang hoạt động
                    </span>
                </div>
            </div>

            {/* Stations List */}
            <div className="stations-list">
                {filteredStations.length === 0 ? (
                    <div className="empty-state">
                        <p>Không tìm thấy trạm nào</p>
                    </div>
                ) : (
                    filteredStations.map((station) => (
                        <div
                            key={station.id}
                            className="station-card"
                            onClick={() => handleStationClick(station)}
                        >
                            <div className="station-header">
                                <div className="station-info">
                                    <h3>{station.name || `Trạm ${station.id}`}</h3>
                                    <p className="station-address">{station.address}</p>
                                </div>
                                <div className="station-status">
                                    <span className="status-badge active">Đang hoạt động</span>
                                </div>
                            </div>
                            <div className="station-ports">
                                <div className="ports-header">
                                    <span className="ports-title">
                                        Trụ sạc ({station.ports?.length || 0})
                                    </span>
                                </div>
                                <div className="ports-grid">
                                    {station.ports && station.ports.length > 0 ? (
                                        station.ports.map((port) => (
                                            <div key={port.id} className="port-item">
                                                <div className="port-info">
                                                    <span className="port-type">{port.type || "N/A"}</span>
                                                    <span className="port-power">
                                                        {port.powerKw || 0} kW
                                                    </span>
                                                </div>
                                                <div className={`port-status ${port.status || "unknown"}`}>
                                                    {port.status === "available"
                                                        ? "Rỗi"
                                                        : port.status === "in_use" || port.status === "occupied"
                                                            ? "Đang sử dụng"
                                                            : port.status === "maintenance"
                                                                ? "Bảo trì"
                                                                : "Không xác định"}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-ports">Chưa có trụ sạc</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Station Detail Modal */}
            {selectedStation && (
                <div
                    className="modal-overlay"
                    onClick={handleCloseDetailModal}
                >
                    <div
                        className="modal-content station-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>{selectedStation.name || `Trạm ${selectedStation.id}`}</h2>
                            <button
                                className="close-btn"
                                onClick={handleCloseDetailModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="ports-section">
                                <div className="section-header">
                                    <h3>Danh sách trụ sạc</h3>
                                    <button
                                        className="btn-primary btn-add"
                                        onClick={() => handleOpenPortModal(selectedStation)}
                                    >
                                        + Thêm trụ
                                    </button>
                                </div>

                                {selectedStation.ports &&
                                    selectedStation.ports.length > 0 ? (
                                    <div className="ports-detail-list">
                                        {selectedStation.ports.map((port) => (
                                            <div key={port.id} className="port-detail-card">
                                                <div className="port-detail-header">
                                                    <div className="port-detail-info">
                                                        <h4>
                                                            Trụ {port.type} - {port.powerKw || 0} kW
                                                        </h4>
                                                        <span
                                                            className={`port-status-badge ${port.status || "unknown"}`}
                                                        >
                                                            {port.status === "available"
                                                                ? "Rỗi"
                                                                : port.status === "in_use" ||
                                                                    port.status === "occupied"
                                                                    ? "Đang sử dụng"
                                                                    : port.status === "maintenance"
                                                                        ? "Bảo trì"
                                                                        : "Không xác định"}
                                                        </span>
                                                    </div>
                                                    <div className="port-actions">
                                                        <button
                                                            className="btn-secondary btn-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenPortModal(selectedStation, port);
                                                            }}
                                                        >
                                                            Sửa
                                                        </button>
                                                        <button
                                                            className="btn-danger btn-small"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDeletePort(port.id);
                                                            }}
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="slots-section">
                                                    <div className="slots-header">
                                                        <span>Slots ({portSlots[port.id]?.length || 0})</span>
                                                        <button
                                                            className="btn-link btn-small"
                                                            onClick={() => {
                                                                if (!portSlots[port.id]) {
                                                                    fetchPortSlots(port.id);
                                                                }
                                                            }}
                                                        >
                                                            {portSlots[port.id]
                                                                ? "Tải lại"
                                                                : "Xem slots"}
                                                        </button>
                                                        <button
                                                            className="btn-link btn-small"
                                                            onClick={() => handleOpenSlotModal(port)}
                                                        >
                                                            + Thêm slot
                                                        </button>
                                                    </div>

                                                    {loadingSlots && !portSlots[port.id] ? (
                                                        <div className="loading-slots">Đang tải...</div>
                                                    ) : portSlots[port.id] &&
                                                        portSlots[port.id].length > 0 ? (
                                                        <div className="slots-grid">
                                                            {portSlots[port.id].map((slot) => (
                                                                <div
                                                                    key={slot.id}
                                                                    className="slot-item"
                                                                >
                                                                    <div className="slot-info">
                                                                        <span>Slot #{slot.slotNumber}</span>
                                                                        <span
                                                                            className={`slot-status ${slot.status || "unknown"}`}
                                                                        >
                                                                            {slot.status === "available"
                                                                                ? "Rỗi"
                                                                                : slot.status === "booked"
                                                                                    ? "Đã đặt"
                                                                                    : slot.status === "in_use"
                                                                                        ? "Đang sử dụng"
                                                                                        : "Không xác định"}
                                                                        </span>
                                                                    </div>
                                                                    <div className="slot-actions">
                                                                        <button
                                                                            className="btn-icon"
                                                                            onClick={() =>
                                                                                handleOpenSlotModal(port, slot)
                                                                            }
                                                                            title="Sửa"
                                                                        >
                                                                            ✏️
                                                                        </button>
                                                                        <button
                                                                            className="btn-icon"
                                                                            onClick={() =>
                                                                                handleDeleteSlot(slot.id, port.id)
                                                                            }
                                                                            title="Xóa"
                                                                        >
                                                                            🗑️
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="no-slots">
                                                            Chưa có slot nào. Nhấn "Thêm slot" để tạo.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-ports">
                                        <p>Chưa có trụ sạc nào</p>
                                        <button
                                            className="btn-primary"
                                            onClick={() => handleOpenPortModal(selectedStation)}
                                        >
                                            Thêm trụ đầu tiên
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Port Modal */}
            {showPortModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowPortModal(false)}
                >
                    <div
                        className="modal-content port-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>{editingPort ? "Sửa trụ sạc" : "Thêm trụ sạc mới"}</h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowPortModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <form
                                onSubmit={editingPort ? handleUpdatePort : handleAddPort}
                                className="port-form"
                            >
                                <div className="form-group">
                                    <label>Loại trụ</label>
                                    <select
                                        value={portFormData.type}
                                        onChange={(e) =>
                                            setPortFormData({
                                                ...portFormData,
                                                type: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="AC">AC</option>
                                        <option value="DC">DC</option>
                                        <option value="DC_ULTRA">DC ULTRA</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={portFormData.status}
                                        onChange={(e) =>
                                            setPortFormData({
                                                ...portFormData,
                                                status: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="available">Rỗi</option>
                                        <option value="in_use">Đang sử dụng</option>
                                        <option value="maintenance">Bảo trì</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Công suất (kW)</label>
                                    <input
                                        type="number"
                                        value={portFormData.powerKw}
                                        onChange={(e) =>
                                            setPortFormData({
                                                ...portFormData,
                                                powerKw: Number(e.target.value),
                                            })
                                        }
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Tốc độ</label>
                                    <select
                                        value={portFormData.speed}
                                        onChange={(e) =>
                                            setPortFormData({
                                                ...portFormData,
                                                speed: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="slow">Chậm</option>
                                        <option value="fast">Nhanh</option>
                                        <option value="ultra">Siêu nhanh</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Giá (VND/kWh)</label>
                                    <input
                                        type="number"
                                        value={portFormData.price}
                                        onChange={(e) =>
                                            setPortFormData({
                                                ...portFormData,
                                                price: Number(e.target.value),
                                            })
                                        }
                                        min="0"
                                        required
                                    />
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setShowPortModal(false)}
                                    >
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingPort ? "Cập nhật" : "Thêm"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Slot Modal */}
            {showSlotModal && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowSlotModal(false)}
                >
                    <div
                        className="modal-content slot-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                {editingSlot ? "Sửa slot" : "Thêm slot mới"}
                            </h2>
                            <button
                                className="close-btn"
                                onClick={() => setShowSlotModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <form
                                onSubmit={editingSlot ? handleUpdateSlot : handleAddSlot}
                                className="slot-form"
                            >
                                <div className="form-group">
                                    <label>Số slot</label>
                                    <input
                                        type="number"
                                        value={slotFormData.slotNumber}
                                        onChange={(e) =>
                                            setSlotFormData({
                                                ...slotFormData,
                                                slotNumber: Number(e.target.value),
                                            })
                                        }
                                        min="1"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Trạng thái</label>
                                    <select
                                        value={slotFormData.status}
                                        onChange={(e) =>
                                            setSlotFormData({
                                                ...slotFormData,
                                                status: e.target.value,
                                            })
                                        }
                                        required
                                    >
                                        <option value="available">Rỗi</option>
                                        <option value="booked">Đã đặt</option>
                                        <option value="in_use">Đang sử dụng</option>
                                    </select>
                                </div>
                                <div className="modal-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => setShowSlotModal(false)}
                                    >
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingSlot ? "Cập nhật" : "Thêm"}
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

export default OverviewStaff;