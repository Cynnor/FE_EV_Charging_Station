import React from 'react';
import './index.scss';

const InvoicePrint = ({ invoice, onClose }) => {
    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="invoice-print-container">
            <div className="invoice-print-content">
                <div className="invoice-header">
                    <div className="invoice-title">HÓA ĐƠN ĐIỆN TỬ</div>
                    <div className="invoice-code">Mã hóa đơn: {invoice.code}</div>
                    <div className="invoice-date">Ngày tạo: {invoice.createdAt}</div>
                </div>

                <div className="invoice-info">
                    <div className="info-section">
                        <h3>Thông tin trạm sạc</h3>
                        <div className="info-item">
                            <span className="info-label">Tên trạm:</span>
                            <span className="info-value">{invoice.stationName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Trụ sạc:</span>
                            <span className="info-value">{invoice.chargerName}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Ngày sạc:</span>
                            <span className="info-value">{invoice.date}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Giờ bắt đầu:</span>
                            <span className="info-value">{invoice.startTime}</span>
                        </div>
                    </div>

                    <div className="info-section">
                        <h3>Chi tiết thanh toán</h3>
                        <div className="info-item">
                            <span className="info-label">Hình thức:</span>
                            <span className="info-value">Theo kWh</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Số kWh:</span>
                            <span className="info-value">{invoice.energyKwh} kWh</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Đơn giá:</span>
                            <span className="info-value">{invoice.pricePerKwh.toLocaleString()} đ/kWh</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Thanh toán qua:</span>
                            <span className="info-value">{invoice.paymentMethod}</span>
                        </div>
                    </div>
                </div>

                <div className="total-section">
                    <div className="total-label">Tổng tiền</div>
                    <div className="total-amount">{invoice.totalAmount.toLocaleString()} đ</div>
                </div>

                <div className="invoice-footer">
                    <p>Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện!</p>
                    <p>Hóa đơn này được tạo tự động bởi hệ thống</p>
                </div>

                <div className="invoice-actions no-print">
                    <button className="print-btn" onClick={handlePrint}>
                        🖨️ In hóa đơn
                    </button>
                    <button className="close-btn" onClick={onClose}>
                        ✖️ Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InvoicePrint;
