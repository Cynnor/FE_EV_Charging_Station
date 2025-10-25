import './PaymentConfirmPopup.scss';

const PaymentConfirmPopup = ({ 
  isOpen, 
  currentCharge, 
  timeElapsed, 
  totalCost, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div className="payment-confirm-overlay" onClick={onCancel}>
      <div className="payment-confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="payment-icon">💳</div>
        <h3 className="payment-title">Xác nhận thanh toán</h3>
        
        <div className="payment-details">
          <div className="detail-row">
            <span className="detail-label">Pin hiện tại:</span>
            <span className="detail-value battery">{currentCharge}%</span>
          </div>
          
          <div className="detail-row">
            <span className="detail-label">Thời gian đã sạc:</span>
            <span className="detail-value time">{timeElapsed} phút</span>
          </div>
          
          <div className="detail-separator"></div>
          
          <div className="detail-row total">
            <span className="detail-label">Tổng chi phí:</span>
            <span className="detail-value cost">{totalCost.toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        <div className="payment-actions">
          <button className="payment-btn confirm" onClick={onConfirm}>
            Chuyển đến thanh toán
          </button>
          <button className="payment-btn cancel" onClick={onCancel}>
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentConfirmPopup;
