import "./index.scss";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import api from "../../config/api";
import CustomPopup from "../../components/customPopup";
import PaymentConfirmPopup from "../../components/paymentConfirmPopup";
import ChargingStationCarousel from "../../components/chargingStationCarousel";

// Update charging constants and cost calculations
const PORT_PRICING = {
  AC: 10000, // 10,000 VNĐ
  DC: 15000, // 15,000 VNĐ
  Ultra: 20000, // 20,000 VNĐ
};
const ENERGY_PRICE_PER_KWH = 3858; // VNĐ per kWh (từ API)

// Helper function to format time elapsed
const formatTimeElapsed = (minutes) => {
  if (minutes < 60) {
    return `${Math.floor(minutes)}p`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hours}h ${mins}p`;
};

const ChargingSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [vehicleData, setVehicleData] = useState(null);
  const [chargingData, setChargingData] = useState(null);
  const [isCharging, setIsCharging] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [portInfo, setPortInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pricingEstimate, setPricingEstimate] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [eventSource, setEventSource] = useState(null);
  const [reservationStream, setReservationStream] = useState(null);
  const [pricingStream, setPricingStream] = useState(null);
  const [reservationData, setReservationData] = useState(null);

  // Track if check-in notification has been shown
  const hasShownCheckInNotification = useRef(false);
  const hasCheckedIn =
    (reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) === true;

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
    console.log('💳 Opening Payment Popup with data:');
    console.log('  - Current Charge:', chargingData.currentCharge + '%');
    console.log('  - Time Elapsed:', chargingData.timeElapsed, 'minutes');
    console.log('  - Total Cost:', chargingData.chargingCost, 'VNĐ');
    console.log('  - From Sessions:', chargingData.hasCompletedSession);
    console.log('  - Total Sessions:', chargingData.totalSessionsCount);

    setPaymentPopup({
      isOpen: true,
      currentCharge: chargingData.currentCharge || 0,
      timeElapsed: chargingData.timeElapsed || 0,
      totalCost: chargingData.chargingCost || 0,
    });
  };

  const closePaymentPopup = () => {
    setPaymentPopup({
      ...paymentPopup,
      isOpen: false,
    });
  };

  // Kiểm tra readiness của reservation
  const getReservationReadiness = () => {
    // Use reservationData from stream if available, otherwise fallback to location.state
    const reservation = reservationData || location.state?.reservation;
    if (!reservation) return { ready: false, reasons: [] };

    const reasons = [];
    const now = new Date();

    // Nếu đã check-in và confirmed, không cần warning nữa
    const isCheckedIn = reservation.qrCheck === true;
    const isConfirmed = reservation.status === 'confirmed';

    if (isCheckedIn && isConfirmed) {
      // Đã sẵn sàng để sạc, không cần warning
      return {
        ready: true,
        reasons: []
      };
    }

    // Check qrCheck
    if (!reservation.qrCheck) {
      reasons.push({
        type: 'error',
        message: 'Chưa check-in: Vui lòng đến trạm sạc và yêu cầu nhân viên scan QR code để check-in.'
      });
    }

    // Check status
    if (reservation.status !== 'confirmed') {
      reasons.push({
        type: 'warning',
        message: `Trạng thái: ${reservation.status} (cần 'confirmed')`
      });
    }

    // Chỉ check time nếu chưa check-in
    if (!isCheckedIn) {
      const startAt = reservation.items?.[0]?.startAt ? new Date(reservation.items[0].startAt) : null;
      const endAt = reservation.items?.[0]?.endAt ? new Date(reservation.items[0].endAt) : null;

      if (startAt && now < startAt) {
        const minutesUntil = Math.round((startAt - now) / 1000 / 60);

        // Format thời gian dễ đọc hơn
        let timeMessage = '';
        if (minutesUntil >= 1440) { // >= 1 ngày
          const days = Math.floor(minutesUntil / 1440);
          const hours = Math.floor((minutesUntil % 1440) / 60);
          timeMessage = `${days} ngày${hours > 0 ? ` ${hours} giờ` : ''}`;
        } else if (minutesUntil >= 60) { // >= 1 giờ
          const hours = Math.floor(minutesUntil / 60);
          const mins = minutesUntil % 60;
          timeMessage = `${hours} giờ${mins > 0 ? ` ${mins} phút` : ''}`;
        } else {
          timeMessage = `${minutesUntil} phút`;
        }

        reasons.push({
          type: 'info',
          message: `Chưa đến thời gian đặt chỗ: Còn ${timeMessage} nữa (${startAt.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })})`
        });
      }

      if (endAt && now > endAt) {
        reasons.push({
          type: 'error',
          message: 'Đã quá thời gian: Reservation đã hết hạn.'
        });
      }
    }

    return {
      ready: reasons.length === 0,
      reasons: reasons
    };
  };

  useEffect(() => {
    console.log("🔷 ===== CHARGING SESSION PAGE LOADED =====");
    console.log("Page is loading, initializing data...");
    console.log("NO API calls yet - waiting for user to click 'Bắt đầu sạc' button");

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

        // New format: reservation.items[0].slot.port (can be object or string)
        if (reservation.items?.[0]?.slot?.port) {
          const port = reservation.items[0].slot.port;
          // If port is an object, get its _id or id property
          portId = typeof port === 'object' ? (port._id || port.id) : port;
        }
        // Old format: reservation.portId
        else if (reservation.portId) {
          const port = reservation.portId;
          portId = typeof port === 'object' ? (port._id || port.id) : port;
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

    // Fetch all completed charging sessions and calculate total duration
    const fetchAllCompletedSessions = async (vehicleId) => {
      try {
        console.log('📊 Fetching all completed sessions for vehicle:', vehicleId);
        // Use the new renamed API endpoint for vehicle sessions
        const response = await api.get(`/charging/sessions/vehicle/${vehicleId}?status=completed&page=1&limit=100`);
        const vehicleSessions = response.data?.data?.items || [];

        // Sort sessions by date (API might already do this, but good to ensure)
        vehicleSessions.sort((a, b) => new Date(a.startedAt) - new Date(b.startedAt));

        if (vehicleSessions.length > 0) {
          // Calculate total duration from ALL completed sessions
          let totalDurationMinutes = 0;
          let totalSessionsCount = vehicleSessions.length;

          vehicleSessions.forEach(session => {
            const startTime = new Date(session.startedAt);
            const endTime = new Date(session.endedAt);
            const duration = (endTime - startTime) / (1000 * 60); // minutes
            totalDurationMinutes += duration;

            console.log(`  Session ${session._id}: ${duration.toFixed(2)} minutes`);
          });

          // Get earliest session for initial pin reference
          const earliestSession = vehicleSessions[0];

          console.log('✅ Found', totalSessionsCount, 'completed session(s)');
          console.log('✅ Total duration from all sessions:', totalDurationMinutes.toFixed(2), 'minutes');
          console.log('✅ Earliest session initial pin:', earliestSession.initialPercent + '%');

          return {
            earliestSession: earliestSession,
            totalDurationMinutes: totalDurationMinutes,
            totalSessionsCount: totalSessionsCount,
            allSessions: vehicleSessions
          };
        } else {
          console.log('ℹ️ No completed sessions found for this vehicle');
          return null;
        }
      } catch (error) {
        console.error('Error fetching completed sessions:', error);
        return null;
      }
    };

    // Fetch vehicle data to get current pin
    const fetchVehicleData = async () => {
      try {
        console.log('🚗 Fetching vehicle data for ID:', vehicle.id);
        const response = await api.get(`/vehicles/${vehicle.id}`);
        const vehicleData = response.data?.data || response.data;

        console.log('🚗 Vehicle Data from API:', vehicleData);
        console.log('🔋 Current Pin:', vehicleData.pin);

        // Fetch all completed sessions for cost calculation
        const sessionsData = await fetchAllCompletedSessions(vehicle.id);

        let initialPinFromSession = null;
        let totalDurationMinutes = null;
        let totalSessionsCount = 0;
        let pinGainPercent = null;

        if (sessionsData) {
          initialPinFromSession = sessionsData.earliestSession.initialPercent;
          totalDurationMinutes = sessionsData.totalDurationMinutes;
          totalSessionsCount = sessionsData.totalSessionsCount;

          console.log('📊 Completed Sessions Summary:');
          console.log('  - Total Sessions:', totalSessionsCount);
          console.log('  - Total Duration:', totalDurationMinutes.toFixed(2), 'minutes');
          console.log('  - Initial Pin (from earliest):', initialPinFromSession + '%');
          console.log('  - Current Pin:', vehicleData.pin + '%');
          console.log('  - Pin Gain:', (vehicleData.pin - initialPinFromSession) + '%');

          if (initialPinFromSession !== null && initialPinFromSession !== undefined &&
            vehicleData.pin !== null && vehicleData.pin !== undefined) {
            pinGainPercent = vehicleData.pin - initialPinFromSession;
          }
        }

        // Set vehicle data with current pin and session info
        setVehicleData({
          id: vehicleData.id || vehicle.id,
          make: vehicleData.make,
          model: vehicleData.model,
          plateNumber: vehicleData.plateNumber,
          batteryCapacity: vehicleData.batteryCapacityKwh,
          connectorType: vehicleData.connectorType,
          currentPin: vehicleData.pin, // Current battery percentage from API
          sessionInitialPin: initialPinFromSession, // Pin from earliest session
          sessionDurationMinutes: totalDurationMinutes, // TOTAL duration from ALL sessions
          totalSessionsCount: totalSessionsCount, // Number of completed sessions
          hasCompletedSession: sessionsData !== null,
          pinGainPercent: pinGainPercent,
        });
      } catch (error) {
        console.error('Error fetching vehicle data:', error);
        // Fallback to location state data
        setVehicleData({
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          plateNumber: vehicle.plateNumber,
          batteryCapacity: vehicle.batteryCapacityKwh,
          connectorType: vehicle.connectorType,
          currentPin: null, // Will use random if null
          sessionInitialPin: null,
          sessionDurationMinutes: null,
          totalSessionsCount: 0,
          hasCompletedSession: false,
          pinGainPercent: null,
        });
      }
    };

    // Always try to fetch port info and vehicle data
    fetchPortInfo();
    fetchVehicleData();
  }, [location.state, navigate]);

  useEffect(() => {
    if (vehicleData && portInfo) {
      initializeChargingSession();
    }
  }, [vehicleData, portInfo]);

  // Start reservation and pricing streams when component mounts
  useEffect(() => {
    console.log('🔄 ========== STREAMS useEffect TRIGGERED ==========');
    const reservation = location.state?.reservation;
    const vehicle = location.state?.vehicle;

    console.log('🔄 Reservation:', reservation);
    console.log('🔄 Vehicle:', vehicle);

    if (reservation && vehicle) {
      // Get reservationId
      const reservationId = reservation._id || reservation.id;
      const vehicleId = vehicle.id || vehicle._id;

      console.log('🔄 ===== STARTING REAL-TIME STREAMS =====');
      console.log('🔄 Reservation ID:', reservationId);
      console.log('🔄 Vehicle ID:', vehicleId);
      console.log('🔄 =======================================');

      // Start reservation stream to track QR check, status, etc.
      if (reservationId) {
        console.log('🔄 📡 Calling startReservationStream...');
        startReservationStream(reservationId);
      } else {
        console.warn('🔄 ⚠️ No reservationId found, skipping reservation stream');
      }

      // Start pricing stream to track pricing from completed sessions
      if (vehicleId) {
        console.log('🔄 💰 Calling startPricingStream...');
        startPricingStream(vehicleId);
      } else {
        console.warn('🔄 ⚠️ No vehicleId found, skipping pricing stream');
      }
    } else {
      console.warn('🔄 ⚠️ No reservation or vehicle data, streams not started');
      console.log('🔄 Reservation exists:', !!reservation);
      console.log('🔄 Vehicle exists:', !!vehicle);
    }

    // Cleanup function
    return () => {
      console.log('🧹 ===== CLEANING UP STREAMS =====');
      if (reservationStream) {
        console.log('🧹 Closing reservation stream...');
        reservationStream.close();
      } else {
        console.log('🧹 No reservation stream to close');
      }
      if (pricingStream) {
        console.log('🧹 Closing pricing stream...');
        pricingStream.close();
      } else {
        console.log('🧹 No pricing stream to close');
      }
      console.log('🧹 =================================');
    };
  }, [location.state]);

  // Watch for reservation data changes from stream
  useEffect(() => {
    if (reservationData) {
      console.log('📡 ===== RESERVATION DATA UPDATED =====');
      console.log('📡 Status:', reservationData.status);
      console.log('📡 QR Check:', reservationData.qrCheck);
      console.log('📡 Updated At:', reservationData.updatedAt);

      // Check if reservation is now ready for charging
      const isReady = reservationData.status === 'confirmed' && reservationData.qrCheck === true;
      if (isReady) {
        console.log('✅ Reservation is now READY for charging!');

        // Only show notification once
        if (!hasShownCheckInNotification.current && !isCharging && !isPaused) {
          hasShownCheckInNotification.current = true;
          showPopup('✅ Check-in thành công! Bạn có thể bắt đầu sạc ngay.', 'success');
          console.log('✅ Notification shown (will not show again)');
        } else {
          console.log('ℹ️ Notification already shown or charging in progress, skipping');
        }
      }
      console.log('📡 ======================================');
    }
  }, [reservationData, isCharging, isPaused]);

  // Debug: Log pricingEstimate changes
  useEffect(() => {
    console.log('💰 📊 ===== PRICING ESTIMATE STATE CHANGED =====');
    console.log('💰 📊 pricingEstimate:', pricingEstimate);
    console.log('💰 📊 pricingEstimate exists:', !!pricingEstimate);
    if (pricingEstimate) {
      console.log('💰 📊 totalSessions:', pricingEstimate.totalSessions);
      console.log('💰 📊 totalMinutes:', pricingEstimate.totalMinutes);
      console.log('💰 📊 portType:', pricingEstimate.portType);
      console.log('💰 📊 total:', pricingEstimate.total);
    }
    console.log('💰 📊 ===============================================');
  }, [pricingEstimate]);

  // Debug: Log chargingData changes
  useEffect(() => {
    if (chargingData) {
      console.log('⚡ 📊 ===== CHARGING DATA STATE CHANGED =====');
      console.log('⚡ 📊 totalSessionsCount:', chargingData.totalSessionsCount);
      console.log('⚡ 📊 sessionDurationMinutes:', chargingData.sessionDurationMinutes);
      console.log('⚡ 📊 hasCompletedSession:', chargingData.hasCompletedSession);
      console.log('⚡ 📊 timeElapsed:', chargingData.timeElapsed);
      console.log('⚡ 📊 chargingCost:', chargingData.chargingCost);
      console.log('⚡ 📊 ===========================================');
    }
  }, [chargingData]);

  // Cleanup SSE khi component unmount
  useEffect(() => {
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [eventSource]);

  const initializeChargingSession = () => {
    // Use current pin from API if available, otherwise use random
    const initialCharge = vehicleData.currentPin !== null && vehicleData.currentPin !== undefined
      ? vehicleData.currentPin
      : Math.floor(Math.random() * 30) + 10; // Fallback: 10-40%

    console.log('🔋 Initializing with battery percentage:', initialCharge + '%');

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

    // Calculate initial costs based on ALL completed sessions if available
    let initialBookingCost = 0;
    let initialEnergyCost = 0;
    let initialEnergyKwh = 0;
    let initialDurationHours = 0;
    let initialTimeElapsed = 0;

    if (vehicleData.hasCompletedSession && vehicleData.sessionDurationMinutes) {
      const sessionsCount = vehicleData.totalSessionsCount || 1;
      console.log(`💰 Calculating costs based on ${sessionsCount} completed session(s)...`);

      // Use total duration from ALL completed sessions
      initialTimeElapsed = vehicleData.sessionDurationMinutes;
      initialDurationHours = initialTimeElapsed / 60;

      // Calculate booking cost (fixed rate per hour)
      initialBookingCost = portInfo.bookingRatePerHour;

      // Calculate energy consumed and cost
      initialEnergyKwh = portInfo.powerKw * initialDurationHours;
      initialEnergyCost = initialDurationHours * initialEnergyKwh * ENERGY_PRICE_PER_KWH;

      const totalCost = initialBookingCost + initialEnergyCost;

      console.log('💰 Cost Calculation from ALL Completed Sessions:');
      console.log('  - Total Sessions:', sessionsCount);
      console.log('  - Total Duration:', initialTimeElapsed.toFixed(2), 'minutes');
      console.log('  - Duration Hours:', initialDurationHours.toFixed(2), 'hours');
      console.log('  - Booking Cost:', initialBookingCost.toLocaleString(), 'VNĐ');
      console.log('  - Energy kWh:', initialEnergyKwh.toFixed(2), 'kWh');
      console.log('  - Energy Cost:', initialEnergyCost.toLocaleString(), 'VNĐ');
      console.log('  - Total Cost:', totalCost.toLocaleString(), 'VNĐ');
    }

    setChargingData({
      ...vehicleData,
      currentCharge: initialCharge,
      chargeRate: portInfo.powerKw,
      remainingTime: estimatedMinutes,
      chargingCost: Math.round(initialBookingCost + initialEnergyCost),
      startTime: new Date(),
      initialCharge: initialCharge,
      timeElapsed: initialTimeElapsed,
      bookingCost: Math.round(initialBookingCost),
      energyCost: Math.round(initialEnergyCost),
      energyKwh: initialEnergyKwh,
      durationHours: initialDurationHours,
      bookingRatePerHalfHour: portInfo.bookingRatePerHour,
      portType: portInfo.portType,
      // Store previous sessions duration to add to current session
      previousSessionsDuration: initialTimeElapsed,
      pinGainPercent: vehicleData.pinGainPercent ?? (
        vehicleData.currentPin !== null && vehicleData.currentPin !== undefined &&
          vehicleData.sessionInitialPin !== null && vehicleData.sessionInitialPin !== undefined
          ? vehicleData.currentPin - vehicleData.sessionInitialPin
          : null
      ),
    });
  };

  // Hàm stream tiến trình sạc qua SSE
  const startChargingStream = (sessionId) => {
    // Đóng eventSource cũ nếu có
    if (eventSource) {
      eventSource.close();
    }

    // Lấy base URL và token từ api config
    const baseURL = api.defaults.baseURL;
    const token = localStorage.getItem('token');

    // Tạo URL cho SSE endpoint
    // EventSource không hỗ trợ custom headers, nên ta sử dụng fetch với ReadableStream
    // hoặc truyền token qua query parameter
    const url = `${baseURL}/charging/sessions/${sessionId}/stream`;

    // Sử dụng fetch API để hỗ trợ custom headers (Bearer token)
    const connectSSE = async () => {
      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'text/event-stream',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        // Tạo một object giả lập EventSource để có thể đóng kết nối
        const mockEventSource = {
          close: () => {
            reader.cancel();
          }
        };
        setEventSource(mockEventSource);

        // Đọc stream
        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                console.log('SSE stream ended');
                break;
              }

              // Decode và xử lý data
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Giữ lại dòng chưa hoàn chỉnh

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const dataStr = line.substring(6);
                  try {
                    const data = JSON.parse(dataStr);

                    // Cập nhật charging data từ SSE stream
                    setChargingData((prev) => {
                      if (!prev) return prev;

                      const currentPercent = data.percent || prev.currentCharge;

                      // Tính thời gian đã sạc của SESSION HIỆN TẠI (từ startedAt đến hiện tại)
                      const startTime = new Date(data.startedAt || prev.startTime);
                      const now = new Date();
                      const timeElapsedMs = now - startTime;
                      const currentSessionMinutes = timeElapsedMs / (1000 * 60);

                      // CỘNG THÊM thời gian từ các sessions trước (nếu có)
                      const previousDuration = prev.previousSessionsDuration || 0;
                      const totalTimeElapsed = previousDuration + currentSessionMinutes;
                      const sessionInitialPercent = prev.sessionInitialPin ?? prev.initialCharge ?? null;
                      const resolvedCurrentPin = currentPercent ?? prev.currentPin ?? null;
                      let updatedPinGainPercent = prev.pinGainPercent ?? null;
                      if (sessionInitialPercent !== null && sessionInitialPercent !== undefined &&
                        resolvedCurrentPin !== null && resolvedCurrentPin !== undefined) {
                        updatedPinGainPercent = resolvedCurrentPin - sessionInitialPercent;
                      }

                      // Tính chi phí dựa trên TỔNG THỜI GIAN (sessions cũ + session hiện tại)
                      const durationHours = totalTimeElapsed / 60;
                      const bookingCost = prev.bookingRatePerHalfHour;
                      const energyKwh = prev.chargeRate * durationHours;
                      const energyCost = durationHours * energyKwh * ENERGY_PRICE_PER_KWH;
                      const totalCost = bookingCost + energyCost;

                      // Tính thời gian còn lại của session hiện tại
                      const remainingPercent = data.target - currentPercent;
                      const ratePerMinute = data.ratePercentPerMinute || 1;
                      const remainingTime = remainingPercent / ratePerMinute;

                      return {
                        ...prev,
                        currentCharge: currentPercent,
                        timeElapsed: totalTimeElapsed, // TỔNG thời gian (cũ + mới)
                        durationHours: durationHours,
                        chargingCost: Math.round(totalCost),
                        bookingCost: Math.round(bookingCost),
                        energyCost: Math.round(energyCost),
                        energyKwh: energyKwh,
                        remainingTime: Math.ceil(remainingTime),
                        currentPin: resolvedCurrentPin ?? prev.currentPin,
                        pinGainPercent: updatedPinGainPercent,
                      };
                    });

                    // Kiểm tra nếu đã hoàn thành
                    if (data.finished || data.status === 'completed') {
                      reader.cancel();
                      setIsCharging(false);

                      // Hiện modal thanh toán (không auto redirect)
                      setTimeout(() => {
                        handleChargingComplete();
                      }, 1000);

                      showPopup("Sạc đầy 100%! ✅", "success");
                      break;
                    }
                  } catch (error) {
                    console.error("Error parsing SSE data:", error);
                  }
                }
              }
            }
          } catch (error) {
            console.error("Error reading SSE stream:", error);
            showPopup("Mất kết nối stream. Vui lòng kiểm tra lại.", "warning");
          }
        };

        readStream();
      } catch (error) {
        console.error("Error connecting to SSE:", error);
        setEventSource(null);
        showPopup("Không thể kết nối đến stream. Vui lòng thử lại.", "error");
      }
    };

    connectSSE();
  };

  // Hàm xử lý khi sạc hoàn thành (100%)
  const handleChargingComplete = () => {
    console.log('🔋 Charging completed (100%) - showing payment modal');

    // Dừng sạc
    setIsCharging(false);
    setIsPaused(true);

    // Đóng SSE stream
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }

    // Hiển thị modal thanh toán thay vì auto redirect
    showPaymentPopup();
  };

  // Start Reservation Stream - Track reservation status in real-time (QR check, etc.)
  const startReservationStream = async (reservationId) => {
    if (!reservationId) {
      console.warn('⚠️ No reservationId provided for reservation stream');
      return;
    }

    console.log('🔄 Starting reservation stream for:', reservationId);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${api.defaults.baseURL}/reservations/${reservationId}/stream`,
        {
          method: 'GET',
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const mockReservationStream = {
        close: () => {
          console.log('🔴 Closing reservation stream');
          reader.cancel();
        }
      };
      setReservationStream(mockReservationStream);

      const readStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('✅ Reservation stream ended');
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('event: ')) {
                const eventType = line.substring(7).trim();
                console.log('📡 Reservation event:', eventType);
              }

              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                try {
                  const data = JSON.parse(dataStr);
                  console.log('📦 Reservation data:', data);

                  // Update reservation data state
                  setReservationData(data);

                  // Update specific fields if needed
                  if (data.qrCheck !== undefined) {
                    console.log('✅ QR Check status updated:', data.qrCheck);
                  }
                  if (data.status) {
                    console.log('📊 Reservation status:', data.status);
                  }
                } catch (parseError) {
                  console.error('Error parsing reservation stream data:', parseError);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error reading reservation stream:', error);
        }
      };

      readStream();
    } catch (error) {
      console.error('Error starting reservation stream:', error);
    }
  };

  // Start Pricing Stream - Track pricing in real-time for all completed sessions
  const startPricingStream = async (vehicleId) => {
    if (!vehicleId) {
      console.warn('⚠️ No vehicleId provided for pricing stream');
      return;
    }

    console.log('💰 ========== STARTING PRICING STREAM ==========');
    console.log('💰 Vehicle ID:', vehicleId);
    console.log('💰 API Base URL:', api.defaults.baseURL);
    console.log('💰 Full URL:', `${api.defaults.baseURL}/pricing/estimate-vehicle-stream`);

    try {
      const token = localStorage.getItem('token');
      console.log('💰 Token exists:', !!token);

      const requestBody = { vehicleId };
      console.log('💰 Request body:', JSON.stringify(requestBody));

      console.log('💰 Initiating fetch...');
      const response = await fetch(
        `${api.defaults.baseURL}/pricing/estimate-vehicle-stream`,
        {
          method: 'POST',
          headers: {
            'Accept': 'text/event-stream',
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      console.log('💰 Response received!');
      console.log('💰 Response status:', response.status);
      console.log('💰 Response ok:', response.ok);
      console.log('💰 Response headers:', response.headers);

      if (!response.ok) {
        console.error('❌ Response not OK!');
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('💰 Starting to read stream...');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const mockPricingStream = {
        close: () => {
          console.log('🔴 Closing pricing stream');
          reader.cancel();
        }
      };
      setPricingStream(mockPricingStream);
      console.log('💰 Pricing stream object set!');

      const readStream = async () => {
        console.log('💰 Starting readStream loop...');
        try {
          let chunkCount = 0;
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              console.log('✅ Pricing stream ended (done=true)');
              break;
            }

            chunkCount++;
            console.log(`💰 Received chunk #${chunkCount}, size:`, value?.length);

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            console.log(`💰 Processing ${lines.length} lines from chunk #${chunkCount}`);

            for (const line of lines) {
              if (!line.trim()) continue; // Skip empty lines

              console.log('💰 Processing line:', line);

              if (line.startsWith('event: ')) {
                const eventType = line.substring(7).trim();
                console.log('💰 ===== EVENT RECEIVED =====');
                console.log('💰 Event type:', eventType);

                if (eventType === 'session_count_changed') {
                  console.log('🔔 🔔 🔔 New completed session detected!');
                } else if (eventType === 'pricing_data') {
                  console.log('💰 💰 💰 Pricing data event!');
                } else if (eventType === 'stream_end') {
                  console.log('🏁 Stream end event received');
                }
              }

              if (line.startsWith('data: ')) {
                const dataStr = line.substring(6);
                console.log('💰 Raw pricing data string:', dataStr);
                try {
                  const data = JSON.parse(dataStr);
                  console.log('💰 ===== PRICING DATA RECEIVED =====');
                  console.log('💰 Full data:', JSON.stringify(data, null, 2));

                  // Check if this is stream_end event (has 'reason' field) or pricing data
                  if (data.reason) {
                    console.log('🏁 Stream end data received, skipping state update');
                    console.log('🏁 Reason:', data.reason);
                    continue; // Skip this data, don't update state
                  }

                  // Only process if we have actual pricing data (has totalSessions field)
                  if (!data.totalSessions && data.totalSessions !== 0) {
                    console.log('⚠️ Data missing totalSessions field, skipping');
                    continue;
                  }

                  console.log('💰 vehicleId:', data.vehicleId);
                  console.log('💰 totalSessions:', data.totalSessions);
                  console.log('💰 totalMinutes:', data.totalMinutes);
                  console.log('💰 totalDurationHours:', data.totalDurationHours);
                  console.log('💰 portType:', data.portType);
                  console.log('💰 powerKw:', data.powerKw);
                  console.log('💰 bookingBasePrice:', data.bookingBasePrice);
                  console.log('💰 energyKwh:', data.energyKwh);
                  console.log('💰 bookingCost:', data.bookingCost);
                  console.log('💰 energyCost:', data.energyCost);
                  console.log('💰 total:', data.total);
                  console.log('💰 sessionDetails:', data.sessionDetails);
                  console.log('💰 ===================================');

                  const sessionDetails = Array.isArray(data.sessionDetails) ? data.sessionDetails : [];
                  const firstSessionDetail = sessionDetails.length > 0 ? sessionDetails[0] : null;
                  const lastSessionDetail = sessionDetails.length > 0 ? sessionDetails[sessionDetails.length - 1] : null;
                  const streamInitialPin = firstSessionDetail?.initialPercent;
                  const streamLastEndPercent = lastSessionDetail?.endPercent;
                  const streamLastCurrentPercent = lastSessionDetail?.currentPercent;
                  const streamCurrentPin = streamLastEndPercent ?? streamLastCurrentPercent ?? null;

                  // Update pricing estimate state with actual pricing data
                  console.log('💰 Setting pricingEstimate state with valid pricing data...');
                  setPricingEstimate(data);
                  console.log('💰 pricingEstimate state updated!');

                  // Update charging data with pricing info
                  console.log('💰 Updating chargingData state...');
                  setChargingData(prev => {
                    if (!prev) {
                      console.log('💰 ⚠️ chargingData is null, skipping update');
                      return prev;
                    }

                    const toNumber = (value) => {
                      if (value === null || value === undefined) return null;
                      const parsed = Number(value);
                      return Number.isNaN(parsed) ? null : parsed;
                    };

                    const resolvedSessionInitialPinRaw = streamInitialPin ?? prev.sessionInitialPin ?? prev.initialCharge ?? null;
                    const resolvedSessionInitialPin = toNumber(resolvedSessionInitialPinRaw);
                    const streamFallbackPin = data.currentPin ?? data.currentPercent ?? null;
                    const resolvedCurrentPinRaw = streamCurrentPin ?? streamFallbackPin ?? prev.currentPin ?? prev.currentCharge ?? null;
                    const resolvedCurrentPin = toNumber(resolvedCurrentPinRaw);
                    let resolvedPinGainPercent = prev.pinGainPercent ?? null;
                    if (resolvedSessionInitialPin !== null && resolvedCurrentPin !== null) {
                      resolvedPinGainPercent = resolvedCurrentPin - resolvedSessionInitialPin;
                    }

                    const updated = {
                      ...prev,
                      timeElapsed: data.totalMinutes || prev.timeElapsed,
                      bookingCost: data.bookingCost || prev.bookingCost,
                      energyCost: data.energyCost || prev.energyCost,
                      energyKwh: data.energyKwh || prev.energyKwh,
                      chargingCost: data.total || prev.chargingCost,
                      totalSessionsCount: data.totalSessions || prev.totalSessionsCount,
                      durationHours: data.totalDurationHours || prev.durationHours,
                      portType: data.portType || prev.portType,
                      sessionDetails: data.sessionDetails || prev.sessionDetails,
                      sessionInitialPin: resolvedSessionInitialPin ?? prev.sessionInitialPin,
                      currentPin: resolvedCurrentPin ?? prev.currentPin ?? null,
                      pinGainPercent: resolvedPinGainPercent,
                    };
                    console.log('💰 Updated chargingData:', updated);
                    return updated;
                  });
                  console.log('💰 chargingData state updated!');

                  // Update vehicle data if we have session details
                  if (data.sessionDetails && data.sessionDetails.length > 0) {
                    console.log('💰 Updating vehicleData state...');
                    setVehicleData(prev => {
                      if (!prev) {
                        console.log('💰 ⚠️ vehicleData is null, skipping update');
                        return prev;
                      }
                      const toNumber = (value) => {
                        if (value === null || value === undefined) return null;
                        const parsed = Number(value);
                        return Number.isNaN(parsed) ? null : parsed;
                      };
                      const sessionInitialPinRaw = streamInitialPin ?? prev.sessionInitialPin;
                      const currentPinRaw = streamCurrentPin ?? data.currentPin ?? data.currentPercent ?? prev.currentPin;
                      const sessionInitialPin = toNumber(sessionInitialPinRaw);
                      const currentPin = toNumber(currentPinRaw);
                      const pinGainPercent =
                        sessionInitialPin !== null && currentPin !== null
                          ? currentPin - sessionInitialPin
                          : (prev.pinGainPercent ?? null);
                      const updated = {
                        ...prev,
                        sessionDurationMinutes: data.totalMinutes,
                        totalSessionsCount: data.totalSessions,
                        hasCompletedSession: data.totalSessions > 0,
                        sessionInitialPin: sessionInitialPin ?? prev.sessionInitialPin ?? null,
                        currentPin: currentPin ?? prev.currentPin ?? null,
                        pinGainPercent: pinGainPercent,
                      };
                      console.log('💰 Updated vehicleData:', updated);
                      return updated;
                    });
                    console.log('💰 vehicleData state updated!');
                  }
                } catch (parseError) {
                  console.error('❌ Error parsing pricing stream data:', parseError);
                  console.error('❌ Raw data string:', dataStr);
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error reading pricing stream:', error);
          console.error('❌ Error stack:', error.stack);
        }
      };

      readStream();
    } catch (error) {
      console.error('❌ ===== ERROR STARTING PRICING STREAM =====');
      console.error('❌ Error:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ ==========================================');
    }
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

  // Helper function to check for existing active charging sessions by vehicleId
  const checkExistingChargingSession = async (vehicleId) => {
    try {
      // Get charging sessions for this vehicle with status=active
      const response = await api.get(`/charging/sessions/${vehicleId}?status=active&page=1&limit=20`);

      // API returns { success, message, data: { items: [], pagination: {} } }
      const sessions = response.data?.data?.items || [];

      // Filter for active sessions only
      const activeSessions = sessions.filter(session => session.status === 'active');

      console.log(`Found ${activeSessions.length} active charging session(s) for vehicle ${vehicleId}`);

      // Return the first active session if exists
      return activeSessions.length > 0 ? activeSessions[0] : null;
    } catch (error) {
      console.log('Could not check existing sessions:', error.message);
      return null;
    }
  };

  const handlePayment = async () => {
    console.log('🔵 ===== NÚT "BẮT ĐẦU SẠC" ĐƯỢC CLICK =====');
    console.log('User manually clicked the start charging button');

    if (!chargingData) {
      showPopup("Vui lòng đợi khởi tạo thông tin sạc", "error");
      return;
    }

    if (isCharging) {
      showPopup("Phiên sạc đang hoạt động", "error");
      return;
    }

    if (!hasCheckedIn) {
      showPopup(
        "Chua check-in: nho nhan vien tram quet ma QR truoc khi bat dau sac.",
        "error"
      );
      return;
    }

    try {
      // Lấy thông tin từ location.state, nhưng merge với reservationData từ stream
      const baseReservation = location.state?.reservation;
      const vehicle = location.state?.vehicle;

      if (!baseReservation || !vehicle) {
        showPopup("Không tìm thấy thông tin đặt chỗ hoặc xe", "error");
        return;
      }

      // Use reservation data from stream if available, otherwise use base reservation
      const reservation = reservationData ? { ...baseReservation, ...reservationData } : baseReservation;

      // Lấy slotId từ reservation
      let slotId = null;
      if (reservation.items?.[0]?.slot) {
        const slot = reservation.items[0].slot;
        slotId = typeof slot === 'object' ? (slot._id || slot.id) : slot;
      }

      if (!slotId) {
        showPopup("Không tìm thấy thông tin slot", "error");
        return;
      }

      // Lấy reservationId
      const reservationId = reservation.id || reservation._id;

      // Chuẩn bị request body
      const requestBody = {
        vehicleId: vehicle.id,
        slotId: slotId,
        targetPercent: 100,
        chargeRatePercentPerMinute: 1
      };

      // Thêm reservationId nếu có
      if (reservationId) {
        requestBody.reservationId = reservationId;
      }

      console.log('=== STARTING CHARGING SESSION ===');
      console.log('Request Body:', requestBody);
      console.log('Reservation (merged with stream):', reservation);
      console.log('Reservation Status:', reservation.status);
      console.log('Reservation qrCheck:', reservation.qrCheck);
      console.log('Stream Data:', reservationData);
      console.log('Vehicle:', vehicle);
      console.log('Slot ID:', slotId);
      console.log('Reservation ID:', reservationId);

      // Kiểm tra thời gian
      const now = new Date();
      const startAt = reservation.items?.[0]?.startAt ? new Date(reservation.items[0].startAt) : null;
      const endAt = reservation.items?.[0]?.endAt ? new Date(reservation.items[0].endAt) : null;
      console.log('Current Time:', now.toISOString());
      console.log('Reservation Start:', startAt?.toISOString());
      console.log('Reservation End:', endAt?.toISOString());
      console.log('Is within time range:', startAt && endAt ? (now >= startAt && now <= endAt) : 'Cannot determine');

      // Check for existing active charging sessions by vehicleId
      console.log('Checking for existing active charging sessions for vehicle:', vehicle.id);
      const existingSessions = await checkExistingChargingSession(vehicle.id);
      if (existingSessions) {
        console.log('✅ Found existing active charging session - continuing with it:', existingSessions);

        // Tự động tiếp tục với session đang có
        const sessionId = existingSessions.id || existingSessions._id;
        setSessionId(sessionId);
        setIsCharging(true);
        setIsPaused(false);
        startChargingStream(sessionId);
        showPopup("Đã kết nối với phiên sạc đang hoạt động", "success");
        return;
      } else {
        console.log('✓ No active charging sessions found - will create new session');
      }

      // Kiểm tra các điều kiện trước khi gọi API
      const warnings = [];
      const isConfirmed = reservation.status === 'confirmed';
      const isCheckedIn = reservation.qrCheck === true;

      // Kiểm tra status
      if (!isConfirmed) {
        warnings.push(`⚠️ Trạng thái reservation: ${reservation.status} (cần 'confirmed')`);
      }

      // Kiểm tra qrCheck
      if (!isCheckedIn) {
        warnings.push('⚠️ Reservation chưa được check-in bởi nhân viên (qrCheck = false)');
      }

      // Chỉ kiểm tra thời gian nếu chưa confirmed hoặc chưa check-in
      // Nếu đã confirmed + check-in thì không cần check time nữa
      if (!isConfirmed || !isCheckedIn) {
        if (startAt && now < startAt) {
          const minutesUntil = Math.round((startAt - now) / 1000 / 60);
          warnings.push(`⚠️ Chưa đến thời gian đặt chỗ (còn ${minutesUntil} phút)`);
        }

        if (endAt && now > endAt) {
          warnings.push('⚠️ Đã quá thời gian đặt chỗ');
        }
      }

      if (warnings.length > 0) {
        console.warn('=== VALIDATION WARNINGS ===');
        warnings.forEach(w => console.warn(w));
        console.warn('Vẫn tiếp tục gọi API...');
      } else {
        console.log('✅ All validations passed - ready to start charging');
      }

      // Gọi API bắt đầu sạc
      const response = await api.post('/charging/start', requestBody);

      console.log('🔥 API Response:', response);
      console.log('🔥 Response Data:', response.data);
      console.log('🔥 Response Status:', response.status);

      // Check multiple response formats
      const session = response.data?.data || response.data;
      const isSuccess = response.status === 201 || response.status === 200 || response.data?.success;

      console.log('🔥 Extracted Session:', session);
      console.log('🔥 Is Success:', isSuccess);

      if (isSuccess && session && (session.id || session._id)) {
        const sessionId = session.id || session._id;
        console.log('✅ Starting charging with session ID:', sessionId);

        setSessionId(sessionId);

        // Cập nhật thời gian bắt đầu - GIỮ LẠI previousSessionsDuration
        setChargingData((prev) => {
          const previousDuration = prev.previousSessionsDuration || 0;
          console.log('🔄 Starting new session, previous duration:', previousDuration, 'minutes');

          return {
            ...prev,
            startTime: new Date(session.startedAt || new Date()),
            // GIỮ LẠI thời gian từ sessions trước, SSE stream sẽ cộng thêm session mới
            timeElapsed: previousDuration,
            // GIỮ LẠI chi phí từ sessions trước
            // SSE stream sẽ tính lại dựa trên tổng thời gian
            previousSessionsDuration: previousDuration,
          };
        });

        setIsCharging(true);
        setIsPaused(false);
        showPopup("Bắt đầu quá trình sạc!", "success");

        // Bắt đầu stream SSE
        startChargingStream(sessionId);
      } else {
        console.error('❌ Failed to extract session from response');
        console.error('Response structure:', JSON.stringify(response.data, null, 2));
        showPopup("Không thể bắt đầu phiên sạc - Response không hợp lệ", "error");
      }
    } catch (error) {
      console.error("Error starting charging session:", error);
      console.error("Error response:", error.response?.data);
      console.error("Full error object:", JSON.stringify(error.response, null, 2));

      let errorMessage = "Lỗi khi bắt đầu phiên sạc";

      if (error.response?.status === 409) {
        // Lỗi conflict - slot không khả dụng
        const reservation = location.state?.reservation;
        const serverMessage = error.response?.data?.message || "";

        console.log('=== ANALYZING 409 CONFLICT ERROR ===');
        console.log('Server Message:', serverMessage);
        console.log('All conditions met:', {
          qrCheck: reservation?.qrCheck,
          status: reservation?.status,
          withinTimeRange: true
        });

        // Tạo message chi tiết dựa trên điều kiện
        const reasons = [];

        if (!reservation?.qrCheck) {
          reasons.push("• Reservation chưa được check-in bởi nhân viên trạm sạc");
        }

        if (reservation?.status !== 'confirmed') {
          reasons.push(`• Trạng thái reservation: ${reservation?.status || 'unknown'} (cần 'confirmed')`);
        }

        const now = new Date();
        const startAt = reservation?.items?.[0]?.startAt ? new Date(reservation.items[0].startAt) : null;
        const endAt = reservation?.items?.[0]?.endAt ? new Date(reservation.items[0].endAt) : null;

        if (startAt && now < startAt) {
          const minutesUntil = Math.round((startAt - now) / 1000 / 60);
          reasons.push(`• Chưa đến thời gian đặt chỗ (còn ${minutesUntil} phút)`);
        }

        if (endAt && now > endAt) {
          reasons.push("• Đã quá thời gian đặt chỗ");
        }

        // Nếu tất cả điều kiện đều OK
        if (reasons.length === 0) {
          console.warn('⚠️ All conditions are OK but still got 409 error!');
          console.warn('Possible causes:');
          console.warn('1. Slot already has an active charging session');
          console.warn('2. Backend has additional validation rules');
          console.warn('3. Reservation may have been used already');

          errorMessage = `${serverMessage}\n\n🔍 Phân tích:\nTất cả điều kiện đều hợp lệ (✓ Check-in, ✓ Đã thanh toán, ✓ Đúng thời gian)\n\n⚠️ Nguyên nhân có thể:\n• Slot/Reservation này đã có phiên sạc đang hoạt động\n• Reservation đã được sử dụng trước đó\n• Backend có thêm điều kiện kiểm tra khác\n\n💡 Giải pháp:\n1. Kiểm tra xem bạn đã bắt đầu sạc chưa (có thể đã start rồi)\n2. Thử refresh trang và kiểm tra lại\n3. Nếu vẫn lỗi, vui lòng liên hệ hỗ trợ với mã đặt chỗ: ${reservation?.id || 'N/A'}`;
        } else {
          errorMessage = `${serverMessage}\n\nNguyên nhân có thể:\n${reasons.join('\n')}\n\n💡 Khuyến nghị: ${!reservation?.qrCheck
              ? 'Vui lòng đến trạm sạc và yêu cầu nhân viên scan QR code để check-in.'
              : 'Vui lòng kiểm tra thông tin đặt chỗ hoặc liên hệ hỗ trợ.'
            }`;
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showPopup(errorMessage, "error");
    }
  };

  // const handlePause = () => {
  //   setIsPaused(true);
  //   setIsCharging(false);
  // };

  // const handleResume = () => {
  //   setIsPaused(false);
  //   setIsCharging(true);
  // };

  const handleStopCharging = async () => {
    if (!chargingData || !sessionId) {
      showPopup("Không tìm thấy thông tin phiên sạc", "error");
      return;
    }

    try {
      console.log('⏹ Stopping charging session:', sessionId);

      // Gọi API để stop charging session
      const response = await api.post(`/charging/sessions/${sessionId}/stop`, {
        status: "completed"
      });

      console.log('🛑 Stop API Response:', response);
      console.log('🛑 Response Status:', response.status);
      console.log('🛑 Response Data:', response.data);

      // Check success by status code (200 or 201) or success field
      const isSuccess = response.status === 200 || response.status === 201 || response.data?.success;

      if (isSuccess) {
        console.log('✅ Successfully stopped charging session');

        // Dừng sạc
        setIsCharging(false);
        setIsPaused(true);

        // Đóng SSE stream
        if (eventSource) {
          eventSource.close();
          setEventSource(null);
        }

        // Hiển thị popup với thông tin hiện tại
        showPaymentPopup();
      } else {
        console.error('❌ Failed to stop charging - unexpected response');
        showPopup("Không thể dừng phiên sạc. Vui lòng thử lại.", "error");
      }
    } catch (error) {
      console.error("Error stopping charging:", error);
      showPopup(
        error.response?.data?.message || "Lỗi khi dừng phiên sạc",
        "error"
      );
    }
  };

  const handleConfirmPayment = () => {
    closePaymentPopup();

    // Session đã được stop ở handleStopCharging rồi, chỉ cần navigate
    showPopup("Chuyển đến trang thanh toán...", "success");

    const paymentData = {
      chargingData: {
        vehicleInfo: {
          id: chargingData.id, // vehicleId để gọi VNPay API
          vehicleId: chargingData.id, // Thêm vehicleId rõ ràng
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
        },
      },
    };

    // Navigate to payment page with charging data
    setTimeout(() => {
      navigate("/payment", {
        state: paymentData,
      });
    }, 1000);
  };

  const handleCancelPayment = () => {
    // Chỉ đóng popup, không gọi API
    // Session đã stop rồi, nếu muốn tiếp tục thì click nút "Tiếp tục sạc"
    closePaymentPopup();
  };

  const handleResumeCharging = async () => {
    console.log('▶️ Attempting to resume charging...');

    // Reset isPaused và gọi lại handlePayment để start session mới
    setIsPaused(false);

    // Gọi handlePayment để tạo session mới và bắt đầu streaming
    await handlePayment();
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

  const pricingSessionDetails = Array.isArray(pricingEstimate?.sessionDetails) ? pricingEstimate.sessionDetails : [];
  const pricingFirstSession = pricingSessionDetails.length > 0 ? pricingSessionDetails[0] : null;
  const pricingLastSession = pricingSessionDetails.length > 0 ? pricingSessionDetails[pricingSessionDetails.length - 1] : null;

  const toNumeric = (value) => {
    if (value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const sessionInitialPercent = (() => {
    const candidates = [
      chargingData?.sessionInitialPin,
      pricingFirstSession?.initialPercent,
      vehicleData?.sessionInitialPin,
    ];
    for (const candidate of candidates) {
      const numeric = toNumeric(candidate);
      if (numeric !== null) return numeric;
    }
    return null;
  })();

  const sessionCurrentPercent = (() => {
    const candidates = [
      chargingData?.currentPin,
      pricingLastSession?.endPercent,
      pricingLastSession?.currentPercent,
      vehicleData?.currentPin,
      chargingData?.currentCharge,
    ];
    for (const candidate of candidates) {
      const numeric = toNumeric(candidate);
      if (numeric !== null) return numeric;
    }
    return null;
  })();

  const totalTimeMinutes = (() => {
    const candidates = [
      chargingData?.timeElapsed,
      chargingData?.sessionDurationMinutes,
      pricingEstimate?.totalMinutes,
      vehicleData?.sessionDurationMinutes,
    ];
    for (const candidate of candidates) {
      const numeric = toNumeric(candidate);
      if (numeric !== null) return numeric;
    }
    return null;
  })();

  const pinGainPercent = (() => {
    const candidates = [
      chargingData?.pinGainPercent,
      vehicleData?.pinGainPercent,
    ];
    for (const candidate of candidates) {
      const numeric = toNumeric(candidate);
      if (numeric !== null) return numeric;
    }
    if (sessionInitialPercent !== null && sessionCurrentPercent !== null) {
      return sessionCurrentPercent - sessionInitialPercent;
    }
    return null;
  })();

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
              {!isCharging && !isPaused && (
                <button
                  className="payment-btn start-btn"
                  onClick={handlePayment}
                  disabled={!chargingData || !hasCheckedIn}
                >
                  ⚡ Bắt đầu sạc
                </button>
              )}
              {isCharging && !isPaused && (
                <button
                  className="payment-btn stop-btn"
                  onClick={handleStopCharging}
                  style={{
                    backgroundColor: '#dc3545',
                    border: 'none'
                  }}
                >
                  ⏹ Dừng sạc
                </button>
              )}
              {isPaused && (
                <button
                  className="payment-btn resume-btn"
                  onClick={handleResumeCharging}
                  style={{
                    backgroundColor: '#28a745',
                    border: 'none'
                  }}
                >
                  ▶️ Tiếp tục sạc
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
                  <div className="info-card charging-status">
                    <div className="card-header-modern">
                      <h2>Trạng thái sạc & Thông tin cổng</h2>
                      <div className={`status-badge-modern ${isCharging ? 'charging' : 'waiting'}`}>
                        <span className="status-dot"></span>
                        {isCharging ? 'Đang sạc' : 'Chờ bắt đầu'}
                      </div>
                    </div>

                    {/* Warning Section - merged from standalone */}
                    {!isCharging && (() => {
                      const readiness = getReservationReadiness();
                      if (!readiness.ready && readiness.reasons.length > 0) {
                        return (
                          <div style={{
                            margin: '16px 0',
                            padding: '16px',
                            background: 'linear-gradient(135deg, #fff9e6 0%, #fff3cd 100%)',
                            border: '2px solid #ffc107',
                            borderRadius: '10px',
                            boxShadow: '0 2px 8px rgba(255, 193, 7, 0.1)'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '12px',
                              paddingBottom: '10px',
                              borderBottom: '2px solid rgba(255, 193, 7, 0.3)'
                            }}>
                              <span style={{ fontSize: '22px', marginRight: '10px' }}>⚠️</span>
                              <h4 style={{
                                margin: 0,
                                color: '#856404',
                                fontSize: '15px',
                                fontWeight: '600'
                              }}>
                                Lưu ý trước khi bắt đầu sạc
                              </h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {readiness.reasons.map((reason, index) => (
                                <div key={index} style={{
                                  display: 'flex',
                                  alignItems: 'start',
                                  padding: '10px',
                                  backgroundColor: 'rgba(255, 255, 255, 0.7)',
                                  borderRadius: '6px',
                                  border: '1px solid rgba(255, 193, 7, 0.25)'
                                }}>
                                  <span style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    minWidth: '65px',
                                    padding: '3px 8px',
                                    borderRadius: '5px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    marginRight: '10px',
                                    backgroundColor: reason.type === 'error' ? '#dc3545' :
                                      reason.type === 'warning' ? '#ffc107' : '#17a2b8',
                                    color: '#fff',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    {reason.type === 'error' ? '🚫 LỖI' :
                                      reason.type === 'warning' ? '⚠️ Cảnh báo' : 'ℹ️ Thông tin'}
                                  </span>
                                  <span style={{
                                    color: '#495057',
                                    fontSize: '13px',
                                    lineHeight: '1.5',
                                    flex: 1
                                  }}>
                                    {reason.message}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    <div className="battery-section-modern">
                      <div className="battery-visual">
                        <div className="battery-container">
                          <div
                            className="battery-fill"
                            style={{ width: `${chargingData.currentCharge}%` }}
                          >
                            <div className="battery-shine"></div>
                          </div>
                          <span className="battery-text">{chargingData.currentCharge}%</span>
                        </div>
                        <div className="battery-tips"></div>
                      </div>
                      <div className="battery-stats">
                        <div className="stat-large">
                          <span className="stat-value">{chargingData.currentCharge}%</span>
                          <span className="stat-label">Mức pin</span>
                        </div>
                      </div>
                    </div>

                    <div className="info-grid-modern">
                      {/* QR Code Section */}
                      {location.state?.reservation?.qr && (
                        <div className="info-group" style={{
                          gridColumn: '1 / -1',
                          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                          padding: '20px',
                          borderRadius: '12px',
                          border: '2px solid #dee2e6',
                          marginBottom: '16px'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '20px'
                          }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                margin: '0 0 8px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ fontSize: '24px' }}>📱</span>
                                QR Code Check-in
                              </h3>
                              <p style={{
                                margin: 0,
                                color: '#6c757d',
                                fontSize: '14px',
                                lineHeight: '1.6'
                              }}>
                                Nhân viên trạm sạc vui lòng quét mã QR này để check-in và cho phép khách hàng bắt đầu sạc.
                              </p>
                              <div style={{
                                marginTop: '12px',
                                padding: '8px 12px',
                                backgroundColor: (reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) ? '#d4edda' : '#fff3cd',
                                border: `1px solid ${(reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) ? '#c3e6cb' : '#ffc107'}`,
                                borderRadius: '6px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}>
                                <span style={{ fontSize: '16px' }}>
                                  {(reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) ? '✅' : '⏳'}
                                </span>
                                <span style={{
                                  fontSize: '13px',
                                  fontWeight: '600',
                                  color: (reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) ? '#155724' : '#856404'
                                }}>
                                  {(reservationData?.qrCheck ?? location.state?.reservation?.qrCheck) ? 'Đã check-in' : 'Chờ check-in'}
                                </span>
                              </div>
                            </div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '12px'
                            }}>
                              <div style={{
                                padding: '12px',
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                border: '3px solid #007bff'
                              }}>
                                <img
                                  src={location.state.reservation.qr}
                                  alt="QR Code"
                                  style={{
                                    width: '180px',
                                    height: '180px',
                                    display: 'block'
                                  }}
                                />
                              </div>
                              <span style={{
                                fontSize: '12px',
                                color: '#6c757d',
                                textAlign: 'center'
                              }}>
                                Mã đặt chỗ: {location.state.reservation.id?.slice(-8) || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="info-group">
                        <h3>Thông tin cổng sạc</h3>
                        <div className="info-items">
                          <div className="info-item-modern">
                            <span className="item-icon">⚡</span>
                            <div className="item-content">
                              <span className="item-label">Loại cổng</span>
                              <span className="item-value">{portInfo?.portType || 'N/A'}</span>
                            </div>
                          </div>
                          <div className="info-item-modern">
                            <span className="item-icon">🔋</span>
                            <div className="item-content">
                              <span className="item-label">Pin ban đầu</span>
                              <span className="item-value">
                                {sessionInitialPercent !== null
                                  ? `${Math.round(sessionInitialPercent).toLocaleString('vi-VN')}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="info-item-modern">
                            <span className="item-icon">⚡</span>
                            <div className="item-content">
                              <span className="item-label">Pin hiện tại</span>
                              <span className="item-value">
                                {sessionCurrentPercent !== null
                                  ? `${Math.round(sessionCurrentPercent).toLocaleString('vi-VN')}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="info-group">
                        <h3>Năng lượng & Chi phí</h3>
                        <div className="info-items">
                          <div className="info-item-modern">
                            <span className="item-icon">⚙️</span>
                            <div className="item-content">
                              <span className="item-label">Năng lượng tiêu thụ</span>
                              <span className="item-value">{chargingData.energyKwh?.toFixed(2) || 0} kWh</span>
                            </div>
                          </div>
                          <div className="info-item-modern">
                            <span className="item-icon">⏱️</span>
                            <div className="item-content">
                              <span className="item-label">Tổng thời gian (phút)</span>
                              <span className="item-value">
                                {totalTimeMinutes !== null
                                  ? Math.max(0, Math.round(totalTimeMinutes)).toLocaleString('vi-VN')
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                          <div className="info-item-modern highlight-item">
                            <span className="item-icon">💰</span>
                            <div className="item-content">
                              <span className="item-label">Tổng chi phí</span>
                              <span className="item-value">{Math.round(chargingData.chargingCost || 0).toLocaleString("vi-VN")} VNĐ</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="info-group">
                        <h3>Chi tiết phí</h3>
                        <div className="info-items">
                          <div className="info-item-modern">
                            <span className="item-icon">📋</span>
                            <div className="item-content">
                              <span className="item-label">Phí đặt lịch</span>
                              <span className="item-value">{Math.round(chargingData.bookingCost || 0)?.toLocaleString("vi-VN")} VNĐ</span>
                            </div>
                          </div>
                          <div className="info-item-modern">
                            <span className="item-icon">⚡</span>
                            <div className="item-content">
                              <span className="item-label">Phí điện</span>
                              <span className="item-value">{Math.round(chargingData.energyCost || 0)?.toLocaleString("vi-VN")} VNĐ</span>
                            </div>
                          </div>
                          <div className="info-item-modern highlight-item">
                            <span className="item-icon">📈</span>
                            <div className="item-content">
                              <span className="item-label">Pin tăng %</span>
                              <span className="item-value">
                                {pinGainPercent !== null
                                  ? `${pinGainPercent > 0 ? '+' : ''}${Math.round(pinGainPercent).toLocaleString('vi-VN')}%`
                                  : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="session-right">
              <ChargingStationCarousel />

              {/* Thông tin xe - Redesigned */}
              {chargingData && (
                <div className="info-card" style={{
                  marginTop: '20px',
                  background: '#ffffff',
                  border: '2px solid #e5e7eb',
                  color: '#1f2937',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderRadius: '16px',
                  padding: '0',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {/* Title at the very top - centered */}
                  <div style={{
                    width: '100%',
                    padding: '24px 28px',
                    borderBottom: '2px solid #e5e7eb',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #f0fdf4 100%)',
                    borderRadius: '16px 16px 0 0'
                  }}>
                    <h2 style={{
                      margin: 0,
                      background: 'linear-gradient(135deg, #16a34a, #059669)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      fontSize: '24px',
                      fontWeight: '700',
                      display: 'block',
                      letterSpacing: '0.5px'
                    }}>🚗 Thông tin xe</h2>
                  </div>

                  {/* Vehicle information content */}
                  <div style={{
                    padding: '28px',
                    display: 'grid',
                    gap: '16px'
                  }}>
                    {/* Biển số - Featured */}
                    <div style={{
                      padding: '20px',
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      borderRadius: '12px',
                      border: '2px solid #16a34a',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        marginBottom: '8px',
                        color: '#059669'
                      }}>
                        Biển số xe
                      </div>
                      <div style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        letterSpacing: '2px',
                        fontFamily: 'monospace',
                        color: '#16a34a'
                      }}>
                        {chargingData.plateNumber}
                      </div>
                    </div>

                    {/* Other info */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, 1fr)',
                      gap: '12px'
                    }}>
                      <div style={{
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🏭 Hãng xe
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {chargingData.make}
                        </div>
                      </div>

                      <div style={{
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🚙 Mẫu xe
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {chargingData.model}
                        </div>
                      </div>

                      <div style={{
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🔋 Pin
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {chargingData.batteryCapacity} kWh
                        </div>
                      </div>

                      <div style={{
                        padding: '14px',
                        background: '#f9fafb',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb'
                      }}>
                        <div style={{
                          fontSize: '11px',
                          color: '#6b7280',
                          marginBottom: '6px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          🔌 Cổng sạc
                        </div>
                        <div style={{
                          fontSize: '16px',
                          fontWeight: '600',
                          color: '#1f2937'
                        }}>
                          {chargingData.connectorType}
                        </div>
                      </div>
                    </div>
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
