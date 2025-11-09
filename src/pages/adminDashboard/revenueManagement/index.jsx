import { useState, useEffect } from "react";
import "./index.scss";
import api from "../../../config/api";

const RevenueManagement = () => {
  const [timeFilter, setTimeFilter] = useState("30days");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [revenueStats, setRevenueStats] = useState([]);
  const [stationRevenue, setStationRevenue] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [dailyRevenue, setDailyRevenue] = useState([]);
  const [analysis, setAnalysis] = useState({});

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchRevenueData();
  }, [timeFilter]);

  // Tính toán khoảng thời gian dựa trên timeFilter
  const getDateRange = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let fromDate, toDate;

    switch (timeFilter) {
      case "7days":
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 7);
        toDate = new Date(now);
        break;
      case "30days":
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
        toDate = new Date(now);
        break;
      case "3months":
        fromDate = new Date(today);
        fromDate.setMonth(fromDate.getMonth() - 3);
        toDate = new Date(now);
        break;
      case "year":
        fromDate = new Date(now.getFullYear(), 0, 1);
        toDate = new Date(now);
        break;
      default:
        fromDate = new Date(today);
        fromDate.setDate(fromDate.getDate() - 30);
        toDate = new Date(now);
    }

    return { fromDate, toDate };
  };

  // Fetch transactions từ API
  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { fromDate, toDate } = getDateRange();
      const fromDateStr = fromDate.toISOString();
      const toDateStr = toDate.toISOString();

      // Fetch tất cả transactions trong khoảng thời gian (với limit lớn)
      const params = {
        status: "success", // Chỉ lấy giao dịch thành công
        fromDate: fromDateStr,
        toDate: toDateStr,
        limit: 1000, // Lấy nhiều records để tính toán
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const response = await api.get("/transactions", { params });

      // Handle response
      let transactionsData = [];
      if (response.data?.success) {
        if (response.data.data?.items) {
          transactionsData = response.data.data.items;
        } else if (Array.isArray(response.data.data)) {
          transactionsData = response.data.data;
        }
      } else if (Array.isArray(response.data)) {
        transactionsData = response.data;
      } else if (Array.isArray(response.data?.data)) {
        transactionsData = response.data.data;
      }

      setTransactions(transactionsData);

      // Tính toán các thống kê
      calculateRevenueStats(transactionsData, fromDate, toDate);
      calculateStationRevenue(transactionsData);
      calculateDailyRevenue(transactionsData, fromDate, toDate);
      calculateAnalysis(transactionsData);
      
      // Lấy 10 giao dịch gần đây nhất
      setRecentTransactions(transactionsData.slice(0, 10));
    } catch (err) {
      console.error("Error fetching revenue data:", err);
      setError(err.response?.data?.message || err.message || "Không thể tải dữ liệu doanh thu");
    } finally {
      setLoading(false);
    }
  };

  // Tính toán thống kê doanh thu
  const calculateRevenueStats = (transactions, fromDate, toDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Lọc transactions theo thời gian
    const todayTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    });

    const yesterdayTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= yesterday && date < today;
    });

    const thisMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= thisMonthStart;
    });

    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date < thisMonthStart;
    });

    // Tính doanh thu
    const todayRevenue = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const yesterdayRevenue = yesterdayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    // Tính phần trăm thay đổi
    const todayChange = yesterdayRevenue > 0 
      ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(1)
      : 0;
    const monthChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    // Tính trung bình/ngày
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysPassed = now.getDate();
    const avgDailyThisMonth = daysPassed > 0 ? thisMonthRevenue / daysPassed : 0;
    const avgDailyLastMonth = lastMonthRevenue / lastMonthEnd.getDate();
    const avgDailyChange = avgDailyLastMonth > 0
      ? ((avgDailyThisMonth - avgDailyLastMonth) / avgDailyLastMonth * 100).toFixed(1)
      : 0;

    // Mục tiêu tháng (giả định 70M)
    const monthlyTarget = 70000000;
    const targetPercentage = (thisMonthRevenue / monthlyTarget * 100).toFixed(0);

    setRevenueStats([
      {
        title: "Doanh thu hôm nay",
        value: formatCurrency(todayRevenue),
        change: `${todayChange >= 0 ? "+" : ""}${todayChange}%`,
        changeType: todayChange >= 0 ? "increase" : "decrease",
        icon: "💰",
        comparison: "so với hôm qua",
      },
      {
        title: "Doanh thu tháng này",
        value: formatCurrency(thisMonthRevenue),
        change: `${monthChange >= 0 ? "+" : ""}${monthChange}%`,
        changeType: monthChange >= 0 ? "increase" : "decrease",
        icon: "📈",
        comparison: "so với tháng trước",
      },
      {
        title: "Trung bình/ngày",
        value: formatCurrency(avgDailyThisMonth),
        change: `${avgDailyChange >= 0 ? "+" : ""}${avgDailyChange}%`,
        changeType: avgDailyChange >= 0 ? "increase" : "decrease",
        icon: "📊",
        comparison: "so với tháng trước",
      },
      {
        title: "Mục tiêu tháng",
        value: `${targetPercentage}%`,
        change: `${formatCurrency(thisMonthRevenue / 1000000)}M/${formatCurrency(monthlyTarget / 1000000)}M`,
        changeType: thisMonthRevenue >= monthlyTarget ? "increase" : "decrease",
        icon: "🎯",
        comparison: "hoàn thành",
      },
    ]);
  };

  // Tính doanh thu theo trạm (nếu có thông tin station trong transaction)
  const calculateStationRevenue = (transactions) => {
    // Group by station (nếu transaction có reservationId, có thể lấy station từ reservation)
    // Tạm thời group theo reservationId hoặc userId nếu không có station info
    const stationMap = new Map();

    transactions.forEach((transaction) => {
      // Nếu có reservation, có thể fetch station info
      // Tạm thời dùng userId làm key nếu không có station
      const key = transaction.reservationId || transaction.userId || "Unknown";
      const stationName = transaction.reservation?.station?.name || 
                         transaction.stationName || 
                         `Trạm ${key.slice(-4)}`;

      if (!stationMap.has(key)) {
        stationMap.set(key, {
          id: key,
          name: stationName,
          revenue: 0,
          count: 0,
        });
      }

      const station = stationMap.get(key);
      station.revenue += transaction.amount || 0;
      station.count += 1;
    });

    // Chuyển sang array và sắp xếp theo revenue
    const stationArray = Array.from(stationMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5

    // Tính percentage và growth (tạm thời để 0 vì cần so sánh với kỳ trước)
    const maxRevenue = stationArray.length > 0 ? stationArray[0].revenue : 1;
    const stationsWithStats = stationArray.map((station) => ({
      ...station,
      percentage: (station.revenue / maxRevenue * 100).toFixed(0),
      growth: 0, // Cần so sánh với kỳ trước để tính growth
    }));

    setStationRevenue(stationsWithStats);
  };

  // Tính doanh thu theo ngày
  const calculateDailyRevenue = (transactions, fromDate, toDate) => {
    const days = [];
    const revenueMap = new Map();

    // Khởi tạo map với tất cả các ngày trong khoảng
    const currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      revenueMap.set(dateKey, 0);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Tính doanh thu cho mỗi ngày
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt);
      const dateKey = date.toISOString().split("T")[0];
      if (revenueMap.has(dateKey)) {
        revenueMap.set(dateKey, revenueMap.get(dateKey) + (transaction.amount || 0));
      }
    });

    // Chuyển sang array và lấy 30 ngày gần nhất
    const dailyArray = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-30); // Lấy 30 ngày gần nhất

    setDailyRevenue(dailyArray);
  };

  // Tính phân tích chi tiết
  const calculateAnalysis = (transactions) => {
    if (transactions.length === 0) {
      setAnalysis({
        highestRevenue: 0,
        highestRevenueDate: "",
        bestStation: "N/A",
        bestStationRevenue: 0,
        peakHour: "N/A",
        monthGrowth: 0,
      });
      return;
    }

    // Doanh thu cao nhất trong ngày
    const dailyRevenueMap = new Map();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0];
      if (!dailyRevenueMap.has(date)) {
        dailyRevenueMap.set(date, 0);
      }
      dailyRevenueMap.set(date, dailyRevenueMap.get(date) + (transaction.amount || 0));
    });

    let highestRevenue = 0;
    let highestRevenueDate = "";
    dailyRevenueMap.forEach((revenue, date) => {
      if (revenue > highestRevenue) {
        highestRevenue = revenue;
        highestRevenueDate = date;
      }
    });

    // Trạm hiệu quả nhất
    const stationMap = new Map();
    transactions.forEach((transaction) => {
      const key = transaction.reservationId || transaction.userId || "Unknown";
      const stationName = transaction.reservation?.station?.name || 
                         transaction.stationName || 
                         `Trạm ${key.slice(-4)}`;
      if (!stationMap.has(key)) {
        stationMap.set(key, { name: stationName, revenue: 0 });
      }
      stationMap.get(key).revenue += transaction.amount || 0;
    });

    let bestStation = "N/A";
    let bestStationRevenue = 0;
    stationMap.forEach((station) => {
      if (station.revenue > bestStationRevenue) {
        bestStationRevenue = station.revenue;
        bestStation = station.name;
      }
    });

    // Thời gian cao điểm (giờ có nhiều giao dịch nhất)
    const hourMap = new Map();
    transactions.forEach((transaction) => {
      const hour = new Date(transaction.createdAt).getHours();
      if (!hourMap.has(hour)) {
        hourMap.set(hour, 0);
      }
      hourMap.set(hour, hourMap.get(hour) + 1);
    });

    let peakHour = 0;
    let peakCount = 0;
    hourMap.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });

    const peakHourRange = `${peakHour}:00 - ${peakHour + 2}:00`;

    // Tăng trưởng tháng (đã tính ở calculateRevenueStats)
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= thisMonthStart;
    });

    const lastMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date < thisMonthStart;
    });

    const thisMonthRevenue = thisMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const lastMonthRevenue = lastMonthTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const monthGrowth = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue * 100).toFixed(1)
      : 0;

    setAnalysis({
      highestRevenue,
      highestRevenueDate: formatDate(highestRevenueDate),
      bestStation,
      bestStationRevenue,
      peakHour: peakHourRange,
      monthGrowth,
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₫0";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format date time
  const formatDateTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      success: "✅ Hoàn thành",
      completed: "✅ Hoàn thành",
      failed: "❌ Thất bại",
      pending: "🟡 Đang xử lý",
      processing: "🟡 Đang xử lý",
      cancelled: "🚫 Đã hủy",
      refunded: "↩️ Đã hoàn tiền",
    };
    return statusMap[status] || status;
  };

  // Tính max revenue cho biểu đồ
  const maxRevenue = dailyRevenue.length > 0
    ? Math.max(...dailyRevenue.map((d) => d.revenue))
    : 1;

  if (loading) {
    return (
      <div className="revenue-management">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu doanh thu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="revenue-management">
        <div className="error-container">
          <p>❌ {error}</p>
          <button className="btn-retry" onClick={fetchRevenueData}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="revenue-management">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h2>Báo cáo doanh thu</h2>
          <p>Thống kê chi tiết về doanh thu và hiệu quả kinh doanh</p>
        </div>
        <div className="header-actions">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="time-filter"
          >
            <option value="7days">7 ngày qua</option>
            <option value="30days">30 ngày qua</option>
            <option value="3months">3 tháng qua</option>
            <option value="year">Năm nay</option>
          </select>
          <button className="btn-primary" onClick={fetchRevenueData}>
            <span>🔄</span> Làm mới
          </button>
        </div>
      </div>

      {/* Revenue Cards */}
      <div className="revenue-overview">
        {revenueStats.map((stat, index) => (
          <div key={index} className="revenue-card">
            <div className="revenue-icon">{stat.icon}</div>
            <div className="revenue-content">
              <h3>{stat.title}</h3>
              <div className="revenue-amount">{stat.value}</div>
              <div className={`revenue-change ${stat.changeType}`}>
                {stat.change} {stat.comparison}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="charts-grid">
        <div className="chart-card large">
          <div className="card-header">
            <h3>Biểu đồ doanh thu {timeFilter === "7days" ? "7" : timeFilter === "30days" ? "30" : ""} ngày qua</h3>
            <div className="chart-controls">
              <button className="chart-type-btn active">Cột</button>
            </div>
          </div>
          <div className="chart-content">
            <div className="revenue-chart">
              <div className="chart-bars">
                {dailyRevenue.map((day, i) => (
                  <div
                    key={i}
                    className="revenue-bar"
                    style={{ height: `${(day.revenue / maxRevenue) * 100}%` }}
                    title={`${formatDate(day.date)}: ${formatCurrency(day.revenue)}`}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-card">
          <div className="card-header">
            <h3>Doanh thu theo trạm</h3>
          </div>
          <div className="chart-content">
            <div className="station-revenue-list">
              {stationRevenue.length > 0 ? (
                stationRevenue.map((station) => (
                  <div key={station.id} className="station-revenue-item">
                    <div className="station-info">
                      <span className="station-name">{station.name}</span>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${station.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="revenue-details">
                      <span className="revenue-amount">
                        {formatCurrency(station.revenue)}
                      </span>
                      {station.growth !== 0 && (
                        <span
                          className={`growth ${
                            station.growth >= 0 ? "positive" : "negative"
                          }`}
                        >
                          {station.growth >= 0 ? "↗" : "↘"}{" "}
                          {Math.abs(station.growth)}%
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                  Không có dữ liệu trạm
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="transactions-section">
        <div className="section-header">
          <h3>Giao dịch gần đây</h3>
          <button className="btn-link" onClick={() => window.location.href = "/admin/transaction-management"}>
            Xem tất cả
          </button>
        </div>
        <div className="table-container">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Người dùng</th>
                <th>Số tiền</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((transaction) => (
                  <tr key={transaction._id || transaction.id}>
                    <td>#{transaction._id?.slice(-8) || transaction.id?.slice(-8) || "N/A"}</td>
                    <td className="user-name">
                      {transaction.user?.fullName || transaction.userId || "N/A"}
                    </td>
                    <td className="amount">
                      {formatCurrency(transaction.amount)}
                    </td>
                    <td>{formatDateTime(transaction.createdAt)}</td>
                    <td>
                      <span className={`status-badge ${transaction.status}`}>
                        {getStatusBadge(transaction.status)}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
                    Không có giao dịch
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="analysis-section">
        <div className="analysis-card">
          <div className="card-header">
            <h3>Phân tích chi tiết</h3>
          </div>
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">Doanh thu cao nhất</div>
              <div className="analysis-value">{formatCurrency(analysis.highestRevenue || 0)}</div>
              <div className="analysis-date">{analysis.highestRevenueDate || "N/A"}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Trạm hiệu quả nhất</div>
              <div className="analysis-value">{analysis.bestStation || "N/A"}</div>
              <div className="analysis-date">
                {analysis.bestStationRevenue ? formatCurrency(analysis.bestStationRevenue) : "N/A"}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Thời gian cao điểm</div>
              <div className="analysis-value">{analysis.peakHour || "N/A"}</div>
              <div className="analysis-date">Giờ có nhiều giao dịch nhất</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Tăng trưởng tháng</div>
              <div className="analysis-value">
                {analysis.monthGrowth ? `${analysis.monthGrowth >= 0 ? "+" : ""}${analysis.monthGrowth}%` : "0%"}
              </div>
              <div className="analysis-date">So với tháng trước</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RevenueManagement;
