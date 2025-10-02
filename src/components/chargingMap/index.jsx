import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import "./index.scss";
//import { useLocation } from "react-router-dom"

// Icon user
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [40, 40],
});

//const location = useLocation();


// Icon station
const stationIcon = new L.Icon({
  iconUrl: "/src/assets/MapIcon.png",
  iconSize: [40, 40],
});

// Controller để fly map khi user hoặc selected station thay đổi
function MapController({ selectedStation, userLocation }) {
  const map = useMap();

  // Focus vào vị trí người dùng khi load map
  useEffect(() => {
    if (userLocation) {
      map.setView(userLocation, 15); // setView không gây scroll trang
    }
  }, [userLocation, map]);

  // Fly tới trạm khi chọn marker
  useEffect(() => {
    if (selectedStation) {
      map.flyTo(selectedStation.coords, 18, { duration: 1.5 });
    }
  }, [selectedStation, map]);

  return null;
}

const ChargingMap = ({ stations, selectedStation, userLocation, onSelect }) => {
  return (
    <MapContainer
      center={userLocation || [10.7769, 106.7009]}
      zoom={12}
      className="charging-map"
      scrollWheelZoom={true} // zoom bằng chuột mà không cuộn page
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

      {stations.map((station) => (
        <Marker
          key={station.id}
          position={station.coords}
          icon={stationIcon}
          eventHandlers={{ click: () => onSelect(station) }}
        >
          <Popup>
            <b>{station.name}</b><br />
            ⚡ {station.speed}<br />
            💰 {station.price}
          </Popup>
        </Marker>
      ))}

      <MapController selectedStation={selectedStation} userLocation={userLocation} />
    </MapContainer>
  );
};

export default ChargingMap;
