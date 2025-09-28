import { useEffect, useState } from "react";
import "./index.scss";

const stationTypes = [
  {
    id: "ac10",
    name: "Trạm sạc xe máy AC 10 cổng",
    price: "3.500 đ/kWh",
    speed: "7 kW",
    locations: [
      { id: 1, name: "Hà Nội", coords: { top: "20%", left: "50%" } },
      { id: 2, name: "Đà Nẵng", coords: { top: "50%", left: "55%" } },
      { id: 3, name: "TP.HCM", coords: { top: "80%", left: "45%" } },
    ],
  },
  {
    id: "ac4",
    name: "Trạm sạc xe máy AC 4 cổng",
    price: "3.500 đ/kWh",
    speed: "7 kW",
    locations: [
      { id: 1, name: "Hải Phòng", coords: { top: "18%", left: "60%" } },
      { id: 2, name: "Huế", coords: { top: "55%", left: "52%" } },
      { id: 3, name: "Cần Thơ", coords: { top: "82%", left: "42%" } },
    ],
  },
  {
    id: "dc60",
    name: "Trạm sạc nhanh DC 60 kW",
    price: "5.000 đ/kWh",
    speed: "60 kW",
    locations: [
      { id: 1, name: "Quảng Ninh", coords: { top: "15%", left: "58%" } },
      { id: 2, name: "Nha Trang", coords: { top: "70%", left: "53%" } },
      { id: 3, name: "Sóc Trăng", coords: { top: "85%", left: "44%" } },
    ],
  },
];

function getNowFormatted() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

export default function BookingPage() {
  const [selectedType, setSelectedType] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [time, setTime] = useState(getNowFormatted());
  const [payment, setPayment] = useState("ewallet");
  const [history, setHistory] = useState([]);
  const [chargingStatus, setChargingStatus] = useState(null);

  const handleBooking = () => {
    if (!selectedType || !selectedLocation || !time) {
      alert("Vui lòng chọn loại trạm, địa điểm và thời gian!");
      return;
    }

    const booking = {
      type: selectedType.name,
      location: selectedLocation.name,
      speed: selectedType.speed,
      price: selectedType.price,
      time,
      payment,
      status: "Đang sạc",
    };

    setHistory([booking, ...history]);
    setChargingStatus(booking);

    alert(
      `Đặt chỗ thành công!\nTrạm: ${booking.type}\nĐịa điểm: ${booking.location}\nThời gian: ${booking.time}\nThanh toán: ${booking.payment}`
    );
  };

  const locationsToShow = selectedType
    ? selectedType.locations.map((loc) => ({ ...loc, type: selectedType }))
    : stationTypes.flatMap((t) =>
        t.locations.map((loc) => ({ ...loc, type: t }))
      );

  useEffect(() => {
      window.scrollTo(0, 0);
    }, []);

  return (
    <div className="booking-layout">
      {/* Bên trái: Form + trạng thái + lịch sử */}
      <div className="left-panel">
        <h1>Đăng ký sạc</h1>

        <h2>Chọn loại trạm</h2>
        <div className="type-list">
          {stationTypes.map((type) => (
            <button
              key={type.id}
              className={`type-btn ${
                selectedType?.id === type.id ? "active" : ""
              }`}
              onClick={() => {
                setSelectedType(type);
                setSelectedLocation(null);
              }}
            >
              ⚡ {type.name} <br />
              <small>
                {type.speed} | {type.price}
              </small>
            </button>
          ))}
        </div>

        {selectedLocation && (
          <div className="summary">
            <p>
              <b>Loại trạm:</b> {selectedLocation.type?.name}
            </p>
            <p>
              <b>Địa điểm:</b> {selectedLocation.name}
            </p>
            <p>
              <b>Tốc độ:</b> {selectedLocation.type?.speed}
            </p>
            <p>
              <b>Giá:</b> {selectedLocation.type?.price}
            </p>
          </div>
        )}

        <label>Thời gian sạc:</label>
        <input
          type="datetime-local"
          value={time}
          min={getNowFormatted()}
          onChange={(e) => setTime(e.target.value)}
        />

        <label>Phương thức thanh toán:</label>
        <select value={payment} onChange={(e) => setPayment(e.target.value)}>
          <option value="ewallet">Ví điện tử</option>
          <option value="bank">Ngân hàng</option>
          <option value="subscription">Gói thuê bao</option>
        </select>

        <button className="book-btn" onClick={handleBooking}>
          Đặt chỗ & Thanh toán
        </button>

        {/* Trạng thái sạc */}
        {chargingStatus && (
          <div className="status-box">
            <h3>🔋 Trạng thái sạc hiện tại</h3>
            <p>
              <b>Trạm:</b> {chargingStatus.type}
            </p>
            <p>
              <b>Địa điểm:</b> {chargingStatus.location}
            </p>
            <p>
              <b>Thời gian:</b> {chargingStatus.time}
            </p>
            <p>
              <b>Trạng thái:</b> {chargingStatus.status}
            </p>
          </div>
        )}

        {/* Lịch sử đặt chỗ */}
        {history.length > 0 && (
          <div className="history-box">
            <h3>📜 Lịch sử đặt chỗ</h3>
            <ul>
              {history.map((h, i) => (
                <li key={i}>
                  {h.type} - {h.location} - {h.time} ({h.status})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Bên phải: Map */}
      <div className="right-panel">
        <h2>Bản đồ trạm sạc</h2>
        <div className="map-container">
          <img src="/src/config/assets/map.jpg" alt="Bản đồ" className="map-image" />

          {locationsToShow.map((loc) => (
            <button
              key={`${loc.type.id}-${loc.id}`}
              className={`map-marker ${
                selectedLocation?.id === loc.id &&
                selectedLocation?.type?.id === loc.type.id
                  ? "active"
                  : ""
              }`}
              style={{
                top: loc.coords.top,
                left: loc.coords.left,
              }}
              onClick={() => setSelectedLocation(loc)}
            >
              📍
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
