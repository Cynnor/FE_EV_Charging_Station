import { useState, useEffect } from "react";
import api from "../../../config/api";
import "./index.scss";

const AdminReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedReport, setSelectedReport] = useState(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [reportToDelete, setReportToDelete] = useState(null);

    const reportTypes = [
        { id: "hardware", label: "Lỗi phần cứng", icon: "🔧" },
        { id: "connection", label: "Lỗi kết nối", icon: "📡" },
        { id: "power", label: "Sự cố điện", icon: "⚡" },
        { id: "software", label: "Lỗi phần mềm", icon: "💻" },
        { id: "safety", label: "An toàn", icon: "🛡️" },
        { id: "other", label: "Khác", icon: "📝" },
    ];

    useEffect(() => {
        fetchReports();
    }, []);

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

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedReport) return;

        try {
            await api.patch(`/reports/${selectedReport._id}/status`, { status: newStatus });

            // Update local state
            setReports(reports.map(r =>
                r._id === selectedReport._id ? { ...r, status: newStatus } : r
            ));

            setShowStatusModal(false);
            setSelectedReport(null);
            // alert("Cập nhật trạng thái thành công!");
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Cập nhật trạng thái thất bại");
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
            // alert("Xóa báo cáo thành công!");
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

    return (
        <div className="reports-content">
            <div className="reports-header">
                <div className="header-left">
                    <h2>Quản lý Báo cáo & Sự cố</h2>
                    <p>Theo dõi và xử lý các báo cáo từ nhân viên</p>
                </div>
                <div className="header-right">
                    <button className="btn-refresh" onClick={fetchReports}>
                        🔄 Làm mới
                    </button>
                </div>
            </div>

            <div className="reports-content-area">
                <div className="report-history">
                    <div className="history-table">
                        <div className="table-header">
                            <div className="col">Mã báo cáo</div>
                            <div className="col">Người báo cáo</div>
                            <div className="col">Loại</div>
                            <div className="col">Trạm sạc</div>
                            <div className="col">Tiêu đề</div>
                            <div className="col">Mức độ</div>
                            <div className="col">Trạng thái</div>
                            <div className="col">Thời gian</div>
                            <div className="col actions">Thao tác</div>
                        </div>
                        <div className="table-body">
                            {loading ? (
                                <div className="table-row loading">
                                    <div className="col" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "2rem" }}>
                                        Đang tải dữ liệu...
                                    </div>
                                </div>
                            ) : reports.length === 0 ? (
                                <div className="table-row empty">
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
                                            <span className="reporter-name">
                                                {report.reporterId?.fullName || report.reporterId?.email || "N/A"}
                                            </span>
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
                                            <span className="report-title" title={report.title}>{report.title}</span>
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
                                        <div className="col actions">
                                            <button
                                                className="btn-icon edit"
                                                title="Cập nhật trạng thái"
                                                onClick={() => {
                                                    setSelectedReport(report);
                                                    setShowStatusModal(true);
                                                }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title="Xóa báo cáo"
                                                onClick={() => {
                                                    setReportToDelete(report);
                                                    setShowDeleteModal(true);
                                                }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Status Update Modal */}
            {showStatusModal && selectedReport && (
                <div className="modal-overlay" onClick={() => setShowStatusModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cập nhật trạng thái báo cáo</h3>
                            <button className="close-btn" onClick={() => setShowStatusModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="report-summary">
                                <p><strong>Mã:</strong> {selectedReport._id?.substring(selectedReport._id.length - 6).toUpperCase()}</p>
                                <p><strong>Tiêu đề:</strong> {selectedReport.title}</p>
                                <p><strong>Mô tả:</strong> {selectedReport.description}</p>
                            </div>
                            <div className="status-actions">
                                <button
                                    className={`btn-status pending ${selectedReport.status === 'pending' ? 'active' : ''}`}
                                    onClick={() => handleStatusUpdate('pending')}
                                >
                                    Chờ xử lý
                                </button>
                                <button
                                    className={`btn-status in_progress ${selectedReport.status === 'in_progress' ? 'active' : ''}`}
                                    onClick={() => handleStatusUpdate('in_progress')}
                                >
                                    Đang xử lý
                                </button>
                                <button
                                    className={`btn-status resolved ${selectedReport.status === 'resolved' ? 'active' : ''}`}
                                    onClick={() => handleStatusUpdate('resolved')}
                                >
                                    Đã xử lý
                                </button>
                                <button
                                    className={`btn-status rejected ${selectedReport.status === 'rejected' ? 'active' : ''}`}
                                    onClick={() => handleStatusUpdate('rejected')}
                                >
                                    Từ chối
                                </button>
                            </div>
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
                            <div className="report-summary warning">
                                <p><strong>Mã:</strong> {reportToDelete._id?.substring(reportToDelete._id.length - 6).toUpperCase()}</p>
                                <p><strong>Tiêu đề:</strong> {reportToDelete.title}</p>
                            </div>
                            <p className="warning-text">Hành động này không thể hoàn tác.</p>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>Hủy bỏ</button>
                                <button className="btn-delete-confirm" onClick={handleDeleteReport}>Xóa báo cáo</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminReports;
