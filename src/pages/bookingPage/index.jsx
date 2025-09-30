import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChargingMap from "../../components/ChargingMap";
import "./index.scss";

const stations = [
  { id: 1, name: "Trạm AC 1 – NVHSV", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.939, 106.813] },
  { id: 2, name: "Trạm AC 2 – Cổng chính", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.940, 106.815] },
  { id: 3, name: "Trạm AC 3 – KTX", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.9385, 106.8115] },
  { id: 4, name: "Trạm DC 1 – Nhà thi đấu", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.9395, 106.816] },
  { id: 5, name: "Trạm DC 2 – Công viên", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.9378, 106.814] },
  { id: 6, name: "Trạm DC 3 – Bãi xe sau", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.941, 106.812] },
];

export default function BookingPage() {
  const navigate = useNavigate();

  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const defaultTime = today.toTimeString().slice(0, 5);

  const [selectedStation, setSelectedStation] = useState(null);
  const [formData, setFormData] = useState({
    date: defaultDate,
    startTime: defaultTime,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStation) {
      alert("⚠️ Vui lòng chọn một trạm trên bản đồ!");
      return;
    }
    navigate("/Payment", { state: { station: selectedStation, formData } });
  };

  return (
    <div className="booking-wrapper">
      <div className="booking-container">
        {/* Form bên trái */}
        <div className="left-panel">
          <h1>Đăng ký sạc</h1>
          {selectedStation ? (
            <form className="booking-form" onSubmit={handleSubmit}>
              <div className="station-info">
                <p><b>Trạm:</b> {selectedStation.name}</p>
                <p><b>Công suất:</b> {selectedStation.speed}</p>
                <p><b>Giá:</b> {selectedStation.price}</p>
              </div>
              <label>
                Chọn trạm khác:
                <select
                  value={selectedStation?.id || ''}
                  onChange={(e) => {
                    const next = stations.find(s => String(s.id) === e.target.value);
                    if (next) setSelectedStation(next);
                  }}
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.speed} · {s.price})
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Ngày sạc:
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  min={defaultDate}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Giờ bắt đầu:
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </label>

              <button type="submit" className="book-btn">
                Đặt chỗ & Thanh toán
              </button>
            </form>
          ) : (
            <div className="station-selection">
              <p className="hint">🔍 Chọn một trạm sạc để đặt chỗ</p>
              <div className="stations-list">
                {stations.map((station) => (
                  <div
                    key={station.id}
                    className={`station-card ${station.type?.toLowerCase?.() || ''}`}
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="station-header">
                      <h3>{station.name}</h3>
                    </div>
                    <div className="station-details">
                      <p>⚡ {station.speed}</p>
                      <p>💰 {station.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Map bên phải */}
        <div className="right-panel">
          <ChargingMap
            stations={stations}
            center={[10.939, 106.813]}
            zoom={15}
            onSelect={setSelectedStation}
            selectedStation={selectedStation}
          />
        </div>
      </div>
    </div>
  );
}
