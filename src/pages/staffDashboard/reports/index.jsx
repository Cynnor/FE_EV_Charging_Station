import { useState, useEffect } from "react";
import api from "../../../config/api";
import "./index.scss";

const Reports = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [stations, setStations] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    const [formData, setFormData] = useState({
        type: "",
        stationId: "",
        portId: "",
        title: "",
        description: "",
        priority: "medium",
        images: [],
    });

    const reportTypes = [
        { id: "hardware", label: "Lỗi phần cứng", icon: "🔧" },
        { id: "connection", label: "Lỗi kết nối", icon: "📡" },
        { id: "power", label: "Sự cố điện", icon: "⚡" },
        { id: "software", label: "Lỗi phần mềm", icon: "💻" },
        { id: "safety", label: "An toàn", icon: "🛡️" },
        { id: "other", label: "Khác", icon: "📝" },
    ];

    useEffect(() => {
        fetchStations();
        fetchReports();
    }, []);

    const fetchStations = async () => {
        try {
            const response = await api.get("/stations?includePorts=true");
            let stationsData = [];
            if (response.data.items && Array.isArray(response.data.items)) {
                stationsData = response.data.items;
            } else if (Array.isArray(response.data.data)) {
                stationsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                stationsData = response.data;
            }
            setStations(stationsData);
        } catch (err) {
            console.error("Failed to fetch stations:", err);
        }
    };

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get("/reports");
            setReports(response.data.data || []);
        } catch (err) {
            console.error("Failed to fetch reports:", err);
            setError("Không thể tải danh sách báo cáo");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async () => {
        if (!reportToDelete) return;

        try {
            await api.delete(`/reports/${reportToDelete._id}`);

            // Update local state
            setReports(reports.filter(r => r._id !== reportToDelete._id));

            setShowDeleteModal(false);
            setReportToDelete(null);
        } catch (err) {
            console.error("Failed to delete report:", err);
            alert("Xóa báo cáo thất bại");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "pending";
            case "in_progress": return "in_progress";
            case "resolved": return "resolved";
            case "rejected": return "rejected";
            default: return "pending";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "pending": return "Chờ xử lý";
            case "in_progress": return "Đang xử lý";
            case "resolved": return "Đã xử lý";
            case "rejected": return "Từ chối";
            default: return "Không xác định";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high": return "high";
            case "medium": return "medium";
            case "low": return "low";
            default: return "medium";
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case "high": return "Cao";
            case "medium": return "Trung bình";
            case "low": return "Thấp";
            default: return "Không xác định";
        }
    };

    const getTypeInfo = (type) => {
        return reportTypes.find(t => t.id === type) || { label: "Không xác định", icon: "📝" };
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmitReport = async () => {
        if (!formData.type || !formData.stationId || !formData.title || !formData.description) {
            alert("Vui lòng điền đầy đủ thông tin báo cáo");
            return;
        }

        try {
            const payload = { ...formData };

            // Remove portId if it's empty or null
            if (!payload.portId || payload.portId.trim() === '') {
                delete payload.portId;
            }

            const response = await api.post("/reports", payload);
            const newReport = response.data.data;

            // Find the station to populate the new report item locally
            const station = stations.find(s => (s.id || s._id) === newReport.stationId);
            if (station) {
                newReport.stationId = station;
            }

            alert("Gửi báo cáo thành công!");

            // Add the new report to the top of the list
            setReports([newReport, ...reports]);

            // Reset form
            setFormData({
                type: "",
                stationId: "",
                portId: "",
                title: "",
                description: "",
                priority: "medium",
                images: [],
            });
            setShowCreateForm(false);
        } catch (err) {
            console.error("Failed to submit report:", err);
            alert("Gửi báo cáo thất bại. Vui lòng thử lại.");
        }
    };

    const handleViewReport = (report) => {
        console.log("View report:", report);
    };

    // Get selected station to show ports if available
    const selectedStation = stations.find(s => (s.id || s._id) === formData.stationId);
    const stationPorts = selectedStation?.ports || [];

    return (
        <div className="reports-content">
            {/* Header */}
            <div className="reports-header">
                <div className="header-left">
                    <h2>Báo cáo & Sự cố</h2>
                    <p>Quản lý và theo dõi các sự cố trạm sạc</p>
                </div>
                <div className="header-right">
                    <button
                        className="btn-primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        <span className="icon">📝</span>
                        Tạo báo cáo mới
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="reports-content-area">
                <div className="report-history">
                    <div className="history-table">
                        <div className="table-header">
                            <div className="col">Mã báo cáo</div>
                            <div className="col">Loại</div>
                            <div className="col">Trạm sạc</div>
                            <div className="col">Tiêu đề</div>
                            <div className="col">Mức độ</div>
                            <div className="col">Trạng thái</div>
                            <div className="col">Thời gian</div>
                            <div className="col">Thao tác</div>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div className="table-row">
                                    <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                                        Đang tải dữ liệu...
                                    </div>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="table-row">
                                    <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                                        Chưa có báo cáo nào.
                                    </div>
                                </div>
                            ) : (
                                reports.map((report, index) => (
                                    <div key={report._id || index} className="table-row">
                                        <div className="col">
                                            <span className="report-id">{report._id?.substring(report._id.length - 6).toUpperCase() || "N/A"}</span>
                                        </div>
                                        <div className="col">
                                            <div className="report-type">
                                                <span className="type-icon">{getTypeInfo(report.type).icon}</span>
                                                <span className="type-label">{getTypeInfo(report.type).label}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <span className="station-id">
                                                {report.stationId?.name || "N/A"}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <span className="report-title">{report.title}</span>
                                        </div>
                                        <div className="col">
                                            <span className={`priority-badge ${getPriorityColor(report.priority)}`}>
                                                {getPriorityText(report.priority)}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <span className={`status-badge ${getStatusColor(report.status)}`}>
                                                <span className="status-dot"></span>
                                                {getStatusText(report.status)}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <span className="created-time">
                                                {report.createdAt ? new Date(report.createdAt).toLocaleDateString('vi-VN') : "N/A"}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <button
                                                className="btn-small delete"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setReportToDelete(report);
                                                    setShowDeleteModal(true);
                                                }}
                                                style={{ color: '#ef4444', borderColor: '#ef4444', marginLeft: '0.5rem' }}
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Create Report Modal */}
            {showCreateForm && (
                <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Tạo báo cáo sự cố mới</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowCreateForm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="quick-form">
                                <div className="form-group">
                                    <label>Loại sự cố *</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => handleInputChange("type", e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Chọn loại sự cố</option>
                                        {reportTypes.map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.icon} {type.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Trạm sạc *</label>
                                    <select
                                        value={formData.stationId}
                                        onChange={(e) => {
                                            handleInputChange("stationId", e.target.value);
                                            handleInputChange("portId", ""); // Reset port when station changes
                                        }}
                                        className="form-select"
                                    >
                                        <option value="">Chọn trạm sạc</option>
                                        {stations.map((station, index) => (
                                            <option key={station.id || station._id || index} value={station.id || station._id}>
                                                {station.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {stationPorts.length > 0 && (
                                    <div className="form-group">
                                        <label>Cổng sạc (Tùy chọn)</label>
                                        <select
                                            value={formData.portId}
                                            onChange={(e) => handleInputChange("portId", e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">Chọn cổng sạc</option>
                                            {stationPorts.map((port, index) => (
                                                <option key={port.id || port._id || index} value={port.id || port._id}>
                                                    {port.name || `Cổng ${index + 1}`}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Mức độ ưu tiên</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => handleInputChange("priority", e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="low">Thấp</option>
                                        <option value="medium">Trung bình</option>
                                        <option value="high">Cao</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Tiêu đề *</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => handleInputChange("title", e.target.value)}
                                        placeholder="Nhập tiêu đề báo cáo"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Mô tả chi tiết *</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Mô tả chi tiết về sự cố..."
                                        className="form-textarea"
                                        rows="3"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowCreateForm(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSubmitReport}
                            >
                                Gửi báo cáo
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && reportToDelete && (
                <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
                    <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Xác nhận xóa</h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p>Bạn có chắc chắn muốn xóa báo cáo này không?</p>
                            <div className="report-summary warning" style={{ marginTop: '1rem', padding: '1rem', background: '#fff5f5', borderRadius: '8px' }}>
                                <p><strong>Tiêu đề:</strong> {reportToDelete.title}</p>
                            </div>
                            <p className="warning-text" style={{ color: '#ef4444', marginTop: '1rem', fontStyle: 'italic' }}>Hành động này không thể hoàn tác.</p>
                            <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
                                <button
                                    className="btn-primary"
                                    onClick={handleDeleteReport}
                                    style={{ background: '#ef4444', borderColor: '#ef4444' }}
                                >
                                    Xóa báo cáo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;
