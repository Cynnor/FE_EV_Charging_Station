import { useEffect, useMemo, useState } from "react";
import api from "../../../config/api";
import "./index.scss";

const StationStatus = () => {
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedStation, setSelectedStation] = useState(null);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadStations = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/stations", {
                params: { includePorts: true, limit: 200 },
            });
            const payload = res.data?.items || res.data?.data?.items || res.data?.data || [];
            setStations(payload);
            if (payload.length) setSelectedStation(payload[0]);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải danh sách trạm.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStations();
    }, []);

    const deriveAvailability = (station) => {
        const ports = station?.ports || [];
        const slots = ports.flatMap((p) => p.slots || []);
        const slotStatuses = slots.map((s) => s.status);
        if (slotStatuses.includes("in_use")) return "charging";
        if (slotStatuses.includes("booked")) return "booked";
        return "available";
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return "green";
            case "maintenance":
                return "orange";
            case "inactive":
                return "red";
            default:
                return "gray";
        }
    };

    const getAvailabilityColor = (availability) => {
        switch (availability) {
            case "available":
                return "green";
            case "charging":
                return "blue";
            case "booked":
                return "orange";
            case "error":
                return "red";
            default:
                return "gray";
        }
    };

    const getAvailabilityText = (availability) => {
        switch (availability) {
            case "available":
                return "Rỗi";
            case "charging":
                return "Đang sạc";
            case "booked":
                return "Đang giữ chỗ";
            case "maintenance":
                return "Bảo trì";
            case "error":
                return "Lỗi";
            default:
                return "Không xác định";
        }
    };

    const filteredStations = useMemo(
        () =>
            stations.filter((station) => {
                const availability = deriveAvailability(station);
                if (filterStatus === "all") return true;
                if (filterStatus === "online") return station.status === "active";
                if (filterStatus === "offline") return station.status === "inactive";
                if (filterStatus === "charging") return availability === "charging";
                if (filterStatus === "available") return availability === "available";
                return true;
            }),
        [stations, filterStatus]
    );

    const countAvailability = (value) =>
        stations.filter((s) => deriveAvailability(s) === value).length;
    const countStatus = (value) =>
        stations.filter((s) => s.status === value).length;
    const summarizeSlots = (station) => {
        const slots = (station?.ports || []).flatMap((p) => p.slots || []);
        return slots.reduce(
            (acc, slot) => ({
                ...acc,
                [slot.status]: (acc[slot.status] || 0) + 1,
            }),
            { available: 0, booked: 0, in_use: 0 }
        );
    };

    const handleStationClick = (station) => {
        setSelectedStation(station);
    };

    const handleMaintenance = (stationId) => {
        console.log("Bắt đầu bảo trì trụ:", stationId);
    };

    return (
        <div className="station-status-content">
            {/* Header */}
            <div className="status-header">
                <div className="header-left">
                    <h2>Tình trạng điểm sạc</h2>
                    <p>Quản lý và theo dõi trạng thái các trụ sạc</p>
                </div>
                <div className="header-right">
                    <div className="status-summary">
                        <div className="summary-item">
                            <span className="label">Tổng trụ:</span>
                            <span className="value">{stations.length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Online:</span>
                            <span className="value green">{countStatus("active")}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Offline:</span>
                            <span className="value red">{countStatus("inactive")}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Đang sạc:</span>
                            <span className="value blue">{countAvailability("charging")}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="status-filters">
                <div className="filter-tabs">
                    <button
                        className={`filter-tab ${filterStatus === "all" ? "active" : ""}`}
                        onClick={() => setFilterStatus("all")}
                    >
                        Tất cả ({stations.length})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "online" ? "active" : ""}`}
                        onClick={() => setFilterStatus("online")}
                    >
                        Online ({countStatus("active")})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "offline" ? "active" : ""}`}
                        onClick={() => setFilterStatus("offline")}
                    >
                        Offline ({countStatus("inactive")})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "charging" ? "active" : ""}`}
                        onClick={() => setFilterStatus("charging")}
                    >
                        Đang sạc ({countAvailability("charging")})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "available" ? "active" : ""}`}
                        onClick={() => setFilterStatus("available")}
                    >
                        Rỗi ({countAvailability("available")})
                    </button>
                </div>
            </div>

            {/* Stations Grid */}
            {error && <p className="muted error-text">{error}</p>}
            {loading ? (
                <p className="muted">Đang tải danh sách trạm...</p>
            ) : (
                <div className="stations-grid">
                    {filteredStations.map((station) => {
                        const availability = deriveAvailability(station);
                        const slotSummary = summarizeSlots(station);
                        return (
                            <div
                                key={station.id}
                                className={`station-card ${getStatusColor(station.status)}`}
                                onClick={() => handleStationClick(station)}
                            >
                                <div className="card-header">
                                    <div className="station-info">
                                        <span className="station-id">{station.name || station.id}</span>
                                        <span className="station-type">{station.provider || "N/A"}</span>
                                        <span className="location">{station.address}</span>
                                    </div>
                                    <div className={`status-indicator ${getStatusColor(station.status)}`}>
                                        <span className="status-dot"></span>
                                        {station.status}
                                    </div>
                                </div>

                                <div className="card-content">
                                    <div className="availability-section">
                                        <div className={`availability-badge ${getAvailabilityColor(availability)}`}>
                                            {getAvailabilityText(availability)}
                                        </div>
                                        <span className="location">Số cổng: {station.ports?.length || 0}</span>
                                    </div>

                                    <div className="slot-summary">
                                        <div className="summary-chip green">
                                            Rỗi: {slotSummary.available || 0}
                                        </div>
                                        <div className="summary-chip blue">
                                            Đang sạc: {slotSummary.in_use || 0}
                                        </div>
                                        <div className="summary-chip orange">
                                            Giữ chỗ: {slotSummary.booked || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Station Detail Modal */}
            {selectedStation && !loading && (
                <div className="station-modal">
                    <div className="modal-content">
                        <div className="modal-header">
                            <div className="modal-title">
                                <h3>{selectedStation.name || selectedStation.id}</h3>
                                <div className={`status-badge ${getStatusColor(selectedStation.status)}`}>
                                    <span className="status-dot"></span>
                                    {selectedStation.status}
                                </div>
                            </div>
                            <button className="close-btn" onClick={() => setSelectedStation(null)}>×</button>
                        </div>
                        <div className="modal-body">
                            <p><strong>Địa chỉ:</strong> {selectedStation.address || "N/A"}</p>
                            <p><strong>Nhà cung cấp:</strong> {selectedStation.provider || "N/A"}</p>
                            <p><strong>Số cổng:</strong> {selectedStation.ports?.length || 0}</p>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setSelectedStation(null)}
                            >
                                Đóng
                            </button>
                            <button
                                className="btn-primary"
                                onClick={() => handleMaintenance(selectedStation.id)}
                            >
                                Bảo trì
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StationStatus;
