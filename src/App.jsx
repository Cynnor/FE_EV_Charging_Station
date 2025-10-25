import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/layout";
import AdminLayout from "./components/adminLayout";
import StaffLayout from "./components/staffLayout";
import ProtectedRoute from "./config/ProtectedRoute";
import HomePage from "./pages/homePage";
import ChargingStationsPage from "./pages/chargingStationPage/index";
import AboutPage from "./pages/aboutPage/index";
import SupportPage from "./pages/supportPage/index";
import StationManagement from "./pages/adminDashboard/stationManagement";
import UserManagement from "./pages/adminDashboard/userManagement";
import Analytics from "./pages/adminDashboard/analyticsManagement";
import RevenueManagement from "./pages/adminDashboard/revenueManagement";
import SettingManagement from "./pages/adminDashboard/settingManagement/index";
import ForgotPassword from "./pages/forgotpasswordPage/forgotpassword";
import Login from "./pages/loginPage";
import Register from "./pages/registerPage";
import BookingPage from "./pages/bookingPage";
import ProfilePage from "./pages/profilePage/ProfilePage";
import PaymentPage from "./pages/PaymentPage";
import MembershipPage from "./pages/MembershipPage";
import StaffOverview from "./pages/staffDashboard/Overview";
import ChargingSessions from "./pages/staffDashboard/chargingSessions";
import StaffPayment from "./pages/staffDashboard/payment";
import StationStatus from "./pages/staffDashboard/stationStatus";
import Reports from "./pages/staffDashboard/reports";
import StaffProfile from "./pages/staffDashboard/profile";
import Overview from "./pages/adminDashboard/overViewManagement";
import ChargingSession from "./pages/chargingSessionPage/chargingSessionPage";
import BookingSuccessPage from "./pages/bookingSuccessPage/BookingSuccessPage";
import PaymentSuccessPage from "./pages/paymentSuccessPage";



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
      element: <ChargingSession />
    },
    {
      path: "booking-success",
      element: <BookingSuccessPage />
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
        { path: "", element: <StaffOverview /> },
        { path: "charging-sessions", element: <ChargingSessions /> },
        { path: "payment", element: <StaffPayment /> },
        { path: "station-status", element: <StationStatus /> },
        { path: "reports", element: <Reports /> },
        { path: "profile", element: <StaffProfile /> },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
