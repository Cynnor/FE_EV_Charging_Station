"use client"

import { Link } from "react-router-dom"
import { useEffect } from "react"
import "./index.scss"
import AC10 from "../../assets/AC10.jpg"
import sacAC4 from "../../assets/sacAC4.jpg"
import DC60 from "../../assets/DC60.jpg"
import DC120 from "../../assets/DC120.jpg"
import Banner from "../../assets/banner.jpg"

/* ----- Card hiển thị từng trạm sạc ----- */
function ChargingStationCard({ image, title, sockets, power, plugTypes, installTypes, protection, type }) {
  return (
    <div className="card">
      <div className="card-badge">{type}</div>

      <div className="card-image-wrapper">
        <img src={image || "/placeholder.svg"} alt={title} />
        <div className="card-overlay">
          <span className="overlay-text">Xem chi tiết</span>
        </div>
      </div>

      <div className="card-content">
        <h3>{title}</h3>

        <div className="specs-grid">
          <div className="spec-item">
            <div className="spec-icon power">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
              </svg>
            </div>
            <div className="spec-content">
              <span className="spec-label">Công suất</span>
              <span className="spec-value">{power}</span>
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-icon ports">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <div className="spec-content">
              <span className="spec-label">Số cổng</span>
              <span className="spec-value">{sockets}</span>
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-icon plug">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 7h-9M14 17H5M15 4v6M9 14v6" />
              </svg>
            </div>
            <div className="spec-content">
              <span className="spec-label">Dạng ổ cắm</span>
              <span className="spec-value">{plugTypes}</span>
            </div>
          </div>

          <div className="spec-item">
            <div className="spec-icon protection">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <div className="spec-content">
              <span className="spec-label">Bảo vệ</span>
              <span className="spec-value">{protection}</span>
            </div>
          </div>

          <div className="spec-item full-width">
            <div className="spec-icon install">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div className="spec-content">
              <span className="spec-label">Cách lắp đặt</span>
              <span className="spec-value">{installTypes}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-actions">
        <button className="btn-detail">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          Chi tiết
        </button>
        <Link to="/booking">
          <button className="btn-rent">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Đặt chỗ ngay
          </button>
        </Link>
      </div>
    </div>
  )
}

/* ----- Hero section ----- */
function ChargingStationHero() {
  return (
    <section className="charging-hero">
      <div className="hero-background-pattern"></div>

      <div className="hero-content">
        <div className="hero-text">
          <div className="hero-badge">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
            </svg>
            <span>Công nghệ tiên tiến</span>
          </div>

          <h2>BỘ SẠC XE ĐIỆN</h2>
          <p className="highlight">SẠC THÔNG MINH, DỄ DÀNG SỬ DỤNG, LẮP ĐẶT NHANH CHÓNG !</p>
          <p className="description">SẢN PHẨM AN TOÀN, ĐẠT TIÊU CHUẨN OCPP</p>

          <div className="hero-features">
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <span>Tiêu chuẩn OCPP</span>
            </div>
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span>An toàn tuyệt đối</span>
            </div>
            <div className="feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span>Hiệu suất cao</span>
            </div>
          </div>

          <a href="#charging-stations" className="btn">
            <span>Xem chi tiết sản phẩm</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>

        <div className="hero-image">
          <div className="image-decoration"></div>
          <img src={Banner || "/placeholder.svg"} alt="Banner EV Charging" />

          <div className="floating-card">
            <div className="floating-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
              </svg>
            </div>
            <div className="floating-content">
              <span className="floating-label">Sạc nhanh</span>
              <span className="floating-value">Lên đến 120kW</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ----- Title Support ----- */
function TitleSupport() {
  return (
    <section className="title-support">
      <div className="title-content">
        <span className="title-subtitle">Sản phẩm của chúng tôi</span>
        <h2>Các loại trụ sạc</h2>
        <p>Giải pháp sạc điện toàn diện cho mọi nhu cầu</p>
      </div>

      <div className="title-decoration">
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
        <div className="decoration-circle"></div>
      </div>
    </section>
  )
}

/* ----- Trang chính hiển thị danh sách ----- */
function ChargingStationsPage() {
  const stations = [
    {
      image: AC10,
      title: "Trạm sạc xe máy xoay chiều AC 4 cổng",
      sockets: "4 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Trụ đứng / Treo tường",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch",
      type: "AC",
    },
    {
      image: sacAC4,
      title: "Trạm sạc xe máy xoay chiều AC 10 cổng",
      sockets: "10 cổng",
      power: "Tối đa 2000W / 1 cổng",
      plugTypes: "2 chấu / 3 chấu",
      installTypes: "Tường nhà / Trụ",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống nước IP54",
      type: "AC",
    },
    {
      image: DC60,
      title: "Trạm sạc nhanh DC 60 kW",
      sockets: "3 cổng",
      power: "60 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Chống sét",
      type: "DC Fast",
    },
    {
      image: DC120,
      title: "Trạm sạc nhanh DC 120 kW",
      sockets: "3 cổng",
      power: "120 kW",
      plugTypes: "CCS / CHAdeMO",
      installTypes: "Ngoài trời / Trong nhà",
      protection: "Quá nhiệt / Quá tải / Dòng rò / Ngắn mạch / Giám sát rò điện DC",
      type: "DC Ultra Fast",
    },
  ]

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className="charging-stations-page">
      {/* Hero giới thiệu */}
      <ChargingStationHero />

      <TitleSupport />

      {/* Danh sách card */}
      <section id="charging-stations" className="charging-stations">
        {stations.map((s, idx) => (
          <ChargingStationCard key={idx} {...s} />
        ))}
      </section>

      <section className="cta-section">
        <div className="cta-background"></div>
        <div className="cta-content">
          <h2>Sẵn sàng bắt đầu?</h2>
          <p>Liên hệ với chúng tôi để được tư vấn giải pháp sạc điện phù hợp nhất</p>
          <div className="cta-buttons">
            <Link to="/booking" className="btn-cta-primary">
              <span>Đặt chỗ ngay</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
            <button className="btn-cta-secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Liên hệ tư vấn</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ChargingStationsPage
