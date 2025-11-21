import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import HomePage from "./pages/homePage";
import ChargingStationsPage from "./pages/chargingStationPage/index";
import AboutPage from "./pages/aboutPage/index";
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
import StationManagement from "./pages/adminDashboard/stationManagement/index";
import UserManagement from "./pages/adminDashboard/userManagement/index";
import SubscriptionManagement from "./pages/adminDashboard/subscriptionManagement/index";
import StatsReports from "./pages/adminDashboard/statsReports/index.jsx";
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
        // { path: "support", element: <SupportPage /> },
        { path: "profile", element: <ProfilePage initialView="personal" /> },
        { path: "profile/history", element: <ProfilePage initialView="history" /> },
        { path: "profile/membership", element: <ProfilePage initialView="membership" /> },
        { path: "profile/transactions", element: <ProfilePage initialView="transactions" /> },
        { path: "booking/:stationId", element: <BookingPage /> },
        { path: "booking", element: <BookingPage /> },
        // { path: "payment", element: <PaymentPage /> },
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
      path: "payment",
      element: <PaymentPage />,
    },
    {
      path: "admin",
      element: (
        <ProtectedRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </ProtectedRoute>
      ),
      children: [
        { index: true, element: <Navigate to="station-management" replace /> },
        { path: "station-management", element: <StationManagement /> },
        { path: "user-management", element: <UserManagement /> },
        {
          path: "subscription-management",
          element: <SubscriptionManagement />,
        },
        { path: "transaction-management", element: <StatsReports /> },
        { path: "revenue-management", element: <StatsReports /> },
        { path: "analytics", element: <StatsReports /> },
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
        { path: "", element: <ChargingSessions /> },
        { path: "station-status", element: <StationStatus /> },
        { path: "reports", element: <Reports /> },
        { path: "profile", element: <Profile /> },
      ],
    },
  ]);
  return <RouterProvider router={router} />;
}

export default App;
