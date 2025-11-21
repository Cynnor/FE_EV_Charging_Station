import { useState, useEffect } from "react"; // Import React hooks để quản lý state và lifecycle
import "./index.scss"; // Import file SCSS cho styling
import api from "../../../config/api"; // Import instance API đã cấu hình để gọi backend

const RevenueManagement = () => {
  // Component quản lý báo cáo doanh thu
  const [timeFilter, setTimeFilter] = useState("30days"); // State lưu bộ lọc thời gian được chọn (7days/30days/3months/year), mặc định 30 ngày
  const [loading, setLoading] = useState(true); // State boolean hiển thị loading spinner khi đang fetch data
  const [error, setError] = useState(null); // State lưu thông báo lỗi nếu API call thất bại
  const [transactions, setTransactions] = useState([]); // State lưu toàn bộ danh sách transactions từ API (raw data)
  const [revenueStats, setRevenueStats] = useState([]); // State lưu 4 thẻ thống kê tổng quan (hôm nay, tháng này, trung bình, mục tiêu)
  const [stationRevenue, setStationRevenue] = useState([]); // State lưu doanh thu theo trạm (top 5 trạm có doanh thu cao nhất)
  const [recentTransactions, setRecentTransactions] = useState([]); // State lưu 10 giao dịch gần đây nhất để hiển thị trong bảng
  const [dailyRevenue, setDailyRevenue] = useState([]); // State lưu doanh thu theo từng ngày cho biểu đồ cột (30 ngày gần nhất)
  const [analysis, setAnalysis] = useState({}); // State lưu các phân tích chi tiết (doanh thu cao nhất, trạm tốt nhất, giờ cao điểm, tăng trưởng)

  useEffect(() => {
    // Hook chạy khi component mount hoặc timeFilter thay đổi
    window.scrollTo(0, 0); // Cuộn trang về đầu (top: 0, left: 0)
    fetchRevenueData(); // Gọi hàm fetch dữ liệu doanh thu từ API
  }, [timeFilter]); // Dependency array: chạy lại effect khi timeFilter thay đổi

  // Tính toán khoảng thời gian dựa trên timeFilter
  const getDateRange = () => {
    const now = new Date(); // Lấy thời điểm hiện tại
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Tạo Date đại diện cho 00:00:00 hôm nay (loại bỏ giờ/phút/giây)
    let fromDate, toDate; // Khai báo biến để lưu khoảng thời gian

    switch (timeFilter) {
      // Switch case dựa trên giá trị timeFilter
      case "7days":
        // Nếu filter là 7 ngày
        fromDate = new Date(today); // Clone today
        fromDate.setDate(fromDate.getDate() - 7); // Lùi lại 7 ngày
        toDate = new Date(now); // toDate là thời điểm hiện tại (bao gồm cả giờ phút)
        break;
      case "30days":
        // Nếu filter là 30 ngày
        fromDate = new Date(today); // Clone today
        fromDate.setDate(fromDate.getDate() - 30); // Lùi lại 30 ngày
        toDate = new Date(now); // toDate là hiện tại
        break;
      case "3months":
        // Nếu filter là 3 tháng
        fromDate = new Date(today); // Clone today
        fromDate.setMonth(fromDate.getMonth() - 3); // Lùi lại 3 tháng (JavaScript tự động xử lý overflow)
        toDate = new Date(now); // toDate là hiện tại
        break;
      case "year":
        // Nếu filter là năm nay
        fromDate = new Date(now.getFullYear(), 0, 1); // Ngày 1 tháng 1 năm nay (tháng 0 = tháng 1)
        toDate = new Date(now); // toDate là hiện tại
        break;
      default:
        // Trường hợp default (fallback)
        fromDate = new Date(today); // Mặc định là 30 ngày
        fromDate.setDate(fromDate.getDate() - 30);
        toDate = new Date(now);
    }

    return { fromDate, toDate }; // Return object chứa 2 Date objects
  };

  // Fetch transactions từ API
  const fetchRevenueData = async () => {
    // Hàm async để fetch dữ liệu doanh thu từ API
    try {
      setLoading(true); // Bật loading state
      setError(null); // Reset error về null

      const { fromDate, toDate } = getDateRange(); // Lấy khoảng thời gian từ hàm getDateRange
      const fromDateStr = fromDate.toISOString(); // Convert Date sang ISO string UTC (YYYY-MM-DDTHH:mm:ss.sssZ)
      const toDateStr = toDate.toISOString(); // Convert toDate sang ISO string

      const params = {
        // Object chứa các query parameters cho API call
        status: "success", // Chỉ lấy giao dịch thành công (filter theo status)
        fromDate: fromDateStr, // Thời gian bắt đầu (ISO string)
        toDate: toDateStr, // Thời gian kết thúc (ISO string)
        limit: 1000, // Giới hạn số lượng records (lấy nhiều để tính toán đầy đủ)
        sortBy: "createdAt", // Sắp xếp theo trường createdAt
        sortOrder: "desc", // Thứ tự giảm dần (mới nhất lên đầu)
        populate: "user", // Yêu cầu API populate thông tin user (thay vì chỉ trả về userId)
      };

      const response = await api.get("/transactions", { params }); // Gọi API GET /transactions với params, await để đợi response

      let transactionsData = []; // Khởi tạo mảng rỗng để lưu transactions
      if (response.data?.success) {
        // Kiểm tra response có trường success = true không (một số API wrap data trong object success)
        if (response.data.data?.items) {
          // Nếu data nằm trong data.data.items (paginated response)
          transactionsData = response.data.data.items; // Lấy mảng items
        } else if (Array.isArray(response.data.data)) {
          // Nếu data.data là array trực tiếp
          transactionsData = response.data.data; // Lấy array đó
        }
      } else if (Array.isArray(response.data)) {
        // Nếu response.data là array trực tiếp (không có wrapper)
        transactionsData = response.data; // Lấy array đó
      } else if (Array.isArray(response.data?.data)) {
        // Nếu response.data.data là array
        transactionsData = response.data.data; // Lấy array đó
      }

      setTransactions(transactionsData); // Lưu transactions vào state

      // Tính toán các thống kê
      calculateRevenueStats(transactionsData, fromDate, toDate); // Gọi hàm tính toán thống kê tổng quan (4 thẻ)
      calculateDailyRevenue(transactionsData, fromDate, toDate); // Gọi hàm tính doanh thu theo ngày cho biểu đồ
      calculateAnalysis(transactionsData); // Gọi hàm phân tích chi tiết

      await calculateStationRevenue(transactionsData); // Gọi hàm tính doanh thu theo trạm (async vì cần fetch thêm data), await để đợi hoàn thành

      // Lấy 10 giao dịch gần đây nhất
      setRecentTransactions(transactionsData.slice(0, 10)); // Lấy 10 phần tử đầu tiên của transactionsData (đã sort desc nên là 10 giao dịch mới nhất)
    } catch (err) {
      // Bắt lỗi nếu có exception
      console.error("Error fetching revenue data:", err); // Log lỗi ra console để debug
      setError(
        // Set error message để hiển thị cho user
        err.response?.data?.message ||
          err.message ||
          "Không thể tải dữ liệu doanh thu"
      );
    } finally {
      // Block finally luôn chạy dù có lỗi hay không
      setLoading(false); // Tắt loading state
    }
  };

  // Tính toán thống kê doanh thu
  const calculateRevenueStats = (transactions, fromDate, toDate) => {
    // Hàm tính toán 4 thống kê chính (doanh thu hôm nay, tháng này, trung bình, mục tiêu)
    const now = new Date(); // Thời điểm hiện tại
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // 00:00:00 hôm nay
    const yesterday = new Date(today); // Clone today
    yesterday.setDate(yesterday.getDate() - 1); // Lùi lại 1 ngày để có 00:00:00 hôm qua
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1); // Ngày đầu tiên của tháng này (ngày 1, 00:00:00)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1); // Ngày đầu tiên của tháng trước
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // Ngày cuối cùng của tháng trước (ngày 0 của tháng này = ngày cuối tháng trước)

    const todayTransactions = transactions.filter((t) => {
      // Filter transactions của hôm nay
      const date = new Date(t.createdAt); // Parse createdAt thành Date object
      return (
        // Return true nếu transaction thuộc hôm nay
        date >= today && date < new Date(today.getTime() + 24 * 60 * 60 * 1000) // >= 00:00:00 hôm nay và < 00:00:00 ngày mai (tức là trong ngày hôm nay)
      );
    });

    const yesterdayTransactions = transactions.filter((t) => {
      // Filter transactions của hôm qua
      const date = new Date(t.createdAt);
      return date >= yesterday && date < today; // >= 00:00:00 hôm qua và < 00:00:00 hôm nay
    });

    const thisMonthTransactions = transactions.filter((t) => {
      // Filter transactions của tháng này
      const date = new Date(t.createdAt);
      return date >= thisMonthStart; // >= ngày 1 tháng này (và <= hiện tại vì đã filter fromDate/toDate từ API)
    });

    const lastMonthTransactions = transactions.filter((t) => {
      // Filter transactions của tháng trước
      const date = new Date(t.createdAt);
      return date >= lastMonthStart && date < thisMonthStart; // >= ngày 1 tháng trước và < ngày 1 tháng này
    });

    // Tính doanh thu
    const todayRevenue = todayTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    ); // Tính tổng doanh thu hôm nay bằng reduce
    const yesterdayRevenue = yesterdayTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    ); // Tương tự cho hôm qua
    const thisMonthRevenue = thisMonthTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    ); // Tương tự cho tháng này
    const lastMonthRevenue = lastMonthTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    ); // Tương tự cho tháng trước

    // Tính phần trăm thay đổi
    const todayChange =
      yesterdayRevenue > 0
        ? (
            ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) *
            100
          ).toFixed(1) // Nhân 100 để có % và làm tròn 1 chữ số thập phân
        : 0; // Nếu hôm qua = 0 thì không tính được % (return 0)
    const monthChange =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
        : 0;

    // Tính trung bình/ngày
    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0
    ).getDate(); // Số ngày trong tháng hiện tại
    const daysPassed = now.getDate(); // Số ngày đã qua trong tháng (1-31)
    const avgDailyThisMonth =
      daysPassed > 0 ? thisMonthRevenue / daysPassed : 0; // Trung bình doanh thu/ngày trong tháng này
    const avgDailyLastMonth = lastMonthRevenue / lastMonthEnd.getDate(); // Trung bình doanh thu/ngày tháng trước (chia cho tổng số ngày của tháng trước)
    const avgDailyChange =
      avgDailyLastMonth > 0
        ? (
            ((avgDailyThisMonth - avgDailyLastMonth) / avgDailyLastMonth) *
            100
          ).toFixed(1)
        : 0;

    // Mục tiêu tháng (giả định 70M)
    const monthlyTarget = 70000000;
    const targetPercentage = ((thisMonthRevenue / monthlyTarget) * 100).toFixed(
      // % hoàn thành mục tiêu
      0 // Làm tròn về số nguyên (không có số thập phân)
    );

    setRevenueStats([
      {
        title: "Doanh thu hôm nay", // Tiêu đề thẻ
        value: formatCurrency(todayRevenue), // Giá trị đã format
        change: `${todayChange >= 0 ? "+" : ""}${todayChange}%`, // % thay đổi (thêm + nếu dương)
        changeType: todayChange >= 0 ? "increase" : "decrease", // Type để styling (màu xanh/đỏ)
        icon: "💰", // Icon emoji
        comparison: "so với hôm qua", // Text so sánh
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
        value: `${targetPercentage}%`, // Hiển thị % hoàn thành
        change: `${formatCurrency(
          // Hiển thị số tiền đã đạt/tổng mục tiêu
          thisMonthRevenue / 1000000 // Chia cho 1 triệu để hiển thị dạng "50M/70M"
        )}M/${formatCurrency(monthlyTarget / 1000000)}M`,
        changeType: thisMonthRevenue >= monthlyTarget ? "increase" : "decrease", // Xanh nếu đạt mục tiêu, đỏ nếu chưa
        icon: "🎯",
        comparison: "hoàn thành",
      },
    ]);
  };

  // Tính doanh thu theo trạm (nếu có thông tin station trong transaction)
  const calculateStationRevenue = async (transactions) => {
    // Hàm async tính doanh thu theo trạm (cần fetch thêm data từ API)
    const stationMap = new Map(); // Map để lưu doanh thu theo stationId (key = stationId, value = object {id, name, revenue, count})
    const unknownStationKey = "unknown"; // Key đặc biệt cho các transaction không xác định được station

    // Map để cache reservationId -> stationId để tránh fetch trùng
    const reservationToStationCache = new Map(); // Map cache để tránh fetch trùng reservationId (key = reservationId, value = {stationId, stationName})

    // Lấy tất cả unique reservationIds
    const uniqueReservationIds = [
      ...new Set(
        transactions.filter((t) => t.reservationId).map((t) => t.reservationId)
      ),
    ]; // Lấy mảng các reservationId unique từ transactions

    if (uniqueReservationIds.length === 0) {
      // Nếu không có reservationId nào
      setStationRevenue([]); // Set stationRevenue = mảng rỗng
      setAnalysis((prev) => ({
        // Update analysis state (merge với state cũ)
        ...prev, // Spread state cũ để giữ các field khác
        bestStation: "Chưa có dữ liệu", // Update bestStation
        bestStationRevenue: 0, // Update revenue = 0
      }));
      return; // Return sớm, không cần xử lý tiếp
    }

    // Fetch station info cho tất cả reservations
    try {
      const reservationPromises = uniqueReservationIds.map(
        // Map qua từng reservationId để tạo array of Promises
        async (reservationId) => {
          // Async function cho mỗi reservationId
          try {
            const res = await api.get(`/reservations/${reservationId}`); // Fetch reservation detail từ API
            const reservation = res.data?.data || res.data; // Lấy data từ response

            // Lấy stationId và stationName từ reservation
            let stationId = null; // Khởi tạo stationId = null
            let stationName = "Không xác định"; // Khởi tạo stationName mặc định

            if (reservation?.items?.[0]?.slot?.port) {
              // Kiểm tra reservation có items[0].slot.port không
              const portId = reservation.items[0].slot.port; // Lấy portId từ reservation
              try {
                const portRes = await api.get(`/stations/ports/${portId}`); // Fetch port detail để lấy stationId
                const portData = portRes.data?.data || portRes.data; // Lấy data từ response

                if (portData?.station) {
                  // Nếu port có trường station (stationId)
                  stationId = portData.station; // Lấy stationId
                  const stationRes = await api.get(`/stations/${stationId}`); // Fetch station detail để lấy tên
                  const stationData = stationRes.data?.data || stationRes.data; // Lấy data từ response
                  stationName = stationData?.name || "Không xác định"; // Lấy name, fallback về "Không xác định"
                }
              } catch (err) {
                // Bắt lỗi nếu fetch port/station fail
                console.log("Error fetching station info:", err); // Log lỗi (không throw để không break Promise.all)
              }
            }

            return { reservationId, stationId, stationName }; // Return object chứa thông tin đã fetch
          } catch (err) {
            // Bắt lỗi nếu fetch reservation fail
            console.log(`Error fetching reservation ${reservationId}:`, err); // Log lỗi
            return {
              // Return object mặc định
              reservationId,
              stationId: null,
              stationName: "Không xác định",
            };
          }
        }
      );

      const results = await Promise.all(reservationPromises); // Chờ tất cả promises resolve, trả về array kết quả (order được giữ nguyên)

      // Tạo cache reservationId -> stationId/stationName
      results.forEach(({ reservationId, stationId, stationName }) => {
        // Duyệt qua từng kết quả để build cache
        reservationToStationCache.set(reservationId, {
          // Set cache: key = reservationId, value = object {stationId, stationName}
          stationId,
          stationName,
        });
      });

      // Giờ group transactions theo stationId
      transactions.forEach((transaction) => {
        // Duyệt qua từng transaction để tính doanh thu theo station
        const reservationId = transaction.reservationId; // Lấy reservationId từ transaction

        if (reservationId && reservationToStationCache.has(reservationId)) {
          // Nếu có reservationId và có trong cache
          const { stationId, stationName } =
            reservationToStationCache.get(reservationId); // Lấy stationId và stationName từ cache

          if (stationId) {
            // Nếu có stationId (đã fetch được station)
            if (!stationMap.has(stationId)) {
              // Nếu chưa có stationId trong Map
              stationMap.set(stationId, {
                // Khởi tạo entry mới trong Map
                id: stationId,
                name: stationName,
                revenue: 0, // Doanh thu ban đầu = 0
                count: 0, // Số lượng transaction ban đầu = 0
              });
            }
            stationMap.get(stationId).revenue += transaction.amount || 0; // Cộng dồn doanh thu (fallback 0 nếu amount null)
            stationMap.get(stationId).count += 1; // Tăng count lên 1
          } else {
            // Nếu không có stationId (không fetch được)
            if (!stationMap.has(unknownStationKey)) {
              // Nếu chưa có entry "unknown" trong Map
              stationMap.set(unknownStationKey, {
                // Khởi tạo entry "unknown"
                id: unknownStationKey,
                name: "Không xác định",
                revenue: 0,
                count: 0,
              });
            }
            stationMap.get(unknownStationKey).revenue +=
              transaction.amount || 0; // Cộng dồn vào "unknown"
            stationMap.get(unknownStationKey).count += 1;
          }
        } else if (reservationId) {
          // Nếu có reservationId nhưng không có trong cache (lỗi khi fetch)
          if (!stationMap.has(unknownStationKey)) {
            // Khởi tạo entry "unknown" nếu chưa có
            stationMap.set(unknownStationKey, {
              id: unknownStationKey,
              name: "Không xác định",
              revenue: 0,
              count: 0,
            });
          }
          stationMap.get(unknownStationKey).revenue += transaction.amount || 0; // Cộng vào "unknown"
          stationMap.get(unknownStationKey).count += 1;
        }
      });

      // Chuyển sang array và sắp xếp theo revenue (group theo stationId)
      const stationArray = Array.from(stationMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5

      // Tính percentage và growth
      const maxRevenue = stationArray.length > 0 ? stationArray[0].revenue : 1; // Doanh thu cao nhất (của station đầu tiên), fallback 1 để tránh chia 0
      const stationsWithStats = stationArray.map((station) => ({
        // Map qua từng station để thêm thống kê
        ...station, // Spread toàn bộ properties (id, name, revenue, count)
        percentage: ((station.revenue / maxRevenue) * 100).toFixed(0), // Tính % so với maxRevenue (để vẽ progress bar), làm tròn về số nguyên
        growth: 0, // Growth mặc định = 0 (có thể tính thêm nếu có data tháng trước)
      }));

      setStationRevenue(stationsWithStats); // Set state với array stations đã có thống kê

      // Cập nhật analysis với tên trạm chính xác
      if (stationsWithStats.length > 0) {
        // Nếu có ít nhất 1 station
        const topStation = stationsWithStats[0]; // Lấy station đầu tiên (doanh thu cao nhất)
        setAnalysis((prev) => ({
          // Update analysis state
          ...prev, // Giữ các field khác
          bestStation: topStation.name, // Update tên station tốt nhất
          bestStationRevenue: topStation.revenue, // Update doanh thu của station tốt nhất
        }));
      } else {
        // Nếu không có station nào
        setAnalysis((prev) => ({
          // Update analysis với giá trị mặc định
          ...prev,
          bestStation: "Chưa có dữ liệu",
          bestStationRevenue: 0,
        }));
      }
    } catch (err) {
      // Bắt lỗi nếu có exception trong quá trình fetch
      console.log("Error fetching station revenue:", err); // Log lỗi

      setStationRevenue([]); // Set stationRevenue = mảng rỗng

      setAnalysis((prev) => ({
        // Update analysis với error message
        ...prev,
        bestStation: "Lỗi khi tải dữ liệu",
        bestStationRevenue: 0,
      }));
    }
  };

  // Tính doanh thu theo ngày
  const calculateDailyRevenue = (transactions, fromDate, toDate) => {
    // Hàm tính doanh thu theo từng ngày cho biểu đồ cột
    const days = []; // Mảng lưu các ngày (không dùng đến - có thể xóa)
    const revenueMap = new Map(); // Map lưu doanh thu theo ngày (key = "YYYY-MM-DD", value = revenue)

    const currentDate = new Date(fromDate); // Clone fromDate để duyệt qua từng ngày
    while (currentDate <= toDate) {
      // Loop từ fromDate đến toDate
      const dateKey = currentDate.toISOString().split("T")[0]; // Lấy phần date từ ISO string (YYYY-MM-DD)
      revenueMap.set(dateKey, 0); // Khởi tạo revenue = 0 cho ngày này
      currentDate.setDate(currentDate.getDate() + 1); // Tăng currentDate lên 1 ngày
    }

    transactions.forEach((transaction) => {
      // Duyệt qua từng transaction để cộng doanh thu vào ngày tương ứng
      const date = new Date(transaction.createdAt); // Parse createdAt thành Date
      const dateKey = date.toISOString().split("T")[0]; // Lấy date key (YYYY-MM-DD)
      if (revenueMap.has(dateKey)) {
        // Nếu dateKey có trong Map (nằm trong khoảng fromDate-toDate)
        revenueMap.set(
          dateKey,
          revenueMap.get(dateKey) + (transaction.amount || 0) // Cộng dồn amount vào revenue của ngày đó
        );
      }
    });

    // Chuyển sang array và lấy 30 ngày gần nhất
    const dailyArray = Array.from(revenueMap.entries())
      .map(([date, revenue]) => ({ date, revenue })) // Map thành array of objects {date, revenue}
      .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sắp xếp tăng dần theo date (cũ -> mới)
      .slice(-30); // Lấy 30 phần tử cuối (30 ngày gần nhất)

    setDailyRevenue(dailyArray); // Set state với array
  };

  // Tính phân tích chi tiết
  const calculateAnalysis = (transactions) => {
    // Hàm tính các phân tích chi tiết (doanh thu cao nhất, giờ cao điểm, tăng trưởng)
    if (transactions.length === 0) {
      // Nếu không có transaction nào
      setAnalysis({
        highestRevenue: 0,
        highestRevenueDate: "",
        bestStation: "Chưa có dữ liệu",
        bestStationRevenue: 0,
        peakHour: "N/A",
        monthGrowth: 0,
      });
      return; // Return sớm
    }

    // Doanh thu cao nhất trong ngày
    const dailyRevenueMap = new Map();
    transactions.forEach((transaction) => {
      const date = new Date(transaction.createdAt).toISOString().split("T")[0]; // Lấy date key
      if (!dailyRevenueMap.has(date)) {
        // Nếu chưa có date trong Map
        dailyRevenueMap.set(date, 0); // Khởi tạo = 0
      }
      dailyRevenueMap.set(
        date,
        dailyRevenueMap.get(date) + (transaction.amount || 0) // Cộng dồn amount
      );
    });

    let highestRevenue = 0; // Biến lưu doanh thu cao nhất
    let highestRevenueDate = ""; // Biến lưu ngày có doanh thu cao nhất
    dailyRevenueMap.forEach((revenue, date) => {
      if (revenue > highestRevenue) {
        // Nếu revenue của ngày này > highestRevenue hiện tại
        highestRevenue = revenue; // Update highestRevenue
        highestRevenueDate = date; // Update ngày
      }
    });

    // Thời gian cao điểm (giờ có nhiều giao dịch nhất)
    const hourMap = new Map();
    transactions.forEach((transaction) => {
      const hour = new Date(transaction.createdAt).getHours(); // Lấy giờ (0-23) từ createdAt
      if (!hourMap.has(hour)) {
        // Nếu chưa có giờ này trong Map
        hourMap.set(hour, 0); // Khởi tạo count = 0
      }
      hourMap.set(hour, hourMap.get(hour) + 1); // Tăng count lên 1
    });

    let peakHour = 0; // Biến lưu giờ có nhiều transaction nhất
    let peakCount = 0; // Biến lưu số lượng transaction của giờ cao điểm
    hourMap.forEach((count, hour) => {
      if (count > peakCount) {
        // Nếu count của giờ này > peakCount hiện tại
        peakCount = count; // Update peakCount
        peakHour = hour; // Update peakHour
      }
    });

    const peakHourRange = `${peakHour}:00 - ${peakHour + 2}:00`; // Format thành range 2 giờ (ví dụ: "14:00 - 16:00")

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

    const thisMonthRevenue = thisMonthTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const lastMonthRevenue = lastMonthTransactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    );
    const monthGrowth =
      lastMonthRevenue > 0
        ? (
            ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) *
            100
          ).toFixed(1)
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
    // Hàm helper format số tiền thành chuỗi VND
    if (!amount && amount !== 0) return "₫0"; // Nếu amount null/undefined (nhưng không phải 0) thì return "₫0"
    return new Intl.NumberFormat("vi-VN", {
      // Sử dụng Intl.NumberFormat API để format
      style: "currency", // Style là currency (tiền tệ)
      currency: "VND", // Đơn vị tiền VND
      minimumFractionDigits: 0, // Không hiển thị số thập phân (VND không có xu)
      maximumFractionDigits: 0, // Tối đa 0 số thập phân
    }).format(amount); // Format số amount và return chuỗi (ví dụ: "1.000.000 ₫")
  };

  // Format date
  const formatDate = (dateString) => {
    // Hàm helper format date thành "dd/mm/yyyy"
    if (!dateString) return "N/A"; // Nếu dateString rỗng/null thì return "N/A"
    try {
      const date = new Date(dateString); // Parse dateString thành Date object
      // Kiểm tra nếu date không hợp lệ
      if (isNaN(date.getTime())) {
        return "N/A"; // Return "N/A" nếu không hợp lệ
      }
      return date.toLocaleDateString("vi-VN", {
        // Format Date theo locale Việt Nam
        day: "2-digit", // Ngày 2 chữ số
        month: "2-digit", // Tháng 2 chữ số
        year: "numeric", // Năm đầy đủ
        timeZone: "Asia/Ho_Chi_Minh", // Timezone Việt Nam
      });
    } catch (error) {
      // Bắt lỗi nếu có exception
      console.error("Error formatting date:", error); // Log lỗi
      return "N/A"; // Return "N/A"
    }
  };

  // Format date time
  const formatDateTime = (dateString) => {
    // Hàm helper format datetime thành "dd/mm/yyyy, hh:mm"
    if (!dateString) return "N/A"; // Kiểm tra dateString rỗng
    try {
      const date = new Date(dateString); // Parse thành Date
      if (isNaN(date.getTime())) {
        // Kiểm tra hợp lệ
        return "N/A";
      }
      return date.toLocaleString("vi-VN", {
        // Format Date + Time theo locale VN
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit", // Giờ 2 chữ số
        minute: "2-digit", // Phút 2 chữ số
        timeZone: "Asia/Ho_Chi_Minh",
      });
    } catch (error) {
      console.error("Error formatting datetime:", error);
      return "N/A";
    }
  };

  // Get status badge
  const getStatusBadge = (status) => {
    // Hàm helper map status string sang nhãn hiển thị (emoji + text)
    const statusMap = {
      // Object map status -> label
      success: "✅ Hoàn thành",
      completed: "✅ Hoàn thành",
      failed: "❌ Thất bại",
      pending: "🟡 Đang xử lý",
      processing: "🟡 Đang xử lý",
      cancelled: "🚫 Đã hủy",
      refunded: "↩️ Đã hoàn tiền",
    };
    return statusMap[status] || status; // Return label từ map, fallback về status gốc nếu không có trong map
  };

  // Tính max revenue cho biểu đồ
  const maxRevenue =
    dailyRevenue.length > 0
      ? Math.max(...dailyRevenue.map((d) => d.revenue))
      : 1; // Fallback 1 nếu không có data (tránh chia 0 khi tính height %)

  if (loading) {
    // Nếu đang loading
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
    // Nếu có lỗi
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
            <h3>
              Biểu đồ doanh thu{" "}
              {timeFilter === "7days"
                ? "7"
                : timeFilter === "30days"
                ? "30"
                : ""}{" "}
              ngày qua
            </h3>
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
                    title={`${formatDate(day.date)}: ${formatCurrency(
                      day.revenue
                    )}`}
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
                <p
                  style={{
                    padding: "20px",
                    textAlign: "center",
                    color: "#999",
                  }}
                >
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
          <button
            className="btn-link"
            onClick={() =>
              (window.location.href = "/admin/transaction-management")
            }
          >
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
                        transaction.user?.email?.split("@")[0] ||
                        (transaction.userId
                          ? `User ${transaction.userId.slice(-6)}`
                          : "N/A")}
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
                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "20px",
                      color: "#999",
                    }}
                  >
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
              <div className="analysis-value">
                {formatCurrency(analysis.highestRevenue || 0)}
              </div>
              <div className="analysis-date">
                {analysis.highestRevenueDate || "N/A"}
              </div>
            </div>
            <div className="analysis-item">
              <div className="analysis-label">Trạm hiệu quả nhất</div>
              <div className="analysis-value">
                {analysis.bestStation === "Đang tải..."
                  ? "⏳ Đang tải..."
                  : analysis.bestStation &&
                    analysis.bestStation !== "Không xác định"
                  ? analysis.bestStation
                  : "Chưa có dữ liệu"}
              </div>
              <div className="analysis-date">
                {analysis.bestStation === "Đang tải..."
                  ? ""
                  : typeof analysis.bestStationRevenue === "number" &&
                    analysis.bestStationRevenue > 0
                  ? formatCurrency(analysis.bestStationRevenue)
                  : "0 ₫"}
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
                {analysis.monthGrowth
                  ? `${analysis.monthGrowth >= 0 ? "+" : ""}${
                      analysis.monthGrowth
                    }%`
                  : "0%"}
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
