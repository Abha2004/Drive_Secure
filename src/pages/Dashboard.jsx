import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/dashboard.css";
import Sidebar from "../components/Sidebar";
import LocationForm from "../components/LocationForm";
import {
  FaShieldAlt,
  FaBell,
  FaExclamationTriangle,
  FaBars,
  FaRoute,
  FaPaperPlane,
  FaCarCrash,
  FaWater,
  FaTrafficLight,
  FaHardHat,
  FaSave,
  FaUser,
} from "react-icons/fa";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import { io } from "socket.io-client";
import { API_BASE_URL, SOCKET_URL } from "../config/env";

// ========== DASHBOARD VIEW ==========
function DashboardView({ user, alerts, alertStats, mapCenter, handleLocationTracked, userLocations, selectedLocation, handleSelectLocation }) {
  return (
    <>
      <div style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "center" }}>
        <label style={{ fontWeight: "600", color: "var(--text-muted)" }}>📍 Your Locations:</label>
        {userLocations.length > 0 ? (
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {userLocations.map(loc => (
              <button
                key={loc._id}
                onClick={() => handleSelectLocation(loc)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "20px",
                  border: selectedLocation?._id === loc._id ? "2px solid var(--blue-400)" : "1px solid var(--border-subtle)",
                  background: selectedLocation?._id === loc._id ? "var(--blue-400)" : "transparent",
                  color: selectedLocation?._id === loc._id ? "white" : "var(--text-primary)",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  transition: "all 0.2s"
                }}
              >
                {loc.name}
              </button>
            ))}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>No saved locations yet</p>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="card-top">
            <div className="icon-box purple"><FaShieldAlt /></div>
            <div>
              <p className="card-title">Overall Risk</p>
              <h2 className="danger-text">{alertStats.high > 3 ? "High" : alertStats.high > 0 ? "Medium" : "Low"}</h2>
            </div>
          </div>
          <div className="card-bottom">
            <p>Risk Score: {Math.min(99, 40 + alertStats.high * 12)}%</p>
            <div className="mini-chart chart-red" />
          </div>
        </div>

        <div className="stat-card">
          <div className="card-top">
            <div className="icon-box blue"><FaBell /></div>
            <div>
              <p className="card-title">Active Alerts</p>
              <h2 className="card-number">{alertStats.total}</h2>
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
              <h2 className="card-number">{alertStats.todayCount}</h2>
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
          <MapContainer center={mapCenter} zoom={12} style={{ height: "100%", width: "100%", zIndex: 1 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {alerts.slice(0, 10).map((a, i) => (
              <Marker key={i} position={[a.location?.latitude || 23.26, a.location?.longitude || 77.41]}>
                <Popup>{a.message} ({a.riskLevel})</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <div className="right-panel">
          <div className="panel-card risk-panel">
            <h3 className="risk-title">Current Route Risk</h3>
            <h1 className="risk-score">{Math.min(99, 40 + alertStats.high * 12)}%</h1>
            <p className="risk-desc">Based on {alertStats.total} active alerts in your area.</p>
            <button className="btn-risk">View Safer Routes</button>
          </div>

          <div className="panel-card alerts-panel">
            <h3>Live Alerts</h3>
            {alerts.slice(0, 4).map((a, i) => (
              <div key={i} className={`alert-item ${a.riskLevel === 'high' ? 'alert-danger' : a.riskLevel === 'medium' ? 'alert-warning' : 'alert-info'}`}>
                {a.riskLevel === 'high' ? '🚨' : a.riskLevel === 'medium' ? '🚗' : '🔔'} {a.message}
              </div>
            ))}
            {alerts.length === 0 && <div className="alert-item alert-neutral">✅ No active alerts</div>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: "24px" }}>
        <LocationForm onLocationTracked={handleLocationTracked} />
      </div>
    </>
  );
}

// ========== LIVE MAP VIEW ==========
function LiveMapView({ settings, mapCenter }) {
  const [locations, setLocations] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [area, setArea] = useState("Market areas");
  const [routeData, setRouteData] = useState(null);
  const [showAlt, setShowAlt] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/route/locations`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setLocations(data);
        }
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocations();
  }, []);

  const calculateRoute = async () => {
    if (!from || !to || from === to) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/route/safe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, settings: { ...settings, area } }),
      });
      const data = await res.json();
      setRouteData(data);
      setShowAlt(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="map-view-full">
      <div className="route-controls">
        <h3 style={{ marginBottom: "16px", fontSize: "18px" }}>🗺️ Route Planner</h3>
        <div className="route-select-group">
          <select value={from} onChange={e => setFrom(e.target.value)} className="route-select">
            <option value="">📍 From...</option>
            {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
          <select value={to} onChange={e => setTo(e.target.value)} className="route-select">
            <option value="">📍 To...</option>
            {locations.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
          </select>
          <select value={area} onChange={e => setArea(e.target.value)} className="route-select" style={{ minWidth: "150px" }}>
            <option value="Market areas">Market areas</option>
            <option value="Residential areas">Residential areas</option>
            <option value="Office areas">Office areas</option>
            <option value="Industrial areas">Industrial areas</option>
            <option value="School areas">School areas</option>
            <option value="Hospital areas">Hospital areas</option>
            <option value="Rural village areas">Rural village areas</option>
          </select>
          <button className="route-calc-btn" onClick={calculateRoute} disabled={loading || !from || !to || from === to}>
            {loading ? "Calculating..." : <><FaRoute /> Calculate Route</>}
          </button>
        </div>

        {routeData && (
          <div className="route-results">
            <div className="route-risk-badge" style={{ borderColor: routeData.mainRoute.color }}>
              <span>Main Route Risk:</span>
              <strong style={{ color: routeData.mainRoute.color }}>{routeData.mainRoute.riskScore}%</strong>
              <small>({routeData.mainRoute.riskLevel})</small>
            </div>
            {routeData.mainRoute.riskScore > 50 && (
              <button className="alt-route-btn" onClick={() => setShowAlt(!showAlt)}>
                {showAlt ? "Hide" : "Show"} Safer Route ({routeData.alternativeRoute.riskScore}%)
              </button>
            )}
          </div>
        )}
      </div>

      <div className="map-container" style={{ flex: 1, minHeight: "500px" }}>
        <div className="live-badge"><span /> Live Tracking Active</div>
        <MapContainer center={mapCenter} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          {routeData && (
            <>
              <Marker position={routeData.mainRoute.path[0]}><Popup>📍 {routeData.from.name}</Popup></Marker>
              <Marker position={routeData.mainRoute.path[routeData.mainRoute.path.length - 1]}><Popup>📍 {routeData.to.name}</Popup></Marker>
              <Polyline positions={routeData.mainRoute.path} pathOptions={{ color: routeData.mainRoute.color, weight: 5 }} />
              {showAlt && <Polyline positions={routeData.alternativeRoute.path} pathOptions={{ color: "#22c55e", weight: 5, dashArray: "10 10" }} />}
            </>
          )}
        </MapContainer>
      </div>
    </div>
  );
}

// ========== ALERTS VIEW ==========
function AlertsView({ alerts, socket }) {
  const [msg, setMsg] = useState("");
  const [risk, setRisk] = useState("medium");
  const [alertType, setAlertType] = useState("accident");
  const [submitting, setSubmitting] = useState(false);

  const alertTypes = [
    { id: "accident", label: "Accident", icon: <FaCarCrash />, color: "var(--danger)" },
    { id: "waterlog", label: "Waterlogging", icon: <FaWater />, color: "var(--blue-400)" },
    { id: "traffic", label: "Traffic Jam", icon: <FaTrafficLight />, color: "var(--warning)" },
    { id: "construction", label: "Construction", icon: <FaHardHat />, color: "var(--text-muted)" },
  ];

  const submitAlert = async () => {
    if (!msg.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: 23.23 + Math.random() * 0.05,
          longitude: 77.41 + Math.random() * 0.05,
          riskLevel: risk,
          message: `[${alertType.toUpperCase()}] ${msg}`
        }),
      });
      const newAlert = await res.json();
      if (socket) socket.emit("alert:new", newAlert);
      setMsg("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="alerts-view">
      <div className="alert-report-card panel-card">
        <h3 style={{ marginBottom: "16px" }}>🚨 Report New Alert</h3>
        <div className="alert-type-grid">
          {alertTypes.map(t => (
            <div key={t.id} className={`alert-type-btn ${alertType === t.id ? "active" : ""}`} onClick={() => setAlertType(t.id)} style={{ borderColor: alertType === t.id ? t.color : "var(--border-subtle)" }}>
              <span style={{ color: t.color, fontSize: "20px" }}>{t.icon}</span>
              <span>{t.label}</span>
            </div>
          ))}
        </div>
        <select value={risk} onChange={e => setRisk(e.target.value)} className="route-select" style={{ marginBottom: "12px" }}>
          <option value="high">🔴 High Risk</option>
          <option value="medium">🟡 Medium Risk</option>
          <option value="low">🟢 Low Risk</option>
        </select>
        <input className="auth-input" placeholder="Describe the incident..." value={msg} onChange={e => setMsg(e.target.value)} style={{ marginBottom: "12px" }} />
        <button className="route-calc-btn" onClick={submitAlert} disabled={submitting || !msg.trim()}>
          {submitting ? "Submitting..." : <><FaPaperPlane /> Submit Alert</>}
        </button>
      </div>

      <div className="panel-card alerts-panel" style={{ flex: 1 }}>
        <h3>📋 All Alerts ({alerts.length})</h3>
        <div className="alerts-scroll">
          {alerts.map((a, i) => (
            <div key={i} className={`alert-item ${a.riskLevel === 'high' ? 'alert-danger' : a.riskLevel === 'medium' ? 'alert-warning' : 'alert-info'}`}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{a.riskLevel === 'high' ? '🚨' : a.riskLevel === 'medium' ? '⚠️' : '🔔'} {a.message}</span>
                <small style={{ color: "var(--text-muted)", whiteSpace: "nowrap", marginLeft: "12px" }}>
                  {a.createdAt ? new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Now"}
                </small>
              </div>
            </div>
          ))}
          {alerts.length === 0 && <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px 0" }}>No alerts reported yet.</p>}
        </div>
      </div>
    </div>
  );
}

// ========== ANALYTICS VIEW ==========
function AnalyticsView({ alertStats }) {
  const riskData = [
    { label: "Fatal", value: alertStats.high, color: "#ef4444" },
    { label: "Serious", value: alertStats.medium, color: "#ffc400" },
    { label: "Slight", value: alertStats.low, color: "#22c55e" },
  ];
  const maxVal = Math.max(...riskData.map(d => d.value), 1);

  const weatherRisk = [
    { label: "Clear", value: 25, color: "#22c55e" },
    { label: "Rainy", value: 78, color: "#60a5fa" },
    { label: "Foggy", value: 65, color: "#ffc400" },
    { label: "Stormy", value: 92, color: "#ef4444" },
  ];

  const hourlyData = [10, 8, 5, 3, 2, 4, 15, 35, 42, 30, 25, 28, 32, 38, 35, 40, 55, 68, 60, 45, 30, 22, 18, 12];
  const maxHourly = Math.max(...hourlyData);

  return (
    <div className="analytics-view">
      <div className="analytics-grid">
        <div className="panel-card">
          <h3 style={{ marginBottom: "20px" }}>📊 Alert Severity Distribution</h3>
          <svg viewBox="0 0 300 200" style={{ width: "100%", maxHeight: "220px" }}>
            {riskData.map((d, i) => {
              const barW = 60;
              const gap = 30;
              const x = 40 + i * (barW + gap);
              const barH = maxVal > 0 ? (d.value / maxVal) * 140 : 0;
              return (
                <g key={i}>
                  <rect x={x} y={170 - barH} width={barW} height={barH} rx="8" fill={d.color} opacity="0.85">
                    <animate attributeName="height" from="0" to={barH} dur="0.8s" fill="freeze" />
                    <animate attributeName="y" from="170" to={170 - barH} dur="0.8s" fill="freeze" />
                  </rect>
                  <text x={x + barW / 2} y={165 - barH} textAnchor="middle" fill="white" fontSize="14" fontWeight="700">{d.value}</text>
                  <text x={x + barW / 2} y={192} textAnchor="middle" fill="#94a3b8" fontSize="12">{d.label}</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="panel-card">
          <h3 style={{ marginBottom: "20px" }}>🌧️ Weather Risk Index</h3>
          <svg viewBox="0 0 300 200" style={{ width: "100%", maxHeight: "220px" }}>
            {weatherRisk.map((d, i) => {
              const barH = 20;
              const gap = 12;
              const y = 30 + i * (barH + gap);
              const barW = (d.value / 100) * 180;
              return (
                <g key={i}>
                  <text x="5" y={y + 15} fill="#94a3b8" fontSize="12">{d.label}</text>
                  <rect x="60" y={y} width={barW} height={barH} rx="6" fill={d.color} opacity="0.8">
                    <animate attributeName="width" from="0" to={barW} dur="0.8s" fill="freeze" />
                  </rect>
                  <text x={65 + barW} y={y + 15} fill="white" fontSize="12" fontWeight="600">{d.value}%</text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="panel-card" style={{ gridColumn: "1 / -1" }}>
          <h3 style={{ marginBottom: "20px" }}>📈 Hourly Accident Trend (24h)</h3>
          <svg viewBox="0 0 600 180" style={{ width: "100%", maxHeight: "200px" }}>
            <polyline
              points={hourlyData.map((v, i) => `${20 + i * 24},${160 - (v / maxHourly) * 130}`).join(" ")}
              fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round"
            />
            <polygon
              points={`20,160 ${hourlyData.map((v, i) => `${20 + i * 24},${160 - (v / maxHourly) * 130}`).join(" ")} ${20 + 23 * 24},160`}
              fill="url(#grad)" opacity="0.3"
            />
            <defs>
              <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {[0, 6, 12, 18, 23].map(i => (
              <text key={i} x={20 + i * 24} y={178} fill="#94a3b8" fontSize="10" textAnchor="middle">{i}:00</text>
            ))}
            {hourlyData.map((v, i) => (
              <circle key={i} cx={20 + i * 24} cy={160 - (v / maxHourly) * 130} r="3" fill="#60a5fa" opacity="0.7" />
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ========== SETTINGS VIEW ==========
function SettingsView({ settings, setSettings, user }) {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    localStorage.setItem("ds_settings", JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const selectStyle = { marginBottom: "16px" };

  return (
    <div className="settings-view">
      <div className="panel-card" style={{ maxWidth: "600px" }}>
        <h3 style={{ marginBottom: "8px" }}><FaUser style={{ marginRight: "8px" }} />Profile</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>Logged in as <strong style={{ color: "var(--blue-400)" }}>{user?.name || "User"}</strong> ({user?.email})</p>
      </div>

      <div className="panel-card" style={{ maxWidth: "600px" }}>
        <h3 style={{ marginBottom: "20px" }}>⚙️ Simulation Parameters</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "20px", fontSize: "14px" }}>Customize risk prediction inputs for route calculations.</p>

        <label className="settings-label">Age Band of Driver</label>
        <select className="route-select" style={selectStyle} value={settings.age_band} onChange={e => setSettings({ ...settings, age_band: e.target.value })}>
          <option value="Under 18">Under 18</option>
          <option value="18-30">18-30</option>
          <option value="31-50">31-50</option>
          <option value="Over 51">Over 51</option>
        </select>

        <label className="settings-label">Driving Experience</label>
        <select className="route-select" style={selectStyle} value={settings.experience} onChange={e => setSettings({ ...settings, experience: e.target.value })}>
          <option value="Below 1yr">Below 1yr</option>
          <option value="1-2yr">1-2yr</option>
          <option value="2-5yr">2-5yr</option>
          <option value="5-10yr">5-10yr</option>
          <option value="Above 10yr">Above 10yr</option>
        </select>

        <label className="settings-label">Type of Vehicle</label>
        <select className="route-select" style={selectStyle} value={settings.vehicle} onChange={e => setSettings({ ...settings, vehicle: e.target.value })}>
          <option value="Automobile">Automobile</option>
          <option value="Motorcycle">Motorcycle</option>
          <option value="Public (> 45 seats)">Public Bus</option>
          <option value="Lorry (41-100Q)">Lorry / Truck</option>
          <option value="Pick up upto 10Q">Pick Up</option>
        </select>

        <label className="settings-label">Weather Conditions</label>
        <select className="route-select" style={selectStyle} value={settings.weather} onChange={e => setSettings({ ...settings, weather: e.target.value })}>
          <option value="Normal">Normal</option>
          <option value="Rainy">Rainy</option>
          <option value="Cloudy">Cloudy</option>
          <option value="Fog or mist">Fog or mist</option>
          <option value="Other">Other</option>
        </select>

        <label className="settings-label">Road Surface</label>
        <select className="route-select" style={selectStyle} value={settings.road_surface} onChange={e => setSettings({ ...settings, road_surface: e.target.value })}>
          <option value="Dry">Dry</option>
          <option value="Wet or damp">Wet or damp</option>
          <option value="Flood over 3cm. deep">Flood</option>
        </select>

        <label className="settings-label">Light Conditions</label>
        <select className="route-select" style={selectStyle} value={settings.light} onChange={e => setSettings({ ...settings, light: e.target.value })}>
          <option value="Daylight">Daylight</option>
          <option value="Darkness - lights lit">Night (Lit)</option>
          <option value="Darkness - no lighting">Night (Dark)</option>
          <option value="Darkness - lights unlit">Night (Unlit)</option>
        </select>

        <button className="route-calc-btn" onClick={handleSave} style={{ marginTop: "8px" }}>
          <FaSave /> {saved ? "✅ Saved!" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}

// ========== RISK CHECK VIEW ==========
function RiskCheckView() {
  const [formData, setFormData] = useState({
    age_band_of_driver: "18-30",
    driving_experience: "2-5yr",
    type_of_vehicle: "Automobile",
    location: "Residential areas",
    road_surface_conditions: "Dry",
    light_conditions: "Daylight",
    weather_conditions: "Normal"
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem("ds_token");
      const res = await fetch(`${API_BASE_URL}/predict/history`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch prediction history:", err);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const token = localStorage.getItem("ds_token");
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        fetchHistory(); // Refresh history
      } else {
        setError(data.error || "Failed to calculate prediction.");
      }
    } catch (err) {
      setError("Failed to connect to the prediction API.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    if (level === "Fatal injury") return "var(--danger)";
    if (level === "Serious Injury") return "var(--warning)";
    return "var(--success)";
  };

  return (
    <div className="risk-check-view" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
        
        {/* Prediction Form */}
        <form onSubmit={handleSubmit} className="panel-card" style={{ flex: 1, minWidth: "320px" }}>
          <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FaShieldAlt style={{ color: "var(--blue-400)" }} /> Accident Severity Predictor
          </h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
            <div>
              <label className="settings-label">Age of Driver</label>
              <select className="route-select" value={formData.age_band_of_driver} onChange={e => setFormData({ ...formData, age_band_of_driver: e.target.value })}>
                <option value="Under 18">Under 18</option>
                <option value="18-30">18-30</option>
                <option value="31-50">31-50</option>
                <option value="Over 51">Over 51</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="settings-label">Driving Experience</label>
              <select className="route-select" value={formData.driving_experience} onChange={e => setFormData({ ...formData, driving_experience: e.target.value })}>
                <option value="Below 1yr">Below 1yr</option>
                <option value="1-2yr">1-2yr</option>
                <option value="2-5yr">2-5yr</option>
                <option value="5-10yr">5-10yr</option>
                <option value="Above 10yr">Above 10yr</option>
                <option value="No Licence">No Licence</option>
                <option value="unknown">Unknown</option>
              </select>
            </div>
            
            <div>
              <label className="settings-label">Type of Vehicle</label>
              <select className="route-select" value={formData.type_of_vehicle} onChange={e => setFormData({ ...formData, type_of_vehicle: e.target.value })}>
                <option value="Automobile">Automobile</option>
                <option value="Motorcycle">Motorcycle</option>
                <option value="Public (> 45 seats)">Public Bus (&gt; 45 seats)</option>
                <option value="Public (13?45 seats)">Public Bus (13-45 seats)</option>
                <option value="Public (12 seats)">Public Bus (12 seats)</option>
                <option value="Lorry (41?100Q)">Lorry/Truck (41-100Q)</option>
                <option value="Lorry (11?40Q)">Lorry/Truck (11-40Q)</option>
                <option value="Long lorry">Long Lorry</option>
                <option value="Taxi">Taxi</option>
                <option value="Pick up upto 10Q">Pick up upto 10Q</option>
                <option value="Stationwagen">Stationwagen</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Bajaj">Bajaj Auto</option>
                <option value="Turbo">Turbo</option>
                <option value="Special vehicle">Special vehicle</option>
                <option value="Ridden horse">Ridden horse</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="settings-label">Accident Location Area</label>
              <select className="route-select" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}>
                <option value="Residential areas">Residential areas</option>
                <option value="Office areas">Office areas</option>
                <option value="  Recreational areas">Recreational areas</option>
                <option value=" Industrial areas">Industrial areas</option>
                <option value=" Church areas">Church areas</option>
                <option value="  Market areas">Market areas</option>
                <option value=" Hospital areas">Hospital areas</option>
                <option value="School areas">School areas</option>
                <option value="Rural village areas">Rural village areas</option>
                <option value=" Outside rural areas">Outside rural areas</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="settings-label">Road Surface</label>
              <select className="route-select" value={formData.road_surface_conditions} onChange={e => setFormData({ ...formData, road_surface_conditions: e.target.value })}>
                <option value="Dry">Dry</option>
                <option value="Wet or damp">Wet or damp</option>
                <option value="Snow">Snow</option>
                <option value="Flood over 3cm. deep">Flood</option>
              </select>
            </div>

            <div>
              <label className="settings-label">Light Conditions</label>
              <select className="route-select" value={formData.light_conditions} onChange={e => setFormData({ ...formData, light_conditions: e.target.value })}>
                <option value="Daylight">Daylight</option>
                <option value="Darkness - lights lit">Night (Lights Lit)</option>
                <option value="Darkness - no lighting">Night (No Lights)</option>
                <option value="Darkness - lights unlit">Night (Lights Unlit)</option>
              </select>
            </div>

            <div style={{ gridColumn: "span 2" }}>
              <label className="settings-label">Weather Conditions</label>
              <select className="route-select" value={formData.weather_conditions} onChange={e => setFormData({ ...formData, weather_conditions: e.target.value })}>
                <option value="Normal">Normal</option>
                <option value="Raining">Raining</option>
                <option value="Raining and Windy">Raining and Windy</option>
                <option value="Cloudy">Cloudy</option>
                <option value="Windy">Windy</option>
                <option value="Snow">Snow</option>
                <option value="Fog or mist">Fog or mist</option>
                <option value="Unknown">Unknown</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <button type="submit" className="route-calc-btn" disabled={loading} style={{ width: "100%" }}>
            {loading ? "Analyzing Risk Factors..." : "Predict Accident Severity"}
          </button>
        </form>

        {/* Prediction Results Comparison */}
        <div className="panel-card" style={{ flex: 1.2, minWidth: "360px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ marginBottom: "20px" }}>🛡️ Prediction Output Comparison</h3>
            
            {error && <div className="alert-item alert-danger">⚠️ {error}</div>}
            
            {result ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                
                {/* Random Forest Card */}
                <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, color: "var(--blue-400)" }}>🌲 Random Forest Classifier</h4>
                    <span style={{ fontSize: "12px", background: "rgba(96, 165, 250, 0.1)", color: "var(--blue-400)", padding: "4px 8px", borderRadius: "12px", fontWeight: "600" }}>
                      Acc: 90.18%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span>Predicted Severity:</span>
                    <strong style={{ color: getRiskColor(result.random_forest?.risk_level), fontSize: "18px" }}>
                      {result.random_forest?.risk_level}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Confidence:</span>
                    <strong>{(result.random_forest?.confidence_score * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ height: "6px", background: "var(--border-subtle)", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${result.random_forest?.confidence_score * 100}%`,
                      background: getRiskColor(result.random_forest?.risk_level),
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>

                {/* Logistic Regression Card */}
                <div style={{ padding: "16px", borderRadius: "12px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h4 style={{ margin: 0, color: "var(--purple-400)" }}>📈 Logistic Regression Model</h4>
                    <span style={{ fontSize: "12px", background: "rgba(192, 132, 252, 0.1)", color: "var(--purple-400)", padding: "4px 8px", borderRadius: "12px", fontWeight: "600" }}>
                      Acc: 84.56%
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                    <span>Predicted Severity:</span>
                    <strong style={{ color: getRiskColor(result.logistic_regression?.risk_level), fontSize: "18px" }}>
                      {result.logistic_regression?.risk_level}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Confidence:</span>
                    <strong>{(result.logistic_regression?.confidence_score * 100).toFixed(1)}%</strong>
                  </div>
                  <div style={{ height: "6px", background: "var(--border-subtle)", borderRadius: "3px", marginTop: "10px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%",
                      width: `${result.logistic_regression?.confidence_score * 100}%`,
                      background: getRiskColor(result.logistic_regression?.risk_level),
                      transition: "width 0.5s ease"
                    }} />
                  </div>
                </div>

                {/* Proactive Warning Action Alert */}
                <div className={`alert-item ${result.random_forest?.risk_level === 'Fatal injury' ? 'alert-danger' : result.random_forest?.risk_level === 'Serious Injury' ? 'alert-warning' : 'alert-info'}`} style={{ marginTop: "10px" }}>
                  {result.random_forest?.risk_level === 'Fatal injury' ? (
                    <div>
                      <strong>🚨 CRITICAL ROAD SAFETY WARNING:</strong> The machine learning models indicate a high likelihood of fatal injury under these specific parameters. It is highly recommended to delay travel, choose a safer alternative route, or exercise extreme caution.
                    </div>
                  ) : result.random_forest?.risk_level === 'Serious Injury' ? (
                    <div>
                      <strong>⚠️ WARNING:</strong> Moderate to high severity risk predicted. Ensure all passengers are wearing seatbelts/helmets, reduce speeds, and remain alert to environmental hazards.
                    </div>
                  ) : (
                    <div>
                      <strong>🟢 SAFE TRAVEL ALERT:</strong> Risk level is classified as slight/low. Maintain normal safe driving precautions and follow standard road traffic safety rules.
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "240px", color: "var(--text-muted)", textAlign: "center" }}>
                <span style={{ fontSize: "48px", marginBottom: "12px" }}>🤖</span>
                <p>Enter the accident parameters on the left and click predict to run the comparative AI risk models.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Prediction History Table */}
      <div className="panel-card" style={{ width: "100%" }}>
        <h3 style={{ marginBottom: "20px" }}>📋 Saved Prediction Logs & History ({history.length})</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-muted)", fontSize: "14px" }}>
                <th style={{ padding: "12px 8px" }}>Timestamp</th>
                <th style={{ padding: "12px 8px" }}>Weather & Road</th>
                <th style={{ padding: "12px 8px" }}>Vehicle & Experience</th>
                <th style={{ padding: "12px 8px" }}>Area/Location</th>
                <th style={{ padding: "12px 8px" }}>Random Forest (Conf)</th>
                <th style={{ padding: "12px 8px" }}>Logistic Regression (Conf)</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h._id || i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", fontSize: "14px" }}>
                  <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>
                    {new Date(h.createdAt).toLocaleDateString()} {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div>☀️ {h.inputs?.weather_conditions}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>🛣️ {h.inputs?.road_surface_conditions}</div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div>🚗 {h.inputs?.type_of_vehicle}</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>🎓 Exp: {h.inputs?.driving_experience}</div>
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--text-muted)" }}>📍 {h.inputs?.location}</td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      color: getRiskColor(h.random_forest?.risk_level),
                      fontWeight: "600"
                    }}>
                      {h.random_forest?.risk_level}
                    </span>{" "}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      ({(h.random_forest?.confidence_score * 100).toFixed(0)}%)
                    </span>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <span style={{
                      color: getRiskColor(h.logistic_regression?.risk_level),
                      fontWeight: "600"
                    }}>
                      {h.logistic_regression?.risk_level}
                    </span>{" "}
                    <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                      ({(h.logistic_regression?.confidence_score * 100).toFixed(0)}%)
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "30px 0", color: "var(--text-muted)" }}>
                    No predictions saved yet. Make your first prediction above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ========== MAIN DASHBOARD ==========
function Dashboard() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [user, setUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [alertStats, setAlertStats] = useState({ total: 0, high: 0, medium: 0, low: 0, todayCount: 0 });
  const [socket, setSocket] = useState(null);
  const [mapCenter, setMapCenter] = useState([23.2599, 77.4126]); // Default: Bhopal
  const [userLocations, setUserLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ds_settings")) || {}; } catch { return {}; }
  });

  // Callback when location is tracked
  const handleLocationTracked = (latitude, longitude) => {
    setMapCenter([latitude, longitude]);
  };

  // Handle location selection from dropdown
  const handleSelectLocation = (location) => {
    setSelectedLocation(location);
    setMapCenter([location.latitude, location.longitude]);
  };

  // Fill defaults
  useEffect(() => {
    setSettings(s => ({
      age_band: s.age_band || "18-30",
      experience: s.experience || "2-5yr",
      vehicle: s.vehicle || "Automobile",
      weather: s.weather || "Normal",
      road_surface: s.road_surface || "Dry",
      light: s.light || "Daylight",
      ...s,
    }));
  }, []);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("ds_token");
    const userData = localStorage.getItem("ds_user");
    if (!token || !userData) {
      navigate("/login");
      return;
    }
    try { setUser(JSON.parse(userData)); } catch { navigate("/login"); }
  }, [navigate]);

  // Fetch user's latest location
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const token = localStorage.getItem("ds_token");
        
        // Fetch latest location
        const res = await fetch(`${API_BASE_URL}/location/latest`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.location) {
          setMapCenter([data.location.latitude, data.location.longitude]);
          setSelectedLocation(data.location);
        }
        
        // Fetch all user locations
        const locRes = await fetch(`${API_BASE_URL}/location/user-locations`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        const locData = await locRes.json();
        if (locData.locations) {
          setUserLocations(locData.locations);
        }
      } catch (err) {
        console.error("Failed to fetch user location:", err);
      }
    };
    fetchUserLocation();
  }, []);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const [alertsRes, statsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/alerts`),
        fetch(`${API_BASE_URL}/alerts/stats`)
      ]);
      const alertsData = await alertsRes.json();
      const statsData = await statsRes.json();
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
      setAlertStats(statsData);
    } catch (err) {
      console.error("Failed to fetch alerts:", err);
    }
  }, []);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  // Socket.io
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("alert:new", (newAlert) => {
      setAlerts(prev => [newAlert, ...prev]);
      fetchAlerts(); // refresh stats
    });

    return () => s.disconnect();
  }, [fetchAlerts]);

  if (!user) return null;

  const tabTitles = {
    dashboard: "Welcome Back 👋",
    map: "Live Map 🗺️",
    predict: "Risk Predictor 🛡️",
    alerts: "Alert Center 🚨",
    analytics: "Analytics 📊",
    settings: "Settings ⚙️",
  };

  return (
    <div className="dashboard">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            <div className="mobile-menu-btn" onClick={() => setMobileOpen(true)}>
              <FaBars />
            </div>
            <div>
              <h1 className="welcome-title">{tabTitles[activeTab]}</h1>
              <p className="welcome-subtitle">
                {activeTab === "dashboard" ? `Hey ${user.name}, stay safe on the road!` : "DriveSecure — Smart Road Safety"}
              </p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="weather-badge">{settings.weather === "Rainy" ? "🌧️" : settings.weather === "Cloudy" ? "☁️" : "☀️"} {settings.weather || "Normal"}</div>
            <div className="profile-avatar" title={user.name} />
          </div>
        </div>

        {activeTab === "dashboard" && <DashboardView user={user} alerts={alerts} alertStats={alertStats} mapCenter={mapCenter} handleLocationTracked={handleLocationTracked} userLocations={userLocations} selectedLocation={selectedLocation} handleSelectLocation={handleSelectLocation} />}
        {activeTab === "map" && <LiveMapView settings={settings} mapCenter={mapCenter} />}
        {activeTab === "predict" && <RiskCheckView />}
        {activeTab === "alerts" && <AlertsView alerts={alerts} socket={socket} />}
        {activeTab === "analytics" && <AnalyticsView alertStats={alertStats} />}
        {activeTab === "settings" && <SettingsView settings={settings} setSettings={setSettings} user={user} />}
      </div>
    </div>
  );
}

export default Dashboard;