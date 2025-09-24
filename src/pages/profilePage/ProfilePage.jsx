import "./ProfilePage.scss";

const mockUser = {
  name: "Nguyen Van A",
  email: "nguyenvana@example.com",
  phone: "0901234567",
  address: "123 Đường ABC, Quận 1, TP.HCM",
};

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
  // ...existing code...
];

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

const ProfilePage = () => (
  <div className="profile-page dark-theme">
    <h1 className="profile-title">Hồ sơ cá nhân</h1>
    <section className="profile-section user-info">
      <h2>Thông tin người dùng</h2>
      <div className="user-details">
        <p>
          <b>Tên:</b> {mockUser.name}
        </p>
        <p>
          <b>Email:</b> {mockUser.email}
        </p>
        <p>
          <b>Số điện thoại:</b> {mockUser.phone}
        </p>
        <p>
          <b>Địa chỉ:</b> {mockUser.address}
        </p>
        <button className="change-password-btn">Đổi mật khẩu</button>
      </div>
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

export default ProfilePage;
