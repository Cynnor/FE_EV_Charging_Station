import { useState, useEffect, useMemo } from "react";
import "./index.scss";
import api from "../../../config/api";

const SubscriptionManagement = () => {
    // State cho tabs
    const [activeTab, setActiveTab] = useState("plans"); // "plans" hoặc "subscriptions"

    // ==================== SUBSCRIPTION PLANS TAB ====================
    // State cho Subscription Plans
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [errorPlans, setErrorPlans] = useState(null);
    const [showAddPlanModal, setShowAddPlanModal] = useState(false);
    const [showEditPlanModal, setShowEditPlanModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planFormData, setPlanFormData] = useState({
        name: "",
        type: "basic",
        duration: "1_month",
        durationDays: 30,
        price: "",
        originalPrice: "",
        description: "",
        features: {
            maxReservations: "",
            maxVehicles: "",
            prioritySupport: false,
            discount: "",
        },
        isActive: true,
        displayOrder: 0,
    });

    // ==================== SUBSCRIPTIONS TAB ====================
    // State cho Subscriptions
    const [subscriptions, setSubscriptions] = useState([]);
    const [loadingSubscriptions, setLoadingSubscriptions] = useState(true);
    const [errorSubscriptions, setErrorSubscriptions] = useState(null);
    const [showEditSubscriptionModal, setShowEditSubscriptionModal] =
        useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [showSubscriptionDetailModal, setShowSubscriptionDetailModal] =
        useState(false);
    const [selectedSubscription, setSelectedSubscription] = useState(null);
    const [subscriptionFormData, setSubscriptionFormData] = useState({
        userId: "",
        planId: "",
        autoRenew: false,
        customPrice: "",
        status: "pending",
        endDate: "",
    });

    // Pagination
    const [currentPagePlans, setCurrentPagePlans] = useState(1);
    const [currentPageSubscriptions, setCurrentPageSubscriptions] = useState(1);
    const pageSize = 10;

    const totalPlans = plans.length;
    const activePlans = plans.filter((plan) => plan.isActive).length;
    const premiumPlans = plans.filter((plan) => plan.type === "premium").length;
    const planSummaryCards = useMemo(
        () => [
            { label: "Tổng gói", value: totalPlans },
            { label: "Đang kích hoạt", value: activePlans },
            { label: "Gói premium", value: premiumPlans },
        ],
        [totalPlans, activePlans, premiumPlans]
    );

    const totalSubscriptions = subscriptions.length;
    const activeSubscriptions = subscriptions.filter((sub) =>
        ["active", "current_active"].includes((sub.status || "").toLowerCase())
    ).length;
    const pendingSubscriptions = subscriptions.filter(
        (sub) => (sub.status || "").toLowerCase() === "pending"
    ).length;
    const subscriptionSummaryCards = useMemo(
        () => [
            { label: "Tổng đăng ký", value: totalSubscriptions },
            { label: "Hoạt động", value: activeSubscriptions },
            { label: "Chờ xử lý", value: pendingSubscriptions },
        ],
        [totalSubscriptions, activeSubscriptions, pendingSubscriptions]
    );

    // Scroll to top when component mounts
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // ==================== SUBSCRIPTION PLANS FUNCTIONS ====================

    // GET - Lấy danh sách subscription plans
    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const response = await api.get("/subscription-plans");

            let plansData = [];
            if (response.data?.success && Array.isArray(response.data.data)) {
                plansData = response.data.data;
            } else if (Array.isArray(response.data)) {
                plansData = response.data;
            } else if (Array.isArray(response.data.data)) {
                plansData = response.data.data;
            }

            setPlans(plansData);
            setErrorPlans(null);
        } catch (err) {
            console.error("Error fetching plans:", err);
            setErrorPlans(err.message || "Không thể tải danh sách gói đăng ký");
        } finally {
            setLoadingPlans(false);
        }
    };

    // POST - Tạo subscription plan mới (Admin only)
    const handleAddPlan = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!planFormData.name?.trim()) {
            alert("Vui lòng nhập tên gói");
            return;
        }
        if (!planFormData.price || Number(planFormData.price) <= 0) {
            alert("Vui lòng nhập giá hợp lệ (số dương)");
            return;
        }
        if (!planFormData.durationDays || Number(planFormData.durationDays) <= 0) {
            alert("Vui lòng nhập số ngày hợp lệ (số dương)");
            return;
        }

        try {
            // Xử lý features - chỉ gửi những field hợp lệ
            const featuresData = {};

            // maxReservations: nếu có giá trị thì convert, nếu rỗng thì -1
            if (
                planFormData.features.maxReservations !== "" &&
                planFormData.features.maxReservations !== null &&
                planFormData.features.maxReservations !== undefined
            ) {
                const maxRes = Number(planFormData.features.maxReservations);
                featuresData.maxReservations = !isNaN(maxRes) ? maxRes : -1;
            } else {
                featuresData.maxReservations = -1;
            }

            // maxVehicles: tương tự
            if (
                planFormData.features.maxVehicles !== "" &&
                planFormData.features.maxVehicles !== null &&
                planFormData.features.maxVehicles !== undefined
            ) {
                const maxVeh = Number(planFormData.features.maxVehicles);
                featuresData.maxVehicles = !isNaN(maxVeh) ? maxVeh : -1;
            } else {
                featuresData.maxVehicles = -1;
            }

            // prioritySupport: luôn gửi boolean
            featuresData.prioritySupport = Boolean(
                planFormData.features.prioritySupport
            );

            // discount: chỉ gửi nếu có giá trị > 0
            if (
                planFormData.features.discount !== "" &&
                planFormData.features.discount !== null &&
                planFormData.features.discount !== undefined
            ) {
                const discount = Number(planFormData.features.discount);
                if (!isNaN(discount) && discount > 0) {
                    featuresData.discount = discount;
                }
            }

            // Chuẩn bị data để gửi API
            const dataToSend = {
                name: planFormData.name.trim(),
                type: planFormData.type,
                duration: planFormData.duration,
                durationDays: Number(planFormData.durationDays),
                price: Number(planFormData.price),
                originalPrice:
                    planFormData.originalPrice && planFormData.originalPrice !== ""
                        ? Number(planFormData.originalPrice)
                        : undefined,
                description: planFormData.description?.trim() || "",
                features: featuresData,
                isActive: Boolean(planFormData.isActive),
                displayOrder: Number(planFormData.displayOrder) || 0,
            };

            await api.post("/subscription-plans", dataToSend);
            alert("Tạo gói đăng ký thành công!");
            setShowAddPlanModal(false);
            resetPlanForm();
            fetchPlans();
        } catch (err) {
            console.error("Error adding plan:", err);
            const errorMessage =
                err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                "Không thể tạo gói đăng ký";
            alert(errorMessage);
        }
    };

    // PUT - Cập nhật subscription plan (Admin only)
    const handleEditPlan = async (e) => {
        e.preventDefault();
        if (!editingPlan) return;

        try {
            const dataToSend = {
                name: planFormData.name,
                price: Number(planFormData.price),
                originalPrice: planFormData.originalPrice
                    ? Number(planFormData.originalPrice)
                    : undefined,
                features: {
                    maxReservations: planFormData.features.maxReservations
                        ? Number(planFormData.features.maxReservations)
                        : -1,
                    maxVehicles: planFormData.features.maxVehicles
                        ? Number(planFormData.features.maxVehicles)
                        : -1,
                    prioritySupport: planFormData.features.prioritySupport,
                    discount: planFormData.features.discount
                        ? Number(planFormData.features.discount)
                        : undefined,
                },
                description: planFormData.description,
                isActive: planFormData.isActive,
                displayOrder: Number(planFormData.displayOrder),
            };

            await api.put(`/subscription-plans/${editingPlan._id}`, dataToSend);
            alert("Cập nhật gói đăng ký thành công!");
            setShowEditPlanModal(false);
            setEditingPlan(null);
            resetPlanForm();
            fetchPlans();
        } catch (err) {
            console.error("Error updating plan:", err);
            alert(err.response?.data?.message || "Không thể cập nhật gói đăng ký");
        }
    };

    // DELETE - Xóa subscription plan (Admin only)
    const handleDeletePlan = async (planId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa gói đăng ký này?")) return;

        try {
            await api.delete(`/subscription-plans/${planId}`);
            alert("Xóa gói đăng ký thành công!");
            fetchPlans();
        } catch (err) {
            console.error("Error deleting plan:", err);
            alert(err.response?.data?.message || "Không thể xóa gói đăng ký");
        }
    };

    // Reset form subscription plan
    const resetPlanForm = () => {
        setPlanFormData({
            name: "",
            type: "basic",
            duration: "1_month",
            durationDays: 30,
            price: "",
            originalPrice: "",
            description: "",
            features: {
                maxReservations: "",
                maxVehicles: "",
                prioritySupport: false,
                discount: "",
            },
            isActive: true,
            displayOrder: 0,
        });
    };

    // Mở modal edit plan
    const handleEditClickPlan = (plan) => {
        setEditingPlan(plan);
        setPlanFormData({
            name: plan.name || "",
            type: plan.type || "basic",
            duration: plan.duration || "1_month",
            durationDays: plan.durationDays || 30,
            price: plan.price || "",
            originalPrice: plan.originalPrice || "",
            description: plan.description || "",
            features: {
                maxReservations:
                    plan.features?.maxReservations === -1
                        ? ""
                        : plan.features?.maxReservations || "",
                maxVehicles:
                    plan.features?.maxVehicles === -1
                        ? ""
                        : plan.features?.maxVehicles || "",
                prioritySupport: plan.features?.prioritySupport || false,
                discount: plan.features?.discount || "",
            },
            isActive: plan.isActive !== undefined ? plan.isActive : true,
            displayOrder: plan.displayOrder || 0,
        });
        setShowEditPlanModal(true);
    };

    // ==================== SUBSCRIPTIONS FUNCTIONS ====================

    // GET - Lấy danh sách subscriptions
    const fetchSubscriptions = async () => {
        try {
            setLoadingSubscriptions(true);
            const response = await api.get("/subscriptions", {
                params: { page: currentPageSubscriptions, limit: 20 },
            });

            let subscriptionsData = [];
            const payload = response.data;
            if (payload?.success && Array.isArray(payload.data?.items)) {
                subscriptionsData = payload.data.items;
            } else if (payload?.success && Array.isArray(payload.data)) {
                subscriptionsData = payload.data;
            } else if (Array.isArray(payload)) {
                subscriptionsData = payload;
            } else if (Array.isArray(payload?.data)) {
                subscriptionsData = payload.data;
            }

            const normalized = subscriptionsData.map((sub) => {
                const user = sub.user || {};
                const plan = sub.plan || {};
                const fullname =
                    user.fullName ||
                    user.profile?.fullName ||
                    user.name ||
                    user.username ||
                    user.email ||
                    "Không rõ";

                return {
                    ...sub,
                    user: { ...user, fullName: fullname, email: user.email || user.username || "" },
                    plan: {
                        ...plan,
                        name: plan.name || sub.planName || sub.metadata?.planName || "Không rõ",
                        duration: plan.duration || sub.planDuration || sub.duration,
                        type: plan.type || sub.type,
                    },
                    price: sub.price,
                    currency: sub.currency || "VND",
                    startDate: sub.startDate,
                    endDate: sub.endDate,
                    status: sub.status,
                    autoRenew: Boolean(sub.autoRenew),
                };
            });

            setSubscriptions(normalized);
            setErrorSubscriptions(null);
        } catch (err) {
            console.error("Error fetching subscriptions:", err);
            setErrorSubscriptions(err.message || "Không thể tải danh sách đăng ký");
        } finally {
            setLoadingSubscriptions(false);
        }
    };

    // PUT - Cập nhật subscription (Admin only)
    const handleEditSubscription = async (e) => {
        e.preventDefault();
        if (!editingSubscription) return;

        try {
            const dataToSend = {
                status: subscriptionFormData.status,
                autoRenew: subscriptionFormData.autoRenew,
                endDate: subscriptionFormData.endDate || undefined,
            };

            await api.put(`/subscriptions/${editingSubscription._id}`, dataToSend);
            alert("Cập nhật đăng ký thành công!");
            setShowEditSubscriptionModal(false);
            setEditingSubscription(null);
            resetSubscriptionForm();
            fetchSubscriptions();
        } catch (err) {
            console.error("Error updating subscription:", err);
            alert(err.response?.data?.message || "Không thể cập nhật đăng ký");
        }
    };

    // DELETE - Xóa subscription (Admin only - soft delete)
    const handleDeleteSubscription = async (subscriptionId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đăng ký này?")) return;

        try {
            await api.delete(`/subscriptions/${subscriptionId}`);
            alert("Xóa đăng ký thành công!");
            fetchSubscriptions();
        } catch (err) {
            console.error("Error deleting subscription:", err);
            alert(err.response?.data?.message || "Không thể xóa đăng ký");
        }
    };

    // Reset form subscription
    const resetSubscriptionForm = () => {
        setSubscriptionFormData({
            userId: "",
            planId: "",
            autoRenew: false,
            customPrice: "",
            status: "pending",
            endDate: "",
        });
    };

    // Mở modal edit subscription (fetch latest detail then show)
    const handleEditClickSubscription = async (subscription) => {
        const id = subscription?._id || subscription?.id;
        const detail = id ? await fetchSubscriptionDetail(id) : subscription;
        if (!detail) return;
        setEditingSubscription(detail);
        setSubscriptionFormData({
            status: detail.status || "pending",
            autoRenew: Boolean(detail.autoRenew),
            endDate: detail.endDate
                ? new Date(detail.endDate).toISOString().split("T")[0]
                : "",
            userId: detail.user?._id || detail.userId || "",
            planId: detail.plan?._id || detail.planId || "",
            customPrice: detail.customPrice || "",
        });
        setShowEditSubscriptionModal(true);
    };

    // Format helper functions
    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ";
    };

    const formatDuration = (duration) => {
        const durationMap = {
            "1_month": "1 tháng",
            "6_months": "6 tháng",
            "12_months": "12 tháng",
        };
        return durationMap[duration] || duration || "—";
    };

    const formatDateDisplay = (value) => {
        if (!value) return "—";
        try {
            return new Date(value).toLocaleDateString("vi-VN");
        } catch (error) {
            return value;
        }
    };

    const formatPlanTypeLabel = (type = "") => {
        const map = {
            basic: "Basic",
            standard: "Standard",
            premium: "Premium",
        };
        return map[type] || type || "Không rõ";
    };

    const getPlanTypeTone = (type = "basic") => {
        if (type === "premium") return "premium";
        if (type === "standard") return "standard";
        return "basic";
    };

    const formatPlanStatusText = (isActive) => (isActive ? "Đang kích hoạt" : "Tạm dừng");

    const getPlanStatusTone = (isActive) => (isActive ? "active" : "inactive");

    const getSubscriptionStatusTone = (status = "") => {
        const normalized = status.toLowerCase();
        if (normalized === "active" || normalized === "current_active") return "success";
        if (normalized === "pending") return "warning";
        if (normalized === "cancelled" || normalized === "expired") return "danger";
        return "default";
    };

    const formatSubscriptionStatus = (status = "") => {
        const normalized = status.toLowerCase();
        const labels = {
            active: "Hoạt động",
            current_active: "Đang hiệu lực",
            pending: "Chờ xử lý",
            cancelled: "Đã huỷ",
            expired: "Hết hạn",
        };
        return labels[normalized] || status || "Không rõ";
    };

    const formatAutoRenewLabel = (autoRenew) => (autoRenew ? "Tự động" : "Thủ công");

    const fetchSubscriptionDetail = async (subscriptionId) => {
        try {
            const response = await api.get(`/subscriptions/${subscriptionId}`);
            const payload = response.data?.data || response.data;
            if (!payload) return null;

            const user = payload.user || {};
            const plan = payload.plan || {};
            const fullname =
                user.fullName ||
                user.profile?.fullName ||
                user.name ||
                user.username ||
                user.email ||
                "Không rõ";

            return {
                ...payload,
                user: { ...user, fullName: fullname, email: user.email || user.username || "" },
                plan: {
                    ...plan,
                    name: plan.name || payload.planName || payload.metadata?.planName || "Không rõ",
                    duration: plan.duration || payload.planDuration || payload.duration,
                    type: plan.type || payload.type,
                },
                currency: payload.currency || "VND",
                price: payload.price,
            };
        } catch (err) {
            console.error("Error fetching subscription detail:", err);
            alert("Không thể tải chi tiết đăng ký");
            return null;
        }
    };

    const openSubscriptionDetailModal = async (subscriptionId) => {
        const detail = await fetchSubscriptionDetail(subscriptionId);
        if (detail) {
            setSelectedSubscription(detail);
            setShowSubscriptionDetailModal(true);
        }
    };

    const closeSubscriptionDetailModal = () => {
        setSelectedSubscription(null);
        setShowSubscriptionDetailModal(false);
    };

    // Load data khi component mount hoặc tab thay đổi
    useEffect(() => {
        fetchPlans();
    }, []);

    useEffect(() => {
        if (activeTab === "subscriptions") {
            fetchSubscriptions();
        }
    }, [activeTab]);

    const renderPlanModal = (variant) => {
        const isEdit = variant === "edit";
        const isVisible = isEdit ? showEditPlanModal : showAddPlanModal;
        if (!isVisible) return null;

        const title = isEdit ? "Chỉnh sửa gói đăng ký" : "Thêm gói đăng ký mới";
        const description = isEdit
            ? "Cập nhật thông tin gói hiện tại."
            : "Tạo gói đăng ký mới cho hệ thống.";
        const primaryLabel = isEdit ? "Cập nhật gói" : "Thêm gói mới";
        const primaryIcon = isEdit ? "✓" : "➕";
        const modalIcon = isEdit ? "✏️" : "📦";
        const handleSubmit = isEdit ? handleEditPlan : handleAddPlan;
        const handleClose = () => {
            if (isEdit) {
                setShowEditPlanModal(false);
                setEditingPlan(null);
            } else {
                setShowAddPlanModal(false);
            }
            resetPlanForm();
        };

        return (
            <div
                className="modal-overlay-new"
                onClick={(e) => {
                    if (e.target === e.currentTarget) handleClose();
                }}
            >
                <div className="modal-content-new">
                    <div className="modal-header-new">
                        <div className="modal-title-section">
                            <div className="modal-icon">{modalIcon}</div>
                            <div>
                                <h2>{title}</h2>
                                <p>{description}</p>
                            </div>
                        </div>
                        <button className="modal-close-new" onClick={handleClose}>
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="form-new">
                        <div className="form-card">
                            <div className="form-card-header">
                                <span className="card-icon">ℹ️</span>
                                <h3>Thông tin cơ bản</h3>
                            </div>
                            <div className="form-card-body">
                                <div className="form-field-new">
                                    <label className="field-label">
                                        Tên gói <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="field-input"
                                        value={planFormData.name}
                                        onChange={(e) =>
                                            setPlanFormData({
                                                ...planFormData,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="Ví dụ: Basic - 1 tháng"
                                    />
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Loại gói <span className="required">*</span>
                                        </label>
                                        <div className="select-wrapper">
                                            <select
                                                required
                                                className="field-select"
                                                value={planFormData.type}
                                                onChange={(e) =>
                                                    setPlanFormData({
                                                        ...planFormData,
                                                        type: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="basic">Basic</option>
                                                <option value="standard">Standard</option>
                                                <option value="premium">Premium</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Thời hạn <span className="required">*</span>
                                        </label>
                                        <div className="select-wrapper">
                                            <select
                                                required
                                                className="field-select"
                                                value={planFormData.duration}
                                                onChange={(e) =>
                                                    setPlanFormData({
                                                        ...planFormData,
                                                        duration: e.target.value,
                                                    })
                                                }
                                            >
                                                <option value="1_month">1 tháng</option>
                                                <option value="6_months">6 tháng</option>
                                                <option value="12_months">12 tháng</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-grid-2">
                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Số ngày <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            required
                                            className="field-input"
                                            value={planFormData.durationDays}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    durationDays: e.target.value,
                                                })
                                            }
                                            placeholder="30, 180, 365"
                                        />
                                    </div>
                                    <div className="form-field-new">
                                        <label className="field-label">Thứ tự hiển thị</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="field-input"
                                            value={planFormData.displayOrder}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    displayOrder: e.target.value,
                                                })
                                            }
                                            placeholder="0"
                                        />
                                    </div>
                                </div>

                                <div className="form-field-new">
                                    <label className="field-label">Mô tả</label>
                                    <textarea
                                        className="field-textarea"
                                        value={planFormData.description}
                                        onChange={(e) =>
                                            setPlanFormData({
                                                ...planFormData,
                                                description: e.target.value,
                                            })
                                        }
                                        rows="3"
                                        placeholder="Mô tả chi tiết về gói đăng ký..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-card">
                            <div className="form-card-header">
                                <span className="card-icon">💰</span>
                                <h3>Giá cả</h3>
                            </div>
                            <div className="form-card-body">
                                <div className="form-grid-2">
                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Giá bán (VNĐ) <span className="required">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            required
                                            className="field-input"
                                            value={planFormData.price}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    price: e.target.value,
                                                })
                                            }
                                            placeholder="VD: 99000"
                                        />
                                    </div>
                                    <div className="form-field-new">
                                        <label className="field-label">Giá gốc (VNĐ)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            className="field-input"
                                            value={planFormData.originalPrice}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    originalPrice: e.target.value,
                                                })
                                            }
                                            placeholder="Để trống nếu không có"
                                        />
                                    </div>
                                </div>
                                <div className="pricing-highlights">
                                    <div className="price-highlight">
                                        <span className="label">Tiết kiệm / tháng</span>
                                        <span className="highlight-value">
                                            {planFormData.originalPrice
                                                ? formatPrice(
                                                      Math.max(
                                                          0,
                                                          Number(planFormData.originalPrice || 0) -
                                                              Number(planFormData.price || 0)
                                                      )
                                                  )
                                                : "—"}
                                        </span>
                                    </div>
                                    <div className="price-highlight">
                                        <span className="label">Chi phí ngày</span>
                                        <span className="highlight-value">
                                            {planFormData.price && planFormData.durationDays
                                                ? formatPrice(
                                                      Number(planFormData.price || 0) /
                                                          Number(planFormData.durationDays || 1)
                                                  )
                                                : "—"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-card">
                            <div className="form-card-header">
                                <span className="card-icon">✨</span>
                                <h3>Tính năng</h3>
                            </div>
                            <div className="form-card-body">
                                <div className="form-grid-2">
                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Số lần đặt lịch tối đa/tháng
                                        </label>
                                        <input
                                            type="number"
                                            min="-1"
                                            className="field-input"
                                            value={planFormData.features.maxReservations}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxReservations:
                                                            e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="-1 = không giới hạn"
                                        />
                                        <span className="field-hint">
                                            Để trống hoặc nhập -1 = không giới hạn
                                        </span>
                                    </div>
                                    <div className="form-field-new">
                                        <label className="field-label">Số xe tối đa</label>
                                        <input
                                            type="number"
                                            min="-1"
                                            className="field-input"
                                            value={planFormData.features.maxVehicles}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxVehicles:
                                                            e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="-1 = không giới hạn"
                                        />
                                        <span className="field-hint">
                                            Để trống hoặc nhập -1 = không giới hạn
                                        </span>
                                    </div>
                                </div>
                                <div className="form-grid-2">
                                    <div className="form-field-new">
                                        <label className="field-label">
                                            Giảm giá khi gia hạn (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="field-input"
                                            value={planFormData.features.discount}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        discount:
                                                            e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="VD: 10"
                                        />
                                    </div>
                                </div>
                                <div className="toggle-grid">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={planFormData.features.prioritySupport}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        prioritySupport: e.target.checked,
                                                    },
                                                })
                                            }
                                        />
                                        <span className="checkmark"></span>
                                        <span className="checkbox-label">Hỗ trợ ưu tiên 24/7</span>
                                    </label>
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={planFormData.isActive}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    isActive: e.target.checked,
                                                })
                                            }
                                        />
                                        <span className="checkmark"></span>
                                        <span className="checkbox-label">Kích hoạt gói ngay</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="form-footer-new">
                            <button
                                type="button"
                                className="btn-cancel-new"
                                onClick={handleClose}
                            >
                                Hủy
                            </button>
                            <button type="submit" className="btn-submit-new">
                                <span>{primaryIcon}</span>
                                {primaryLabel}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div className="subscription-management">
            <section className="page-hero">
                <div className="hero-copy">
                    <p className="eyebrow">Trung tâm sản phẩm</p>
                    <h2>Quản lý gói đăng ký</h2>
                    <p className="hero-lead">
                        Theo dõi cấu trúc giá, ưu đãi và vòng đời đăng ký của khách hàng trên cùng một không gian làm việc.
                    </p>
                    <div className="hero-metrics">
                        {planSummaryCards.map((item) => (
                            <div key={item.label} className="metric">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="hero-panel">
                    <h4>Hiệu suất đăng ký</h4>
                    <div className="hero-panel-grid">
                        {subscriptionSummaryCards.map((item) => (
                            <div key={item.label} className="panel-stat">
                                <span>{item.label}</span>
                                <strong>{item.value}</strong>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="tabs-card">
                <button
                    className={`tab-chip ${activeTab === "plans" ? "active" : ""}`}
                    onClick={() => setActiveTab("plans")}
                >
                    Gói đăng ký
                </button>
                <button
                    className={`tab-chip ${activeTab === "subscriptions" ? "active" : ""}`}
                    onClick={() => setActiveTab("subscriptions")}
                >
                    Đăng ký người dùng
                </button>
            </div>

            {activeTab === "plans" ? (
                <div className="panel-card">
                    <div className="panel-headline">
                        <div>
                            <h3>Danh sách gói đăng ký</h3>
                            <p>Thiết lập và tối ưu các tầng dịch vụ cho khách hàng.</p>
                        </div>
                        <button
                            className="primary-btn"
                            onClick={() => {
                                resetPlanForm();
                                setShowAddPlanModal(true);
                            }}
                        >
                            <span>+</span> Thêm gói mới
                        </button>
                    </div>

                    {loadingPlans ? (
                        <div className="empty-state">Đang tải dữ liệu gói đăng ký...</div>
                    ) : errorPlans ? (
                        <div className="error-state">{errorPlans}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Tên gói</th>
                                        <th>Loại</th>
                                        <th>Thời hạn</th>
                                        <th>Giá bán</th>
                                        <th>Giá gốc</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="no-data">
                                                Chưa có gói nào
                                            </td>
                                        </tr>
                                    ) : (
                                        plans.map((plan) => (
                                            <tr key={plan._id}>
                                                <td className="plan-cell">
                                                    <p>{plan.name}</p>
                                                    <span>{plan.description || "Chưa có mô tả"}</span>
                                                </td>
                                                <td>
                                                    <span className={`chip chip-${getPlanTypeTone(plan.type)}`}>
                                                        {formatPlanTypeLabel(plan.type)}
                                                    </span>
                                                </td>
                                                <td>{formatDuration(plan.duration)}</td>
                                                <td>{formatPrice(plan.price)}</td>
                                                <td>{plan.originalPrice ? formatPrice(plan.originalPrice) : "—"}</td>
                                                <td>
                                                    <span className={`status-pill status-${getPlanStatusTone(plan.isActive)}`}>
                                                        {formatPlanStatusText(plan.isActive)}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-pills">
                                                        <button
                                                            type="button"
                                                            className="pill ghost"
                                                            onClick={() => handleEditClickPlan(plan)}
                                                        >
                                                            Chỉnh sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pill danger"
                                                            onClick={() => handleDeletePlan(plan._id)}
                                                        >
                                                            Xoá
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="panel-card">
                    <div className="panel-headline">
                        <div>
                            <h3>Đăng ký người dùng</h3>
                            <p>Theo dõi vòng đời và gia hạn các đăng ký hoạt động.</p>
                        </div>
                    </div>

                    {loadingSubscriptions ? (
                        <div className="empty-state">Đang tải dữ liệu đăng ký...</div>
                    ) : errorSubscriptions ? (
                        <div className="error-state">{errorSubscriptions}</div>
                    ) : (
                        <div className="table-wrapper">
                            <table className="modern-table">
                                <thead>
                                    <tr>
                                        <th>Khách hàng</th>
                                        <th>Gói đăng ký</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày kết thúc</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="5" className="no-data">
                                                Chưa có đăng ký nào
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions.map((subscription) => (
                                            <tr key={subscription._id}>
                                                <td className="plan-cell">
                                                    <p>{subscription.user?.fullName || "Không rõ"}</p>
                                                    <span>{subscription.user?.email || "—"}</span>
                                                </td>
                                                <td className="plan-cell">
                                                    <p>{subscription.plan?.name || "Không rõ"}</p>
                                                    <span>{formatDuration(subscription.plan?.duration)}</span>
                                                </td>
                                                <td>
                                                    <span className={`status-pill status-${getSubscriptionStatusTone(subscription.status)}`}>
                                                        {formatSubscriptionStatus(subscription.status)}
                                                    </span>
                                                </td>
                                                <td>{formatDateDisplay(subscription.endDate)}</td>
                                                <td>
                                                    <div className="action-pills">
                                                        <button
                                                            type="button"
                                                            className="pill neutral"
                                                            onClick={() =>
                                                                openSubscriptionDetailModal(
                                                                    subscription._id
                                                                )
                                                            }
                                                        >
                                                            Xem
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pill ghost"
                                                            onClick={() => handleEditClickSubscription(subscription)}
                                                        >
                                                            Chỉnh sửa
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="pill danger"
                                                            onClick={() => handleDeleteSubscription(subscription._id)}
                                                        >
                                                            Xoá
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
            {renderPlanModal("add")}
            {renderPlanModal("edit")}

            {showSubscriptionDetailModal && selectedSubscription && (
                <div className="modal-overlay-new" onClick={closeSubscriptionDetailModal}>
                    <div
                        className="modal-content-new detail-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-new">
                            <div className="modal-title-section">
                                <div className="modal-icon">👁️</div>
                                <div>
                                    <h2>Chi tiết đăng ký</h2>
                                    <p>Thông tin đầy đủ về người dùng và gói đã chọn.</p>
                                </div>
                            </div>
                            <button className="modal-close-new" onClick={closeSubscriptionDetailModal}>
                                ✕
                            </button>
                        </div>

                        <div className="form-new detail-grid">
                            <div className="detail-card">
                                <span>Khách hàng</span>
                                <strong>{selectedSubscription.user?.fullName || "Không rõ"}</strong>
                                <p>{selectedSubscription.user?.email || "—"}</p>
                            </div>
                            <div className="detail-card">
                                <span>Gói đăng ký</span>
                                <strong>{selectedSubscription.plan?.name || "Không rõ"}</strong>
                                <p>{formatDuration(selectedSubscription.plan?.duration)}</p>
                            </div>
                            <div className="detail-card">
                                <span>Trạng thái</span>
                                <strong className={`status-pill status-${getSubscriptionStatusTone(selectedSubscription.status)}`}>
                                    {formatSubscriptionStatus(selectedSubscription.status)}
                                </strong>
                            </div>
                            <div className="detail-card">
                                <span>Giá</span>
                                <strong>
                                    {selectedSubscription.price
                                        ? formatPrice(selectedSubscription.price)
                                        : "—"}
                                    {selectedSubscription.currency ? ` ${selectedSubscription.currency}` : ""}
                                </strong>
                                <p>{formatAutoRenewLabel(selectedSubscription.autoRenew)}</p>
                            </div>
                            <div className="detail-card">
                                <span>Ngày bắt đầu</span>
                                <strong>{formatDateDisplay(selectedSubscription.startDate)}</strong>
                            </div>
                            <div className="detail-card">
                                <span>Ngày kết thúc</span>
                                <strong>{formatDateDisplay(selectedSubscription.endDate)}</strong>
                            </div>
                            {selectedSubscription.upgradedFrom?.type && (
                                <div className="detail-card">
                                    <span>Nâng cấp từ</span>
                                    <strong>{formatPlanTypeLabel(selectedSubscription.upgradedFrom.type)}</strong>
                                    <p>{formatDuration(selectedSubscription.upgradedFrom.duration)}</p>
                                </div>
                            )}
                            {selectedSubscription.metadata?.planId && (
                                <div className="detail-card">
                                    <span>Mã gói</span>
                                    <strong>{selectedSubscription.metadata.planId}</strong>
                                </div>
                            )}
                            {selectedSubscription.features?.maxReservations !== undefined && (
                                <div className="detail-card">
                                    <span>Quyền lợi</span>
                                    <p>
                                        Tối đa:{" "}
                                        {selectedSubscription.features.maxReservations < 0
                                            ? "Không giới hạn đặt chỗ"
                                            : `${selectedSubscription.features.maxReservations} đặt chỗ`}
                                    </p>
                                    <p>
                                        Xe:{" "}
                                        {selectedSubscription.features.maxVehicles < 0
                                            ? "Không giới hạn"
                                            : `${selectedSubscription.features.maxVehicles} xe`}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Edit Subscription Modal */}
            {showEditSubscriptionModal && editingSubscription && (
                <div className="modal-overlay-new" onClick={() => {
                    setShowEditSubscriptionModal(false);
                    setEditingSubscription(null);
                    resetSubscriptionForm();
                }}>
                    <div
                        className="modal-content-new edit-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header-new">
                            <div className="modal-title-section">
                                <div className="modal-icon">✏️</div>
                                <div>
                                    <h2>Chỉnh sửa đăng ký</h2>
                                    <p>Cập nhật trạng thái và gia hạn.</p>
                                </div>
                            </div>
                            <button
                                className="modal-close-new"
                                onClick={() => {
                                    setShowEditSubscriptionModal(false);
                                    setEditingSubscription(null);
                                    resetSubscriptionForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleEditSubscription} className="form-new edit-grid">
                            <div className="form-group">
                                <label>Trạng thái *</label>
                                <select
                                    required
                                    value={subscriptionFormData.status}
                                    onChange={(e) =>
                                        setSubscriptionFormData({
                                            ...subscriptionFormData,
                                            status: e.target.value,
                                        })
                                    }
                                >
                                    <option value="pending">Pending</option>
                                    <option value="active">Active</option>
                                    <option value="current_active">Current Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Ngày kết thúc</label>
                                    <input
                                        type="date"
                                        value={subscriptionFormData.endDate}
                                        onChange={(e) =>
                                            setSubscriptionFormData({
                                                ...subscriptionFormData,
                                                endDate: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={subscriptionFormData.autoRenew}
                                            onChange={(e) =>
                                                setSubscriptionFormData({
                                                    ...subscriptionFormData,
                                                    autoRenew: e.target.checked,
                                                })
                                            }
                                        />
                                        Tự động gia hạn
                                    </label>
                                </div>
                            </div>

                            <div className="form-footer-new">
                                <button
                                    type="button"
                                    className="btn-cancel-new"
                                    onClick={() => {
                                        setShowEditSubscriptionModal(false);
                                        setEditingSubscription(null);
                                        resetSubscriptionForm();
                                    }}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-submit-new">
                                    <span>✓</span>
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
    </div>
  );
};

export default SubscriptionManagement;
