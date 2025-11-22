import { useState, useEffect, useMemo } from "react"; // Import các hooks React cần thiết
import "./index.scss"; // Import file styles SCSS
import api from "../../../config/api"; // Import cấu hình API để gọi backend

const SubscriptionManagement = () => {
  // ==================== STATE QUẢN LÝ TABS ====================
  const [activeTab, setActiveTab] = useState("plans"); // State lưu tab đang active, mặc định là "plans"

  // ==================== STATE CHO TAB SUBSCRIPTION PLANS ====================
  const [plans, setPlans] = useState([]); // State lưu danh sách các gói đăng ký
  const [loadingPlans, setLoadingPlans] = useState(true); // State theo dõi trạng thái loading khi fetch plans
  const [errorPlans, setErrorPlans] = useState(null); // State lưu lỗi nếu có khi fetch plans
  const [showAddPlanModal, setShowAddPlanModal] = useState(false); // State điều khiển hiển thị modal thêm plan
  const [showEditPlanModal, setShowEditPlanModal] = useState(false); // State điều khiển hiển thị modal sửa plan
  const [editingPlan, setEditingPlan] = useState(null); // State lưu plan đang được chỉnh sửa
  const [planFormData, setPlanFormData] = useState({
    // State lưu dữ liệu form khi thêm/sửa plan
    name: "", // Tên gói đăng ký
    type: "basic", // Loại gói: basic, standard, premium
    duration: "1_month", // Thời hạn gói: 1_month, 6_months, 12_months
    durationDays: 30, // Số ngày tương ứng với duration
    price: "", // Giá bán của gói
    originalPrice: "", // Giá gốc trước khi giảm (nếu có)
    description: "", // Mô tả chi tiết về gói
    features: {
      // Đối tượng chứa các tính năng của gói
      maxReservations: "", // Số lần đặt lịch tối đa (-1 = không giới hạn)
      maxVehicles: "", // Số xe tối đa người dùng có thể thêm
      prioritySupport: false, // Có hỗ trợ ưu tiên hay không
      discount: "", // Phần trăm giảm giá khi gia hạn
    },
    isActive: true, // Trạng thái kích hoạt của gói
    displayOrder: 0, // Thứ tự hiển thị gói trên giao diện
  });

  // ==================== STATE CHO TAB SUBSCRIPTIONS ====================
  const [subscriptions, setSubscriptions] = useState([]); // State lưu danh sách đăng ký của người dùng
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(true); // State theo dõi loading khi fetch subscriptions
  const [errorSubscriptions, setErrorSubscriptions] = useState(null); // State lưu lỗi khi fetch subscriptions
  const [showAddSubscriptionModal, setShowAddSubscriptionModal] =
    useState(false); // State điều khiển modal thêm subscription
  const [showEditSubscriptionModal, setShowEditSubscriptionModal] =
    useState(false); // State điều khiển modal sửa subscription
  const [editingSubscription, setEditingSubscription] = useState(null); // State lưu subscription đang được chỉnh sửa
  const [showSubscriptionDetailModal, setShowSubscriptionDetailModal] =
    useState(false); // State điều khiển modal xem chi tiết subscription
  const [selectedSubscription, setSelectedSubscription] = useState(null); // State lưu subscription được chọn để xem chi tiết
  const [subscriptionFormData, setSubscriptionFormData] = useState({
    // State lưu dữ liệu form khi thêm/sửa subscription
    userId: "", // ID của người dùng
    planId: "", // ID của gói đăng ký
    autoRenew: false, // Có tự động gia hạn hay không
    customPrice: "", // Giá tùy chỉnh (nếu có)
    status: "pending", // Trạng thái đăng ký: pending, active, cancelled, expired
    endDate: "", // Ngày kết thúc đăng ký
  });
  const [usersList, setUsersList] = useState([]); // State lưu danh sách users để hiển thị trong dropdown

  // ==================== STATE PHÂN TRANG ====================
  const [currentPagePlans, setCurrentPagePlans] = useState(1); // State lưu trang hiện tại của danh sách plans
  const [currentPageSubscriptions, setCurrentPageSubscriptions] = useState(1); // State lưu trang hiện tại của danh sách subscriptions
  const pageSize = 10; // Số lượng item hiển thị trên mỗi trang

  // ==================== TÍNH TOÁN THỐNG KÊ CHO PLANS ====================
  const totalPlans = plans.length; // Tổng số gói đăng ký
  const activePlans = plans.filter((plan) => plan.isActive).length; // Đếm số gói đang kích hoạt
  const premiumPlans = plans.filter((plan) => plan.type === "premium").length; // Đếm số gói premium
  const planSummaryCards = useMemo(
    // Sử dụng useMemo để tối ưu, chỉ tính lại khi dependencies thay đổi
    () => [
      { label: "Tổng gói", value: totalPlans }, // Card hiển thị tổng số gói
      { label: "Đang kích hoạt", value: activePlans }, // Card hiển thị số gói active
      { label: "Gói premium", value: premiumPlans }, // Card hiển thị số gói premium
    ],
    [totalPlans, activePlans, premiumPlans] // Dependencies - chỉ tính lại khi 3 giá trị này thay đổi
  );

  // ==================== TÍNH TOÁN THỐNG KÊ CHO SUBSCRIPTIONS ====================
  const totalSubscriptions = subscriptions.length; // Tổng số đăng ký
  const activeSubscriptions = subscriptions.filter(
    // Đếm số đăng ký đang hoạt động
    (sub) => sub.status === "active"
  ).length;
  const pendingSubscriptions = subscriptions.filter(
    // Đếm số đăng ký đang chờ xử lý
    (sub) => sub.status === "pending"
  ).length;
  const subscriptionSummaryCards = useMemo(
    // Tối ưu với useMemo
    () => [
      { label: "Tổng đăng ký", value: totalSubscriptions }, // Card tổng đăng ký
      { label: "Hoạt động", value: activeSubscriptions }, // Card đăng ký active
      { label: "Chờ xử lý", value: pendingSubscriptions }, // Card đăng ký pending
    ],
    [totalSubscriptions, activeSubscriptions, pendingSubscriptions] // Dependencies
  );

  // ==================== EFFECT SCROLL TO TOP ====================
  useEffect(() => {
    // Effect chạy khi component mount
    window.scrollTo(0, 0); // Cuộn trang về đầu
  }, []); // Empty dependency array - chỉ chạy 1 lần khi mount

  // ==================== HÀM XỬ LÝ SUBSCRIPTION PLANS ====================

  // Hàm GET - Lấy danh sách subscription plans từ API
  const fetchPlans = async () => {
    try {
      setLoadingPlans(true); // Bật trạng thái loading
      const response = await api.get("/subscription-plans"); // Gọi API lấy danh sách plans

      let plansData = []; // Biến tạm lưu dữ liệu plans
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Kiểm tra response có success và data là array
        plansData = response.data.data;
      } else if (Array.isArray(response.data)) {
        // Kiểm tra response.data là array
        plansData = response.data;
      } else if (Array.isArray(response.data.data)) {
        // Kiểm tra response.data.data là array
        plansData = response.data.data;
      }

      setPlans(plansData); // Cập nhật state plans với dữ liệu vừa lấy
      setErrorPlans(null); // Reset lỗi về null
    } catch (err) {
      // Bắt lỗi nếu có
      console.error("Error fetching plans:", err); // Log lỗi ra console
      setErrorPlans(err.message || "Không thể tải danh sách gói đăng ký"); // Set error message
    } finally {
      setLoadingPlans(false); // Tắt loading trong mọi trường hợp
    }
  };

  // Hàm POST - Tạo subscription plan mới (chỉ Admin)
  const handleAddPlan = async (e) => {
    e.preventDefault(); // Ngăn form submit mặc định reload trang

    // ==================== VALIDATE DỮ LIỆU ====================
    if (!planFormData.name?.trim()) {
      // Kiểm tra tên gói không được rỗng
      alert("Vui lòng nhập tên gói");
      return; // Dừng hàm nếu validation fail
    }
    if (!planFormData.price || Number(planFormData.price) <= 0) {
      // Kiểm tra giá phải là số dương
      alert("Vui lòng nhập giá hợp lệ (số dương)");
      return;
    }
    if (!planFormData.durationDays || Number(planFormData.durationDays) <= 0) {
      // Kiểm tra số ngày phải là số dương
      alert("Vui lòng nhập số ngày hợp lệ (số dương)");
      return;
    }

    try {
      // ==================== XỬ LÝ FEATURES DATA ====================
      const featuresData = {}; // Object lưu features đã xử lý

      // Xử lý maxReservations
      if (
        planFormData.features.maxReservations !== "" && // Kiểm tra không rỗng
        planFormData.features.maxReservations !== null && // Kiểm tra không null
        planFormData.features.maxReservations !== undefined // Kiểm tra không undefined
      ) {
        const maxRes = Number(planFormData.features.maxReservations); // Convert sang số
        featuresData.maxReservations = !isNaN(maxRes) ? maxRes : -1; // Nếu là số hợp lệ thì dùng, không thì -1
      } else {
        featuresData.maxReservations = -1; // Nếu rỗng thì mặc định -1 (không giới hạn)
      }

      // Xử lý maxVehicles tương tự maxReservations
      if (
        planFormData.features.maxVehicles !== "" &&
        planFormData.features.maxVehicles !== null &&
        planFormData.features.maxVehicles !== undefined
      ) {
        const maxVeh = Number(planFormData.features.maxVehicles); // Convert sang số
        featuresData.maxVehicles = !isNaN(maxVeh) ? maxVeh : -1; // Validate
      } else {
        featuresData.maxVehicles = -1; // Mặc định -1
      }

      // Xử lý prioritySupport - luôn là boolean
      featuresData.prioritySupport = Boolean(
        planFormData.features.prioritySupport // Convert sang boolean
      );

      // Xử lý discount - chỉ gửi nếu có giá trị > 0
      if (
        planFormData.features.discount !== "" &&
        planFormData.features.discount !== null &&
        planFormData.features.discount !== undefined
      ) {
        const discount = Number(planFormData.features.discount); // Convert sang số
        if (!isNaN(discount) && discount > 0) {
          // Chỉ add vào object nếu là số dương
          featuresData.discount = discount;
        }
      }

      // ==================== CHUẨN BỊ DATA GỬI API ====================
      const dataToSend = {
        name: planFormData.name.trim(), // Trim khoảng trắng thừa
        type: planFormData.type, // Loại gói
        duration: planFormData.duration, // Thời hạn
        durationDays: Number(planFormData.durationDays), // Convert số ngày sang số
        price: Number(planFormData.price), // Convert giá sang số
        // Xử lý giá gốc
        originalPrice:
          planFormData.originalPrice && planFormData.originalPrice !== "" // Nếu có giá gốc
            ? Number(planFormData.originalPrice) // Thì convert sang số
            : undefined, // Không thì undefined (không gửi field này)
        description: planFormData.description?.trim() || "", // Trim mô tả hoặc rỗng
        features: featuresData, // Object features đã xử lý
        isActive: Boolean(planFormData.isActive), // Convert sang boolean
        displayOrder: Number(planFormData.displayOrder) || 0, // Convert thứ tự hoặc mặc định 0
      };

      await api.post("/subscription-plans", dataToSend); // Gọi API POST để tạo plan mới
      alert("Tạo gói đăng ký thành công!"); // Thông báo thành công
      setShowAddPlanModal(false); // Đóng modal
      resetPlanForm(); // Reset form về trạng thái ban đầu
      fetchPlans(); // Fetch lại danh sách plans để cập nhật
    } catch (err) {
      // Bắt lỗi
      console.error("Error adding plan:", err); // Log lỗi
      const errorMessage = // Lấy message lỗi từ nhiều nguồn có thể
        err.response?.data?.message || // Từ response message
        err.response?.data?.error || // Hoặc từ response error
        err.message || // Hoặc từ error message
        "Không thể tạo gói đăng ký"; // Hoặc message mặc định
      alert(errorMessage); // Hiển thị lỗi
    }
  };

  // Hàm PUT - Cập nhật subscription plan (chỉ Admin)
  const handleEditPlan = async (e) => {
    e.preventDefault(); // Ngăn reload trang
    if (!editingPlan) return; // Không có plan đang edit thì return

    try {
      const dataToSend = {
        // Chuẩn bị data để update
        name: planFormData.name, // Tên mới
        price: Number(planFormData.price), // Giá mới
        originalPrice: planFormData.originalPrice // Giá gốc mới
          ? Number(planFormData.originalPrice)
          : undefined, // Undefined nếu không có
        features: {
          // Features mới
          maxReservations: planFormData.features.maxReservations // Max reservations
            ? Number(planFormData.features.maxReservations)
            : -1, // -1 nếu rỗng
          maxVehicles: planFormData.features.maxVehicles // Max vehicles
            ? Number(planFormData.features.maxVehicles)
            : -1,
          prioritySupport: planFormData.features.prioritySupport, // Priority support
          discount: planFormData.features.discount // Discount
            ? Number(planFormData.features.discount)
            : undefined, // Undefined nếu không có
        },
        description: planFormData.description, // Mô tả mới
        isActive: planFormData.isActive, // Trạng thái mới
        displayOrder: Number(planFormData.displayOrder), // Thứ tự mới
      };

      await api.put(`/subscription-plans/${editingPlan._id}`, dataToSend); // Gọi API PUT với ID plan
      alert("Cập nhật gói đăng ký thành công!"); // Thông báo thành công
      setShowEditPlanModal(false); // Đóng modal
      setEditingPlan(null); // Clear plan đang edit
      resetPlanForm(); // Reset form
      fetchPlans(); // Fetch lại danh sách
    } catch (err) {
      // Bắt lỗi
      console.error("Error updating plan:", err); // Log lỗi
      alert(err.response?.data?.message || "Không thể cập nhật gói đăng ký"); // Hiển thị lỗi
    }
  };

  // Hàm DELETE - Xóa subscription plan (chỉ Admin)
  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa gói đăng ký này?")) return; // Xác nhận trước khi xóa

    try {
      await api.delete(`/subscription-plans/${planId}`); // Gọi API DELETE với ID plan
      alert("Xóa gói đăng ký thành công!"); // Thông báo thành công
      fetchPlans(); // Fetch lại danh sách để cập nhật
    } catch (err) {
      // Bắt lỗi
      console.error("Error deleting plan:", err); // Log lỗi
      alert(err.response?.data?.message || "Không thể xóa gói đăng ký"); // Hiển thị lỗi
    }
  };

  // Hàm reset form subscription plan về trạng thái ban đầu
  const resetPlanForm = () => {
    setPlanFormData({
      // Set lại toàn bộ form data về giá trị mặc định
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

  // Hàm mở modal edit plan
  const handleEditClickPlan = (plan) => {
    setEditingPlan(plan); // Set plan đang được edit
    setPlanFormData({
      // Điền dữ liệu plan vào form
      name: plan.name || "", // Tên plan hoặc rỗng
      type: plan.type || "basic", // Type hoặc mặc định basic
      duration: plan.duration || "1_month", // Duration hoặc mặc định 1_month
      durationDays: plan.durationDays || 30, // Days hoặc mặc định 30
      price: plan.price || "", // Giá hoặc rỗng
      originalPrice: plan.originalPrice || "", // Giá gốc hoặc rỗng
      description: plan.description || "", // Mô tả hoặc rỗng
      features: {
        // Features
        // Nếu là -1 thì để rỗng, không thì lấy giá trị
        maxReservations:
          plan.features?.maxReservations === -1
            ? ""
            : plan.features?.maxReservations || "",
        // Tương tự maxReservations
        maxVehicles:
          plan.features?.maxVehicles === -1
            ? ""
            : plan.features?.maxVehicles || "",
        prioritySupport: plan.features?.prioritySupport || false, // Priority support
        discount: plan.features?.discount || "", // Discount
      },
      isActive: plan.isActive !== undefined ? plan.isActive : true, // Active hoặc mặc định true
      displayOrder: plan.displayOrder || 0, // Display order hoặc 0
    });
    setShowEditPlanModal(true); // Mở modal edit
  };

  // ==================== HÀM XỬ LÝ SUBSCRIPTIONS ====================

  // Hàm GET - Lấy danh sách users để hiển thị trong dropdown khi tạo subscription
  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/get-all"); // Gọi API lấy danh sách users
      let usersData = []; // Biến tạm lưu users
      if (Array.isArray(response.data)) {
        // Nếu response.data là array
        usersData = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Hoặc response.data.data là array
        usersData = response.data.data;
      }
      setUsersList(usersData); // Cập nhật state usersList
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching users:", err); // Log lỗi
    }
  };

  // Hàm GET - Lấy danh sách subscriptions từ API
  const fetchSubscriptions = async () => {
    try {
      setLoadingSubscriptions(true); // Bật loading
      const response = await api.get("/subscriptions"); // Gọi API lấy subscriptions

      let subscriptionsData = []; // Biến tạm
      if (response.data?.success && Array.isArray(response.data.data)) {
        // Kiểm tra nhiều cấu trúc response
        subscriptionsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        subscriptionsData = response.data;
      } else if (Array.isArray(response.data.data)) {
        subscriptionsData = response.data.data;
      }

      setSubscriptions(subscriptionsData); // Cập nhật state
      setErrorSubscriptions(null); // Reset lỗi
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching subscriptions:", err); // Log lỗi
      setErrorSubscriptions(err.message || "Không thể tải danh sách đăng ký"); // Set error
    } finally {
      setLoadingSubscriptions(false); // Tắt loading
    }
  };

  // Hàm POST - Tạo subscription mới cho user (chỉ Admin)
  const handleAddSubscription = async (e) => {
    e.preventDefault(); // Ngăn reload
    try {
      const dataToSend = {
        // Chuẩn bị data
        userId: subscriptionFormData.userId, // ID user
        planId: subscriptionFormData.planId, // ID plan
        autoRenew: subscriptionFormData.autoRenew, // Auto renew
        customPrice: subscriptionFormData.customPrice // Custom price
          ? Number(subscriptionFormData.customPrice)
          : undefined, // Undefined nếu không có
      };

      await api.post("/subscriptions", dataToSend); // Gọi API POST
      alert("Tạo đăng ký thành công!"); // Thông báo
      setShowAddSubscriptionModal(false); // Đóng modal
      resetSubscriptionForm(); // Reset form
      fetchSubscriptions(); // Fetch lại danh sách
    } catch (err) {
      // Bắt lỗi
      console.error("Error adding subscription:", err); // Log
      alert(err.response?.data?.message || "Không thể tạo đăng ký"); // Alert lỗi
    }
  };

  // Hàm PUT - Cập nhật subscription (chỉ Admin)
  const handleEditSubscription = async (e) => {
    e.preventDefault(); // Ngăn reload
    if (!editingSubscription) return; // Không có subscription đang edit thì return

    try {
      const dataToSend = {
        // Data để update
        status: subscriptionFormData.status, // Status mới
        autoRenew: subscriptionFormData.autoRenew, // Auto renew mới
        endDate: subscriptionFormData.endDate || undefined, // End date mới hoặc undefined
      };

      await api.put(`/subscriptions/${editingSubscription._id}`, dataToSend); // Gọi API PUT
      alert("Cập nhật đăng ký thành công!"); // Thông báo
      setShowEditSubscriptionModal(false); // Đóng modal
      setEditingSubscription(null); // Clear editing
      resetSubscriptionForm(); // Reset form
      fetchSubscriptions(); // Fetch lại
    } catch (err) {
      // Bắt lỗi
      console.error("Error updating subscription:", err); // Log
      alert(err.response?.data?.message || "Không thể cập nhật đăng ký"); // Alert lỗi
    }
  };

  // Hàm DELETE - Xóa subscription (chỉ Admin - soft delete)
  const handleDeleteSubscription = async (subscriptionId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa đăng ký này?")) return; // Xác nhận

    try {
      await api.delete(`/subscriptions/${subscriptionId}`); // Gọi API DELETE
      alert("Xóa đăng ký thành công!"); // Thông báo
      fetchSubscriptions(); // Fetch lại danh sách
    } catch (err) {
      // Bắt lỗi
      console.error("Error deleting subscription:", err); // Log
      alert(err.response?.data?.message || "Không thể xóa đăng ký"); // Alert lỗi
    }
  };

  // Hàm reset form subscription về trạng thái ban đầu
  const resetSubscriptionForm = () => {
    setSubscriptionFormData({
      // Set lại form về mặc định
      userId: "",
      planId: "",
      autoRenew: false,
      customPrice: "",
      status: "pending",
      endDate: "",
    });
  };

  // Hàm mở modal edit subscription
  const handleEditClickSubscription = (subscription) => {
    // Cập nhật phiên đăng ký đang chỉnh sửa và điền dữ liệu vào form
    setEditingSubscription(subscription);
    setSubscriptionFormData({
      userId:
        subscription.user?.id ||
        subscription.user?._id ||
        subscription.userId ||
        "",
      planId:
        subscription.plan?.id ||
        subscription.plan?._id ||
        subscription.planId ||
        subscription.metadata?.planId ||
        "",
      autoRenew: subscription.autoRenew || false,
      customPrice: subscription.customPrice || "",
      status: subscription.status || "pending",
      endDate: subscription.endDate
        ? new Date(subscription.endDate).toISOString().split("T")[0]
        : "",
    });
    setShowEditSubscriptionModal(true);
  };

  // ==================== HÀM FORMAT DỮ LIỆU HIỂN THỊ ====================

  // Hàm format giá tiền theo định dạng Việt Nam
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price) + " VNĐ"; // Format số + thêm VNĐ
  };

  // Hàm format duration thành text hiển thị
  const durationDaysLabelMap = {
    30: "1 tháng",
    180: "6 tháng",
    365: "12 tháng",
  };

  const formatDuration = (duration) => {
    if (duration === undefined || duration === null || duration === "") {
      return "—";
    }
    if (typeof duration === "number") {
      return durationDaysLabelMap[duration] || `${duration} ngày`;
    }

    const durationMap = {
      "1_month": "1 tháng",
      "6_months": "6 tháng",
      "12_months": "12 tháng",
    };

    return durationMap[duration] || duration || "—";
  };

  const getUserDisplayName = (user) =>
    user?.profile?.fullName ||
    user?.fullName ||
    user?.username ||
    user?.email ||
    "Không rõ";

  const getSubscriptionPlanName = (subscription) =>
    subscription.plan?.name ||
    subscription.planName ||
    subscription.metadata?.planName ||
    "Không rõ";

  const getSubscriptionDurationLabel = (subscription) => {
    const durationSource =
      subscription.plan?.duration ||
      subscription.duration ||
      subscription.planDuration ||
      subscription.metadata?.duration ||
      subscription.metadata?.durationDays;
    return formatDuration(durationSource);
  };

  // Hàm format ngày tháng theo định dạng Việt Nam
  const formatDateDisplay = (value) => {
    if (!value) return "—"; // Nếu không có giá trị thì trả về "—"
    try {
      return new Date(value).toLocaleDateString("vi-VN"); // Convert sang date format VN
    } catch (error) {
      // Nếu lỗi
      return value; // Trả về giá trị gốc
    }
  };

  // Hàm format loại plan thành text hiển thị
  const formatPlanTypeLabel = (type = "") => {
    const map = {
      // Map type sang label
      basic: "Basic",
      standard: "Standard",
      premium: "Premium",
    };
    return map[type] || type || "Không rõ"; // Trả về label hoặc giá trị gốc hoặc "Không rõ"
  };

  // Hàm xác định tone/màu cho plan type chip
  const getPlanTypeTone = (type = "basic") => {
    if (type === "premium") return "premium"; // Premium -> tone premium
    if (type === "standard") return "standard"; // Standard -> tone standard
    return "basic"; // Còn lại -> tone basic
  };

  // Hàm format text trạng thái plan
  const formatPlanStatusText = (isActive) =>
    isActive ? "Đang kích hoạt" : "Tạm dừng"; // True -> "Đang kích hoạt", False -> "Tạm dừng"

  // Hàm xác định tone/màu cho trạng thái plan
  const getPlanStatusTone = (isActive) => (isActive ? "active" : "inactive"); // True -> "active", False -> "inactive"

  // Hàm xác định tone/màu cho trạng thái subscription
  const getSubscriptionStatusTone = (status = "") => {
    const normalized = status.toLowerCase();
    if (normalized === "active" || normalized === "current_active") return "success";
    if (normalized === "pending") return "warning";
    if (normalized === "cancelled" || normalized === "expired") return "danger";
    return "default";
  };

  // Hàm format text trạng thái subscription
  const formatSubscriptionStatus = (status = "") => {
    const normalized = status.toLowerCase(); // Lowercase
    const labels = {
      active: "Hoạt động",
      current_active: "Hoạt động",
      pending: "Chờ xử lý",
      cancelled: "Đã huỷ",
      expired: "Hết hạn",
    };
    return labels[normalized] || status || "Không rõ"; // Trả về label hoặc giá trị gốc hoặc "Không rõ"
  };

  // Hàm format auto renew thành text
  const formatAutoRenewLabel = (autoRenew) =>
    autoRenew ? "Tự động" : "Thủ công"; // True -> "Tự động", False -> "Thủ công"

  // Hàm GET - Lấy chi tiết 1 subscription theo ID
  const fetchSubscriptionDetail = async (subscriptionId) => {
    try {
      const response = await api.get(`/subscriptions/${subscriptionId}`); // Gọi API GET chi tiết
      return response.data?.data || response.data; // Trả về data
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching subscription detail:", err); // Log
      alert("Không thể tải chi tiết đăng ký"); // Alert
      return null; // Trả về null
    }
  };

  // Hàm mở modal xem chi tiết subscription
  const openSubscriptionDetailModal = async (subscriptionId) => {
    const detail = await fetchSubscriptionDetail(subscriptionId); // Fetch chi tiết
    if (detail) {
      // Nếu có data
      setSelectedSubscription(detail); // Set vào state
      setShowSubscriptionDetailModal(true); // Mở modal
    }
  };

  // Hàm đóng modal chi tiết subscription
  const closeSubscriptionDetailModal = () => {
    setSelectedSubscription(null); // Clear selected
    setShowSubscriptionDetailModal(false); // Đóng modal
  };

  // ==================== EFFECTS ====================

  // Effect load data khi component mount
  useEffect(() => {
    fetchPlans(); // Fetch plans
    fetchUsers(); // Fetch users
  }, []); // Empty deps - chỉ chạy 1 lần khi mount

  // Effect fetch subscriptions khi chuyển sang tab subscriptions
  useEffect(() => {
    if (activeTab === "subscriptions") {
      // Nếu tab active là subscriptions
      fetchSubscriptions(); // Thì fetch subscriptions
    }
  }, [activeTab]); // Chạy lại khi activeTab thay đổi

  // Hàm render modal cho plan (thêm hoặc sửa)
  const renderPlanModal = (variant) => {
    const isEdit = variant === "edit"; // Check xem là edit hay add
    const isVisible = isEdit ? showEditPlanModal : showAddPlanModal; // Lấy state visible tương ứng
    if (!isVisible) return null; // Không visible thì return null

    // Các biến dynamic dựa trên variant
    const title = isEdit ? "Chỉnh sửa gói đăng ký" : "Thêm gói đăng ký mới"; // Title modal
    const description = isEdit // Description modal
      ? "Cập nhật thông tin gói hiện tại."
      : "Tạo gói đăng ký mới cho hệ thống.";
    const primaryLabel = isEdit ? "Cập nhật gói" : "Thêm gói mới"; // Label button submit
    const primaryIcon = isEdit ? "✓" : "➕"; // Icon button submit
    const modalIcon = isEdit ? "✏️" : "📦"; // Icon header modal
    const handleSubmit = isEdit ? handleEditPlan : handleAddPlan; // Handler submit
    const handleClose = () => {
      // Handler đóng modal
      if (isEdit) {
        // Nếu là edit
        setShowEditPlanModal(false); // Đóng modal edit
        setEditingPlan(null); // Clear editing
      } else {
        // Nếu là add
        setShowAddPlanModal(false); // Đóng modal add
      }
      resetPlanForm(); // Reset form
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
            Theo dõi cấu trúc giá, ưu đãi và vòng đời đăng ký của khách hàng
            trên cùng một không gian làm việc.
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
          className={`tab-chip ${
            activeTab === "subscriptions" ? "active" : ""
          }`}
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
                          <span
                            className={`chip chip-${getPlanTypeTone(
                              plan.type
                            )}`}
                          >
                            {formatPlanTypeLabel(plan.type)}
                          </span>
                        </td>
                        <td>{formatDuration(plan.duration)}</td>
                        <td>{formatPrice(plan.price)}</td>
                        <td>
                          {plan.originalPrice
                            ? formatPrice(plan.originalPrice)
                            : "—"}
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${getPlanStatusTone(
                              plan.isActive
                            )}`}
                          >
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
            <button
              className="primary-btn secondary"
              onClick={() => {
                resetSubscriptionForm();
                setShowAddSubscriptionModal(true);
              }}
            >
              <span>+</span> Tạo đăng ký
            </button>
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
                      <td colSpan="6" className="no-data">
                        Chưa có đăng ký nào
                      </td>
                    </tr>
                  ) : (
                    subscriptions.map((subscription) => (
                      <tr key={subscription._id}>
                        <td className="plan-cell">
                          <p>{getUserDisplayName(subscription.user)}</p>
                          <span>{subscription.user?.email || "—"}</span>
                        </td>
                        <td className="plan-cell">
                          <p>{getSubscriptionPlanName(subscription)}</p>
                          <span>{getSubscriptionDurationLabel(subscription)}</span>
                        </td>
                        <td>
                          <span
                            className={`status-pill status-${getSubscriptionStatusTone(
                              subscription.status
                            )}`}
                          >
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
                                openSubscriptionDetailModal(subscription._id)
                              }
                            >
                              Xem
                            </button>
                            <button
                              type="button"
                              className="pill ghost"
                              onClick={() =>
                                handleEditClickSubscription(subscription)
                              }
                            >
                              Chỉnh sửa
                            </button>
                            <button
                              type="button"
                              className="pill danger"
                              onClick={() =>
                                handleDeleteSubscription(subscription._id)
                              }
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
        <div
          className="modal-overlay-new"
          onClick={closeSubscriptionDetailModal}
        >
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
              <button
                className="modal-close-new"
                onClick={closeSubscriptionDetailModal}
              >
                ✕
              </button>
            </div>

            <div className="form-new detail-grid">
              <div className="detail-card">
                <span>Khách hàng</span>
                <strong>{getUserDisplayName(selectedSubscription.user)}</strong>
                <p>{selectedSubscription.user?.email || "—"}</p>
              </div>
              <div className="detail-card">
                <span>Gói đăng ký</span>
                <strong>{getSubscriptionPlanName(selectedSubscription)}</strong>
                <p>{getSubscriptionDurationLabel(selectedSubscription)}</p>
              </div>
              <div className="detail-card">
                <span>Trạng thái</span>
                <strong>
                  {formatSubscriptionStatus(selectedSubscription.status)}
                </strong>
              </div>
              <div className="detail-card">
                <span>Gia hạn</span>
                <strong>
                  {formatAutoRenewLabel(selectedSubscription.autoRenew)}
                </strong>
              </div>
              <div className="detail-card">
                <span>Ngày bắt đầu</span>
                <strong>
                  {formatDateDisplay(selectedSubscription.startDate)}
                </strong>
              </div>
              <div className="detail-card">
                <span>Ngày kết thúc</span>
                <strong>
                  {formatDateDisplay(selectedSubscription.endDate)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Add Subscription Modal */}
      {showAddSubscriptionModal && (
        <div
          className="modal-overlay-new"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddSubscriptionModal(false);
              resetSubscriptionForm();
            }
          }}
        >
          <div className="modal-content-new edit-modal">
            <div className="modal-header-new">
              <div className="modal-title-section">
                <div className="modal-icon">➕</div>
                <div>
                  <h2>Thêm Đăng Ký Mới</h2>
                  <p>Chọn người dùng &amp; gói để kích hoạt dịch vụ nhanh chóng.</p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-new"
                onClick={() => {
                  setShowAddSubscriptionModal(false);
                  resetSubscriptionForm();
                }}
              >
                ✕
              </button>
            </div>
            <form
              onSubmit={handleAddSubscription}
              className="form-new edit-grid"
            >
              <div className="form-row">
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
                    <option key="select-user" value="">
                      Chọn người dùng
                    </option>
                    {usersList.map((user) => (
                      <option
                        key={user._id || user.id}
                        value={user._id || user.id}
                      >
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
                    <option key="select-plan" value="">
                      Chọn gói
                    </option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name} - {formatPrice(plan.price)}
                      </option>
                    ))}
                  </select>
                </div>
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
              <div className="form-footer-new">
                <button
                  type="button"
                  className="btn-cancel-new"
                  onClick={() => {
                    setShowAddSubscriptionModal(false);
                    resetSubscriptionForm();
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="btn-submit-new">
                  Thêm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Subscription Modal */}
      {showEditSubscriptionModal && editingSubscription && (
        <div
          className="modal-overlay-new"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditSubscriptionModal(false);
              setEditingSubscription(null);
              resetSubscriptionForm();
            }
          }}
        >
          <div className="modal-content-new edit-modal">
            <div className="modal-header-new">
              <div className="modal-title-section">
                <div className="modal-icon">✏️</div>
                <div>
                  <h2>Sửa Đăng Ký</h2>
                  <p>Cập nhật trạng thái hoặc thời hạn kết thúc nhiều hơn.</p>
                </div>
              </div>
              <button
                type="button"
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
            <form
              onSubmit={handleEditSubscription}
              className="form-new edit-grid"
            >
              <div className="form-row">
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
                    <option key="pending" value="pending">
                      Pending
                    </option>
                    <option key="active" value="active">
                      Active
                    </option>
                    <option key="current_active" value="current_active">
                      Current Active
                    </option>
                    <option key="expired" value="expired">
                      Expired
                    </option>
                    <option key="cancelled" value="cancelled">
                      Cancelled
                    </option>
                  </select>
                </div>
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
              </div>
              <div className="checkbox-group">
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
