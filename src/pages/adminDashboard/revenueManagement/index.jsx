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
        populate: "user", // Yêu cầu populate user object
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
      calculateDailyRevenue(transactionsData, fromDate, toDate);
      calculateAnalysis(transactionsData);

      // Tính station revenue (async) - sẽ cập nhật analysis sau khi fetch xong
      await calculateStationRevenue(transactionsData);

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
  const calculateStationRevenue = async (transactions) => {
    // Map để lưu doanh thu theo stationId
    const stationMap = new Map();
    const unknownStationKey = "unknown";

    // Map để cache reservationId -> stationId để tránh fetch trùng
    const reservationToStationCache = new Map();

    // Lấy tất cả unique reservationIds
    const uniqueReservationIds = [...new Set(
      transactions
        .filter(t => t.reservationId)
        .map(t => t.reservationId)
    )];

    if (uniqueReservationIds.length === 0) {
      // Không có reservation nào
      setStationRevenue([]);
      setAnalysis(prev => ({
        ...prev,
        bestStation: "Chưa có dữ liệu",
        bestStationRevenue: 0,
      }));
      return;
    }

    // Fetch station info cho tất cả reservations
    try {
      const reservationPromises = uniqueReservationIds.map(async (reservationId) => {
        try {
          const res = await api.get(`/reservations/${reservationId}`);
          const reservation = res.data?.data || res.data;

          // Lấy stationId và stationName từ reservation
          let stationId = null;
          let stationName = "Không xác định";

          if (reservation?.items?.[0]?.slot?.port) {
            const portId = reservation.items[0].slot.port;
            try {
              const portRes = await api.get(`/stations/ports/${portId}`);
              const portData = portRes.data?.data || portRes.data;

              if (portData?.station) {
                stationId = portData.station;
                const stationRes = await api.get(`/stations/${stationId}`);
                const stationData = stationRes.data?.data || stationRes.data;
                stationName = stationData?.name || "Không xác định";
              }
            } catch (err) {
              console.log("Error fetching station info:", err);
            }
          }

          return { reservationId, stationId, stationName };
        } catch (err) {
          console.log(`Error fetching reservation ${reservationId}:`, err);
          return { reservationId, stationId: null, stationName: "Không xác định" };
        }
      });

      const results = await Promise.all(reservationPromises);

      // Tạo cache reservationId -> stationId/stationName
      results.forEach(({ reservationId, stationId, stationName }) => {
        reservationToStationCache.set(reservationId, { stationId, stationName });
      });

      // Giờ group transactions theo stationId
      transactions.forEach((transaction) => {
        const reservationId = transaction.reservationId;

        if (reservationId && reservationToStationCache.has(reservationId)) {
          const { stationId, stationName } = reservationToStationCache.get(reservationId);

          if (stationId) {
            // Group theo stationId
            if (!stationMap.has(stationId)) {
              stationMap.set(stationId, {
                id: stationId,
                name: stationName,
                revenue: 0,
                count: 0,
              });
            }
            stationMap.get(stationId).revenue += transaction.amount || 0;
            stationMap.get(stationId).count += 1;
          } else {
            // Không lấy được stationId, group vào "Không xác định"
            if (!stationMap.has(unknownStationKey)) {
              stationMap.set(unknownStationKey, {
                id: unknownStationKey,
                name: "Không xác định",
                revenue: 0,
                count: 0,
              });
            }
            stationMap.get(unknownStationKey).revenue += transaction.amount || 0;
            stationMap.get(unknownStationKey).count += 1;
          }
        } else if (reservationId) {
          // ReservationId không có trong cache (lỗi khi fetch)
          if (!stationMap.has(unknownStationKey)) {
            stationMap.set(unknownStationKey, {
              id: unknownStationKey,
              name: "Không xác định",
              revenue: 0,
              count: 0,
            });
          }
          stationMap.get(unknownStationKey).revenue += transaction.amount || 0;
          stationMap.get(unknownStationKey).count += 1;
        }
      });

      // Chuyển sang array và sắp xếp theo revenue (group theo stationId)
      const stationArray = Array.from(stationMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5

      // Tính percentage và growth
      const maxRevenue = stationArray.length > 0 ? stationArray[0].revenue : 1;
      const stationsWithStats = stationArray.map((station) => ({
        ...station,
        percentage: (station.revenue / maxRevenue * 100).toFixed(0),
        growth: 0,
      }));

      setStationRevenue(stationsWithStats);

      // Cập nhật analysis với tên trạm chính xác
      if (stationsWithStats.length > 0) {
        const topStation = stationsWithStats[0];
        setAnalysis(prev => ({
          ...prev,
          bestStation: topStation.name,
          bestStationRevenue: topStation.revenue,
        }));
      } else {
        setAnalysis(prev => ({
          ...prev,
          bestStation: "Chưa có dữ liệu",
          bestStationRevenue: 0,
        }));
      }
    } catch (err) {
      console.log("Error fetching station revenue:", err);

      // Nếu lỗi, vẫn hiển thị dữ liệu có sẵn (nếu có)
      setStationRevenue([]);

      setAnalysis(prev => ({
        ...prev,
        bestStation: "Lỗi khi tải dữ liệu",
        bestStationRevenue: 0,
      }));
    }
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
        bestStation: "Chưa có dữ liệu",
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

    // Khởi tạo analysis với giá trị mặc định
    // bestStation sẽ được cập nhật trong calculateStationRevenue
    setAnalysis({
      highestRevenue,
      highestRevenueDate: formatDate(highestRevenueDate),
      bestStation: "Đang tải...",
      bestStationRevenue: 0,
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      // Đảm bảo dateString là string hoặc Date object hợp lệ
      const date = new Date(dateString);
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "N/A";
    }
  };

  // Format date time
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return "N/A";
      }
      return date.toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return "N/A";
    }
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
          <h2 className="main-title">Báo cáo doanh thu</h2>
          <p className="main-desc">
            Thống kê chi tiết về doanh thu và hiệu quả kinh doanh
          </p>
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
          {/* Refresh button removed per request */}


        </div>
      </div>

      {/* Revenue Cards */}
      <div className="revenue-overview">
        {revenueStats.map((stat, index) => (
          <div key={index} className="revenue-card">
            <div className="revenue-icon">{stat.icon}</div>
            <div className="revenue-content">
              <h3 className="card-title">{stat.title}</h3>
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
            <h3 className="card-title">Doanh thu theo trạm</h3>
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
                          className={`growth ${station.growth >= 0 ? "positive" : "negative"
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
                    <td className="user-name">
                      {transaction.user?.fullName ||
                        transaction.user?.email?.split('@')[0] ||
                        (transaction.userId ? `User ${transaction.userId.slice(-6)}` : "N/A")}
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
                  <td colSpan="4" style={{ textAlign: "center", padding: "20px", color: "#999" }}>
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
        <div className="section-header">
          <h3>Phân tích chi tiết</h3>
        </div>
        <div className="analysis-card">
          <div className="analysis-grid">
            <div className="analysis-item">
              <div className="analysis-label">Doanh thu cao nhất</div>
              <div className="analysis-value">{formatCurrency(analysis.highestRevenue || 0)}</div>
              <div className="analysis-date">{analysis.highestRevenueDate || "N/A"}</div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Trạm hiệu quả nhất</div>
              <div className="analysis-value">
                {analysis.bestStation === 'Đang tải...'
                  ? '⏳ Đang tải...'
                  : (analysis.bestStation && analysis.bestStation !== 'Không xác định'
                    ? analysis.bestStation
                    : 'Chưa có dữ liệu')}
              </div>
              <div className="analysis-date">
                {analysis.bestStation === 'Đang tải...'
                  ? ''
                  : (typeof analysis.bestStationRevenue === 'number' && analysis.bestStationRevenue > 0
                    ? formatCurrency(analysis.bestStationRevenue)
                    : '0 ₫')}
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
