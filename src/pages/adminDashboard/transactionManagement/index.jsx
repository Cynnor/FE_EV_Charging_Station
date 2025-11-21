import { useState, useEffect } from "react"; // Import các hooks React cần thiết
import "./index.scss"; // Import file styles SCSS
import api from "../../../config/api"; // Import cấu hình API để gọi backend

const TransactionManagement = () => {
  // ==================== STATE QUẢN LÝ TRANSACTIONS ====================
  const [transactions, setTransactions] = useState([]); // State lưu danh sách giao dịch
  const [loading, setLoading] = useState(true); // State theo dõi trạng thái loading khi fetch data
  const [error, setError] = useState(null); // State lưu thông báo lỗi nếu có

  // ==================== STATE FILTERS ====================
  const [filters, setFilters] = useState({
    // State lưu các bộ lọc tìm kiếm
    status: "", // Lọc theo trạng thái giao dịch (success, failed, pending...)
    paymentMethod: "", // Lọc theo phương thức thanh toán (vnpay, cash, other)
    userId: "", // Lọc theo ID người dùng
    fromDate: "", // Lọc từ ngày (datetime)
    toDate: "", // Lọc đến ngày (datetime)
    minAmount: "", // Lọc số tiền tối thiểu
    maxAmount: "", // Lọc số tiền tối đa
  });

  // ==================== STATE PAGINATION ====================
  const [currentPage, setCurrentPage] = useState(1); // State lưu trang hiện tại
  const [pageSize] = useState(20); // Số lượng giao dịch hiển thị mỗi trang (constant)
  const [totalPages, setTotalPages] = useState(1); // Tổng số trang
  const [totalTransactions, setTotalTransactions] = useState(0); // Tổng số giao dịch

  // ==================== STATE STATISTICS ====================
  const [stats, setStats] = useState({
    // State lưu thống kê tổng quan
    totalAmount: 0, // Tổng doanh thu
    successCount: 0, // Số giao dịch thành công
    failedCount: 0, // Số giao dịch thất bại
    pendingCount: 0, // Số giao dịch đang chờ xử lý
  });

  // ==================== STATE MODAL DETAIL ====================
  const [selectedTransaction, setSelectedTransaction] = useState(null); // State lưu giao dịch được chọn để xem chi tiết
  const [showDetailModal, setShowDetailModal] = useState(false); // State điều khiển hiển thị modal chi tiết

  // ==================== STATE SORTING ====================
  const [sortBy, setSortBy] = useState("createdAt"); // State lưu field để sắp xếp (mặc định là createdAt)
  const [sortOrder, setSortOrder] = useState("desc"); // State lưu thứ tự sắp xếp (desc = giảm dần, asc = tăng dần)

  // ==================== EFFECT LOAD DATA ====================
  useEffect(() => {
    // Effect chạy khi component mount hoặc khi các dependencies thay đổi
    window.scrollTo(0, 0); // Cuộn trang về đầu
    fetchTransactions(); // Gọi hàm fetch data
  }, [currentPage, filters, sortBy, sortOrder]); // Dependencies - chạy lại khi các giá trị này thay đổi

  // ==================== HÀM FETCH TRANSACTIONS ====================
  const fetchTransactions = async () => {
    // Hàm async để lấy danh sách giao dịch từ API
    try {
      setLoading(true); // Bật trạng thái loading
      setError(null); // Reset lỗi về null

      // ==================== BUILD QUERY PARAMS ====================
      const params = {
        // Object chứa các query parameters
        page: currentPage, // Trang hiện tại
        limit: pageSize, // Số lượng item mỗi trang
        sortBy: sortBy, // Field để sort
        sortOrder: sortOrder, // Thứ tự sort (asc/desc)
        populate: "user", // Populate thông tin user (nếu backend hỗ trợ)
      };

      // ==================== ADD FILTERS TO PARAMS ====================
      if (filters.status) params.status = filters.status; // Thêm filter status nếu có
      if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod; // Thêm filter payment method nếu có
      if (filters.userId) params.userId = filters.userId; // Thêm filter userId nếu có
      if (filters.fromDate) params.fromDate = filters.fromDate; // Thêm filter fromDate nếu có
      if (filters.toDate) params.toDate = filters.toDate; // Thêm filter toDate nếu có
      if (filters.minAmount) params.minAmount = filters.minAmount; // Thêm filter minAmount nếu có
      if (filters.maxAmount) params.maxAmount = filters.maxAmount; // Thêm filter maxAmount nếu có

      const response = await api.get("/transactions", { params }); // Gọi API GET với params

      // ==================== HANDLE RESPONSE FORMATS ====================
      let transactionsData = []; // Biến tạm lưu dữ liệu transactions
      let paginationInfo = {}; // Biến tạm lưu thông tin pagination

      if (response.data?.success) {
        // Nếu response có success flag
        if (response.data.data?.items) {
          // Nếu data có items array
          transactionsData = response.data.data.items; // Lấy items
          paginationInfo = response.data.data.pagination || {}; // Lấy pagination info
        } else if (Array.isArray(response.data.data)) {
          // Nếu data là array
          transactionsData = response.data.data; // Lấy trực tiếp data
        }
      } else if (Array.isArray(response.data)) {
        // Nếu response.data là array
        transactionsData = response.data; // Lấy trực tiếp
      } else if (Array.isArray(response.data?.data)) {
        // Nếu response.data.data là array
        transactionsData = response.data.data; // Lấy data
      }

      setTransactions(transactionsData); // Cập nhật state transactions

      // ==================== UPDATE PAGINATION ====================
      if (paginationInfo.totalPages) {
        // Nếu có totalPages từ API
        setTotalPages(paginationInfo.totalPages); // Set totalPages
      } else {
        // Nếu không có từ API
        setTotalPages(Math.ceil(transactionsData.length / pageSize)); // Tính totalPages dựa trên data length
      }

      if (paginationInfo.total) {
        // Nếu có total từ API
        setTotalTransactions(paginationInfo.total); // Set total transactions
      } else {
        // Nếu không có
        setTotalTransactions(transactionsData.length); // Dùng length của data
      }

      // ==================== CALCULATE STATS ====================
      calculateStats(transactionsData); // Gọi hàm tính thống kê
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching transactions:", err); // Log lỗi ra console
      setError(
        err.response?.data?.message ||
          err.message ||
          "Không thể tải danh sách giao dịch"
      ); // Set error message
    } finally {
      setLoading(false); // Tắt loading trong mọi trường hợp
    }
  };

  // ==================== HÀM CALCULATE STATISTICS ====================
  const calculateStats = (transactionsData) => {
    // Hàm tính toán các thống kê từ data
    const stats = {
      // Object tạm lưu stats
      totalAmount: 0, // Tổng doanh thu khởi tạo = 0
      successCount: 0, // Số giao dịch thành công khởi tạo = 0
      failedCount: 0, // Số giao dịch thất bại khởi tạo = 0
      pendingCount: 0, // Số giao dịch pending khởi tạo = 0
    };

    transactionsData.forEach((transaction) => {
      // Duyệt qua từng transaction
      if (transaction.status === "success") {
        // Nếu status là success
        stats.successCount++; // Tăng counter success
        stats.totalAmount += transaction.amount || 0; // Cộng dồn amount vào tổng doanh thu
      } else if (transaction.status === "failed") {
        // Nếu status là failed
        stats.failedCount++; // Tăng counter failed
      } else if (
        transaction.status === "pending" ||
        transaction.status === "processing"
      ) {
        // Nếu status là pending hoặc processing
        stats.pendingCount++; // Tăng counter pending
      }
    });

    setStats(stats); // Cập nhật state stats
  };

  // ==================== HÀM XỬ LÝ FILTER CHANGE ====================
  const handleFilterChange = (key, value) => {
    // Hàm được gọi khi user thay đổi filter
    setFilters((prev) => ({
      // Cập nhật state filters
      ...prev, // Giữ nguyên các filter cũ
      [key]: value, // Cập nhật filter được thay đổi
    }));
    setCurrentPage(1); // Reset về trang 1 khi filter thay đổi
  };

  // ==================== HÀM RESET FILTERS ====================
  const resetFilters = () => {
    // Hàm reset tất cả filters về mặc định
    setFilters({
      // Set lại object filters về giá trị ban đầu
      status: "",
      paymentMethod: "",
      userId: "",
      fromDate: "",
      toDate: "",
      minAmount: "",
      maxAmount: "",
    });
    setCurrentPage(1); // Reset về trang 1
  };

  // ==================== HÀM VIEW DETAIL ====================
  const handleViewDetail = async (transactionId) => {
    // Hàm xem chi tiết giao dịch
    try {
      const response = await api.get(`/transactions/${transactionId}`); // Gọi API GET chi tiết transaction theo ID
      if (response.data?.success || response.data) {
        // Nếu có data
        const transaction = response.data.data || response.data; // Lấy transaction data
        setSelectedTransaction(transaction); // Set vào state
        setShowDetailModal(true); // Mở modal detail
      }
    } catch (err) {
      // Bắt lỗi
      console.error("Error fetching transaction detail:", err); // Log lỗi
      alert("Không thể tải chi tiết giao dịch"); // Alert thông báo lỗi
    }
  };

  // ==================== HÀM FORMAT CURRENCY ====================
  const formatCurrency = (amount) => {
    // Hàm format số tiền theo định dạng Việt Nam
    if (!amount && amount !== 0) return "—"; // Nếu không có giá trị thì trả về "—"
    return new Intl.NumberFormat("vi-VN", {
      // Sử dụng Intl.NumberFormat
      style: "currency", // Style là currency
      currency: "VND", // Đơn vị tiền tệ là VND
    }).format(amount); // Format amount
  };

  // ==================== HÀM FORMAT DATE ====================
  const formatDate = (dateString) => {
    // Hàm format ngày giờ
    if (!dateString) return "—"; // Nếu không có date thì trả về "—"
    const date = new Date(dateString); // Convert string sang Date object
    return date.toLocaleString("vi-VN", {
      // Format theo locale Việt Nam
      day: "2-digit", // Ngày 2 chữ số
      month: "2-digit", // Tháng 2 chữ số
      year: "numeric", // Năm đầy đủ
      hour: "2-digit", // Giờ 2 chữ số
      minute: "2-digit", // Phút 2 chữ số
    });
  };

  // ==================== HÀM GET STATUS BADGE CLASS ====================
  const getStatusBadgeClass = (status) => {
    // Hàm trả về class CSS cho status badge
    const statusMap = {
      // Map status sang class name
      success: "success", // Thành công -> class success
      failed: "failed", // Thất bại -> class failed
      pending: "pending", // Chờ xử lý -> class pending
      processing: "processing", // Đang xử lý -> class processing
      cancelled: "cancelled", // Đã hủy -> class cancelled
      refunded: "refunded", // Đã hoàn tiền -> class refunded
    };
    return statusMap[status] || "default"; // Trả về class tương ứng hoặc default
  };

  // ==================== HÀM GET STATUS TEXT ====================
  const getStatusText = (status) => {
    // Hàm trả về text hiển thị cho status
    const statusMap = {
      // Map status sang text tiếng Việt + emoji
      success: "✅ Thành công",
      failed: "❌ Thất bại",
      pending: "⏳ Chờ xử lý",
      processing: "🔄 Đang xử lý",
      cancelled: "🚫 Đã hủy",
      refunded: "↩️ Đã hoàn tiền",
    };
    return statusMap[status] || status; // Trả về text hoặc giá trị gốc nếu không tìm thấy
  };

  // ==================== HÀM GET PAYMENT METHOD TEXT ====================
  const getPaymentMethodText = (method) => {
    // Hàm trả về text hiển thị cho payment method
    const methodMap = {
      // Map method sang text + emoji
      vnpay: "💳 VNPay",
      cash: "💵 Tiền mặt",
      other: "🔷 Khác",
    };
    return methodMap[method] || method; // Trả về text hoặc giá trị gốc
  };

  // ==================== HÀM GET USER DISPLAY NAME ====================
  const getUserDisplayName = (transaction) => {
    // Hàm lấy tên hiển thị của user từ transaction
    if (!transaction) return "N/A"; // Nếu không có transaction thì return N/A
    const u = transaction.user || {}; // Lấy user object hoặc empty object
    return (
      // Return theo thứ tự ưu tiên
      u.fullName || // Ưu tiên fullName
      u.fullname || // Hoặc fullname (lowercase)
      u.name || // Hoặc name
      u.displayName || // Hoặc displayName
      u.username || // Hoặc username
      (u.email ? u.email.split("@")[0] : null) || // Hoặc phần trước @ của email
      transaction.email || // Hoặc email trực tiếp từ transaction
      transaction.payerEmail || // Hoặc payerEmail
      (transaction.userId
        ? `User ${String(transaction.userId).slice(-6)}`
        : null) || // Hoặc "User" + 6 ký tự cuối userId
      "N/A" // Cuối cùng là N/A nếu không có gì
    );
  };

  return (
    <div className="transaction-management">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1>Quản lý giao dịch</h1>
          <p>Xem và quản lý tất cả giao dịch trong hệ thống</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Tổng doanh thu</div>
            <div className="stat-value">
              {formatCurrency(stats.totalAmount)}
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-label">Giao dịch thành công</div>
            <div className="stat-value">{stats.successCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-label">Giao dịch thất bại</div>
            <div className="stat-value">{stats.failedCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-label">Đang chờ xử lý</div>
            <div className="stat-value">{stats.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
            >
              <option value="">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="cancelled">Đã hủy</option>
              <option value="refunded">Đã hoàn tiền</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Phương thức thanh toán</label>
            <select
              value={filters.paymentMethod}
              onChange={(e) =>
                handleFilterChange("paymentMethod", e.target.value)
              }
            >
              <option value="">Tất cả</option>
              <option value="vnpay">VNPay</option>
              <option value="cash">Tiền mặt</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="filter-group">
            <label>User ID</label>
            <input
              type="text"
              placeholder="Nhập User ID..."
              value={filters.userId}
              onChange={(e) => handleFilterChange("userId", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Từ ngày</label>
            <input
              type="datetime-local"
              value={filters.fromDate}
              onChange={(e) => handleFilterChange("fromDate", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Đến ngày</label>
            <input
              type="datetime-local"
              value={filters.toDate}
              onChange={(e) => handleFilterChange("toDate", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Số tiền từ (VNĐ)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.minAmount}
              onChange={(e) => handleFilterChange("minAmount", e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label>Số tiền đến (VNĐ)</label>
            <input
              type="number"
              placeholder="0"
              value={filters.maxAmount}
              onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
            />
          </div>
        </div>

        <div className="filter-actions">
          <button className="btn-reset" onClick={resetFilters}>
            🔄 Đặt lại
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="table-section">
        <div className="table-header">
          <h2>Danh sách giao dịch</h2>
          <div className="table-actions">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortBy(field);
                setSortOrder(order);
              }}
            >
              <option value="createdAt-desc">Mới nhất</option>
              <option value="createdAt-asc">Cũ nhất</option>
              <option value="amount-desc">Số tiền: Cao → Thấp</option>
              <option value="amount-asc">Số tiền: Thấp → Cao</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : error ? (
          <div className="error-container">
            <p>❌ {error}</p>
            <button className="btn-retry" onClick={fetchTransactions}>
              Thử lại
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="no-data">
            <p>Không có giao dịch nào</p>
          </div>
        ) : (
          <>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Số tiền</th>
                    <th>Phương thức</th>
                    <th>Trạng thái</th>
                    <th>Thời gian</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id || transaction.id}>
                      <td>
                        <div className="user-info">
                          <span className="user-name">
                            {getUserDisplayName(transaction)}
                          </span>
                          {/* {(transaction.user?.email || transaction.email || transaction.payerEmail) && (
                                                        <span className="user-email">{transaction.user?.email || transaction.email || transaction.payerEmail}</span>
                                                    )} */}
                        </div>
                      </td>
                      <td>
                        <span className="amount">
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td>
                        <span className="payment-method">
                          {getPaymentMethodText(transaction.paymentMethod)}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusBadgeClass(
                            transaction.status
                          )}`}
                        >
                          {getStatusText(transaction.status)}
                        </span>
                      </td>
                      <td>
                        <span className="date">
                          {formatDate(transaction.createdAt)}
                        </span>
                      </td>
                      <td>
                        <button
                          title="Chi tiết"
                          className="btn-view"
                          onClick={() =>
                            handleViewDetail(transaction._id || transaction.id)
                          }
                        >
                          👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <button
                className="pagination-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                ← Trước
              </button>
              <span className="pagination-info">
                Trang {currentPage} / {totalPages} (Tổng: {totalTransactions}{" "}
                giao dịch)
              </span>
              <button
                className="pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Sau →
              </button>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedTransaction && (
        <div
          className="modal-overlay"
          onClick={() => setShowDetailModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết giao dịch</h2>
              <button
                className="modal-close"
                onClick={() => setShowDetailModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>ID Giao dịch:</label>
                  <span>
                    {selectedTransaction._id || selectedTransaction.id}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Người dùng:</label>
                  <span>{getUserDisplayName(selectedTransaction)}</span>
                </div>
                {/* <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{selectedTransaction.user?.email || selectedTransaction.email || selectedTransaction.payerEmail || "N/A"}</span>
                                </div> */}
                <div className="detail-item">
                  <label>Số tiền:</label>
                  <span className="amount-large">
                    {formatCurrency(selectedTransaction.amount)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Phương thức:</label>
                  <span>
                    {getPaymentMethodText(selectedTransaction.paymentMethod)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Trạng thái:</label>
                  <span
                    className={`status-badge ${getStatusBadgeClass(
                      selectedTransaction.status
                    )}`}
                  >
                    {getStatusText(selectedTransaction.status)}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Thời gian:</label>
                  <span>{formatDate(selectedTransaction.createdAt)}</span>
                </div>
                {selectedTransaction.description && (
                  <div className="detail-item full-width">
                    <label>Mô tả:</label>
                    <span>{selectedTransaction.description}</span>
                  </div>
                )}
                {selectedTransaction.failureReason && (
                  <div className="detail-item full-width">
                    <label>Lý do thất bại:</label>
                    <span className="error-text">
                      {selectedTransaction.failureReason}
                    </span>
                  </div>
                )}
                {selectedTransaction.vnpayTransactionNo && (
                  <div className="detail-item">
                    <label>Mã VNPay:</label>
                    <span>{selectedTransaction.vnpayTransactionNo}</span>
                  </div>
                )}
                {selectedTransaction.bankCode && (
                  <div className="detail-item">
                    <label>Ngân hàng:</label>
                    <span>{selectedTransaction.bankCode}</span>
                  </div>
                )}
                {selectedTransaction.cardType && (
                  <div className="detail-item">
                    <label>Loại thẻ:</label>
                    <span>{selectedTransaction.cardType}</span>
                  </div>
                )}
                {selectedTransaction.reservationId && (
                  <div className="detail-item">
                    <label>Reservation ID:</label>
                    <span>{selectedTransaction.reservationId}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-close"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionManagement;
