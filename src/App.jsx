import { createBrowserRouter, RouterProvider } from "react-router-dom";
import HomePage from "./pages/homePage";
import ChargingStationsPage from "./pages/chargingStationPage/index";
import AboutPage from "./pages/aboutPage/index";
import SupportPage from "./pages/supportPage/index";
import ProfilePage from "./pages/profilePage";
import BookingPage from "./pages/bookingPage";
import PaymentPage from "./pages/PaymentPage/index";
import PaymentSuccessPage from "./pages/paymentSuccessPage/index";
import MembershipPage from "./pages/MembershipPage/index";
import Login from "./pages/loginPage";
import Register from "./pages/registerPage";
import ForgotPassword from "./pages/forgotPasswordPage";
import ChargingSession from "./pages/chargingSessionPage";
import BookingSuccessPage from "./pages/bookingSuccessPage";
import ProtectedRoute from "./config/ProtectedRoute";
import AdminLayout from "./components/adminLayout/index";
import Overview from "./pages/adminDashboard/overViewManagement/index";
import StationManagement from "./pages/adminDashboard/stationManagement/index";
import UserManagement from "./pages/adminDashboard/userManagement/index";
import RevenueManagement from "./pages/adminDashboard/revenueManagement/index";
import Analytics from "./pages/adminDashboard/analyticsManagement/index";
import SettingManagement from "./pages/adminDashboard/settingManagement/index";
import StaffLayout from "./components/staffLayout/index";
import ChargingSessions from "./pages/staffDashboard/chargingSessions/index";
import StationStatus from "./pages/staffDashboard/stationStatus/index";
import Reports from "./pages/staffDashboard/reports/index";
import Payment from "./pages/staffDashboard/payment";
import Profile from "./pages/staffDashboard/profile/index";
import Layout from "./components/layout/index";

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
        { path: "booking/:stationId", element: <BookingPage /> },
        { path: "booking", element: <BookingPage /> },
        { path: "payment", element: <PaymentPage /> },
        { path: "payment-success", element: <PaymentSuccessPage /> },
        { path: "membership", element: <MembershipPage /> },
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
      path: "/chargingSession",
      element: <ChargingSession />,
    },
    {
      path: "booking-success",
      element: <BookingSuccessPage />,
    },
    {
      path: "admin",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { path: "", element: <Overview /> },
        { path: "station-management", element: <StationManagement /> },
        { path: "user-management", element: <UserManagement /> },
        { path: "revenue-management", element: <RevenueManagement /> },
        { path: "analytics-management", element: <Analytics /> },
        { path: "settings-management", element: <SettingManagement /> },
      ],
    },
    {
      path: "staff",
      element: (
        <ProtectedRoute allowedRoles={["staff"]}>
          <StaffLayout />
        </ProtectedRoute>
      ),
      children: [
        // { path: "", element: <Overview /> },
        { path: "charging-ChargingSessions", element: <ChargingSessions /> },
        { path: "payment", element: <Payment /> },
        { path: "station-status", element: <StationStatus /> },
        { path: "reports", element: <Reports /> },
        { path: "profile", element: <Profile /> },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
