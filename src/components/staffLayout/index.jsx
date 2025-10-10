import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import StaffSidebar from "../staffSidebar";
import StaffHeader from "../staffHeader";
import "./index.scss";

const pathToTab = {
    "": "overview",
    "charging-sessions": "charging-sessions",
    "payment": "payment",
    "station-status": "station-status",
    "reports": "reports",
    "profile": "profile",
};

const menuItems = [
    { id: "overview", label: "Tổng quan" },
    { id: "charging-sessions", label: "Quản lý phiên sạc" },
    { id: "payment", label: "Thanh toán tại trạm" },
    { id: "station-status", label: "Tình trạng điểm sạc" },
    { id: "reports", label: "Báo cáo & Sự cố" },
    { id: "profile", label: "Hồ sơ cá nhân" },
];

const StaffLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy tab từ path
    const getActiveTabFromPath = () => {
        const segments = location.pathname.split("/");
        // segments: ["", "staff", ...]
        const tab = segments[2] || "";
        return pathToTab[tab] || "overview";
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromPath());

    useEffect(() => {
        setActiveTab(getActiveTabFromPath());
    }, [location.pathname]);

    const handleTabChange = (tabId, path) => {
        setActiveTab(tabId);
        navigate(path ? `/staff/${path}` : "/staff");
    };

    const getCurrentTitle = () => {
        const item = menuItems.find((item) => item.id === activeTab);
        return item ? item.label : "Dashboard Nhân viên";
    };

    return (
        <div className="staff-layout">
            <StaffSidebar activeTab={activeTab} setActiveTab={handleTabChange} />

            <main className="staff-main-content">
                <StaffHeader
                    title={getCurrentTitle()}
                    subtitle="Chào mừng trở lại! Đây là tổng quan trạm sạc của bạn."
                />

                <div className="staff-content-area">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default StaffLayout;
