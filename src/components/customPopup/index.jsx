import "./index.scss";

const CustomPopup = ({ isOpen, message, type = "info", onClose }) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return "✓";
      case "error":
        return "✕";
      case "warning":
        return "⚠";
      default:
        return "ℹ";
    }
  };

  return (
    <div className="custom-popup-overlay" onClick={onClose}>
      <div className="custom-popup" onClick={(e) => e.stopPropagation()}>
        <div className={`popup-icon ${type}`}>{getIcon()}</div>
        <p className="popup-message">{message}</p>
        <button className="popup-close-btn" onClick={onClose}>
          Đóng
        </button>
      </div>
    </div>
  );
};

export default CustomPopup;
