import { useState } from "react";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import {
  FaShieldAlt,
  FaBell,
  FaExclamationTriangle,
  FaBars
} from "react-icons/fa";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";

function Dashboard() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <FaBars />
            </div>
            <div>
              <h1 className="welcome-title">Welcome Back 👋</h1>
              <p className="welcome-subtitle">Stay safe on the road. Drive smart!</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="weather-badge">28°C ☁️</div>
            <div className="profile-avatar" />
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="card-top">
              <div className="icon-box purple"><FaShieldAlt /></div>
              <div>
                <p className="card-title">Overall Risk</p>
                <h2 className="danger-text">High</h2>
              </div>
            </div>
            <div className="card-bottom">
              <p>Risk Score: 87%</p>
              <div className="mini-chart chart-red" />
            </div>
          </div>

          <div className="stat-card">
            <div className="card-top">
              <div className="icon-box blue"><FaBell /></div>
              <div>
                <p className="card-title">Active Alerts</p>
                <h2 className="card-number">12</h2>
              </div>
            </div>
            <div className="card-bottom">
              <p>View all alerts</p>
              <div className="mini-chart chart-blue" />
            </div>
          </div>

          <div className="stat-card">
            <div className="card-top">
              <div className="icon-box green"><FaShieldAlt /></div>
              <div>
                <p className="card-title">Safe Routes</p>
                <h2 className="card-number">24</h2>
              </div>
            </div>
            <div className="card-bottom">
              <p>Recommended</p>
              <div className="mini-chart chart-green" />
            </div>
          </div>

          <div className="stat-card">
            <div className="card-top">
              <div className="icon-box yellow"><FaExclamationTriangle /></div>
              <div>
                <p className="card-title">Accidents Today</p>
                <h2 className="card-number">4</h2>
              </div>
            </div>
            <div className="card-bottom">
              <p>Stay Alert!</p>
              <div className="mini-chart chart-yellow" />
            </div>
          </div>
        </div>

        <div className="map-wrapper">
          <div className="map-container">
            <div className="live-badge">
              <span /> Live Tracking Active
            </div>
            
            <MapContainer
              center={[23.2599, 77.4126]}
              zoom={11}
              style={{ height: "100%", width: "100%", zIndex: 1 }}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[23.2599, 77.4126]}>
                <Popup>Safe Zone</Popup>
              </Marker>
              <Marker position={[23.2100, 77.5000]}>
                <Popup>High Accident Area</Popup>
              </Marker>
              <Polyline
                positions={[
                  [23.2599, 77.4126],
                  [23.2400, 77.4500],
                  [23.2100, 77.5000],
                ]}
                pathOptions={{ color: "#ef4444", weight: 5 }}
              />
            </MapContainer>
          </div>

          <div className="right-panel">
            <div className="panel-card risk-panel">
              <h3 className="risk-title">Current Route Risk</h3>
              <h1 className="risk-score">87%</h1>
              <p className="risk-desc">Heavy traffic and accident-prone area detected.</p>
              <button className="btn-risk">View Safer Routes</button>
            </div>

            <div className="panel-card alerts-panel">
              <h3>Live Alerts</h3>
              <div className="alert-item alert-danger">🚨 Accident Reported</div>
              <div className="alert-item alert-warning">🚗 Heavy Traffic</div>
              <div className="alert-item alert-info">🌧️ Rainfall Warning</div>
              <div className="alert-item alert-neutral">🚧 Road Construction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;