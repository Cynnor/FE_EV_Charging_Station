import { useState, useEffect } from "react";
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
    const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
    const [showEditSubscriptionModal, setShowEditSubscriptionModal] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [subscriptionFormData, setSubscriptionFormData] = useState({
        userId: "",
        planId: "",
        autoRenew: false,
        customPrice: "",
        status: "pending",
        endDate: "",
    });
    const [usersList, setUsersList] = useState([]);

    // Pagination
    const [currentPagePlans, setCurrentPagePlans] = useState(1);
    const [currentPageSubscriptions, setCurrentPageSubscriptions] = useState(1);
    const pageSize = 10;

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

    // POST - Tạo subscription plan mới (Admin only) - Dựa vào API specification
    const handleAddPlan = async (e) => {
        e.preventDefault();

        // Validate required fields theo API spec
        if (!planFormData.name?.trim()) {
            alert("Vui lòng nhập tên gói (required)");
            return;
        }
        if (!planFormData.type || !['basic', 'standard', 'premium'].includes(planFormData.type)) {
            alert("Vui lòng chọn loại gói hợp lệ (basic, standard, premium)");
            return;
        }
        if (!planFormData.duration || !['1_month', '6_months', '12_months'].includes(planFormData.duration)) {
            alert("Vui lòng chọn thời hạn hợp lệ");
            return;
        }
        if (!planFormData.durationDays || Number(planFormData.durationDays) <= 0) {
            alert("Vui lòng nhập số ngày hợp lệ (số dương)");
            return;
        }
        if (!planFormData.price || Number(planFormData.price) <= 0) {
            alert("Vui lòng nhập giá hợp lệ (số dương)");
            return;
        }

        try {
            // Xử lý features - đảm bảo đúng format theo API
            const featuresData = {
                maxReservations: -1,
                maxVehicles: -1,
                prioritySupport: false
            };

            // maxReservations: nếu có giá trị thì convert, nếu rỗng thì -1 (không giới hạn)
            if (planFormData.features.maxReservations !== "" &&
                planFormData.features.maxReservations !== null &&
                planFormData.features.maxReservations !== undefined) {
                const maxRes = Number(planFormData.features.maxReservations);
                featuresData.maxReservations = !isNaN(maxRes) && maxRes >= -1 ? maxRes : -1;
            }

            // maxVehicles: tương tự
            if (planFormData.features.maxVehicles !== "" &&
                planFormData.features.maxVehicles !== null &&
                planFormData.features.maxVehicles !== undefined) {
                const maxVeh = Number(planFormData.features.maxVehicles);
                featuresData.maxVehicles = !isNaN(maxVeh) && maxVeh >= -1 ? maxVeh : -1;
            }

            // prioritySupport: luôn gửi boolean
            featuresData.prioritySupport = Boolean(planFormData.features.prioritySupport);

            // discount: chỉ gửi nếu có giá trị > 0 và <= 100
            if (planFormData.features.discount !== "" &&
                planFormData.features.discount !== null &&
                planFormData.features.discount !== undefined) {
                const discount = Number(planFormData.features.discount);
                if (!isNaN(discount) && discount > 0 && discount <= 100) {
                    featuresData.discount = discount;
                }
            }

            // Chuẩn bị data để gửi API theo specification
            const dataToSend = {
                // Required fields
                name: planFormData.name.trim(),
                type: planFormData.type,
                duration: planFormData.duration,
                durationDays: Number(planFormData.durationDays),
                price: Number(planFormData.price),
                features: featuresData,
                // Optional fields
                ...(planFormData.originalPrice && planFormData.originalPrice !== "" && Number(planFormData.originalPrice) > 0 && {
                    originalPrice: Number(planFormData.originalPrice)
                }),
                ...(planFormData.description?.trim() && {
                    description: planFormData.description.trim()
                }),
                ...(planFormData.isActive !== undefined && {
                    isActive: Boolean(planFormData.isActive)
                }),
                ...(planFormData.displayOrder !== undefined && planFormData.displayOrder !== "" && {
                    displayOrder: Number(planFormData.displayOrder) || 0
                })
            };

            // Gọi API theo specification
            const response = await api.post("/subscription-plans", dataToSend);

            // Xử lý response theo API format
            if (response.status === 201 || response.data?.success !== false) {
                alert("Tạo gói đăng ký thành công!");
                setShowAddPlanModal(false);
                resetPlanForm();
                fetchPlans(); // Reload danh sách
            } else {
                throw new Error(response.data?.message || "Không thể tạo gói đăng ký");
            }
        } catch (err) {
            console.error("Error adding plan:", err);

            // Xử lý lỗi chi tiết theo response từ API
            let errorMessage = "Không thể tạo gói đăng ký";

            if (err.response?.status === 401) {
                errorMessage = "Chưa đăng nhập hoặc phiên đăng nhập đã hết hạn";
            } else if (err.response?.status === 403) {
                errorMessage = "Không có quyền tạo gói đăng ký (chỉ Admin)";
            } else if (err.response?.status === 400) {
                errorMessage = err.response?.data?.message ||
                    err.response?.data?.error ||
                    "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại";
            } else if (err.response?.data?.message) {
                errorMessage = err.response.data.message;
            } else if (err.message) {
                errorMessage = err.message;
            }

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
                originalPrice: planFormData.originalPrice ? Number(planFormData.originalPrice) : undefined,
                features: {
                    maxReservations: planFormData.features.maxReservations ? Number(planFormData.features.maxReservations) : -1,
                    maxVehicles: planFormData.features.maxVehicles ? Number(planFormData.features.maxVehicles) : -1,
                    prioritySupport: planFormData.features.prioritySupport,
                    discount: planFormData.features.discount ? Number(planFormData.features.discount) : undefined,
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
                maxReservations: plan.features?.maxReservations === -1 ? "" : (plan.features?.maxReservations || ""),
                maxVehicles: plan.features?.maxVehicles === -1 ? "" : (plan.features?.maxVehicles || ""),
                prioritySupport: plan.features?.prioritySupport || false,
                discount: plan.features?.discount || "",
            },
            isActive: plan.isActive !== undefined ? plan.isActive : true,
            displayOrder: plan.displayOrder || 0,
        });
        setShowEditPlanModal(true);
    };

    // ==================== SUBSCRIPTIONS FUNCTIONS ====================

    // GET - Lấy danh sách users để chọn khi tạo subscription
    const fetchUsers = async () => {
        try {
            const response = await api.get("/users/get-all");
            let usersData = [];
            if (Array.isArray(response.data)) {
                usersData = response.data;
            } else if (response.data?.data && Array.isArray(response.data.data)) {
                usersData = response.data.data;
            }
            setUsersList(usersData);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // GET - Lấy danh sách subscriptions
    const fetchSubscriptions = async () => {
        try {
            setLoadingSubscriptions(true);
            const response = await api.get("/subscriptions");

            let subscriptionsData = [];
            if (response.data?.success && Array.isArray(response.data.data)) {
                subscriptionsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                subscriptionsData = response.data;
            } else if (Array.isArray(response.data.data)) {
                subscriptionsData = response.data.data;
            }

            setSubscriptions(subscriptionsData);
            setErrorSubscriptions(null);
        } catch (err) {
            console.error("Error fetching subscriptions:", err);
            setErrorSubscriptions(err.message || "Không thể tải danh sách đăng ký");
        } finally {
            setLoadingSubscriptions(false);
        }
    };

    // POST - Tạo subscription mới cho user (Admin only)
    const handleAddSubscription = async (e) => {
        e.preventDefault();
        try {
            const dataToSend = {
                userId: subscriptionFormData.userId,
                planId: subscriptionFormData.planId,
                autoRenew: subscriptionFormData.autoRenew,
                customPrice: subscriptionFormData.customPrice ? Number(subscriptionFormData.customPrice) : undefined,
            };

            await api.post("/subscriptions", dataToSend);
            alert("Tạo đăng ký thành công!");
            setShowAddSubscriptionModal(false);
            resetSubscriptionForm();
            fetchSubscriptions();
        } catch (err) {
            console.error("Error adding subscription:", err);
            alert(err.response?.data?.message || "Không thể tạo đăng ký");
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

    // Mở modal edit subscription
    const handleEditClickSubscription = (subscription) => {
        setEditingSubscription(subscription);
        setSubscriptionFormData({
            userId: subscription.user?.id || subscription.userId || "",
            planId: subscription.plan?.id || subscription.planId || "",
            autoRenew: subscription.autoRenew || false,
            customPrice: subscription.customPrice || "",
            status: subscription.status || "pending",
            endDate: subscription.endDate ? new Date(subscription.endDate).toISOString().split('T')[0] : "",
        });
        setShowEditSubscriptionModal(true);
    };

    // Format helper functions
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    const formatDuration = (duration) => {
        const durationMap = {
            '1_month': '1 tháng',
            '6_months': '6 tháng',
            '12_months': '12 tháng'
        };
        return durationMap[duration] || duration;
    };

    // Load data khi component mount hoặc tab thay đổi
    useEffect(() => {
        fetchPlans();
        fetchUsers();
    }, []);

    useEffect(() => {
        if (activeTab === "subscriptions") {
            fetchSubscriptions();
        }
    }, [activeTab]);

    return (
        <div className="subscription-management">
            <div className="page-header">
                <h1>Quản lý Gói Đăng Ký</h1>
                <p>Quản lý subscription plans và subscriptions của người dùng</p>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
                <button
                    className={`tab-button ${activeTab === "plans" ? "active" : ""}`}
                    onClick={() => setActiveTab("plans")}
                >
                    📦 Gói Đăng Ký (Plans)
                </button>
                <button
                    className={`tab-button ${activeTab === "subscriptions" ? "active" : ""}`}
                    onClick={() => setActiveTab("subscriptions")}
                >
                    👤 Đăng Ký Người Dùng (Subscriptions)
                </button>
            </div>

            {/* SUBSCRIPTION PLANS TAB */}
            {activeTab === "plans" && (
                <div className="tab-content">
                    <div className="table-header">
                        <h2>Danh sách Gói Đăng Ký</h2>
                        <button
                            className="btn-add"
                            onClick={() => {
                                resetPlanForm();
                                setShowAddPlanModal(true);
                            }}
                        >
                            + Thêm gói mới
                        </button>
                    </div>

                    {loadingPlans ? (
                        <div className="loading">Đang tải...</div>
                    ) : errorPlans ? (
                        <div className="error">{errorPlans}</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Tên gói</th>
                                        <th>Loại</th>
                                        <th>Thời hạn</th>
                                        <th>Giá</th>
                                        <th>Giá gốc</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {plans.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="no-data">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    ) : (
                                        plans.map((plan) => (
                                            <tr key={plan._id}>
                                                <td>{plan.name}</td>
                                                <td>
                                                    <span className={`badge badge-${plan.type}`}>
                                                        {plan.type}
                                                    </span>
                                                </td>
                                                <td>{formatDuration(plan.duration)}</td>
                                                <td>{formatPrice(plan.price)}</td>
                                                <td>
                                                    {plan.originalPrice ? formatPrice(plan.originalPrice) : "-"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge ${plan.isActive ? "badge-active" : "badge-inactive"}`}
                                                    >
                                                        {plan.isActive ? "Hoạt động" : "Không hoạt động"}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => handleEditClickPlan(plan)}
                                                        >
                                                            ✏️ Sửa
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleDeletePlan(plan._id)}
                                                        >
                                                            🗑️ Xóa
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

            {/* Add Plan Modal - New Design - Outside tab-content */}
            {showAddPlanModal && (
                <div className="modal-overlay-new" onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        setShowAddPlanModal(false);
                        resetPlanForm();
                    }
                }}>
                    <div className="modal-content-new">
                        <div className="modal-header-new">
                            <div className="modal-title-section">
                                <div className="modal-icon">📦</div>
                                <div>
                                    <h2>Thêm Gói Đăng Ký Mới</h2>
                                    <p>Tạo gói đăng ký mới cho hệ thống</p>
                                </div>
                            </div>
                            <button
                                className="modal-close-new"
                                onClick={() => {
                                    setShowAddPlanModal(false);
                                    resetPlanForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleAddPlan} className="form-new">
                            {/* Basic Information Card */}
                            <div className="form-card">
                                <div className="form-card-header">
                                    <span className="card-icon">ℹ️</span>
                                    <h3>Thông tin cơ bản</h3>
                                </div>
                                <div className="form-card-body">
                                    <div className="form-field-new">
                                        <label className="field-label">Tên gói <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            required
                                            className="field-input"
                                            value={planFormData.name}
                                            onChange={(e) =>
                                                setPlanFormData({ ...planFormData, name: e.target.value })
                                            }
                                            placeholder="Ví dụ: Basic - 1 tháng"
                                        />
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-field-new">
                                            <label className="field-label">Loại gói <span className="required">*</span></label>
                                            <div className="select-wrapper">
                                                <select
                                                    required
                                                    className="field-select"
                                                    value={planFormData.type}
                                                    onChange={(e) =>
                                                        setPlanFormData({ ...planFormData, type: e.target.value })
                                                    }
                                                >
                                                    <option key="basic" value="basic">Basic</option>
                                                    <option key="standard" value="standard">Standard</option>
                                                    <option key="premium" value="premium">Premium</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="form-field-new">
                                            <label className="field-label">Thời hạn <span className="required">*</span></label>
                                            <div className="select-wrapper">
                                                <select
                                                    required
                                                    className="field-select except"
                                                    value={planFormData.duration}
                                                    onChange={(e) => {
                                                        const durationMapping = {
                                                            '1_month': 30,
                                                            '6_months': 180,
                                                            '12_months': 365
                                                        };
                                                        setPlanFormData({
                                                            ...planFormData,
                                                            duration: e.target.value,
                                                            durationDays: durationMapping[e.target.value] || 30
                                                        });
                                                    }}
                                                >
                                                    <option key="1_month" value="1_month">1 tháng</option>
                                                    <option key="6_months" value="6_months">6 tháng</option>
                                                    <option key="12_months" value="12_months">12 tháng</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-field-new">
                                            <label className="field-label">Số ngày <span className="required">*</span></label>
                                            <input
                                                type="number"
                                                required
                                                min="1"
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

                            {/* Pricing Card */}
                            <div className="form-card">
                                <div className="form-card-header">
                                    <span className="card-icon">💰</span>
                                    <h3>Giá cả</h3>
                                </div>
                                <div className="form-card-body">
                                    <div className="form-grid-2">
                                        <div className="form-field-new">
                                            <label className="field-label">Giá bán (VNĐ) <span className="required">*</span></label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₫</span>
                                                <input
                                                    type="number"
                                                    required
                                                    min="0"
                                                    step="1000"
                                                    className="field-input"
                                                    value={planFormData.price}
                                                    onChange={(e) =>
                                                        setPlanFormData({ ...planFormData, price: e.target.value })
                                                    }
                                                    placeholder="99.000"
                                                />
                                            </div>
                                        </div>

                                        <div className="form-field-new">
                                            <label className="field-label">Giá gốc (VNĐ)</label>
                                            <div className="input-with-icon">
                                                <span className="input-icon">₫</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="1000"
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
                                    </div>
                                </div>
                            </div>

                            {/* Features Card */}
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
                                                            maxReservations: e.target.value === "" ? "" : e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="-1 = không giới hạn"
                                            />
                                            <span className="field-hint">Để trống hoặc nhập -1 = không giới hạn</span>
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
                                                            maxVehicles: e.target.value === "" ? "" : e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="-1 = không giới hạn"
                                            />
                                            <span className="field-hint">Để trống hoặc nhập -1 = không giới hạn</span>
                                        </div>
                                    </div>

                                    <div className="form-grid-2">
                                        <div className="form-field-new">
                                            <label className="field-label">Giảm giá khi gia hạn (%)</label>
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
                                                            discount: e.target.value === "" ? "" : e.target.value,
                                                        },
                                                    })
                                                }
                                                placeholder="VD: 10"
                                            />
                                        </div>

                                        <div className="form-field-new">
                                            <label className="field-label">Tùy chọn</label>
                                            <div className="checkbox-list">
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
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="form-footer-new">
                                <button
                                    type="button"
                                    className="btn-cancel-new"
                                    onClick={() => {
                                        setShowAddPlanModal(false);
                                        resetPlanForm();
                                    }}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-submit-new">
                                    <span>➕</span>
                                    Thêm gói mới
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Plan Modal */}
            {showEditPlanModal && editingPlan && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Sửa Gói Đăng Ký</h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowEditPlanModal(false);
                                    setEditingPlan(null);
                                    resetPlanForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditPlan} className="modal-body">
                            <div className="form-group">
                                <label>Tên gói *</label>
                                <input
                                    type="text"
                                    required
                                    value={planFormData.name}
                                    onChange={(e) =>
                                        setPlanFormData({ ...planFormData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Loại *</label>
                                    <select
                                        required
                                        value={planFormData.type}
                                        onChange={(e) =>
                                            setPlanFormData({ ...planFormData, type: e.target.value })
                                        }
                                    >
                                        <option key="basic" value="basic">Basic</option>
                                        <option key="standard" value="standard">Standard</option>
                                        <option key="premium" value="premium">Premium</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Thời hạn *</label>
                                    <select
                                        required
                                        value={planFormData.duration}
                                        onChange={(e) => {
                                            // Auto-calculate durationDays khi chọn duration
                                            const durationMapping = {
                                                '1_month': 30,
                                                '6_months': 180,
                                                '12_months': 365
                                            };
                                            setPlanFormData({
                                                ...planFormData,
                                                duration: e.target.value,
                                                durationDays: durationMapping[e.target.value] || 30
                                            });
                                        }}
                                    >
                                        <option key="1_month" value="1_month">1 tháng</option>
                                        <option key="6_months" value="6_months">6 tháng</option>
                                        <option key="12_months" value="12_months">12 tháng</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Số ngày *</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={planFormData.durationDays}
                                        onChange={(e) =>
                                            setPlanFormData({
                                                ...planFormData,
                                                durationDays: e.target.value,
                                            })
                                        }
                                        placeholder="VD: 30, 180, 365"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        min="0"
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
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giá (VNĐ) *</label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        step="1000"
                                        value={planFormData.price}
                                        onChange={(e) =>
                                            setPlanFormData({ ...planFormData, price: e.target.value })
                                        }
                                        placeholder="VD: 99000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Giá gốc (VNĐ)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1000"
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
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    value={planFormData.description}
                                    onChange={(e) =>
                                        setPlanFormData({
                                            ...planFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows="3"
                                    placeholder="Mô tả về gói đăng ký..."
                                />
                            </div>
                            <div className="form-section">
                                <h3>Tính năng</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Số lần đặt lịch tối đa/tháng</label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={planFormData.features.maxReservations}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxReservations: e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="-1 = không giới hạn"
                                        />
                                        <small className="form-hint">Để trống hoặc nhập -1 = không giới hạn</small>
                                    </div>
                                    <div className="form-group">
                                        <label>Số xe tối đa</label>
                                        <input
                                            type="number"
                                            min="-1"
                                            value={planFormData.features.maxVehicles}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxVehicles: e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="-1 = không giới hạn"
                                        />
                                        <small className="form-hint">Để trống hoặc nhập -1 = không giới hạn</small>
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Giảm giá khi gia hạn (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={planFormData.features.discount}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        discount: e.target.value === "" ? "" : e.target.value,
                                                    },
                                                })
                                            }
                                            placeholder="VD: 10"
                                        />
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label>
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
                                            Hỗ trợ ưu tiên 24/7
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-group checkbox-group">
                                <label>
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
                                    Kích hoạt gói
                                </label>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn-cancel" onClick={() => {
                                    setShowAddPlanModal(false);
                                    resetPlanForm();
                                }}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn-submit">
                                    Thêm
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Plan Modal */}
            {showEditPlanModal && editingPlan && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2>Sửa Gói Đăng Ký</h2>
                            <button
                                className="modal-close"
                                onClick={() => {
                                    setShowEditPlanModal(false);
                                    setEditingPlan(null);
                                    resetPlanForm();
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleEditPlan} className="modal-body">
                            <div className="form-group">
                                <label>Tên gói *</label>
                                <input
                                    type="text"
                                    required
                                    value={planFormData.name}
                                    onChange={(e) =>
                                        setPlanFormData({ ...planFormData, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giá (VNĐ) *</label>
                                    <input
                                        type="number"
                                        required
                                        value={planFormData.price}
                                        onChange={(e) =>
                                            setPlanFormData({ ...planFormData, price: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Giá gốc (VNĐ)</label>
                                    <input
                                        type="number"
                                        value={planFormData.originalPrice}
                                        onChange={(e) =>
                                            setPlanFormData({
                                                ...planFormData,
                                                originalPrice: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Mô tả</label>
                                <textarea
                                    value={planFormData.description}
                                    onChange={(e) =>
                                        setPlanFormData({
                                            ...planFormData,
                                            description: e.target.value,
                                        })
                                    }
                                    rows="3"
                                />
                            </div>
                            <div className="form-section">
                                <h3>Tính năng</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Số lần đặt lịch tối đa/tháng (-1 = không giới hạn)</label>
                                        <input
                                            type="number"
                                            value={planFormData.features.maxReservations}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxReservations: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Số xe tối đa (-1 = không giới hạn)</label>
                                        <input
                                            type="number"
                                            value={planFormData.features.maxVehicles}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        maxVehicles: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Giảm giá khi gia hạn (%)</label>
                                        <input
                                            type="number"
                                            value={planFormData.features.discount}
                                            onChange={(e) =>
                                                setPlanFormData({
                                                    ...planFormData,
                                                    features: {
                                                        ...planFormData.features,
                                                        discount: e.target.value,
                                                    },
                                                })
                                            }
                                        />
                                    </div>
                                    <div className="form-group checkbox-group">
                                        <label>
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
                                            Hỗ trợ ưu tiên 24/7
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Thứ tự hiển thị</label>
                                    <input
                                        type="number"
                                        value={planFormData.displayOrder}
                                        onChange={(e) =>
                                            setPlanFormData({
                                                ...planFormData,
                                                displayOrder: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="form-group checkbox-group">
                                    <label>
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
                                        Kích hoạt gói
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn-cancel"
                                    onClick={() => {
                                        setShowEditPlanModal(false);
                                        setEditingPlan(null);
                                        resetPlanForm();
                                    }}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="btn-submit">
                                    Cập nhật
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SUBSCRIPTIONS TAB */}
            {activeTab === "subscriptions" && (
                <div className="tab-content">
                    <div className="table-header">
                        <h2>Danh sách Đăng Ký Người Dùng</h2>
                        <button
                            className="btn-add"
                            onClick={() => {
                                resetSubscriptionForm();
                                setShowAddSubscriptionModal(true);
                            }}
                        >
                            + Thêm đăng ký mới
                        </button>
                    </div>

                    {loadingSubscriptions ? (
                        <div className="loading">Đang tải...</div>
                    ) : errorSubscriptions ? (
                        <div className="error">{errorSubscriptions}</div>
                    ) : (
                        <div className="table-container">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Gói đăng ký</th>
                                        <th>Trạng thái</th>
                                        <th>Ngày bắt đầu</th>
                                        <th>Ngày kết thúc</th>
                                        <th>Tự động gia hạn</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {subscriptions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="no-data">
                                                Không có dữ liệu
                                            </td>
                                        </tr>
                                    ) : (
                                        subscriptions.map((subscription) => (
                                            <tr key={subscription._id}>
                                                <td>
                                                    {subscription.user?.username ||
                                                        subscription.user?.fullName ||
                                                        subscription.userId ||
                                                        "N/A"}
                                                </td>
                                                <td>
                                                    {subscription.plan?.name ||
                                                        subscription.planId ||
                                                        "N/A"}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`badge badge-${subscription.status || "pending"}`}
                                                    >
                                                        {subscription.status || "pending"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {subscription.startDate
                                                        ? new Date(subscription.startDate).toLocaleDateString(
                                                            "vi-VN"
                                                        )
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {subscription.endDate
                                                        ? new Date(subscription.endDate).toLocaleDateString(
                                                            "vi-VN"
                                                        )
                                                        : "-"}
                                                </td>
                                                <td>
                                                    {subscription.autoRenew ? "✓ Có" : "✗ Không"}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() => handleEditClickSubscription(subscription)}
                                                        >
                                                            ✏️ Sửa
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() =>
                                                                handleDeleteSubscription(subscription._id)
                                                            }
                                                        >
                                                            🗑️ Xóa
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

                    {/* Add Subscription Modal */}
                    {showAddSubscriptionModal && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2>Thêm Đăng Ký Mới</h2>
                                    <button
                                        className="modal-close"
                                        onClick={() => {
                                            setShowAddSubscriptionModal(false);
                                            resetSubscriptionForm();
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleAddSubscription} className="modal-body">
                                    <div className="form-group">
                                        <label>Người dùng *</label>
                                        <select
                                            required
                                            value={subscriptionFormData.userId}
                                            onChange={(e) =>
                                                setSubscriptionFormData({
                                                    ...subscriptionFormData,
                                                    userId: e.target.value,
                                                })
                                            }
                                        >
                                            <option key="select-user" value="">Chọn người dùng</option>
                                            {usersList.map((user) => (
                                                <option key={user._id || user.id} value={user._id || user.id}>
                                                    {user.username} - {user.fullName || user.email}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Gói đăng ký *</label>
                                        <select
                                            required
                                            value={subscriptionFormData.planId}
                                            onChange={(e) =>
                                                setSubscriptionFormData({
                                                    ...subscriptionFormData,
                                                    planId: e.target.value,
                                                })
                                            }
                                        >
                                            <option key="select-plan" value="">Chọn gói</option>
                                            {plans.map((plan) => (
                                                <option key={plan._id} value={plan._id}>
                                                    {plan.name} - {formatPrice(plan.price)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Giá tùy chỉnh (VNĐ)</label>
                                            <input
                                                type="number"
                                                value={subscriptionFormData.customPrice}
                                                onChange={(e) =>
                                                    setSubscriptionFormData({
                                                        ...subscriptionFormData,
                                                        customPrice: e.target.value,
                                                    })
                                                }
                                                placeholder="Để trống nếu dùng giá mặc định"
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
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => {
                                                setShowAddSubscriptionModal(false);
                                                resetSubscriptionForm();
                                            }}
                                        >
                                            Hủy
                                        </button>
                                        <button type="submit" className="btn-submit">
                                            Thêm
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Subscription Modal */}
                    {showEditSubscriptionModal && editingSubscription && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h2>Sửa Đăng Ký</h2>
                                    <button
                                        className="modal-close"
                                        onClick={() => {
                                            setShowEditSubscriptionModal(false);
                                            setEditingSubscription(null);
                                            resetSubscriptionForm();
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleEditSubscription} className="modal-body">
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
                                            <option key="pending" value="pending">Pending</option>
                                            <option key="active" value="active">Active</option>
                                            <option key="current_active" value="current_active">Current Active</option>
                                            <option key="expired" value="expired">Expired</option>
                                            <option key="cancelled" value="cancelled">Cancelled</option>
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
                                    <div className="modal-footer">
                                        <button
                                            type="button"
                                            className="btn-cancel"
                                            onClick={() => {
                                                setShowEditSubscriptionModal(false);
                                                setEditingSubscription(null);
                                                resetSubscriptionForm();
                                            }}
                                        >
                                            Hủy
                                        </button>
                                        <button type="submit" className="btn-submit">
                                            Cập nhật
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
export default SubscriptionManagement;


