import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import AdminLayout from "./components/adminLayout";
import HomePage from "./pages/homePage";
import ChargingStationsPage from "./pages/chargingStationPage/index";
import AboutPage from "./pages/aboutPage/index";
import SupportPage from "./pages/supportPage/index";
import Overview from "./pages/adminDashboard/Overview";
import StationManagement from "./pages/adminDashboard/stationManagement";
import UserManagement from "./pages/adminDashboard/userManagement";
import Analytics from "./pages/adminDashboard/analytics";
import RevenueManagement from "./pages/adminDashboard/revenueManagement";
import SettingManagement from "./pages/adminDashboard/settingManagement/index";
import ForgotPassword from "./pages/forgotpasswordPage/forgotpassword";
import Login from "./pages/loginPage";
import Register from "./pages/registerPage";
import BookingPage from "./pages/bookingPage";
import ProfilePage from "./pages/profilePage/ProfilePage";


function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "", element: <HomePage /> },
        { path: "charging-stations", element: <ChargingStationsPage /> },
        { path: "about", element: <AboutPage /> },
        { path: "support", element: <SupportPage /> },
        { path: "profile", element: <ProfilePage /> },
        { path: "booking", element: <BookingPage /> },
      ],
    },
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/register",
      element: <Register />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "admin",
      element: <AdminLayout />,
      children: [
        { path: "", element: <Overview /> },
        { path: "station-management", element: <StationManagement /> },
        { path: "user-management", element: <UserManagement /> },
        { path: "revenue-management", element: <RevenueManagement /> },
        { path: "analytics-management", element: <Analytics /> },
        { path: "settings-management", element: <SettingManagement /> },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
