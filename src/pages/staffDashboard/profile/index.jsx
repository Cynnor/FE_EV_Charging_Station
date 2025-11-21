import { useState } from "react";
import "./index.scss";

const Profile = () => {
    const [activeTab, setActiveTab] = useState("info");
    const [isEditing, setIsEditing] = useState(false);
    const [showChangePassword, setShowChangePassword] = useState(false);

    const [profileData, setProfileData] = useState({
        name: "Nguyễn Văn A",
        email: "nva@evcharging.com",
        phone: "0901234567",
        employeeId: "EMP001",
        position: "Nhân viên trạm sạc",
        station: "Trạm sạc Vinhomes Grand Park",
        department: "Vận hành",
        startDate: "2024-01-15",
        address: "123 Đường ABC, Quận 1, TP.HCM",
        emergencyContact: "0907654321",
        emergencyName: "Nguyễn Thị B",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    const workStats = [
        {
            label: "Ngày làm việc",
            value: "25",
            unit: "ngày",
            change: "+2",
            changeType: "increase",
        },
        {
            label: "Phiên sạc xử lý",
            value: "156",
            unit: "phiên",
            change: "+12",
            changeType: "increase",
        },
        {
            label: "Doanh thu xử lý",
            value: "₫2.4M",
            unit: "",
            change: "+15%",
            changeType: "increase",
        },
        {
            label: "Đánh giá",
            value: "4.8",
            unit: "/5",
            change: "+0.2",
            changeType: "increase",
        },
    ];

    const recentActivities = [
        {
            id: 1,
            type: "session",
            title: "Xử lý phiên sạc",
            description: "Hoàn thành phiên sạc cho xe 51A-12345",
            time: "2 giờ trước",
            status: "completed",
        },
        {
            id: 2,
            type: "payment",
            title: "Xử lý thanh toán",
            description: "Thanh toán thành công 150,000đ",
            time: "3 giờ trước",
            status: "completed",
        },
        {
            id: 3,
            type: "report",
            title: "Gửi báo cáo sự cố",
            description: "Báo cáo lỗi kết nối trụ ST007",
            time: "1 ngày trước",
            status: "pending",
        },
        {
            id: 4,
            type: "maintenance",
            title: "Bảo trì trụ sạc",
            description: "Kiểm tra định kỳ trụ ST003",
            time: "2 ngày trước",
            status: "completed",
        },
    ];

    const handleInputChange = (field, value) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePasswordChange = (field, value) => {
        setPasswordData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveProfile = () => {
        // Logic lưu thông tin profile
        console.log("Lưu thông tin profile:", profileData);
        setIsEditing(false);
    };

    const handleChangePassword = () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert("Mật khẩu xác nhận không khớp");
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert("Mật khẩu mới phải có ít nhất 6 ký tự");
            return;
        }

        // Logic đổi mật khẩu
        console.log("Đổi mật khẩu:", passwordData);

        // Reset form
        setPasswordData({
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
        });
        setShowChangePassword(false);
    };

    const handleLogout = () => {
        // Logic đăng xuất
        console.log("Đăng xuất");
    };

    return (
        <div className="profile-content">
            {/* Header */}
            <div className="profile-header">
                <div className="header-left">
                    <h2>Hồ sơ cá nhân</h2>
                    <p>Quản lý thông tin cá nhân và cài đặt tài khoản</p>
                </div>
                <div className="header-right">
                    <button
                        className="btn-secondary"
                        onClick={handleLogout}
                    >
                        <span className="icon">🚪</span>
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* Profile Overview */}
            <div className="profile-overview">
                <div className="profile-card">
                    <div className="profile-avatar">
                        <div className="avatar">
                            <span>S</span>
                        </div>
                        <div className="avatar-info">
                            <h3>{profileData.name}</h3>
                            <p>{profileData.position}</p>
                            <span className="employee-id">ID: {profileData.employeeId}</span>
                        </div>
                    </div>
                    <div className="profile-stats">
                        {workStats.map((stat, index) => (
                            <div key={index} className="stat-item">
                                <div className="stat-value">
                                    {stat.value}
                                    <span className="unit">{stat.unit}</span>
                                </div>
                                <div className="stat-label">{stat.label}</div>
                                <div className={`stat-change ${stat.changeType}`}>
                                    {stat.changeType === "increase" ? "↗" : "↘"} {stat.change}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="profile-tabs">
                <button
                    className={`tab ${activeTab === "info" ? "active" : ""}`}
                    onClick={() => setActiveTab("info")}
                >
                    <span className="icon">👤</span>
                    Thông tin cá nhân
                </button>
            </div>

            {/* Content */}
            <div className="profile-content-area">
                {activeTab === "info" && (
                    <div className="profile-info">
                        <div className="info-card">
                            <div className="card-header">
                                <h3>Thông tin cá nhân</h3>
                                <button
                                    className={`btn-edit ${isEditing ? "editing" : ""}`}
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? "Hủy" : "Chỉnh sửa"}
                                </button>
                            </div>
                            <div className="card-content">
                                <div className="info-grid">
                                    <div className="info-group">
                                        <label>Họ và tên</label>
                                        <input
                                            type="text"
                                            value={profileData.name}
                                            onChange={(e) => handleInputChange("name", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-input"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Email</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            onChange={(e) => handleInputChange("email", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-input"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Số điện thoại</label>
                                        <input
                                            type="tel"
                                            value={profileData.phone}
                                            onChange={(e) => handleInputChange("phone", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-input"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Mã nhân viên</label>
                                        <input
                                            type="text"
                                            value={profileData.employeeId}
                                            disabled
                                            className="info-input disabled"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Chức vụ</label>
                                        <input
                                            type="text"
                                            value={profileData.position}
                                            disabled
                                            className="info-input disabled"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Trạm làm việc</label>
                                        <input
                                            type="text"
                                            value={profileData.station}
                                            disabled
                                            className="info-input disabled"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Phòng ban</label>
                                        <input
                                            type="text"
                                            value={profileData.department}
                                            disabled
                                            className="info-input disabled"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Ngày bắt đầu</label>
                                        <input
                                            type="date"
                                            value={profileData.startDate}
                                            disabled
                                            className="info-input disabled"
                                        />
                                    </div>
                                    <div className="info-group full-width">
                                        <label>Địa chỉ</label>
                                        <textarea
                                            value={profileData.address}
                                            onChange={(e) => handleInputChange("address", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-textarea"
                                            rows="3"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Liên hệ khẩn cấp</label>
                                        <input
                                            type="tel"
                                            value={profileData.emergencyContact}
                                            onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-input"
                                        />
                                    </div>
                                    <div className="info-group">
                                        <label>Tên người liên hệ</label>
                                        <input
                                            type="text"
                                            value={profileData.emergencyName}
                                            onChange={(e) => handleInputChange("emergencyName", e.target.value)}
                                            disabled={!isEditing}
                                            className="info-input"
                                        />
                                    </div>
                                </div>
                                {isEditing && (
                                    <div className="form-actions">
                                        <button
                                            className="btn-secondary"
                                            onClick={() => setIsEditing(false)}
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            className="btn-primary"
                                            onClick={handleSaveProfile}
                                        >
                                            Lưu thay đổi
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Change Password Modal */}
            {showChangePassword && (
                <div className="modal-overlay" onClick={() => setShowChangePassword(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Đổi mật khẩu</h3>
                            <button
                                className="close-btn"
                                onClick={() => setShowChangePassword(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="password-form">
                                <div className="form-group">
                                    <label>Mật khẩu hiện tại</label>
                                    <input
                                        type="password"
                                        value={passwordData.currentPassword}
                                        onChange={(e) => handlePasswordChange("currentPassword", e.target.value)}
                                        className="form-input"
                                        placeholder="Nhập mật khẩu hiện tại"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={passwordData.newPassword}
                                        onChange={(e) => handlePasswordChange("newPassword", e.target.value)}
                                        className="form-input"
                                        placeholder="Nhập mật khẩu mới"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => handlePasswordChange("confirmPassword", e.target.value)}
                                        className="form-input"
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-actions">
                            <button
                                className="btn-secondary"
                                onClick={() => setShowChangePassword(false)}
                            >
                                Hủy
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleChangePassword}
                            >
                                Đổi mật khẩu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Profile;
