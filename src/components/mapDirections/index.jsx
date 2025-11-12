import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import "./index.scss";

// Icon station
const stationIcon = new L.Icon({
  iconUrl: "/assets/MapIcon.png",
  iconSize: [40, 40],
});

// Component để thêm routing
function RoutingMachine({ userLocation, stationLocation }) {
  const map = useMap();
  const routingControlRef = useRef(null);

  useEffect(() => {
    if (!map || !userLocation || !stationLocation) return;

    // Xóa routing control cũ nếu có
    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
    }

    // Tạo routing control mới
    routingControlRef.current = L.Routing.control({
      waypoints: [
        L.latLng(userLocation[0], userLocation[1]),
        L.latLng(stationLocation[0], stationLocation[1]),
      ],
      routeWhileDragging: false,
      showAlternatives: false,
      lineOptions: {
        styles: [{ color: "#FF0000", weight: 6, opacity: 0.8 }],
      },
      createMarker: () => null, // Không tạo marker mặc định, dùng marker custom
      addWaypoints: false,
      draggableWaypoints: false,
      fitSelectedRoutes: true,
      show: true,
    }).addTo(map);

    // Cleanup khi component unmount
    return () => {
      if (routingControlRef.current && map) {
        map.removeControl(routingControlRef.current);
      }
    };
  }, [map, userLocation, stationLocation]);

  return null;
}

const MapDirections = ({ userLocation, stationLocation, stationInfo, onClose }) => {
  if (!userLocation || !stationLocation) {
    return (
      <div className="map-directions-container">
        <div className="map-error">
          <p>Không thể lấy vị trí của bạn. Vui lòng bật định vị GPS.</p>
          <button onClick={onClose} className="btn-close-map">
            Đóng
          </button>
        </div>
      </div>
    );
  }

  // Tính toán center giữa 2 điểm
  const centerLat = (userLocation[0] + stationLocation[0]) / 2;
  const centerLng = (userLocation[1] + stationLocation[1]) / 2;

  return (
    <div className="map-directions-container">
      <div className="map-header">
        <h3>Chỉ đường đến trạm sạc</h3>
        <button onClick={onClose} className="btn-close-map" title="Đóng">
          ✕
        </button>
      </div>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={13}
        className="directions-map"
        scrollWheelZoom={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        />

        {/* Circle marker vị trí người dùng - Round dot */}
        <CircleMarker
          center={userLocation}
          radius={10}
          pathOptions={{
            color: '#3b82f6',
            fillColor: '#3b82f6',
            fillOpacity: 1,
            weight: 3,
          }}
        >
          <Popup>📍 Vị trí của bạn</Popup>
        </CircleMarker>

        {/* Marker trạm sạc */}
        <Marker position={stationLocation} icon={stationIcon}>
          <Popup>
            <b>{stationInfo?.name || "Trạm sạc"}</b>
            <br />
            {stationInfo?.address && (
              <>
                📌 {stationInfo.address}
                <br />
              </>
            )}
          </Popup>
        </Marker>

        {/* Routing control */}
        <RoutingMachine
          userLocation={userLocation}
          stationLocation={stationLocation}
        />
      </MapContainer>
    </div>
  );
};

export default MapDirections;

