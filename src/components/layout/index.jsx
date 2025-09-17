import Header from "../header";
import Footer from "../footer";
import HotlineFloating from "../hotlineFloating";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Header />
      <div className="layout-content">
        <Outlet />
      </div>
      <Footer />
      <HotlineFloating />
    </div>
  );
}

export default Layout;
