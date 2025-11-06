import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../../config/api";

const TransactionManagement = () => {
    // State cho transactions
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State cho filters
    const [filters, setFilters] = useState({
        status: "",
        paymentMethod: "",
        userId: "",
        fromDate: "",
        toDate: "",
        minAmount: "",
        maxAmount: "",
    });

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [totalTransactions, setTotalTransactions] = useState(0);

    // Stats
    const [stats, setStats] = useState({
        totalAmount: 0,
        successCount: 0,
        failedCount: 0,
        pendingCount: 0,
    });

    // Selected transaction for detail view
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    // Sort
    const [sortBy, setSortBy] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    // Load transactions
    useEffect(() => {
        window.scrollTo(0, 0);
        fetchTransactions();
    }, [currentPage, filters, sortBy, sortOrder]);

    // Fetch transactions from API
    const fetchTransactions = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query params
            const params = {
                page: currentPage,
                limit: pageSize,
                sortBy: sortBy,
                sortOrder: sortOrder,
            };

            // Add filters
            if (filters.status) params.status = filters.status;
            if (filters.paymentMethod) params.paymentMethod = filters.paymentMethod;
            if (filters.userId) params.userId = filters.userId;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;
            if (filters.minAmount) params.minAmount = filters.minAmount;
            if (filters.maxAmount) params.maxAmount = filters.maxAmount;

            const response = await api.get("/transactions", { params });

            // Handle different response formats
            let transactionsData = [];
            let paginationInfo = {};

            if (response.data?.success) {
                if (response.data.data?.items) {
                    transactionsData = response.data.data.items;
                    paginationInfo = response.data.data.pagination || {};
                } else if (Array.isArray(response.data.data)) {
                    transactionsData = response.data.data;
                }
            } else if (Array.isArray(response.data)) {
                transactionsData = response.data;
            } else if (Array.isArray(response.data?.data)) {
                transactionsData = response.data.data;
            }

            setTransactions(transactionsData);

            // Update pagination
            if (paginationInfo.totalPages) {
                setTotalPages(paginationInfo.totalPages);
            } else {
                setTotalPages(Math.ceil(transactionsData.length / pageSize));
            }

            if (paginationInfo.total) {
                setTotalTransactions(paginationInfo.total);
            } else {
                setTotalTransactions(transactionsData.length);
            }

            // Calculate stats
            calculateStats(transactionsData);
        } catch (err) {
            console.error("Error fetching transactions:", err);
            setError(err.response?.data?.message || err.message || "Không thể tải danh sách giao dịch");
        } finally {
            setLoading(false);
        }
    };

    // Calculate statistics
    const calculateStats = (transactionsData) => {
        const stats = {
            totalAmount: 0,
            successCount: 0,
            failedCount: 0,
            pendingCount: 0,
        };

        transactionsData.forEach((transaction) => {
            if (transaction.status === "success") {
                stats.successCount++;
                stats.totalAmount += transaction.amount || 0;
            } else if (transaction.status === "failed") {
                stats.failedCount++;
            } else if (transaction.status === "pending" || transaction.status === "processing") {
                stats.pendingCount++;
            }
        });

        setStats(stats);
    };

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
        setCurrentPage(1); // Reset to first page when filter changes
    };

    // Reset filters
    const resetFilters = () => {
        setFilters({
            status: "",
            paymentMethod: "",
            userId: "",
            fromDate: "",
            toDate: "",
            minAmount: "",
            maxAmount: "",
        });
        setCurrentPage(1);
    };

    // View transaction detail
    const handleViewDetail = async (transactionId) => {
        try {
            const response = await api.get(`/transactions/${transactionId}`);
            if (response.data?.success || response.data) {
                const transaction = response.data.data || response.data;
                setSelectedTransaction(transaction);
                setShowDetailModal(true);
            }
        } catch (err) {
            console.error("Error fetching transaction detail:", err);
            alert("Không thể tải chi tiết giao dịch");
        }
    };

    // Format currency
    const formatCurrency = (amount) => {
        if (!amount && amount !== 0) return "—";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString) => {
        if (!dateString) return "—";
        const date = new Date(dateString);
        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Get status badge class
    const getStatusBadgeClass = (status) => {
        const statusMap = {
            success: "success",
            failed: "failed",
            pending: "pending",
            processing: "processing",
            cancelled: "cancelled",
            refunded: "refunded",
        };
        return statusMap[status] || "default";
    };

    // Get status text
    const getStatusText = (status) => {
        const statusMap = {
            success: "✅ Thành công",
            failed: "❌ Thất bại",
            pending: "⏳ Chờ xử lý",
            processing: "🔄 Đang xử lý",
            cancelled: "🚫 Đã hủy",
            refunded: "↩️ Đã hoàn tiền",
        };
        return statusMap[status] || status;
    };

    // Get payment method text
    const getPaymentMethodText = (method) => {
        const methodMap = {
            vnpay: "💳 VNPay",
            cash: "💵 Tiền mặt",
            other: "🔷 Khác",
        };
        return methodMap[method] || method;
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
                        <div className="stat-value">{formatCurrency(stats.totalAmount)}</div>
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
                            onChange={(e) => handleFilterChange("paymentMethod", e.target.value)}
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
                                        <th>ID</th>
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
                                                <span className="transaction-id">
                                                    #{transaction._id?.slice(-8) || transaction.id?.slice(-8) || "N/A"}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="user-info">
                                                    <span className="user-name">
                                                        {transaction.user?.fullName || transaction.userId || "N/A"}
                                                    </span>
                                                    {transaction.user?.email && (
                                                        <span className="user-email">{transaction.user.email}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="amount">{formatCurrency(transaction.amount)}</span>
                                            </td>
                                            <td>
                                                <span className="payment-method">
                                                    {getPaymentMethodText(transaction.paymentMethod)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`status-badge ${getStatusBadgeClass(transaction.status)}`}>
                                                    {getStatusText(transaction.status)}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="date">{formatDate(transaction.createdAt)}</span>
                                            </td>
                                            <td>
                                                <button
                                                    className="btn-view"
                                                    onClick={() => handleViewDetail(transaction._id || transaction.id)}
                                                >
                                                    👁️ Chi tiết
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
                                Trang {currentPage} / {totalPages} (Tổng: {totalTransactions} giao dịch)
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
                <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Chi tiết giao dịch</h2>
                            <button className="modal-close" onClick={() => setShowDetailModal(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-grid">
                                <div className="detail-item">
                                    <label>ID Giao dịch:</label>
                                    <span>{selectedTransaction._id || selectedTransaction.id}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Người dùng:</label>
                                    <span>
                                        {selectedTransaction.user?.fullName || selectedTransaction.userId || "N/A"}
                                    </span>
                                </div>
                                <div className="detail-item">
                                    <label>Email:</label>
                                    <span>{selectedTransaction.user?.email || "N/A"}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Số tiền:</label>
                                    <span className="amount-large">{formatCurrency(selectedTransaction.amount)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Phương thức:</label>
                                    <span>{getPaymentMethodText(selectedTransaction.paymentMethod)}</span>
                                </div>
                                <div className="detail-item">
                                    <label>Trạng thái:</label>
                                    <span className={`status-badge ${getStatusBadgeClass(selectedTransaction.status)}`}>
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
                                        <span className="error-text">{selectedTransaction.failureReason}</span>
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
                            <button className="btn-close" onClick={() => setShowDetailModal(false)}>
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




