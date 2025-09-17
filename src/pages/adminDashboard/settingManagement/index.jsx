import { useState } from "react";
import "./index.scss";

const initialSettings = {
  notification: true,
  autoUpdate: false,
  theme: "light",
  language: "vi",
  supportEmail: "support@evcharging.vn",
};

const SettingManagement = () => {
  const [settings, setSettings] = useState(initialSettings);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="settings-management">
      <div className="page-header">
        <div className="header-content">
          <h2>Cài đặt hệ thống</h2>
          <p>Cấu hình và tuỳ chỉnh hệ thống quản trị</p>
        </div>
      </div>
      <form className="settings-form">
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="notification"
              checked={settings.notification}
              onChange={handleChange}
            />
            Nhận thông báo hệ thống
          </label>
        </div>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="autoUpdate"
              checked={settings.autoUpdate}
              onChange={handleChange}
            />
            Tự động cập nhật dữ liệu
          </label>
        </div>
        <div className="form-group">
          <label>Giao diện</label>
          <select name="theme" value={settings.theme} onChange={handleChange}>
            <option value="light">Sáng</option>
            <option value="dark">Tối</option>
          </select>
        </div>
        <div className="form-group">
          <label>Ngôn ngữ</label>
          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="form-group">
          <label>Email hỗ trợ</label>
          <input
            type="email"
            name="supportEmail"
            value={settings.supportEmail}
            onChange={handleChange}
          />
        </div>
        <div className="form-actions">
          <button type="button" className="btn-primary">
            Lưu thay đổi
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingManagement;
