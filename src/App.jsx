import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/layout";
import HomePage from "./pages/homePage";
import AboutPage from "./pages/aboutPage";
import ChargingStationsPage from "./pages/chargingStationPage";
import SupportPage from "./pages/supportPage";

const App = () => (
  <Router>
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/chargingStations" element={<ChargingStationsPage />} />
        {/* Thêm các route khác ở đây */}
      </Routes>
    </Layout>
  </Router>
);

export default App;
