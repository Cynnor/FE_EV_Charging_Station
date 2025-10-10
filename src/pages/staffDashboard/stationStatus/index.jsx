import { useState } from "react";
import "./index.scss";

const StationStatus = () => {
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedStation, setSelectedStation] = useState(null);

    const stations = [
        {
            id: "ST001",
            type: "DC",
            power: "150kW",
            status: "online",
            availability: "available",
            currentSession: null,
            lastMaintenance: "2024-01-15",
            totalSessions: 245,
            totalEnergy: "12,450 kWh",
            efficiency: 98.5,
            location: "Vị trí A1",
        },
        {
            id: "ST002",
            type: "AC",
            power: "22kW",
            status: "online",
            availability: "charging",
            currentSession: {
                licensePlate: "51B-99999",
                startTime: "14:25",
                progress: 75,
                estimatedEnd: "15:10",
            },
            lastMaintenance: "2024-01-10",
            totalSessions: 189,
            totalEnergy: "8,920 kWh",
            efficiency: 96.2,
            location: "Vị trí A2",
        },
        {
            id: "ST003",
            type: "DC",
            power: "50kW",
            status: "online",
            availability: "available",
            currentSession: null,
            lastMaintenance: "2024-01-12",
            totalSessions: 156,
            totalEnergy: "6,780 kWh",
            efficiency: 97.8,
            location: "Vị trí A3",
        },
        {
            id: "ST004",
            type: "AC",
            power: "22kW",
            status: "offline",
            availability: "maintenance",
            currentSession: null,
            lastMaintenance: "2024-01-20",
            totalSessions: 203,
            totalEnergy: "9,150 kWh",
            efficiency: 95.1,
            location: "Vị trí B1",
            issue: "Lỗi kết nối",
        },
        {
            id: "ST005",
            type: "DC",
            power: "150kW",
            status: "online",
            availability: "charging",
            currentSession: {
                licensePlate: "29A-11111",
                startTime: "16:00",
                progress: 15,
                estimatedEnd: "16:45",
            },
            lastMaintenance: "2024-01-18",
            totalSessions: 178,
            totalEnergy: "7,890 kWh",
            efficiency: 99.2,
            location: "Vị trí B2",
        },
        {
            id: "ST006",
            type: "AC",
            power: "22kW",
            status: "online",
            availability: "available",
            currentSession: null,
            lastMaintenance: "2024-01-14",
            totalSessions: 134,
            totalEnergy: "5,670 kWh",
            efficiency: 94.5,
            location: "Vị trí B3",
        },
        {
            id: "ST007",
            type: "DC",
            power: "50kW",
            status: "offline",
            availability: "error",
            currentSession: null,
            lastMaintenance: "2024-01-08",
            totalSessions: 167,
            totalEnergy: "7,230 kWh",
            efficiency: 93.8,
            location: "Vị trí C1",
            issue: "Lỗi phần cứng",
        },
        {
            id: "ST008",
            type: "AC",
            power: "22kW",
            status: "online",
            availability: "available",
            currentSession: null,
            lastMaintenance: "2024-01-16",
            totalSessions: 198,
            totalEnergy: "8,450 kWh",
            efficiency: 97.3,
            location: "Vị trí C2",
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "online":
                return "green";
            case "offline":
                return "red";
            case "maintenance":
                return "orange";
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
            case "maintenance":
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
            case "maintenance":
                return "Bảo trì";
            case "error":
                return "Lỗi";
            default:
                return "Không xác định";
        }
    };

    const filteredStations = stations.filter((station) => {
        if (filterStatus === "all") return true;
        if (filterStatus === "online") return station.status === "online";
        if (filterStatus === "offline") return station.status === "offline";
        if (filterStatus === "charging") return station.availability === "charging";
        if (filterStatus === "available") return station.availability === "available";
        return true;
    });

    const handleStationClick = (station) => {
        setSelectedStation(station);
    };

    const handleMaintenance = (stationId) => {
        console.log("Bắt đầu bảo trì trụ:", stationId);
    };

    const handleReset = (stationId) => {
        console.log("Reset trụ:", stationId);
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
                            <span className="value green">{stations.filter(s => s.status === "online").length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Offline:</span>
                            <span className="value red">{stations.filter(s => s.status === "offline").length}</span>
                        </div>
                        <div className="summary-item">
                            <span className="label">Đang sạc:</span>
                            <span className="value blue">{stations.filter(s => s.availability === "charging").length}</span>
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
                        Online ({stations.filter(s => s.status === "online").length})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "offline" ? "active" : ""}`}
                        onClick={() => setFilterStatus("offline")}
                    >
                        Offline ({stations.filter(s => s.status === "offline").length})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "charging" ? "active" : ""}`}
                        onClick={() => setFilterStatus("charging")}
                    >
                        Đang sạc ({stations.filter(s => s.availability === "charging").length})
                    </button>
                    <button
                        className={`filter-tab ${filterStatus === "available" ? "active" : ""}`}
                        onClick={() => setFilterStatus("available")}
                    >
                        Rỗi ({stations.filter(s => s.availability === "available").length})
                    </button>
                </div>
            </div>

            {/* Stations Grid */}
            <div className="stations-grid">
                {filteredStations.map((station) => (
                    <div
                        key={station.id}
                        className={`station-card ${getStatusColor(station.status)}`}
                        onClick={() => handleStationClick(station)}
                    >
                        <div className="card-header">
                            <div className="station-info">
                                <span className="station-id">{station.id}</span>
                                <span className="station-type">{station.type} - {station.power}</span>
                            </div>
                            <div className={`status-indicator ${getStatusColor(station.status)}`}>
                                <span className="status-dot"></span>
                                {station.status === "online" ? "Online" : "Offline"}
                            </div>
                        </div>

                        <div className="card-content">
                            <div className="availability-section">
                                <div className={`availability-badge ${getAvailabilityColor(station.availability)}`}>
                                    {getAvailabilityText(station.availability)}
                                </div>
                                <span className="location">{station.location}</span>
                            </div>

                            {station.currentSession && (
                                <div className="current-session">
                                    <div className="session-header">
                                        <span className="license-plate">{station.currentSession.licensePlate}</span>
                                        <span className="start-time">Bắt đầu: {station.currentSession.startTime}</span>
                                    </div>
                                    <div className="session-progress">
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{ width: `${station.currentSession.progress}%` }}
                                            ></div>
                                        </div>
                                        <span className="progress-text">{station.currentSession.progress}%</span>
                                    </div>
                                    <div className="estimated-end">
                                        Dự kiến kết thúc: {station.currentSession.estimatedEnd}
                                    </div>
                                </div>
                            )}

                            {station.issue && (
                                <div className="issue-section">
                                    <div className="issue-alert">
                                        <span className="issue-icon">⚠️</span>
                                        <span className="issue-text">{station.issue}</span>
                                    </div>
                                </div>
                            )}

                            <div className="station-stats">
                                <div className="stat-item">
                                    <span className="label">Phiên sạc:</span>
                                    <span className="value">{station.totalSessions}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="label">Năng lượng:</span>
                                    <span className="value">{station.totalEnergy}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="label">Hiệu suất:</span>
                                    <span className="value">{station.efficiency}%</span>
                                </div>
                            </div>
                        </div>

                        <div className="card-actions">
                            {station.status === "offline" && (
                                <button
                                    className="btn-secondary"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReset(station.id);
                                    }}
                                >
                                    Reset
                                </button>
                            )}
                            <button
                                className="btn-primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleMaintenance(station.id);
                                }}
                            >
                                Bảo trì
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Station Detail Modal */}
            {selectedStation && (
                <div className="station-modal-overlay" onClick={() => setSelectedStation(null)}>
                    <div className="station-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết trụ sạc {selectedStation.id}</h3>
                            <button
                                className="close-btn"
                                onClick={() => setSelectedStation(null)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-content">
                            <div className="detail-grid">
                                <div className="detail-section">
                                    <h4>Thông tin cơ bản</h4>
                                    <div className="detail-items">
                                        <div className="detail-item">
                                            <span className="label">Loại:</span>
                                            <span className="value">{selectedStation.type} - {selectedStation.power}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Vị trí:</span>
                                            <span className="value">{selectedStation.location}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Trạng thái:</span>
                                            <span className={`value ${getStatusColor(selectedStation.status)}`}>
                                                {selectedStation.status === "online" ? "Online" : "Offline"}
                                            </span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Tình trạng:</span>
                                            <span className={`value ${getAvailabilityColor(selectedStation.availability)}`}>
                                                {getAvailabilityText(selectedStation.availability)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="detail-section">
                                    <h4>Thống kê</h4>
                                    <div className="detail-items">
                                        <div className="detail-item">
                                            <span className="label">Tổng phiên sạc:</span>
                                            <span className="value">{selectedStation.totalSessions}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Tổng năng lượng:</span>
                                            <span className="value">{selectedStation.totalEnergy}</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Hiệu suất:</span>
                                            <span className="value">{selectedStation.efficiency}%</span>
                                        </div>
                                        <div className="detail-item">
                                            <span className="label">Bảo trì cuối:</span>
                                            <span className="value">{selectedStation.lastMaintenance}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {selectedStation.currentSession && (
                                <div className="detail-section">
                                    <h4>Phiên sạc hiện tại</h4>
                                    <div className="current-session-detail">
                                        <div className="session-info">
                                            <div className="info-item">
                                                <span className="label">Biển số:</span>
                                                <span className="value">{selectedStation.currentSession.licensePlate}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Bắt đầu:</span>
                                                <span className="value">{selectedStation.currentSession.startTime}</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Tiến độ:</span>
                                                <span className="value">{selectedStation.currentSession.progress}%</span>
                                            </div>
                                            <div className="info-item">
                                                <span className="label">Dự kiến kết thúc:</span>
                                                <span className="value">{selectedStation.currentSession.estimatedEnd}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {selectedStation.issue && (
                                <div className="detail-section">
                                    <h4>Sự cố</h4>
                                    <div className="issue-detail">
                                        <div className="issue-alert">
                                            <span className="issue-icon">⚠️</span>
                                            <span className="issue-text">{selectedStation.issue}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
