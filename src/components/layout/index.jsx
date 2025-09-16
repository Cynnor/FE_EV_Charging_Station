import React from "react";
import Header from "../header";
import Footer from "../footer";

const Layout = ({ children }) => (
  <>
    <Header />
    <div style={{ minHeight: "calc(100vh - 180px)" }}>{children}</div>
    <Footer />
  </>
);

export default Layout;
