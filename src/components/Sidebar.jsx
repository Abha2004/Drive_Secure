import { useNavigate } from "react-router-dom";
import {
  FaHome,
  FaMapMarkedAlt,
  FaShieldAlt,
  FaBell,
  FaChartBar,
  FaCog,
  FaSignOutAlt,
  FaTimes
} from "react-icons/fa";

function Sidebar({ mobileOpen, setMobileOpen, activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("ds_token");
    localStorage.removeItem("ds_user");
    localStorage.removeItem("ds_settings");
    navigate("/login");
  };

  const navItems = [
    { name: "Dashboard", id: "dashboard", icon: <FaHome /> },
    { name: "Live Map", id: "map", icon: <FaMapMarkedAlt /> },
    { name: "Risk Check", id: "predict", icon: <FaShieldAlt /> },
    { name: "Alerts", id: "alerts", icon: <FaBell /> },
    { name: "Analytics", id: "analytics", icon: <FaChartBar /> },
    { name: "Settings", id: "settings", icon: <FaCog /> },
  ];

  return (
    <>
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <div className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <div>
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
                className={`sidebar-link ${activeTab === item.id ? "active-link" : ""}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
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