import "./index.scss";

const ConfirmPopup = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-popup-overlay" onClick={onCancel}>
      <div className="confirm-popup" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon">⚠</div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn" onClick={onConfirm}>
            Xác nhận
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Hủy bỏ
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmPopup;
