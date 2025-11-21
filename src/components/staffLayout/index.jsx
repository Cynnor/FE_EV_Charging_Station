import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import StaffSidebar from "../staffSidebar";
import StaffHeader from "../staffHeader";
import "./index.scss";

const pathToTab = {
    "": "charging-sessions",
    "charging-sessions": "charging-sessions",
    "station-status": "station-status",
    "reports": "reports",
    "profile": "profile",
};

const menuItems = [
    { id: "charging-sessions", label: "Quản lý phiên sạc" },
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
        return pathToTab[tab] || "charging-sessions";
    };

    const [activeTab, setActiveTab] = useState(getActiveTabFromPath());
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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
        <div className={`staff-layout ${isSidebarOpen ? "" : "sidebar-hidden"}`}>
            <StaffSidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                hidden={!isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
            />

            <main className="staff-main-content">
                <StaffHeader
                    title={getCurrentTitle()}
                    subtitle="Quản lý phiên sạc, kiểm tra QR và vận hành trạm."
                    onToggleSidebar={undefined}
                    isSidebarOpen={isSidebarOpen}
                />

                <div className="staff-content-area">
                    <Outlet />
                </div>
            </main>

            {!isSidebarOpen && (
                <button
                    className="sidebar-reveal-tab"
                    onClick={() => setIsSidebarOpen(true)}
                    aria-label="Mở menu"
                >
                    ▶
                </button>
            )}
        </div>
    );
};

export default StaffLayout;
