import { useEffect, useMemo, useState } from "react";
import api from "../../../config/api";
import "./index.scss";
import "./modal-styles.scss";
import StaffQrCheckin from "../../../components/staffQrCheckin";

const ChargingSessions = () => {
    const [activeTab, setActiveTab] = useState("current");
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [reservationDetail, setReservationDetail] = useState(null);
    const [reservationLoading, setReservationLoading] = useState(false);
    const [reservationError, setReservationError] = useState("");
    const [sessionDetailModal, setSessionDetailModal] = useState(false);
    const [sessionDetailData, setSessionDetailData] = useState(null);
    const [sessionDetailLoading, setSessionDetailLoading] = useState(false);
    const [sessionDetailError, setSessionDetailError] = useState("");

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
        loadSessions();
    }, []);

    const currentSessions = useMemo(
        () => sessions.filter((s) => s.status === "active"),
        [sessions]
    );

    const completedSessions = useMemo(
        () =>
            sessions.filter((s) =>
                ["completed", "cancelled", "success"].includes(s.status)
            ),
        [sessions]
    );

    // Merge consecutive sessions by station, plate, and status
    const mergedCompletedSessions = useMemo(() => {
        if (completedSessions.length === 0) return [];

        // Group sessions by station, plate, and status
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

        // Merge consecutive sessions in each group
        const merged = [];

        Object.values(groups).forEach(groupSessions => {
            // Sort by start time ascending
            groupSessions.sort((a, b) =>
                new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime()
            );

            // Merge consecutive sessions (within 10 minutes gap)
            const TIME_GAP_MS = 10 * 60 * 1000; // 10 minutes
            let currentMerged = { ...groupSessions[0] };

            for (let i = 1; i < groupSessions.length; i++) {
                const current = groupSessions[i];
                const prevEnd = new Date(currentMerged.endedAt || currentMerged.startedAt).getTime();
                const currentStart = new Date(current.startedAt).getTime();

                // If sessions are consecutive (within 10 min), merge them
                if (currentStart - prevEnd <= TIME_GAP_MS) {
                    // Extend the merged session's end time
                    currentMerged.endedAt = current.endedAt;
                    // Keep the first session's ID for "Chi tiết" button
                    // Status should be the same since they're in the same group
                } else {
                    // Gap is too large, save current merged session and start new one
                    merged.push(currentMerged);
                    currentMerged = { ...current };
                }
            }

            // Don't forget the last merged session
            merged.push(currentMerged);
        });

        // Sort final result by start time descending (newest first)
        return merged.sort((a, b) =>
            new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
        );
    }, [completedSessions]);

    const formatTime = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleString("vi-VN");
        } catch (e) {
            return String(value);
        }
    };

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
        setReservationDetail(null);
        setReservationError("");
        setReservationLoading(false);
    };

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
        setSessionDetailModal(false);
        setSessionDetailData(null);
        setSessionDetailError("");
    };

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
            <div className="charging-sessions-content">
                <StaffQrCheckin />
                {/* Header */}
                <div className="sessions-header">
                    <div className="header-left">
                        <h2>Quản lý phiên sạc</h2>
                        <p>Quản lý các phiên sạc đang diễn ra và lịch sử</p>
                    </div>
                    <div className="header-right">
                        <button className="btn-primary" onClick={loadSessions}>
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

                {/* Tabs */}
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

                {/* Content */}
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
                                        const progress = Math.round(calcProgress(session));
                                        return (
                                            <div key={session._id || session.id} className="session-card">
                                                <div className="card-header">
                                                    <div className="station-info">
                                                        <span className="station-id">
                                                            {(session.slot?.port?.station?.name) || "N/A"}
                                                        </span>
                                                        <span className="license-plate">
                                                            {session.vehicle?.plateNumber || "Ẩn biển số"}
                                                        </span>
                                                    </div>
                                                    <div className={`session-status ${session.status}`}>
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
                                            <div key={session._id || session.id} className="table-row">
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

                        <div className="modal-footer">
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
