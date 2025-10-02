import React from "react";
import { FaBatteryFull, FaCheckCircle, FaBolt } from "react-icons/fa"; // Import các icon
import "./index.scss";

function ChargingStationRentalPage() {
    const packages = [
        {
            name: "Gói Basic",
            price: "500.000 VND/tháng",
            description: "Phù hợp cho cá nhân hoặc gia đình nhỏ.",
            features: [
                "Sử dụng tối đa 50 kWh/tháng",
                "Hỗ trợ kỹ thuật qua email",
                "Không tính phí lắp đặt",
            ],
            buttonText: "Thuê Gói Cơ bản",
            icon: <FaBatteryFull />, // Icon cho gói
        },
        {
            name: "Gói Standard",
            price: "1.000.000 VND/tháng",
            description: "Dành cho người sử dụng thường xuyên.",
            features: [
                "Sử dụng tối đa 150 kWh/tháng",
                "Hỗ trợ kỹ thuật qua email và hotline",
                "Miễn phí lắp đặt và bảo trì",
                "Giảm giá 10% khi gia hạn",
            ],
            buttonText: "Thuê Gói Nâng cao",
            icon: <FaBolt />, // Icon cho gói
        },
        {
            name: "Gói Premium",
            price: "2.000.000 VND/tháng",
            description: "Lựa chọn tối ưu cho doanh nghiệp.",
            features: [
                "Sử dụng không giới hạn kWh",
                "Hỗ trợ kỹ thuật 24/7",
                "Miễn phí lắp đặt và bảo trì",
                "Ưu tiên xử lý sự cố",
                "Giảm giá 20% khi gia hạn",
            ],
            buttonText: "Thuê Gói Cao cấp",
            icon: <FaCheckCircle />, // Icon cho gói
        },
    ];

    return (
        <div className="membership-page">
            <h1>Nâng cấp gói thành viên</h1>
            <p>Chọn gói thuê phù hợp với nhu cầu của bạn.</p>
            <div className="packages">
                {packages.map((pkg, index) => (
                    <div key={index} className="package">
                        <h2>
                            {pkg.name}
                        </h2>
                        <p className="price">{pkg.price}</p>
                        <p>{pkg.description}</p>
                        <ul className="features">
                            {pkg.features.map((feature, i) => (
                                <li key={i}>
                                    <FaCheckCircle /> {feature} {/* Thêm icon trước mỗi tính năng */}
                                </li>
                            ))}
                        </ul>
                        <button className="register-button">
                            {pkg.icon} {pkg.buttonText} {/* Thêm icon vào nút */}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ChargingStationRentalPage;