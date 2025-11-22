// PaymentPage: Trang tạo giao dịch VNPay cho phiên sạc.
// Các bước chính:
// 1. Nhận chargingData từ trang trước (location.state)
// 2. Hiển thị breakdown chi phí (đặt lịch, điện, tổng)
// 3. Gọi API tạo paymentUrl -> redirect VNPay
// 4. Lưu vehicleId, reservationId vào localStorage để trang payment success xác thực
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

export default function PaymentPage() {
  const navigate = useNavigate(); // hàm điều hướng quay lại hoặc sang route khác
  const { state } = useLocation(); // đọc state được push từ trang trước

  // Dữ liệu phiên sạc truyền qua route (có thể null nếu vào sai luồng)
  const chargingData = state?.chargingData || null; // optional chaining an toàn
  // reservationId lưu trong localStorage để kết hợp thanh toán (nếu có đặt lịch trước)
  const reservationId = localStorage.getItem("reservationId");

  const [isPaying, setIsPaying] = useState(false); // true khi đang gọi API tạo paymentUrl

  useEffect(() => {
    window.scrollTo(0, 0); // đảm bảo người dùng thấy header thay vì giữa trang
  }, []);

  // Guard: không có dữ liệu phiên sạc -> báo lỗi + nút quay lại
  if (!chargingData) {
    return (
      <div className="payment-page">
        <div className="error-container">
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#e74c3c" strokeWidth="2" fill="#ffe6e6" />
              <path d="M15 9l-6 6M9 9l6 6" stroke="#e74c3c" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <h1>Không tìm thấy dữ liệu</h1>
          <p>
            Không tìm thấy dữ liệu phiên sạc. Vui lòng quay lại trang trước.
          </p>
          <button className="back-btn" onClick={() => navigate(-1)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Giá điện mỗi kWh (fallback 3858 nếu BE không trả) & tổng tiền phiên sạc
  const pricePerKwh = chargingData.chargingInfo?.energyPricePerKwh || 3858;
  const totalAmount = chargingData.chargingInfo?.totalCost || 0; // 0 để tránh NaN

  const handleSandboxPay = async () => {
    setIsPaying(true); // khóa nút tránh click lặp

    try {
      // Lấy vehicleId (có thể là id hoặc vehicleId tuỳ backend)
      const vehicleId = chargingData.vehicleInfo?.id || chargingData.vehicleInfo?.vehicleId;

      if (!vehicleId) { // không có id xe -> không tạo thanh toán được
        throw new Error("Không tìm thấy thông tin xe");
      }

      console.log('💳 Creating VNPay payment URL for vehicle:', vehicleId);
      console.log('💳 Total Amount:', totalAmount);
      console.log('💳 Reservation ID:', reservationId);

      // API tạo paymentUrl (VNPay): truyền vehicleId + locale
      const response = await api.post("/vnpay/checkout-url", {
        vehicleId: vehicleId,
        locale: "vn",
        orderType: "other" // loại đơn hàng (tùy BE)
      });

      console.log('💳 VNPay Response:', response.data);

      if (response.data?.success && response.data?.data?.paymentUrl) { // thành công -> có URL
        const pricingDetails = response.data.data.pricingDetails; // chi tiết giá (nếu có)

        console.log('💳 Pricing Details:', pricingDetails);
        console.log('  - Total Sessions:', pricingDetails?.totalSessions);
        console.log('  - Total Minutes:', pricingDetails?.totalMinutes);
        console.log('  - Total Cost:', pricingDetails?.total);

        // Lưu thông tin phục vụ xác thực ở paymentSuccessPage
        // Lưu vehicleId vào localStorage với key 'paymentVehicleId'.
        //  - Mục đích: Trang payment success (sau khi VNPay redirect) có thể đọc lại để đối chiếu
        //    với thông tin giao dịch và xác nhận đúng xe đã sạc.
        //  - Vì redirect sang domain VNPay khiến state React bị reset, nên ta dùng localStorage (persist qua reload).
        //  - Lưu plaintext, không nhạy cảm (chỉ id xe). Nếu cần bảo mật hơn có thể mã hoá hoặc dùng sessionStorage.
        localStorage.setItem('paymentVehicleId', vehicleId);
        // Nếu có reservationId (người dùng đã đặt lịch trước khi sạc):
        //  - Lưu thêm key 'paymentReservationId' để trang payment success kiểm tra và mark reservation là đã thanh toán.
        //  - Điều kiện if để tránh ghi giá trị undefined/null gây rác dữ liệu.
        //  - Sau khi xử lý thành công ở payment success có thể xoá bằng localStorage.removeItem('paymentReservationId').
        if (reservationId) localStorage.setItem('paymentReservationId', reservationId);
        // Redirect sang VNPay (thoát SPA)
        window.location.href = response.data.data.paymentUrl;
        return;
      } else {
        throw new Error("Không thể tạo URL thanh toán");
      }
    } catch (error) {
      console.error("Payment error:", error);
      console.error("Error details:", error.response?.data);
      setIsPaying(false);

      const errorMessage = error.response?.data?.message || error.message || "Có lỗi xảy ra khi xử lý thanh toán"; // chọn thông điệp phù hợp
      alert(errorMessage + "\n\nVui lòng thử lại!"); // thông báo người dùng thử lại
    }
  };

  return (
    <div className="payment-page"> {/* Wrapper toàn trang */}
      <div className="payment-header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate(-1)}>{/* Nút quay lại dùng navigate(-1) để trở về trang trước trong history */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Icon mũi tên quay lại */}
            </svg>
            Quay lại
          </button>
          <h1 className="page-title">{/* Tiêu đề chính của trang thanh toán phiên sạc */}
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />{/* Hình dạng thẻ thanh toán */}
              <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />{/* Đường kẻ phân chia trên icon thẻ */}
            </svg>
            Thanh toán phiên sạc
          </h1>
          <p className="page-subtitle">Hoàn tất thanh toán để kết thúc phiên sạc của bạn</p>{/* Phụ đề hướng dẫn hành động */}
        </div>
      </div>

      <div className="payment-container"> {/* Grid chứa 2 cột */}
        {/* LEFT - Charging Session Details */}
        <div className="left-section"> {/* Cột trái: hiển thị thông tin nhận diện xe và thống kê phiên sạc */}
          <div className="info-card vehicle-card">
            <div className="card-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 17H4a2 2 0 01-2-2V5a2 2 0 012-2h16a2 2 0 012 2v10a2 2 0 01-2 2h-1" stroke="currentColor" strokeWidth="2" />{/* Khung tổng thể biểu tượng xe */}
                  <path d="M7 17l-2 4m10-4l2 4m-10 0h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />{/* Chi tiết phần bánh / chân đế */}
                </svg>
              </div>
              <h3>Thông tin xe</h3>
            </div>
            <div className="card-body">
              <div className="vehicle-display">
                <div className="vehicle-icon-large">🚗</div>{/* Emoji xe đại diện hình ảnh mẫu */}
                <div className="vehicle-details">{/* Khối chứa biển số và model hãng xe */}
                  <div className="plate-number">{chargingData.vehicleInfo?.plateNumber || "—"}</div>{/* Biển số - fallback "—" nếu thiếu */}
                  <div className="vehicle-model">{chargingData.vehicleInfo?.make} {chargingData.vehicleInfo?.model}</div>{/* Hãng + Model xe */}
                </div>
              </div>
            </div>
          </div>

          <div className="info-card session-card">
            <div className="card-header">
              <div className="header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3>Thông tin phiên sạc</h3>
            </div>
            <div className="card-body">
              <div className="info-grid">{/* Lưới 4 ô thông tin trạng thái phiên sạc */}
                <div className="info-item">
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />{/* Vòng tròn đồng hồ */}
                      <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />{/* Kim giờ-phút mô phỏng */}
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Bắt đầu lúc</span>
                    <span className="info-value">
                      {chargingData.chargingInfo?.startTime
                        ? new Date(chargingData.chargingInfo.startTime).toLocaleString("vi-VN") // Format thời gian bắt đầu theo locale tiếng Việt
                        : "—"}
                    </span>
                  </div>
                </div>

                <div className="info-item">{/* Thời gian sạc đã trôi qua */}
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />{/* Đồng hồ biểu tượng thời lượng */}
                      <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />{/* Kim chỉ thời gian sử dụng */}
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Thời gian sạc</span>
                    <span className="info-value">{chargingData.chargingInfo?.timeElapsed || 0} phút</span>{/* Fallback 0 nếu chưa có thời gian */}
                  </div>
                </div>

                <div className="info-item">{/* Mức phần trăm pin hiện tại */}
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="2" width="14" height="20" rx="2" stroke="currentColor" strokeWidth="2" />{/* Thân icon pin */}
                      <path d="M9 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />{/* Gạch mô phỏng mức nạp */}
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Mức sạc hiện tại</span>
                    <span className="info-value highlight">{chargingData.chargingInfo?.currentCharge || 0}%</span>{/* Hiển thị % pin, highlight để nhấn mạnh */}
                  </div>
                </div>

                <div className="info-item">{/* Tổng năng lượng đã tiêu thụ kWh */}
                  <div className="info-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Icon tia sét (năng lượng) */}
                    </svg>
                  </div>
                  <div className="info-content">
                    <span className="info-label">Năng lượng tiêu thụ</span>
                    <span className="info-value">{chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh</span>{/* toFixed(2) làm tròn 2 chữ số thập phân */}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT - Payment Summary */}
        <div className="right-section"> {/* Cột phải: breakdown + thanh toán */}
          <div className="payment-summary-card">
            <div className="summary-header">
              <h3>Tổng quan thanh toán</h3>{/* Tiêu đề card tổng quan phí */}
              <span className="secure-badge">{/* Badge bảo mật hiển thị cam kết an toàn */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2" />{/* Thân hình ổ khoá */}
                  <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />{/* Phần vòng khoá */}
                </svg>
                An toàn & Bảo mật
              </span>
            </div>

            <div className="breakdown-section">
              <div className="breakdown-item">{/* Khoản phí đặt lịch nếu người dùng có đặt trước */}
                <div className="item-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Dấu tick biểu thị xác nhận */}
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Khung biểu tượng tài liệu */}
                  </svg>
                  <span>Phí đặt lịch</span>
                </div>
                <span className="item-value">
                  {chargingData.chargingInfo?.bookingCost?.toLocaleString("vi-VN") || 0} VNĐ{/* Hiển thị phí đặt lịch format locale, fallback 0 */}
                </span>
              </div>

              <div className="breakdown-item">{/* Khoản phí điện tiêu thụ dựa trên kWh */}
                <div className="item-label">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Icon tia sét tượng trưng điện năng */}
                  </svg>
                  <span>Phí điện</span>
                  <span className="sub-label">({chargingData.chargingInfo?.energyKwh?.toFixed(2) || 0} kWh × {pricePerKwh.toLocaleString("vi-VN")} VNĐ)</span>{/* Công thức tính phí điện hiển thị minh bạch */}
                </div>
                <span className="item-value">
                  {chargingData.chargingInfo?.energyCost?.toLocaleString("vi-VN") || 0} VNĐ{/* Phí điện đã tính (format) */}
                </span>
              </div>

              <div className="divider"></div>{/* Đường phân chia giữa chi tiết và tổng */}

              <div className="total-amount-section">
                <div className="total-label">Tổng thanh toán</div>{/* Nhãn tổng tiền */}
                <div className="total-value">{totalAmount.toLocaleString("vi-VN")} <span className="currency">VNĐ</span></div>{/* Giá trị tổng cuối cùng */}
              </div>
            </div>

            <div className="payment-method-section">
              <div className="method-header">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2" />{/* Thân thẻ ngân hàng */}
                  <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />{/* Đường kẻ chia mặt thẻ */}
                </svg>
                <span>Phương thức thanh toán</span>
              </div>
              <div className="vnpay-badge">{/* Badge mô tả VNPay là cổng thanh toán lựa chọn */}
                <div className="vnpay-logo">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiByeD0iOCIgZmlsbD0iIzAwNTFBNSIvPgo8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmb250LXdlaWdodD0iYm9sZCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5WTjwvdGV4dD4KPC9zdmc+" alt="VNPay" />{/* Logo VNPay base64 để không cần request tĩnh */}
                </div>
                <div className="vnpay-info">
                  <div className="vnpay-name">VNPay</div>{/* Tên cổng */}
                  <div className="vnpay-desc">Thanh toán qua cổng VNPay</div>{/* Mô tả phương thức */}
                </div>
              </div>
            </div>

            <button
              className="pay-button" // Class định dạng nút chính thanh toán
              disabled={isPaying} // Khi true: vô hiệu hoá tránh double submit
              onClick={handleSandboxPay} // Handler tạo paymentUrl và redirect
            >
              {isPaying ? (
                <>
                  <div className="spinner"></div>{/* Hiệu ứng loading vòng tròn */}
                  <span>Đang xử lý...</span>{/* Thông điệp trạng thái tiến trình */}
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />{/* Icon minh hoạ tiền / thanh toán */}
                  </svg>
                  <span>Thanh toán {totalAmount.toLocaleString("vi-VN")} VNĐ</span>{/* Text nút kèm tổng tiền format locale */}
                </>
              )}
            </button>

            <div className="payment-note"> {/* Ghi chú người dùng sẽ chuyển trang VNPay */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              <p>Bạn sẽ được chuyển đến trang thanh toán VNPay để hoàn tất giao dịch</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
