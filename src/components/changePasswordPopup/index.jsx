import { useState } from "react";
import "./index.scss";

/**
 * ChangePasswordPopup Component
 *
 * A popup modal for changing user password with validation and strength indicator
 *
 * @param {boolean} isOpen - Controls popup visibility
 * @param {function} onClose - Callback when popup is closed
 * @param {function} onSubmit - Callback when form is submitted with (oldPassword, newPassword)
 */
const ChangePasswordPopup = ({ isOpen, onClose, onSubmit }) => {
  // Form data state - stores old password, new password, and confirmation
  const [formData, setFormData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Validation errors for each field
  const [errors, setErrors] = useState({});

  // Server-side error message (e.g., wrong old password)
  const [serverError, setServerError] = useState("");

  // Toggle visibility for each password field
  const [showPasswords, setShowPasswords] = useState({
    old: false,
    new: false,
    confirm: false,
  });

  /**
   * Calculate password strength based on multiple criteria
   *
   * Scoring system (0-5):
   * - Length >= 8: +1 point
   * - Length >= 12: +1 point
   * - Mixed case (a-z, A-Z): +1 point
   * - Contains numbers: +1 point
   * - Contains special characters: +1 point
   *
   * @param {string} password - Password to evaluate
   * @returns {object} Object with level (0-5), text description, and color
   */
  const getPasswordStrength = (password) => {
    if (!password) return { level: 0, text: "", color: "" };

    let strength = 0;
    // Check length criteria
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    // Check for mixed case letters
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    // Check for numbers
    if (/[0-9]/.test(password)) strength++;
    // Check for special characters
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    // Define strength levels with Vietnamese labels and colors
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

  // Calculate current password strength for display
  const passwordStrength = getPasswordStrength(formData.newPassword);

  /**
   * Validate all form fields
   *
   * Validation rules:
   * - Old password: Required
   * - New password: Required, min 8 chars, must include uppercase, lowercase, number, special char
   * - New password must differ from old password
   * - Confirm password: Required, must match new password
   *
   * @returns {boolean} True if form is valid, false otherwise
   */
  const validateForm = () => {
    const newErrors = {};

    // Validate old password field
    if (!formData.oldPassword) {
      newErrors.oldPassword = "Vui lòng nhập mật khẩu cũ";
    }

    // Validate new password field with multiple criteria
    if (!formData.newPassword) {
      newErrors.newPassword = "Vui lòng nhập mật khẩu mới";
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = "Mật khẩu phải có ít nhất 8 ký tự";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(
        formData.newPassword
      )
    ) {
      newErrors.newPassword =
        "Mật khẩu phải gồm chữ hoa, chữ thường, số và ký tự đặc biệt";
    } else if (formData.newPassword === formData.oldPassword) {
      newErrors.newPassword = "Mật khẩu mới phải khác mật khẩu cũ";
    }

    // Validate password confirmation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Vui lòng xác nhận mật khẩu mới";
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = "Xác nhận mật khẩu không khớp";
      // Auto-clear confirmation field for re-entry
      setFormData((prev) => ({ ...prev, confirmPassword: "" }));
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle input field changes
   *
   * - Updates form data
   * - Clears field-specific errors when user starts typing
   * - Clears server errors
   * - Clears confirm password error when new password changes
   *
   * @param {string} field - Field name to update
   * @param {string} value - New field value
   */
  const handleChange = (field, value) => {
    // Update form data
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }

    // Clear server error on any input change
    if (serverError) {
      setServerError("");
    }

    // Clear confirmation error when new password is modified
    if (field === "newPassword" && errors.confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

  /**
   * Handle form submission
   *
   * - Validates form
   * - Calls parent onSubmit callback if valid
   * - Closes popup on success
   * - Keeps popup open on error (handled by parent)
   */
  const handleSubmit = async () => {
    if (validateForm()) {
      try {
        await onSubmit(formData.oldPassword, formData.newPassword);
        handleClose();
      } catch (error) {
        // Error handling is done in parent component
        // Don't close popup when there's an error
      }
    }
  };

  /**
   * Handle popup close
   *
   * - Resets all form data
   * - Clears all errors
   * - Resets password visibility toggles
   * - Calls parent onClose callback
   */
  const handleClose = () => {
    setFormData({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setErrors({});
    setServerError("");
    setShowPasswords({ old: false, new: false, confirm: false });
    onClose();
  };

  // Don't render if popup is not open
  if (!isOpen) return null;

  return (
    <div className="change-password-overlay">
      <div className="change-password-popup">
        {/* Popup Header with title and close button */}
        <div className="popup-header">
          <h2>Đổi mật khẩu</h2>
          <button className="close-btn" onClick={handleClose}>
            ✕
          </button>
        </div>

        <div className="popup-content">
          {/* Display server error banner if exists */}
          {serverError && (
            <div className="server-error-banner">{serverError}</div>
          )}

          {/* Old Password Field */}
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
              {/* Toggle password visibility button */}
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
            {/* Display field error if exists */}
            {errors.oldPassword && (
              <span className="error-message">{errors.oldPassword}</span>
            )}
          </div>

          {/* New Password Field with Strength Indicator */}
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
              {/* Toggle password visibility button */}
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
            {/* Display field error if exists */}
            {errors.newPassword && (
              <span className="error-message">{errors.newPassword}</span>
            )}

            {/* Password Strength Indicator - Always visible to guide user */}
            <div className="password-strength">
              {/* Visual strength bar */}
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${(passwordStrength.level / 5) * 100}%`,
                    backgroundColor: passwordStrength.color || "#ddd",
                  }}
                ></div>
              </div>
              {/* Strength level text */}
              <span
                className="strength-text"
                style={{ color: passwordStrength.color || "#999" }}
              >
                {passwordStrength.text
                  ? `Độ mạnh: ${passwordStrength.text}`
                  : "Độ mạnh: Chưa nhập"}
              </span>
            </div>
          </div>

          {/* Confirm Password Field */}
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
              {/* Toggle password visibility button */}
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
            {/* Display field error if exists */}
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
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
