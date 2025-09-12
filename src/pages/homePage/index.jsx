import "./index.scss";

const hotlines = [
  { phone: "0912210210", href: "tel:0912210210" },
  { phone: "0373185010", href: "tel:0373185010" },
];

const HotlineFloating = () => (
  <div className="homepage__hotline-group">
    {hotlines.map((item) => (
      <a
        key={item.phone}
        href={item.href}
        className="homepage__hotline"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span className="homepage__hotline-icon">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="#fff">
            <circle cx="10" cy="10" r="10" fill="#7ed321" />
            <path
              d="M14.5 13.5c-.7-.2-1.4-.4-2-.8-.2-.1-.4-.2-.6-.1-.2.1-.4.3-.6.5-.3.3-.6.3-.9.1-1.1-.7-2-1.6-2.7-2.7-.2-.3-.2-.6.1-.9.2-.2.4-.4.5-.6.1-.2 0-.4-.1-.6-.4-.6-.6-1.3-.8-2-.1-.3-.4-.5-.7-.5H5c-.3 0-.6.3-.6.6C4.4 12.1 7.9 15.6 12.4 15.6c.3 0 .6-.3.6-.6v-1.1c0-.3-.2-.6-.5-.7z"
              fill="#fff"
            />
          </svg>
        </span>
        <span className="homepage__hotline-text">{item.phone}</span>
      </a>
    ))}
  </div>
);

const HomePage = () => (
  <div className="homepage">
    <main className="homepage__main">
      <section className="homepage">
        <div className="homepage__container">
          <div className="homepage__content">
            <h2 className="homepage__title">
              <span className="green">
                Nền tảng đám mây để sạc điện
                <br />
                và quản lý trạm sạc thông minh.
              </span>
            </h2>
            <p className="homepage__desc">
              Khởi động, tối ưu hóa và mở rộng quy mô hoạt động kinh doanh sạc
              xe điện của bạn với nền tảng sạc xe điện không phân biệt phần
              cứng, nhãn trắng của <span className="green">S.TOUCH</span>.
            </p>
            <button className="homepage__demo">ĐẶT BẢN DEMO ▶</button>
          </div>
          <div className="homepage__image">
            <img
              src="https://stouch.vn/wp-content/uploads/2024/07/S.Touch_Bo-Banner-Sac-Dien-24-1.svg"
              alt="Demo"
            />
          </div>
        </div>
      </section>
      <section className="homepage-features">
        <div className="homepage-features__container">
          <h3 className="homepage-features__title">
            Phần mềm quản lý sạc S.TOUCH tất cả trong
            <br />
            một thương hiệu của bạn
          </h3>
          <div className="homepage-features__grid">
            <div className="feature-item">
              <span className="feature-icon">🔘</span>
              <span className="feature-label">Nhãn Trắng</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🧾</span>
              <span className="feature-label">Thanh toán và hóa đơn</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔌</span>
              <span className="feature-label">Tương thích đa thiết bị sạc</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💻</span>
              <span className="feature-label">API S.TOUCH</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💙</span>
              <span className="feature-label">Đa dạng chủng loại xe điện</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span className="feature-label">Quản lý tái động</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📄</span>
              <span className="feature-label">Gói giá và biểu phí</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🤝</span>
              <span className="feature-label">
                Quản lý khách hàng và đối tác
              </span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🛠️</span>
              <span className="feature-label">Quản lý bảo trì từ xa</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span className="feature-label">Bảo mật và khả năng mở rộng</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span className="feature-label">Báo cáo và phân tích</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏠</span>
              <span className="feature-label">Sạc tại nhà và đặt chỗ</span>
            </div>
          </div>
        </div>
      </section>
      <section className="homepage-white-label">
        <div className="homepage-white-label__container">
          <div className="homepage-white-label__header">
            <h4 className="homepage-white-label__subtitle">NHÃN TRẮNG</h4>
            <h2 className="homepage-white-label__title">
              Trải nghiệm <span className="green">sạc xe điện 360</span> với
              thương hiệu được nhận diện
            </h2>
            <p className="homepage-white-label__desc">
              Phần mềm đa dụng quản lý trạm sạc xe điện với các ứng dụng di động
              cho người dùng có hiện logo của bạn, giao diện web và mạng liên
              kết dành cho khách hàng và nhân viên của bạn.
            </p>
          </div>
          <div className="homepage-white-label__content">
            <div className="homepage-white-label__image">
              <img
                src="https://stouch.vn/wp-content/uploads/2024/06/S.Touch_Hinhanh-02.svg"
                alt="White Label Demo"
              />
            </div>
            <div className="homepage-white-label__features">
              <div className="feature-block">
                <h3>Nền tảng nhận diện thương hiệu</h3>
                <p>
                  Thông tin nhận diện thương hiệu cho khách hàng và đối tác
                  thương mại của bạn
                </p>
              </div>
              <div className="feature-block">
                <h3>Cổng thông tin điện tử</h3>
                <p>Tùy chỉnh giao diện web cho trình điều khiển EV của bạn</p>
              </div>
              <div className="feature-block">
                <h3>Ứng dụng di động</h3>
                <p>
                  Các ứng dụng sạc xe điện có thể tuỳ chỉnh cho IOS và Android
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="homepage-payment">
        <div className="homepage-payment__container">
          <div className="homepage-payment__content">
            <h4 className="homepage-payment__subtitle">THANH TOÁN & HÓA ĐƠN</h4>
            <h2 className="homepage-payment__title">
              Tăng doanh thu với các hình thức thanh toán linh hoạt và lập hóa
              đơn.
            </h2>
            <h3 className="homepage-payment__highlight">Làm chủ dòng tiền.</h3>
            <p className="homepage-payment__desc">
              Tích hợp với cổng thanh toán bạn chọn và dễ dàng quản lý nhiều tuỳ
              chọn thanh toán cho khách hàng và đối tác kinh doanh của bạn.
            </p>
            <ul className="homepage-payment__list">
              <li>
                Sử dụng QR pay, VN pay ngay lập tức hoặc tích hợp bộ xử lý thanh
                toán ưa thích của bạn
              </li>
              <li>
                Chấp nhận thanh toán trực tiếp từ khách hàng mà không phải trả
                thêm phí hoặc chậm trễ từ S.TOUCH
              </li>
              <li>Lợi ích về việc hóa đơn và thanh toán tự động</li>
              <li>Hoàn tiền cho nhân viên sạc xe điện tại nhà</li>
            </ul>
            <button className="homepage-payment__btn">Tìm hiểu thêm</button>
          </div>
          <div className="homepage-payment__image">
            <img
              src="https://stouch.vn/wp-content/uploads/2024/05/3.png"
              alt="Payment Demo"
            />
          </div>
        </div>
      </section>
      <section className="homepage-ocpp">
        <div className="homepage-ocpp__container">
          <div className="homepage-ocpp__image">
            <img
              src="https://stouch.vn/wp-content/uploads/2024/07/S.Touch_Tu-lieu-hinh-anh-11-1-1.png"
              alt="OCPP Demo"
            />
          </div>
          <div className="homepage-ocpp__content">
            <h4 className="homepage-ocpp__subtitle">
              TƯƠNG THÍCH ĐA THIẾT BỊ SẠC
            </h4>
            <h2 className="homepage-ocpp__title">
              Có tính linh hoạt và khả năng{" "}
              <span className="green">tương tác với OCPP</span>
            </h2>
            <p className="homepage-ocpp__desc">
              Các trường hợp kinh doanh khác nhau yêu cầu các hình thức tính phí
              khác nhau. Mở rộng quy mô mạng sạc của bạn bằng cách tích hợp dễ
              dàng các trạm sạc từ nhiều nhà sản xuất tuân thủ OCPP với hệ thống
              quản lý trạm sạc tích hợp đa thiết bị sạc (CPMS) của S.TOUCH
            </p>
            <ul className="homepage-ocpp__list">
              <li>Hỗ trợ OCPP 1.6 đến OCPP 2.0.1</li>
              <li>Hỗ trợ các loại trạm sạc tuân thủ OCPP</li>
              <li>Tích hợp thành công với nhiều bộ sạc khác nhau</li>
            </ul>
            <button className="homepage-ocpp__btn">Tìm hiểu thêm</button>
          </div>
        </div>
      </section>
    </main>
  </div>
);

export default HomePage;
