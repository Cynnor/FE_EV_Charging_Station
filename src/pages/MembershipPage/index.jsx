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
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../config/api";
import "./index.scss";

function MembershipPage() {
  const navigate = useNavigate();

  // State management cho subscription plans và current subscription
  const [subscriptionPlans, setSubscriptionPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // State cho UI tối ưu - group plans theo type và duration
  const [groupedPlans, setGroupedPlans] = useState({});
  const [selectedDurations, setSelectedDurations] = useState({
    basic: "1_month",
    standard: "1_month",
    premium: "1_month",
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    // Load subscription plans và current subscription khi component mount
    loadSubscriptionData();
  }, []);

  // Implement API calls để lấy subscription plans và current subscription
  const loadSubscriptionData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Gọi API để lấy danh sách subscription plans
      const plansResponse = await api.get("/subscription-plans");
      if (plansResponse.data?.success) {
        const plans = plansResponse.data.data || [];
        setSubscriptionPlans(plans);

        // Implement logic group plans theo type và duration
        const grouped = groupPlansByType(plans);
        setGroupedPlans(grouped);
      }

      // Gọi API để lấy current active subscription
      try {
        const currentResponse = await api.get("/subscriptions/current-active");
        if (currentResponse.data?.success) {
          setCurrentSubscription(currentResponse.data.data);
        }
      } catch (currentError) {
        // Không có current subscription là bình thường
        console.log("No active subscription found");
      }
    } catch (err) {
      console.error("Error loading subscription data:", err);
      setError("Không thể tải dữ liệu gói đăng ký. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function để group plans theo type và duration
  const groupPlansByType = (plans) => {
    const grouped = {
      basic: {},
      standard: {},
      premium: {},
    };

    plans.forEach((plan) => {
      if (grouped[plan.type]) {
        grouped[plan.type][plan.duration] = plan;
      }
    });

    return grouped;
  };

  // ===== SUBSCRIPTION PAYMENT FLOW =====
  // Flow:
  // 1. User xem danh sách plans (GET /subscription-plans) - đã load trong loadSubscriptionData()
  // 2. User chọn plan và gọi API này với planId
  // 3. API tự động tạo subscription pending cho user
  // 4. API trả về URL thanh toán VNPay + subscriptionId
  // 5. User redirect đến VNPay để thanh toán
  // 6. Sau khi VNPay return, gọi check-payment-status với subscriptionId (xử lý trong paymentSuccessPage)
  const startPayment = async (plan) => {
    try {
      setSelectedPlan(plan);
      setShowPaymentModal(true);

      // Gọi API để tạo payment URL cho subscription
      // API sẽ tự động tạo subscription (status: pending) và trả về paymentUrl + subscriptionId
      const response = await api.post("/subscriptions/payment", {
        planId: plan._id,
        locale: "vn",
      });

      if (response.data?.success) {
        const paymentUrl = response.data.data.paymentUrl;
        const subscriptionId = response.data.data.subscriptionId;

        // Lưu subscriptionId vào localStorage để verify khi VNPay redirect về
        // BE đã set vnp_TxnRef = subscriptionId, nên khi VNPay redirect về,
        // FE sẽ lấy vnp_TxnRef từ URL làm subscriptionId để check payment
        localStorage.setItem("pendingSubscriptionId", subscriptionId);

        // Redirect đến VNPay để thanh toán
        // VNPay sẽ redirect về với vnp_TxnRef = subscriptionId
        window.location.href = paymentUrl;
      }
    } catch (err) {
      console.error("Error creating payment:", err);
      setError("Không thể tạo thanh toán. Vui lòng thử lại.");
    }
  };

  const handleUpgrade = async (plan) => {
    try {
      setSelectedPlan(plan);
      setShowPaymentModal(true);

      const response = await api.post("/subscriptions/upgrade", {
        planId: plan._id,
      });

      // Nếu BE sau này trả về paymentUrl, ưu tiên dùng
      const paymentUrl =
        response?.data?.data?.paymentUrl || response?.data?.paymentUrl;

      if (paymentUrl) {
        window.location.href = paymentUrl;
        return;
      }

      // Nếu không có paymentUrl, fallback tạo URL thanh toán như cũ
      await startPayment(plan);
    } catch (err) {
      console.error("Error upgrading subscription:", err);
      const msg =
        err?.response?.data?.message ||
        "Không thể nâng cấp gói. Vui lòng thử lại.";
      setError(msg);
      setShowPaymentModal(false);
    }
  };

  // Helper function để format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
  };

  // Helper function để format duration
  const formatDuration = (duration) => {
    const durationMap = {
      "1_month": "1 tháng",
      "6_months": "6 tháng",
      "12_months": "12 tháng",
    };
    return durationMap[duration] || duration;
  };

  // Helper function để get plan icon
  const getPlanIcon = (type) => {
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
  const isCurrentPlan = (plan) => {
    return currentSubscription && currentSubscription.planId === plan._id;
  };

  // Helper function để check if plan can be upgraded to
  const canUpgradeTo = (plan) => {
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

    return (isHigherType || isLongerDuration) && isPriceHigher;
  };

  // Thêm dropdown chọn thời hạn cho mỗi loại membership
  const handleDurationChange = (type, duration) => {
    setSelectedDurations((prev) => ({
      ...prev,
      [type]: duration,
    }));
  };

  // Helper function để get current plan based on selected duration
  const getCurrentPlan = (type) => {
    const selectedDuration = selectedDurations[type];
    return groupedPlans[type]?.[selectedDuration] || null;
  };

  // Helper function để get available durations for a type
  const getAvailableDurations = (type) => {
    const typePlans = groupedPlans[type] || {};
    return Object.keys(typePlans).sort((a, b) => {
      const order = { "1_month": 1, "6_months": 2, "12_months": 3 };
      return order[a] - order[b];
    });
  };

  const valueHighlights = [
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

  const journeySteps = [
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

  const scrollToPlans = () => {
    const target = document.getElementById("plans-section");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Loading state
  if (isLoading) {
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
  if (error) {
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

  return (
    <div className="membership-page">
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <span className="hero-pill">EV Membership</span>
            <h1>Chọn gói sạc được thiết kế cho hành trình của bạn</h1>
            <p className="hero-lead">
              Bảo vệ giao dịch, ưu tiên sạc nhanh và hỗ trợ 24/7. Những gì bạn cần
              để di chuyển an tâm mỗi ngày.
            </p>
            <div className="hero-actions">
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
            <div className="hero-meta">
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

          <div className="hero-panel">
            <div className="panel-header">
              <div className="panel-icon">
                <FaCrown />
              </div>
              <div>
                <p className="panel-label">Trải nghiệm cao cấp</p>
                <h3>Luôn sẵn sàng cho chuyến đi tiếp theo</h3>
              </div>
            </div>
            <div className="panel-body">
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
            <div className="panel-footer">
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

      <section className="value-section">
        <div className="section-heading">
          <p className="eyebrow">Giá trị hội viên</p>
          <h2>Thiết kế cho hành trình bền vững & chuyên nghiệp</h2>
          <p>
            Chúng tôi ưu tiên chất lượng trạm sạc, tốc độ xử lý giao dịch và trải
            nghiệm xuyên suốt để bạn chỉ cần tập trung lái xe.
          </p>
        </div>
        <div className="value-grid">
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

      <section className="plans-section" id="plans-section">
        <div className="section-heading plans-heading">
          <p className="eyebrow">Bảng giá</p>
          <h2>Chọn lộ trình sạc phù hợp</h2>
          <p className="section-note">
            Quản lý gói hiện tại và thao tác hủy được chuyển sang trang Hồ sơ cá
            nhân. Chọn gói mới bên dưới để thanh toán ngay.
          </p>
        </div>
        <div className="plans-container">
          {Object.entries(groupedPlans).map(([type, typePlans]) => {
            const currentPlan = getCurrentPlan(type);
            const availableDurations = getAvailableDurations(type);

            if (!currentPlan || availableDurations.length === 0) return null;

            return (
              <div
                key={type}
                className={`plan-card ${
                  isCurrentPlan(currentPlan) ? "current" : ""
                } ${type === "premium" ? "featured" : ""} ${type}`}
              >
                {type === "premium" && (
                  <div className="popular-badge">Phổ biến nhất</div>
                )}

                <div className="plan-header">
                  <div className="plan-icon-wrapper">{getPlanIcon(type)}</div>
                  <h2 className="plan-name">
                    {currentPlan.name.split(" - ")[0]}
                  </h2>
                  {isCurrentPlan(currentPlan) && (
                    <span className="current-badge">
                      <FaCheckCircle /> Gói hiện tại
                    </span>
                  )}
                </div>

                {/* Duration Selector - Spotify style - Hiển thị tất cả options nếu có */}
                <div className="duration-selector">
                  <div className="duration-tabs">
                    {availableDurations.length > 0 ? (
                      availableDurations.map((duration) => (
                        <button
                          key={duration}
                          className={`duration-tab ${
                            selectedDurations[type] === duration ? "active" : ""
                          }`}
                          onClick={() => handleDurationChange(type, duration)}
                        >
                          <span className="duration-text">
                            {formatDuration(duration)}
                          </span>
                          {duration === "12_months" && (
                            <span className="savings-badge">TIẾT KIỆM</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="no-duration-message">
                        Chưa có gói đăng ký
                      </div>
                    )}
                  </div>
                </div>

                <div className="price-section">
                  <div className="price-wrapper">
                    <span className="price-amount">
                      {formatPrice(currentPlan.price)}
                    </span>
                    {currentPlan.originalPrice &&
                      currentPlan.originalPrice > currentPlan.price && (
                        <span className="original-price">
                          {formatPrice(currentPlan.originalPrice)}
                        </span>
                      )}
                  </div>
                  {/* <p className="price-period">{formatDuration(currentPlan.duration)}</p> */}
                </div>

                <p className="plan-description">{currentPlan.description}</p>

                <div className="divider"></div>

                <ul className="features-list">
                  {currentPlan.features &&
                    Object.entries(currentPlan.features).map(
                      ([key, value], i) => {
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
                        if (!featureText) return null;

                        return (
                          <li key={i} className="feature-item">
                            <FaCheckCircle className="check-icon" />
                            <span>{featureText}</span>
                          </li>
                        );
                      }
                    )}
                </ul>

                <div className="plan-footer">
                  {isCurrentPlan(currentPlan) ? (
                    <button className="current-btn" disabled>
                      <FaCheckCircle /> Gói hiện tại
                    </button>
                  ) : canUpgradeTo(currentPlan) ? (
                    <button
                      className={`subscribe-btn ${
                        type === "premium" ? "premium" : ""
                      }`}
                      onClick={() =>
                        currentSubscription
                          ? handleUpgrade(currentPlan)
                          : startPayment(currentPlan)
                      }
                    >
                      {currentSubscription ? "Upgrade" : "Thanh toán"}
                    </button>
                  ) : (
                    <button className="unavailable-btn" disabled>
                      Không thể nâng cấp
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="steps-section">
        <div className="section-heading">
          <p className="eyebrow">Trải nghiệm liền mạch</p>
          <h2>Bắt đầu chỉ với vài bước</h2>
          <p>Thiết kế tối giản, minh bạch và tự động hóa tối đa.</p>
        </div>
        <div className="steps-grid">
          {journeySteps.map((step, index) => (
            <div className="step-card" key={step.title}>
              <div className="step-number">0{index + 1}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
              <FaArrowRight className="step-arrow" />
            </div>
          ))}
        </div>
      </section>

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
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

export default MembershipPage;
