import './ConfirmPopup.scss';

const ConfirmPopup = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div className="confirm-container" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠</div>
        <h3 className="confirm-title">Xác nhận</h3>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm" onClick={onConfirm}>
            Xác nhận
          </button>
          <button className="confirm-btn cancel" onClick={onCancel}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
