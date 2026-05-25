import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaMapMarkedAlt,
  FaBell,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes
} from "react-icons/fa";

function Sidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: <FaHome /> },
    { name: "Live Map", path: "#", icon: <FaMapMarkedAlt /> },
    { name: "Alerts", path: "#", icon: <FaBell /> },
    { name: "Analytics", path: "#", icon: <FaChartBar /> },
    { name: "Settings", path: "#", icon: <FaCog /> },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div>
          {/* Mobile Close Btn */}
          <div className="mobile-close" onClick={() => setMobileOpen(false)}>
            <FaTimes />
          </div>

          <div className="logo-section">
            <h1 className="logo-title">
              <span style={{ color: "var(--blue-500)" }}>D</span>rive
              <span style={{ color: "var(--blue-500)" }}>S</span>ecure
            </h1>
            <p className="logo-subtitle">Smart Road Safety</p>
          </div>

          <div className="menu-links">
            {navItems.map((item, index) => (
              <div
                key={index}
                className={`sidebar-link ${location.pathname === item.path ? "active-link" : ""}`}
                onClick={() => setMobileOpen(false)}
              >
                {item.icon}
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="sidebar-link logout-link" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </div>
      </div>
    </>
  );
}

export default Sidebar;