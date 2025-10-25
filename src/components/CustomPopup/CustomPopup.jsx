import { useEffect } from 'react';
import './CustomPopup.scss';

const CustomPopup = ({ message, type = 'info', onClose, isOpen }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className={`popup-container ${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="popup-icon">{getIcon()}</div>
        <div className="popup-content">
          <p className="popup-message">{message}</p>
        </div>
        <button className="popup-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default CustomPopup;
