import { useState, useEffect } from "react"; // Import hooks từ React để quản lý state và side effects
import { Outlet, useLocation, useNavigate } from "react-router-dom"; // Import các component và hooks để điều hướng
import AdminSidebar from "../adminSidebar"; // Import component sidebar quản trị
import AdminHeader from "../adminHeader"; // Import component header quản trị
import "./index.scss"; // Import file styles cho layout

// Object mapping từ đường dẫn URL sang ID của tab tương ứng
const pathToTab = {
  "": "station-management", // Path rỗng (root) -> tab quản lý trạm sạc
  "station-management": "station-management", // Path quản lý trạm sạc
  "user-management": "user-management", // Path quản lý người dùng
  "subscription-management": "subscription-management", // Path quản lý gói đăng ký
  "transaction-management": "stats-reports", // Path quản lý giao dịch -> tab thống kê
  "revenue-management": "stats-reports", // Path quản lý doanh thu -> tab thống kê
  analytics: "stats-reports", // Path phân tích -> tab thống kê
};

// Danh sách các menu item để hiển thị tiêu đề
const menuItems = [
  { id: "station-management", label: "Quản lý trạm sạc" }, // Menu quản lý trạm sạc
  { id: "user-management", label: "Quản lý người dùng" }, // Menu quản lý người dùng
  { id: "subscription-management", label: "Quản lý gói đăng ký" }, // Menu quản lý gói đăng ký
  { id: "stats-reports", label: "Thống kê & báo cáo" }, // Menu thống kê và báo cáo
];

const AdminLayout = () => {
  const location = useLocation(); // Hook để lấy thông tin về đường dẫn hiện tại
  const navigate = useNavigate(); // Hook để điều hướng đến các trang khác

  // Hàm lấy ID tab active từ đường dẫn URL hiện tại
  const getActiveTabFromPath = () => {
    const segments = location.pathname.split("/"); // Tách đường dẫn thành mảng các phần tử (ví dụ: ["", "admin", "station-management"])
    const tab = segments[2] || ""; // Lấy phần tử thứ 3 (index 2) là path sau "/admin/"
    return pathToTab[tab] || "station-management"; // Trả về ID tab tương ứng hoặc mặc định là station-management
  };

  const [activeTab, setActiveTab] = useState(getActiveTabFromPath()); // State lưu trữ ID của tab đang active, khởi tạo từ URL

  // Effect chạy mỗi khi đường dẫn thay đổi
  useEffect(() => {
    setActiveTab(getActiveTabFromPath()); // Cập nhật activeTab khi URL thay đổi
  }, [location.pathname]); // Dependency array chứa pathname để effect chạy khi pathname thay đổi

  // Hàm xử lý khi người dùng click vào menu item
  const handleTabChange = (tabId, path) => {
    setActiveTab(tabId); // Cập nhật state activeTab với ID tab mới
    navigate(path ? `/admin/${path}` : "/admin"); // Điều hướng đến đường dẫn mới, nếu không có path thì về /admin
  };

  // Hàm lấy tiêu đề hiện tại dựa trên tab đang active
  const getCurrentTitle = () => {
    const item = menuItems.find((item) => item.id === activeTab); // Tìm menu item có ID trùng với activeTab
    return item ? item.label : "Dashboard Quản trị"; // Trả về label của item hoặc tiêu đề mặc định
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

export default AdminLayout; // Export component để sử dụng ở nơi khác
