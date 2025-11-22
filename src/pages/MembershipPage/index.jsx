// Trang MembershipPage: cho phép người dùng xem các gói subscription (basic/standard/premium),
// chọn thời hạn (1 / 6 / 12 tháng), thanh toán qua VNPay và xem gói hiện tại.
// Các phần chính:
//  - Tải danh sách gói và gói hiện tại
//  - Gom gói theo type + duration để render dạng thẻ
//  - Xử lý luồng thanh toán: tạo subscription pending -> nhận paymentUrl -> redirect VNPay
//  - Nâng cấp gói (upgrade) nếu hiện có subscription
//  - Hiển thị modal xác nhận trước khi chuyển hướng
import { useEffect, useState } from "react";
import {
  FaBatteryFull,
  FaCheckCircle,
  FaBolt,
  FaCrown,
  FaShieldAlt,
  FaMapMarkerAlt,
  FaCreditCard,
  FaLeaf,
  FaHeadset,
  FaArrowRight,
  FaStar,
  FaTimes,
} from "react-icons/fa"; // import bộ icon sử dụng trong UI
import { useNavigate } from "react-router-dom"; // hook điều hướng giữa các route
import api from "../../config/api"; // axios instance cấu hình sẵn baseURL + interceptor
import "./index.scss"; // stylesheet scoped cho trang MembershipPage

function MembershipPage() { // Component chính xuất ra trang membership
  const navigate = useNavigate(); // hàm navigate dùng chuyển route (profile, v.v.)

  // ================== STATE CHÍNH ==================
  // Danh sách toàn bộ gói đăng ký lấy từ BE
  const [subscriptionPlans, setSubscriptionPlans] = useState([]); // lưu toàn bộ danh sách gói lấy từ API
  // Gói hiện tại (nếu user đã đăng ký) – backend trả về current-active
  const [currentSubscription, setCurrentSubscription] = useState(null); // thông tin subscription hiện tại (nếu có)
  // Loading khi đang fetch dữ liệu gói / subscription
  const [isLoading, setIsLoading] = useState(true); // cờ loading trong lúc fetch dữ liệu
  // Thông báo lỗi (chuỗi) hiển thị UI error state
  const [error, setError] = useState(null); // chứa thông điệp lỗi hiển thị ra UI
  // Gói được chọn để thanh toán hoặc upgrade
  const [selectedPlan, setSelectedPlan] = useState(null); // plan user vừa chọn để thanh toán / upgrade
  // Điều khiển hiển thị modal xác nhận trước khi redirect VNPay
  const [showPaymentModal, setShowPaymentModal] = useState(false); // điều khiển hiện / ẩn modal xác nhận thanh toán

  // Gom gói theo type (basic/standard/premium) và duration để truy xuất nhanh
  const [groupedPlans, setGroupedPlans] = useState({}); // object gom các plan theo type -> duration -> plan
  const [selectedDurations, setSelectedDurations] = useState({
    basic: "1_month", // thời hạn đang chọn cho gói basic
    standard: "1_month", // thời hạn đang chọn cho gói standard
    premium: "1_month", // thời hạn đang chọn cho gói premium
  }); // cho phép mỗi type chọn duration độc lập

  useEffect(() => { // side-effect chạy một lần khi component mount
    window.scrollTo(0, 0); // cuộn lên đầu trang để UX nhất quán
    loadSubscriptionData(); // gọi hàm fetch dữ liệu plans + subscription hiện tại
  }, []); // dependency rỗng => chỉ chạy 1 lần

  // Implement API calls để lấy subscription plans và current subscription
  // ================== FETCH DATA CHÍNH ==================
  const loadSubscriptionData = async () => { // hàm bất đồng bộ tải cả danh sách plans & subscription hiện tại
    try {
      setIsLoading(true); // bật spinner
      setError(null); // reset lỗi trước đó nếu có

      // 1. Lấy danh sách gói đăng ký
      const plansResponse = await api.get("/subscription-plans"); // gọi endpoint lấy danh sách các gói khả dụng
      if (plansResponse.data?.success) { // kiểm tra flag success trả về từ BE
        const plans = plansResponse.data.data || [];
        setSubscriptionPlans(plans); // lưu vào state chính

        // Gom theo type + duration để dễ chọn thời hạn
        const grouped = groupPlansByType(plans); // gom lại thành cấu trúc type/duration
        setGroupedPlans(grouped); // lưu cấu trúc gom
      }

      // 2. Lấy gói hiện tại (nếu có)
      try { // khối riêng: lấy subscription hiện tại (có thể 404 không phải lỗi nghiêm trọng)
        const currentResponse = await api.get("/subscriptions/current-active"); // endpoint trả về gói đang active
        if (currentResponse.data?.success) {
          setCurrentSubscription(currentResponse.data.data); // lưu nếu có
        }
      } catch (currentError) {
        // Không có gói hiện tại -> user chưa đăng ký hoặc đã hết hạn (bỏ log debug)
      }
    } catch (err) {
      setError("Không thể tải dữ liệu gói đăng ký. Vui lòng thử lại."); // hiển thị thông điệp chung cho user (đã bỏ console.error debug)
    } finally {
      setIsLoading(false); // tắt spinner dù thành công hay thất bại
    }
  };

  // Helper function để group plans theo type và duration
  // Gom danh sách plans thành object: { basic: {duration: plan}, standard: {...}, ... }
  const groupPlansByType = (plans) => { // chuyển mảng plans thành object phân loại theo type+duration
    const grouped = {
      basic: {},
      standard: {},
      premium: {},
    };

    plans.forEach((plan) => { // duyệt từng phần tử gói
      if (grouped[plan.type]) { // kiểm tra type có nằm trong 3 nhóm hỗ trợ
        grouped[plan.type][plan.duration] = plan; // gán plan vào key duration tương ứng
      }
    });

    return grouped; // trả về cấu trúc đã gom
  };

  // ================== LUỒNG THANH TOÁN GÓI (VNPay) ==================
  // Các bước:
  // 1. User xem danh sách gói (đã tải ở loadSubscriptionData)
  // 2. Chọn gói -> gọi POST /subscriptions/payment gửi planId
  // 3. Backend tạo subscription với status = pending + trả về paymentUrl + subscriptionId
  // 4. FE lưu subscriptionId (pendingSubscriptionId) để đối chiếu khi VNPay redirect
  // 5. Redirect tới paymentUrl (VNPay)
  // 6. Sau thanh toán, VNPay gọi return URL -> FE (paymentSuccessPage) đọc vnp_TxnRef = subscriptionId và gọi /subscriptions/check-payment-status để xác thực và kích hoạt
  const startPayment = async (plan) => { // khởi phát luồng thanh toán VNPay cho plan được chọn
    try {
      setSelectedPlan(plan); // lưu plan vào state để modal hiển thị chi tiết
      setShowPaymentModal(true); // bật modal xác nhận

      // Gọi API tạo paymentUrl (tạo luôn subscription pending)
      const response = await api.post("/subscriptions/payment", { // gọi API tạo subscription pending + lấy URL thanh toán
        planId: plan._id, // truyền id gói cho backend
        locale: "vn", // locale 'vn' để VNPay hiển thị tiếng Việt (tuỳ backend xử lý)
      });

      if (response.data?.success) { // kiểm tra thành công
        const paymentUrl = response.data.data.paymentUrl; // URL VNPay để redirect
        const subscriptionId = response.data.data.subscriptionId; // id subscription pending vừa tạo

        // Lưu để paymentSuccessPage đối chiếu khi VNPay redirect (vnp_TxnRef = subscriptionId)
        localStorage.setItem("pendingSubscriptionId", subscriptionId); // lưu id để đối chiếu lúc return (paymentSuccessPage)

        // Chuyển hướng VNPay (redirect toàn trang)
        window.location.href = paymentUrl; // thực hiện chuyển hướng sang VNPay (rời SPA)
      }
    } catch (err) {
      setError("Không thể tạo thanh toán. Vui lòng thử lại."); // báo lỗi thân thiện người dùng (đã bỏ console.error debug)
    }
  };

  // Nâng cấp gói hiện tại lên gói cao hơn hoặc thời hạn dài hơn
  const handleUpgrade = async (plan) => { // xử lý nâng cấp từ gói hiện tại lên gói cao hơn
    try {
      setSelectedPlan(plan); // lưu plan muốn nâng cấp
      setShowPaymentModal(true); // mở modal xác nhận

      const response = await api.post("/subscriptions/upgrade", { // API nâng cấp (có thể trả về paymentUrl riêng)
        planId: plan._id, // id gói mục tiêu
      });

      // Nếu BE trả về paymentUrl riêng cho upgrade
      const paymentUrl = // ưu tiên lấy paymentUrl nằm trong data.data, fallback data.paymentUrl
        response?.data?.data?.paymentUrl || response?.data?.paymentUrl;

      if (paymentUrl) { // nếu có URL thanh toán riêng cho upgrade
        window.location.href = paymentUrl; // redirect ngay
        return; // kết thúc hàm, không cần fallback
      }

      // Nếu không có paymentUrl chuyên biệt thì dùng luồng tạo mới mặc định
      await startPayment(plan); // fallback: dùng flow tạo mới nếu BE không cung cấp URL upgrade
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể nâng cấp gói. Vui lòng thử lại.";
      setError(msg); // hiển thị thông điệp lỗi cụ thể nếu có
      setShowPaymentModal(false); // đóng modal vì không thể tiếp tục thanh toán
    }
  };

  // Helper function để format giá tiền
  // Format số tiền VND có dấu phân tách
  const formatPrice = (price) => { // chuyển số thành chuỗi tiền tệ VNĐ có phân tách hàng nghìn
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ"; // Intl.NumberFormat xử lý locale 'vi-VN'
  };

  // Helper function để format duration
  // Chuyển duration mã khóa thành chuỗi tiếng Việt dễ hiểu
  const formatDuration = (duration) => { // map mã duration nội bộ sang chuỗi tiếng Việt
    const durationMap = {
      "1_month": "1 tháng",
      "6_months": "6 tháng",
      "12_months": "12 tháng",
    };
    return durationMap[duration] || duration; // fallback trả về raw nếu chưa map
  };

  // Helper function để get plan icon
  // Icon hiển thị theo loại gói
  const getPlanIcon = (type) => { // chọn icon phù hợp theo loại gói
    switch (type) {
      case "basic":
        return <FaBatteryFull />;
      case "standard":
        return <FaBolt />;
      case "premium":
        return <FaCrown />;
      default:
        return <FaStar />;
    }
  };

  // Helper function để check if plan is current
  // Kiểm tra plan có phải gói user đang dùng
  const isCurrentPlan = (plan) => { // kiểm tra plan truyền vào có trùng id với plan hiện tại
    return currentSubscription && currentSubscription.planId === plan._id; // true nếu user đang dùng plan này
  };

  // Helper function để check if plan can be upgraded to
  // Xác định có thể nâng cấp lên gói được chọn không:
  //  - type cao hơn OR duration dài hơn
  //  - và giá phải cao hơn (tránh downgrade giá)
  const canUpgradeTo = (plan) => { // logic quyết định có thể nâng cấp lên plan này không
    if (!currentSubscription) return true;

    const currentPlan =
      subscriptionPlans.find(
        (p) => p._id === currentSubscription.planId
      ) || currentSubscription;

    const typeOrder = { basic: 1, standard: 2, premium: 3 };
    const durationOrder = { "1_month": 1, "6_months": 2, "12_months": 3 };

    const isHigherType = typeOrder[plan.type] > typeOrder[currentPlan.type];
    const isLongerDuration =
      durationOrder[plan.duration] > durationOrder[currentPlan.duration];
    const isPriceHigher =
      typeof currentSubscription.price === "number" &&
        typeof plan.price === "number"
        ? plan.price > currentSubscription.price
        : true;

    return (isHigherType || isLongerDuration) && isPriceHigher; // chỉ cho phép nếu cao hơn loại hoặc dài hơn thời hạn và giá tăng
  };

  // Thêm dropdown chọn thời hạn cho mỗi loại membership
  // Khi user chọn thời hạn khác cho một type
  const handleDurationChange = (type, duration) => { // cập nhật duration được chọn cho một type cụ thể
    setSelectedDurations((prev) => ({ // dùng callback để chắc chắn dựa trên state cũ
      ...prev, // copy các duration hiện có
      [type]: duration, // ghi đè duration của type truyền vào
    }));
  };

  // Helper function để get current plan based on selected duration
  // Lấy gói tương ứng với type + duration đang chọn
  const getCurrentPlan = (type) => { // trả về plan hiện tại đang chọn (theo type + duration)
    const selectedDuration = selectedDurations[type]; // lấy duration đang chọn cho type
    return groupedPlans[type]?.[selectedDuration] || null; // truy cập an toàn vào groupedPlans; null nếu chưa có
  };

  // Helper function để get available durations for a type
  // Các duration hiện có cho một type (sort theo thứ tự tăng dần)
  const getAvailableDurations = (type) => { // danh sách duration có sẵn cho type này (đã gom trước đó)
    const typePlans = groupedPlans[type] || {};
    return Object.keys(typePlans).sort((a, b) => { // sắp xếp theo thứ tự tăng dần
      const order = { "1_month": 1, "6_months": 2, "12_months": 3 }; // map độ ưu tiên
      return order[a] - order[b]; // so sánh thứ tự để sort
    });
  };

  // Các điểm giá trị (USP) hiển thị ở section "Giá trị hội viên"
  const valueHighlights = [ // mảng các điểm giá trị hiển thị khu vực "Giá trị hội viên"
    {
      icon: <FaShieldAlt />,
      title: "Ổn định & minh bạch",
      description: "Không phí ẩn, hoàn phí khi có gián đoạn do hệ thống.",
    },
    {
      icon: <FaLeaf />,
      title: "Năng lượng xanh",
      description: "Ưu tiên trạm đạt chuẩn, tối ưu hiệu suất và tuổi thọ pin.",
    },
    {
      icon: <FaCreditCard />,
      title: "Thanh toán bảo mật",
      description: "VNPay bảo chứng, tự động lưu trạng thái giao dịch.",
    },
    {
      icon: <FaHeadset />,
      title: "Hỗ trợ 24/7",
      description: "Đội ngũ sẵn sàng đồng hành trong mọi hành trình.",
    },
  ];

  // Các bước hành trình đăng ký gói hiển thị ở section cuối
  const journeySteps = [ // mảng các bước hành trình đăng ký dùng render ở phần cuối
    {
      title: "Chọn gói & thời hạn",
      description:
        "So sánh ưu đãi theo tháng, 6 tháng hoặc 12 tháng để tối ưu chi phí.",
    },
    {
      title: "Thanh toán bảo mật",
      description:
        "Chuyển hướng VNPay, lưu trạng thái tự động để kiểm tra dễ dàng.",
    },
    {
      title: "Kích hoạt tức thì",
      description:
        "Gói hiệu lực ngay sau khi thanh toán. Theo dõi ở trang Hồ sơ cá nhân.",
    },
  ];

  // Cuộn mượt xuống khu vực danh sách gói (dựa vào id phần tử)
  const scrollToPlans = () => { // cuộn trang đến section bảng giá bằng id
    const target = document.getElementById("plans-section");
    if (target) { // nếu tồn tại phần tử
      target.scrollIntoView({ behavior: "smooth", block: "start" }); // cuộn mượt đến vị trí đầu của section
    }
  };

  // Loading state
  // ================== RENDER LOADING ==================
  if (isLoading) { // khi đang tải dữ liệu => trả về giao diện spinner
    return (
      <div className="membership-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu gói đăng ký...</p>
        </div>
      </div>
    );
  }

  // Error state
  // ================== RENDER ERROR ==================
  if (error) { // nếu có lỗi => render khối báo lỗi
    return (
      <div className="membership-page">
        <div className="error-container">
          <FaTimes className="error-icon" />
          <h2>Lỗi tải dữ liệu</h2>
          <p>{error}</p>
          <button className="retry-button" onClick={loadSubscriptionData}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return ( // trả về giao diện đầy đủ của trang membership khi không loading/lỗi
    <div className="membership-page"> {/* wrapper chính của trang */}
      {/* ================== HERO SECTION ================== */}
      <section className="hero-section"> {/* khu vực tiêu đề / mô tả đầu trang */}
        <div className="hero-grid">
          <div className="hero-copy"> {/* cột trái: copy chính + actions */}
            <span className="hero-pill">EV Membership</span>
            <h1>Chọn gói sạc được thiết kế cho hành trình của bạn</h1>
            <p className="hero-lead">
              Bảo vệ giao dịch, ưu tiên sạc nhanh và hỗ trợ 24/7. Những gì bạn cần
              để di chuyển an tâm mỗi ngày.
            </p>
            <div className="hero-actions"> {/* nhóm nút hành động đầu trang */}
              <button className="primary-btn" onClick={scrollToPlans}>
                Khám phá gói
              </button>
              <button
                className="ghost-btn"
                onClick={() => navigate("/profile")}
              >
                Quản lý gói trong Hồ sơ
              </button>
            </div>
            <div className="hero-meta"> {/* nhóm badge nhỏ mô tả nhanh lợi ích */}
              <span className="meta-chip">
                <FaCheckCircle /> Hoàn phí khi gián đoạn
              </span>
              <span className="meta-chip">
                <FaBolt /> Ưu tiên sạc nhanh
              </span>
              <span className="meta-chip">
                <FaMapMarkerAlt /> 300+ trạm đối tác
              </span>
            </div>
          </div>

          <div className="hero-panel"> {/* cột phải: panel thông tin gói premium minh hoạ */}
            <div className="panel-header"> {/* header chứa icon + tiêu đề */}
              <div className="panel-icon">
                <FaCrown />
              </div>
              <div>
                <p className="panel-label">Trải nghiệm cao cấp</p>
                <h3>Luôn sẵn sàng cho chuyến đi tiếp theo</h3>
              </div>
            </div>
            <div className="panel-body"> {/* các chỉ số mini (metric) */}
              <div className="metric">
                <span className="metric-label">Ưu tiên giờ cao điểm</span>
                <strong>+2</strong>
                <small>lượt giữ chỗ/tuần</small>
              </div>
              <div className="metric">
                <span className="metric-label">Tiết kiệm</span>
                <strong>20%</strong>
                <small>chọn gói 12 tháng</small>
              </div>
              <div className="metric">
                <span className="metric-label">Độ phủ</span>
                <strong>300+</strong>
                <small>trạm đạt chuẩn</small>
              </div>
            </div>
            <div className="panel-footer"> {/* footer panel: tag bảo chứng + mô tả */}
              <div className="footer-tag">
                <FaShieldAlt /> VNPay bảo chứng
              </div>
              <p>
                Gói hiện tại và thao tác hủy được chuyển sang trang Hồ sơ cá
                nhân để bạn kiểm soát thuận tiện hơn.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ================== VALUE SECTION ================== */}
      <section className="value-section"> {/* khu vực liệt kê giá trị hội viên */}
        <div className="section-heading">
          <p className="eyebrow">Giá trị hội viên</p>
          <h2>Thiết kế cho hành trình bền vững & chuyên nghiệp</h2>
          <p>
            Chúng tôi ưu tiên chất lượng trạm sạc, tốc độ xử lý giao dịch và trải
            nghiệm xuyên suốt để bạn chỉ cần tập trung lái xe.
          </p>
        </div>
        <div className="value-grid"> {/* lưới các thẻ giá trị */}
          {valueHighlights.map((item, index) => (
            <div className="value-card" key={index}>
              <div className="value-icon">{item.icon}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================== PLANS SECTION ================== */}
      <section className="plans-section" id="plans-section"> {/* khu bảng giá các gói */}
        <div className="section-heading plans-heading">
          <p className="eyebrow">Bảng giá</p>
          <h2>Chọn lộ trình sạc phù hợp</h2>
          <p className="section-note">
            Quản lý gói hiện tại và thao tác hủy được chuyển sang trang Hồ sơ cá
            nhân. Chọn gói mới bên dưới để thanh toán ngay.
          </p>
        </div>
        <div className="plans-container"> {/* container tất cả card gói */}
          {Object.entries(groupedPlans).map(([type, typePlans]) => { // lặp qua từng loại gói (basic/standard/premium)
            const currentPlan = getCurrentPlan(type);
            const availableDurations = getAvailableDurations(type);

            if (!currentPlan || availableDurations.length === 0) return null; // bỏ qua nếu không có plan hoặc không có duration

            return (
              <div
                key={type} // key React dựa trên type
                className={`plan-card ${isCurrentPlan(currentPlan) ? "current" : ""
                  } ${type === "premium" ? "featured" : ""} ${type}`}
              > {/* thẻ gói đơn lẻ với class điều kiện */}
                {type === "premium" && (
                  <div className="popular-badge">Phổ biến nhất</div>
                )} {/* badge nổi bật chỉ hiển thị cho premium */}

                <div className="plan-header"> {/* header của card: icon + tên + badge hiện tại */}
                  <div className="plan-icon-wrapper">{getPlanIcon(type)}</div>
                  <h2 className="plan-name">
                    {currentPlan.name.split(" - ")[0]}
                  </h2>
                  {isCurrentPlan(currentPlan) && (
                    <span className="current-badge">
                      <FaCheckCircle /> Gói hiện tại
                    </span>
                  )} {/* hiển thị badge nếu đây là gói đang sử dụng */}
                </div>

                {/* Bộ chọn thời hạn của gói (tab kiểu Spotify) */}
                <div className="duration-selector"> {/* khối chọn thời hạn của gói */}
                  <div className="duration-tabs">
                    {availableDurations.length > 0 ? ( // nếu có danh sách duration
                      availableDurations.map((duration) => ( // render từng nút duration
                        <button
                          key={duration} // key dựa trên duration
                          className={`duration-tab ${selectedDurations[type] === duration ? "active" : ""
                            }`}
                          onClick={() => handleDurationChange(type, duration)} // cập nhật lựa chọn duration cho type
                        >
                          <span className="duration-text">
                            {formatDuration(duration)}
                          </span>
                          {duration === "12_months" && (
                            <span className="savings-badge">TIẾT KIỆM</span>
                          )} {/* badge tiết kiệm cho duration dài nhất */}
                        </button>
                      )) // kết thúc map durations
                    ) : ( // trường hợp không có duration nào khả dụng
                      <div className="no-duration-message">
                        Chưa có gói đăng ký
                      </div> // hiển thị thông báo
                    )}
                  </div>
                </div>

                <div className="price-section"> {/* khu vực giá của gói */}
                  <div className="price-wrapper"> {/* chứa giá hiện tại và giá gốc nếu giảm */}
                    <span className="price-amount">
                      {formatPrice(currentPlan.price)}
                    </span>
                    {currentPlan.originalPrice &&
                      currentPlan.originalPrice > currentPlan.price && (
                        <span className="original-price">
                          {formatPrice(currentPlan.originalPrice)}
                        </span>
                      )} {/* hiển thị giá gốc nếu giá gốc > giá hiện tại (giảm giá) */}
                  </div>
                  {/* <p className="price-period">{formatDuration(currentPlan.duration)}</p> */}
                </div>

                <p className="plan-description">{currentPlan.description}</p> {/* mô tả ngắn gói */}

                <div className="divider"></div> {/* đường kẻ phân tách */}

                {/* Danh sách tính năng của gói (lọc hiển thị theo giá trị hợp lệ) */}
                <ul className="features-list"> {/* danh sách tính năng của gói */}
                  {currentPlan.features &&
                    Object.entries(currentPlan.features).map(
                      ([key, value], i) => { // duyệt từng cặp key/value của features
                        // Chỉ hiển thị feature nếu có giá trị hợp lệ
                        let featureText = "";
                        if (
                          key === "maxReservations" &&
                          value !== undefined &&
                          value !== null
                        ) {
                          if (value === -1) {
                            featureText = "Đặt lịch không giới hạn";
                          } else if (value > 0) {
                            featureText = `Tối đa ${value} lần đặt lịch/tháng`;
                          }
                        } else if (
                          key === "maxVehicles" &&
                          value !== undefined &&
                          value !== null
                        ) {
                          if (value === -1) {
                            featureText = "Quản lý xe không giới hạn";
                          } else if (value > 0) {
                            featureText = `Tối đa ${value} xe`;
                          }
                        } else if (
                          key === "prioritySupport" &&
                          value === true
                        ) {
                          featureText = "Hỗ trợ ưu tiên 24/7";
                        } else if (
                          key === "discount" &&
                          value !== undefined &&
                          value !== null &&
                          value > 0
                        ) {
                          featureText = `Giảm giá ${value}% khi gia hạn`;
                        }

                        // Chỉ render nếu có feature text
                        if (!featureText) return null; // bỏ qua nếu không sinh ra chuỗi hiển thị

                        return (
                          <li key={i} className="feature-item"> {/* một dòng feature */}
                            <FaCheckCircle className="check-icon" /> {/* icon check */}
                            <span>{featureText}</span> {/* nội dung feature đã format */}
                          </li>
                        ); // trả về phần tử li
                      }
                    )}
                </ul>

                {/* Khu vực footer của thẻ gói: hiển thị nút hành động phù hợp trạng thái */}
                <div className="plan-footer"> {/* footer: các nút hành động tuỳ trạng thái */}
                  {isCurrentPlan(currentPlan) ? ( // nếu là gói hiện tại => nút disabled
                    <button className="current-btn" disabled>
                      <FaCheckCircle /> Gói hiện tại
                    </button>
                  ) : canUpgradeTo(currentPlan) ? ( // nếu có thể nâng cấp / đăng ký => hiển thị nút tương tác
                    <button
                      className={`subscribe-btn ${type === "premium" ? "premium" : ""
                        }`}
                      onClick={() =>
                        currentSubscription
                          ? handleUpgrade(currentPlan) // đã có gói -> nâng cấp
                          : startPayment(currentPlan) // chưa có -> thanh toán mới
                      }
                    >
                      {currentSubscription ? "Upgrade" : "Thanh toán"}
                    </button>
                  ) : ( // còn lại: không thể nâng cấp => nút disabled
                    <button className="unavailable-btn" disabled>
                      Không thể nâng cấp
                    </button>
                  )}
                </div> {/* kết thúc plan-footer */}
              </div>
            );
          })}
        </div>
      </section>

      {/* ================== STEPS SECTION ================== */}
      <section className="steps-section"> {/* khu vực hiển thị 3 bước quy trình */}
        <div className="section-heading">
          <p className="eyebrow">Trải nghiệm liền mạch</p>
          <h2>Bắt đầu chỉ với vài bước</h2>
          <p>Thiết kế tối giản, minh bạch và tự động hóa tối đa.</p>
        </div>
        <div className="steps-grid"> {/* lưới các thẻ step */}
          {journeySteps.map((step, index) => ( // lặp qua mảng steps hiển thị từng card
            <div className="step-card" key={step.title}> {/* thẻ từng bước */}
              <div className="step-number">0{index + 1}</div> {/* số thứ tự hiển thị với tiền tố 0 */}
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <FaArrowRight className="step-arrow" /> {/* icon mũi tên trang trí */}
            </div>
          ))}
        </div>
      </section>

      {/* ================== PAYMENT CONFIRM MODAL ================== */}
      {showPaymentModal && selectedPlan && ( // render modal xác nhận thanh toán khi cả 2 điều kiện đúng
        <div className="payment-modal-overlay">
          <div className="payment-modal">
            <div className="modal-header">
              <h3>Xác nhận thanh toán</h3>
              <button
                className="close-button"
                onClick={() => setShowPaymentModal(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <p>
                Bạn đang đăng ký gói: <strong>{selectedPlan.name}</strong>
              </p>
              <p>
                Giá: <strong>{formatPrice(selectedPlan.price)}</strong>
              </p>
              <p>
                Thời hạn:{" "}
                <strong>{formatDuration(selectedPlan.duration)}</strong>
              </p>
              <p>Sẽ được chuyển hướng đến VNPay để thanh toán...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipPage; // xuất component để router sử dụng
