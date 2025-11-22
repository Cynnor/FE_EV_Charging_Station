import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./index.scss";
//import { useLocation } from "react-router-dom"

/**
 * Icon tùy chỉnh cho marker vị trí người dùng
 *
 * Sử dụng hình ảnh PNG tùy chỉnh để hiển thị vị trí hiện tại của người dùng trên bản đồ
 */
const userIcon = new L.Icon({
  iconUrl: "/assets/UserIcon.png",
  iconSize: [40, 40], // Chiều rộng x Chiều cao tính bằng pixel
});

//const location = useLocation();

/**
 * Icon tùy chỉnh cho marker trạm sạc
 *
 * Sử dụng hình ảnh PNG tùy chỉnh để hiển thị vị trí các trạm sạc
 */
const stationIcon = new L.Icon({
  iconUrl: "/assets/MapIcon.png",
  iconSize: [40, 40], // Chiều rộng x Chiều cao tính bằng pixel
});

/**
 * Component MapController
 *
 * Điều khiển chế độ xem và hoạt ảnh của bản đồ dựa trên vị trí người dùng và trạm được chọn
 * Phải nằm bên trong MapContainer để truy cập map instance thông qua useMap()
 *
 * @param {object} selectedStation - Trạm hiện đang được chọn từ danh sách
 * @param {array} userLocation - Tọa độ của người dùng [lat, lng]
 * @param {object} markerRefs - Refs đến tất cả marker trạm để điều khiển popup
 */
function MapController({ selectedStation, userLocation, markerRefs }) {
  const map = useMap(); // Lấy map instance từ Leaflet context

  /**
   * Đưa bản đồ tập trung vào vị trí người dùng khi component mount hoặc vị trí thay đổi
   * Thiết lập view đến vị trí người dùng với zoom level 15
   */
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 15);
    }
  }, [userLocation, map]);

  /**
   * Chuyển động bản đồ đến trạm được chọn khi người dùng click từ danh sách
   *
   * - Bay đến tọa độ trạm với hoạt ảnh mượt mà (thời lượng 1.5s)
   * - Zoom đến level 18 để xem chi tiết
   * - Tự động mở popup của marker
   */
  useEffect(() => {
    if (selectedStation) {
      // Tạo hoạt ảnh di chuyển bản đồ đến trạm được chọn
      map.flyTo(selectedStation.coords, 18, { duration: 1.5 });

      // Mở popup cho marker của trạm được chọn
      const marker = markerRefs.current[selectedStation.id];
      if (marker) marker.openPopup();
    }
  }, [selectedStation, map, markerRefs]);

  return null; // Component này không render gì cả
}

/**
 * Component ChargingMap
 *
 * Bản đồ tương tác hiển thị vị trí người dùng và các trạm sạc
 * Tính năng:
 * - Hiển thị vị trí hiện tại của người dùng với icon tùy chỉnh
 * - Hiển thị tất cả trạm sạc có sẵn với các marker
 * - Click vào marker để xem chi tiết trạm trong popup
 * - Hoạt ảnh mượt mà khi chọn trạm từ danh sách
 * - Bật tính năng zoom bằng chuột để điều hướng tốt hơn
 *
 * @param {array} stations - Mảng các object trạm sạc với coords, name, speed, price, address
 * @param {object} selectedStation - Trạm hiện đang được chọn (từ danh sách)
 * @param {array} userLocation - Tọa độ người dùng [lat, lng]
 * @param {function} onSelect - Callback khi marker trạm được click
 */
const ChargingMap = ({ stations, selectedStation, userLocation, onSelect }) => {
  /**
   * Lưu trữ references đến tất cả marker trạm
   * Được sử dụng để mở popup theo lập trình khi trạm được chọn từ danh sách
   */
  const markerRefs = useRef({});

  return (
    <MapContainer
      center={userLocation || [10.7769, 106.7009]} // Mặc định là TP.HCM nếu không có vị trí người dùng
      zoom={12} // Mức zoom ban đầu
      className="charging-map"
      scrollWheelZoom={true} // Bật zoom bằng con lăn chuột
    >
      {/* Lớp tile OpenStreetMap - dữ liệu bản đồ miễn phí */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      />

      {/* Marker Vị trí Người dùng - Chỉ hiển thị nếu có vị trí */}
      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>📍 Bạn đang ở đây</Popup>
        </Marker>
      )}

      {/* Marker Trạm Sạc - Lọc bỏ các tọa độ không hợp lệ */}
      {stations
        // Xác thực tọa độ trạm trước khi render
        .filter(
          (s) =>
            Array.isArray(s.coords) &&
            s.coords.length === 2 &&
            s.coords[0] &&
            s.coords[1]
        )
        .map((station) => (
          <Marker
            key={station.id}
            position={station.coords}
            icon={stationIcon}
            // Xử lý click marker để chọn trạm
            eventHandlers={{ click: () => onSelect(station) }}
            // Lưu marker ref để điều khiển popup theo lập trình
            ref={(el) => {
              if (el) markerRefs.current[station.id] = el;
            }}
          >
            {/* Popup thông tin trạm */}
            <Popup>
              <b>{station.name}</b>
              <br />⚡ {station.speed}
              <br />
              💰 {station.price}
              <br />
              📌 {station.address}
            </Popup>
          </Marker>
        ))}

      {/* Bộ điều khiển bản đồ cho hoạt ảnh và thay đổi view */}
      <MapController
        selectedStation={selectedStation}
        userLocation={userLocation}
        markerRefs={markerRefs}
      />
    </MapContainer>
  );
};

export default ChargingMap;
