import { useState } from "react";
import "./index.scss";

const ChangePasswordPopup = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(""); // Lỗi từ server
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  // Calculate password strength
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: "", color: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    const levels = [
      { level: 0, text: "", color: "" },
      { level: 1, text: "Yếu", color: "#f44336" },
      { level: 2, text: "Trung bình", color: "#ff9800" },
      { level: 3, text: "Khá", color: "#2196f3" },
      { level: 4, text: "Mạnh", color: "#4caf50" },
      { level: 5, text: "Rất mạnh", color: "#00c853" },
    ];

    return levels[strength];
  };

  const passwordStrength = getPasswordStrength(formData.newPassword);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    }

    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(formData.newPassword)) {
      newErrors.newPassword = "Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    } else if (formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
      // Tự động xóa ô xác nhận để người dùng nhập lại
      setFormData(prev => ({ ...prev, confirmPassword: "" }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Clear error khi user bắt đầu nhập
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
    
    // Clear server error khi user nhập
    if (serverError) {
      setServerError("");
    }
    
    // Clear lỗi confirmPassword khi nhập newPassword
    if (field === 'newPassword' && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(formData.oldPassword, formData.newPassword);
        handleClose();
      } catch (error) {
        // Lỗi sẽ được xử lý ở parent component
        // Không cần handleClose() khi có lỗi
      }
    }
  };

  const handleClose = () => {
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setServerError("");
    setShowPasswords({ old: false, new: false, confirm: false });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="change-password-overlay">
      <div className="change-password-popup">
        <div className="popup-header">
          <h2>Đổi mật khẩu</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="popup-content">
          {/* Hiển thị lỗi tổng quát từ server */}
          {serverError && (
            <div className="server-error-banner">
              {serverError}
            </div>
          )}

          <div className="form-group">
            <label>Mật khẩu cũ</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.old ? "text" : "password"}
                value={formData.oldPassword}
                onChange={(e) => handleChange("oldPassword", e.target.value)}
                className={errors.oldPassword || serverError ? "error" : ""}
                placeholder="Nhập mật khẩu cũ"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, old: !prev.old }))
                }
                aria-label="Hiện/Ẩn mật khẩu"
              >
                {showPasswords.old ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.oldPassword && (
              <span className="error-message">{errors.oldPassword}</span>
            )}
          </div>

          <div className="form-group">
            <label>Mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.new ? "text" : "password"}
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                className={errors.newPassword ? "error" : ""}
                placeholder="Nhập mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPasswords((prev) => ({ ...prev, new: !prev.new }))
                }
                aria-label="Hiện/Ẩn mật khẩu"
              >
                {showPasswords.new ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}

            {/* Password Strength Indicator - Always visible */}
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.level / 5) * 100}%`,
                    backgroundColor: passwordStrength.color || '#ddd',
                  }}
                ></div>
              </div>
              <span
                className="strength-text"
                style={{ color: passwordStrength.color || '#999' }}
              >
                {passwordStrength.text ? `Độ mạnh: ${passwordStrength.text}` : 'Độ mạnh: Chưa nhập'}
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Xác nhận mật khẩu mới</label>
            <div className="password-input-wrapper">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                className={errors.confirmPassword ? "error" : ""}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                aria-label="Hiện/Ẩn mật khẩu"
              >
                {showPasswords.confirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        <div className="popup-actions">
          <button className="cancel-btn" onClick={handleClose}>
            Hủy
          </button>
          <button className="submit-btn" onClick={handleSubmit}>
            Đổi mật khẩu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordPopup;
