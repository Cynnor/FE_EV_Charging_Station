import Header from "../header";
import Footer from "../footer";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div>
      <Header />
      <div className="layout-content">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default Layout;
