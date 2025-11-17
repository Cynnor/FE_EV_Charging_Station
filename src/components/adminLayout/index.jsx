import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import AdminSidebar from "../adminSidebar";
import AdminHeader from "../adminHeader";
import "./index.scss";

const pathToTab = {
  "": "station-management",
  "station-management": "station-management",
  "user-management": "user-management",
  "subscription-management": "subscription-management",
  "transaction-management": "stats-reports",
  "revenue-management": "stats-reports",
  "analytics": "stats-reports",
};

const menuItems = [
  { id: "station-management", label: "Quản lý trạm sạc" },
  { id: "user-management", label: "Quản lý người dùng" },
  { id: "subscription-management", label: "Quản lý gói đăng ký" },
  { id: "stats-reports", label: "Thống kê & báo cáo" },
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy tab từ path
  const getActiveTabFromPath = () => {
    const segments = location.pathname.split("/");
    // segments: ["", "admin", ...]
    const tab = segments[2] || "";
    return pathToTab[tab] || "station-management";
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

  useEffect(() => {
    setActiveTab(getActiveTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (tabId, path) => {
    setActiveTab(tabId);
    navigate(path ? `/admin/${path}` : "/admin");
  };

  const getCurrentTitle = () => {
    const item = menuItems.find((item) => item.id === activeTab);
    return item ? item.label : "Dashboard Quản trị";
  };

  return (
    <div className="admin-layout">
      <AdminSidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <main className="admin-main-content">
        <AdminHeader
          title={getCurrentTitle()}
          subtitle="Chào mừng trở lại! Quản lý vận hành hệ thống của bạn."
        />

        <div className="admin-content-area">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
