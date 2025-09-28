// src/pages/BookingPage/index.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChargingMap from "../../components/ChargingMap";
import "./index.scss";

const stations = [
  { id: 1, name: "Trạm AC 1 – NVHSV", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.939, 106.813], type: "AC" },
  { id: 2, name: "Trạm AC 2 – Cổng chính", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.940, 106.815], type: "AC" },
  { id: 3, name: "Trạm AC 3 – KTX", speed: "7 kW", price: "3.500 đ/kWh", coords: [10.9385, 106.8115], type: "AC" },
  { id: 4, name: "Trạm DC 1 – Nhà thi đấu", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.9395, 106.816], type: "DC" },
  { id: 5, name: "Trạm DC 2 – Công viên", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.9378, 106.814], type: "DC" },
  { id: 6, name: "Trạm DC 3 – Bãi xe sau", speed: "60 kW", price: "5.000 đ/kWh", coords: [10.941, 106.812], type: "DC" },
];

export default function BookingPage() {
  const navigate = useNavigate();

  // mặc định: ngày/giờ hiện tại
  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const defaultTime = today.toTimeString().slice(0, 5);

  const [selectedStation, setSelectedStation] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [formData, setFormData] = useState({
    date: defaultDate,
    startTime: defaultTime,
  });

  // lọc trạm sạc
  const filteredStations = stations.filter(station => {
    const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || station.type === filterType;
    return matchesSearch && matchesType;
  });

  // khi nhập input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // khi chọn trạm từ danh sách
  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  // khi bấm nút đặt chỗ
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedStation) {
      alert("⚠️ Vui lòng chọn một trạm trên bản đồ!");
      return;
    }
    // chuyển sang trang payment, truyền state
    navigate("/payment", { state: { station: selectedStation, formData } });
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
                Ngày sạc:
                <input
                  type="date"
                  name="date"
                  value={formData.date}
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

              <button
                type="button"
                className="change-station-btn"
                onClick={() => setSelectedStation(null)}
              >
                🔄 Chọn trạm khác
              </button>
            </form>
          ) : (
            <div className="station-selection">
              <p className="hint">🔍 Chọn một trạm sạc để đặt chỗ</p>

              {/* Tìm kiếm và lọc */}
              <div className="search-filters">
                <input
                  type="text"
                  placeholder="Tìm kiếm trạm sạc..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="AC">AC (Sạc chậm)</option>
                  <option value="DC">DC (Sạc nhanh)</option>
                </select>
              </div>

              {/* Danh sách trạm sạc */}
              <div className="stations-list">
                {filteredStations.map((station) => (
                  <div
                    key={station.id}
                    className={`station-card ${station.type.toLowerCase()}`}
                    onClick={() => handleStationSelect(station)}
                  >
                    <div className="station-header">
                      <h3>{station.name}</h3>
                      <span className={`station-type ${station.type.toLowerCase()}`}>
                        {station.type}
                      </span>
                    </div>
                    <div className="station-details">
                      <p>⚡ {station.speed}</p>
                      <p>💰 {station.price}</p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStations.length === 0 && (
                <p className="no-results">Không tìm thấy trạm sạc nào</p>
              )}
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
