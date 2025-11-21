import { useState, useEffect } from "react";
import api from "../../../config/api";
import "./index.scss";

const Reports = () => {
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [stations, setStations] = useState([]);
    const [ports, setPorts] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        type: "",
        stationId: "",
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
            const response = await api.get("/stations");
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

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "orange";
            case "in_progress": return "blue";
            case "resolved": return "green";
            default: return "gray";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "pending": return "Chờ xử lý";
            case "in_progress": return "Đang xử lý";
            case "resolved": return "Đã xử lý";
            default: return "Không xác định";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high": return "red";
            case "medium": return "orange";
            case "low": return "green";
            default: return "gray";
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

    const handleImageUpload = (event) => {
        // In a real app, you would upload these to a server/cloud storage first
        // For now, we'll just store the file objects or base64
        const files = Array.from(event.target.files);
        // Here we would ideally upload and get URLs. For simplicity, skipping upload logic.
        // Assuming backend expects URLs, but we'll send empty array for now or handle file upload separately.
        console.log("Files selected:", files);
    };

    const handleSubmitReport = async () => {
        if (!formData.type || !formData.stationId || !formData.title || !formData.description) {
            alert("Vui lòng điền đầy đủ thông tin báo cáo");
            return;
        }

        try {
            const response = await api.post("/reports", formData);
            const newReport = response.data.data;

            // Find the station to populate the new report item
            const station = stations.find(s => s._id === newReport.stationId);
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
        // Implement view detail logic if needed
        console.log("View report:", report);
    };

    return (
        <div className="reports-content">
            {/* Header */}
            <div className="reports-header">
                <div className="header-left">
                    <h2>Báo cáo & Sự cố</h2>
                    <p>Gửi báo cáo sự cố và theo dõi tình trạng xử lý</p>
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
                            <div className="col">Trụ sạc</div>
                            <div className="col">Tiêu đề</div>
                            <div className="col">Mức độ</div>
                            <div className="col">Trạng thái</div>
                            <div className="col">Thời gian</div>
                            <div className="col">Thao tác</div>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div className="table-row">
                                    <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                                        Đang tải dữ liệu...
                                    </div>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="table-row">
                                    <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "20px" }}>
                                        Chưa có báo cáo nào.
                                    </div>
                                </div>
                            ) : (
                                reports.map((report) => (
                                    <div key={report._id} className="table-row">
                                        <div className="col">
                                            <span className="report-id">{report._id.substring(report._id.length - 6).toUpperCase()}</span>
                                        </div>
                                        <div className="col">
                                            <div className="report-type">
                                                <span className="type-icon">{getTypeInfo(report.type).icon}</span>
                                                <span className="type-label">{getTypeInfo(report.type).label}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <span className="station-id">
                                                {report.stationId?.name || report.stationId || "N/A"}
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
                                                {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                            </span>
                                        </div>
                                        <div className="col">
                                            <button
                                                className="btn-small"
                                                onClick={() => handleViewReport(report)}
                                            >
                                                Xem chi tiết
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
                                        onChange={(e) => handleInputChange("stationId", e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Chọn trạm sạc</option>
                                        {stations.map((station) => (
                                            <option key={station._id} value={station._id}>
                                                {station.name}
                                            </option>
                                        ))}
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
        </div>
    );
};

export default Reports;
