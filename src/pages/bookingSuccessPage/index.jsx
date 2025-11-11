import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MapPin, Navigation, Clock, Zap, Car, Calendar, CheckCircle } from "lucide-react";
import MapDirections from "../../components/mapDirections";
import "./index.scss";

const BookingSuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { reservation, station, charger, vehicle, bookingTime } = location.state || {};

  const [showMap, setShowMap] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!reservation) {
      navigate("/", { replace: true });
      return;
    }

    // Automatically get user location on mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([
            position.coords.latitude,
            position.coords.longitude,
          ]);
          setIsLoadingLocation(false);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsLoadingLocation(false);
        }
      );
    } else {
      setIsLoadingLocation(false);
    }
  }, [reservation, navigate]);

  if (!reservation) return null;

  const formatDateTime = (dateStr, timeStr) => {
    const date = new Date(dateStr);
    const days = [
      "Chủ nhật",
      "Thứ hai",
      "Thứ ba",
      "Thứ tư",
      "Thứ năm",
      "Thứ sáu",
      "Thứ bảy",
    ];
    const dayName = days[date.getDay()];
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${dayName}, ${day}/${month}/${year} - ${timeStr}`;
  };

  const handleGoHome = () => {
    navigate("/", { replace: true });
  };

  const handleGoToChargingSession = () => {
    // Extract port information from reservation
    const firstItem = reservation?.items?.[0];
    
    // Try to get port ID from different sources:
    // 1. If slot is an object with port property
    const portFromSlot = typeof firstItem?.slot === 'object' 
      ? (firstItem.slot.port?._id || firstItem.slot.port?.id || firstItem.slot.port)
      : null;
    
    // 2. Use charger ID as fallback (charger is essentially the port/trụ sạc)
    const portId = portFromSlot || charger?.id || charger?._id;
    
    // Debug: Log the data we're working with
    console.log("📍 ===== NAVIGATE TO CHARGING SESSION PAGE =====");
    console.log("This is ONLY navigation, NOT starting the charging yet!");
    console.log("User needs to click 'Bắt đầu sạc' button on charging session page to actually start.");
    console.log("Reservation:", reservation);
    console.log("First Item:", firstItem);
    console.log("Slot:", firstItem?.slot);
    console.log("Charger:", charger);
    console.log("Extracted Port ID:", portId);
    
    const navigationState = {
      reservation: {
        ...reservation,
        id: reservation?.id || reservation?._id,
        portId: portId,
        powerKw: charger?.power || 150,
        status: reservation?.status || "pending",
        startAt: firstItem?.startAt,
        endAt: firstItem?.endAt,
        items: reservation?.items || [],
      },
      vehicle: {
        id: vehicle?.id || vehicle?._id,
        plateNumber: vehicle?.plateNumber,
        make: vehicle?.make,
        model: vehicle?.model,
        batteryCapacityKwh: vehicle?.batteryCapacityKwh,
        connectorType: vehicle?.connectorType,
      }
    };
    
    console.log("Navigation State:", navigationState);
    
    navigate("/chargingSession", { 
      replace: true,
      state: navigationState
    });
  };

  const handleCloseMap = () => {
    setShowMap(false);
    sessionStorage.setItem("scrollToHistory", "true");
    navigate("/profile", { replace: true });
  };

  // Calculate distance and estimated time
  const getDistanceKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const distance = userLocation && station?.coords
    ? getDistanceKm(userLocation[0], userLocation[1], station.coords[0], station.coords[1])
    : null;

  const estimatedTime = distance ? Math.ceil(distance * 2) : null;

  // Lấy tọa độ của trạm sạc
  const stationLocation =
    station?.coords &&
    Array.isArray(station.coords) &&
    station.coords.length === 2
      ? [parseFloat(station.coords[0]), parseFloat(station.coords[1])]
      : null;

  return (
    <div className="booking-success-page">
      <div className="success-layout">
        {/* Left Panel - Booking Details */}
        <div className="success-details-panel">
          <div className="success-header">
            <div className="success-icon-wrapper">
              <CheckCircle size={48} strokeWidth={2.5} />
            </div>
            <h1 className="success-title">Đặt chỗ thành công!</h1>
            {reservation?.status !== 'confirmed' && (
              <p className="success-subtitle">
                Slot sạc của bạn sẽ được giữ chỗ trong vòng 15 phút
              </p>
            )}
            {reservation?.status === 'confirmed' && (
              <p className="success-subtitle" style={{ color: '#28a745' }}>
                ✅ Đã thanh toán - Sẵn sàng để sạc
              </p>
            )}
          </div>

          <div className="booking-details-content">
            {/* Giờ đặt lịch */}
            <div className="detail-card">
              <div className="card-header">
                <Calendar size={20} />
                <h3>Giờ đặt lịch</h3>
              </div>
              <div className="card-body">
                <div className="info-row highlight">
                  <Clock size={16} />
                  <span className="info-value">
                    {bookingTime?.date && bookingTime?.startTime
                      ? formatDateTime(bookingTime.date, bookingTime.startTime)
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Thông tin trạm & trụ */}
            <div className="detail-card">
              <div className="card-header">
                <Zap size={20} />
                <h3>Thông tin trạm & trụ</h3>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Trạm sạc</span>
                  <span className="info-value">{station?.name || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Trụ sạc</span>
                  <span className="info-value">{charger?.name || "—"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Công suất</span>
                  <span className="info-value">{charger?.power || "—"}</span>
                </div>
                <div className="info-row address-row">
                  <MapPin size={16} />
                  <span className="info-value">{station?.address || "—"}</span>
                </div>
                {distance && (
                  <>
                    <div className="info-row">
                      <Navigation size={16} />
                      <span className="info-label">Khoảng cách</span>
                      <span className="info-value">{distance.toFixed(1)} km</span>
                    </div>
                    <div className="info-row">
                      <Clock size={16} />
                      <span className="info-label">Thời gian di chuyển</span>
                      <span className="info-value">~{estimatedTime} phút</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Phương tiện */}
            <div className="detail-card">
              <div className="card-header">
                <Car size={20} />
                <h3>Phương tiện của tôi</h3>
              </div>
              <div className="card-body">
                <div className="vehicle-info">
                  <div className="vehicle-icon">🏍️</div>
                  <div className="vehicle-details">
                    <div className="vehicle-plate">{vehicle?.plateNumber || "—"}</div>
                    <div className="vehicle-model">
                      {vehicle?.make || "—"} {vehicle?.model || ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button type="button" className="btn-secondary" onClick={handleGoHome}>
              Về trang chủ
            </button>
            <button type="button" className="btn-primary-custom" onClick={handleGoToChargingSession}>
              Bạn đã tới nơi?
            </button>
          </div>
        </div>

        {/* Right Panel - Map */}
        <div className="success-map-panel">
          {showMap && userLocation && stationLocation ? (
            <MapDirections
              userLocation={userLocation}
              stationLocation={stationLocation}
              stationInfo={{
                name: station?.name,
                address: station?.address,
              }}
              onClose={handleCloseMap}
            />
          ) : (
            <div className="map-loading">
              {isLoadingLocation ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  <p>Đang tải bản đồ...</p>
                </div>
              ) : (
                <div className="loading-content">
                  <MapPin size={48} />
                  <p>Không thể hiển thị bản đồ</p>
                  <small>Vui lòng bật định vị GPS</small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingSuccessPage;
