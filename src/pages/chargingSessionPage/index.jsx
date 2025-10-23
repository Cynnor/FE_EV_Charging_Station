import "./styles.scss";
import { useNavigate } from "react-router-dom";

// Mock data for VinFast vehicle
const mockVehicleData = {
  make: "VinFast",
  model: "VF 8",
  year: 2023,
  batteryCapacity: 82,
  currentCharge: 30,
  chargeRate: 150,
  remainingTime: 45,
  chargingCost: 285000,
  plateNumber: "51H-123.45",
  connectorType: "CCS2",
  status: "charging",
  startTime: new Date().toLocaleString('vi-VN'),
};

const ChargingSession = () => {
  const navigate = useNavigate();
  
  return (
    <div className="charging-session-page">
      <div className="charging-session">
        <div className="header-container">
          <button className="back-btn" onClick={() => navigate(-1)}>
            ← Quay lại
          </button>
          <h1>Thông tin phiên sạc</h1>
          <button 
            className="payment-btn"
            onClick={() => navigate('/payment')}
          >
            Thanh toán ngay
          </button>
        </div>

        <div className="session-content">
          <div className="info-card vehicle-info">
            <h2>Thông tin xe</h2>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Biển số:</span>
                <span className="value">{mockVehicleData.plateNumber}</span>
              </div>
              <div className="info-item">
                <span className="label">Xe:</span>
                <span className="value">{mockVehicleData.make} {mockVehicleData.model}</span>
              </div>
              <div className="info-item">
                <span className="label">Dung lượng pin:</span>
                <span className="value">{mockVehicleData.batteryCapacity} kWh</span>
              </div>
              <div className="info-item">
                <span className="label">Loại cổng sạc:</span>
                <span className="value">{mockVehicleData.connectorType}</span>
              </div>
            </div>
          </div>

          <div className="info-card charging-status">
            <h2>Trạng thái sạc</h2>
            <div className="battery-indicator">
              <div 
                className="battery-level"
                style={{ width: `${mockVehicleData.currentCharge}%` }}
              >
                <span>{mockVehicleData.currentCharge}%</span>
              </div>
            </div>
            <div className="charging-details">
              <div className="detail-item">
                <span className="label">Tốc độ sạc:</span>
                <span className="value">{mockVehicleData.chargeRate} kW</span>
              </div>
              <div className="detail-item">
                <span className="label">Thời gian còn lại:</span>
                <span className="value">{mockVehicleData.remainingTime} phút</span>
              </div>
              <div className="detail-item">
                <span className="label">Chi phí hiện tại:</span>
                <span className="value">{mockVehicleData.chargingCost.toLocaleString()} VNĐ</span>
              </div>
              <div className="detail-item">
                <span className="label">Bắt đầu lúc:</span>
                <span className="value">{mockVehicleData.startTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChargingSession;
