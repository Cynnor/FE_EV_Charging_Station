import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import InvoicePrint from "../../components/InvoicePrint";

export default function PaymentPage() {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const navigate = useNavigate();
    const { state } = useLocation();
    const station = state?.station || null;
    const charger = state?.charger || null;
    const defaults = state?.formData || {};

    const [energyKwh, setEnergyKwh] = useState(5);
    const [paymentMethod, setPaymentMethod] = useState("e_wallet"); // e_wallet | banking | card | cod
    const [isPaying, setIsPaying] = useState(false);
    const [invoice, setInvoice] = useState(null);

    // Lấy giá từ trụ sạc đã chọn
    const pricePerKwh = useMemo(() => {
        if (charger?.price) {
            // Extract số từ chuỗi giá (ví dụ: "3.500 đ/kWh" -> 3500)
            const priceMatch = charger.price.match(/(\d+(?:\.\d+)?)/);
            return priceMatch ? parseFloat(priceMatch[1]) * 1000 : 3500; // Convert to đ/kWh
        }
        return 3500; // Default price
    }, [charger]);

    const totalAmount = useMemo(() => {
        return energyKwh * pricePerKwh;
    }, [energyKwh, pricePerKwh]);

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
                chargerName: charger?.name || "Không xác định",
                energyKwh,
                pricePerKwh,
                paymentMethod,
                totalAmount,
                date: defaults?.date,
                startTime: defaults?.startTime,
            });
            setIsPaying(false);
        }, 1200);
    };

    const [showInvoice, setShowInvoice] = useState(false);

    return (
        <div className="payment-page">
            <div className="payment-container">
                <div className="left">
                    <h1>Thanh toán</h1>

                    <div className="summary-card">
                        <h3>Thông tin đặt chỗ</h3>
                        <p><b>Trạm:</b> {station?.name || "—"}</p>
                        <p><b>Trụ sạc:</b> {charger?.name || "—"}</p>
                        <p><b>Công suất:</b> {charger?.power || "—"}</p>
                        <p><b>Ngày sạc:</b> {defaults?.date || "—"}</p>
                        <p><b>Giờ bắt đầu:</b> {defaults?.startTime || "—"}</p>
                    </div>

                    <div className="plan-card">
                        <h3>Thanh toán theo kWh</h3>
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
                            <p className="price-note">
                                Đơn giá: {pricePerKwh.toLocaleString()} đ/kWh
                                <br />
                                <small style={{ color: "#666" }}>
                                    (Giá từ trụ sạc {charger?.name || "đã chọn"})
                                </small>
                            </p>
                        </div>
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
                                Ví điện tử
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="banking"
                                    checked={paymentMethod === "banking"}
                                    onChange={() => setPaymentMethod("banking")}
                                />
                                Banking
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="pm"
                                    value="card"
                                    checked={paymentMethod === "card"}
                                    onChange={() => setPaymentMethod("card")}
                                />
                                Thẻ
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
                            <span className="value">Theo kWh</span>
                        </div>
                        <div className="row">
                            <span>Số kWh</span>
                            <span className="value">{energyKwh} kWh</span>
                        </div>
                        <div className="row">
                            <span>Đơn giá</span>
                            <span className="value">{pricePerKwh.toLocaleString()} đ/kWh</span>
                        </div>
                        <div className="row total-row">
                            <span>Thành tiền</span>
                            <span className="value">{totalAmount.toLocaleString()} đ</span>
                        </div>
                        <button
                            className="pay-btn"
                            disabled={isPaying}
                            onClick={handleSandboxPay}
                        >
                            {isPaying ? "Đang xử lý..." : "Thanh toán"}
                        </button>
                        <button className="back-btn" onClick={() => navigate(-1)}>Quay lại</button>
                    </div>

                    {invoice && (
                        <div className="invoice">
                            <h3>Hóa đơn điện tử</h3>
                            <p><b>Mã hóa đơn:</b> {invoice.code}</p>
                            <p><b>Thời gian:</b> {invoice.createdAt}</p>
                            <p><b>Trạm:</b> {invoice.stationName}</p>
                            <p><b>Trụ sạc:</b> {invoice.chargerName}</p>
                            <p><b>Hình thức:</b> Theo kWh ({invoice.energyKwh} kWh)</p>
                            <p><b>Đơn giá:</b> {invoice.pricePerKwh.toLocaleString()} đ/kWh</p>
                            <p><b>Thanh toán qua:</b> {paymentMethod}</p>
                            <p className="grand-total"><b>Tổng tiền:</b> {invoice.totalAmount.toLocaleString()} đ</p>
                            <div className="invoice-actions">
                                <button className="print-btn" onClick={() => setShowInvoice(true)}>🖨️ In hóa đơn</button>
                                <button className="close-btn" onClick={() => setInvoice(null)}>✖️ Đóng</button>
                            </div>

                        </div>
                    )}
                </div>
            </div>

            {showInvoice && invoice && (
                <InvoicePrint
                    invoice={invoice}
                    onClose={() => setShowInvoice(false)}
                />
            )}
        </div>
    );
}