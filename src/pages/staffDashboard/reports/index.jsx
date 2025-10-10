import { useState } from "react";
import "./index.scss";

const Reports = () => {
    const [activeTab, setActiveTab] = useState("create");
    const [showCreateForm, setShowCreateForm] = useState(false);
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

    const stations = [
        { id: "ST001", type: "DC", power: "150kW", location: "Vị trí A1" },
        { id: "ST002", type: "AC", power: "22kW", location: "Vị trí A2" },
        { id: "ST003", type: "DC", power: "50kW", location: "Vị trí A3" },
        { id: "ST004", type: "AC", power: "22kW", location: "Vị trí B1" },
        { id: "ST005", type: "DC", power: "150kW", location: "Vị trí B2" },
        { id: "ST006", type: "AC", power: "22kW", location: "Vị trí B3" },
        { id: "ST007", type: "DC", power: "50kW", location: "Vị trí C1" },
        { id: "ST008", type: "AC", power: "22kW", location: "Vị trí C2" },
    ];

    const reportHistory = [
        {
            id: "RPT001",
            type: "hardware",
            stationId: "ST007",
            title: "Trụ sạc không phản hồi",
            description: "Trụ sạc ST007 không phản hồi khi khách hàng quét QR code. Màn hình hiển thị lỗi.",
            priority: "high",
            status: "pending",
            createdAt: "2024-01-20 14:30",
            reporter: "Nhân viên A",
            images: ["image1.jpg", "image2.jpg"],
        },
        {
            id: "RPT002",
            type: "connection",
            stationId: "ST004",
            title: "Mất kết nối internet",
            description: "Trụ sạc ST004 mất kết nối internet, không thể xử lý thanh toán online.",
            priority: "medium",
            status: "in_progress",
            createdAt: "2024-01-20 12:15",
            reporter: "Nhân viên B",
            images: [],
        },
        {
            id: "RPT003",
            type: "power",
            stationId: "ST002",
            title: "Sụt áp điện",
            description: "Trụ sạc ST002 báo lỗi sụt áp điện, tốc độ sạc chậm hơn bình thường.",
            priority: "high",
            status: "resolved",
            createdAt: "2024-01-19 16:45",
            reporter: "Nhân viên C",
            images: ["image3.jpg"],
            resolvedAt: "2024-01-20 09:30",
            resolvedBy: "Kỹ thuật viên X",
        },
        {
            id: "RPT004",
            type: "safety",
            stationId: "ST005",
            title: "Cáp sạc bị hư hỏng",
            description: "Cáp sạc của trụ ST005 bị hư hỏng, có thể gây nguy hiểm cho khách hàng.",
            priority: "high",
            status: "resolved",
            createdAt: "2024-01-19 10:20",
            reporter: "Nhân viên D",
            images: ["image4.jpg", "image5.jpg"],
            resolvedAt: "2024-01-19 15:00",
            resolvedBy: "Kỹ thuật viên Y",
        },
        {
            id: "RPT005",
            type: "software",
            stationId: "ST001",
            title: "Lỗi hiển thị màn hình",
            description: "Màn hình trụ sạc ST001 hiển thị sai thông tin giá và thời gian sạc.",
            priority: "medium",
            status: "pending",
            createdAt: "2024-01-18 15:30",
            reporter: "Nhân viên E",
            images: ["image6.jpg"],
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case "pending":
                return "orange";
            case "in_progress":
                return "blue";
            case "resolved":
                return "green";
            default:
                return "gray";
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "pending":
                return "Chờ xử lý";
            case "in_progress":
                return "Đang xử lý";
            case "resolved":
                return "Đã xử lý";
            default:
                return "Không xác định";
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case "high":
                return "red";
            case "medium":
                return "orange";
            case "low":
                return "green";
            default:
                return "gray";
        }
    };

    const getPriorityText = (priority) => {
        switch (priority) {
            case "high":
                return "Cao";
            case "medium":
                return "Trung bình";
            case "low":
                return "Thấp";
            default:
                return "Không xác định";
        }
    };

    const getTypeInfo = (type) => {
        return reportTypes.find(t => t.id === type) || { label: "Không xác định", icon: "📝" };
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleImageUpload = (event) => {
        const files = Array.from(event.target.files);
        setFormData(prev => ({
            ...prev,
            images: [...prev.images, ...files]
        }));
    };

    const handleSubmitReport = () => {
        if (!formData.type || !formData.stationId || !formData.title || !formData.description) {
            alert("Vui lòng điền đầy đủ thông tin báo cáo");
            return;
        }

        // Logic gửi báo cáo
        console.log("Gửi báo cáo:", formData);

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
    };

    const handleViewReport = (report) => {
        console.log("Xem chi tiết báo cáo:", report);
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

            {/* Tabs */}
            <div className="reports-tabs">
                <button
                    className={`tab ${activeTab === "create" ? "active" : ""}`}
                    onClick={() => setActiveTab("create")}
                >
                    <span className="icon">📝</span>
                    Tạo báo cáo
                </button>
                <button
                    className={`tab ${activeTab === "history" ? "active" : ""}`}
                    onClick={() => setActiveTab("history")}
                >
                    <span className="icon">📋</span>
                    Lịch sử báo cáo
                </button>
            </div>

            {/* Content */}
            <div className="reports-content-area">
                {activeTab === "create" && (
                    <div className="create-report">
                        <div className="report-form">
                            <div className="form-section">
                                <h3>Thông tin báo cáo</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Loại sự cố *</label>
                                        <div className="type-selector">
                                            {reportTypes.map((type) => (
                                                <button
                                                    key={type.id}
                                                    className={`type-btn ${formData.type === type.id ? "selected" : ""}`}
                                                    onClick={() => handleInputChange("type", type.id)}
                                                >
                                                    <span className="icon">{type.icon}</span>
                                                    <span className="label">{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label>Trụ sạc *</label>
                                        <select
                                            value={formData.stationId}
                                            onChange={(e) => handleInputChange("stationId", e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="">Chọn trụ sạc</option>
                                            {stations.map((station) => (
                                                <option key={station.id} value={station.id}>
                                                    {station.id} - {station.type} {station.power} ({station.location})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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

                                    <div className="form-group full-width">
                                        <label>Tiêu đề *</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => handleInputChange("title", e.target.value)}
                                            placeholder="Nhập tiêu đề báo cáo"
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Mô tả chi tiết *</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => handleInputChange("description", e.target.value)}
                                            placeholder="Mô tả chi tiết về sự cố, thời gian xảy ra, tác động..."
                                            className="form-textarea"
                                            rows="4"
                                        />
                                    </div>

                                    <div className="form-group full-width">
                                        <label>Hình ảnh (tùy chọn)</label>
                                        <div className="image-upload">
                                            <input
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="file-input"
                                                id="image-upload"
                                            />
                                            <label htmlFor="image-upload" className="upload-btn">
                                                <span className="icon">📷</span>
                                                Chọn hình ảnh
                                            </label>
                                            {formData.images.length > 0 && (
                                                <div className="image-preview">
                                                    {formData.images.map((image, index) => (
                                                        <div key={index} className="preview-item">
                                                            <span className="image-name">{image.name}</span>
                                                            <button
                                                                className="remove-btn"
                                                                onClick={() => {
                                                                    const newImages = formData.images.filter((_, i) => i !== index);
                                                                    handleInputChange("images", newImages);
                                                                }}
                                                            >
                                                                ✕
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="form-actions">
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
                    </div>
                )}

                {activeTab === "history" && (
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
                                {reportHistory.map((report) => (
                                    <div key={report.id} className="table-row">
                                        <div className="col">
                                            <span className="report-id">{report.id}</span>
                                        </div>
                                        <div className="col">
                                            <div className="report-type">
                                                <span className="type-icon">{getTypeInfo(report.type).icon}</span>
                                                <span className="type-label">{getTypeInfo(report.type).label}</span>
                                            </div>
                                        </div>
                                        <div className="col">
                                            <span className="station-id">{report.stationId}</span>
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
                                            <span className="created-time">{report.createdAt}</span>
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
                                ))}
                            </div>
                        </div>
                    </div>
                )}
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
                            {/* Form content sẽ được hiển thị ở đây */}
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
                                    <label>Trụ sạc *</label>
                                    <select
                                        value={formData.stationId}
                                        onChange={(e) => handleInputChange("stationId", e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="">Chọn trụ sạc</option>
                                        {stations.map((station) => (
                                            <option key={station.id} value={station.id}>
                                                {station.id} - {station.type} {station.power}
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
