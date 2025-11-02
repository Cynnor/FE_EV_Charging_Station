import { useEffect, useState } from "react";
import { FaBatteryFull, FaCheckCircle, FaBolt, FaCrown, FaStar, FaTimes } from "react-icons/fa";
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
    basic: '1_month',
    standard: '1_month',
    premium: '1_month'
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
      const plansResponse = await api.get('/subscription-plans');
      if (plansResponse.data?.success) {
        const plans = plansResponse.data.data || [];
        setSubscriptionPlans(plans);

        // Implement logic group plans theo type và duration
        const grouped = groupPlansByType(plans);
        setGroupedPlans(grouped);
      }

      // Gọi API để lấy current active subscription
      try {
        const currentResponse = await api.get('/subscriptions/current-active');
        if (currentResponse.data?.success) {
          setCurrentSubscription(currentResponse.data.data);
        }
      } catch (currentError) {
        // Không có current subscription là bình thường
        console.log('No active subscription found');
      }

    } catch (err) {
      console.error('Error loading subscription data:', err);
      setError('Không thể tải dữ liệu gói đăng ký. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function để group plans theo type và duration
  const groupPlansByType = (plans) => {
    const grouped = {
      basic: {},
      standard: {},
      premium: {}
    };

    plans.forEach(plan => {
      if (grouped[plan.type]) {
        grouped[plan.type][plan.duration] = plan;
      }
    });

    return grouped;
  };

  // Implement payment flow cho subscription
  const handleSubscribe = async (plan) => {
    try {
      setSelectedPlan(plan);
      setShowPaymentModal(true);

      // Gọi API để tạo payment URL cho subscription
      const response = await api.post('/subscriptions/payment', {
        planId: plan._id,
        locale: 'vn'
      });

      if (response.data?.success) {
        const paymentUrl = response.data.data.paymentUrl;
        const subscriptionId = response.data.data.subscriptionId;

        // Lưu subscriptionId vào localStorage để check payment status sau
        localStorage.setItem('pendingSubscriptionId', subscriptionId);

        // Redirect đến VNPay để thanh toán
        window.location.href = paymentUrl;
      }
    } catch (err) {
      console.error('Error creating payment:', err);
      setError('Không thể tạo thanh toán. Vui lòng thử lại.');
    }
  };

  // Implement upgrade/cancel subscription functionality
  const handleUpgrade = async (plan) => {
    try {
      const response = await api.post('/subscriptions/upgrade', {
        planId: plan._id
      });

      if (response.data?.success) {
        // Redirect đến payment
        handleSubscribe(plan);
      }
    } catch (err) {
      console.error('Error upgrading subscription:', err);
      setError('Không thể nâng cấp gói. Vui lòng thử lại.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const response = await api.post(`/subscriptions/${currentSubscription._id}/cancel`);
      if (response.data?.success) {
        alert('Đã hủy gói đăng ký thành công. Bạn vẫn có thể sử dụng đến hết thời hạn.');
        loadSubscriptionData(); // Reload data
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Không thể hủy gói đăng ký. Vui lòng thử lại.');
    }
  };

  // Helper function để format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  // Helper function để format duration
  const formatDuration = (duration) => {
    const durationMap = {
      '1_month': '1 tháng',
      '6_months': '6 tháng',
      '12_months': '12 tháng'
    };
    return durationMap[duration] || duration;
  };

  // Helper function để get plan icon
  const getPlanIcon = (type) => {
    switch (type) {
      case 'basic':
        return <FaBatteryFull />;
      case 'standard':
        return <FaBolt />;
      case 'premium':
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

    const currentPlan = subscriptionPlans.find(p => p._id === currentSubscription.planId);
    if (!currentPlan) return true;

    // Check type hierarchy: basic < standard < premium
    const typeOrder = { basic: 1, standard: 2, premium: 3 };
    const durationOrder = { '1_month': 1, '6_months': 2, '12_months': 3 };

    return typeOrder[plan.type] > typeOrder[currentPlan.type] ||
      durationOrder[plan.duration] > durationOrder[currentPlan.duration];
  };

  // Thêm dropdown chọn thời hạn cho mỗi loại membership
  const handleDurationChange = (type, duration) => {
    setSelectedDurations(prev => ({
      ...prev,
      [type]: duration
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
      const order = { '1_month': 1, '6_months': 2, '12_months': 3 };
      return order[a] - order[b];
    });
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
      {/* Spotify-style Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Chọn gói đăng ký của bạn</h1>
          <p className="hero-subtitle">
            Trải nghiệm dịch vụ sạc xe điện chất lượng cao với các gói linh hoạt
          </p>
        </div>
      </div>

      {/* Current Subscription Banner */}
      {currentSubscription && (
        <div className="current-subscription-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <FaCheckCircle />
            </div>
            <div className="banner-info">
              <h3>Gói hiện tại</h3>
              <p>{currentSubscription.plan?.name} • Hết hạn: {new Date(currentSubscription.endDate).toLocaleDateString('vi-VN')}</p>
            </div>
            <button
              className="banner-cancel-btn"
              onClick={handleCancelSubscription}
            >
              Hủy gói
            </button>
          </div>
        </div>
      )}

      {/* Spotify-style Plans Section */}
      <div className="plans-section">
        <div className="plans-container">
          {Object.entries(groupedPlans).map(([type, typePlans]) => {
            const currentPlan = getCurrentPlan(type);
            const availableDurations = getAvailableDurations(type);

            if (!currentPlan || availableDurations.length === 0) return null;

            return (
              <div
                key={type}
                className={`plan-card ${isCurrentPlan(currentPlan) ? 'current' : ''} ${type === 'premium' ? 'featured' : ''} ${type}`}
              >
                {type === 'premium' && <div className="popular-badge">Phổ biến nhất</div>}

                <div className="plan-header">
                  <div className="plan-icon-wrapper">
                    {getPlanIcon(type)}
                  </div>
                  <h2 className="plan-name">{currentPlan.name.split(' - ')[0]}</h2>
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
                      availableDurations.map(duration => (
                        <button
                          key={duration}
                          className={`duration-tab ${selectedDurations[type] === duration ? 'active' : ''}`}
                          onClick={() => handleDurationChange(type, duration)}
                        >
                          <span className="duration-text">{formatDuration(duration)}</span>
                          {duration === '12_months' && (
                            <span className="savings-badge">TIẾT KIỆM</span>
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="no-duration-message">Chưa có gói đăng ký</div>
                    )}
                  </div>
                </div>

                <div className="price-section">
                  <div className="price-wrapper">
                    <span className="price-amount">{formatPrice(currentPlan.price)}</span>
                    {currentPlan.originalPrice && currentPlan.originalPrice > currentPlan.price && (
                      <span className="original-price">{formatPrice(currentPlan.originalPrice)}</span>
                    )}
                  </div>
                  <p className="price-period">{formatDuration(currentPlan.duration)}</p>
                </div>

                <p className="plan-description">{currentPlan.description}</p>

                <div className="divider"></div>

                <ul className="features-list">
                  {currentPlan.features && Object.entries(currentPlan.features).map(([key, value], i) => {
                    // Chỉ hiển thị feature nếu có giá trị hợp lệ
                    let featureText = '';
                    if (key === 'maxReservations' && value !== undefined && value !== null) {
                      if (value === -1) {
                        featureText = 'Đặt lịch không giới hạn';
                      } else if (value > 0) {
                        featureText = `Tối đa ${value} lần đặt lịch/tháng`;
                      }
                    } else if (key === 'maxVehicles' && value !== undefined && value !== null) {
                      if (value === -1) {
                        featureText = 'Quản lý xe không giới hạn';
                      } else if (value > 0) {
                        featureText = `Tối đa ${value} xe`;
                      }
                    } else if (key === 'prioritySupport' && value === true) {
                      featureText = 'Hỗ trợ ưu tiên 24/7';
                    } else if (key === 'discount' && value !== undefined && value !== null && value > 0) {
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
                  })}
                </ul>

                <div className="plan-footer">
                  {isCurrentPlan(currentPlan) ? (
                    <button className="current-btn" disabled>
                      <FaCheckCircle /> Gói hiện tại
                    </button>
                  ) : canUpgradeTo(currentPlan) ? (
                    <button
                      className={`subscribe-btn ${type === 'premium' ? 'premium' : ''}`}
                      onClick={() => handleSubscribe(currentPlan)}
                    >
                      Bắt đầu
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
      </div>

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
              <p>Bạn đang đăng ký gói: <strong>{selectedPlan.name}</strong></p>
              <p>Giá: <strong>{formatPrice(selectedPlan.price)}</strong></p>
              <p>Thời hạn: <strong>{formatDuration(selectedPlan.duration)}</strong></p>
              <p>Sẽ được chuyển hướng đến VNPay để thanh toán...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MembershipPage;
