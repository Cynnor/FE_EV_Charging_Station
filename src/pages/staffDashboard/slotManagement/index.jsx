import { useState, useEffect, useCallback } from "react";
import "./index.scss";
import api from "../../../config/api";

const SlotManagement = () => {
    const [stations, setStations] = useState([]);
    const [ports, setPorts] = useState([]);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingStations, setLoadingStations] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [error, setError] = useState(null);

    // Form states
    const [showCreateSlotModal, setShowCreateSlotModal] = useState(false);
    const [selectedPort, setSelectedPort] = useState(null);
    const [slotForm, setSlotForm] = useState({
        order: "",
        status: "available",
        nextAvailableAt: null
    });

    const loadAllData = useCallback(async () => {
        try {
            setLoading(true);
            setLoadingStations(true);
            setError(null);

            // Load stations first
            const stationsResponse = await api.get("/stations", {
                params: { includePorts: true, limit: 100 }
            });
            const stationsData = stationsResponse.data?.items || stationsResponse.data?.data || [];
            console.log("Loaded stations:", stationsData);
            setStations(stationsData);
            setLoadingStations(false);

            // Load ports from stations data
            const allPorts = [];
            for (const station of stationsData) {
                console.log(`Station ${station.name} has ports:`, station.ports);
                if (station.ports && station.ports.length > 0) {
                    allPorts.push(...station.ports.map(port => ({
                        ...port,
                        stationName: station.name,
                        stationId: station.id
                    })));
                }
            }
            console.log("All ports:", allPorts);
            setPorts(allPorts);

            // Load slots for all ports in parallel (much faster!)
            if (allPorts.length > 0) {
                setLoadingSlots(true);
                const slotPromises = allPorts.map(async (port) => {
                    try {
                        const slotsResponse = await api.get(`/stations/ports/${port.id}/slots`);
                        const portSlots = slotsResponse.data?.items || slotsResponse.data?.data || slotsResponse.data || [];
                        return portSlots.map(slot => ({
                            ...slot,
                            portName: `${port.type} ${port.powerKw}kW`,
                            portId: port.id,
                            stationName: port.stationName
                        }));
                    } catch (error) {
                        console.error(`Error loading slots for port ${port.id}:`, error);
                        return []; // Return empty array if error
                    }
                });

                // Wait for all slot requests to complete
                const slotResults = await Promise.all(slotPromises);
                const allSlots = slotResults.flat(); // Flatten the array of arrays
                setSlots(allSlots);
                setLoadingSlots(false);
            } else {
                setSlots([]);
            }

        } catch (error) {
            console.error("Error loading data:", error);
            console.error("Error response:", error.response);
            setError(`Không thể tải dữ liệu: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
            setLoadingStations(false);
            setLoadingSlots(false);
        }
    }, []);

    // Load data on component mount
    useEffect(() => {
        loadAllData();
    }, [loadAllData]);


    const handleCreateSlot = async (e) => {
        e.preventDefault();
        if (!selectedPort) {
            alert("Vui lòng chọn port");
            return;
        }

        try {
            setLoading(true);

            // Validate order if provided
            if (slotForm.order && (isNaN(slotForm.order) || parseInt(slotForm.order) < 1)) {
                alert("Thứ tự phải là số nguyên dương");
                return;
            }

            // Prepare payload according to Swagger schema
            const payload = {};

            if (slotForm.order) {
                payload.order = parseInt(slotForm.order);
            }

            payload.status = slotForm.status;

            // nextAvailableAt should be null if status is "available"
            if (slotForm.status === "available") {
                payload.nextAvailableAt = null;
            } else if (slotForm.nextAvailableAt) {
                // Convert to ISO string if provided
                payload.nextAvailableAt = new Date(slotForm.nextAvailableAt).toISOString();
            }

            console.log("Creating slot with payload:", payload);
            const response = await api.post(`/stations/ports/${selectedPort.id}/slots`, payload);
            console.log("Slot creation response:", response.data);

            alert("✅ Tạo slot thành công!");
            setShowCreateSlotModal(false);
            setSlotForm({ order: "", status: "available", nextAvailableAt: null });
            setSelectedPort(null);
            loadAllData(); // Reload all data
        } catch (error) {
            console.error("Error creating slot:", error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi tạo slot";
            alert(`❌ Lỗi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa slot này?")) {
            return;
        }

        try {
            setLoading(true);
            await api.delete(`/stations/slots/${slotId}`);
            alert("Xóa slot thành công!");
            loadAllData(); // Reload all data
        } catch (error) {
            console.error("Error deleting slot:", error);
            const errorMessage = error.response?.data?.message || "Có lỗi xảy ra khi xóa slot";
            alert(`Lỗi: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "available":
                return "Sẵn sàng";
            case "booked":
                return "Đã đặt";
            case "in_use":
                return "Đang sử dụng";
            default:
                return status;
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case "available":
                return "status-available";
            case "booked":
                return "status-booked";
            case "in_use":
                return "status-in-use";
            default:
                return "status-unknown";
        }
    };

    return (
        <div className="slot-management-content">
            {/* Header */}
            <div className="management-header">
                <div className="header-left">
                    <h2>Quản lý Slot Sạc</h2>
                    <p>Tạo và quản lý các slot sạc cho từng port</p>
                </div>
                <div className="header-right">
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateSlotModal(true)}
                    >
                        + Tạo Slot Mới
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="stats-summary">
                <div className="stat-card">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                        <span className="stat-label">Tổng trạm</span>
                        <span className="stat-value">{stations.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">🔌</div>
                    <div className="stat-info">
                        <span className="stat-label">Tổng port</span>
                        <span className="stat-value">{ports.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">⚡</div>
                    <div className="stat-info">
                        <span className="stat-label">Tổng slot</span>
                        <span className="stat-value">{slots.length}</span>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon">✅</div>
                    <div className="stat-info">
                        <span className="stat-label">Slot sẵn sàng</span>
                        <span className="stat-value">{slots.filter(s => s.status === "available").length}</span>
                    </div>
                </div>
            </div>

            {/* Slots Table */}
            <div className="slots-table-container">
                <div className="table-header">
                    <h3>Danh sách Slot Sạc</h3>
                    <div className="table-actions">
                        <button
                            className="btn-secondary"
                            onClick={loadAllData}
                            disabled={loading}
                        >
                            🔄 Làm mới
                        </button>
                        <button
                            className="btn-secondary"
                            onClick={async () => {
                                try {
                                    console.log("Testing API...");
                                    const response = await api.get("/stations", {
                                        params: { includePorts: true, limit: 100 }
                                    });
                                    console.log("API Response:", response.data);
                                } catch (error) {
                                    console.error("API Error:", error);
                                }
                            }}
                            disabled={loading}
                        >
                            🧪 Test API
                        </button>
                    </div>
                </div>

                {loadingStations && (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <span>Đang tải danh sách trạm...</span>
                    </div>
                )}

                {loadingSlots && (
                    <div className="skeleton-table">
                        <div className="skeleton-header">
                            {[...Array(7)].map((_, i) => (
                                <div key={i} className="skeleton-cell"></div>
                            ))}
                        </div>
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="skeleton-row">
                                {[...Array(7)].map((_, j) => (
                                    <div key={j} className="skeleton-cell"></div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}

                {error && (
                    <div className="error-state">
                        <span className="error-icon">⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                {!loadingStations && !loadingSlots && !error && (
                    <div className="slots-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID Slot</th>
                                    <th>Trạm</th>
                                    <th>Port</th>
                                    <th>Thứ tự</th>
                                    <th>Trạng thái</th>
                                    <th>Khả dụng từ</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {slots.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="no-data">
                                            <div className="no-data-content">
                                                <span className="no-data-icon">📭</span>
                                                <span>Chưa có slot nào</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    slots.map((slot) => (
                                        <tr key={slot.id}>
                                            <td>
                                                <span className="slot-id">#{slot.id}</span>
                                            </td>
                                            <td>
                                                <span className="station-name">{slot.stationName}</span>
                                            </td>
                                            <td>
                                                <span className="port-name">{slot.portName}</span>
                                                <small className="port-id">ID: {slot.portId}</small>
                                            </td>
                                            <td>
                                                <span className="slot-order">{slot.order || "—"}</span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusClass(slot.status)}`}>
                                                    {getStatusText(slot.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="next-available">
                                                    {slot.nextAvailableAt
                                                        ? new Date(slot.nextAvailableAt).toLocaleString("vi-VN")
                                                        : "—"
                                                    }
                                                </span>
                                            </td>
                                            <td>
                                                <div className="action-buttons">
                                                    <button
                                                        className="btn-danger btn-sm"
                                                        onClick={() => handleDeleteSlot(slot.id)}
                                                        disabled={loading}
                                                    >
                                                        🗑️ Xóa
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create Slot Modal */}
            {showCreateSlotModal && (
                <div className="modal-overlay" onClick={() => setShowCreateSlotModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tạo Slot Sạc Mới</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowCreateSlotModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateSlot} className="slot-form">
                            <div className="form-group">
                                <label htmlFor="port-select">Chọn Port *</label>
                                <select
                                    id="port-select"
                                    value={selectedPort?.id || ""}
                                    onChange={(e) => {
                                        const portId = e.target.value;
                                        const port = ports.find(p => p.id === portId);
                                        console.log("Selected port:", port);
                                        setSelectedPort(port);
                                    }}
                                    required
                                >
                                    <option value="">-- Chọn port --</option>
                                    {ports.length === 0 ? (
                                        <option value="" disabled>Không có port nào</option>
                                    ) : (
                                        ports.map((port) => (
                                            <option key={port.id} value={port.id}>
                                                {port.stationName} - {port.type} {port.powerKw}kW
                                            </option>
                                        ))
                                    )}
                                </select>
                                {ports.length === 0 && (
                                    <small style={{ color: "#dc2626" }}>
                                        Không tìm thấy port nào. Vui lòng kiểm tra lại dữ liệu trạm sạc.
                                    </small>
                                )}
                            </div>

                            <div className="form-group">
                                <label htmlFor="order">Thứ tự slot</label>
                                <input
                                    type="number"
                                    id="order"
                                    min="1"
                                    value={slotForm.order}
                                    onChange={(e) => setSlotForm(prev => ({ ...prev, order: e.target.value }))}
                                    placeholder="Để trống để tự động gán"
                                />
                                <small>Nếu để trống, hệ thống sẽ tự động gán thứ tự tiếp theo</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">Trạng thái</label>
                                <select
                                    id="status"
                                    value={slotForm.status}
                                    onChange={(e) => setSlotForm(prev => ({ ...prev, status: e.target.value }))}
                                >
                                    <option value="available">Sẵn sàng</option>
                                    <option value="booked">Đã đặt</option>
                                    <option value="in_use">Đang sử dụng</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="nextAvailableAt">Khả dụng từ</label>
                                <input
                                    type="datetime-local"
                                    id="nextAvailableAt"
                                    value={slotForm.nextAvailableAt || ""}
                                    onChange={(e) => setSlotForm(prev => ({ ...prev, nextAvailableAt: e.target.value }))}
                                />
                                <small>Chỉ áp dụng khi trạng thái là "Đã đặt" hoặc "Đang sử dụng"</small>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setShowCreateSlotModal(false)}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={loading}
                                >
                                    {loading ? "Đang tạo..." : "Tạo Slot"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SlotManagement;
