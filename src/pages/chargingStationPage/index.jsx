import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./index.scss";

// Icon cho người dùng
const userIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/64/64113.png",
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Icon cho trạm AC
const acIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/833/833314.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

// Icon cho trạm DC
const dcIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/833/833322.png",
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  map.setView(center, zoom);
  return null;
};

const ChargingMap = ({ stations, center, zoom = 13, onSelect, userLocation, onUpdateLocation }) => {
  return (
    <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }}>
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Marker trạm sạc */}
      {stations.map((station) => (
        <Marker
          key={station.id}
          position={station.coords}
          icon={station.type === "AC" ? acIcon : dcIcon}
          eventHandlers={{
            click: () => onSelect && onSelect(station),
          }}
        >
          <Popup>
            <b>{station.name}</b>
            <br />
            ⚡ {station.speed}
            <br />
            💰 {station.price}
          </Popup>
        </Marker>
      ))}

      {/* Marker người dùng */}
      {userLocation && (
        <Marker
          position={userLocation}
          icon={userIcon}
          eventHandlers={{
            click: () => {
              if (onUpdateLocation) onUpdateLocation();
            },
          }}
        >
          <Popup>Vị trí của bạn</Popup>
        </Marker>
      )}
    </MapContainer>
  );
};

export default ChargingMap;
