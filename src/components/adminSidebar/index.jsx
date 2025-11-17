import "./index.scss";

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    {
      id: "station-management",
      icon: "⚡",
      label: "Quản lý trạm sạc",
      path: "station-management",
    },
    {
      id: "user-management",
      icon: "👥",
      label: "Quản lý người dùng",
      path: "user-management",
    },
    {
      id: "subscription-management",
      icon: "📦",
      label: "Quản lý gói đăng ký",
      path: "subscription-management",
    },
    {
      id: "stats-reports",
      icon: "📊",
      label: "Thống kê & báo cáo",
      path: "analytics",
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
        {menuItems.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activeTab === item.id ? "active" : ""}`}
            onClick={() => setActiveTab(item.id, item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {activeTab === item.id && <div className="active-indicator"></div>}
          </button>
        ))}
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

export default AdminSidebar;
