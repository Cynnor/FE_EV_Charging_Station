// Trang PaymentSuccessPage: xử lý quay về từ VNPay (return URL) cho 2 luồng:
// 1) Thanh toán Subscription (membership) -> kích hoạt / ghi nhận trạng thái gói
// 2) Thanh toán phiên sạc (charging session) -> cập nhật phiên, slot, reservation nếu có
// Các bước tổng quát:
//  - Parse query string VNPay (window.location.search)
//  - Tách các tham số vnp_* và build chuỗi signData (nếu cần verify chữ ký phía BE)
//  - Phân biệt thanh toán subscription bằng pendingSubscriptionId lưu trước đó
//  - Gọi endpoint kiểm tra trạng thái tương ứng (/subscriptions/check-payment-status hoặc /vnpay/check-payment-status)
//  - Cập nhật UI: success / failed / cancelled
//  - Dọn dẹp localStorage (pendingSubscriptionId, paymentVehicleId, paymentReservationId) để tránh leak trạng thái cho lần sau
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

// Helper: lấy raw query string (bỏ dấu ? đầu nếu có), trả về chuỗi rỗng nếu không có
const getRawVnpQueryString = (search) => {
  if (!search) return ""; // không có gì => trả rỗng
  return search.startsWith("?") ? search.slice(1) : search; // cắt bỏ ký tự ? ở đầu
};

// Helper: parse các cặp key=value trong raw query thành object
// Giữ nguyên value (không decode để BE tự xử lý nếu cần) chỉ decode key an toàn
const parseVnpParams = (rawQueryString) => {
  const params = {}; // object kết quả
  if (!rawQueryString) return params; // rỗng => trả object rỗng

  rawQueryString.split("&").forEach((segment) => { // tách theo &
    if (!segment) return; // skip đoạn rỗng
    const equalsIndex = segment.indexOf("="); // tìm vị trí dấu =
    const rawKey = equalsIndex >= 0 ? segment.slice(0, equalsIndex) : segment; // lấy key
    if (!rawKey) return; // bỏ qua nếu key rỗng
    const rawValue = equalsIndex >= 0 ? segment.slice(equalsIndex + 1) : ""; // phần còn lại làm value

    let decodedKey = rawKey; // thử decode key để tránh %xx
    try {
      decodedKey = decodeURIComponent(rawKey);
    } catch {
      // Giữ nguyên nếu decode lỗi
    }

    params[decodedKey] = rawValue ?? ""; // gán vào object kết quả
  });

  return params; // trả về object các param
};

// Helper: xây dựng chuỗi signData theo chuẩn VNPay (lọc các key vnp_, loại bỏ SecureHash / SecureHashType)
// Dùng để BE verify chữ ký nếu cần (FE chỉ chuẩn bị chuỗi, không hash)
const buildVnpSignData = (params) => {
  return Object.keys(params)
    .filter(
      (key) =>
        key.startsWith("vnp_") && // chỉ lấy param bắt đầu vnp_
        key !== "vnp_SecureHash" && // loại trừ hash do VNPay gửi
        key !== "vnp_SecureHashType" // loại trừ kiểu hash
    )
    .sort() // sắp xếp alpha theo yêu cầu quy trình ký
    .map((key) => `${key}=${params[key] ?? ""}`) // nối key=value
    .join("&"); // ghép lại thành chuỗi signData
};

export default function PaymentSuccessPage() { // Component chính xử lý kết quả thanh toán
  const navigate = useNavigate(); // hook điều hướng
  const { state } = useLocation(); // lấy state fallback từ route trước (payment page)
  const [paymentInfo, setPaymentInfo] = useState(null); // chi tiết thanh toán (subscription hoặc charging)
  const [isLoading, setIsLoading] = useState(true); // cờ hiển thị spinner trong lúc kiểm tra trạng thái
  const [paymentStatus, setPaymentStatus] = useState("processing"); // trạng thái hiện tại: processing | success | error | cancelled

  useEffect(() => { // chạy 1 lần khi mount trang
    window.scrollTo(0, 0); // cuộn lên đầu trang để tránh vị trí scroll cũ
    handlePaymentReturn(); // bắt đầu quá trình xử lý truy vấn VNPay / fallback
  }, []); // dependency rỗng => chỉ chạy 1 lần

  const handlePaymentReturn = async () => { // hàm chính xử lý chuỗi VNPay & kích hoạt trạng thái
    try {
      setIsLoading(true); // bật loading spinner

      const rawQueryString = getRawVnpQueryString(window.location.search || ""); // lấy phần sau dấu ?
      const vnpParams = parseVnpParams(rawQueryString); // parse thành object key/value
      const vnpSignData = buildVnpSignData(vnpParams); // build chuỗi signData phục vụ BE verify

      // Nếu VNPay có trả về mã phản hồi thì đang ở return URL chính thức
      if (vnpParams.vnp_ResponseCode) {
        const subscriptionIdFromUrl = vnpParams.vnp_TxnRef; // VNPay truyền vnp_TxnRef = transaction reference (subscriptionId lúc tạo)
        const pendingSubscriptionId = localStorage.getItem("pendingSubscriptionId"); // id gói pending lưu trước redirect
        const isSubscriptionPayment = Boolean(
          pendingSubscriptionId &&
          subscriptionIdFromUrl &&
          pendingSubscriptionId === subscriptionIdFromUrl
        ); // xác định luồng subscription

        let subscriptionHandled = false; // cờ đánh dấu đã xử lý xong luồng subscription

        // --------- LUỒNG SUBSCRIPTION (membership) ---------
        if (isSubscriptionPayment && pendingSubscriptionId) { // chỉ xử lý nếu khớp id pending
          const subscriptionId = pendingSubscriptionId; // đồng bộ tên biến
          try {
            // Gửi toàn bộ các tham số cần thiết để BE xác minh chữ ký / trạng thái
            const response = await api.post("/subscriptions/check-payment-status", {
              subscriptionId: subscriptionId,
              vnp_Amount: vnpParams.vnp_Amount,
              vnp_BankCode: vnpParams.vnp_BankCode,
              vnp_BankTranNo: vnpParams.vnp_BankTranNo,
              vnp_CardType: vnpParams.vnp_CardType,
              vnp_OrderInfo: vnpParams.vnp_OrderInfo,
              vnp_PayDate: vnpParams.vnp_PayDate,
              vnp_ResponseCode: vnpParams.vnp_ResponseCode,
              vnp_TmnCode: vnpParams.vnp_TmnCode,
              vnp_TransactionNo: vnpParams.vnp_TransactionNo,
              vnp_TransactionStatus: vnpParams.vnp_TransactionStatus,
              vnp_TxnRef: vnpParams.vnp_TxnRef,
              vnp_SecureHash: vnpParams.vnp_SecureHash,
            });

            if (response.data?.success) { // BE xác thực thành công
              const paymentData = response.data.data || response.data; // lấy payload chính
              const status = paymentData.paymentStatus || response.data.paymentStatus || (vnpParams.vnp_ResponseCode === "00" ? "success" : "failed"); // chuẩn hoá status

              setPaymentStatus(status); // cập nhật trạng thái UI

              if (status === "success") { // thành công -> lấy thông tin subscription để hiển thị
                const subscriptionInfo = paymentData.subscription || paymentData.subscriptionData || paymentData; // tìm object chứa chi tiết gói
                setPaymentInfo({
                  subscriptionId: subscriptionId,
                  amount: parseInt(vnpParams.vnp_Amount) / 100, // VNPay amount *100 -> chia lại
                  orderInfo: decodeURIComponent(vnpParams.vnp_OrderInfo || ""), // thông tin đơn hàng mô tả
                  transactionNo: vnpParams.vnp_TransactionNo, // mã giao dịch VNPay
                  bankCode: vnpParams.vnp_BankCode, // mã ngân hàng
                  cardType: vnpParams.vnp_CardType, // loại thẻ
                  payDate: vnpParams.vnp_PayDate, // thời gian thanh toán (format chuỗi)
                  paymentMethod: "vnpay", // phương thức
                  isSubscription: true, // đánh dấu luồng subscription
                  subscriptionInfo: subscriptionInfo, // chi tiết gói trả về
                });
                localStorage.removeItem("pendingSubscriptionId"); // cleanup id pending để tránh reuse
                subscriptionHandled = true; // đánh dấu đã xử lý subscription
              } else if (status === "failed") { // thất bại
                setPaymentStatus("error");
                localStorage.removeItem("pendingSubscriptionId"); // dọn dẹp
                subscriptionHandled = true;
              } else if (status === "cancelled") { // bị hủy
                setPaymentStatus("cancelled");
                localStorage.removeItem("pendingSubscriptionId");
                subscriptionHandled = true;
              }
            }
          } catch (subError) {
            // Lỗi kiểm tra subscription: tiếp tục fallback sang luồng session nếu có
          }
        } else if (pendingSubscriptionId && !isSubscriptionPayment) {
          // Có id pending nhưng không khớp TxnRef => stale -> xóa
          localStorage.removeItem("pendingSubscriptionId");
        }

        // --------- LUỒNG CHARGING SESSION (nếu subscription không xử lý) ---------
        if (!subscriptionHandled) {
          const vehicleId = localStorage.getItem('paymentVehicleId'); // id xe lưu trước redirect
          const reservationId = localStorage.getItem('paymentReservationId'); // id đặt chỗ (nếu có)

          if (vehicleId) { // chỉ xử lý nếu có vehicleId (đánh dấu luồng phiên sạc)
            const requestBody = { // payload gửi BE kiểm tra thanh toán phiên sạc
              vehicleId: vehicleId,
              ...(reservationId && { reservationId: reservationId }), // chỉ thêm reservationId nếu tồn tại
              vnp_Amount: vnpParams.vnp_Amount,
              vnp_BankCode: vnpParams.vnp_BankCode,
              vnp_BankTranNo: vnpParams.vnp_BankTranNo,
              vnp_CardType: vnpParams.vnp_CardType,
              vnp_OrderInfo: vnpParams.vnp_OrderInfo,
              vnp_PayDate: vnpParams.vnp_PayDate,
              vnp_ResponseCode: vnpParams.vnp_ResponseCode,
              vnp_TmnCode: vnpParams.vnp_TmnCode,
              vnp_TransactionNo: vnpParams.vnp_TransactionNo,
              vnp_TransactionStatus: vnpParams.vnp_TransactionStatus,
              vnp_TxnRef: vnpParams.vnp_TxnRef,
              vnp_SecureHash: vnpParams.vnp_SecureHash,
            };

            const response = await api.post("/vnpay/check-payment-status", requestBody); // gọi BE kiểm tra chữ ký & cập nhật phiên

            if (response.data?.success) { // BE xác thực thành công
              const paymentData = response.data.data; // chi tiết trả về
              const status = paymentData.paymentStatus || response.data.paymentStatus; // chuẩn hoá
              setPaymentStatus(status); // cập nhật UI

              if (status === "success") { // thành công
                localStorage.removeItem('paymentVehicleId'); // dọn id xe
                localStorage.removeItem('paymentReservationId'); // dọn id reservation
                setPaymentInfo({ // lưu thông tin chi tiết để render
                  vehicleId: vehicleId,
                  reservationId: paymentData.reservationId || reservationId,
                  reservationUpdated: paymentData.reservationUpdated || false, // đánh dấu BE có cập nhật reservation
                  amount: paymentData.amount || parseInt(vnpParams.vnp_Amount) / 100,
                  orderInfo: decodeURIComponent(vnpParams.vnp_OrderInfo || "Thanh toán phiên sạc"),
                  transactionNo: paymentData.transactionId || vnpParams.vnp_TransactionNo,
                  bankCode: vnpParams.vnp_BankCode,
                  cardType: vnpParams.vnp_CardType,
                  payDate: vnpParams.vnp_PayDate,
                  paymentMethod: "vnpay",
                  isChargingSession: true, // đánh dấu luồng phiên sạc
                  updatedSessions: paymentData.updatedSessions || 0,
                  updatedSlots: paymentData.updatedSlots || 0,
                  sessionIds: paymentData.sessionIds || [],
                  slotIds: paymentData.slotIds || [],
                });
              } else if (status === "failed") { // thất bại phiên sạc
                localStorage.removeItem('paymentVehicleId');
                localStorage.removeItem('paymentReservationId');
                setPaymentStatus("error");
              } else if (status === "cancelled") { // hủy phiên sạc
                localStorage.removeItem('paymentVehicleId');
                localStorage.removeItem('paymentReservationId');
                setPaymentStatus("cancelled");
              }
            } else { // BE trả không success => coi như lỗi
              localStorage.removeItem('paymentVehicleId');
              localStorage.removeItem('paymentReservationId');
              setPaymentStatus("error");
            }
          } else { // Không có vehicleId => không xác định được luồng -> báo lỗi
            setPaymentStatus("error");
          }
        }
      } else if (state?.reservationId) { // Fallback: một số route truyền state trực tiếp (không qua VNPay)
        setPaymentInfo({ // lấy dữ liệu từ state để hiển thị
          reservationId: state.reservationId,
          amount: state.amount,
          orderInfo: state.orderInfo,
          vehicleInfo: state.vehicleInfo,
          chargingInfo: state.chargingInfo,
          paymentMethod: state.paymentMethod,
        });
        setPaymentStatus("success"); // coi như thành công
      }
    } catch (error) {
      setPaymentStatus("error"); // bất kỳ lỗi nào -> chuyển error
    } finally {
      setIsLoading(false); // tắt loading dù thành công hay lỗi
    }
  };

  const handleGoToProfile = () => { // điều hướng sang trang hồ sơ để xem đặt lịch / gói
    navigate("/profile");
  };

  const handleGoToHome = () => { // quay về trang chủ
    navigate("/");
  };

  const handleGoToMembership = () => { // mở trang membership để xem / mua gói
    navigate("/membership");
  };

  const formatPayDate = (payDate) => { // chuyển chuỗi thời gian VNPay (YYYYMMDDHHmmss) thành định dạng locale vi-VN
    if (!payDate) return new Date().toLocaleString("vi-VN"); // fallback: thời gian hiện tại
    const year = payDate.substring(0, 4);
    const month = payDate.substring(4, 6);
    const day = payDate.substring(6, 8);
    const hour = payDate.substring(8, 10);
    const minute = payDate.substring(10, 12);
    const second = payDate.substring(12, 14);
    return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}`).toLocaleString("vi-VN"); // tạo Date ISO rồi format locale
  };

  if (isLoading) { // giao diện khi đang xử lý xác thực thanh toán
    return (
      <div className="payment-success-page">
        <div className="success-container">
          <div className="loading-animation">
            <div className="spinner"></div>
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
          <h1>Đang xử lý thanh toán...</h1>
          <p>Vui lòng đợi trong giây lát</p>
        </div>
      </div>
    );
  }

  // Xử lý 3 trạng thái: error (failed), cancelled, và success
  if (paymentStatus === "error") { // trạng thái lỗi (thanh toán thất bại)
    return (
      <div className="payment-success-page">
        <div className="success-container error-container">
          <div className="error-icon">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#e74c3c"
                strokeWidth="2"
                fill="#ffe6e6"
              />
              <path
                d="M15 9l-6 6M9 9l6 6"
                stroke="#e74c3c"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="error-title">Thanh toán thất bại</h1>
          <p className="error-message">
            Có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
          </p>
          <div className="action-buttons">
            <button className="retry-btn" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 4v6h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Thử lại
            </button>
            <button className="home-btn" onClick={handleGoToHome}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="9,22 9,12 15,12 15,22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Trạng thái cancelled (hủy thanh toán)
  if (paymentStatus === "cancelled") { // trạng thái bị hủy bởi người dùng / VNPay
    return (
      <div className="payment-success-page">
        <div className="success-container cancelled-container">
          <div className="cancelled-icon">
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#f39c12"
                strokeWidth="2"
                fill="#fff3cd"
              />
              <path
                d="M12 8v4M12 16h.01"
                stroke="#f39c12"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <h1 className="cancelled-title">Đã hủy thanh toán</h1>
          <p className="cancelled-message">
            Bạn đã hủy quá trình thanh toán. Nếu bạn muốn tiếp tục, vui lòng thử
            lại.
          </p>
          <div className="action-buttons">
            <button className="retry-btn" onClick={() => navigate(-1)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M1 4v6h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Thử lại
            </button>
            <button className="home-btn" onClick={handleGoToHome}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <polyline
                  points="9,22 9,12 15,12 15,22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Về trang chủ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return ( // trạng thái success
    <div className="payment-success-page">
      <div className="success-container">
        {/* Khối animation thành công: vòng tròn + checkmark + confetti trang trí */}
        <div className="success-animation">
          <div className="checkmark">
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="#4CAF50"
                strokeWidth="2"
                fill="#e8f5e8"
              />
              <path
                d="M9 12l2 2 4-4"
                stroke="#4CAF50"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="confetti">
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
            <div className="confetti-piece"></div>
          </div>
        </div>

        {/* Nội dung thành công: tiêu đề + mô tả tuỳ theo loại thanh toán */}
        <div className="success-content">
          <h1 className="success-title">
            {paymentInfo?.isSubscription
              ? "Đăng ký gói thành công!"
              : paymentInfo?.isChargingSession
                ? "Thanh toán phiên sạc thành công!"
                : "Thanh toán thành công!"}
          </h1>
          <p className="success-message">
            {paymentInfo?.isSubscription
              ? "Gói đăng ký của bạn đã được kích hoạt tự động. Bạn có thể bắt đầu sử dụng ngay!"
              : paymentInfo?.isChargingSession
                ? "Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện của chúng tôi."
                : "Cảm ơn bạn đã sử dụng dịch vụ sạc xe điện của chúng tôi."}
          </p>

          {paymentInfo && ( // chỉ render card chi tiết nếu đã có paymentInfo
            <div className="payment-details-card">
              <div className="card-header">
                <h3>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect
                      x="2"
                      y="3"
                      width="20"
                      height="14"
                      rx="2"
                      ry="2"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="8"
                      y1="21"
                      x2="16"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <line
                      x1="12"
                      y1="17"
                      x2="12"
                      y2="21"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                  </svg>
                  {paymentInfo.isSubscription
                    ? "Chi tiết đăng ký gói"
                    : paymentInfo.isChargingSession
                      ? "Chi tiết thanh toán phiên sạc"
                      : "Chi tiết giao dịch"}
                </h3>
              </div>

              <div className="details-grid">
                {paymentInfo.isChargingSession ? ( // nhánh chi tiết phiên sạc
                  <>
                    <div className="detail-item">
                      <span className="label">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Mã xe
                      </span>
                      <span className="value">
                        #{paymentInfo.vehicleId?.slice(-8) || "N/A"}
                      </span>
                    </div>
                    {paymentInfo.reservationId && (
                      <div className="detail-item">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <rect
                              x="2"
                              y="3"
                              width="20"
                              height="14"
                              rx="2"
                              ry="2"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                          </svg>
                          Mã đặt chỗ
                        </span>
                        <span className="value">
                          #{paymentInfo.reservationId?.slice(-8) || "N/A"}
                          {paymentInfo.reservationUpdated && (
                            <span style={{
                              marginLeft: '8px',
                              color: '#16a34a',
                              fontSize: '12px',
                              fontWeight: '600'
                            }}>
                              ✓ Đã cập nhật
                            </span>
                          )}
                        </span>
                      </div>
                    )}
                    {paymentInfo.amount && (
                      <div className="detail-item highlight">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <line
                              x1="12"
                              y1="1"
                              x2="12"
                              y2="23"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Số tiền
                        </span>
                        <span className="value amount">
                          {paymentInfo.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    )}
                  </>
                ) : paymentInfo.isSubscription ? ( // nhánh chi tiết subscription
                  <>
                    <div className="detail-item">
                      <span className="label">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 2L2 7l10 5 10-5-10-5z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M2 17l10 5 10-5M2 12l10 5 10-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Mã subscription
                      </span>
                      <span className="value">
                        #{paymentInfo.subscriptionId?.slice(-8) || "N/A"}
                      </span>
                    </div>
                    {paymentInfo.subscriptionInfo?.plan?.name && (
                      <div className="detail-item">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 2L2 7l10 5 10-5-10-5z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Tên gói
                        </span>
                        <span className="value">
                          {paymentInfo.subscriptionInfo.plan.name}
                        </span>
                      </div>
                    )}
                    {paymentInfo.subscriptionInfo?.plan?.type && (
                      <div className="detail-item">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <path
                              d="M12 2L2 7l10 5 10-5-10-5z"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Loại gói
                        </span>
                        <span className="value">
                          {paymentInfo.subscriptionInfo.plan.type.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {paymentInfo.amount && (
                      <div className="detail-item highlight">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <line
                              x1="12"
                              y1="1"
                              x2="12"
                              y2="23"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Số tiền
                        </span>
                        <span className="value amount">
                          {paymentInfo.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    )}
                  </>
                ) : ( // nhánh generic nếu không xác định loại
                  <>
                    {paymentInfo.amount && (
                      <div className="detail-item highlight">
                        <span className="label">
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <line
                              x1="12"
                              y1="1"
                              x2="12"
                              y2="23"
                              stroke="currentColor"
                              strokeWidth="2"
                            />
                            <path
                              d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          Số tiền
                        </span>
                        <span className="value amount">
                          {paymentInfo.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </div>
                    )}
                  </>
                )}

                {paymentInfo.transactionNo && ( // mã giao dịch VNPay nếu có
                  <div className="detail-item">
                    <span className="label">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <line
                          x1="8"
                          y1="21"
                          x2="16"
                          y2="21"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Mã giao dịch
                    </span>
                    <span className="value">{paymentInfo.transactionNo}</span>
                  </div>
                )}

                {paymentInfo.bankCode && ( // mã ngân hàng thanh toán
                  <div className="detail-item">
                    <span className="label">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <rect
                          x="2"
                          y="3"
                          width="20"
                          height="14"
                          rx="2"
                          ry="2"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                      Ngân hàng
                    </span>
                    <span className="value">{paymentInfo.bankCode}</span>
                  </div>
                )}

                <div className="detail-item"> {/* thời gian giao dịch (format lại) */}
                  <span className="label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                      <polyline
                        points="12,6 12,12 16,14"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Thời gian
                  </span>
                  <span className="value">
                    {formatPayDate(paymentInfo.payDate)}
                  </span>
                </div>

                {!paymentInfo.isSubscription && paymentInfo.vehicleInfo && ( // thông tin xe (chỉ trong phiên sạc)
                  <div className="detail-item">
                    <span className="label">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M5 17H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-1"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <polygon
                          points="5,17 5,21 1,21 1,17"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Xe
                    </span>
                    <span className="value">
                      {paymentInfo.vehicleInfo.plateNumber}
                    </span>
                  </div>
                )}

                {!paymentInfo.isSubscription && paymentInfo.chargingInfo && ( // thông tin mức sạc + thời gian sạc
                  <>
                    <div className="detail-item">
                      <span className="label">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <rect
                            x="2"
                            y="3"
                            width="20"
                            height="14"
                            rx="2"
                            ry="2"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <line
                            x1="8"
                            y1="21"
                            x2="16"
                            y2="21"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                        </svg>
                        Mức sạc
                      </span>
                      <span className="value">
                        {paymentInfo.chargingInfo.currentCharge}%
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="label">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <circle
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="2"
                          />
                          <polyline
                            points="12,6 12,12 16,14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        Thời gian sạc
                      </span>
                      <span className="value">
                        {paymentInfo.chargingInfo.timeElapsed} phút
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Nhóm nút hành động cuối trang tuỳ theo loại thanh toán */}
          <div className="action-buttons">
            {paymentInfo?.isSubscription ? (
              <>
                <button className="primary-btn" onClick={handleGoToMembership}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Xem gói đăng ký
                </button>
                <button className="secondary-btn" onClick={handleGoToHome}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="9,22 9,12 15,12 15,22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Về trang chủ
                </button>
              </>
            ) : (
              <>
                <button className="primary-btn" onClick={handleGoToProfile}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle
                      cx="12"
                      cy="7"
                      r="4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Xem lịch đặt
                </button>
                <button className="secondary-btn" onClick={handleGoToHome}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <polyline
                      points="9,22 9,12 15,12 15,22"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Về trang chủ
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
