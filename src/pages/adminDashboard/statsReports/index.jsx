// Trang StatsReports: tổng hợp giao dịch và doanh thu.
// Phần chính:
//  - KPI tóm tắt (doanh thu, tỉ lệ thành công, trung bình/giao dịch, pending)
//  - Phân bố phương thức thanh toán
//  - Biểu đồ combo: cột (orders) + đường (revenue) theo tháng / theo ngày
//  - Bảng giao dịch có bộ lọc & phân trang
//  - Modal chi tiết giao dịch
import { useEffect, useMemo, useState } from "react"; // hook React dùng quản lý lifecycle, memo và state
import "./index.scss"; // style riêng cho trang
import api from "../../../config/api"; // axios instance gọi API backend

// ComboChart: kết hợp bar (số đơn hàng) và line (doanh thu)
// data: [{ key,label,orders,revenue }]
// height: chiều cao tổng thể SVG
const ComboChart = ({ data = [], height = 420 }) => {
  if (!data.length) {
    return <p className="chart-empty">Chưa có dữ liệu</p>;
  }

  const padding = { top: 32, bottom: 56, left: 64, right: 32 }; // khoảng trống cho trục + nhãn
  const innerHeight = height - padding.top - padding.bottom; // vùng vẽ thực tế
  const slot = 68; // độ rộng "khung" 1 điểm (giãn cách ngang)
  const barWidth = 26; // chiều rộng cột đơn hàng
  const width = Math.max(
    data.length * slot + padding.left + padding.right,
    520
  );
  const maxOrders = data.reduce((max, item) => Math.max(max, item.orders), 0) || 1; // phục vụ scale chiều cao cột
  const maxRevenue = data.reduce((max, item) => Math.max(max, item.revenue), 0) || 1; // phục vụ scale đường doanh thu
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, index) => index);

  const formatCompact = (value) => // hiển thị dạng compact (1.2K, 3.4M)
    new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(value || 0);

  const getX = (index) => padding.left + index * slot + slot / 2; // tâm điểm X
  const getBarX = (index) => getX(index) - barWidth / 2; // vị trí bắt đầu cột
  const getBarHeight = (orders) => (orders / maxOrders) * innerHeight; // scale chiều cao cột
  const getRevenueY = (revenue) => height - padding.bottom - (revenue / maxRevenue) * innerHeight; // toạ độ Y đường

  const points = data.map((point, index) => ({ x: getX(index), y: getRevenueY(point.revenue) })); // danh sách toạ độ đường
  const linePath = points.reduce((path, point, index) => { // tạo đường cong mượt dùng cubic bezier
    if (index === 0) {
      return `M ${point.x} ${point.y}`;
    }
    const previous = points[index - 1];
    const midX = (previous.x + point.x) / 2;
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
  const areaPath = points.length > 1
    ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z`
    : ""; // vùng fill dưới đường

  return (
    <div className="chart-wrapper">
      <svg viewBox={`0 0 ${width} ${height}`} className="combo-chart">
        <defs>
          <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0f8b5c" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
          <linearGradient id="lineFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(15,139,92,0.25)" />
            <stop offset="100%" stopColor="rgba(15,139,92,0)" />
          </linearGradient>
          <filter id="dotShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="4"
              stdDeviation="4"
              floodColor="rgba(15,23,42,0.25)"
            />
          </filter>
          <filter id="lineGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="10"
              stdDeviation="16"
              floodColor="rgba(34,197,94,0.35)"
            />
          </filter>
        </defs>

        {ticks.map((tick) => { // lưới ngang + giá trị doanh thu compact
          const y = padding.top + (innerHeight / tickCount) * tick;
          const value = maxRevenue - (maxRevenue / tickCount) * tick;
          return (
            <g key={`grid-${tick}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className={`grid-line ${tick === tickCount ? "axis" : ""}`}
              />
              <text className="axis-value" x={padding.left - 12} y={y + 4}>
                {tick === tickCount ? "0" : formatCompact(value)}
              </text>
            </g>
          );
        })}

        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          className="axis"
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          className="axis"
        />

        {areaPath && (
          <path
            d={areaPath}
            className="line-area"
            fill="url(#lineFill)"
            opacity="0.65"
          />
        )}

        {points.length > 1 && (
          <path
            d={linePath}
            className="line-path glow"
            stroke="url(#lineGradient)"
            fill="none"
            filter="url(#lineGlow)"
          />
        )}

        {data.map((point, index) => { // vẽ từng cột + dot + nhãn trục X
          const barHeight = getBarHeight(point.orders);
          const barY = height - padding.bottom - barHeight;
          const revenueY = getRevenueY(point.revenue);
          const labelY = height - padding.bottom + 26;
          return (
            <g key={point.key || point.label || index}>
              <rect
                className="bar-shape"
                x={getBarX(index)}
                y={barY}
                width={barWidth}
                height={Math.max(barHeight, 4)}
                rx={8}
                fill="url(#barGradient)"
              />
              <circle
                className="line-dot"
                cx={getX(index)}
                cy={revenueY}
                r={6}
                fill="#0f8b5c"
                filter="url(#dotShadow)"
              />
              <text className="axis-label" x={getX(index)} y={labelY}>
                {point.label}
              </text>
            </g>
          );
        })}
        {points.length === 1 && (
          <path
            d={linePath}
            className="line-path"
            stroke="url(#lineGradient)"
            fill="none"
          />
        )}
      </svg>

      <div className="chart-legend">
        <div>
          <span className="dot bar" />
          Đơn hàng
        </div>
        <div>
          <span className="dot line" />
          Doanh thu
        </div>
      </div>
    </div>
  );
};

// Các lựa chọn nhanh khoảng thời gian lọc dữ liệu giao dịch
const timeRanges = [
  { id: "7days", label: "7 ngày" },
  { id: "30days", label: "30 ngày" },
  { id: "3months", label: "3 tháng" },
  { id: "year", label: "Năm nay" },
];

// Danh sách tháng phục vụ biểu đồ theo ngày
const monthOptions = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  short: `T${index + 1}`,
  label: `Tháng ${index + 1}`,
}));

const currentYear = new Date().getFullYear(); // năm hiện tại
const yearPreset = Array.from( // preset từ 2021 đến hiện tại + 2 năm đệm
  { length: Math.max(currentYear + 2 - 2021, 5) },
  (_, index) => 2021 + index
);

// Component chính StatsReports: quản lý state, fetch dữ liệu, memo hoá và render UI
const StatsReports = () => {
  const [timeFilter, setTimeFilter] = useState("30days");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    payment: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [detail, setDetail] = useState(null);
  const [selectedYearMonthly, setSelectedYearMonthly] = useState(currentYear);
  const [selectedYearDaily, setSelectedYearDaily] = useState(currentYear);
  const [selectedMonthDaily, setSelectedMonthDaily] = useState(
    new Date().getMonth() + 1
  );

  useEffect(() => { // mỗi lần đổi bộ lọc khoảng thời gian -> refetch
    window.scrollTo(0, 0); // cuộn đầu trang cho UX
    fetchTransactions(); // tải lại dữ liệu giao dịch
  }, [timeFilter]);

  const getDateRange = () => { // trả về khoảng thời gian ISO dựa trên timeFilter
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let from = new Date(today);
    if (timeFilter === "7days") from.setDate(from.getDate() - 7);
    if (timeFilter === "30days") from.setDate(from.getDate() - 30);
    if (timeFilter === "3months") from.setMonth(from.getMonth() - 3);
    if (timeFilter === "year") from = new Date(now.getFullYear(), 0, 1);
    return { fromDate: from.toISOString(), toDate: now.toISOString() };
  };

  const fetchTransactions = async () => { // gọi API /transactions và chuẩn hoá user
    try {
      setLoading(true);
      setError(null);
      const { fromDate, toDate } = getDateRange();
      const params = {
        fromDate,
        toDate,
        limit: 1000,
        sortBy: "createdAt",
        sortOrder: "desc",
        populate: "user,station",
      };
      const response = await api.get("/transactions", { params });
      let data = [];
      if (response.data?.success) {
        if (Array.isArray(response.data?.data?.items))
          data = response.data.data.items;
        else if (Array.isArray(response.data?.data)) data = response.data.data;
      } else if (Array.isArray(response.data)) {
        data = response.data;
      }
      const normalized = data.map((t) => {
        const user = t.user || {};
        const profileName = user.profile?.fullName;
        const fullName =
          user.fullName ||
          user.fullname ||
          profileName ||
          user.name ||
          user.displayName ||
          user.username ||
          user.email ||
          "Không rõ";
        return {
          ...t,
          user: {
            ...user,
            fullName,
            email: user.email || t.email || t.payerEmail || "",
          },
        };
      });
      setTransactions(normalized);
      setCurrentPage(1);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Không thể tải dữ liệu"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (transactionId) => { // tải chi tiết một giao dịch cho modal
    try {
      const response = await api.get(`/transactions/${transactionId}`);
      const data = response.data?.data || response.data || null;
      if (!data) return;
      const user = data.user || {};
      const profileName = user.profile?.fullName;
      const fullName =
        user.fullName ||
        user.fullname ||
        profileName ||
        user.name ||
        user.displayName ||
        user.username ||
        user.email ||
        "Không rõ";
      setDetail({
        ...data,
        user: {
          ...user,
          fullName,
          email: user.email || data.email || data.payerEmail || "",
        },
      });
    } catch (err) {
      alert("Không thể tải chi tiết giao dịch");
    }
  };

  const formatCurrency = (amount) => // định dạng VND hoặc '—'
    amount === undefined || amount === null
      ? "—"
      : new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
      }).format(amount);

  const formatDateTime = (value) => // định dạng thời gian locale vi-VN hoặc '—'
    value ? new Date(value).toLocaleString("vi-VN", { hour12: false }) : "—";

  const formatStatus = (status = "") => { // map status -> {label,tone} dùng cho badge
    const map = {
      success: { label: "Thành công", tone: "success" },
      failed: { label: "Thất bại", tone: "danger" },
      pending: { label: "Chờ xử lý", tone: "warning" },
      processing: { label: "Đang xử lý", tone: "warning" },
      refunded: { label: "Hoàn tiền", tone: "neutral" },
      cancelled: { label: "Đã hủy", tone: "danger" },
    };
    return map[status] || { label: status || "Không rõ", tone: "default" };
  };

  const availableYears = useMemo(() => { // tập hợp năm xuất hiện trong dữ liệu (thêm preset)
    const years = new Set(yearPreset);
    transactions.forEach((t) => {
      const year = new Date(t.createdAt).getFullYear();
      if (!Number.isNaN(year)) years.add(year);
    });
    if (years.size === 0) years.add(currentYear);
    return Array.from(years).sort((a, b) => a - b);
  }, [transactions]);

  useEffect(() => { // đảm bảo năm chọn còn hợp lệ sau khi list years thay đổi
    if (!availableYears.includes(selectedYearMonthly)) {
      setSelectedYearMonthly(
        availableYears[availableYears.length - 1] || currentYear
      );
    }
    if (!availableYears.includes(selectedYearDaily)) {
      setSelectedYearDaily(
        availableYears[availableYears.length - 1] || currentYear
      );
    }
  }, [availableYears, selectedYearMonthly, selectedYearDaily]);

  const filteredTransactions = useMemo(() => { // áp dụng lọc trạng thái, phương thức, từ khoá
    return transactions.filter((transaction) => {
      const matchStatus =
        filters.status === "all" || transaction.status === filters.status;
      const matchPayment =
        filters.payment === "all" ||
        transaction.paymentMethod === filters.payment;
      const keyword = filters.search.trim().toLowerCase();
      const matchSearch =
        !keyword ||
        [
          transaction.user?.fullName,
          transaction.user?.email,
          transaction.station?.name,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(keyword));
      return matchStatus && matchPayment && matchSearch;
    });
  }, [transactions, filters]);

  const paginatedTransactions = useMemo(() => { // lấy slice dữ liệu trang hiện tại
    const start = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(start, start + pageSize);
  }, [filteredTransactions, currentPage]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / pageSize)
  );

  const summaryCards = useMemo(() => { // tính các KPI tóm tắt
    if (transactions.length === 0) return [];
    const totalRevenue = transactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const success = transactions.filter((t) => t.status === "success").length;
    const failed = transactions.filter((t) => t.status === "failed").length;
    const pending = transactions.filter((t) => t.status === "pending").length;
    return [
      {
        icon: "💰",
        title: "Tổng doanh thu",
        value: formatCurrency(totalRevenue),
        hint: `${transactions.length} giao dịch`,
      },
      {
        icon: "📈",
        title: "Tỉ lệ thành công",
        value: transactions.length
          ? `${((success / transactions.length) * 100).toFixed(1)}%`
          : "0%",
        hint: `${success} thành công / ${failed} thất bại`,
      },
      {
        icon: "💳",
        title: "Trung bình / giao dịch",
        value: formatCurrency(success ? totalRevenue / success : 0),
        hint: "Chỉ tính giao dịch thành công",
      },
      {
        icon: "⏳",
        title: "Đang chờ xử lý",
        value: pending,
        hint: "Cần theo dõi",
      },
    ];
  }, [transactions]);

  const paymentBreakdown = useMemo(() => { // phân bố phương thức thanh toán
    const counts = transactions.reduce((acc, t) => {
      const method = t.paymentMethod || "other";
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});
    const total = transactions.length || 1;
    return Object.entries(counts).map(([method, count]) => ({
      label:
        method === "vnpay" ? "VNPay" : method === "cash" ? "Tiền mặt" : "Khác",
      count,
      percent: Math.round((count / total) * 100),
    }));
  }, [transactions]);

  const monthlyStats = useMemo(() => { // gom orders & revenue theo tháng
    const months = monthOptions.map((option) => ({
      key: `${selectedYearMonthly}-${option.value}`,
      label: option.short,
      orders: 0,
      revenue: 0,
    }));
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      if (date.getFullYear() === selectedYearMonthly) {
        const monthIndex = date.getMonth();
        const bucket = months[monthIndex];
        bucket.orders += 1;
        bucket.revenue += transaction.amount || 0;
      }
    });
    return months;
  }, [transactions, selectedYearMonthly]);

  const dailyStats = useMemo(() => { // gom orders & revenue theo từng ngày trong tháng chọn
    const daysInMonth = new Date(
      selectedYearDaily,
      selectedMonthDaily,
      0
    ).getDate();
    const days = Array.from({ length: daysInMonth }, (_, index) => ({
      key: `${selectedYearDaily}-${selectedMonthDaily}-${index + 1}`,
      label: `${index + 1}`,
      orders: 0,
      revenue: 0,
    }));
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      if (
        date.getFullYear() === selectedYearDaily &&
        date.getMonth() + 1 === selectedMonthDaily
      ) {
        const bucket = days[date.getDate() - 1];
        bucket.orders += 1;
        bucket.revenue += transaction.amount || 0;
      }
    });
    return days;
  }, [transactions, selectedYearDaily, selectedMonthDaily]);

  const paginationItems = useMemo(() => { // tạo danh sách trang + ellipsis nếu cần
    if (totalPages <= 6)
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    const items = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) items.push("...");
    for (let i = start; i <= end; i += 1) items.push(i);
    if (end < totalPages - 1) items.push("...");
    items.push(totalPages);
    return items;
  }, [currentPage, totalPages]);

  return (
    <div className="stats-reports">
      <section className="page-hero">
        <div className="hero-copy">
          <p className="eyebrow">Báo cáo tổng hợp</p>
          <h2>Thống kê & báo cáo</h2>
          <p className="hero-lead">
            Theo dõi hiệu suất giao dịch, doanh thu và phương thức thanh toán.
          </p>
          <div className="hero-metrics">
            {summaryCards.map((card) => (
              <div key={card.title} className="metric">
                <span>{card.title}</span>
                <strong>{card.value}</strong>
                <small>{card.hint}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-panel">
          <h4>Khoảng thời gian</h4>
          <div className="time-chip-group">
            {timeRanges.map((range) => (
              <button
                key={range.id}
                type="button"
                className={`time-chip ${timeFilter === range.id ? "active" : ""
                  }`}
                onClick={() => setTimeFilter(range.id)}
              >
                {range.label}
              </button>
            ))}
          </div>
          <div className="panel-grid">
            {paymentBreakdown.map((item) => (
              <div key={item.label} className="panel-stat">
                <span>{item.label}</span>
                <strong>{item.percent}%</strong>
                <small>{item.count} giao dịch</small>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="filters-card"> {/* Khối bộ lọc trạng thái/phương thức/từ khoá + biểu đồ */}
        <div className="filter-row">
          <div className="filter-field">
            <label>Trạng thái</label>
            <select
              value={filters.status}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, status: e.target.value }));
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả</option>
              <option value="success">Thành công</option>
              <option value="failed">Thất bại</option>
              <option value="pending">Chờ xử lý</option>
              <option value="processing">Đang xử lý</option>
              <option value="refunded">Hoàn tiền</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Phương thức</label>
            <select
              value={filters.payment}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, payment: e.target.value }));
                setCurrentPage(1);
              }}
            >
              <option value="all">Tất cả</option>
              <option value="vnpay">VNPay</option>
              <option value="cash">Tiền mặt</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div className="filter-field">
            <label>Từ khóa</label>
            <input
              type="text"
              placeholder="Tên khách hàng, email, trạm..."
              value={filters.search}
              onChange={(e) => {
                setFilters((prev) => ({ ...prev, search: e.target.value }));
                setCurrentPage(1);
              }}
            />
          </div>
        </div>
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h4>Doanh thu & đơn hàng theo tháng</h4>
                <p>Xem toàn cảnh năm {selectedYearMonthly}</p>
              </div>
              <div className="chart-controls">
                <div className="control">
                  <span>Năm</span>
                  <select
                    value={selectedYearMonthly}
                    onChange={(e) =>
                      setSelectedYearMonthly(Number(e.target.value))
                    }
                  >
                    {availableYears.map((year) => (
                      <option key={`monthly-year-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ComboChart data={monthlyStats} height={440} />
          </div>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h4>Doanh thu theo ngày trong tháng</h4>
                <p>{`Tháng ${selectedMonthDaily} / ${selectedYearDaily}`}</p>
              </div>
              <div className="chart-controls">
                <div className="control">
                  <span>Năm</span>
                  <select
                    value={selectedYearDaily}
                    onChange={(e) =>
                      setSelectedYearDaily(Number(e.target.value))
                    }
                  >
                    {availableYears.map((year) => (
                      <option key={`daily-year-${year}`} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="control">
                  <span>Tháng</span>
                  <select
                    value={selectedMonthDaily}
                    onChange={(e) =>
                      setSelectedMonthDaily(Number(e.target.value))
                    }
                  >
                    {monthOptions.map((option) => (
                      <option
                        key={`daily-month-${option.value}`}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            <ComboChart data={dailyStats} height={440} />
          </div>
        </div>
      </div>

      <div className="panel-card"> {/* Bảng giao dịch + phân trang */}
        <div className="panel-headline">
          <div>
            <h3>Giao dịch gần đây</h3>
            <p>Danh sách giao dịch sau khi áp dụng bộ lọc.</p>
          </div>
        </div>
        {loading ? (
          <div className="empty-state">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="error-state">{error}</div>
        ) : (
          <div className="table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Khách hàng</th>
                  <th>Phương thức</th>
                  <th>Số tiền</th>
                  <th>Thời gian</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="no-data">
                      Không tìm thấy giao dịch phù hợp
                    </td>
                  </tr>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="plan-cell">
                        <p>{transaction.user?.fullName || "Không rõ"}</p>
                        <span>{transaction.user?.email || "—"}</span>
                      </td>
                      <td>
                        <span className="chip chip-default">
                          {transaction.paymentMethod === "vnpay"
                            ? "VNPay"
                            : transaction.paymentMethod === "cash"
                              ? "Tiền mặt"
                              : "Khác"}
                        </span>
                      </td>
                      <td>{formatCurrency(transaction.amount)}</td>
                      <td>{formatDateTime(transaction.createdAt)}</td>
                      <td>
                        <span
                          className={`status-pill status-${formatStatus(transaction.status).tone
                            }`}
                        >
                          {formatStatus(transaction.status).label}
                        </span>
                      </td>
                      <td>
                        <div className="action-pills">
                          <button
                            type="button"
                            className="pill neutral"
                            onClick={() => handleViewDetail(transaction._id)}
                          >
                            Xem
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
        <div className="pagination">
          <button
            className="page-btn nav"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            ‹
          </button>
          {paginationItems.map((item, index) =>
            typeof item === "number" ? (
              <button
                key={item}
                className={`page-btn ${item === currentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(item)}
              >
                {item}
              </button>
            ) : (
              <span key={`${item}-${index}`} className="ellipsis">
                ...
              </span>
            )
          )}
          <button
            className="page-btn nav"
            onClick={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
            disabled={currentPage === totalPages}
          >
            ›
          </button>
        </div>
      </div>

      {detail && ( // Modal chi tiết giao dịch
        <div className="modal-overlay-new" onClick={() => setDetail(null)}>
          <div
            className="modal-content-new detail-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-new">
              <div className="modal-title-section">
                <div className="modal-icon">🔍</div>
                <div>
                  <h2>Chi tiết giao dịch</h2>
                  <p>Thông tin đầy đủ về giao dịch đã chọn.</p>
                </div>
              </div>
              <button
                className="modal-close-new"
                onClick={() => setDetail(null)}
              >
                ✕
              </button>
            </div>
            <div className="form-new detail-grid">
              <div className="detail-card highlight">
                <div>
                  <p className="micro-label">Khách hàng</p>
                  <strong>{detail.user?.fullName || "Không rõ"}</strong>
                  <p>{detail.user?.email || "—"}</p>
                </div>
                <div className="amount-stack">
                  <p className="micro-label">Số tiền</p>
                  <strong>{formatCurrency(detail.amount)}</strong>
                  <span className={`status-pill status-${formatStatus(detail.status).tone}`}>
                    {formatStatus(detail.status).label}
                  </span>
                </div>
              </div>
              <div className="detail-card">
                <span>Phương thức</span>
                <strong>
                  {detail.paymentMethod === "vnpay"
                    ? "VNPay"
                    : detail.paymentMethod === "cash"
                      ? "Tiền mặt"
                      : "Khác"}
                </strong>
                <p className="muted">
                  Loại thanh toán: {detail.metadata?.paymentType === "subscription" ? "Gói thành viên" : "Đặt chỗ/phiên sạc"}
                </p>
              </div>
              <div className="detail-card">
                <span>Thời gian</span>
                <strong>{formatDateTime(detail.createdAt)}</strong>
              </div>
              {detail.vnpayDetails?.vnp_TransactionNo && (
                <div className="detail-card">
                  <span>Mã VNPay</span>
                  <strong>{detail.vnpayDetails.vnp_TransactionNo}</strong>
                </div>
              )}
              <div className="detail-card">
                <span>Mã giao dịch</span>
                <strong>{detail.transactionCode || detail._id || "—"}</strong>
              </div>
              {detail.vnpayDetails?.vnp_BankCode && (
                <div className="detail-card">
                  <span>Ngân hàng</span>
                  <strong>{detail.vnpayDetails.vnp_BankCode}</strong>
                  <p>Loại thẻ: {detail.vnpayDetails.vnp_CardType || "—"}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsReports;
