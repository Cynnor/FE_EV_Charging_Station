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
        try {
            // 1. Refresh danh sách stations
            const response = await api.get("/stations", {
                params: { page: 1, limit: 100, includePorts: true },
            });
            const stationsData = parseStationsData(response);
            const activeStations = stationsData.filter((s) => s.status === "active");
            setStations(activeStations);

            // 2. Nếu đang xem chi tiết một station, fetch fresh data cho station đó
            if (selectedStation) {
                try {
                    const detailResponse = await api.get(`/stations/${selectedStation.id}`, {
                        params: { includePorts: true }
                    });

                    let freshStation = null;
                    if (detailResponse.data?.data) {
                        freshStation = detailResponse.data.data;
                    } else if (detailResponse.data) {
                        freshStation = detailResponse.data;
                    }

                    if (freshStation) {
                        setSelectedStation(freshStation);

                        // Refresh slots cho tất cả ports
                        if (Array.isArray(freshStation.ports) && freshStation.ports.length > 0) {
                            freshStation.ports.forEach((port) => {
                                if (port.id) {
                                    fetchPortSlots(port.id);
                                }
                            });
                        }
                    }
                } catch (err) {
                    console.error("Error refreshing selected station:", err);
                    // Fallback: Tìm trong danh sách stations
                    const updated = stationsData.find((s) => s.id === selectedStation.id);
                    if (updated) setSelectedStation(updated);
                }
            }
        } catch (err) {
            console.error("Error refreshing stations:", err);
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

    // Lấy danh sách slots của một port và check reservations
    // overrides: optional map { [slotId]: forcedStatus } to reflect manual updates immediately
    const fetchPortSlots = async (portId, overrides = {}) => {
        try {
            setLoadingSlots(true);

            // 🔹 Normalize slots response
            const response = await api.get(`/stations/ports/${portId}/slots`);

            let raw = [];
            if (Array.isArray(response.data)) raw = response.data;
            else if (Array.isArray(response.data?.items)) raw = response.data.items;
            else if (Array.isArray(response.data?.data)) raw = response.data.data;
            else if (Array.isArray(response.data?.data?.items)) raw = response.data.data.items;

            // 🔹 Normalize status values
            raw = raw.map((slot) => {
                const normalizedStatus = String(slot.status || "")
                    .toLowerCase()
                    .replace("occupied", "in_use")
                    .replace("disabled", "unavailable");

                return { ...slot, status: normalizedStatus };
            });

            // 🔹 Fetch reservations
            let reservations = [];
            try {
                const reservationResponse = await api.get("/reservations", {
                    params: { status: "pending,confirmed,active", limit: 1000 },
                });

                if (Array.isArray(reservationResponse.data)) reservations = reservationResponse.data;
                else if (Array.isArray(reservationResponse.data?.items)) reservations = reservationResponse.data.items;
                else if (Array.isArray(reservationResponse.data?.data)) reservations = reservationResponse.data.data;
                else if (Array.isArray(reservationResponse.data?.data?.items))
                    reservations = reservationResponse.data.data.items;

                // 🔹 Filter expired reservations
                const now = new Date();
                reservations = reservations.filter(
                    (r) =>
                        Array.isArray(r.items) &&
                        r.items.some((it) => new Date(it.endAt) > now)
                );
            } catch (err) {
                console.warn("⚠️ Không thể tải reservations:", err);
            }

            // 🔹 Map reservations by slotId
            const reservationMap = {};
            reservations.forEach((r) => {
                r.items?.forEach((item) => {
                    const slotId =
                        typeof item.slot === "object"
                            ? item.slot?.id || item.slot?._id
                            : item.slot;
                    if (slotId) reservationMap[slotId] = r;
                });
            });

            // 🔹 Combine slot + reservation info
            const updatedSlots = raw.map((slot) => {
                const slotId = slot.id || slot._id;
                const reservation = reservationMap[slotId];
                const baseStatus = slot.status || "available";

                if (reservation) {
                    if (["confirmed", "active"].includes(reservation.status))
                        return { ...slot, actualStatus: "in_use", reservationInfo: reservation };
                    if (reservation.status === "pending")
                        return { ...slot, actualStatus: "booked", reservationInfo: reservation };
                }

                return { ...slot, actualStatus: baseStatus, reservationInfo: null };
            });

            // 🔹 Apply any manual overrides (e.g., right after a staff update)
            const finalSlots = updatedSlots.map((slot) => {
                const sid = slot.id || slot._id;
                const forced = overrides && (overrides[sid] || overrides[String(sid)]);
                return forced
                    ? { ...slot, status: forced, actualStatus: forced, reservationInfo: null }
                    : slot;
            });

            setPortSlots((prev) => ({
                ...prev,
                [portId]: finalSlots,
            }));
        } catch (err) {
            console.error(`❌ Lỗi khi tải slots cho port ${portId}:`, err);
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

    // Mở modal chi tiết trụ (hiển thị slots)
    const handlePortClick = async (port, station) => {
        const portId = port.id || port._id;
        if (!portId) {
            alert("Không tìm thấy thông tin trụ sạc!");
            return;
        }

        setSelectedPort(port);
        setSelectedStation(station); // Lưu station để có thể thêm/sửa port
        setShowPortModal(false); // Đảm bảo port modal đóng
        setShowSlotModal(false); // Đảm bảo slot modal đóng

        // Tự động fetch slots khi mở modal
        await fetchPortSlots(portId);
    };

    // Đóng modal chi tiết trụ
    const handleClosePortDetailModal = () => {
        setSelectedPort(null);
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
        const station = selectedStation;
        if (!station || !station.id) {
            alert("Không tìm thấy thông tin trạm!");
            return;
        }

        try {
            // Thêm port mới vào danh sách ports của station
            const updatedPorts = [
                ...(station.ports || []),
                { ...portFormData }
            ];

            // Cập nhật station với port mới
            const stationUpdate = {
                ...station,
                ports: updatedPorts.map(({ id, _id, ...port }) => port), // Loại bỏ id nếu có
            };

            await api.put(
                `/stations/${station.id}`,
                stationUpdate
            );

            alert("Thêm trụ sạc thành công!");
            setShowPortModal(false);
            setEditingPort(null);
            await refreshStationsAndSelected();
        } catch (err) {
            console.error("Error adding port:", err);
            alert(err.response?.data?.message || "Có lỗi xảy ra khi thêm trụ sạc!");
        }
    };

    // Cập nhật port
    const handleUpdatePort = async (e) => {
        e.preventDefault();
        const station = selectedStation;
        if (!station || !station.id || !editingPort) {
            alert("Không tìm thấy thông tin trạm hoặc trụ sạc!");
            return;
        }

        try {
            // Đảm bảo portFormData có đầy đủ các field cần thiết
            const updatedPortData = {
                type: portFormData.type,
                status: portFormData.status,
                powerKw: portFormData.powerKw,
                speed: portFormData.speed,
                price: portFormData.price,
            };

            // Cập nhật port trong danh sách ports của station
            const updatedPorts = (station.ports || []).map((port) => {
                const portId = port.id || port._id;
                const editingPortId = editingPort.id || editingPort._id;
                if (portId === editingPortId) {
                    // Giữ lại id và các field khác, chỉ update các field trong form
                    return { ...port, ...updatedPortData };
                }
                return port;
            });

            // Cập nhật station với port đã chỉnh sửa
            const stationUpdate = {
                ...station,
                ports: updatedPorts,
            };

            console.log("Updating port with data:", updatedPortData);
            console.log("Station update payload:", stationUpdate);

            await api.put(`/stations/${station.id}`, stationUpdate);

            alert("Cập nhật trụ sạc thành công!");
            setShowPortModal(false);
            setEditingPort(null);
            await refreshStationsAndSelected();
        } catch (err) {
            console.error("Error updating port:", err);
            const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi cập nhật trụ sạc!";
            alert(errorMessage);
        }
    };

    // Xóa port
    const handleDeletePort = async (portId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa trụ sạc này?")) return;

        const station = selectedStation;
        if (!station || !station.id) {
            alert("Không tìm thấy thông tin trạm!");
            return;
        }

        try {
            // Xóa port khỏi danh sách ports của station
            const updatedPorts = (station.ports || []).filter(
                (port) => (port.id || port._id) !== portId
            );

            // Cập nhật station với ports đã xóa port
            const stationUpdate = {
                ...station,
                ports: updatedPorts,
            };

            await api.put(`/stations/${station.id}`, stationUpdate);

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
            // Lấy status từ actualStatus hoặc status gốc
            // API chỉ chấp nhận: available, booked, in_use
            // Nếu có actualStatus từ reservation, ưu tiên dùng status gốc của slot
            let slotStatus = slot.status || slot.actualStatus || "available";

            // Map các status không hợp lệ về available
            const validStatuses = ["available", "booked", "in_use"];
            if (!validStatuses.includes(slotStatus)) {
                slotStatus = "available";
            }

            setSlotFormData({
                slotNumber: slot.slotNumber || slot.order || 1,
                status: slotStatus,
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
            // API yêu cầu "order" thay vì "slotNumber"
            const createData = {
                order: slotFormData.slotNumber,
                status: slotFormData.status,
            };

            // Validate status
            const validStatuses = ["available", "booked", "in_use"];
            if (!validStatuses.includes(createData.status)) {
                alert(`Trạng thái "${createData.status}" không hợp lệ. Chỉ chấp nhận: available, booked, in_use`);
                return;
            }

            await api.post(`/stations/ports/${selectedPort.id}/slots`, createData);
            alert("Thêm slot thành công!");
            setShowSlotModal(false);
            await fetchPortSlots(selectedPort.id);
        } catch (err) {
            console.error("Error adding slot:", err);
            const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi thêm slot!";
            alert(errorMessage);
        }
    };

    // Cập nhật slot
    const handleUpdateSlot = async (e) => {
        e.preventDefault();
        if (!selectedPort || !editingSlot) return;

        try {
            const slotId = editingSlot.id || editingSlot._id;
            if (!slotId) {
                alert("Không tìm thấy ID của slot!");
                return;
            }

            // Chuẩn bị data để gửi lên API (theo ChargingSlotUpdate schema)
            // API yêu cầu "order" thay vì "slotNumber", và chỉ chấp nhận 3 status: available, booked, in_use
            const updateData = {
                order: slotFormData.slotNumber,
                status: slotFormData.status,
            };

            // Validate status trước khi gửi
            const validStatuses = ["available", "booked", "in_use"];
            if (!validStatuses.includes(updateData.status)) {
                alert(`Trạng thái "${updateData.status}" không hợp lệ. Chỉ chấp nhận: available, booked, in_use`);
                return;
            }

            await api.put(`/stations/slots/${slotId}`, updateData);
            alert("Cập nhật slot thành công!");
            setShowSlotModal(false);
            setEditingSlot(null);
            // Refresh lại slots và ưu tiên hiển thị status vừa cập nhật
            const pid = selectedPort.id || selectedPort._id;
            await fetchPortSlots(pid, { [slotId]: updateData.status });
        } catch (err) {
            console.error("Error updating slot:", err);
            const errorMessage = err.response?.data?.message || err.message || "Có lỗi xảy ra khi cập nhật slot!";
            alert(errorMessage);
        }
    };

    // Xóa slot
    const handleDeleteSlot = async (slotId, portId) => {
        // Không cho xóa nếu slot đang sử dụng
        try {
            const slotsForPort = portSlots[portId] || [];
            const target = slotsForPort.find((s) => (s.id || s._id) === slotId);
            const status = String(target?.actualStatus || target?.status || "").toLowerCase();
            if (status === "in_use" || status === "occupied") {
                alert("Slot đang sử dụng, không thể xóa.");
                return;
            }
        } catch (e) {
            console.warn("Không thể kiểm tra trạng thái slot trước khi xóa:", e);
        }

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
                                        station.ports.map((port, portIndex) => {
                                            const portId = port.id || port._id;
                                            const slotDataset = Array.isArray(port.slots)
                                                ? port.slots
                                                : portSlots[portId] || [];
                                            const isFull =
                                                slotDataset.length > 0 &&
                                                slotDataset.every((s) =>
                                                    ["booked", "in_use"].includes(s.actualStatus || s.status)
                                                );

                                            return (
                                                <div
                                                    key={port.id || port._id || `port-${portIndex}`}
                                                    className="port-item"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePortClick(port, station);
                                                    }}
                                                >
                                                    <div className="port-header">
                                                        <h4 className="port-title">Trụ {portIndex + 1}</h4>
                                                        <span className={`port-speed-badge ${port.speed || 'fast'}`}>
                                                            {port.speed === 'ultra' ? 'Super Fast' :
                                                                port.speed === 'fast' ? 'Fast' : 'Slow'}
                                                        </span>
                                                    </div>
                                                    <div className="port-info">
                                                        <span className="port-type">{port.type || "N/A"}</span>
                                                        <div className="port-power-info">
                                                            <span className="power-icon">⚡</span>
                                                            <div className="power-details">
                                                                <span className="power-label">CÔNG SUẤT</span>
                                                                <span className="power-value">{port.powerKw || 0} kW</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`port-status ${port.status || "unknown"}`}>
                                                        {port.status === "available"
                                                            ? isFull
                                                                ? "Còn trống (Hết chỗ)"
                                                                : "Còn trống"
                                                            : port.status === "in_use"
                                                                ? "Đang sử dụng"
                                                                : port.status === "inactive"
                                                                    ? "Ngưng hoạt động"
                                                                    : port.status === "active"
                                                                        ? isFull
                                                                            ? "Hoạt động (Hết chỗ)"
                                                                            : "Hoạt động"
                                                                        : "Không xác định"}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-ports">Chưa có trụ sạc</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Port Detail Modal - Hiển thị slots của trụ */}
            {selectedPort && selectedStation && (
                <div
                    className="modal-overlay"
                    onClick={handleClosePortDetailModal}
                >
                    <div
                        className="modal-content port-detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <div className="port-modal-header-info">
                                <h2>Trụ {selectedPort.type || 'N/A'}</h2>
                                <span className={`port-speed-badge-modal ${selectedPort.speed || 'fast'}`}>
                                    {selectedPort.speed === 'ultra' ? 'Super Fast' :
                                        selectedPort.speed === 'fast' ? 'Fast' : 'Slow'}
                                </span>
                            </div>
                            <button
                                className="close-btn"
                                onClick={handleClosePortDetailModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="port-detail-info">
                                <div className="port-type-info">
                                    <span className="port-type-label">{selectedPort.type || 'N/A'}</span>
                                </div>
                                <div className="port-power-section">
                                    <span className="power-icon-large">⚡</span>
                                    <div className="power-details-large">
                                        <span className="power-label-large">CÔNG SUẤT</span>
                                        <span className="power-value-large">{selectedPort.powerKw || 0} kW</span>
                                    </div>
                                </div>
                                {/* Port actions removed per staff request: hide Sửa trụ / Xóa trụ */}
                            </div>

                            <div className="slots-section">
                                <div className="slots-header">
                                    <h3>Danh sách Slots ({portSlots[selectedPort.id || selectedPort._id]?.length || 0})</h3>
                                    <button
                                        className="btn-primary btn-small"
                                        onClick={() => handleOpenSlotModal(selectedPort)}
                                    >
                                        + Thêm slot
                                    </button>
                                </div>

                                {loadingSlots && !portSlots[selectedPort.id || selectedPort._id] ? (
                                    <div className="loading-slots">Đang tải...</div>
                                ) : portSlots[selectedPort.id || selectedPort._id] &&
                                    portSlots[selectedPort.id || selectedPort._id].length > 0 ? (
                                    <div className="slots-grid">
                                        {portSlots[selectedPort.id || selectedPort._id].map((slot, slotIndex) => {
                                            // Lấy slotNumber từ slot (API có thể trả về "order" hoặc "slotNumber")
                                            const slotNumber = slot.slotNumber ?? slot.order ?? (slotIndex + 1);
                                            // Lấy status từ actualStatus (đã được xử lý từ reservation) hoặc status gốc
                                            // API chỉ có 3 status: available, booked, in_use
                                            const slotStatus = slot.actualStatus ?? slot.status ?? "available";
                                            const canDelete = !(slotStatus === "in_use" || slotStatus === "occupied");

                                            return (
                                                <div
                                                    key={slot.id || slot._id || `slot-${slotIndex}`}
                                                    className="slot-item"
                                                >
                                                    <div className="slot-info">
                                                        <span className="slot-name">Slot {slotNumber}</span>
                                                        <span
                                                            className={`slot-status ${slotStatus}`}
                                                        >
                                                            {slotStatus === "available"
                                                                ? "Còn trống"
                                                                : slotStatus === "booked" || slotStatus === "reserved"
                                                                    ? "Đã đặt"
                                                                    : slotStatus === "in_use" || slotStatus === "occupied"
                                                                        ? "Đang sử dụng"
                                                                        : "Không xác định"}
                                                        </span>
                                                        {slot.reservationInfo && (
                                                            <span className="reservation-badge">
                                                                📅 {slot.reservationInfo.status === "confirmed" || slot.reservationInfo.status === "active"
                                                                    ? "Đã xác nhận"
                                                                    : "Đang chờ"}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="slot-actions">
                                                        <button
                                                            className="btn-icon"
                                                            disabled={!canDelete}
                                                            onClick={() =>
                                                                canDelete && handleDeleteSlot(
                                                                    slot.id || slot._id,
                                                                    selectedPort.id || selectedPort._id
                                                                )
                                                            }
                                                            title={canDelete ? "Xóa" : "Slot đang sử dụng - không thể xóa"}
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="no-slots">
                                        <p>Chưa có slot nào. Nhấn "Thêm slot" để tạo.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Port Modal - Form riêng khi thêm/sửa */}
            {showPortModal && (
                <div
                    className="modal-overlay"
                    onClick={() => {
                        setShowPortModal(false);
                        setEditingPort(null);
                    }}
                >
                    <div
                        className="modal-content port-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>{editingPort ? "Sửa trụ sạc" : "Thêm trụ sạc mới"}</h2>
                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowPortModal(false);
                                    setEditingPort(null);
                                }}
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
                                        <option value="available">Còn trống</option>
                                        <option value="in_use">Đang sử dụng</option>
                                        <option value="inactive">Ngưng hoạt động</option>
                                        <option value="active">Hoạt động</option>
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
                                <div className="form-actions">
                                    <button
                                        type="button"
                                        className="btn-secondary"
                                        onClick={() => {
                                            setShowPortModal(false);
                                            setEditingPort(null);
                                        }}
                                    >
                                        Hủy
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        {editingPort ? "Cập nhật" : "Thêm mới"}
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
                                        <option value="available">Còn trống</option>
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