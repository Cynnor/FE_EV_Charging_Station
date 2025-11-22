import { useState, useEffect } from "react";
import "./index.scss";

/**
 * Component ChargingStationCarousel
 *
 * Carousel tự động trình chiếu các hình ảnh quảng cáo về trạm sạc
 * Tính năng:
 * - Tự động chuyển slide sau mỗi 5 giây
 * - Điều hướng bằng nút trước/sau
 * - Chỉ báo (indicators) để chuyển đến slide cụ thể
 * - Hiệu ứng chuyển động mượt mà
 */
const ChargingStationCarousel = () => {
  // State lưu index của slide hiện tại đang hiển thị
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mảng chứa dữ liệu các slide quảng cáo - thay thế bằng hình ảnh thực tế của bạn
  const advertisements = [
    {
      id: 1,
      image: "./assets/AC4.jpg",
      title: "Trụ sạc AC - Tiết kiệm",
      description: "Sạc chậm an toàn cho xe.",
    },
    {
      id: 2,
      image: "./assets/DC60.jpg",
      title: "Trụ sạc DC - Nhanh chóng",
      description: "Sạc nhanh trong 30-60 phút",
    },
    {
      id: 3,
      image: "./assets/DC250.jpg",
      title: "Trụ sạc DC Ultra - Siêu tốc",
      description: "Công nghệ sạc nhanh mới.",
    },
    {
      id: 4,
      image: "./assets/banner.jpg",
      title: "Mạng lưới sạc toàn quốc",
      description: "Hơn 1000+ điểm sạc.",
    },
  ];

  /**
   * Effect tự động chuyển slide
   *
   * - Tạo interval để chuyển slide sau mỗi 5 giây
   * - Tự động quay vòng về slide đầu tiên khi đến slide cuối
   * - Cleanup interval khi component unmount để tránh memory leak
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
    }, 5000); // Đổi hình sau mỗi 5 giây

    // Cleanup function: dọn dẹp interval khi component unmount
    return () => clearInterval(interval);
  }, [advertisements.length]);

  /**
   * Chuyển đến slide cụ thể
   *
   * @param {number} index - Index của slide cần chuyển đến
   */
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  /**
   * Chuyển về slide trước đó
   * Nếu đang ở slide đầu tiên thì quay về slide cuối cùng
   */
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? advertisements.length - 1 : prevIndex - 1
    );
  };

  /**
   * Chuyển đến slide tiếp theo
   * Nếu đang ở slide cuối cùng thì quay về slide đầu tiên
   */
  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % advertisements.length);
  };

  return (
    <div className="charging-station-carousel">
      <div className="carousel-container">
        {/* Nút điều hướng về slide trước */}
        <button className="carousel-btn prev-btn" onClick={goToPrevious}>
          ‹
        </button>

        <div className="carousel-content">
          {/* Track chứa tất cả các slide, di chuyển bằng transform translateX */}
          <div
            className="carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {/* Render tất cả các slide quảng cáo */}
            {advertisements.map((ad) => (
              <div key={ad.id} className="carousel-slide">
                <img src={ad.image} alt={ad.title} />
                {/* Overlay hiển thị tiêu đề và mô tả trên hình ảnh */}
                <div className="carousel-overlay">
                  <h3>{ad.title}</h3>
                  <p>{ad.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nút điều hướng đến slide tiếp theo */}
        <button className="carousel-btn next-btn" onClick={goToNext}>
          ›
        </button>
      </div>

      {/* Các chấm chỉ báo (indicators) ở dưới carousel */}
      <div className="carousel-indicators">
        {advertisements.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default ChargingStationCarousel;
