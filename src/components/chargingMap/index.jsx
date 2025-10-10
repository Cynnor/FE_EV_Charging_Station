import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./index.scss";
//import { useLocation } from "react-router-dom"

// Icon user
const userIcon = new L.Icon({
  iconUrl: "/src/assets/UserIcon.png",
  iconSize: [40, 40],
});

//const location = useLocation();


// Icon station
const stationIcon = new L.Icon({
  iconUrl: "/src/assets/MapIcon.png",
  iconSize: [40, 40],
});

// Controller để fly map khi user hoặc selected station thay đổi
function MapController({ selectedStation, userLocation, markerRefs }) {
  const map = useMap();

  // Focus vào vị trí người dùng khi load map
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 15);
    }
  }, [userLocation, map]);

  // Fly tới trạm khi chọn từ list
  useEffect(() => {
    if (selectedStation) {
      map.flyTo(selectedStation.coords, 18, { duration: 1.5 });

      // mở popup marker
      const marker = markerRefs.current[selectedStation.id];
      if (marker) marker.openPopup();
    }
  }, [selectedStation, map, markerRefs]);

  return null;
}

const ChargingMap = ({ stations, selectedStation, userLocation, onSelect }) => {
  // lưu ref các marker
  const markerRefs = useRef({});

  return (
    <MapContainer
      center={userLocation || [10.7769, 106.7009]}
      zoom={12}
      className="charging-map"
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
      />

      {userLocation && (
        <Marker position={userLocation} icon={userIcon}>
          <Popup>📍 Bạn đang ở đây</Popup>
        </Marker>
      )}

      {stations
  .filter((s) => Array.isArray(s.coords) && s.coords.length === 2 && s.coords[0] && s.coords[1])
  .map((station) => (
        <Marker
          key={station.id}
          position={station.coords}
          icon={stationIcon}
          eventHandlers={{ click: () => onSelect(station) }}
          ref={(el) => {
            if (el) markerRefs.current[station.id] = el;
          }}
        >
          <Popup>
            <b>{station.name}</b><br />
            ⚡ {station.speed}<br/>
            💰 {station.price}<br/>
            📌 {station.address}
           </Popup>
        </Marker>
      ))}

      <MapController
        selectedStation={selectedStation}
        userLocation={userLocation}
        markerRefs={markerRefs}
      />
    </MapContainer>
  );
};

export default ChargingMap;
