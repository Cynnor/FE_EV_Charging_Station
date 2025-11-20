import { useEffect, useMemo, useState } from "react";
import api from "../../../config/api";
import "./index.scss";

const ChargingSessions = () => {
    const [activeTab, setActiveTab] = useState("current");
    const [selectedSession, setSelectedSession] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

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

    return (
        <div className="charging-sessions-content">
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
                    Đã hoàn thành ({completedSessions.length})
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

                                            <div className="progress-section">
                                                <div className="progress-header">
                                                    <span className="label">Tiến độ dự kiến</span>
                                                    <span className="percentage">
                                                        {isNaN(progress) ? "—" : `${progress}%`}
                                                    </span>
                                                </div>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill"
                                                        style={{ width: `${Math.min(100, Math.max(0, progress || 0))}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="session-actions">
                                                <button
                                                    className="btn-secondary"
                                                    onClick={() => setSelectedSession(session)}
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
                        ) : completedSessions.length === 0 ? (
                            <p className="muted">Chưa có phiên sạc đã hoàn tất.</p>
                        ) : (
                            <div className="sessions-table">
                                <div className="table-header">
                                    <div className="col">Trụ sạc</div>
                                    <div className="col">Biển số</div>
                                    <div className="col">Thời gian</div>
                                    <div className="col">Chi tiết</div>
                                    <div className="col">Trạng thái</div>
                                </div>
                                <div className="table-body">
                                    {completedSessions.map((session) => (
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
                                                <div className="customer-info">
                                                    <span className="name">
                                                        {session.vehicle?.make} {session.vehicle?.model}
                                                    </span>
                                                    <span className="phone">
                                                        Slot #{session.slot?.order || "—"}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="col">
                                                <span className={`status ${session.status}`}>
                                                    <span className="status-dot"></span>
                                                    {session.status}
                                                </span>
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
    );
};

export default ChargingSessions;
