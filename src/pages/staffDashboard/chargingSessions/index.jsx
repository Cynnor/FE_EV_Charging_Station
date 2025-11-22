// ChargingSessions page
// Mục đích: Hiển thị các phiên sạc đang hoạt động + lịch sử đã kết thúc cho Staff.
// Chức năng chính:
//  - Tải danh sách phiên sạc từ API (/charging/sessions)
//  - Phân loại active vs completed/cancelled/success
//  - Gộp (merge) các phiên kết thúc liên tiếp cùng station + biển số + status (khoảng cách <= 10 phút)
//  - Xem chi tiết phiên sạc (modal)
//  - Xem chi tiết đặt chỗ liên quan (reservation) (modal)
//  - Scan/check-in QR (StaffQrCheckin component)
//  - Các helper format thời gian, tiến độ sạc giả lập, duration
import { useEffect, useMemo, useState } from "react";
import api from "../../../config/api";
import "./modal-styles.scss";
import StaffQrCheckin from "../../../components/staffQrCheckin";

const ChargingSessions = () => {
    // Tab đang được chọn: 'current' hoặc 'completed'
    const [activeTab, setActiveTab] = useState("current");
    const [selectedSession, setSelectedSession] = useState(null); // (Hiện chưa dùng trong phiên bản này – reserved cho mở rộng: chọn một phiên để thao tác nhanh)
    // Mảng tất cả phiên sạc fetch từ API
    const [sessions, setSessions] = useState([]);
    // Loading danh sách phiên sạc
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reservationDetail, setReservationDetail] = useState(null); // Object chi tiết đặt chỗ (reservation) được chuẩn hoá để hiển thị modal
    const [reservationLoading, setReservationLoading] = useState(false); // Flag đang tải chi tiết reservation
    const [reservationError, setReservationError] = useState(""); // Thông báo lỗi khi tải reservation thất bại
    const [sessionDetailModal, setSessionDetailModal] = useState(false); // Boolean mở/đóng modal chi tiết phiên sạc
    const [sessionDetailData, setSessionDetailData] = useState(null); // Dữ liệu chi tiết phiên sạc fetch từ API (/charging/sessions/:id)
    const [sessionDetailLoading, setSessionDetailLoading] = useState(false); // Flag đang tải dữ liệu phiên sạc
    const [sessionDetailError, setSessionDetailError] = useState(""); // Thông báo lỗi khi tải chi tiết phiên sạc

    // Tải danh sách phiên sạc từ backend.
    // Chuẩn hoá payload vì backend có thể trả { data: { items } } hoặc { items }.
    const loadSessions = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/charging/sessions", {
                params: { limit: 120 },
            });
            const payload = res.data?.data || res.data || {};
            const items = payload.items || [];
            setSessions(items);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải danh sách phiên sạc.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Chạy một lần khi component mount để lấy danh sách phiên sạc ban đầu
        loadSessions();
    }, []);

    // Phiên đang hoạt động (status === 'active')
    const currentSessions = useMemo(
        () => sessions.filter((s) => s.status === "active"),
        [sessions]
    );

    // Phiên đã kết thúc / huỷ / thanh toán xong
    const completedSessions = useMemo(
        () =>
            sessions.filter((s) =>
                ["completed", "cancelled", "success"].includes(s.status)
            ),
        [sessions]
    );

    // Gộp các phiên kết thúc liên tiếp theo (stationName + biển số + status)
    // Mục tiêu: giảm số dòng hiển thị nếu backend tạo nhiều phiên nhỏ liền nhau.
    // Điều kiện gộp: phiên sau bắt đầu trong vòng <= 10 phút sau khi phiên trước kết thúc.
    const mergedCompletedSessions = useMemo(() => {
        if (completedSessions.length === 0) return [];

        // Nhóm phiên theo: tên trạm + biển số xe + trạng thái (giúp xử lý gộp theo nhóm)
        const groups = {};

        completedSessions.forEach(session => {
            const stationName = session.slot?.port?.station?.name || 'N/A';
            const plate = session.vehicle?.plateNumber || 'Ẩn biển số';
            const status = session.status || 'completed';
            const key = `${stationName}|||${plate}|||${status}`;

            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(session);
        });

        // Mảng kết quả sau khi gộp các phiên liên tiếp trong từng nhóm
        const merged = [];

        Object.values(groups).forEach(groupSessions => {
            // Sắp xếp các phiên trong nhóm theo thời gian bắt đầu (tăng dần) để kiểm tra tính liên tiếp
            groupSessions.sort((a, b) =>
                new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
            );

            // Ngưỡng gộp: nếu phiên sau bắt đầu trong vòng <= 10 phút kể từ thời điểm kết thúc phiên trước
            const TIME_GAP_MS = 10 * 60 * 1000; // 10 phút (10 * 60 * 1000 ms)
            let currentMerged = { ...groupSessions[0] };

            for (let i = 1; i < groupSessions.length; i++) { // Duyệt từ phần tử thứ hai để so sánh với phiên đã gộp trước đó
                const current = groupSessions[i];
                const prevEnd = new Date(currentMerged.endedAt || currentMerged.startedAt).getTime();
                const currentStart = new Date(current.startedAt).getTime();

                // Nếu phiên hiện tại bắt đầu đủ gần (<= 10 phút) so với phiên đã gộp trước đó → gộp
                if (currentStart - prevEnd <= TIME_GAP_MS) {
                    // Cập nhật thời gian kết thúc của phiên gộp để kéo dài đến phiên hiện tại
                    currentMerged.endedAt = current.endedAt;
                    // Giữ nguyên ID phiên đầu (dùng cho nút "Chi tiết")
                    // Trạng thái giống nhau do đã nhóm theo status
                } else {
                    // Khoảng cách quá xa → đẩy phiên gộp hiện tại vào kết quả và bắt đầu phiên gộp mới
                    merged.push(currentMerged);
                    currentMerged = { ...current };
                }
            }

            // Thêm phiên gộp cuối cùng còn lại sau vòng lặp
            merged.push(currentMerged);
        });

        // Sắp xếp kết quả cuối cùng theo thời gian bắt đầu giảm dần (phiên mới nhất lên đầu)
        return merged.sort((a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
    }, [completedSessions]);

    // Chuẩn hoá thời gian hiển thị (locale VN). Nếu lỗi -> fallback chuỗi thô.
    const formatTime = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleString("vi-VN");
        } catch (e) {
            return String(value);
        }
    };

    // Tính thời lượng giữa start - end (hiển thị phút hoặc h/m)
    const calcDuration = (start, end) => {
        if (!start || !end) return "—";
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        if (Number.isNaN(diffMs)) return "—";
        const minutes = Math.max(0, Math.round(diffMs / 60000));
        if (minutes < 60) return `${minutes} phút`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}m`;
    };

    // Ước lượng % pin đã đạt được dựa trên tốc độ sạc (chargeRatePercentPerMinute)
    // Đây là phép tính giả lập, không dùng dữ liệu real-time.
    const calcProgress = (session) => {
        if (!session?.startedAt) return 0;
        const start = new Date(session.startedAt).getTime();
        const now = Date.now();
        const elapsedMinutes = Math.max(0, (now - start) / 60000);
        const initial = session.initialPercent || 0;
        const target = session.targetPercent || 100;
        const rate = session.chargeRatePercentPerMinute || 0;
        const projected = Math.min(100, initial + rate * elapsedMinutes);
        return Math.min(target, projected);
    };

    // Chuẩn hoá object reservation về cấu trúc phẳng, tránh nested phức tạp.
    const normalizeReservation = (data = {}) => {
        const vehicle = data.vehicle || {};
        const item = (data.items || [])[0] || {};
        const slot = item.slot || data.slot || {};
        const port = slot.port || data.port || {};
        const station = port.station || data.station || {};

        return {
            id: data._id || data.id,
            status: data.status,
            qrCheck: Boolean(data.qrCheck),
            startAt:
                item.startAt ||
                item.startedAt ||
                data.startAt ||
                data.startedAt,
            endAt: item.endAt || item.endedAt || data.endAt || data.endedAt,
            vehicle: {
                plate: vehicle.plateNumber || data.plateNumber || "N/A",
                make: vehicle.make || "",
                model: vehicle.model || "",
                color: vehicle.color || "",
            },
            station: {
                name: station.name || "N/A",
                address: station.address || "N/A",
                provider: station.provider || "",
            },
            port: {
                type: port.type || "N/A",
                power: port.powerKw ? `${port.powerKw} kW` : "N/A",
                price: port.price,
            },
        };
    };

    // Mở modal reservation: lấy ID từ nhiều nguồn -> fetch chi tiết -> cập nhật state.
    const handleViewReservation = async (session) => {
        setReservationError("");
        setReservationDetail(normalizeReservation(session)); // show modal while loading
        setReservationLoading(true);

        const reservationId =
            session.reservationId ||
            session.metadata?.reservationId ||
            session.reservation?.id ||
            session.reservation?._id ||
            session.id ||
            session._id;

        if (!reservationId) {
            setReservationError("Không tìm thấy mã đặt chỗ.");
            setReservationLoading(false);
            return;
        }

        try {
            const res = await api.get(`/reservations/${reservationId}`);
            const detail = res.data?.data || res.data || {};
            setReservationDetail(normalizeReservation(detail));
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải chi tiết đặt chỗ.";
            setReservationError(msg);
        } finally {
            setReservationLoading(false);
        }
    };

    const closeReservationModal = () => {
        // Reset toàn bộ state liên quan đến modal reservation để đóng sạch
        setReservationDetail(null);
        setReservationError("");
        setReservationLoading(false);
    };

    // Load chi tiết phiên sạc cụ thể và mở modal.
    const loadSessionDetail = async (sessionId) => {
        try {
            setSessionDetailLoading(true);
            setSessionDetailError("");
            const res = await api.get(`/charging/sessions/${sessionId}`);
            const data = res.data?.data || res.data;
            setSessionDetailData(data);
            setSessionDetailModal(true);
        } catch (err) {
            const msg = err?.response?.data?.message || "Không thể tải chi tiết phiên sạc.";
            setSessionDetailError(msg);
            alert(msg);
        } finally {
            setSessionDetailLoading(false);
        }
    };

    const closeSessionDetailModal = () => {
        // Reset state khi đóng modal chi tiết phiên sạc
        setSessionDetailModal(false);
        setSessionDetailData(null);
        setSessionDetailError("");
    };

    // Map status kỹ thuật sang tiếng Việt thân thiện cho UI.
    const renderStatusText = (status) => {
        const map = {
            pending: "Đang chờ",
            confirmed: "Đã xác nhận",
            cancelled: "Đã hủy",
            "payment-success": "Đã thanh toán",
            success: "Đã thanh toán",
            completed: "Chưa thanh toán",
            active: "Đang sạc",
        };
        return map[status] || status || "N/A";
    };

    // Xác định tone màu CSS chip theo status.
    const getStatusTone = (status) => {
        const normalized = String(status || "").toLowerCase();
        if (["success", "payment-success"].includes(normalized)) return "paid";
        if (normalized === "completed") return "done";
        if (normalized === "cancelled") return "cancelled";
        if (normalized === "active" || normalized === "confirmed") return "active";
        return "pending";
    };

    return (
        <>
            <div className="charging-sessions-content"> {/* Wrapper toàn bộ nội dung trang quản lý phiên sạc */}
                <StaffQrCheckin /> {/* Khối quét QR để staff check-in reservation đã xác nhận */}
                {/* Khu vực tiêu đề trang */}
                <div className="sessions-header">
                    <div className="header-left">
                        <h2>Quản lý phiên sạc</h2>
                        <p>Quản lý các phiên sạc đang diễn ra và lịch sử</p>
                    </div>
                    <div className="header-right">
                        <button className="btn-primary" onClick={loadSessions}> {/* Nút làm mới danh sách phiên sạc */}
                            <span className="icon">🔄</span>
                            Làm mới
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="sessions-error">
                        <p>{error}</p>
                    </div>
                )}

                {/* Thanh chuyển tab giữa phiên "Đang sạc" và "Đã hoàn thành" */}
                <div className="sessions-tabs">
                    <button
                        className={`tab ${activeTab === "current" ? "active" : ""}`}
                        onClick={() => setActiveTab("current")}
                    >
                        <span className="icon">🔌</span>
                        Đang sạc ({currentSessions.length})
                    </button>
                    <button
                        className={`tab ${activeTab === "completed" ? "active" : ""}`}
                        onClick={() => setActiveTab("completed")}
                    >
                        <span className="icon">✅</span>
                        Đã hoàn thành ({mergedCompletedSessions.length})
                    </button>
                </div>

                {/* Nội dung hiển thị theo tab đang chọn */}
                <div className="sessions-content">
                    {activeTab === "current" && (
                        <div className="current-sessions">
                            {loading ? (
                                <p className="muted">Đang tải dữ liệu...</p>
                            ) : currentSessions.length === 0 ? (
                                <p className="muted">Chưa có phiên sạc đang hoạt động.</p>
                            ) : (
                                <div className="sessions-grid">
                                    {currentSessions.map((session) => {
                                        const progress = Math.round(calcProgress(session)); // Tiến độ sạc ước lượng (chưa hiển thị trực quan ở phiên bản này)
                                        return (
                                            <div key={session._id || session.id} className="session-card"> {/* Card mỗi phiên active */}
                                                <div className="card-header">
                                                    <div className="station-info">
                                                        <span className="station-id">
                                                            {(session.slot?.port?.station?.name) || "N/A"}
                                                        </span>
                                                        <span className="license-plate">
                                                            {session.vehicle?.plateNumber || "Ẩn biển số"}
                                                        </span>
                                                    </div>
                                                    <div className={`session-status ${session.status}`}> {/* Hiển thị trạng thái trực quan cho phiên active */}
                                                        <span className="status-dot"></span>
                                                        Đang sạc
                                                    </div>
                                                </div>

                                                <div className="customer-info">
                                                    <div className="info-item">
                                                        <span className="label">Xe:</span>
                                                        <span className="value">
                                                            {session.vehicle?.make} {session.vehicle?.model}
                                                        </span>
                                                    </div>
                                                    <div className="info-item">
                                                        <span className="label">Trạm:</span>
                                                        <span className="value">
                                                            {session.slot?.port?.station?.address || "Không rõ"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="session-details">
                                                    <div className="detail-row">
                                                        <div className="detail-item">
                                                            <span className="label">Bắt đầu:</span>
                                                            <span className="value">{formatTime(session.startedAt)}</span>
                                                        </div>
                                                        <div className="detail-item">
                                                            <span className="label">Công suất:</span>
                                                            <span className="value">
                                                                {session.slot?.port?.powerKw
                                                                    ? `${session.slot.port.powerKw} kW`
                                                                    : "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>


                                                {session.vehicle?.pin !== undefined && (
                                                    <div className="session-details" style={{ marginTop: '12px' }}>
                                                        <div className="detail-row">
                                                            <div className="detail-item">
                                                                <span className="label">Pin hiện tại:</span>
                                                                <span className="value">{session.vehicle.pin}%</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="session-actions" style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                                    <button
                                                        className="btn-detail"
                                                        onClick={() => loadSessionDetail(session._id || session.id)}
                                                        disabled={sessionDetailLoading}
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "completed" && (
                        <div className="completed-sessions">
                            {loading ? (
                                <p className="muted">Đang tải dữ liệu...</p>
                            ) : mergedCompletedSessions.length === 0 ? (
                                <p className="muted">Chưa có phiên sạc đã hoàn tất.</p>
                            ) : (
                                <div className="sessions-table">
                                    <div className="table-header">
                                        <div className="col">Trụ sạc</div>
                                        <div className="col">Biển số</div>
                                        <div className="col">Thời gian</div>
                                        <div className="col">Trạng thái</div>
                                        <div className="col">Hành động</div>
                                    </div>
                                    <div className="table-body">
                                        {mergedCompletedSessions.map((session) => (
                                            <div key={session._id || session.id} className="table-row"> {/* Dòng bảng cho mỗi phiên đã gộp */}
                                                <div className="col">
                                                    <span className="station-id">
                                                        {session.slot?.port?.station?.name || "N/A"}
                                                    </span>
                                                </div>
                                                <div className="col">
                                                    <span className="license-plate">
                                                        {session.vehicle?.plateNumber || "Ẩn biển số"}
                                                    </span>
                                                </div>
                                                <div className="col">
                                                    <div className="time-info">
                                                        <span className="start">{formatTime(session.startedAt)}</span>
                                                        <span className="end">{formatTime(session.endedAt)}</span>
                                                        <span className="duration">
                                                            ({calcDuration(session.startedAt, session.endedAt)})
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="col">
                                                    <span className={`status-chip ${getStatusTone(session.status)}`}>
                                                        <span className="status-dot"></span>
                                                        {renderStatusText(session.status)}
                                                    </span>
                                                </div>
                                                <div className="col">
                                                    <button
                                                        className="btn-detail-small"
                                                        onClick={() => loadSessionDetail(session._id || session.id)}
                                                        disabled={sessionDetailLoading}
                                                    >
                                                        Chi tiết
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Pattern điều kiện với toán tử && (short-circuit):
                - Nếu reservationDetail khác null/undefined/false → biểu thức trước && là truthy → React render phần sau.
                - Nếu reservationDetail là null/undefined → không render modal.
                Mục đích: chỉ hiển thị modal chi tiết đặt chỗ khi đã có dữ liệu reservationDetail. */}
            {reservationDetail && (
                <div className="reservation-modal-overlay" onClick={closeReservationModal}>
                    <div className="reservation-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <p className="micro-label">Chi tiết đặt chỗ</p>
                                <h3>{reservationDetail.station.name}</h3>
                                <p className="muted">{reservationDetail.station.address}</p>
                            </div>
                            <button className="close-button" onClick={closeReservationModal}>
                                ✕
                            </button>
                        </div>

                        {reservationLoading ? (
                            <p className="muted">Đang tải...</p>
                        ) : reservationError ? (
                            <p className="error-text">{reservationError}</p>
                        ) : (
                            <div className="reservation-detail-grid">
                                <div className="detail-card">
                                    <span className="label">Khách</span>
                                    <strong>{reservationDetail.vehicle.plate}</strong>
                                    <p className="muted">
                                        {reservationDetail.vehicle.make} {reservationDetail.vehicle.model}{" "}
                                        {reservationDetail.vehicle.color}
                                    </p>
                                </div>
                                <div className="detail-card">
                                    <span className="label">Trạng thái</span>
                                    <strong>{renderStatusText(reservationDetail.status)}</strong>
                                    <p className="muted">QR: {reservationDetail.qrCheck ? "Đã kiểm tra" : "Chưa kiểm"}</p>
                                </div>
                                <div className="detail-card">
                                    <span className="label">Thời gian</span>
                                    <p className="muted">Bắt đầu: {formatTime(reservationDetail.startAt)}</p>
                                    <p className="muted">Kết thúc: {formatTime(reservationDetail.endAt)}</p>
                                </div>
                                <div className="detail-card">
                                    <span className="label">Cổng</span>
                                    <strong>{reservationDetail.port.type}</strong>
                                    <p className="muted">
                                        Công suất: {reservationDetail.port.power}
                                        {reservationDetail.port.price
                                            ? ` • Giá: ${new Intl.NumberFormat("vi-VN").format(reservationDetail.port.price)} đ/kWh`
                                            : ""}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pattern điều kiện ghép nhiều điều kiện:
                                sessionDetailModal && sessionDetailData && (...)
                                Ý nghĩa:
                                    1. Kiểm tra cờ mở modal (sessionDetailModal phải true)
                                    2. Kiểm tra đã có dữ liệu chi tiết (sessionDetailData phải truthy)
                                Chỉ khi cả hai điều kiện đều đúng mới render modal phiên sạc. */}
            {sessionDetailModal && sessionDetailData && (
                <div className="modal-backdrop" onClick={closeSessionDetailModal}>
                    <div className="modal-session-detail" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Chi tiết phiên sạc</h3>
                            <button className="modal-close" onClick={closeSessionDetailModal}>✕</button>
                        </div>

                        <div className="modal-body">
                            {sessionDetailLoading ? (
                                <p>Đang tải...</p>
                            ) : sessionDetailError ? (
                                <p className="error-text">{sessionDetailError}</p>
                            ) : (
                                <>
                                    <div className="detail-section">
                                        <h4>Thông tin xe</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="label">Biển số:</span>
                                                <span className="value">{sessionDetailData.vehicle?.plateNumber || "Ẩn"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Hãng xe:</span>
                                                <span className="value">{sessionDetailData.vehicle?.make || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Mẫu xe:</span>
                                                <span className="value">{sessionDetailData.vehicle?.model || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Màu sắc:</span>
                                                <span className="value">{sessionDetailData.vehicle?.color || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Dung lượng pin:</span>
                                                <span className="value">
                                                    {sessionDetailData.vehicle?.batteryCapacity ? `${sessionDetailData.vehicle.batteryCapacity} kWh` : "N/A"}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Loại kết nối:</span>
                                                <span className="value">{sessionDetailData.vehicle?.connectorType || "N/A"}</span>
                                            </div>
                                            {sessionDetailData.vehicle?.pin !== undefined && (
                                                <div className="detail-item">
                                                    <span className="label">Pin hiện tại:</span>
                                                    <span className="value strong">{sessionDetailData.vehicle.pin}%</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Thông tin trạm</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="label">Tên trạm:</span>
                                                <span className="value">{sessionDetailData.slot?.port?.station?.name || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Địa chỉ:</span>
                                                <span className="value">{sessionDetailData.slot?.port?.station?.address || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Nhà cung cấp:</span>
                                                <span className="value">{sessionDetailData.slot?.port?.station?.provider || "N/A"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Thông tin cổng sạc</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="label">Loại:</span>
                                                <span className="value">{sessionDetailData.slot?.port?.type || "N/A"}</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Công suất:</span>
                                                <span className="value">
                                                    {sessionDetailData.slot?.port?.powerKw ? `${sessionDetailData.slot.port.powerKw} kW` : "N/A"}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Giá:</span>
                                                <span className="value">
                                                    {sessionDetailData.slot?.port?.price ? `${sessionDetailData.slot.port.price.toLocaleString('vi-VN')} VNĐ/kWh` : "N/A"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-section">
                                        <h4>Chi tiết phiên sạc</h4>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <span className="label">Trạng thái:</span>
                                                <span className={`value status-chip ${getStatusTone(sessionDetailData.status)}`}>
                                                    <span className="status-dot"></span>
                                                    {renderStatusText(sessionDetailData.status)}
                                                </span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Bắt đầu:</span>
                                                <span className="value">{formatTime(sessionDetailData.startedAt)}</span>
                                            </div>
                                            {sessionDetailData.endedAt && (
                                                <div className="detail-item">
                                                    <span className="label">Kết thúc:</span>
                                                    <span className="value">{formatTime(sessionDetailData.endedAt)}</span>
                                                </div>
                                            )}
                                            {sessionDetailData.endedAt && (
                                                <div className="detail-item">
                                                    <span className="label">Thời lượng:</span>
                                                    <span className="value">
                                                        {calcDuration(sessionDetailData.startedAt, sessionDetailData.endedAt)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="detail-item">
                                                <span className="label">Pin ban đầu:</span>
                                                <span className="value">{sessionDetailData.initialPercent || 0}%</span>
                                            </div>
                                            <div className="detail-item">
                                                <span className="label">Pin mục tiêu:</span>
                                                <span className="value">{sessionDetailData.targetPercent || 100}%</span>
                                            </div>
                                            {sessionDetailData.chargeRatePercentPerMinute && (
                                                <div className="detail-item">
                                                    <span className="label">Tốc độ sạc:</span>
                                                    <span className="value">{sessionDetailData.chargeRatePercentPerMinute}%/phút</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="modal-footer"> {/* Khu vực chân modal phiên sạc */}
                            <button className="btn-secondary" onClick={closeSessionDetailModal}>
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChargingSessions;
