import { useState } from "react"
import { useNavigate } from "react-router-dom"
import ChargingMap from "../../components/ChargingMap"
import "./index.scss"

const stations = [
  {
    id: 1,
    name: "Vincom Plaza Thủ Đức",
    address: "Hầm B1, 216 Võ Văn Ngân, Phường Linh Trung, Thủ Đức",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.850268581807446, 106.76508926692969],
    type: "AC",
    available: 8,
    total: 10,
    distance: "2.5 km",
    rating: 4.5,
    reviews: 128,
    hours: "24/7",
    amenities: ["wifi", "cafe", "restroom", "parking"],
  },
  {
    id: 2,
    name: "Vincom Plaza Lê Văn Việt",
    address: "Hầm B1 và bãi đỗ xe phía sau TTTM, 50 Lê Văn Việt",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.845766064484804, 106.77919604943925],
    type: "AC",
    available: 5,
    total: 10,
    distance: "3.8 km",
    rating: 4.7,
    reviews: 95,
    hours: "06:00 - 22:00",
    amenities: ["wifi", "cafe", "parking"],
  },
  {
    id: 3,
    name: "Vincom Mega Mall Thảo Điền",
    address: "Hầm B2 và B3, 61 Xa Lộ Hà Nội, Thảo Điền",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.802771115098235, 106.74115658412123],
    type: "AC",
    available: 7,
    total: 10,
    distance: "5.2 km",
    rating: 4.8,
    reviews: 203,
    hours: "24/7",
    amenities: ["wifi", "cafe", "restroom", "parking", "shopping"],
  },
  {
    id: 4,
    name: "PVOIL Bình Thọ",
    address: "Nguyễn Văn Bá, thành phố Thủ Đức",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.824351284996558, 106.75890448841237],
    type: "AC",
    available: 6,
    total: 10,
    distance: "1.8 km",
    rating: 4.3,
    reviews: 67,
    hours: "24/7",
    amenities: ["restroom", "parking"],
  },
  {
    id: 5,
    name: "PVOIL Phú Hữu",
    address: "579 Võ Chí Công, Phường Phú Hữu",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.803231372644172, 106.7917469074085],
    type: "AC",
    available: 9,
    total: 10,
    distance: "4.1 km",
    rating: 4.6,
    reviews: 89,
    hours: "24/7",
    amenities: ["restroom", "parking"],
  },
  {
    id: 6,
    name: "Bệnh viện Đa khoa Quốc tế Hoàn Mỹ Thủ Đức",
    address: "Bệnh viện Đa khoa Quốc tế Hoàn Mỹ Thủ Đức",
    speed: "50 kW",
    price: "5.000 đ/kWh",
    coords: [10.888164703159728, 106.77362795343682],
    type: "DC",
    available: 3,
    total: 5,
    distance: "6.7 km",
    rating: 4.9,
    reviews: 156,
    hours: "24/7",
    amenities: ["wifi", "restroom", "parking"],
  },
  {
    id: 7,
    name: "Chung cư Sky 9",
    address: "Tầng hầm B1 và CT1, 61-63 Đường số 1, Phú Hữu",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.803363662997876, 106.79190035343608],
    type: "AC",
    available: 4,
    total: 10,
    distance: "4.5 km",
    rating: 4.4,
    reviews: 72,
    hours: "06:00 - 23:00",
    amenities: ["wifi", "parking"],
  },
  {
    id: 8,
    name: "Bãi đỗ xe Linh Xuân",
    address: "Khu vực Linh Xuân",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.887768578781593, 106.77365310356855],
    type: "AC",
    available: 10,
    total: 10,
    distance: "7.2 km",
    rating: 4.2,
    reviews: 45,
    hours: "24/7",
    amenities: ["parking"],
  },
  {
    id: 9,
    name: "Bãi đỗ xe Co-op Xtra Linh Trung",
    address: "Khu vực Linh Trung",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.869158115361074, 106.77661314195127],
    type: "AC",
    available: 8,
    total: 10,
    distance: "3.3 km",
    rating: 4.5,
    reviews: 91,
    hours: "06:00 - 22:00",
    amenities: ["wifi", "cafe", "parking"],
  },
  {
    id: 10,
    name: "Xưởng dịch vụ VinFast Thảo Điền",
    address: "Xa Lộ Hà Nội (VinFast Thảo Điền)",
    speed: "50 kW",
    price: "5.000 đ/kWh",
    coords: [10.802708432882332, 106.74126964124581],
    type: "DC",
    available: 2,
    total: 5,
    distance: "5.5 km",
    rating: 4.8,
    reviews: 134,
    hours: "08:00 - 18:00",
    amenities: ["wifi", "restroom", "parking"],
  },
  {
    id: 11,
    name: "Chung cư Centana",
    address: "Chung cư Centana (tầng hầm)",
    speed: "7 kW",
    price: "3.500 đ/kWh",
    coords: [10.791969120301582, 106.75263141565888],
    type: "AC",
    available: 6,
    total: 10,
    distance: "4.8 km",
    rating: 4.6,
    reviews: 78,
    hours: "24/7",
    amenities: ["wifi", "parking"],
  },
  {
    id: 12,
    name: "Gara Minh Phương",
    address: "Gara Minh Phương",
    speed: "60 kW",
    price: "5.500 đ/kWh",
    coords: [10.78938151105277, 106.72949518021287],
    type: "DC",
    available: 4,
    total: 5,
    distance: "8.1 km",
    rating: 4.7,
    reviews: 112,
    hours: "24/7",
    amenities: ["wifi", "restroom", "parking"],
  },
]

const amenityIcons = {
  wifi: "📶",
  cafe: "☕",
  restroom: "🚻",
  parking: "🅿️",
  shopping: "🛍️",
}

export default function BookingPage() {
  const navigate = useNavigate()
  const today = new Date()
  const defaultDate = today.toISOString().split("T")[0]
  const defaultTime = today.toTimeString().slice(0, 5)

  const [step, setStep] = useState(1)
  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedCharger, setSelectedCharger] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  const [formData, setFormData] = useState({
    date: defaultDate,
    startTime: defaultTime,
  })

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || station.type === filterType
    return matchesSearch && matchesType
  })

  const chargers = selectedStation
    ? [
        {
          id: 1,
          name: "Trụ A1",
          coords: [selectedStation.coords[0] + 0.0002, selectedStation.coords[1]],
          power: "7 kW",
          price: "3.500 đ/kWh",
          status: "available",
          connector: "Type 2",
        },
        {
          id: 2,
          name: "Trụ A2",
          coords: [selectedStation.coords[0], selectedStation.coords[1] + 0.0002],
          power: "11 kW",
          price: "3.800 đ/kWh",
          status: "available",
          connector: "Type 2",
        },
        {
          id: 3,
          name: "Trụ B1",
          coords: [selectedStation.coords[0] - 0.0002, selectedStation.coords[1]],
          power: "22 kW",
          price: "4.000 đ/kWh",
          status: "available",
          connector: "Type 2",
        },
        {
          id: 4,
          name: "Trụ B2",
          coords: [selectedStation.coords[0], selectedStation.coords[1] - 0.0002],
          power: "30 kW",
          price: "4.200 đ/kWh",
          status: "occupied",
          connector: "CCS2",
        },
        {
          id: 5,
          name: "Trụ C1",
          coords: [selectedStation.coords[0] + 0.00015, selectedStation.coords[1] + 0.00015],
          power: "43 kW",
          price: "4.500 đ/kWh",
          status: "available",
          connector: "CCS2",
        },
        {
          id: 6,
          name: "Trụ C2",
          coords: [selectedStation.coords[0] - 0.00015, selectedStation.coords[1] + 0.00015],
          power: "50 kW",
          price: "4.800 đ/kWh",
          status: "available",
          connector: "CCS2",
        },
        {
          id: 7,
          name: "Trụ D1",
          coords: [selectedStation.coords[0] + 0.00015, selectedStation.coords[1] - 0.00015],
          power: "60 kW",
          price: "5.000 đ/kWh",
          status: "available",
          connector: "CCS2",
        },
        {
          id: 8,
          name: "Trụ D2",
          coords: [selectedStation.coords[0] - 0.00015, selectedStation.coords[1] - 0.00015],
          power: "90 kW",
          price: "5.200 đ/kWh",
          status: "maintenance",
          connector: "CCS2",
        },
        {
          id: 9,
          name: "Trụ E1",
          coords: [selectedStation.coords[0] + 0.00025, selectedStation.coords[1] - 0.0001],
          power: "120 kW",
          price: "5.500 đ/kWh",
          status: "available",
          connector: "CCS2",
        },
        {
          id: 10,
          name: "Trụ E2",
          coords: [selectedStation.coords[0] - 0.00025, selectedStation.coords[1] + 0.0001],
          power: "150 kW",
          price: "6.000 đ/kWh",
          status: "available",
          connector: "CCS2",
        },
      ]
    : []

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!selectedStation || !selectedCharger) {
      alert("⚠️ Vui lòng chọn trạm và trụ!")
      return
    }
    navigate("/payment", {
      state: {
        station: selectedStation,
        charger: selectedCharger,
        formData,
      },
    })
  }

  return (
    <div className="booking-wrapper">
      <div className={`booking-container ${step === 3 ? "confirmation-mode" : ""}`}>
        <div className="left-panel">
          <div className="panel-header">
            <h1>Đặt chỗ sạc xe</h1>
            <div className="step-indicator">
              <div className={`step ${step >= 1 ? "active" : ""}`}>
                <span className="step-number">1</span>
                <span className="step-label">Chọn trạm</span>
              </div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 2 ? "active" : ""}`}>
                <span className="step-number">2</span>
                <span className="step-label">Chọn trụ</span>
              </div>
              <div className="step-divider"></div>
              <div className={`step ${step >= 3 ? "active" : ""}`}>
                <span className="step-number">3</span>
                <span className="step-label">Xác nhận</span>
              </div>
            </div>
          </div>

          {step === 1 && (
            <div className="station-selection">
              {/* Hiển thị thông tin trạm đã chọn ở đầu step 1 */}
              {selectedStation && (
                <div
                  className="selected-station-summary"
                  style={{
                    margin: "0 0 16px 0",
                    padding: "12px",
                    background: "#f0fdf4",
                    borderRadius: "10px",
                  }}
                >
                  <strong>Trạm đã chọn:</strong>
                  <div>Tên: {selectedStation.name}</div>
                  <div>Địa chỉ: {selectedStation.address}</div>
                  <div>Công suất: {selectedStation.speed}</div>
                  <div>Giá: {selectedStation.price}</div>
                  <div>Giờ mở cửa: {selectedStation.hours}</div>
                  <div>Khoảng cách: {selectedStation.distance}</div>
                </div>
              )}
              <div className="search-filters">
                <div className="search-box">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm trạm sạc theo tên hoặc địa chỉ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button className="clear-search" onClick={() => setSearchTerm("")}>
                      ×
                    </button>
                  )}
                </div>

                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="filter-select">
                  <option value="all">Tất cả loại trạm</option>
                  <option value="AC">⚡ AC - Sạc chậm</option>
                  <option value="DC">⚡⚡ DC - Sạc nhanh</option>
                </select>
              </div>

              <div className="results-count">
                Tìm thấy <strong>{filteredStations.length}</strong> trạm sạc
              </div>

              <div className="stations-list">
                {filteredStations.map((station) => (
                  <div
                    key={station.id}
                    className={`station-card ${station.type.toLowerCase()}${
                      selectedStation?.id === station.id ? " selected" : ""
                    }`}
                    onClick={() => setSelectedStation(station)}
                  >
                    <div className="station-card-header">
                      <div className="station-badge">
                        <span className={`badge-type ${station.type.toLowerCase()}`}>
                          {station.type === "AC" ? "⚡ AC" : "⚡⚡ DC"}
                        </span>
                      </div>
                      <div className="station-distance">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                        {station.distance}
                      </div>
                    </div>

                    <h3 className="station-name">{station.name}</h3>
                    <p className="station-address">{station.address}</p>

                    <div className="station-rating">
                      <div className="stars">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={i < Math.floor(station.rating) ? "star filled" : "star"}>
                            ★
                          </span>
                        ))}
                      </div>
                      <span className="rating-text">
                        {station.rating} ({station.reviews} đánh giá)
                      </span>
                    </div>

                    <div className="station-info-grid">
                      <div className="info-item">
                        <span className="info-icon">⚡</span>
                        <div className="info-content">
                          <span className="info-label">Công suất</span>
                          <span className="info-value">{station.speed}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">💰</span>
                        <div className="info-content">
                          <span className="info-label">Giá</span>
                          <span className="info-value">{station.price}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">🕐</span>
                        <div className="info-content">
                          <span className="info-label">Giờ mở cửa</span>
                          <span className="info-value">{station.hours}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <span className="info-icon">🔌</span>
                        <div className="info-content">
                          <span className="info-label">Trụ sạc</span>
                          <span className="info-value">{station.total} trụ</span>
                        </div>
                      </div>
                    </div>

                    <div className="station-amenities">
                      <span className="amenities-label">Tiện ích:</span>
                      <div className="amenities-list">
                        {station.amenities.map((amenity) => (
                          <span key={amenity} className="amenity-icon" title={amenity}>
                            {amenityIcons[amenity]}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="station-availability">
                      <div className="availability-bar">
                        <div
                          className="availability-fill"
                          style={{ width: `${(station.available / station.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="availability-text">
                        {station.available}/{station.total} trụ khả dụng
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedStation && (
                <button
                  className="btn-next-step"
                  style={{
                    marginTop: "18px",
                    padding: "12px 24px",
                    background: "#10b981",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                  onClick={() => setStep(2)}
                >
                  Tiếp tục chọn trụ &rarr;
                </button>
              )}

              {filteredStations.length === 0 && (
                <div className="no-results">
                  <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                    <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2" />
                    <path d="M32 20v16M32 44h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  <p>Không tìm thấy trạm sạc phù hợp</p>
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setFilterType("all")
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="charger-selection">
              <div className="selected-station-info">
                <button className="back-button" onClick={() => setStep(1)}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M12 4L6 10l6 6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Quay lại
                </button>
                <h2>{selectedStation.name}</h2>
                <div className="station-quick-info">
                  <span className={`badge ${selectedStation.type.toLowerCase()}`}>{selectedStation.type}</span>
                  <span>⚡ {selectedStation.speed}</span>
                  <span>💰 {selectedStation.price}</span>
                </div>
              </div>

              <p className="selection-hint">Chọn một trụ sạc khả dụng:</p>

              <div className="chargers-grid">
                {chargers.map((charger) => (
                  <div
                    key={charger.id}
                    className={`charger-card ${charger.status} ${selectedCharger?.id === charger.id ? "selected" : ""}`}
                    onClick={() => {
                      if (charger.status === "available") {
                        setSelectedCharger(charger)
                        setStep(3)
                      }
                    }}
                  >
                    <div className="charger-header">
                      <h3>{charger.name}</h3>
                      <span className={`status-badge ${charger.status}`}>
                        {charger.status === "available" && "✓ Sẵn sàng"}
                        {charger.status === "occupied" && "⏱ Đang dùng"}
                        {charger.status === "maintenance" && "🔧 Bảo trì"}
                      </span>
                    </div>

                    <div className="charger-specs">
                      <div className="spec-item">
                        <span className="spec-icon">⚡</span>
                        <div>
                          <div className="spec-label">Công suất</div>
                          <div className="spec-value">{charger.power}</div>
                        </div>
                      </div>

                      <div className="spec-item">
                        <span className="spec-icon">💰</span>
                        <div>
                          <div className="spec-label">Giá</div>
                          <div className="spec-value">{charger.price}</div>
                        </div>
                      </div>
                    </div>

                    <div className="charger-connector">
                      <span className="connector-label">Đầu cắm:</span>
                      <span className="connector-type">{charger.connector}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="booking-confirmation">
              <button className="back-button" onClick={() => setStep(2)}>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12 4L6 10l6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Quay lại
              </button>

              <div className="confirmation-content">
                <div className="confirmation-header">
                  <div className="success-icon">✓</div>
                  <h2>Xác nhận đặt chỗ</h2>
                  <p className="confirmation-subtitle">Vui lòng kiểm tra thông tin và xác nhận đặt chỗ của bạn</p>
                </div>

                <div className="confirmation-grid">
                  <div className="summary-section">
                    <div className="summary-card station-card">
                      <div className="card-icon">📍</div>
                      <h3>Thông tin trạm sạc</h3>
                      <div className="summary-item">
                        <span className="summary-label">Tên trạm:</span>
                        <span className="summary-value">{selectedStation.name}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Địa chỉ:</span>
                        <span className="summary-value">{selectedStation.address}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Khoảng cách:</span>
                        <span className="summary-value">{selectedStation.distance}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Giờ mở cửa:</span>
                        <span className="summary-value">{selectedStation.hours}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Đánh giá:</span>
                        <span className="summary-value">
                          ⭐ {selectedStation.rating} ({selectedStation.reviews} đánh giá)
                        </span>
                      </div>
                    </div>

                    <div className="summary-card charger-card">
                      <div className="card-icon">🔌</div>
                      <h3>Thông tin trụ sạc</h3>
                      <div className="summary-item">
                        <span className="summary-label">Trụ sạc:</span>
                        <span className="summary-value">{selectedCharger.name}</span>
                      </div>
                      <div className="summary-item highlight-item">
                        <span className="summary-label">Công suất:</span>
                        <span className="summary-value highlight">⚡ {selectedCharger.power}</span>
                      </div>
                      <div className="summary-item highlight-item">
                        <span className="summary-label">Giá:</span>
                        <span className="summary-value highlight">💰 {selectedCharger.price}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Đầu cắm:</span>
                        <span className="summary-value">{selectedCharger.connector}</span>
                      </div>
                      <div className="summary-item">
                        <span className="summary-label">Trạng thái:</span>
                        <span className="summary-value status-available">✓ Sẵn sàng</span>
                      </div>
                    </div>
                  </div>

                  <div className="form-section">
                    <form className="booking-form" onSubmit={handleSubmit}>
                      <div className="form-header">
                        <h3>Thời gian sạc</h3>
                        <p>Chọn thời gian bạn muốn bắt đầu sạc xe</p>
                      </div>

                      <div className="form-group">
                        <label htmlFor="date">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <rect x="3" y="4" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2" />
                            <path
                              d="M3 8h14M7 2v4M13 2v4"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                          Ngày sạc
                        </label>
                        <input
                          id="date"
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="startTime">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Giờ bắt đầu
                        </label>
                        <input
                          id="startTime"
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          required
                        />
                      </div>

                      <div className="price-estimate">
                        <div className="estimate-label">Ước tính chi phí (1 giờ):</div>
                        <div className="estimate-value">
                          {(
                            (Number.parseFloat(selectedCharger.power) *
                              Number.parseFloat(selectedCharger.price.replace(/[^\d]/g, ""))) /
                            1000
                          ).toLocaleString("vi-VN")}{" "}
                          đ
                        </div>
                      </div>

                      <button type="submit" className="submit-button">
                        <span>Xác nhận & Thanh toán</span>
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path
                            d="M4 10h12M12 6l4 4-4 4"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {step !== 3 && (
          <div className="right-panel">
            <div className="map-container">
              {step === 1 && (
                <ChargingMap
                  stations={stations}
                  center={[10.850268581807446, 106.76508926692969]}
                  zoom={13}
                  onSelect={(s) => setSelectedStation(s)}
                  selectedStation={selectedStation}
                />
              )}

              {step === 2 && (
                <ChargingMap
                  stations={chargers}
                  center={selectedStation.coords}
                  zoom={17}
                  onSelect={(c) => {
                    if (c.status === "available") {
                      setSelectedCharger(c)
                      setStep(3)
                    }
                  }}
                  selectedStation={selectedCharger}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

