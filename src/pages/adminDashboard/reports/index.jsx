// Trang AdminReports: quản lý danh sách báo cáo / sự cố do nhân viên gửi lên.
// Chức năng chính:
//  - Tải danh sách báo cáo (fetchReports)
//  - Hiển thị bảng với các cột: mã, người báo cáo, loại, trạm, tiêu đề, mức độ, trạng thái, thời gian
//  - Cập nhật trạng thái báo cáo (modal trạng thái)
//  - Xóa báo cáo (modal xác nhận xóa)
//  - Phân loại type hiển thị icon + nhãn, level priority -> badge màu, status -> badge trạng thái
// Ghi chú UX: sử dụng overlay modal; click nền để đóng; xác nhận hành động destructive.
import { useState, useEffect } from "react"; // hook React quản lý state cục bộ + lifecycle
import api from "../../../config/api"; // axios instance cấu hình baseURL + interceptor
import "./AdminReports.scss"; // stylesheet riêng cho trang báo cáo

const AdminReports = () => { // Component chính trang quản lý báo cáo
    // =============== STATE CHÍNH ===============
    const [reports, setReports] = useState([]); // danh sách báo cáo từ BE
    const [loading, setLoading] = useState(false); // cờ hiển thị đang tải dữ liệu bảng
    const [error, setError] = useState(""); // thông điệp lỗi nếu fetch thất bại
    const [selectedReport, setSelectedReport] = useState(null); // báo cáo đang chọn để cập nhật trạng thái
    const [showStatusModal, setShowStatusModal] = useState(false); // bật/tắt modal cập nhật trạng thái
    const [showDeleteModal, setShowDeleteModal] = useState(false); // bật/tắt modal xác nhận xóa
    const [reportToDelete, setReportToDelete] = useState(null); // báo cáo nhắm đến để xóa
    const [tempStatus, setTempStatus] = useState(""); // trạng thái tạm chọn trong modal trước khi confirm

    // Mapping loại report -> nhãn + icon hiển thị trong bảng
    const reportTypes = [
        { id: "hardware", label: "Lỗi phần cứng", icon: "🔧" },
        { id: "connection", label: "Lỗi kết nối", icon: "📡" },
        { id: "power", label: "Sự cố điện", icon: "⚡" },
        { id: "software", label: "Lỗi phần mềm", icon: "💻" },
        { id: "safety", label: "An toàn", icon: "🛡️" },
        { id: "other", label: "Khác", icon: "📝" },
    ];

    // Các trạng thái hợp lệ: dùng cho badge và lựa chọn cập nhật
    const statusOptions = [
        { id: "pending", label: "Chờ xử lý" },
        { id: "in_progress", label: "Đang xử lý" },
        { id: "resolved", label: "Đã xử lý" },
        { id: "rejected", label: "Từ chối" },
    ];

    useEffect(() => { // mount lần đầu -> tải danh sách báo cáo
        fetchReports();
    }, []); // dependency rỗng => chỉ chạy 1 lần

    const fetchReports = async () => { // gọi API lấy danh sách báo cáo
        try {
            setLoading(true); // bật loading
            const response = await api.get("/reports"); // GET /reports
            const data = response.data; // payload tổng
            const items = data?.items || data?.data || data || []; // linh hoạt lấy mảng
            setReports(items); // lưu vào state chính
        } catch (err) {
            setError("Không thể tải danh sách báo cáo"); // gán lỗi UI
        } finally {
            setLoading(false); // tắt loading dù success/fail
        }
    };

    const openStatusModal = (report) => { // mở modal cập nhật trạng thái cho báo cáo được chọn
        setSelectedReport(report); // gán báo cáo
        setTempStatus(report.status); // trạng thái hiện tại làm giá trị mặc định
        setShowStatusModal(true); // hiển thị modal
    };

    const handleConfirmStatusUpdate = async () => { // xác nhận cập nhật trạng thái
        if (!selectedReport || !tempStatus) return; // guard nếu thiếu
        try {
            await api.patch(`/reports/${selectedReport._id}/status`, { // PATCH status
                status: tempStatus,
            });
            // cập nhật local state để phản ánh thay đổi ngay lập tức
            setReports((prev) => prev.map((r) => r._id === selectedReport._id ? { ...r, status: tempStatus } : r));
            setShowStatusModal(false); // đóng modal
            setSelectedReport(null); // reset lựa chọn
        } catch (err) {
            alert("Cập nhật trạng thái thất bại"); // báo lỗi nhẹ
        }
    };

    const handleDeleteReport = async () => { // xóa báo cáo đã chọn
        if (!reportToDelete) return; // guard
        try {
            await api.delete(`/reports/${reportToDelete._id}`); // gọi DELETE
            setReports((prev) => prev.filter((r) => r._id !== reportToDelete._id)); // loại khỏi danh sách
            setShowDeleteModal(false); // đóng modal
            setReportToDelete(null); // reset
        } catch (err) {
            alert("Xóa báo cáo thất bại");
        }
    };

    const getStatusColor = (status) => { // map status -> className màu badge
        switch (status) {
            case "pending":
                return "pending";
            case "in_progress":
                return "in_progress";
            case "resolved":
                return "resolved";
            case "rejected":
                return "rejected";
            default:
                return "pending";
        }
    };

    const getStatusText = (status) => { // map status -> nhãn tiếng Việt
        const option = statusOptions.find((o) => o.id === status);
        return option ? option.label : "Không xác định";
    };

    const getPriorityColor = (priority) => { // map priority -> className màu
        switch (priority) {
            case "high":
                return "high";
            case "medium":
                return "medium";
            case "low":
                return "low";
            default:
                return "medium";
        }
    };

    const getPriorityText = (priority) => { // map priority -> nhãn hiển thị
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

    const getTypeInfo = (type) => { // lấy info type (icon + label) hoặc default
        return (
            reportTypes.find((t) => t.id === type) || {
                label: "Không xác định",
                icon: "📝",
            }
        );
    };

    return (
        <div className="admin-reports">
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
                            <div className="col">Mã</div>
                            <div className="col">Người báo cáo</div>
                            <div className="col">Loại</div>
                            <div className="col">Trạm sạc</div>
                            <div className="col">Tiêu đề</div>
                            <div className="col">Mức độ</div>
                            <div className="col">Trạng thái</div>
                            <div className="col">Thời gian</div>
                            <div className="col actions">Thao tác</div>
                        </div>
                        <div className="table-body"> {/* thân bảng: xử lý 4 trạng thái (loading, error, empty, data) */}
                            {loading ? ( // trạng thái đang tải danh sách
                                <div className="table-row loading">
                                    <div
                                        className="col"
                                        style={{
                                            gridColumn: "1 / -1",
                                            textAlign: "center",
                                            padding: "2rem",
                                        }}
                                    >
                                        Đang tải dữ liệu...
                                    </div>
                                </div>
                            ) : error ? ( // trạng thái lỗi fetch
                                <div className="table-row empty">
                                    <div
                                        className="col"
                                        style={{
                                            gridColumn: "1 / -1",
                                            textAlign: "center",
                                            padding: "2rem",
                                            color: "red",
                                        }}
                                    >
                                        {error}
                                    </div>
                                </div>
                            ) : reports.length === 0 ? ( // không có dữ liệu báo cáo
                                <div className="table-row empty">
                                    <div
                                        className="col"
                                        style={{
                                            gridColumn: "1 / -1",
                                            textAlign: "center",
                                            padding: "2rem",
                                        }}
                                    >
                                        Chưa có báo cáo nào.
                                    </div>
                                </div>
                            ) : ( // có dữ liệu -> render từng dòng báo cáo
                                reports.map((report, index) => ( // lặp mảng reports
                                    <div key={report._id || index} className="table-row">
                                        <div className="col"> {/* cột mã rút gọn 6 ký tự cuối */}
                                            <span className="report-id">
                                                {report._id
                                                    ? report._id
                                                        .substring(report._id.length - 6)
                                                        .toUpperCase()
                                                    : "N/A"}
                                            </span>
                                        </div>
                                        <div className="col"> {/* người báo cáo (tên / email) */}
                                            <span
                                                className="reporter-name"
                                                title={
                                                    report.reporterId?.fullName ||
                                                    report.reporterId?.email
                                                }
                                            >
                                                {report.reporterId?.fullName ||
                                                    report.reporterId?.email ||
                                                    "N/A"}
                                            </span>
                                        </div>
                                        <div className="col"> {/* loại báo cáo: icon + label */}
                                            <div className="report-type">
                                                <span className="type-icon">
                                                    {getTypeInfo(report.type).icon}
                                                </span>
                                                <span className="type-label">
                                                    {getTypeInfo(report.type).label}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="col"> {/* tên trạm sạc liên quan */}
                                            <span
                                                className="station-id"
                                                title={report.stationId?.name}
                                            >
                                                {report.stationId?.name || "N/A"}
                                            </span>
                                        </div>
                                        <div className="col"> {/* tiêu đề mô tả ngắn */}
                                            <span className="report-title" title={report.title}>
                                                {report.title}
                                            </span>
                                        </div>
                                        <div className="col"> {/* mức độ ưu tiên -> badge màu */}
                                            <span
                                                className={`priority-badge ${getPriorityColor(
                                                    report.priority
                                                )}`}
                                            >
                                                {getPriorityText(report.priority)}
                                            </span>
                                        </div>
                                        <div className="col"> {/* trạng thái -> badge + dot */}
                                            <span
                                                className={`status-badge ${getStatusColor(
                                                    report.status
                                                )}`}
                                            >
                                                <span className="status-dot"></span>
                                                {getStatusText(report.status)}
                                            </span>
                                        </div>
                                        <div className="col"> {/* thời gian tạo (format vi-VN) */}
                                            <span className="created-time">
                                                {report.createdAt
                                                    ? new Date(
                                                        report.createdAt
                                                    ).toLocaleDateString("vi-VN")
                                                    : "N/A"}
                                            </span>
                                        </div>
                                        <div className="col actions"> {/* nút thao tác: cập nhật trạng thái / xóa */}
                                            <button
                                                className="btn-icon edit"
                                                title="Cập nhật trạng thái"
                                                onClick={() => openStatusModal(report)}
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

            {/* Status Modal: cập nhật trạng thái báo cáo */}
            {showStatusModal && selectedReport && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowStatusModal(false)}
                >
                    <div
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Cập nhật trạng thái</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowStatusModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="report-summary">
                                <p>
                                    <strong>Mã báo cáo:</strong>{" "}
                                    {selectedReport._id
                                        ?.substring(selectedReport._id.length - 6)
                                        .toUpperCase()}
                                </p>
                                <p>
                                    <strong>Tiêu đề:</strong> {selectedReport.title}
                                </p>
                                <p>
                                    <strong>Mô tả:</strong> {selectedReport.description}
                                </p>
                            </div>

                            <div className="status-selection">
                                <label>Chọn trạng thái mới:</label>
                                <div className="status-options">
                                    {statusOptions.map((option) => (
                                        <div
                                            key={option.id}
                                            className={`status-option-btn ${option.id} ${tempStatus === option.id ? "active" : ""
                                                }`}
                                            onClick={() => setTempStatus(option.id)}
                                        >
                                            <span className="status-dot"></span>
                                            <span className="status-label">{option.label}</span>
                                            <span className="check-icon">✓</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowStatusModal(false)}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="btn-confirm"
                                    onClick={handleConfirmStatusUpdate}
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal: xác nhận xóa báo cáo */}
            {showDeleteModal && reportToDelete && (
                <div
                    className="modal-overlay"
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div
                        className="modal-content delete-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h3>Xác nhận xóa</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <p>Bạn có chắc chắn muốn xóa báo cáo này không?</p>
                            <div className="report-summary warning">
                                <p>
                                    <strong>Mã:</strong>{" "}
                                    {reportToDelete._id
                                        ?.substring(reportToDelete._id.length - 6)
                                        .toUpperCase()}
                                </p>
                                <p>
                                    <strong>Tiêu đề:</strong> {reportToDelete.title}
                                </p>
                            </div>
                            <p className="warning-text">
                                Hành động này không thể hoàn tác.
                            </p>
                            <div className="modal-actions">
                                <button
                                    className="btn-cancel"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    className="btn-delete-confirm"
                                    onClick={handleDeleteReport}
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

export default AdminReports;
