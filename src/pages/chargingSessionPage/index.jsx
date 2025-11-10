import "./index.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../../config/api";
import CustomPopup from "../../components/customPopup";
import PaymentConfirmPopup from "../../components/paymentConfirmPopup";
import ChargingStationCarousel from "../../components/chargingStationCarousel";

// Update charging constants and cost calculations
const PORT_PRICING = {
  AC: 10000, // 10,000 VNĐ/30 phút
  DC: 15000, // 15,000 VNĐ/30 phút
  Ultra: 20000, // 20,000 VNĐ/30 phút
};
const ENERGY_PRICE_PER_KWH = 3858; // VNĐ per kWh (từ API)

const ChargingSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicleData, setVehicleData] = useState(null);
  const [chargingData, setChargingData] = useState(null);
  const [isCharging, setIsCharging] = useState(false);
  // const [isPaused, setIsPaused] = useState(false);
  const [portInfo, setPortInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pricingEstimate, setPricingEstimate] = useState(null);

  // Add popup state
  const [popup, setPopup] = useState({
    isOpen: false,
    message: "",
    type: "info",
  });

  const [paymentPopup, setPaymentPopup] = useState({
    isOpen: false,
    currentCharge: 0,
    timeElapsed: 0,
    totalCost: 0,
  });

  const showPopup = (message, type = "info") => {
    setPopup({
      isOpen: true,
      message,
      type,
    });
  };

  const closePopup = () => {
    setPopup({
      ...popup,
      isOpen: false,
    });
  };

  const showPaymentPopup = () => {
    setPaymentPopup({
      isOpen: true,
      currentCharge: chargingData.currentCharge,
      timeElapsed: chargingData.timeElapsed,
      totalCost: chargingData.chargingCost,
    });
  };

  const closePaymentPopup = () => {
    setPaymentPopup({
      ...paymentPopup,
      isOpen: false,
    });
  };

  useEffect(() => {
    // Get reservation and vehicle from location state
    const reservation = location.state?.reservation;
    const vehicle = location.state?.vehicle;

    if (!reservation || !vehicle) {
      showPopup(
        "Không tìm thấy thông tin đặt chỗ hoặc xe. Vui lòng quay lại trang lịch sử.",
        "error"
      );
      navigate("/profile");
      return;
    }

    // Fetch port information from API
    const fetchPortInfo = async () => {
      try {
        setLoading(true);

        // Get portId from reservation structure - support both old and new formats
        let portId = null;

        // New format: reservation.items[0].slot.port
        if (reservation.items?.[0]?.slot?.port) {
          portId = reservation.items[0].slot.port;
        }
        // Old format: reservation.portId
        else if (reservation.portId) {
          portId = reservation.portId;
        }

        if (!portId) {
          console.error("Reservation structure:", reservation);
          throw new Error("Không tìm thấy portId trong reservation");
        }

        console.log("Fetching port info for portId:", portId);

        // Try different endpoints to find the correct one
        let portData = null;
        try {
          // Try /stations/ports/{id} first
          const response = await api.get(`/stations/ports/${portId}`);
          portData = response.data?.data || response.data;
        } catch (err) {
          console.log("Failed with /stations/ports, trying /ports...");
          // Fallback to /ports/{id}
          const response = await api.get(`/ports/${portId}`);
          portData = response.data?.data || response.data;
        }

        // Get powerKw and type from port data
        const powerKw = Number(portData.powerKw);
        const portType = portData.type; // AC, DC, DC Ultra

        // Calculate hourly rate based on port type
        let bookingRatePerHour = PORT_PRICING[portType] || PORT_PRICING.AC;

        // Debug logging
        console.log("Port Data:", portData);
        console.log("Port Type:", portType);
        console.log("Power kW:", powerKw);
        console.log("Booking Rate Per Hour:", bookingRatePerHour);

        setPortInfo({
          portId: portId,
          powerKw: powerKw,
          bookingRatePerHour: bookingRatePerHour,
          portType: portType,
          speed: portData.speed,
        });
      } catch (error) {
        console.error("Error fetching port info:", error);
        console.error("Error details:", error.response?.data);
        console.error("Error status:", error.response?.status);

        // Check if we have port info from reservation itself
        const reservation = location.state?.reservation;
        if (reservation?.port || reservation?.portData) {
          console.log("Using port data from reservation");
          const portData = reservation.port || reservation.portData;
          const powerKw = Number(portData.powerKw || 7);
          const portType = portData.type || "AC";
          const bookingRatePerHour = PORT_PRICING[portType] || PORT_PRICING.AC;

          setPortInfo({
            portId: portData.id || "unknown",
            powerKw: powerKw,
            bookingRatePerHour: bookingRatePerHour,
            portType: portType,
            speed: portData.speed || "slow",
          });
        } else {
          showPopup(
            "Lỗi khi lấy thông tin cổng sạc. Sử dụng giá trị mặc định.",
            "error"
          );

          // Ultimate fallback: use default AC values
          setPortInfo({
            portId: "unknown",
            powerKw: 7,
            bookingRatePerHour: PORT_PRICING.AC,
            portType: "AC",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    // Always try to fetch port info
    fetchPortInfo();

    // Set vehicle data
    setVehicleData({
      id: vehicle.id,
      make: vehicle.make,
      model: vehicle.model,
      plateNumber: vehicle.plateNumber,
      batteryCapacity: vehicle.batteryCapacityKwh,
      connectorType: vehicle.connectorType,
    });
  }, [location.state, navigate]);

  useEffect(() => {
    if (vehicleData && portInfo) {
      initializeChargingSession();
    }
  }, [vehicleData, portInfo]);

  useEffect(() => {
    if (chargingData && isCharging) {
      // Xác định interval dựa trên loại cổng
      // AC: 2 giây = 1% (1% = 1 phút)
      // DC: 1 giây = 1% (2% = 1 phút)
      // DC Ultra: 0.67 giây = 1% (3% = 1 phút)
      let updateInterval = 2000; // Mặc định AC

      if (chargingData.portType === "Ultra") {
        updateInterval = 667; // DC Ultra: ~0.67 giây = 1%
      } else if (chargingData.portType === "DC") {
        updateInterval = 1000; // DC: 1 giây = 1%
      }

      // Update theo interval tương ứng với loại cổng
      const interval = setInterval(updateChargingStatus, updateInterval);
      return () => clearInterval(interval);
    }
  }, [chargingData, isCharging]);

  const initializeChargingSession = () => {
    const initialCharge = Math.floor(Math.random() * 30) + 10; // 10-40%
    const targetCharge = 100;
    const chargeNeeded = targetCharge - initialCharge;

    // Calculate estimated time based on battery capacity and port power
    let estimatedMinutes = Math.ceil(
      (chargeNeeded * vehicleData.batteryCapacity) / portInfo.powerKw
    ); // 0.6 efficiency factor

    // Điều chỉnh thời gian dự kiến dựa trên loại cổng
    // AC: 1% = 1 phút
    // DC: 2% = 1 phút (nhanh gấp 2)
    // DC Ultra: 3% = 1 phút (nhanh gấp 3)
    if (portInfo.portType === "DC") {
      estimatedMinutes = Math.ceil(estimatedMinutes / 2);
    } else if (portInfo.portType === "Ultra") {
      estimatedMinutes = Math.ceil(estimatedMinutes / 3);
    }

    setChargingData({
      ...vehicleData,
      currentCharge: initialCharge,
      chargeRate: portInfo.powerKw,
      remainingTime: estimatedMinutes,
      chargingCost: 0,
      startTime: new Date(),
      initialCharge: initialCharge,
      timeElapsed: 0,
      bookingRatePerHalfHour: portInfo.bookingRatePerHour,
      portType: portInfo.portType,
    });
  };

  const updateChargingStatus = () => {
    setChargingData((prev) => {
      if (prev.currentCharge >= 100) {
        setIsCharging(false);
        const paymentData = {
          chargingData: {
            vehicleInfo: {
              plateNumber: prev.plateNumber,
              make: prev.make,
              model: prev.model,
            },
            chargingInfo: {
              currentCharge: 100,
              timeElapsed: prev.timeElapsed,
              durationHours: prev.durationHours,
              totalCost: Math.round(prev.chargingCost),
              bookingCost: Math.round(prev.bookingCost),
              energyCost: Math.round(prev.energyCost),
              energyKwh: prev.energyKwh,
              startTime: prev.startTime,
              powerKw: prev.chargeRate,
              portType: prev.portType,
              bookingRatePerHalfHour: prev.bookingRatePerHalfHour,
              energyPricePerKwh: ENERGY_PRICE_PER_KWH,
              thirtyMinIntervals: prev.thirtyMinIntervals,
            },
          },
        };
        // Tự động chuyển sang trang payment khi sạc đầy
        setTimeout(() => {
          navigate("/payment", {
            state: paymentData,
          });
        }, 2000);

        showPopup("Sạc đầy! Đang chuyển đến trang thanh toán...", "success");
        return prev;
      }

      // Tăng % pin dựa trên loại cổng
      const increment = 1;
      const newCharge = Math.min(prev.currentCharge + increment, 100);

      // Tính thời gian thực tế đã sạc
      // AC: 1% = 1 phút
      // DC: 2% = 1 phút → 1% = 0.5 phút
      // DC Ultra: 3% = 1 phút → 1% = 0.333 phút
      let timeIncrement = 1; // AC mặc định
      if (prev.portType === "DC") {
        timeIncrement = 0.5; // DC: 1% = 0.5 phút
      } else if (prev.portType === "Ultra") {
        timeIncrement = 1 / 3; // DC Ultra: 1% = 0.333 phút
      }

      const newTimeElapsed = prev.timeElapsed + timeIncrement;
      // Tính phí đặt lịch: số khung 30 phút × đơn giá
      const thirtyMinIntervals = 1 + Math.floor(newTimeElapsed / 30);
      const bookingCost = thirtyMinIntervals * prev.bookingRatePerHalfHour;

      // Tính thời gian sạc (giờ)
      const durationHours = newTimeElapsed / 60;

      // Tính năng lượng tiêu thụ: powerKw × số giờ
      const energyKwh = prev.chargeRate * durationHours;

      // Tính chi phí điện: thời gian (giờ) × năng lượng tiêu thụ × đơn giá điện
      const energyCost = durationHours * energyKwh * ENERGY_PRICE_PER_KWH;

      // Tổng chi phí = booking cost + energy cost
      const totalCost = bookingCost + energyCost;

      // Tính thời gian còn lại dựa trên loại cổng
      const remainingCharge = 100 - newCharge;
      const newRemainingTime = remainingCharge * timeIncrement;

      return {
        ...prev,
        currentCharge: newCharge,
        chargingCost: Math.round(totalCost),
        remainingTime: Math.ceil(newRemainingTime),
        timeElapsed: newTimeElapsed,
        bookingCost: Math.round(bookingCost),
        energyCost: Math.round(energyCost),
        energyKwh: energyKwh,
        durationHours: durationHours,
        thirtyMinIntervals: thirtyMinIntervals,
      };
    });
  };

  // TẠM THỜI TẮT - Hàm gọi API gây xung đột với tính toán local
  // Hàm gọi API để tính giá chính xác - không block UI
  // const calculatePricingFromAPI = async (currentData, timeElapsed) => {
  //   try {
  //     const startAt = new Date(currentData.startTime).toISOString();
  //     const endAt = new Date(currentData.startTime.getTime() + timeElapsed * 60000).toISOString();
  //
  //     const response = await api.post('/pricing/estimate', {
  //       portId: portInfo.portId,
  //       startAt: startAt,
  //       endAt: endAt,
  //       assumePowerKw: currentData.chargeRate
  //     });
  //
  //     if (response.data?.success && response.data?.data) {
  //       const pricingData = response.data.data;
  //
  //       setChargingData(prev => {
  //         const shouldUpdate =
  //           Math.abs((pricingData.bookingCost || 0) - (prev.bookingCost || 0)) > 100 ||
  //           Math.abs((pricingData.energyCost || 0) - (prev.energyCost || 0)) > 100;
  //
  //         if (!shouldUpdate) return prev;
  //
  //         return {
  //           ...prev,
  //           bookingCost: pricingData.bookingCost || prev.bookingCost,
  //           energyCost: pricingData.energyCost || prev.energyCost,
  //           energyKwh: pricingData.energyKwh || prev.energyKwh,
  //           chargingCost: pricingData.total || prev.chargingCost,
  //         };
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error calculating pricing from API:', error);
  //   }
  // };

  const handlePayment = () => {
    if (!chargingData) {
      showPopup("Vui lòng đợi khởi tạo thông tin sạc", "error");
      return;
    }

    if (isCharging) {
      showPopup("Phiên sạc đang hoạt động", "error");
      return;
    }

    // Update start time to current time when starting charge
    // Bắt đầu với phí đặt lịch ban đầu (1 lần)
    const initialBookingCost = chargingData.bookingRatePerHalfHour;

    setChargingData((prev) => ({
      ...prev,
      startTime: new Date(),
      timeElapsed: 0,
      chargingCost: initialBookingCost,
      bookingCost: initialBookingCost,
      energyCost: 0,
      energyKwh: 0,
      durationHours: 0,
      thirtyMinIntervals: 1,
    }));

    // Start charging immediately
    setIsCharging(true);
    showPopup("Bắt đầu quá trình sạc!", "success");
  };

  // const handlePause = () => {
  //   setIsPaused(true);
  //   setIsCharging(false);
  // };

  // const handleResume = () => {
  //   setIsPaused(false);
  //   setIsCharging(true);
  // };

  const handlePayNow = () => {
    if (!chargingData) return;

    // Dừng sạc tạm thời
    setIsCharging(false);

    // Hiển thị popup với thông tin hiện tại
    showPaymentPopup();
  };

  const handleConfirmPayment = () => {
    closePaymentPopup();

    showPopup("Chuyển đến trang thanh toán...", "success");

    const paymentData = {
      chargingData: {
        vehicleInfo: {
          plateNumber: chargingData.plateNumber,
          make: chargingData.make,
          model: chargingData.model,
        },
        chargingInfo: {
          currentCharge: chargingData.currentCharge,
          timeElapsed: chargingData.timeElapsed,
          durationHours: chargingData.durationHours,
          totalCost: Math.round(chargingData.chargingCost),
          bookingCost: Math.round(chargingData.bookingCost),
          energyCost: Math.round(chargingData.energyCost),
          energyKwh: chargingData.energyKwh,
          startTime: chargingData.startTime,
          powerKw: chargingData.chargeRate,
          portType: chargingData.portType,
          bookingRatePerHalfHour: chargingData.bookingRatePerHalfHour,
          energyPricePerKwh: ENERGY_PRICE_PER_KWH,
          thirtyMinIntervals: chargingData.thirtyMinIntervals,
        },
      },
    };

    // Debug: Hiển thị dữ liệu sẽ gửi đi
    // console.log('=== DỮ LIỆU CHUYỂN SANG PAYMENT (THANH TOÁN NGAY) ===');
    // console.log('Vehicle Info:', paymentData.chargingData.vehicleInfo);
    // console.log('Charging Info:', paymentData.chargingData.chargingInfo);
    // console.log('Tổng chi phí:', paymentData.chargingData.chargingInfo.totalCost.toLocaleString('vi-VN'), 'VNĐ');
    // console.log('Phí đặt lịch:', paymentData.chargingData.chargingInfo.bookingCost.toLocaleString('vi-VN'), 'VNĐ');
    // console.log('Phí điện:', paymentData.chargingData.chargingInfo.energyCost.toLocaleString('vi-VN'), 'VNĐ');
    // console.log('Số khung 30 phút:', paymentData.chargingData.chargingInfo.thirtyMinIntervals);
    // console.log('Thời gian sạc:', paymentData.chargingData.chargingInfo.timeElapsed, 'phút');
    // console.log('Năng lượng tiêu thụ:', paymentData.chargingData.chargingInfo.energyKwh, 'kWh');
    // console.log('======================================================');

    // Navigate to payment page with charging data
    setTimeout(() => {
      navigate("/payment", {
        state: paymentData,
      });
    }, 1500);
  };

  const handleCancelPayment = () => {
    // Đóng popup và tiếp tục sạc
    closePaymentPopup();
    setIsCharging(true);
    showPopup("Tiếp tục sạc...", "info");
  };

  const EmptyVehicleInfo = () => (
    <div className="info-card vehicle-info">
      <h2>Thông tin xe</h2>
      <div className="info-grid">
        <div className="info-item">
          <span className="label">Biển số:</span>
          <span className="value">---</span>
        </div>
        <div className="info-item">
          <span className="label">Xe:</span>
          <span className="value">---</span>
        </div>
        <div className="info-item">
          <span className="label">Dung lượng pin:</span>
          <span className="value">---</span>
        </div>
        <div className="info-item">
          <span className="label">Loại cổng sạc:</span>
          <span className="value">---</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="charging-session-page">
      <CustomPopup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <PaymentConfirmPopup
        isOpen={paymentPopup.isOpen}
        currentCharge={paymentPopup.currentCharge}
        timeElapsed={paymentPopup.timeElapsed}
        totalCost={paymentPopup.totalCost}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
      />

      {loading ? (
        <div className="loading-container">
          <p>Đang tải thông tin cổng sạc...</p>
        </div>
      ) : (
        <div className="charging-session">
          <div className="header-container">
            <button className="back-button" onClick={() => navigate(-1)}>
              ← Quay lại
            </button>
            <h1>Thông tin phiên sạc</h1>
            <div className="header-actions">
              {!isCharging && (
                <button
                  className="payment-btn start-btn"
                  onClick={handlePayment}
                  disabled={!chargingData}
                >
                  Bắt đầu sạc
                </button>
              )}
              {/* {isCharging && (
                <button 
                  className="payment-btn pause-btn"
                  onClick={handlePause}
                >
                  ⏸ Tạm dừng
                </button>
              )}
              {isPaused && (
                <button 
                  className="payment-btn resume-btn"
                  onClick={handleResume}
                >
                  ▶ Tiếp tục
                </button>
              } */}
              {isCharging && (
                <button
                  className="payment-btn pay-now-btn"
                  onClick={handlePayNow}
                >
                  Thanh toán ngay
                </button>
              )}
            </div>
          </div>

          <div className="session-content">
            <div className="session-left">
              {!chargingData ? (
                <EmptyVehicleInfo />
              ) : (
                <>
                  <div className="info-card vehicle-info">
                    <h2>Thông tin xe</h2>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="label">Biển số:</span>
                        <span className="value">
                          {chargingData.plateNumber}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Xe:</span>
                        <span className="value">
                          {chargingData.make} {chargingData.model}
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Dung lượng pin:</span>
                        <span className="value">
                          {chargingData.batteryCapacity} kWh
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="label">Loại cổng sạc:</span>
                        <span className="value">
                          {chargingData.connectorType}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="info-card charging-status">
                    <h2>Trạng thái sạc</h2>
                    <div className="battery-indicator">
                      <div
                        className="battery-level"
                        style={{ width: `${chargingData.currentCharge}%` }}
                      >
                        {chargingData.currentCharge >= 20 && (
                          <span>{chargingData.currentCharge}%</span>
                        )}
                      </div>
                      {chargingData.currentCharge < 20 && (
                        <span
                          className="battery-percentage-outside"
                          style={{
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            color: "#333333",
                            fontSize: "1.1rem",
                            fontWeight: 700,
                            zIndex: 1,
                          }}
                        >
                          {chargingData.currentCharge}%
                        </span>
                      )}
                    </div>
                    <div className="charging-details">
                      <div className="detail-item">
                        <span className="label">Công suất sạc:</span>
                        <span className="value">
                          {chargingData.chargeRate} kW
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Thời gian đã sạc:</span>
                        <span className="value">
                          {chargingData.timeElapsed?.toFixed(2)} phút (
                          {chargingData.durationHours?.toFixed(2)} giờ)
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Năng lượng tiêu thụ:</span>
                        <span className="value">
                          {chargingData.energyKwh?.toFixed(2)} kWh
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phí đặt lịch:</span>
                        <span className="value">
                          {Math.round(chargingData.bookingCost)?.toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Phí điện:</span>
                        <span className="value">
                          {Math.round(chargingData.energyCost)?.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Tổng chi phí:</span>
                        <span className="value highlight">
                          {Math.round(chargingData.chargingCost).toLocaleString("vi-VN")}{" "}
                          VNĐ
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Thời gian còn lại:</span>
                        <span className="value">
                          {chargingData.remainingTime} phút
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Bắt đầu lúc:</span>
                        <span className="value">
                          {chargingData.startTime.toLocaleString("vi-VN")}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Trạng thái:</span>
                        <span
                          className={`value status-badge ${
                            isCharging ? "status-charging" : "status-waiting"
                          }`}
                        >
                          {isCharging ? "Đang sạc" : "Chờ bắt đầu"}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="session-right">
              <ChargingStationCarousel />
              {portInfo && (
                <div className="vehicle-info-card">
                  <h2>Thông tin cổng sạc</h2>
                  <div className="vehicle-details">
                    <p>
                      <strong>Loại cổng:</strong> {portInfo.portType}
                    </p>
                    <p>
                      <strong>Công suất:</strong> {portInfo.powerKw} kW
                    </p>
                    <p>
                      <strong>Phí đặt lịch:</strong>{" "}
                      {portInfo.bookingRatePerHour.toLocaleString("vi-VN")}{" "}
                      VNĐ/30 phút
                    </p>
                    <p>
                      <strong>Đơn giá điện:</strong>{" "}
                      {ENERGY_PRICE_PER_KWH.toLocaleString("vi-VN")} VNĐ/kWh
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChargingSession;
