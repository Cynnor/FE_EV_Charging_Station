import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import "./index.scss";
import api from "../../config/api";

/** ============== MAPPERS & TYPES (JS) ============== */
// Danh sách quận cố định theo yêu cầu (đã loại bỏ trùng lặp)
const FIXED_DISTRICTS = [
  "Quận 1",
  "Quận 2",
  "Quận 3",
  "Quận 4",
  "Quận 5",
  "Quận 6",
  "Quận 7",
  "Quận 8",
  "Quận 10",
  "Quận 11",
  "Quận 12",
  "Q. Bình Thạnh",
  "Q. Gò Vấp",
  "Q. Phú Nhuận",
  "Q. Tân Bình",
  "P. Tân Phú",
  "Thủ Đức",
  "H. Bình Chánh",
  "H. Cần Giờ",
  "H. Củ Chi",
  "H. Hóc Môn",
  "H. Nhà Bè",
];

// Chuyển danh sách cổng sạc (ports) → kiểu trạm hiển thị
function chooseStationType(ports = []) {
  if (!ports.length) return "AC";
  const maxPower = Math.max(...ports.map((p) => p?.powerKw || 0), 0);
  const hasDC = ports.some((p) => p?.type === "DC");
  if (hasDC && maxPower >= 120) return "DC ULTRA";
  if (hasDC) return "DC";
  return "AC";
}
function toPriceVND(num) {
  if (!num && num !== 0) return "-";
  try {
    return `${Number(num).toLocaleString("vi-VN")} đ/kWh`;
  } catch {
    return `${num} đ/kWh`;
  }
}

// Trích xuất tên quận từ địa chỉ để phục vụ filter (bị xóa trước đó)
function extractDistrictFromAddress(address) {
  if (!address || typeof address !== "string") return null;
  const raw = address.trim();

  // Các pattern phổ biến: "Quận 1", "Q1", "Q. 1", "District 1"
  const patterns = [
    { re: /quận\s*(\d{1,2})\b/i, format: (m) => `Quận ${m[1]}` },
    { re: /\bq\.?\s*(\d{1,2})\b/i, format: (m) => `Quận ${m[1]}` },
    { re: /district\s*(\d{1,2})\b/i, format: (m) => `Quận ${m[1]}` },
    // Ví dụ: "Huyện Củ Chi", "Huyện Nhà Bè"
    {
      re: /huyện\s*([^,\-\n]+)\b/i,
      format: (m) => `Huyện ${m[1].trim().replace(/\s+/g, " ")}`,
    },
    // Ví dụ: "TP Thủ Đức", "Thành phố Thủ Đức" → chuẩn hoá về "TP Thủ Đức"
    { re: /(tp\.?|thành phố)\s*thủ\s*đức\b/i, format: () => "TP Thủ Đức" },
  ];

  for (const p of patterns) {
    const m = raw.match(p.re);
    if (m) return p.format(m);
  }

  // Trường hợp "Quận" tên chữ: "Quận Bình Thạnh" (lấy đến dấu phẩy)
  const namedDistrict = raw.match(/quận\s*([^,\-\n]+)\b/i);
  if (namedDistrict) {
    const name = namedDistrict[1].trim().replace(/\s+/g, " ");
    return `Quận ${name}`;
  }

  return null;
}

// Escape string for use in RegExp
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ✅ Thêm hàm tính khoảng cách ở đây
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};
/** Map 1 item API -> 1 station cho UI map/list.
 *  Lưu thêm rawPorts để bước 2 dùng làm "chargers".
 */
function mapApiStation(s) {
  const total = s?.ports?.length || 0;
  const available =
    s?.ports?.filter((p) => p?.status === "available").length || 0;
  const maxPower = total ? Math.max(...s.ports.map((p) => p?.powerKw || 0)) : 0;
  const minPrice = total ? Math.min(...s.ports.map((p) => p?.price || 0)) : 0;

  return {
    id: s.id,
    name: s.name,
    address: s.address,
    // Chuẩn hoá quận/huyện/TP để phục vụ filter chính xác
    district: extractDistrictFromAddress(s.address) || null,
    coords: [s.latitude, s.longitude], // API trả longitude/latitude → đổi về [lat, lng]
    type: chooseStationType(s.ports || []), // "AC" | "DC" | "DC ULTRA"
    speed: maxPower ? `${maxPower} kW` : "-",
    price: minPrice ? toPriceVND(minPrice) : "-",
    available,
    total,
    distance: "", // có thể tính theo vị trí user nếu cần
    rating: undefined,
    rawPorts: s.ports || [], // giữ lại để vẽ chargers ở Step 2
    status: s.status || "active", // "active" | "inactive" | "maintenance"
  };
}

/** Map port -> charger card */
function mapPortToCharger(port, idx, baseLatLng) {
  // 👇 Kiểm tra port có hợp lệ không
  if (!port || typeof port !== "object") {
    console.warn("⚠️ Port không hợp lệ:", port);
    return null; // hoặc throw error
  }
  const connector = port.type === "DC" ? "CCS2" : "Type 2";
  // Tạo toạ độ lệch nhẹ để render nhiều marker (nếu map cần)
  const delta = 0.00012;
  const coords = [
    (baseLatLng?.[0] || 0) +
      (idx % 3 === 0 ? delta : idx % 3 === 1 ? -delta : 0),
    (baseLatLng?.[1] || 0) + (idx % 2 === 0 ? delta : -delta),
  ];

  // 👇 Chuyển speed từ API thành nhãn đẹp
  const speedLabels = {
    slow: "Slow",
    fast: "Fast",
    super_fast: "Super Fast",
    // thêm nếu cần
  };

  const typeLabels = {
    AC: "AC",
    DC: port.powerKw >= 120 ? "Ultra" : "DC", // hoặc nếu API có sẵn "Ultra", thì dùng port.type luôn
  };
  return {
    id: port.id, // LUÔN lấy id thực tế từ API
    name: `Trụ ${idx + 1}`,
    coords,
    power: `${port.powerKw ?? "-"} kW`,
    price: toPriceVND(port.price),
    status: port.status || "available",
    connector,
    // 👇 Dùng trực tiếp từ API + map sang nhãn đẹp
    typeLabel: typeLabels[port.type] || port.type,
    speedLabel: speedLabels[port.speed] || "Unknown",
  };
}

// ✅ Helper: chỉ cho phép chọn slot có trạng thái 'available'
const SELECTABLE_SLOT_STATUS = "available";
const NON_SELECTABLE_SLOT_STATUSES = [
  "booked",
  "reserved",
  "occupied",
  "maintenance",
  "disabled",
  "unavailable",
];
const isSlotSelectable = (status) => status === SELECTABLE_SLOT_STATUS;

/** =================== COMPONENT =================== */
export default function BookingPage() {
  const [vehicleId, setVehicleId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { stationId } = useParams();

  const today = new Date();
  const defaultDate = today.toISOString().split("T")[0];
  const defaultTime = today.toTimeString().slice(0, 5);
  const minDate = defaultDate;
  const maxDate = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const [step, setStep] = useState(1);
  const [stations, setStations] = useState([]); // dữ liệu thật
  const [districts, setDistricts] = useState(FIXED_DISTRICTS); // danh sách quận cố định
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedStation, setSelectedStation] = useState(null);
  const [selectedCharger, setSelectedCharger] = useState(null);

  // Step 3: slots
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [submitting, setSubmitting] = useState(false); // prevent double submit + show loading

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // giữ state nhưng không áp dụng lọc loại trạm
  const [districtFilter, setDistrictFilter] = useState("all"); // "all" | <districtName>

  const [userLocation, setUserLocation] = useState(null);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Lấy filter từ URL (?type=AC|DC|DC_ULTRA)
  useEffect(() => {
    const typeFromUrl = searchParams.get("type");
    if (typeFromUrl) {
      const normalized = typeFromUrl === "DC_ULTRA" ? "DC ULTRA" : typeFromUrl;
      if (["AC", "DC", "DC ULTRA"].includes(normalized))
        setFilterType(normalized);
    }
  }, [searchParams]);

  // Gọi API /stations
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const { data } = await api.get("/stations", {
          params: {
            page: 1,
            limit: 120,
            includePorts: true,
            // name: searchTerm || undefined, // bật nếu muốn filter server-side
          },
        });
        if (cancelled) return;
        const mapped = (data?.items || []).map(mapApiStation);
        setStations(mapped);
        // Hiển thị danh sách quận cố định
        setDistricts(FIXED_DISTRICTS);

        // Nếu có stationId từ URL, tự động chọn trạm và chuyển sang Step 2
        if (stationId && !cancelled) {
          const found = mapped.find((s) => String(s.id) === String(stationId));
          if (found) {
            setSelectedStation(found);
            setStep(2);
          }
        }
        // Nếu chưa có center chọn, bạn có thể chọn trạm đầu tiên
        // if (!selectedStation && mapped[0]) setSelectedStation(mapped[0]);
      } catch (e) {
        if (!cancelled) setError(e?.message || "Không thể tải danh sách trạm");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []); // chỉ load 1 lần. Nếu muốn search theo từ khoá, thêm [searchTerm]

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserLocation([latitude, longitude]);
        },
        (err) => {
          console.warn("Không thể lấy vị trí người dùng:", err);
          // Không cần setError vì không phải lỗi nghiêm trọng
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, []);

  const defaultCenter = [10.850268581807446, 106.76508926692969];

  // // Lọc client-side theo ô tìm kiếm và filterType
  // const filteredStations = useMemo(() => {
  //   return stations.filter((station) => {
  //     const matchesSearch =
  //       !searchTerm ||
  //       station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //       station.address.toLowerCase().includes(searchTerm.toLowerCase());

  //     const matchesType = filterType === "all" ? true : station.type === filterType;
  //     return matchesSearch && matchesType;
  //   });
  // }, [stations, searchTerm, filterType]);
  // ✅ Tính khoảng cách từ vị trí người dùng đến từng trạm
  const stationsWithDistance = useMemo(() => {
    if (!userLocation || !stations.length) {
      return stations.map((s) => ({ ...s, distance: "" }));
    }
    const [lat, lon] = userLocation;
    return stations.map((station) => {
      const dist = getDistanceKm(
        lat,
        lon,
        station.coords[0],
        station.coords[1]
      );
      return {
        ...station,
        distance: `${dist.toFixed(1)} km`,
      };
    });
  }, [stations, userLocation]);

  // Lọc client-side theo ô tìm kiếm và filterType (dựa trên trạm đã có khoảng cách)
  const filteredStations = useMemo(() => {
    // 1. Lọc: chỉ giữ trạm có ít nhất 1 cổng "available"
    const filtered = stationsWithDistance.filter((station) => {
      const isValidStatus =
        station.status === "active" || station.status === "maintenance";
      if (!isValidStatus) return false;

      // 2. Tiếp tục lọc theo tìm kiếm và loại trạm
      const matchesSearch =
        !searchTerm ||
        (station.name &&
          station.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (station.address &&
          station.address.toLowerCase().includes(searchTerm.toLowerCase()));

      // Lọc theo loại trạm nếu có filterType từ URL
      const matchesType =
        filterType === "all" ? true : station.type === filterType;

      // 3. Lọc theo quận
      // Nếu station đã có trường `district` (được extract), so sánh chính xác.
      // Nếu không, fallback sang kiểm tra bằng regex với word-boundary để tránh
      // trường hợp 'Quận 1' khớp nhầm 'Quận 10'.
      let matchesDistrict = true;
      if (districtFilter !== "all") {
        const stationDistrict =
          station.district ||
          extractDistrictFromAddress(station.address) ||
          null;
        if (stationDistrict) {
          matchesDistrict =
            stationDistrict.toLowerCase() === districtFilter.toLowerCase();
        } else {
          const escaped = escapeRegex(districtFilter);
          const re = new RegExp(`\\b${escaped}\\b`, "i");
          matchesDistrict = re.test(station.address || "");
        }
      }

      return matchesSearch && matchesType && matchesDistrict;
    });

    // 3. Sắp xếp theo khoảng cách (gần nhất lên đầu) nếu có vị trí người dùng
    if (userLocation) {
      return filtered.sort((a, b) => {
        const distA = a.distance
          ? Number.parseFloat(a.distance)
          : Number.POSITIVE_INFINITY;
        const distB = b.distance
          ? Number.parseFloat(b.distance)
          : Number.POSITIVE_INFINITY;
        return distA - distB;
      });
    }

    return filtered;
  }, [
    stationsWithDistance,
    searchTerm,
    filterType,
    districtFilter,
    userLocation,
  ]);

  // Chargers sinh từ ports của trạm đã chọn
  const chargers = useMemo(() => {
    if (!selectedStation?.rawPorts?.length) return [];
    // Chỉ hiển thị available và in_use (bao gồm occupied → chuẩn hoá thành in_use)
    return selectedStation.rawPorts
      .filter(
        (p) =>
          p?.status === "available" ||
          p?.status === "in_use" ||
          p?.status === "occupied"
      )
      .map((p) => {
        const normalized = { ...p };
        if (normalized.status === "occupied") normalized.status = "in_use";
        return normalized;
      })
      .map((p, idx) => mapPortToCharger(p, idx, selectedStation.coords));
  }, [selectedStation]);

  const [formData, setFormData] = useState({
    date: defaultDate,
    startTime: defaultTime,
    endTime: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Replace handleSubmit with async version: revalidate slot + validate time + guard
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Chặn ngay nếu slot không còn 'available'
    if (!selectedSlot || !isSlotSelectable(selectedSlot.status)) {
      alert("❌ Slot không còn khả dụng. Vui lòng chọn slot khác.");
      setStep(3);
      return;
    }

    if (!selectedStation || !selectedCharger || !selectedSlot) {
      alert("⚠️ Vui lòng chọn trạm, trụ và slot!");
      return;
    }

    if (!vehicleId) {
      alert("❌ Không tìm thấy xe của bạn. Vui lòng kiểm tra lại profile!");
      return;
    }

    // Build ISO in UTC - Auto calculate endTime as startTime + 15 minutes
    const toUtcIso = (dateStr, timeStr) => {
      // dateStr: "YYYY-MM-DD", timeStr: "HH:mm" (local)
      const [h, m] = timeStr.split(":").map(Number);
      const dt = new Date(dateStr);
      dt.setHours(h, m, 0, 0); // local time
      return dt.toISOString(); // convert → UTC "Z"
    };
    
    // Calculate endTime as startTime + 15 minutes
    const [startHour, startMin] = formData.startTime.split(":").map(Number);
    const endDateTime = new Date(formData.date);
    endDateTime.setHours(startHour, startMin + 15, 0, 0);
    const endHour = endDateTime.getHours();
    const endMin = endDateTime.getMinutes();
    const calculatedEndTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
    
    const startAtIso = toUtcIso(formData.date, formData.startTime);
    const endAtIso = toUtcIso(formData.date, calculatedEndTime);

    // Quick time validation to reduce 400 from API
    // Allow booking time within 5 minutes in the past
    const now = new Date();
    const startDate = new Date(startAtIso);
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    if (startDate < fiveMinutesAgo) {
      alert("❌ Giờ bắt đầu không được quá 5 phút trong quá khứ.");
      return;
    }

    // Re-validate latest slot status before booking (avoid race conditions)
    setSubmitting(true);
    try {
      const url = `/stations/ports/${encodeURIComponent(
        selectedCharger.id
      )}/slots`;
      const { data } = await api.get(url);
      const latest = data?.items || [];
      setSlots(latest);
      const current = latest.find((s) => s.id === selectedSlot.id);
      if (!current || !isSlotSelectable(current.status)) {
        alert(
          "❌ Slot này vừa được đặt bởi người khác. Vui lòng chọn slot khác."
        );
        setSelectedSlot(null);
        setStep(3);
        setSubmitting(false);
        return;
      }
    } catch (verifyErr) {
      console.error("❌ Không thể xác minh trạng thái slot:", verifyErr);
      alert("Không thể xác minh trạng thái slot. Vui lòng thử lại.");
      setSubmitting(false);
      return;
    }

    const payload = {
      vehicleId,
      items: [
        {
          slotId: selectedSlot.id,
          startAt: startAtIso,
          endAt: endAtIso,
        },
      ],
      // status: "pending", // để server quyết định trạng thái, tránh 400 nếu không cho phép
    };

    try {
      const res = await api.post("/reservations", payload);
      const reservationData = res.data.data || res.data;
      const reservationId = reservationData?.id;

      if (reservationId) {
        const vehicleInfo = selectedVehicle || {
          id: vehicleId,
          plateNumber: "N/A",
          make: "N/A",
          model: "N/A",
        };
        navigate("/booking-success", {
          state: {
            reservation: reservationData,
            station: selectedStation,
            charger: selectedCharger,
            vehicle: vehicleInfo,
            bookingTime: {
              date: formData.date,
              startTime: formData.startTime,
              endTime: calculatedEndTime,
            },
          },
          replace: true,
        });
      } else {
        console.warn("⚠️ Không tìm thấy reservationId trong response");
        alert("Đặt chỗ thành công nhưng không nhận được ID.");
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("❌ Lỗi khi tạo reservation:", err);

      if (err.response?.status === 409) {
        alert(
          "❌ Slot này đã được đặt bởi người khác. Vui lòng chọn slot khác."
        );
        setSelectedSlot(null);
        setStep(3);

        // reload once
        try {
          const url = `/stations/ports/${encodeURIComponent(
            selectedCharger.id
          )}/slots`;
          setSlotsLoading(true);
          const { data } = await api.get(url);
          setSlots(data?.items || []);
        } catch (reloadErr) {
          console.error("❌ Lỗi khi reload slots:", reloadErr);
          setSlotsError("Không thể tải lại danh sách slot");
          setSlots([]);
        } finally {
          setSlotsLoading(false);
        }
      } else if (err.response?.status === 400) {
        const errorMsg =
          err.response.data?.message ||
          "Dữ liệu đặt chỗ không hợp lệ (kiểm tra thời gian, slot/port).";
        alert(`❌ Đặt chỗ thất bại: ${errorMsg}`);
      } else {
        const errorMsg =
          err.response?.data?.message || err.message || "Lỗi không xác định";
        alert(`❌ Đặt chỗ thất bại: ${errorMsg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };
  // Lấy id xe khi vào trang booking
  useEffect(() => {
    api
      .get("/vehicles")
      .then((res) => {
        // Ưu tiên lấy id xe đầu tiên
        const id =
          Array.isArray(res.data.items) && res.data.items.length > 0
            ? res.data.items[0].id
            : "";
        setVehicleId(id);
      })
      .catch(() => setVehicleId(""));
  }, []);

  const priceEstimate1h = useMemo(() => {
    if (!selectedCharger?.power || !selectedCharger?.price) return "-";
    const powerKw =
      Number(String(selectedCharger.power).replace(/[^\d.]/g, "")) || 0;
    const priceVnd =
      Number(String(selectedCharger.price).replace(/[^\d]/g, "")) || 0;
    if (!powerKw || !priceVnd) return "-";
    // ước tính = kW * đ/kWh * 1h
    return `${(powerKw * priceVnd).toLocaleString("vi-VN")} đ`;
  }, [selectedCharger]);


  // Fetch slots when entering step 3
  useEffect(() => {
    async function fetchSlots() {
      // console.log("🚀 Step:", step);
      // console.log("🚀 selectedCharger:", selectedCharger); // 👈 Log xem có dữ liệu không
      // console.log("🚀 selectedCharger.id:", selectedCharger?.id); // 👈 Log ID

      if (step === 3 && selectedCharger && selectedCharger.id) {
        const url = `/stations/ports/${encodeURIComponent(
          selectedCharger.id
        )}/slots`;
        // console.log("✅ Gọi API với URL:", url);
        setSlotsLoading(true);
        setSlotsError(null);
        try {
          const { data } = await api.get(url);
          // console.log("✅ Response từ API slots:", data); // 👈 Log response
          // console.log("✅ data.items:", data?.items);
          setSlots(data?.items || []);
        } catch (e) {
          console.error("❌ Lỗi khi gọi API slots:", e);
          setSlotsError(`Không thể tải slot. Chi tiết: ${e.message}`);
        } finally {
          setSlotsLoading(false);
        }
      } else {
        setSlots([]);
      }
    }
    fetchSlots();
  }, [step, selectedCharger]);

  // Lấy danh sách xe khi vào trang booking
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get("/vehicles");
        const vehiclesList = res.data?.items || [];
        setVehicles(vehiclesList);

        // Lấy xe mặc định từ localStorage
        const defaultVehicleId = localStorage.getItem("defaultVehicleId");

        if (defaultVehicleId) {
          const defaultVehicle = vehiclesList.find(
            (v) => v.id === defaultVehicleId
          );
          if (defaultVehicle) {
            setSelectedVehicle(defaultVehicle);
            setVehicleId(defaultVehicleId);
          } else if (vehiclesList.length > 0) {
            setSelectedVehicle(vehiclesList[0]);
            setVehicleId(vehiclesList[0].id);
          }
        } else if (vehiclesList.length > 0) {
          setSelectedVehicle(vehiclesList[0]);
          setVehicleId(vehiclesList[0].id);
        }
      } catch (error) {
        console.error("Error fetching vehicles:", error);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <div className="booking-wrapper">
      <div
        className={`booking-container full-width ${
          step === 3 ? "confirmation-mode" : ""
        }`}
      >
        <div className="left-panel">
          <div className="panel-header">
            <h1>Đặt chỗ sạc xe</h1>
            <div className="step-indicator">
              <div 
                className={`step ${step >= 1 ? "active" : ""} ${step === 1 ? "current" : ""}`}
                onClick={() => setStep(1)}
                style={{ cursor: 'pointer' }}
              >
                <span className="step-number">1</span>
                <span className="step-label">Chọn trạm</span>
              </div>
              <div className="step-divider"></div>
              <div 
                className={`step ${step >= 2 ? "active" : ""} ${step === 2 ? "current" : ""} ${step < 2 ? "disabled" : ""}`}
                onClick={() => {
                  if (step >= 2) setStep(2);
                }}
                style={{ cursor: step >= 2 ? 'pointer' : 'not-allowed' }}
              >
                <span className="step-number">2</span>
                <span className="step-label">Chọn trụ</span>
              </div>
              <div className="step-divider"></div>
              <div 
                className={`step ${step >= 3 ? "active" : ""} ${step === 3 ? "current" : ""} ${step < 3 ? "disabled" : ""}`}
                onClick={() => {
                  if (step >= 3) setStep(3);
                }}
                style={{ cursor: step >= 3 ? 'pointer' : 'not-allowed' }}
              >
                <span className="step-number">3</span>
                <span className="step-label">Đặt chỗ & Xác nhận</span>
              </div>
            </div>
          </div>

          {/* STEP 1 */}
          {step === 1 && (
            <div className="station-selection">
              <div className="search-filters">
                <div className="search-box">
                  <svg
                    className="search-icon"
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM19 19l-4.35-4.35"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm trạm sạc theo tên hoặc địa chỉ..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  {searchTerm && (
                    <button
                      className="clear-search"
                      onClick={() => setSearchTerm("")}
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả loại trạm</option>
                  <option value="AC">AC - Sạc chậm</option>
                  <option value="DC">DC - Sạc nhanh</option>
                  <option value="DC ULTRA">DC Ultra - Siêu nhanh</option>
                </select>

                <select
                  value={districtFilter}
                  onChange={(e) => setDistrictFilter(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">Tất cả quận</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {loading && (
                <div className="results-count">Đang tải danh sách trạm…</div>
              )}
              {error && (
                <div className="results-count" style={{ color: "tomato" }}>
                  Lỗi: {error}
                </div>
              )}

              {!loading && !error && (
                <>
                  <div className="results-count">
                    Tìm thấy <strong>{filteredStations.length}</strong> trạm sạc
                  </div>

                  <div className="stations-list">
                    {filteredStations.map((station) => (
                      <div
                        key={station.id}
                        className={`station-card ${station.type
                          .toLowerCase()
                          .replace(" ", "-")} ${
                          selectedStation?.id === station.id ? "selected" : ""
                        }`}
                        onClick={() => {
                          setSelectedStation(station);
                          setSelectedCharger(null);
                          setStep(2);
                        }}
                      >
                        <div className="station-header">
                          <h3 className="station-name">{station.name}</h3>
                          {station.distance && (
                            <div className="station-distance">
                              {station.distance}
                            </div>
                          )}
                        </div>

                        <div className="station-availability">
                          <div className="availability-bar">
                            <div
                              className="availability-fill"
                              style={{
                                width: `${
                                  station.total
                                    ? (station.available / station.total) * 100
                                    : 0
                                }%`,
                              }}
                            ></div>
                          </div>
                          <span className="availability-text">
                            {station.available}/{station.total} trụ khả dụng
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredStations.length === 0 && (
                    <div className="no-results">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M12 8v4M12 16h.01"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                      <p>Không tìm thấy trạm sạc phù hợp</p>
                      <button
                        onClick={() => {
                          setSearchTerm("");
                          setFilterType("all");
                        }}
                      >
                        Xóa bộ lọc
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && selectedStation && (
            <div className="charger-selection">
              <div className="selected-station-info">
                <h2>{selectedStation.name}</h2>
                <p className="station-address">{selectedStation.address}</p>
              </div>

              <p className="selection-hint">
                Chọn trụ sạc tương thích với xe của bạn
              </p>

              <div className="chargers-grid">
                {chargers.map((charger) => (
                  <div
                    key={charger.id}
                    className={`charger-card ${charger.status} ${
                      selectedCharger?.id === charger.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      if (charger.status === "available") {
                        // console.log("✅ Charger được chọn:", charger);
                        if (!charger.id) {
                          console.error("❌ Charger không có id!");
                          return;
                        }
                        setSelectedCharger(charger);
                        setStep(3);
                      }
                    }}
                  >
                    <div className="charger-header">
                      <h3>{charger.name}</h3>
                      <span className={`status-badge ${charger.status}`}>
                        {charger.status === "available" && "✓ Sẵn sàng"}
                        {charger.status === "in_use" && "⏱ Đang sử dụng"}
                      </span>
                    </div>
                    <div className="type-row">
                      <span
                        className={`type-badge ${String(charger.typeLabel)
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {charger.typeLabel}
                      </span>
                      <div
                        className={`speed-badge ${String(charger.speedLabel)
                          .toLowerCase()
                          .replace(/\s+/g, "_")}`}
                      >
                        {charger.speedLabel}
                      </div>
                    </div>

                    <div className="charger-specs">
                      <div className="spec-item">
                        <div>
                          <div className="spec-label">Công suất</div>
                          <div className="spec-value">{charger.power}</div>
                        </div>
                      </div>

                      <div className="spec-item">
                        <div>
                          <div className="spec-label">Giá</div>
                          <div className="spec-value">{charger.price}</div>
                        </div>
                      </div>

                      <div className="spec-item">
                        <div>
                          <div className="spec-label">Đầu cắm</div>
                          <div className="spec-value">{charger.connector}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Slot selection & Confirmation (Merged) */}
          {step === 3 && selectedCharger && (
            <div className="booking-confirmation-merged">
              {/* Station & Charger Details - Combined */}
              <div className="selected-details-section">
                <div className="detail-card combined-detail">
                  <div className="detail-header">
                    <h3>Trạm & Trụ đã chọn</h3>
                  </div>
                  <div className="detail-body-combined">
                    <div className="station-section">
                      <div className="section-title">Trạm sạc</div>
                      <div className="detail-name">{selectedStation.name}</div>
                      <div className="detail-info">
                        <span>{selectedStation.address}</span>
                      </div>
                      {selectedStation.distance && (
                        <div className="distance-time-info">
                          <div className="info-item">
                            <span className="info-label">Khoảng cách</span>
                            <span className="info-value">
                              {typeof selectedStation.distance === 'number' 
                                ? `${selectedStation.distance.toFixed(1)} km`
                                : selectedStation.distance
                              }
                            </span>
                          </div>
                          <div className="info-item">
                            <span className="info-label">Thời gian di chuyển</span>
                            <span className="info-value">
                              ~{typeof selectedStation.distance === 'number'
                                ? Math.ceil(selectedStation.distance * 2)
                                : Math.ceil(parseFloat(selectedStation.distance) * 2)
                              } phút
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="divider-vertical"></div>

                    <div className="charger-section">
                      <div className="section-title">Trụ sạc</div>
                      <div className="detail-name">{selectedCharger.name}</div>
                      <div className="detail-specs-grid">
                        <div className="spec-badge">
                          <span className="spec-label">Loại</span>
                          <span className="spec-value">{selectedCharger.typeLabel}</span>
                        </div>
                        <div className="spec-badge">
                          <span className="spec-label">Công suất</span>
                          <span className="spec-value">{selectedCharger.power}</span>
                        </div>
                        <div className="spec-badge">
                          <span className="spec-label">Giá</span>
                          <span className="spec-value">{selectedCharger.price}</span>
                        </div>
                        <div className="spec-badge">
                          <span className="spec-label">Tốc độ</span>
                          <span className="spec-value">{selectedCharger.speedLabel}</span>
                        </div>
                        <div className="spec-badge">
                          <span className="spec-label">Đầu cắm</span>
                          <span className="spec-value">{selectedCharger.connector}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="merged-content-vertical">
                {/* SECTION 1: Slot Selection */}
                <div className="slot-selection-section">
                  <h3>1. Chọn slot sạc</h3>
                  {slotsLoading && <div className="loading-message">Đang tải slot…</div>}
                  {slotsError && (
                    <div className="error-message">Lỗi: {slotsError}</div>
                  )}
                  {!slotsLoading && !slotsError && (
                    <div className="slots-grid-compact">
                      {slots.length === 0 && (
                        <div className="no-slots-message">
                          Không có slot khả dụng cho trụ này
                        </div>
                      )}
                      {slots.map((slot, index) => {
                        const selectable = isSlotSelectable(slot.status);

                        // Map status sang label tiếng Việt
                        const getStatusLabel = (status) => {
                          const statusLabels = {
                            booked: "Đã được đặt trước",
                            reserved: "Đã được giữ chỗ",
                            occupied: "Đang sử dụng",
                            maintenance: "Đang bảo trì",
                            disabled: "Tạm ngưng",
                            unavailable: "Không khả dụng",
                          };
                          return statusLabels[status] || "Không khả dụng";
                        };

                         return (
                           <div
                             key={slot.id}
                             className={`slot-card ${slot.status} ${
                               selectedSlot?.id === slot.id ? "selected" : ""
                             } ${!selectable ? "disabled" : ""}`}
                             onClick={() => {
                               if (!selectable) return;
                               setSelectedSlot(slot);
                             }}
                           >
                             <div className="slot-header">
                               <div className="slot-number-wrapper">
                                 <span className="slot-number">
                                   Slot {index + 1}
                                 </span>
                               </div>
                               <span className={`slot-status-chip ${slot.status}`}>
                                 {selectable ? "✓ Có sẵn" : "✕ Đã đặt"}
                               </span>
                             </div>

                             {selectable && (
                               <div className="slot-body">
                                 <div className="slot-info-row">
                                   <span className="info-label">Loại slot</span>
                                   <span className="info-value">Sạc thường</span>
                                 </div>
                                 <div className="slot-info-row">
                                   <span className="info-label">Thời gian giữ chỗ</span>
                                   <span className="info-value">15 phút</span>
                                 </div>
                               </div>
                             )}

                            {!selectable && (
                              <div className="slot-unavailable-overlay">
                                <div className="unavailable-slot-number">Slot {index + 1}</div>
                                <span className="unavailable-icon">🚫</span>
                                <div className="unavailable-content">
                                  <span className="unavailable-title">
                                    {getStatusLabel(slot.status)}
                                  </span>
                                  <span className="unavailable-subtitle">
                                    Vui lòng chọn slot khác
                                  </span>
                                </div>
                              </div>
                            )}
                           </div>
                         );
                      })}
                    </div>
                  )}
                </div>

                {/* SECTION 2: Booking Form */}
                <div className="booking-form-section">
                  <h3>2. Chọn xe & Thời gian</h3>
                  
                  <div className="form-content-wrapper">
                     {/* Vehicle Selection */}
                     <div className="vehicle-selection-compact">
                       <label className="form-label">
                         Xe của bạn
                       </label>
                      {selectedVehicle ? (
                        <div className="selected-vehicle-display" onClick={() => setShowVehicleModal(true)}>
                          <div className="vehicle-info">
                            <div className="vehicle-icon">🏍️</div>
                            <div className="vehicle-details">
                              <span className="vehicle-plate">{selectedVehicle.plateNumber}</span>
                              <span className="vehicle-model">{selectedVehicle.make} {selectedVehicle.model}</span>
                            </div>
                          </div>
                          <button type="button" className="change-btn">Đổi phương tiện</button>
                        </div>
                      ) : (
                        <button 
                          type="button" 
                          className="select-vehicle-btn"
                          onClick={() => setShowVehicleModal(true)}
                        >
                          <span className="btn-icon">+</span>
                          Chọn phương tiện
                        </button>
                      )}
                    </div>

                     {/* Time Selection - Always Show */}
                     <div className="form-section">
                       <form className="booking-form-compact" onSubmit={handleSubmit}>
                         <label className="form-label">
                           Giờ đặt lịch
                         </label>
                         
                         <div className="reservation-notice">
                           ⏱️ Slot sạc của bạn sẽ được giữ chỗ trong vòng 15 phút
                         </div>

                        <div className="form-grid-two">
                          <div className="form-group-compact">
                            <label className="input-label">Ngày</label>
                            <input
                              type="date"
                              value={formData.date}
                              min={defaultDate}
                              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                              className="date-input-field"
                              required
                            />
                          </div>

                          <div className="form-group-compact">
                            <label className="input-label">Giờ</label>
                            <input
                              type="time"
                              value={formData.startTime}
                              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                              className="time-input-field"
                              required
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          className="submit-button-compact"
                          disabled={
                            !selectedSlot ||
                            !isSlotSelectable(selectedSlot.status) ||
                            !vehicleId ||
                            submitting
                          }
                        >
                          {submitting ? "Đang xử lý..." : "Xác nhận đặt chỗ"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ❌ Loại bỏ right-panel map */}
        {/* RIGHT PANEL: MAP */}
        {/* {step !== 4 && (
          <div className="right-panel">
            <div className="map-container">
              ...
            </div>
          </div>
        )} */}
      </div>

      {/* Vehicle Selection Modal */}
      {showVehicleModal && (
        <div
          className="datetime-modal-overlay"
          onClick={() => setShowVehicleModal(false)}
        >
          <div className="vehicle-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chọn xe của bạn</h3>
              <button
                className="modal-close"
                onClick={() => setShowVehicleModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {vehicles.length === 0 ? (
                <div className="no-vehicles">
                  <p>
                    Bạn chưa có xe nào. Vui lòng thêm xe trong trang Profile.
                  </p>
                  <button onClick={() => navigate("/profile")}>
                    Đi đến Profile
                  </button>
                </div>
              ) : (
                <div className="vehicles-grid-modal">
                  {vehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className={`vehicle-card-modal ${
                        selectedVehicle?.id === vehicle.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedVehicle(vehicle);
                        setVehicleId(vehicle.id);
                        setShowVehicleModal(false);
                      }}
                    >
                      <div className="vehicle-icon-large">🏍️</div>
                      <div className="vehicle-info-modal">
                        <div className="vehicle-name">{vehicle.make} {vehicle.model}</div>
                        <div className="vehicle-plate-large">{vehicle.plateNumber}</div>
                        <div className="vehicle-connector">{vehicle.connectorType}</div>
                      </div>
                      {localStorage.getItem("defaultVehicleId") ===
                        vehicle.id && (
                        <span className="default-badge-modal">Mặc định</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
