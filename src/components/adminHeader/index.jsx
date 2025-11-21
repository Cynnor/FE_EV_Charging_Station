import { useEffect, useRef, useState } from "react"; // Import hooks từ React
import { useNavigate } from "react-router-dom"; // Import hook điều hướng
import "./index.scss"; // Import file styles cho header

// Component nhận props title (tiêu đề) và subtitle (phụ đề)
const AdminHeader = ({ title, subtitle }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false); // State quản lý hiển thị/ẩn menu profile
  const [adminName, setAdminName] = useState("Admin"); // State lưu tên admin, mặc định là "Admin"
  const profileRef = useRef(null); // Ref để tham chiếu đến element profile menu (dùng để detect click bên ngoài)
  const navigate = useNavigate(); // Hook để điều hướng giữa các trang

  // Effect chạy 1 lần khi component mount để lấy thông tin admin từ localStorage
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user"); // Lấy dữ liệu user từ localStorage
      if (!storedUser) return; // Nếu không có dữ liệu thì dừng
      const parsedUser = JSON.parse(storedUser); // Parse chuỗi JSON thành object
      const resolvedName = // Lấy tên từ các thuộc tính có thể có (fullName, name, email) hoặc dùng "Admin"
        parsedUser?.fullName ||
        parsedUser?.name ||
        parsedUser?.email ||
        "Admin";
      setAdminName(resolvedName); // Cập nhật state adminName với tên đã lấy được
    } catch (err) {
      console.error("Không thể đọc thông tin quản trị:", err); // Log lỗi nếu có exception
    }
  }, []); // Dependency array rỗng nên effect chỉ chạy 1 lần khi mount

  // Effect để xử lý click bên ngoài menu profile (để tự động đóng menu)
  useEffect(() => {
    if (!showProfileMenu) return; // Nếu menu không hiển thị thì không cần xử lý

    // Hàm xử lý sự kiện click
    const handleClickOutside = (event) => {
      // Kiểm tra nếu click bên ngoài profileRef
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false); // Đóng menu profile
      }
    };

    document.addEventListener("mousedown", handleClickOutside); // Đăng ký event listener cho sự kiện mousedown
    return () => document.removeEventListener("mousedown", handleClickOutside); // Cleanup: gỡ bỏ event listener khi unmount hoặc showProfileMenu thay đổi
  }, [showProfileMenu]); // Effect chạy lại khi showProfileMenu thay đổi

  // Tạo initials (chữ cái đầu) từ tên admin
  const initials =
    adminName
      .split(" ") // Tách tên thành mảng các từ
      .filter(Boolean) // Loại bỏ các phần tử rỗng
      .map((segment) => segment.charAt(0).toUpperCase()) // Lấy ký tự đầu của mỗi từ và viết hoa
      .join("") // Nối các ký tự lại thành chuỗi
      .slice(0, 2) || "AD"; // Lấy tối đa 2 ký tự, nếu không có thì dùng "AD"

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    if (window.confirm("Bạn có chắc chắn muốn đăng xuất?")) {
      // Hiển thị hộp thoại xác nhận
      localStorage.setItem("token", ""); // Xóa token (set về chuỗi rỗng)
      localStorage.removeItem("token"); // Xóa token khỏi localStorage
      localStorage.removeItem("user"); // Xóa thông tin user khỏi localStorage
      setShowProfileMenu(false); // Đóng menu profile

      navigate("/"); // Điều hướng về trang chủ
    }
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="header-right">
        <div className="profile-cluster" ref={profileRef}>
          <button
            type="button"
            className="admin-avatar"
            aria-label="Tài khoản quản trị"
            onClick={() => setShowProfileMenu((prev) => !prev)} // Toggle trạng thái hiển thị menu (đảo ngược giá trị hiện tại)
          >
            <span>{initials}</span>
          </button>

          {showProfileMenu && ( // Chỉ render menu khi showProfileMenu = true
            <div className="profile-popover">
              <div className="profile-summary">
                <p className="profile-name">{adminName}</p>
                <p className="profile-role">Quản trị viên</p>
              </div>
              <button
                type="button"
                className="menu-item logout"
                onClick={handleLogout}
              >
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader; // Export component để sử dụng ở nơi khác
