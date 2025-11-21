import "./index.scss"; // Import file styles cho sidebar

// Component nhận props activeTab (tab đang active) và setActiveTab (hàm để thay đổi tab)
const AdminSidebar = ({ activeTab, setActiveTab }) => {
  // Mảng chứa danh sách các menu item trong sidebar
  const menuItems = [
    {
      id: "station-management", // ID định danh cho menu quản lý trạm sạc
      icon: "⚡", // Icon hiển thị cho menu
      label: "Quản lý trạm sạc", // Nhãn hiển thị cho menu
      path: "station-management", // Đường dẫn khi click vào menu
    },
    {
      id: "user-management", // ID định danh cho menu quản lý người dùng
      icon: "👥", // Icon hiển thị
      label: "Quản lý người dùng", // Nhãn hiển thị
      path: "user-management", // Đường dẫn
    },
    {
      id: "subscription-management", // ID định danh cho menu quản lý gói đăng ký
      icon: "📦", // Icon hiển thị
      label: "Quản lý gói đăng ký", // Nhãn hiển thị
      path: "subscription-management", // Đường dẫn
    },
    {
      id: "stats-reports", // ID định danh cho menu thống kê
      icon: "📊", // Icon hiển thị
      label: "Thống kê", // Nhãn hiển thị
      path: "analytics", // Đường dẫn
    },
    {
      id: "report-management", // ID định danh cho menu quản lý báo cáo
      icon: "📝", // Icon hiển thị
      label: "Quản lý báo cáo", // Nhãn hiển thị
      path: "report", // Đường dẫn
    },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">⚡</span>
          <h2>EV Admin</h2>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map(
          (
            item // Duyệt qua từng menu item để render
          ) => (
            <button
              key={item.id} // Key duy nhất cho mỗi menu item
              className={`nav-item ${activeTab === item.id ? "active" : ""}`} // Thêm class 'active' nếu item này đang được chọn
              onClick={() => setActiveTab(item.id, item.path)} // Gọi hàm setActiveTab với ID và path khi click
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {activeTab === item.id && (
                <div className="active-indicator"></div>
              )}
            </button>
          )
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">A</div>
          <div className="user-info">
            <span className="user-name">Admin</span>
            <span className="user-role">Quản trị viên</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar; // Export component để sử dụng ở nơi khác
