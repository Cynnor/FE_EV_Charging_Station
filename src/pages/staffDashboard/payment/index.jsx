import { useEffect, useMemo, useState } from "react";
import api from "../../../config/api";
import "./index.scss";

const Payment = () => {
    const [selectedSession, setSelectedSession] = useState(null);
    const [reservations, setReservations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadReservations = async () => {
        try {
            setLoading(true);
            setError("");
            const res = await api.get("/reservations", { params: { limit: 200 } });
            const payload = res.data?.data || res.data || {};
            setReservations(payload.items || payload);
        } catch (err) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Không thể tải danh sách đặt chỗ.";
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadReservations();
    }, []);

    const formatTime = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleString("vi-VN");
        } catch (e) {
            return String(value);
        }
    };

    const getStationName = (reservation) =>
        reservation?.items?.[0]?.slot?.port?.station?.name || "N/A";

    const getPlate = (reservation) =>
        reservation?.vehicle?.plateNumber || "Ẩn biển số";

    const paymentHistory = useMemo(
        () =>
            (reservations || []).filter((r) =>
                ["payment-success", "completed"].includes(r.status)
            ),
        [reservations]
    );

    return (
        <div className="payment-content">
            {/* Header */}
            <div className="payment-header">
                <div className="header-left">
                    <h2>Lịch sử thanh toán</h2>
                    <p>Theo dõi các giao dịch đã hoàn tất</p>
                </div>
                <div className="header-right">
                    <div className="payment-stats">
                        <div className="stat-item">
                            <span className="label">Giao dịch</span>
                            <span className="value">{paymentHistory.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Đang xem</span>
                            <span className="value">Đã thanh toán</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History only */}
            <div className="payment-history">
                <div className="history-table">
                    <div className="table-header">
                        <div className="col">Trụ sạc</div>
                        <div className="col">Biển số</div>
                        <div className="col">Thời gian</div>
                        <div className="col">Chi tiết</div>
                        <div className="col">Trạng thái</div>
                    </div>
                    <div className="table-body">
                        {loading ? (
                            <p className="muted">Đang tải dữ liệu...</p>
                        ) : paymentHistory.length === 0 ? (
                            <p className="muted">Chưa có lịch sử thanh toán.</p>
                        ) : (
                            paymentHistory.map((payment) => (
                                <div key={payment.id || payment._id} className="table-row">
                                    <div className="col">
                                        <span className="station-id">{getStationName(payment)}</span>
                                    </div>
                                    <div className="col">
                                        <span className="license-plate">{getPlate(payment)}</span>
                                    </div>
                                    <div className="col">
                                        <div className="time-info">
                                            <span className="start">{formatTime(payment.items?.[0]?.startAt)}</span>
                                            <span className="end">{formatTime(payment.items?.[0]?.endAt)}</span>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <div className="customer-info">
                                            <span className="name">
                                                {payment.vehicle?.make} {payment.vehicle?.model}
                                            </span>
                                            <span className="phone">Slot #{payment.items?.[0]?.slot?.order || "—"}</span>
                                        </div>
                                    </div>
                                    <div className="col">
                                        <span className={`status ${payment.status}`}>
                                            <span className="status-dot"></span>
                                            {payment.status}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
                {error && <p className="muted error-text">{error}</p>}
                {!loading && (
                    <div className="history-footer">
                        <button className="btn-secondary" onClick={loadReservations}>
                            Làm mới lịch sử
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Payment;
