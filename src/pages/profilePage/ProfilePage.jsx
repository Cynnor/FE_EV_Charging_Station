import { useState, useEffect } from "react";
import "./ProfilePage.scss";
import api from "../../config/api";

const ProfilePage = () => {
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


  // Mock data - replace with actual API call
  const mockHistory = [
    {
      date: "2024-05-01",
      location: "Station A",
      time: "08:00",
      power: 20,
      cost: 100000,
    },
    {
      date: "2024-05-03",
      location: "Station B",
      time: "18:30",
      power: 15,
      cost: 75000,
    },
    {
      date: "2024-05-10",
      location: "Station A",
      time: "07:45",
      power: 22,
      cost: 110000,
    },
  ];

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
    fetchVehicleData(); 
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/users/profile");
      console.log("User data:", response.data.data);

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
      console.error("Error fetching user data:", error);
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
    console.log("Vehicle data:", res.data);

    // Extract vehicles array from response
    const vehiclesList = res.data?.items || res.data?.data || [];
    setVehicles(Array.isArray(vehiclesList) ? vehiclesList : [vehiclesList].filter(Boolean));
  } catch (error) {
    console.error("Error fetching vehicle:", error);
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Prepare the request body
      const updateData = {
        fullname: userInfo.fullname?.trim(),
        phone: userInfo.phone?.trim(),
        address: userInfo.address?.trim() || "",
        dob: userInfo.dob,
      };

      console.log("Updating profile with data:", updateData);

      const response = await api.put("/users/profile", updateData);

      if (response?.data) {
        alert("Cập nhật thông tin thành công!");
        // Update the original data to reflect changes
        setOriginalUserInfo({ ...userInfo });
        setIsEditing(false);
        setErrors({});
      }
    } catch (error) {
      console.error("Error updating profile:", error);

      if (error.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        localStorage.removeItem("token");
        window.location.href = "/login";
      } else if (error.response?.status === 400) {
        const errorMessage =
          error.response?.data?.message || "Dữ liệu không hợp lệ";
        alert(`Lỗi cập nhật: ${errorMessage}`);
      } else if (error.response?.status === 422) {
        alert("Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.");
      } else {
        alert("Có lỗi xảy ra khi cập nhật thông tin. Vui lòng thử lại sau!");
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

  const monthlyCost = mockHistory.reduce((sum, h) => sum + h.cost, 0);
  const locationStats = mockHistory.reduce((acc, h) => {
    acc[h.location] = (acc[h.location] || 0) + 1;
    return acc;
  }, {});
  const favoriteLocation =
    Object.entries(locationStats).sort((a, b) => b[1] - a[1])[0]?.[0] || "";
  const avgPower = (
    mockHistory.reduce((sum, h) => sum + h.power, 0) / mockHistory.length
  ).toFixed(2);

  if (isLoading) {
    return (
      <div className="profile-page dark-theme">
        <div className="loading">Đang tải...</div>
      </div>
    );
  }
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
  if (!selectedVehicle?.plateNumber?.trim()) errs.plateNumber = "Biển số xe không được để trống";
  if (!selectedVehicle?.make?.trim()) errs.make = "Hãng xe không được để trống";
  if (!selectedVehicle?.model?.trim()) errs.model = "Mẫu xe không được để trống";
  setVehicleErrors(errs);
  return Object.keys(errs).length === 0;
};

const handleVehicleSave = async () => {
  if (!validateVehicle()) return;
  try {
    const endpoint = selectedVehicle?.id ? `/vehicles/${selectedVehicle.id}` : "/vehicles";
    const method = selectedVehicle?.id ? api.put : api.post;
    const payload = {
      ...selectedVehicle,
      year: Number(selectedVehicle.year),
      batteryCapacityKwh: Number(selectedVehicle.batteryCapacityKwh),
      status: selectedVehicle.status || "active",
    };

    const res = await method(endpoint, payload);
    const savedVehicle = res.data?.data || payload;

    setVehicles(prev => {
      if (selectedVehicle?.id) {
        return prev.map(v => v.id === selectedVehicle.id ? savedVehicle : v);
      }
      return [...prev, savedVehicle];
    });

    alert("Lưu thông tin xe thành công!");
    setIsEditingVehicle(false);
    setSelectedVehicle(null);
  } catch (error) {
    console.error("Error saving vehicle:", error);
    alert("Không thể lưu thông tin xe, vui lòng thử lại!");
  }
};
// const handleVehicleCancel = () => {
//   setIsEditingVehicle(false);
//   setSelectedVehicle(null);
//   setVehicleErrors({});
// };
const handleDeleteVehicle = async (vehicleId) => {
  if (window.confirm('Bạn có chắc chắn muốn xóa xe này?')) {
    try {
      await api.delete(`/vehicles/${vehicleId}`);
      setVehicles(prev => prev.filter(v => v.id !== vehicleId));
      alert('Xóa xe thành công!');
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Không thể xóa xe, vui lòng thử lại!');
    }
  }
};
  return (
    <div className="profile-page dark-theme">
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
          <button className="change-password-btn">Đổi mật khẩu</button>
        </div>
      </section>

      {/* === VEHICLE SECTION === */}
      <section className="profile-section vehicle-section">
        <div className="section-header">
          <h2>Thông tin phương tiện</h2>
          {!isEditingVehicle && (
            <button className="edit-btn" onClick={() => {
              setSelectedVehicle({});
              setIsEditingVehicle(true);
            }}>
              Thêm xe mới
            </button>
          )}
        </div>

        {vehicles.length === 0 && !isEditingVehicle ? (
          <p style={{ color: "#90caf9" }}>Chưa có thông tin xe. Nhấn "Thêm xe mới" để bắt đầu.</p>
        ) : !isEditingVehicle ? (
          <div className="vehicles-grid">
            {vehicles.map(vehicle => (
              <div key={vehicle.id} className="vehicle-card">
  <h3>
    <span className="plate-number">{vehicle.plateNumber}</span>
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
    <p><b>Hãng:</b> {vehicle.make || "Chưa cập nhật"}</p>
    <p><b>Mẫu:</b> {vehicle.model || "Chưa cập nhật"}</p>
    <p><b>Năm:</b> {vehicle.year || "Chưa cập nhật"}</p>
    <p><b>Loại sạc:</b> {vehicle.connectorType + "-" + vehicle.batteryCapacityKwh || "Chưa cập nhật"} kWh</p>

  </div>
  <div className="vehicle-actions">
    <button className="edit-btn" onClick={() => {
      setSelectedVehicle(vehicle);
      setIsEditingVehicle(true);
    }}>
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
      <label><b>Biển số xe:</b></label>
      <input
        type="text"
        value={selectedVehicle?.plateNumber || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          plateNumber: e.target.value
        }))}
        className={vehicleErrors.plateNumber ? "error" : ""}
        placeholder="VD: 51H-123.45"
      />
      {vehicleErrors.plateNumber && (
        <span className="error-message">{vehicleErrors.plateNumber}</span>
      )}
    </div>

    <div className="form-group">
      <label><b>Hãng xe:</b></label>
      <input
        type="text"
        value={selectedVehicle?.make || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          make: e.target.value
        }))}
        placeholder="VD: VinFast"
      />
    </div>

    <div className="form-group">
      <label><b>Mẫu xe:</b></label>
      <input
        type="text"
        value={selectedVehicle?.model || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          model: e.target.value
        }))}
        placeholder="VD: VF8"
      />
    </div>

    <div className="form-group">
      <label><b>Năm sản xuất:</b></label>
      <input
        type="number"
        value={selectedVehicle?.year || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          year: e.target.value
        }))}
        placeholder="VD: 2023"
      />
    </div>

    <div className="form-group">
      <label><b>Màu xe:</b></label>
      <input
        type="text"
        value={selectedVehicle?.color || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          color: e.target.value
        }))}
        placeholder="VD: White"
      />
    </div>

    <div className="form-group">
      <label><b>Số khung (VIN):</b></label>
      <input
        type="text"
        value={selectedVehicle?.vin || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          vin: e.target.value
        }))}
        placeholder="VD: WVWAA71K08W201030"
      />
    </div>

    <div className="form-group">
      <label><b>Loại xe:</b></label>
      <select
        value={selectedVehicle?.type || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          type: e.target.value
        }))}
      >
        <option value="">Chọn loại xe</option>
        <option value="car">Ô tô</option>
        <option value="bike">Xe máy</option>
      </select>
    </div>

    <div className="form-group">
      <label><b>Dung lượng pin (kWh):</b></label>
      <input
        type="number"
        value={selectedVehicle?.batteryCapacityKwh || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          batteryCapacityKwh: e.target.value
        }))}
        placeholder="VD: 82"
      />
    </div>

    <div className="form-group">
      <label><b>Loại cổng sạc:</b></label>
      <select
        value={selectedVehicle?.connectorType || ""}
        onChange={(e) => setSelectedVehicle(prev => ({
          ...prev,
          connectorType: e.target.value
        }))}
      >
        <option value="">Chọn loại cổng sạc</option>
        <option value="AC">AC</option>
        <option value="DC">DC</option>
      </select>
    </div>
  </div>

  <div className="edit-actions">
    <button className="save-btn" onClick={handleVehicleSave}>Lưu</button>
    <button className="cancel-btn" onClick={() => {
      setIsEditingVehicle(false);
      setSelectedVehicle(null);
      setVehicleErrors({});
    }}>Hủy</button>
  </div>
</div>
        )}
      </section>

      
      <section className="profile-section history-section">
        <h2>Lịch sử sạc</h2>
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Địa điểm</th>
                <th>Giờ</th>
                <th>Công suất (kWh)</th>
                <th>Chi phí (VND)</th>
              </tr>
            </thead>  
            <tbody>
              {Array.isArray(mockHistory) && mockHistory.length > 0 ? (
                mockHistory.map((h, idx) => (
                  <tr key={idx}>
                    <td>{h.date}</td>
                    <td>{h.location}</td>
                    <td>{h.time}</td>
                    <td>{h.power}</td>
                    <td>{h.cost.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ color: "#90caf9" }}>
                    Không có dữ liệu lịch sử sạc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="profile-section analysis-section">
        <h2>Phân tích cá nhân</h2>
        <div className="analysis-cards">
          <div className="analysis-card">
            <div className="icon-box cost">
              <span role="img" aria-label="cost">
                💸
              </span>
            </div>
            <div>
              <div className="analysis-label">Tổng chi phí sạc tháng</div>
              <div className="analysis-value">
                {monthlyCost.toLocaleString()} VND
              </div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="icon-box location">
              <span role="img" aria-label="location">
                📍
              </span>
            </div>
            <div>
              <div className="analysis-label">Địa điểm sạc thường xuyên</div>
              <div className="analysis-value">{favoriteLocation}</div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="icon-box time">
              <span role="img" aria-label="time">
                ⏰
              </span>
            </div>
            <div>
              <div className="analysis-label">Thói quen giờ sạc</div>
              <div className="analysis-value">
                {mockHistory.map((h) => h.time).join(", ")}
              </div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="icon-box power">
              <span role="img" aria-label="power">
                ⚡
              </span>
            </div>
            <div>
              <div className="analysis-label">
                Công suất trung bình mỗi lần sạc
              </div>
              <div className="analysis-value">{avgPower} kWh</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProfilePage;
