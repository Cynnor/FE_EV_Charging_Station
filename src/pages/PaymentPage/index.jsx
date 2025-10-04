import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
const PRICE_TABLE = {
    energy: 3500, // đ/kWh (ví dụ)
    time: 2000, // đ/15 phút (ví dụ)
    subscription: {
        basic: 199000,
        standard: 299000,
        premium: 499000,
    },
};

export default function PaymentPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navigate = useNavigate();
    const { state } = useLocation();
    const station = state?.station || null;
    const defaults = state?.formData || {};

    const [planType, setPlanType] = useState("energy"); // energy | time | subscription
    const [energyKwh, setEnergyKwh] = useState(5);
    const [timeSlots, setTimeSlots] = useState(4); // đơn vị: 15 phút
    const [subscriptionTier, setSubscriptionTier] = useState("standard");
    const [paymentMethod, setPaymentMethod] = useState("e_wallet"); // e_wallet | banking | card | cod
    const [isPaying, setIsPaying] = useState(false);
    const [invoice, setInvoice] = useState(null);

    const totalAmount = useMemo(() => {
        if (planType === "energy") return energyKwh * PRICE_TABLE.energy;
        if (planType === "time") return timeSlots * PRICE_TABLE.time;
        if (planType === "subscription") return PRICE_TABLE.subscription[subscriptionTier] || 0;
        return 0;
    }, [planType, energyKwh, timeSlots, subscriptionTier]);

    const handleSandboxPay = () => {
        setIsPaying(true);
        setTimeout(() => {
            // Giả lập thanh toán thành công
            const code = "INV-" + Math.random().toString(36).slice(2, 8).toUpperCase();
            const now = new Date();
            setInvoice({
                code,
                createdAt: now.toLocaleString(),
                stationName: station?.name || "Không xác định",
                planType,
                energyKwh,
                timeSlots,
                subscriptionTier,
                paymentMethod,
                totalAmount,
                date: defaults?.date,
                startTime: defaults?.startTime,
            });
            setIsPaying(false);
        }, 1200);
    };

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="left">
                    <h1>Thanh toán</h1>

                    <div className="summary-card">
                        <h3>Thông tin đặt chỗ</h3>
                        <p><b>Trạm:</b> {station?.name || "—"}</p>
                        <p><b>Ngày sạc:</b> {defaults?.date || "—"}</p>
                        <p><b>Giờ bắt đầu:</b> {defaults?.startTime || "—"}</p>
                    </div>

                    <div className="plan-card">
                        <h3>Chọn hình thức</h3>
                        <div className="plan-types">
                            <label>
                                <input
                                    type="radio"
                                    name="planType"
                                    value="energy"
                                    checked={planType === "energy"}
                                    onChange={() => setPlanType("energy")}
                                />
                                Theo kWh
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="planType"
                                    value="time"
                                    checked={planType === "time"}
                                    onChange={() => setPlanType("time")}
                                />
                                Theo thời gian
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="planType"
                                    value="subscription"
                                    checked={planType === "subscription"}
                                    onChange={() => setPlanType("subscription")}
                                />
                                Gói thuê bao
                            </label>
                        </div>

                        {planType === "energy" && (
                            <div className="plan-inputs">
                                <label>
                                    Số kWh dự kiến
                                    <input
                                        type="number"
                                        min={1}
                                        step={0.5}
                                        value={energyKwh}
                                        onChange={(e) => setEnergyKwh(Number(e.target.value) || 0)}
                                    />
                                </label>
                                <p className="price-note">Đơn giá: {PRICE_TABLE.energy.toLocaleString()} đ/kWh</p>
                            </div>
                        )}

                        {planType === "time" && (
                            <div className="plan-inputs">
                                <label>
                                    Thời lượng (x15 phút)
                                    <input
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={timeSlots}
                                        onChange={(e) => setTimeSlots(Number(e.target.value) || 0)}
                                    />
                                </label>
                                <p className="price-note">Đơn giá: {PRICE_TABLE.time.toLocaleString()} đ/15 phút</p>
                            </div>
                        )}

                        {planType === "subscription" && (
                            <div className="plan-inputs grid">
                                <label>
                                    Gói thuê bao
                                    <select
                                        value={subscriptionTier}
                                        onChange={(e) => setSubscriptionTier(e.target.value)}
                                    >
                                        <option value="basic">Basic ({PRICE_TABLE.subscription.basic.toLocaleString()} đ/tháng)</option>
                                        <option value="standard">Standard ({PRICE_TABLE.subscription.standard.toLocaleString()} đ/tháng)</option>
                                        <option value="premium">Premium ({PRICE_TABLE.subscription.premium.toLocaleString()} đ/tháng)</option>
                                    </select>
                                </label>
                                <div className="sub-desc">
                                    <p>• Basic: 30 kWh/tháng</p>
                                    <p>• Standard: 60 kWh/tháng</p>
                                    <p>• Premium: 120 kWh/tháng</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="payment-methods">
                        <h3>Phương thức thanh toán</h3>
                        <div className="methods">
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="e_wallet"
                                    checked={paymentMethod === "e_wallet"}
                                    onChange={() => setPaymentMethod("e_wallet")}
                                />
                                Ví điện tử (Sandbox)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="banking"
                                    checked={paymentMethod === "banking"}
                                    onChange={() => setPaymentMethod("banking")}
                                />
                                Banking (Sandbox)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="card"
                                    checked={paymentMethod === "card"}
                                    onChange={() => setPaymentMethod("card")}
                                />
                                Thẻ (Sandbox)
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={() => setPaymentMethod("cod")}
                                />
                                Thanh toán tại trạm
                            </label>
                        </div>
                    </div>
                </div>

                <div className="right">
                    <div className="total-card">
                        <h3>Tạm tính</h3>
                        <div className="row">
                            <span>Hình thức</span>
                            <span className="value">
                                {planType === "energy" && "Theo kWh"}
                                {planType === "time" && "Theo thời gian"}
                                {planType === "subscription" && `Gói ${subscriptionTier}`}
                            </span>
                        </div>
                        <div className="row">
                            <span>Thành tiền</span>
                            <span className="value">{totalAmount.toLocaleString()} đ</span>
                        </div>
                        <button
                            className="pay-btn"
                            disabled={isPaying}
                            onClick={handleSandboxPay}
                        >
                            {isPaying ? "Đang xử lý..." : "Thanh toán (Sandbox)"}
                        </button>
                        <button className="back-btn" onClick={() => navigate(-1)}>Quay lại</button>
                    </div>

                    {invoice && (
                        <div className="invoice">
                            <h3>Hóa đơn điện tử</h3>
                            <p><b>Mã hóa đơn:</b> {invoice.code}</p>
                            <p><b>Thời gian:</b> {invoice.createdAt}</p>
                            <p><b>Trạm:</b> {invoice.stationName}</p>
                            <p><b>Hình thức:</b> {invoice.planType === "subscription" ? `Gói ${invoice.subscriptionTier}` : invoice.planType === "energy" ? `Theo kWh (${invoice.energyKwh} kWh)` : `Theo thời gian (${invoice.timeSlots * 15} phút)`}</p>
                            <p><b>Thanh toán qua:</b> {paymentMethod}</p>
                            <p className="grand-total"><b>Tổng tiền:</b> {invoice.totalAmount.toLocaleString()} đ</p>
                            <div className="invoice-actions">
                                <button onClick={() => window.print()}>In hóa đơn</button>
                                <button onClick={() => setInvoice(null)}>Đóng</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}