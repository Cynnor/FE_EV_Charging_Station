import { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import "./index.scss"

import ChargingMap from "../../components/chargingMap"

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
  },
  {
    id: 6,
    name: "Bệnh viện Hoàn Mỹ Thủ Đức",
    address: "Bệnh viện Đa khoa Quốc tế Hoàn Mỹ Thủ Đức",
    speed: "50 kW",
    price: "5.000 đ/kWh",
    coords: [10.888164703159728, 106.77362795343682],
    type: "DC",
    available: 3,
    total: 5,
    distance: "6.7 km",
    rating: 4.9,
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
  },
  {
    id: 10,
    name: "Trạm dịch vụ VinFast Thảo Điền",
    address: "Xa Lộ Hà Nội (VinFast Thảo Điền)",
    speed: "50 kW",
    price: "5.000 đ/kWh",
    coords: [10.802708432882332, 106.74126964124581],
    type: "DC",
    available: 2,
    total: 5,
    distance: "5.5 km",
    rating: 4.8,
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
  },
  {
    id: 13,
    name: "DC Ultra Charging Hub",
    address: "Khu công nghệ cao, Quận 9",
    speed: "180 kW",
    price: "6.500 đ/kWh",
    coords: [10.865, 106.78],
    type: "DC ULTRA",
    available: 6,
    total: 8,
    distance: "4.2 km",
    rating: 4.9,
  },
]

export default function BookingPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const today = new Date()
  const defaultDate = today.toISOString().split("T")[0]
  const defaultTime = today.toTimeString().slice(0, 5)

  const minDate = today.toISOString().split("T")[0]
  const maxDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const [step, setStep] = useState(1)
  const [selectedStation, setSelectedStation] = useState(null)
  const [selectedCharger, setSelectedCharger] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")

  // Tự động set filterType từ URL params
  useEffect(() => {
    const typeFromUrl = searchParams.get('type');
    if (typeFromUrl && ['AC', 'DC', 'DC_ULTRA'].includes(typeFromUrl)) {
      setFilterType(typeFromUrl);
    }
  }, [searchParams]);

  const [formData, setFormData] = useState({
    date: defaultDate,
    startTime: defaultTime,
  })

  const defaultCenter = [10.850268581807446, 106.76508926692969]

  const filteredStations = stations.filter((station) => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.address.toLowerCase().includes(searchTerm.toLowerCase())

    let matchesType = false;
    if (filterType === "all") {
      matchesType = true;
    } else if (filterType === "DC_ULTRA") {
      // DC Ultra: loại DC ULTRA
      matchesType = station.type === "DC ULTRA";
    } else {
      matchesType = station.type === filterType;
    }

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

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const days = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"]
    const dayName = days[date.getDay()]
    const day = date.getDate().toString().padStart(2, "0")
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear()
    return `${dayName}, ${day}/${month}/${year}`
  }

  const formatTime = (timeString) => {
    return timeString
  }

  const [showDateModal, setShowDateModal] = useState(false)
  const [showTimeModal, setShowTimeModal] = useState(false)

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
                  <option value="DC ULTRA">⚡⚡⚡ DC Ultra - Siêu nhanh</option>
                </select>
              </div>

              <div className="results-count">
                Tìm thấy <strong>{filteredStations.length}</strong> trạm sạc
              </div>

              <div className="stations-list">
                {filteredStations.map((station) => (
                  <div
                    key={station.id}
                    className={`station-card ${station.type.toLowerCase().replace(" ", "-")} ${selectedStation?.id === station.id ? "selected" : ""}`}
                    onClick={() => {
                      setSelectedStation(station)
                      setStep(2)
                    }}
                  >
                    <div className="station-header">
                      <h3 className="station-name">{station.name}</h3>
                      <span className={`type-badge ${station.type.toLowerCase().replace(" ", "-")}`}>
                        {station.type === "AC" ? "⚡ AC" : station.type === "DC" ? "⚡⚡ DC" : "⚡⚡⚡ DC Ultra"}
                      </span>
                    </div>

                    <div className="station-availability">
                      <div className="availability-bar">
                        <div
                          className="availability-fill"
                          style={{
                            width: `${(station.available / station.total) * 100}%`,
                          }}
                        ></div>
                      </div>
                      <span className="availability-text">
                        {station.available}/{station.total} trụ khả dụng
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStations.length === 0 && (
                <div className="no-results">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                    <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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
                {/* <div className="station-quick-info">
                  <span className={`badge ${selectedStation.type.toLowerCase()}`}>{selectedStation.type}</span>
                  <span>⚡ {selectedStation.speed}</span>
                  <span>💰 {selectedStation.price}</span>
                </div> */}
              </div>

              <p className="selection-hint">Chọn trụ sạc tương thích với xe của bạn</p>

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
                      <h3 style={{ textAlign: "center" }}>Thông tin trạm sạc</h3>
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
                        <span className="summary-label">Loại trạm:</span>
                        <span className="summary-value">{selectedStation.type}</span>
                      </div>
                      {/* <div className="summary-item">
                        <span className="summary-label">Đánh giá:</span>
                        <span className="summary-value">⭐ {selectedStation.rating}/5</span>
                      </div> */}
                    </div>

                    <div className="summary-card charger-card">
                      <h3 style={{ textAlign: "center" }}>Thông tin trụ sạc</h3>
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
                        <div className="custom-datetime-picker">
                          <div className="datetime-display" onClick={() => setShowDateModal(true)}>
                            <div className="datetime-value">
                              <span className="datetime-icon">📅</span>
                              <span>{formatDate(formData.date)}</span>
                            </div>
                            <span className="datetime-arrow">→</span>
                          </div>
                          <div className="datetime-helper">💡 Nhấn vào để chọn ngày khác</div>
                        </div>
                      </div>

                      <div className="form-group">
                        <label htmlFor="startTime">
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                            <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
                            <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Giờ bắt đầu
                        </label>
                        <div className="custom-datetime-picker">
                          <div className="datetime-display" onClick={() => setShowTimeModal(true)}>
                            <div className="datetime-value">
                              <span className="datetime-icon">🕐</span>
                              <span>{formatTime(formData.startTime)}</span>
                            </div>
                            <span className="datetime-arrow">→</span>
                          </div>
                          <div className="datetime-helper">💡 Nhấn vào để chọn giờ khác</div>
                        </div>
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
                  center={selectedStation?.coords || defaultCenter}
                  zoom={selectedStation ? 16 : 13}
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

      {showDateModal && (
        <div className="datetime-modal-overlay" onClick={() => setShowDateModal(false)}>
          <div className="datetime-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn ngày sạc</h3>
              <button className="modal-close" onClick={() => setShowDateModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={(e) => {
                  handleChange(e)
                  setShowDateModal(false)
                }}
                min={minDate}
                max={maxDate}
                required
                className="modal-date-input"
              />
            </div>
          </div>
        </div>
      )}

      {showTimeModal && (
        <div className="datetime-modal-overlay" onClick={() => setShowTimeModal(false)}>
          <div className="datetime-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn giờ bắt đầu</h3>
              <button className="modal-close" onClick={() => setShowTimeModal(false)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={(e) => {
                  handleChange(e)
                  setShowTimeModal(false)
                }}
                step="900"
                required
                className="modal-time-input"
              />

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
