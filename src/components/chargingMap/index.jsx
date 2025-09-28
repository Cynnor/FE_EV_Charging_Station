import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";

// Tạo icon marker (fix lỗi marker mặc định không load)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Icon marker cho trạm được chọn (màu đỏ)
const selectedMarkerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-red.png",
  iconSize: [30, 46],
  iconAnchor: [15, 46],
  popupAnchor: [1, -34],
});

// Component để điều khiển map zoom
function MapController({ selectedStation }) {
  const map = useMap();

  useEffect(() => {
    if (selectedStation) {
      // Zoom đến trạm được chọn với animation mượt
      map.flyTo(selectedStation.coords, 18, {
        duration: 1.5, // 1.5 giây
        easeLinearity: 0.1
      });
    }
  }, [selectedStation, map]);

  return null;
}

export default function ChargingMap({ stations, center, zoom = 15, onSelect, selectedStation }) {
  return (
    <div style={{ 
      width: "100%", 
      height: "100%", 
      position: "absolute",
      top: 0,
      left: 0
    }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ 
          height: "100%", // Chiếm 100% chiều cao của div cha
          width: "100%"
        }}
      >
      {/* Style bản đồ (có thể đổi sang dark/light tuỳ thích) */}
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OSM</a> &copy; <a href='https://carto.com/'>CARTO</a>"
        subdomains={["a", "b", "c", "d"]}
      />

      {/* Component điều khiển zoom */}
      <MapController selectedStation={selectedStation} />

      {/* Render các trạm */}
      {stations.map((station) => {
        const isSelected = selectedStation && selectedStation.id === station.id;
        return (
          <Marker
            key={station.id}
            position={station.coords}
            icon={isSelected ? selectedMarkerIcon : markerIcon}
            eventHandlers={{
              click: () => onSelect && onSelect(station),
            }}
          >
            <Popup>
              <b>{station.name}</b> <br />
              ⚡ {station.speed} <br />
              💰 {station.price}
              {isSelected && <><br /><span style={{ color: 'red', fontWeight: 'bold' }}>✓ Đã chọn</span></>}
            </Popup>
          </Marker>
        );
      })}
      </MapContainer>
    </div>
  );
}