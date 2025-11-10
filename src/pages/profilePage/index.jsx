import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../config/api";
import { useNavigate } from "react-router-dom";
import CustomPopup from "../../components/customPopup";
import ConfirmPopup from "../../components/confirmPopup/index.jsx";
import ChangePasswordPopup from "../../components/changePasswordPopup/index.jsx";


const ProfilePage = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({});
  const [originalUserInfo, setOriginalUserInfo] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  // ===== Vehicle states =====

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [isEditingVehicle, setIsEditingVehicle] = useState(false);
  const [vehicleErrors, setVehicleErrors] = useState({});
  const [defaultVehicleId, setDefaultVehicleId] = useState(null);

  // ===== Station mapping =====
  const [stationMap, setStationMap] = useState({});
  const [portTypeMap, setPortTypeMap] = useState({});

  const [reservations, setReservations] = useState([]);
  const [txLoading, setTxLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const itemsPerPage = 5;

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
    fetchVehicleData();
    // Load default vehicle from localStorage
    const savedDefaultVehicle = localStorage.getItem("defaultVehicleId");
    if (savedDefaultVehicle) {
      setDefaultVehicleId(savedDefaultVehicle);
    }
  }, []);

  // Add helper function to normalize reservations
  const normalizeReservations = (reservationList) => {
    return (Array.isArray(reservationList) ? reservationList : []).map((r) => {
      const rid = r._id || r.id || "";
      const vehicle = r.vehicle || {};
      const vid = vehicle._id || vehicle.id || "";
      return {
        ...r,
        _id: rid,
        id: rid,
        vehicle: {
          ...vehicle,
          _id: vid,
          id: vid,
        },
        items: r.items || [],
      };
    });
  };

  // Update reservation fetch with pagination
  useEffect(() => {
    if (!vehicles.length) return;
    let mounted = true;

    const fetchReservations = async () => {
      try {
        setTxLoading(true);
        const res = await api.get(`/reservations`);
        // console.log("Raw reservation data:", res.data);

        if (mounted) {
          const reservationList = res.data?.data?.items || [];
          // console.log("Processed reservations:", reservationList);

          const normalized = normalizeReservations(reservationList);

          setReservations(normalized);
          setTotalPages(Math.ceil(normalized.length / itemsPerPage));

          // Fetch station info for all ports
          await fetchStationInfo(normalized);
        }
      } catch (err) {
        // console.error("Error fetching reservations:", err);
        if (mounted) setReservations([]);
      } finally {
        if (mounted) setTxLoading(false);
      }
    };

    fetchReservations();
    return () => (mounted = false);
  }, [vehicles]);

  // Fetch station information from port IDs - OPTIMIZED VERSION
  const fetchStationInfo = async (reservationList) => {
    try {
      const portIds = new Set();
      reservationList.forEach((r) => {
        r.items?.forEach((item) => {
          const portId = item.slot?.port?._id || item.slot?.port;
          if (portId) portIds.add(portId);
        });
      });

      const stationData = {};
      const portTypeData = {};

      // GỌI TẤT CẢ PORTS SONG SONG
      const portPromises = Array.from(portIds).map((portId) =>
        api
          .get(`/stations/ports/${portId}`)
          .then((res) => ({ portId, data: res.data }))
          .catch((error) => {
            // console.error(`Error fetching port ${portId}:`, error);
            return { portId, data: null };
          })
      );

      const portResults = await Promise.all(portPromises);

      // Extract station IDs
      const stationIds = new Set();
      portResults.forEach(({ portId, data }) => {
        if (data) {
          portTypeData[portId] = data.type || "Unknown";
          if (data.station) {
            stationIds.add(data.station);
          }
        } else {
          portTypeData[portId] = "Unknown";
        }
      });

      // GỌI TẤT CẢ STATIONS SONG SONG
      const stationPromises = Array.from(stationIds).map((stationId) =>
        api
          .get(`/stations/${stationId}`)
          .then((res) => ({ stationId, data: res.data }))
          .catch((error) => {
            // console.error(`Error fetching station ${stationId}:`, error);
            return { stationId, data: null };
          })
      );

      const stationResults = await Promise.all(stationPromises);

      // Map stations to their IDs
      const stationMap = {};
      stationResults.forEach(({ stationId, data }) => {
        if (data) {
          stationMap[stationId] = data;
        }
      });

      // Map ports to stations - LƯU THÊM LONGITUDE VÀ LATITUDE
      portResults.forEach(({ portId, data }) => {
        if (data?.station && stationMap[data.station]) {
          const stationInfo = stationMap[data.station];
          stationData[portId] = {
            stationName: stationInfo.name || "N/A",
            stationId: data.station,
            address: stationInfo.address || "N/A",
            provider: stationInfo.provider || "N/A",
            longitude: stationInfo.longitude,
            latitude: stationInfo.latitude,
          };
        } else {
          stationData[portId] = {
            stationName: "N/A",
            stationId: null,
            address: "N/A",
            provider: "N/A",
            longitude: null,
            latitude: null,
          };
        }
      });

      setStationMap(stationData);
      setPortTypeMap(portTypeData);
    } catch (error) {
      // console.error("Error fetching station info:", error);
    }
  };

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      // console.log("User data:", response.data.data);

      if (response.data.data) {
        const userData = {
          fullname: response.data.data.fullName || "",
          email: response.data.data.email || "",
          phone: response.data.data.phone || "",
          address: response.data.data.address.line1 || "",
          dob: response.data.data.dob || "",
        };

        setUserInfo(userData);
        setOriginalUserInfo(userData);
      }
    } catch (error) {
      // console.error("Error fetching user data:", error);
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    } finally {
      setIsLoading(false);
    }
  };
  const fetchVehicleData = async () => {
    try {
      const res = await api.get("/vehicles");
      // console.log("Vehicle data:", res.data);

      const vehiclesList = res.data?.items || res.data?.data || [];
      const vehiclesArray = Array.isArray(vehiclesList)
        ? vehiclesList
        : [vehiclesList].filter(Boolean);

      // Normalize vehicle IDs
      const normalizedVehicles = vehiclesArray.map((v) => ({
        ...v,
        id: v._id || v.id,
        _id: v._id || v.id,
      }));

      // Auto-select default vehicle if exists
      const savedDefaultVehicle = localStorage.getItem("defaultVehicleId");
      if (savedDefaultVehicle && normalizedVehicles.length > 0) {
        setDefaultVehicleId(savedDefaultVehicle);
      }

      // Sort vehicles - default vehicle first
      const sortedVehicles = normalizedVehicles.sort((a, b) => {
        if (a.id === savedDefaultVehicle) return -1;
        if (b.id === savedDefaultVehicle) return 1;
        return 0;
      });

      setVehicles(sortedVehicles);
    } catch (error) {
      // console.error("Error fetching vehicle:", error);
      if (error.response?.status !== 404) {
        alert("Không thể tải thông tin phương tiện!");
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!userInfo.fullname?.trim()) {
      newErrors.fullName = "Tên không được để trống";
    }

    if (!userInfo.phone?.trim()) {
      newErrors.phone = "Số điện thoại không được để trống";
    } else if (!/^[0-9]{10,11}$/.test(userInfo.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Số điện thoại không hợp lệ";
    }

    if (userInfo.dob && new Date(userInfo.dob) > new Date()) {
      newErrors.dob = "Ngày sinh không thể là ngày trong tương lai";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setUserInfo((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const [popup, setPopup] = useState({
    isOpen: false,
    message: "",
    type: "info",
  });

  const [confirmPopup, setConfirmPopup] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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

  const showConfirmPopup = (message, onConfirm) => {
    setConfirmPopup({
      isOpen: true,
      message,
      onConfirm,
    });
  };

  const closeConfirmPopup = () => {
    setConfirmPopup({
      isOpen: false,
      message: "",
      onConfirm: null,
    });
  };

  const handleChangePassword = async (oldPassword, newPassword) => {
    try {
      await api.put("/users/password", {
        oldPassword,
        newPassword,
      });
      
      // Đóng popup trước khi hiện thông báo thành công
      setIsChangePasswordOpen(false);
      
      showPopup("Đổi mật khẩu thành công! Vui lòng đăng nhập lại.", "success");
      
      // Auto logout sau 2 giây
      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
      }, 2000);
      
    } catch (error) {
      // console.error("Error changing password:", error);
      const errorCode = error.response?.data?.code;
      const errorMessage = error.response?.data?.message;
      
      // Xử lý các loại lỗi cụ thể - ưu tiên check mật khẩu hiện tại sai
      if (error.response?.status === 400 || error.response?.status === 401) {
        // Check mật khẩu hiện tại sai trước
        if (
          errorMessage?.toLowerCase().includes("incorrect") || 
          errorMessage?.toLowerCase().includes("wrong") || 
          errorMessage?.toLowerCase().includes("current password") ||
          errorMessage?.toLowerCase().includes("old password") ||
          errorCode === "INCORRECT_PASSWORD" ||
          errorCode === "WRONG_PASSWORD"
        ) {
          showPopup("Mật khẩu hiện tại không đúng. Vui lòng kiểm tra lại.", "error");
        } else if (errorMessage?.toLowerCase().includes("same") || errorCode === "SAME_PASSWORD") {
          showPopup("Mật khẩu mới không được trùng với mật khẩu hiện tại.", "warning");
        } else if (errorMessage?.toLowerCase().includes("weak") || errorCode === "WEAK_PASSWORD") {
          showPopup("Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.", "warning");
        } else if (errorMessage?.toLowerCase().includes("required") || errorCode === "MISSING_FIELD") {
          showPopup("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới.", "error");
        } else {
          showPopup("" + (errorMessage || "Có lỗi xảy ra khi đổi mật khẩu."), "error");
        }
      } else if (error.response?.status === 422) {
        showPopup("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.", "warning");
      } else {
        showPopup("Có lỗi xảy ra. Vui lòng thử lại sau.", "error");
      }
      
      // Throw error để popup không tự đóng
      throw error;
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      const updateData = {
        fullname: userInfo.fullname?.trim(),
        phone: userInfo.phone?.trim(),
        address: userInfo.address?.trim() || "",
        dob: userInfo.dob,
      };

      // console.log("Updating profile with data:", updateData);

      const response = await api.put("/users/profile", updateData);

      if (response?.data) {
        showPopup("Cập nhật thông tin thành công!", "success");
        setOriginalUserInfo({ ...userInfo });
        setIsEditing(false);
        setErrors({});
      }
    } catch (error) {
      // console.error("Error updating profile:", error);

      if (error.response?.status === 401) {
        showPopup(
          "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          "error"
        );
        setTimeout(() => {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }, 2000);
      } else if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message || "Dữ liệu không hợp lệ";
        showPopup(`Lỗi cập nhật: ${errorMessage}`, "error");
      } else if (error.response?.status === 422) {
        showPopup(
          "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.",
          "warning"
        );
      } else {
        showPopup(
          "Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau!",
          "error"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setUserInfo({ ...originalUserInfo });
    setIsEditing(false);
    setErrors({});
  };

  // Replace old mock-based stats with transaction-based stats
  // total bookings
  const totalBookings = reservations.length;

  // most used port (count by slot.port) and get its type from portTypeMap
  const portCounts = reservations.reduce((acc, r) => {
    const items = r.items || [];
    items.forEach((it) => {
      const portId = it.slot?.port?._id || it.slot?.port;
      if (portId) {
        if (!acc[portId]) {
          acc[portId] = { count: 0 };
        }
        acc[portId].count += 1;
      }
    });
    return acc;
  }, {});

  const mostUsedPortId = Object.entries(portCounts).sort(
    (a, b) => b[1].count - a[1].count
  )[0]?.[0];
  const favoriteConnectorType = mostUsedPortId
    ? portTypeMap[mostUsedPortId] || "N/A"
    : "N/A";

  // Format connector type name
  const getConnectorTypeName = (type) => {
    const typeMap = {
      AC: "AC (Sạc chậm)",
      DC: "DC (Sạc nhanh)",
      Ultral: "",
    };
    return typeMap[type] || type;
  };

  // average booking duration (minutes)
  const durations = reservations.flatMap((r) =>
    (r.items || [])
      .map((it) => {
        if (it.startAt && it.endAt) {
          return (new Date(it.endAt) - new Date(it.startAt)) / (1000 * 60);
        }
        return null;
      })
      .filter(Boolean)
  );
  const avgDuration = durations.length
    ? (durations.reduce((s, d) => s + d, 0) / durations.length).toFixed(0)
    : "N/A";

  // Helper function to format date
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Helper function to get status text
  const getStatusText = (status) => {
    const statusMap = {
      pending: "Chờ xử lý",
      confirmed: "Thanh toán thành công",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  //   const handleVehicleChange = (field, value) => {
  //   setSelectedVehicle(prev => ({
  //     ...prev,
  //     [field]: value
  //   }));
  //   if (vehicleErrors[field]) {
  //     setVehicleErrors(prev => ({ ...prev, [field]: "" }));
  //   }
  // };

  const validateVehicle = () => {
    const errs = {};
    if (!selectedVehicle?.plateNumber?.trim())
      errs.plateNumber = "Biển số xe không được để trống";
    if (!selectedVehicle?.make?.trim())
      errs.make = "Hãng xe không được để trống";
    if (!selectedVehicle?.model?.trim())
      errs.model = "Mẫu xe không được để trống";
    setVehicleErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleVehicleSave = async () => {
    if (!validateVehicle()) return;
    try {
      const vehicleId = selectedVehicle?.id || selectedVehicle?._id;
      const endpoint = vehicleId ? `/vehicles/${vehicleId}` : "/vehicles";
      const method = vehicleId ? api.put : api.post;
      const payload = {
        ...selectedVehicle,
        year: Number(selectedVehicle.year),
        batteryCapacityKwh: Number(selectedVehicle.batteryCapacityKwh),
        status: selectedVehicle.status || "active",
      };

      const res = await method(endpoint, payload);
      const savedVehicle = res.data?.data || payload;

      const normalizedSaved = {
        ...savedVehicle,
        id: savedVehicle._id || savedVehicle.id,
        _id: savedVehicle._id || savedVehicle.id,
      };

      setVehicles((prev) => {
        let updated;
        if (vehicleId) {
          updated = prev.map((v) =>
            v.id === vehicleId || v._id === vehicleId ? normalizedSaved : v
          );
        } else {
          updated = [...prev, normalizedSaved];
        }

        return updated.sort((a, b) => {
          if (a.id === defaultVehicleId) return -1;
          if (b.id === defaultVehicleId) return 1;
          return 0;
        });
      });

      showPopup("Lưu thông tin xe thành công!", "success");
      setIsEditingVehicle(false);
      setSelectedVehicle(null);
    } catch (error) {
      // console.error("Error saving vehicle:", error);
      showPopup("Không thể lưu thông tin xe, vui lòng thử lại!", "error");
    }
  };

  const handleSetDefaultVehicle = (vehicleId) => {
    setDefaultVehicleId(vehicleId);
    localStorage.setItem("defaultVehicleId", vehicleId);
    localStorage.setItem("vehicleId", vehicleId);

    setVehicles((prev) => {
      const sorted = [...prev].sort((a, b) => {
        if (a.id === vehicleId) return -1;
        if (b.id === vehicleId) return 1;
        return 0;
      });
      return sorted;
    });

    showPopup("Đã đặt xe mặc định thành công!", "success");
  };

  const handleDeleteVehicle = async (vehicleId) => {
    showConfirmPopup("Bạn có chắc chắn muốn xóa xe này?", async () => {
      try {
        await api.delete(`/vehicles/${vehicleId}`);
        setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));

        if (defaultVehicleId === vehicleId) {
          setDefaultVehicleId(null);
          localStorage.removeItem("defaultVehicleId");
          localStorage.removeItem("vehicleId");
        }

        closeConfirmPopup();
        showPopup("Xóa xe thành công!", "success");
      } catch (error) {
        // console.error('Error deleting vehicle:', error);
        closeConfirmPopup();
        showPopup("Không thể xóa xe, vui lòng thử lại!", "error");
      }
    });
  };

  // Handle cancel reservation
  const handleCancelReservation = async (reservationId) => {
    if (!reservationId) {
      showPopup("ID đặt chỗ không hợp lệ", "error");
      return;
    }

    showConfirmPopup("Bạn có chắc chắn muốn hủy đặt chỗ này?", async () => {
      try {
        // console.log('Cancelling reservation:', reservationId);
        await api.patch(`/reservations/${reservationId}/cancel`);

        const res = await api.get(`/reservations`);
        const reservationList = res.data?.data?.items || [];
        const normalized = normalizeReservations(reservationList);

        setReservations(normalized);
        setTotalPages(Math.ceil(normalized.length / itemsPerPage));

        if (currentPage > Math.ceil(normalized.length / itemsPerPage)) {
          setCurrentPage(1);
        }

        closeConfirmPopup();
        showPopup("Hủy đặt chỗ thành công!", "success");
      } catch (error) {
        // console.error('Error cancelling reservation:', error);
        const errorMsg =
          error.response?.data?.message ||
          "Không thể hủy đặt chỗ. Vui lòng thử lại!";
        closeConfirmPopup();
        showPopup(errorMsg, "error");
      }
    });
  };

  // Get paginated reservations
  const getPaginatedReservations = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return reservations.slice(startIndex, endIndex);
  };

  // Pagination handlers
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePageClick = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Hàm xử lý xem bản đồ
  const handleViewMap = (stationInfo) => {
    if (!stationInfo?.latitude || !stationInfo?.longitude) {
      showPopup("Không có thông tin tọa độ trạm sạc", "error");
      return;
    }

    // Lấy vị trí hiện tại
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          
          // Mở Google Maps với route từ vị trí hiện tại đến trạm
          const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLat},${currentLng}&destination=${stationInfo.latitude},${stationInfo.longitude}&travelmode=driving`;
          
          window.open(googleMapsUrl, '_blank');
        },
        (error) => {
          // Nếu không lấy được vị trí hiện tại, chỉ hiển thị trạm
          console.error("Error getting location:", error);
          const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${stationInfo.latitude},${stationInfo.longitude}`;
          window.open(googleMapsUrl, '_blank');
        }
      );
    } else {
      // Browser không hỗ trợ geolocation
      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${stationInfo.latitude},${stationInfo.longitude}`;
      window.open(googleMapsUrl, '_blank');
    }
  };

  useEffect(() => {
    // Kiểm tra flag scroll đến lịch sử
    const shouldScroll = sessionStorage.getItem("scrollToHistory");

    if (shouldScroll === "true") {
      // Xóa flag
      sessionStorage.removeItem("scrollToHistory");

      // Scroll đến phần lịch sử sau khi component render
      setTimeout(() => {
        const historySection = document.querySelector(".history-section");
        if (historySection) {
          const yOffset = -100; // offset để không bị che bởi header
          const y =
            historySection.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 100);
    }
  }, []);

  return (
    <div className="profile-page dark-theme">
      <CustomPopup
        isOpen={popup.isOpen}
        message={popup.message}
        type={popup.type}
        onClose={closePopup}
      />

      <ConfirmPopup
        isOpen={confirmPopup.isOpen}
        message={confirmPopup.message}
        onConfirm={confirmPopup.onConfirm}
        onCancel={closeConfirmPopup}
      />

      <ChangePasswordPopup
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        onSubmit={handleChangePassword}
      />

      <h1 className="profile-title">Hồ sơ cá nhân</h1>
      <section className="profile-section user-info">
        <div className="section-header">
          <h2>Thông tin người dùng</h2>
          {!isEditing ? (
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              Chỉnh sửa
            </button>
          ) : (
            <div className="edit-actions">
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={isLoading}
              >
                Lưu
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Hủy
              </button>
            </div>
          )}
        </div>
        <div className="user-details">
          {!isEditing ? (
            <>
              <p>
                <b>Tên:</b> {String(userInfo.fullname || "Chưa cập nhật")}
              </p>
              <p>
                <b>Email:</b> {String(userInfo.email || "Chưa cập nhật")}
              </p>
              <p>
                <b>Số điện thoại:</b>{" "}
                {String(userInfo.phone || "Chưa cập nhật")}
              </p>
              <p>
                <b>Địa chỉ:</b> {String(userInfo.address || "Chưa cập nhật")}
              </p>
              <p>
                <b>Ngày sinh:</b>{" "}
                {userInfo.dob
                  ? new Date(userInfo.dob).toLocaleDateString("vi-VN")
                  : "Chưa cập nhật"}
              </p>
            </>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>
                  <b>Tên:</b>
                </label>
                <input
                  type="text"
                  value={String(userInfo.fullname || "")}
                  onChange={(e) =>
                    handleInputChange("fullname", e.target.value)
                  }
                  placeholder="Nhập tên của bạn"
                  className={errors.fullname ? "error" : ""}
                />
                {errors.fullname && (
                  <span className="error-message">{errors.fullname}</span>
                )}
              </div>
              <div className="form-group">
                <label>
                  <b>Email:</b>
                </label>
                <input
                  type="email"
                  value={String(userInfo.email || "")}
                  disabled
                  className="disabled-input"
                  placeholder="Email không thể thay đổi"
                />
              </div>
              <div className="form-group">
                <label>
                  <b>Số điện thoại:</b>
                </label>
                <input
                  type="tel"
                  value={String(userInfo.phone || "")}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Nhập số điện thoại"
                  className={errors.phone ? "error" : ""}
                />
                {errors.phone && (
                  <span className="error-message">{errors.phone}</span>
                )}
              </div>
              <div className="form-group">
                <label>
                  <b>Địa chỉ:</b>
                </label>
                <input
                  type="text"
                  value={String(userInfo.address || "")}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                  placeholder="Nhập địa chỉ"
                  className={errors.address ? "error" : ""}
                />
                {errors.address && (
                  <span className="error-message">{errors.address}</span>
                )}
              </div>
              <div className="form-group">
                <label>
                  <b>Ngày sinh:</b>
                </label>
                <input
                  type="date"
                  value={String(userInfo.dob || "")}
                  onChange={(e) => handleInputChange("dob", e.target.value)}
                  className={errors.dob ? "error" : ""}
                />
                {errors.dob && (
                  <span className="error-message">{errors.dob}</span>
                )}
              </div>
            </div>
          )}
          <button 
            className="change-password-btn"
            onClick={() => setIsChangePasswordOpen(true)}
          >
            Đổi mật khẩu
          </button>
        </div>
      </section>

      {/* === VEHICLE SECTION === */}
      <section className="profile-section vehicle-section">
        <div className="section-header">
          <h2>Thông tin phương tiện</h2>
          {!isEditingVehicle && (
            <button
              className="edit-btn"
              onClick={() => {
                setSelectedVehicle({});
                setIsEditingVehicle(true);
              }}
            >
              Thêm xe mới
            </button>
          )}
        </div>

        {vehicles.length === 0 && !isEditingVehicle ? (
          <p style={{ color: "#90caf9" }}>
            Chưa có thông tin xe. Nhấn "Thêm xe mới" để bắt đầu.
          </p>
        ) : !isEditingVehicle ? (
          <div className="vehicles-grid">
            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className={`vehicle-card ${
                  defaultVehicleId === vehicle.id ? "default-vehicle" : ""
                }`}
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  localStorage.setItem("vehicleId", vehicle.id);
                }}
              >
                <h3>
                  <span className="plate-number">
                    {vehicle.plateNumber}
                    {defaultVehicleId === vehicle.id && (
                      <span className="default-badge">Mặc định</span>
                    )}
                  </span>
                  <span
                    className="delete-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVehicle(vehicle.id);
                    }}
                  >
                    ✕
                  </span>
                </h3>
                <div className="vehicle-info">
                  <p>
                    <b>Hãng:</b> {vehicle.make || "Chưa cập nhật"}
                  </p>
                  <p>
                    <b>Mẫu:</b> {vehicle.model || "Chưa cập nhật"}
                  </p>
                  <p>
                    <b>Năm:</b> {vehicle.year || "Chưa cập nhật"}
                  </p>
                  <p>
                    <b>Loại sạc:</b>{" "}
                    {vehicle.connectorType + "-" + vehicle.batteryCapacityKwh ||
                      "Chưa cập nhật"}{" "}
                    kWh
                  </p>
                </div>
                <div className="vehicle-actions">
                  <button
                    className={`default-btn ${
                      defaultVehicleId === vehicle.id ? "active" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetDefaultVehicle(vehicle.id);
                    }}
                  >
                    {defaultVehicleId === vehicle.id
                      ? "✓ Xe mặc định"
                      : "Đặt mặc định"}
                  </button>
                  <button
                    className="edit-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicle(vehicle);
                      localStorage.setItem("vehicleId", vehicle.id);
                      setIsEditingVehicle(true);
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="edit-form vehicle-edit-form">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <b>Biển số xe:</b>
                </label>
                <input
                  type="text"
                  value={selectedVehicle?.plateNumber || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      plateNumber: e.target.value,
                    }))
                  }
                  className={vehicleErrors.plateNumber ? "error" : ""}
                  placeholder="VD: 51H-123.45"
                />
                {vehicleErrors.plateNumber && (
                  <span className="error-message">
                    {vehicleErrors.plateNumber}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <b>Hãng xe:</b>
                </label>
                <input
                  type="text"
                  value={selectedVehicle?.make || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      make: e.target.value,
                    }))
                  }
                  placeholder="VD: VinFast"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Mẫu xe:</b>
                </label>
                <input
                  type="text"
                  value={selectedVehicle?.model || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      model: e.target.value,
                    }))
                  }
                  placeholder="VD: VF8"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Năm sản xuất:</b>
                </label>
                <input
                  type="number"
                  value={selectedVehicle?.year || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      year: e.target.value,
                    }))
                  }
                  placeholder="VD: 2023"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Màu xe:</b>
                </label>
                <input
                  type="text"
                  value={selectedVehicle?.color || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      color: e.target.value,
                    }))
                  }
                  placeholder="VD: White"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Số khung (VIN):</b>
                </label>
                <input
                  type="text"
                  value={selectedVehicle?.vin || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      vin: e.target.value,
                    }))
                  }
                  placeholder="VD: WVWAA71K08W201030"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Loại xe:</b>
                </label>
                <select
                  value={selectedVehicle?.type || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      type: e.target.value,
                    }))
                  }
                >
                  <option value="">Chọn loại xe</option>
                  <option value="car">Ô tô</option>
                  <option value="motorbike">Xe máy</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <b>Dung lượng pin (kWh):</b>
                </label>
                <input
                  type="number"
                  value={selectedVehicle?.batteryCapacityKwh || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      batteryCapacityKwh: e.target.value,
                    }))
                  }
                  placeholder="VD: 82"
                />
              </div>

              <div className="form-group">
                <label>
                  <b>Loại cổng sạc:</b>
                </label>
                <select
                  value={selectedVehicle?.connectorType || ""}
                  onChange={(e) =>
                    setSelectedVehicle((prev) => ({
                      ...prev,
                      connectorType: e.target.value,
                    }))
                  }
                >
                  <option value="">Chọn loại cổng sạc</option>
                  <option value="AC">AC</option>
                  <option value="DC">DC</option>
                </select>
              </div>
            </div>

            <div className="edit-actions">
              <button className="save-btn" onClick={handleVehicleSave}>
                Lưu
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setIsEditingVehicle(false);
                  setSelectedVehicle(null);
                  setVehicleErrors({});
                }}
              >
                Hủy
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="profile-section history-section">
        <h2>Lịch sử đặt chỗ</h2>
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Tên trạm</th>
                <th>Xe</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th className="action-column" style={{ textAlign: "center" }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                <tr>
                  <td colSpan={5} style={{ color: "#666" }}>
                    Đang tải...
                  </td>
                </tr>
              ) : getPaginatedReservations().length > 0 ? (
                getPaginatedReservations().map((reservation) => {
                  const reservationId = reservation._id || reservation.id;
                  const vehicleId =
                    reservation.vehicle?._id || reservation.vehicle?.id;
                  const firstItem = reservation.items?.[0];
                  const portId =
                    firstItem?.slot?.port?._id || firstItem?.slot?.port;
                  const stationInfo = stationMap[portId] || {
                    stationName: "Đang tải...",
                  };

                  return (
                    <tr key={reservationId}>
                      <td>{stationInfo.stationName}</td>
                      <td>
                        {reservation.vehicle?.plateNumber || "N/A"}
                        <br />
                        <small style={{ color: "#666" }}>
                          {reservation.vehicle?.make}{" "}
                          {reservation.vehicle?.model}
                        </small>
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem" }}>
                          <div>
                            Bắt đầu: {formatDateTime(firstItem?.startAt)}
                          </div>
                          <div>
                            Kết thúc: {formatDateTime(firstItem?.endAt)}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-badge ${reservation.status}`}>
                          {getStatusText(reservation.status)}
                        </span>
                      </td>
                      <td
                        style={{ textAlign: "center", verticalAlign: "middle" }}
                      >
                        <div
                          className="action-buttons"
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          {reservation.status === "pending" && (
                            <>
                              <button
                                className="start-charge-btn"
                                onClick={() => {
                                  if (reservationId && vehicleId) {
                                    const firstItem = reservation.items?.[0];
                                    const portInfo = firstItem?.slot?.port;

                                    localStorage.setItem(
                                      "reservationId",
                                      reservationId
                                    );
                                    localStorage.setItem(
                                      "vehicleId",
                                      vehicleId
                                    );

                                    navigate("/chargingSession", {
                                      state: {
                                        reservation: {
                                          id: reservationId,
                                          portId: portInfo?._id || portInfo,
                                          powerKw: portInfo?.powerKw || 150,
                                          status: reservation.status,
                                          startAt: firstItem?.startAt,
                                          endAt: firstItem?.endAt,
                                        },
                                        vehicle: {
                                          id: vehicleId,
                                          plateNumber:
                                            reservation.vehicle?.plateNumber,
                                          make: reservation.vehicle?.make,
                                          model: reservation.vehicle?.model,
                                          batteryCapacityKwh:
                                            reservation.vehicle
                                              ?.batteryCapacityKwh,
                                          connectorType:
                                            reservation.vehicle?.connectorType,
                                        },
                                      },
                                    });
                                  } else {
                                    showPopup(
                                      "Không thể lấy thông tin đặt chỗ",
                                      "error"
                                    );
                                  }
                                }}
                              >
                                Bắt đầu sạc
                              </button>
                              <button
                                className="map-btn"
                                onClick={() => handleViewMap(stationInfo)}
                                title="Xem đường đi trên bản đồ"
                              >
                                🗺️
                              </button>
                              <button
                                className="cancel-btn"
                                onClick={() =>
                                  handleCancelReservation(reservationId)
                                }
                              >
                                Hủy
                              </button>
                            </>
                          )}
                          {reservation.status === "cancelled" && (
                            <span style={{ color: "#666", fontSize: "0.9rem" }}>
                              Đã hủy
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={{ textAlign: "center", color: "#90caf9" }}
                  >
                    Chưa có đặt chỗ nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              ← Trước
            </button>

            <div className="pagination-numbers">
              {[...Array(totalPages)].map((_, index) => {
                const pageNumber = index + 1;
                return (
                  <button
                    key={pageNumber}
                    className={`pagination-number ${
                      currentPage === pageNumber ? "active" : ""
                    }`}
                    onClick={() => handlePageClick(pageNumber)}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>

            <button
              className="pagination-btn"
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              Sau →
            </button>
          </div>
        )}
      </section>

      <section className="profile-section analysis-section">
        <h2>Phân tích giao dịch</h2>
        <div className="analysis-cards">
          <div className="analysis-card">
            <div className="icon-box cost">
              <span>📊</span>
            </div>
            <div>
              <div className="analysis-label">Tổng booking</div>
              <div className="analysis-value">{totalBookings}</div>
            </div>
          </div>

          <div className="analysis-card">
            <div className="icon-box location">
              <span>🔌</span>
            </div>
            <div>
              <div className="analysis-label">Loại cổng sử dụng nhiều nhất</div>
              <div className="analysis-value">
                {getConnectorTypeName(favoriteConnectorType)}
              </div>
            </div>
          </div>

          <div className="analysis-card">
            <div className="icon-box time">
              <span>⏱️</span>
            </div>
            <div>
              <div className="analysis-label">
                Thời gian TB mỗi booking (phút)
              </div>
              <div className="analysis-value">{avgDuration}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
