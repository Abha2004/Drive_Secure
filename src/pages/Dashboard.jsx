import { useState, useEffect, useCallback, useRef } from "react";
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
  FaSun,
  FaRoad,
} from "react-icons/fa";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
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
            <MapUpdater center={mapCenter} />
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <Marker position={mapCenter}>
              <Popup>📍 Your Live Location</Popup>
            </Marker>
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

// Helper component to auto-zoom map to route
function MapUpdater({ routeData, center }) {
  const map = useMap();
  useEffect(() => {
    if (routeData && routeData.mainRoute && routeData.mainRoute.path.length > 0) {
      const bounds = window.L.latLngBounds(routeData.mainRoute.path);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, 13);
    }
  }, [routeData, center, map]);
  return null;
}

// Helper for categorized location dropdowns (used by native selects elsewhere)
const RenderLocationOptions = ({ locations }) => {
  const bhopal = locations.filter(l => l.city === 'Bhopal');
  const jabalpur = locations.filter(l => l.city === 'Jabalpur');
  return (
    <>
      {bhopal.length > 0 && (
        <optgroup label="Bhopal">
          {bhopal.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
        </optgroup>
      )}
      {jabalpur.length > 0 && (
        <optgroup label="Jabalpur">
          {jabalpur.map(l => <option key={l.name} value={l.name}>{l.name}</option>)}
        </optgroup>
      )}
    </>
  );
};

// ========== CUSTOM SELECT — always opens downward ==========
function CustomSelect({ value, onChange, placeholder, options, groupedOptions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (val) => { onChange(val); setOpen(false); };

  // Find label for current value
  let displayLabel = placeholder;
  if (value) {
    if (groupedOptions) {
      for (const group of groupedOptions) {
        const found = group.items.find(i => i.value === value);
        if (found) { displayLabel = found.label; break; }
      }
    } else if (options) {
      const found = options.find(o => o.value === value);
      if (found) displayLabel = found.label;
    }
  }

  return (
    <div className="custom-select-wrapper" ref={ref}>
      <div
        className={`custom-select-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className={value ? 'cs-value' : 'cs-placeholder'}>{displayLabel}</span>
        <span className={`cs-arrow ${open ? 'up' : ''}`}>▾</span>
      </div>
      {open && (
        <div className="custom-select-menu">
          <div className="cs-option cs-option-placeholder" onClick={() => handleSelect('')}>{placeholder}</div>
          {groupedOptions && groupedOptions.map(group => (
            <div key={group.label}>
              <div className="cs-group-label">{group.label}</div>
              {group.items.map(item => (
                <div
                  key={item.value}
                  className={`cs-option ${value === item.value ? 'selected' : ''}`}
                  onClick={() => handleSelect(item.value)}
                >
                  {item.label}
                </div>
              ))}
            </div>
          ))}
          {options && options.map(opt => (
            <div
              key={opt.value}
              className={`cs-option ${value === opt.value ? 'selected' : ''}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ========== LIVE MAP VIEW ==========
function LiveMapView({ settings, mapCenter, locations }) {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [age, setAge] = useState("18-30");
  const [experience, setExperience] = useState("2-5yr");
  const [routeData, setRouteData] = useState(null);
  const [showAlt, setShowAlt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localMapCenter, setLocalMapCenter] = useState(mapCenter);

  // Search queries and suggestions
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null); // 'from' or 'to'
  const selectRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (selectRef.current && !selectRef.current.contains(e.target)) {
        setActiveSearch(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync local map center when prop updates
  useEffect(() => {
    if (mapCenter) {
      setLocalMapCenter(mapCenter);
    }
  }, [mapCenter]);

  const calculateRoute = async () => {
    if (!from || !to || from.name === to.name) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/route/safe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, age, experience, settings }),
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

  // Determine closest city to position to sort default recommendations
  const currentLat = localMapCenter?.[0] || 23.2599;
  const currentLng = localMapCenter?.[1] || 77.4126;
  const bhopalDist = Math.pow(currentLat - 23.2599, 2) + Math.pow(currentLng - 77.4126, 2);
  const jabalpurDist = Math.pow(currentLat - 23.1647, 2) + Math.pow(currentLng - 79.9511, 2);
  const isJabalpurCloser = jabalpurDist < bhopalDist;

  // Build default suggestions list
  const getRecommendedLocations = () => {
    const bhopalList = locations.filter(l => l.city === "Bhopal").map(l => ({ name: `${l.name} (Bhopal)`, lat: l.lat, lng: l.lng }));
    const jabalpurList = locations.filter(l => l.city === "Jabalpur").map(l => ({ name: `${l.name} (Jabalpur)`, lat: l.lat, lng: l.lng }));
    if (isJabalpurCloser) {
      return [...jabalpurList, ...bhopalList];
    }
    return [...bhopalList, ...jabalpurList];
  };

  // Nominatim dynamic search
  const handleQueryChange = async (query, type) => {
    if (type === "from") {
      setFromQuery(query);
    } else {
      setToQuery(query);
    }

    if (query.trim().length < 3) {
      if (type === "from") setFromSuggestions([]);
      else setToSuggestions([]);
      return;
    }

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=in`);
      const data = await res.json();
      const mapped = data.map(item => ({
        name: item.display_name.split(',')[0] + ' (' + (item.address?.city || item.address?.state || 'India') + ')',
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon)
      }));
      if (type === "from") setFromSuggestions(mapped);
      else setToSuggestions(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectSuggestion = (item, type) => {
    if (type === "from") {
      setFrom(item);
      setFromQuery("");
      setFromSuggestions([]);
    } else {
      setTo(item);
      setToQuery("");
      setToSuggestions([]);
    }
    setLocalMapCenter([item.lat, item.lng]);
    setActiveSearch(null);
  };

  const handleClearPoint = (type) => {
    if (type === "from") {
      setFrom(null);
      setFromQuery("");
    } else {
      setTo(null);
      setToQuery("");
    }
    setRouteData(null);
  };

  // Capture clicks directly on the map
  const handleMapClick = async (latlng) => {
    const { lat, lng } = latlng;
    let displayName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`);
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address;
        displayName = addr.road || addr.suburb || addr.neighbourhood || addr.city || data.display_name.split(',')[0];
      }
    } catch (err) {
      console.error("Reverse geocoding failed:", err);
    }

    const newPt = { name: displayName, lat, lng };

    if (!from) {
      setFrom(newPt);
      setLocalMapCenter([lat, lng]);
    } else if (!to) {
      setTo(newPt);
      setLocalMapCenter([lat, lng]);
    } else {
      // Reset and set as starting point
      setFrom(newPt);
      setTo(null);
      setRouteData(null);
      setLocalMapCenter([lat, lng]);
    }
  };

  // Helper inside MapContainer to capture clicks
  function MapClickHandler({ onMapClick }) {
    useMapEvents({
      click(e) {
        onMapClick(e.latlng);
      }
    });
    return null;
  }

  const ageOptions = [
    { value: "Under 18", label: "Under 18" },
    { value: "18-30", label: "18–30" },
    { value: "31-50", label: "31–50" },
    { value: "Over 51", label: "Over 51" },
  ];

  const expOptions = [
    { value: "Below 1yr", label: "Below 1 yr" },
    { value: "1-2yr", label: "1 – 2 yrs" },
    { value: "2-5yr", label: "2 – 5 yrs" },
    { value: "5-10yr", label: "5 – 10 yrs" },
    { value: "Above 10yr", label: "Above 10 yrs" },
  ];

  // Helper render for Search inputs
  const renderSearchField = (type, value, query, suggestions, placeholder, onChangeQuery) => {
    const isOpen = activeSearch === type;
    let list = suggestions;
    if (query.trim().length < 3) {
      list = getRecommendedLocations().slice(0, 8);
    }

    return (
      <div className="custom-select-wrapper" style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", position: "relative", width: "100%" }}>
          <input
            type="text"
            className="auth-input"
            style={{
              width: "100%",
              paddingRight: value ? "32px" : "12px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              borderRadius: "8px",
              height: "44px"
            }}
            placeholder={value ? value.name : placeholder}
            value={isOpen ? query : (value ? value.name : "")}
            onChange={(e) => {
              setActiveSearch(type);
              onChangeQuery(e.target.value, type);
            }}
            onFocus={() => setActiveSearch(type)}
          />
          {value && (
            <button
              onClick={() => handleClearPoint(type)}
              style={{
                position: "absolute",
                right: "10px",
                background: "transparent",
                border: "none",
                color: "var(--text-muted)",
                cursor: "pointer",
                fontSize: "18px",
                lineHeight: 1
              }}
            >
              &times;
            </button>
          )}
        </div>

        {isOpen && (
          <div className="custom-select-menu" style={{ display: "block", maxHeight: "250px", overflowY: "auto", width: "100%" }}>
            <div className="cs-group-label" style={{ fontSize: "11px", padding: "6px 12px", color: "var(--text-muted)" }}>
              {query.trim().length >= 3 ? "🔍 SEARCH RESULTS" : "📍 RECOMMENDED LANDMARKS"}
            </div>
            {list.map((item, idx) => (
              <div
                key={idx}
                className="cs-option"
                onClick={() => handleSelectSuggestion(item, type)}
              >
                {item.name}
              </div>
            ))}
            {list.length === 0 && (
              <div style={{ padding: "12px", color: "var(--text-muted)", fontSize: "13px", textAlign: "center" }}>
                No results. Try typing another place or click directly on the map!
              </div>
            )}
            <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.02)", borderTop: "1px solid var(--border-subtle)", fontSize: "11px", color: "var(--blue-400)", textAlign: "center" }}>
              💡 Or click anywhere on the map directly!
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="map-view-full" ref={selectRef}>
      <div className="route-controls">
        <div className="route-planner-header">
          <div className="route-planner-title-group">
            <h3>🗺️ Smart Route Planner</h3>
            <p className="route-planner-subtitle">Real-time AI-optimized safe road navigation</p>
          </div>
        </div>

        <div className="route-planner-grid">
          <div className="premium-input-card">
            <div className="input-header">
              <span className="input-label">Starting Point</span>
              <span className="input-icon">📍</span>
            </div>
            {renderSearchField("from", from, fromQuery, fromSuggestions, "Search or click map...", handleQueryChange)}
          </div>

          <div className="premium-input-card">
            <div className="input-header">
              <span className="input-label">Destination</span>
              <span className="input-icon">🏁</span>
            </div>
            {renderSearchField("to", to, toQuery, toSuggestions, "Search or click map...", handleQueryChange)}
          </div>

          <div className="premium-input-card">
            <div className="input-header">
              <span className="input-label">Driver Age</span>
              <span className="input-icon">👤</span>
            </div>
            <CustomSelect
              value={age}
              onChange={setAge}
              placeholder="Select age..."
              options={ageOptions}
            />
          </div>

          <div className="premium-input-card">
            <div className="input-header">
              <span className="input-label">Experience</span>
              <span className="input-icon">⏱️</span>
            </div>
            <CustomSelect
              value={experience}
              onChange={setExperience}
              placeholder="Select experience..."
              options={expOptions}
            />
          </div>
        </div>

        <div className="route-action-bar">
          <button className="premium-calc-btn" onClick={calculateRoute} disabled={loading || !from || !to || from.name === to.name}>
            {loading ? "Analyzing Safest Route..." : <><FaRoute /> Calculate Safe Route</>}
          </button>
        </div>

        {routeData && (
          <div className="premium-results-layout">
            {/* AI Environment Insights */}
            <div className="results-metrics-group">
              <div className="metric-mini-card">
                <div className="metric-mini-icon weather">
                  <FaSun />
                </div>
                <div className="metric-mini-details">
                  <span className="metric-mini-label">Weather</span>
                  <span className="metric-mini-value">{routeData.environment?.weather || "Normal"}</span>
                </div>
              </div>

              <div className="metric-mini-card">
                <div className="metric-mini-icon road">
                  <FaRoad />
                </div>
                <div className="metric-mini-details">
                  <span className="metric-mini-label">Road Cond.</span>
                  <span className="metric-mini-value">{routeData.environment?.road || "Dry"}</span>
                </div>
              </div>

              <div className="metric-mini-card">
                <div className="metric-mini-icon traffic">
                  <FaTrafficLight />
                </div>
                <div className="metric-mini-details">
                  <span className="metric-mini-label">Traffic Density</span>
                  <span className="metric-mini-value">{routeData.environment?.traffic || "Normal"}</span>
                </div>
              </div>
            </div>

            {/* Risk Assessment Card */}
            <div className={`premium-risk-card ${routeData.mainRoute.riskScore <= 40 ? "safe" : ""}`}>
              <div className="risk-info-details">
                <span className="risk-info-label">AI Risk Assessment</span>
                <span className="risk-info-value" style={{ color: routeData.mainRoute.color }}>
                  {routeData.mainRoute.riskLevel}
                </span>
                <span className="risk-info-sub">
                  Confidence Score: {(routeData.mainRoute.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="risk-circle-meter" style={{ borderColor: routeData.mainRoute.color, color: routeData.mainRoute.color }}>
                <span className="risk-percentage-val">{routeData.mainRoute.riskScore}%</span>
              </div>
            </div>

            {/* Alternate Route Promo */}
            {routeData.mainRoute.riskScore > 50 && (
              <div className="alt-route-cta-container">
                <div className="alt-route-text">
                  <span>🛡️</span>
                  <div>
                    <strong>Safer Alternative Available:</strong> A path with only {routeData.alternativeRoute.riskScore}% risk score is detected.
                  </div>
                </div>
                <button className="premium-alt-btn" onClick={() => setShowAlt(!showAlt)}>
                  {showAlt ? "Hide Path" : "Show Safer Path"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="map-container" style={{ flex: 1, minHeight: "500px" }}>
        <div className="live-badge"><span /> Live Tracking Active</div>
        <MapContainer center={localMapCenter} zoom={13} style={{ height: "100%", width: "100%", zIndex: 1 }}>
          <MapUpdater routeData={routeData} center={localMapCenter} />
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
          <MapClickHandler onMapClick={handleMapClick} />
          {from && (
            <Marker position={[from.lat, from.lng]}>
              <Popup>🟢 Starting Point: {from.name}</Popup>
            </Marker>
          )}
          {to && (
            <Marker position={[to.lat, to.lng]}>
              <Popup>🔴 Destination: {to.name}</Popup>
            </Marker>
          )}
          {routeData && (
            <>
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
function AlertsView({ alerts, socket, locations }) {
  const [msg, setMsg] = useState("");
  const [locationName, setLocationName] = useState("");
  const [risk, setRisk] = useState("medium");
  const [alertType, setAlertType] = useState("accident");
  const [submitting, setSubmitting] = useState(false);

  const alertTypes = [
    { id: "accident", label: "Accident", icon: <FaCarCrash />, color: "var(--danger)" },
    { id: "waterlog", label: "Waterlogging", icon: <FaWater />, color: "var(--blue-400)" },
    { id: "traffic", label: "Traffic Jam", icon: <FaTrafficLight />, color: "var(--warning)" },
    { id: "construction", label: "Construction", icon: <FaHardHat />, color: "var(--text-muted)" },
  ];

  const locationGroupedOptions = [
    {
      label: "🏙️ Bhopal",
      items: locations.filter(l => l.city === 'Bhopal').map(l => ({ value: l.name, label: l.name }))
    },
    {
      label: "🌆 Jabalpur",
      items: locations.filter(l => l.city === 'Jabalpur').map(l => ({ value: l.name, label: l.name }))
    }
  ].filter(g => g.items.length > 0);

  const riskLevels = [
    { id: "low", label: "Low Risk", color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)", icon: "🟢" },
    { id: "medium", label: "Medium Risk", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)", icon: "🟡" },
    { id: "high", label: "High Risk", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)", icon: "🔴" }
  ];

  const submitAlert = async () => {
    if (!msg.trim() || !locationName) return;
    const selectedLoc = locations.find(l => l.name === locationName);
    if (!selectedLoc) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: selectedLoc.lat,
          longitude: selectedLoc.lng,
          riskLevel: risk,
          message: `[${alertType.toUpperCase()}] ${msg} at ${locationName}`
        }),
      });
      const newAlert = await res.json();
      if (socket) socket.emit("alert:new", newAlert);
      setMsg("");
      setLocationName("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="alerts-view" style={{ display: "flex", gap: "24px", flexWrap: "wrap", alignItems: "flex-start" }}>
      
      {/* Alert Report Form */}
      <div className="alert-report-card panel-card" style={{ flex: "1", minWidth: "340px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div>
          <h3 style={{ marginBottom: "4px" }}>🚨 Report New Alert</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Broadcast critical hazards to all active drivers in real-time.</p>
        </div>

        {/* Hazard Grid Selectors */}
        <div>
          <label className="settings-label" style={{ marginBottom: "10px" }}>Select Alert Type</label>
          <div className="alert-type-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {alertTypes.map(t => (
              <div
                key={t.id}
                className={`alert-type-btn ${alertType === t.id ? "active" : ""}`}
                onClick={() => setAlertType(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                  borderRadius: "10px",
                  border: alertType === t.id ? `2px solid ${t.color}` : "1px solid var(--border-subtle)",
                  background: alertType === t.id ? `${t.color}15` : "rgba(255,255,255,0.01)",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease"
                }}
              >
                <span style={{ color: t.color, fontSize: "20px", display: "flex" }}>{t.icon}</span>
                <span style={{ fontSize: "14px", color: alertType === t.id ? "white" : "var(--text-muted)" }}>{t.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Location Dropdown */}
        <div>
          <label className="settings-label">📍 Incident Location</label>
          <CustomSelect
            value={locationName}
            onChange={setLocationName}
            placeholder="Select location..."
            groupedOptions={locationGroupedOptions}
          />
        </div>

        {/* Risk Grid Selector */}
        <div>
          <label className="settings-label" style={{ marginBottom: "10px" }}>⚠️ Risk Severity Level</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
            {riskLevels.map(r => (
              <div
                key={r.id}
                onClick={() => setRisk(r.id)}
                style={{
                  padding: "12px 8px",
                  borderRadius: "10px",
                  border: risk === r.id ? `2px solid ${r.color}` : "1px solid var(--border-subtle)",
                  background: risk === r.id ? r.bg : "rgba(255,255,255,0.01)",
                  color: risk === r.id ? "white" : "var(--text-muted)",
                  cursor: "pointer",
                  textAlign: "center",
                  fontWeight: "700",
                  fontSize: "13px",
                  transition: "all 0.2s ease",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <span style={{ fontSize: "18px" }}>{r.icon}</span>
                <span>{r.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hazard Description */}
        <div>
          <label className="settings-label">📝 Description Details</label>
          <input
            className="auth-input"
            placeholder="Describe the incident (e.g. major pothole, lane closed)..."
            value={msg}
            onChange={e => setMsg(e.target.value)}
            style={{ width: "100%", height: "44px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "rgba(255,255,255,0.02)", color: "white", padding: "0 12px" }}
          />
        </div>

        {/* Submit */}
        <button
          className="route-calc-btn"
          onClick={submitAlert}
          disabled={submitting || !msg.trim() || !locationName}
          style={{ width: "100%", height: "46px", fontSize: "15px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          {submitting ? "Submitting Broadcast..." : <><FaPaperPlane /> Broadcast Real-Time Alert</>}
        </button>
      </div>

      {/* Alerts Feed */}
      <div className="panel-card alerts-panel" style={{ flex: "1.4", minWidth: "360px", display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <h3 style={{ marginBottom: "4px" }}>📋 Live Broadcast Alert Feed</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: 0 }}>Active, crowdsourced road hazard notifications in Jabalpur and Bhopal ({alerts.length})</p>
        </div>

        <div className="alerts-scroll" style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "460px", overflowY: "auto", paddingRight: "4px" }}>
          {alerts.map((a, i) => {
            const isHigh = a.riskLevel === 'high';
            const isMed = a.riskLevel === 'medium';
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "12px",
                  border: `1px solid ${isHigh ? "rgba(239, 68, 68, 0.15)" : isMed ? "rgba(245, 158, 11, 0.15)" : "rgba(34, 197, 94, 0.15)"}`,
                  background: isHigh ? "rgba(239, 68, 68, 0.03)" : isMed ? "rgba(245, 158, 11, 0.03)" : "rgba(34, 197, 94, 0.03)",
                  gap: "16px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
                  <span style={{ fontSize: "20px" }}>{isHigh ? '🚨' : isMed ? '⚠️' : '🔔'}</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-primary)" }}>{a.message}</span>
                    <span style={{ fontSize: "11px", color: isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#22c55e", fontWeight: "700", textTransform: "uppercase" }}>
                      {a.riskLevel} Risk Alert
                    </span>
                  </div>
                </div>
                <small style={{ color: "var(--text-muted)", fontSize: "12px", whiteSpace: "nowrap" }}>
                  {a.createdAt ? new Date(a.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Active"}
                </small>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", color: "var(--text-muted)" }}>
              <span style={{ fontSize: "40px", marginBottom: "10px" }}>🟢</span>
              <p style={{ margin: 0, fontSize: "14px" }}>No active alerts reported. All routes clear!</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// ========== ANALYTICS VIEW ==========
function AnalyticsView({ alertStats }) {
  const riskData = [
    { label: "Fatal Alerts", value: alertStats.high, color: "#ef4444", bg: "rgba(239,68,68,0.08)", icon: "🚨" },
    { label: "Serious Alerts", value: alertStats.medium, color: "#ffc400", bg: "rgba(255,196,0,0.08)", icon: "⚠️" },
    { label: "Slight Alerts", value: alertStats.low, color: "#22c55e", bg: "rgba(34,197,94,0.08)", icon: "🟢" },
  ];

  const weatherRisk = [
    { label: "Clear Weather", value: 25, color: "#22c55e", desc: "Minimal risk of accidents", icon: "☀️" },
    { label: "Rainy Weather", value: 78, color: "#60a5fa", desc: "Slippery roads, high risk", icon: "🌧️" },
    { label: "Foggy Weather", value: 65, color: "#ffc400", desc: "Low visibility, caution advised", icon: "🌫️" },
    { label: "Stormy Weather", value: 92, color: "#ef4444", desc: "Severe wind & rain, extreme risk", icon: "⛈️" },
  ];

  const hourlyData = [10, 8, 5, 3, 2, 4, 15, 35, 42, 30, 25, 28, 32, 38, 35, 40, 55, 68, 60, 45, 30, 22, 18, 12];
  const maxHourly = Math.max(...hourlyData);

  return (
    <div className="analytics-view" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", flexWrap: "wrap" }}>
        
        {/* Severity Cards Grid */}
        <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ marginBottom: "8px" }}>📊 Alert Severity Distribution</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {riskData.map((d, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "12px",
                  border: `1px solid rgba(255,255,255,0.03)`,
                  background: d.bg,
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{ fontSize: "28px", marginRight: "16px" }}>{d.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "4px" }}>{d.label}</div>
                  <div style={{ height: "6px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "3px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${d.value > 0 ? Math.min(100, (d.value / Math.max(alertStats.total, 1)) * 100) : 0}%`,
                        background: d.color,
                        borderRadius: "3px",
                        boxShadow: `0 0 10px ${d.color}`,
                        transition: "width 0.8s ease"
                      }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: d.color, marginLeft: "16px", minWidth: "40px", textAlign: "right" }}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weather Risk Grid */}
        <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ marginBottom: "8px" }}>🌧️ Weather Risk Index</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            {weatherRisk.map((w, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid rgba(255,255,255,0.02)",
                  background: "rgba(255,255,255,0.01)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "12px",
                  transition: "transform 0.2s",
                  cursor: "default"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "20px" }}>{w.icon}</span>
                  <span style={{ fontSize: "18px", fontWeight: "700", color: w.color }}>{w.value}%</span>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", fontWeight: "600" }}>{w.label}</h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "var(--text-muted)" }}>{w.desc}</p>
                </div>
                <div style={{ height: "4px", width: "100%", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${w.value}%`,
                      background: w.color,
                      borderRadius: "2px",
                      boxShadow: `0 0 8px ${w.color}`,
                      transition: "width 0.8s ease"
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Hourly Trend Panel */}
      <div className="panel-card" style={{ width: "100%" }}>
        <h3 style={{ marginBottom: "20px" }}>📈 Hourly Accident Trend (24h)</h3>
        <div style={{ padding: "8px 0" }}>
          <svg viewBox="0 0 600 180" style={{ width: "100%", maxHeight: "200px" }}>
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => (
              <line
                key={idx}
                x1="20"
                y1={30 + p * 130}
                x2="580"
                y2={30 + p * 130}
                stroke="rgba(255,255,255,0.03)"
                strokeDasharray="4 4"
              />
            ))}
            <polyline
              points={hourlyData.map((v, i) => `${20 + i * 24.3},${160 - (v / maxHourly) * 130}`).join(" ")}
              fill="none" stroke="var(--blue-400)" strokeWidth="2.5" strokeLinejoin="round"
            />
            <polygon
              points={`20,160 ${hourlyData.map((v, i) => `${20 + i * 24.3},${160 - (v / maxHourly) * 130}`).join(" ")} ${20 + 23 * 24.3},160`}
              fill="url(#trendGrad)" opacity="0.15"
            />
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--blue-400)" />
                <stop offset="100%" stopColor="transparent" />
              </linearGradient>
            </defs>
            {[0, 6, 12, 18, 23].map(i => (
              <text key={i} x={20 + i * 24.3} y={178} fill="#94a3b8" fontSize="10" textAnchor="middle">{i}:00</text>
            ))}
            {hourlyData.map((v, i) => (
              <circle key={i} cx={20 + i * 24.3} cy={160 - (v / maxHourly) * 130} r="3.5" fill="var(--blue-400)" stroke="var(--bg-primary)" strokeWidth="1" />
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

  // Load preferences from settings state or defaults
  const [audioAlerts, setAudioAlerts] = useState(settings.audioAlerts !== false);
  const [pushNotifications, setPushNotifications] = useState(settings.pushNotifications !== false);
  const [autoAlternative, setAutoAlternative] = useState(settings.autoAlternative !== false);
  const [highRiskOverlay, setHighRiskOverlay] = useState(settings.highRiskOverlay !== false);
  const [trafficLayer, setTrafficLayer] = useState(settings.trafficLayer === true);

  const handleSave = () => {
    const updatedSettings = {
      ...settings,
      audioAlerts,
      pushNotifications,
      autoAlternative,
      highRiskOverlay,
      trafficLayer
    };
    localStorage.setItem("ds_settings", JSON.stringify(updatedSettings));
    setSettings(updatedSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const renderToggle = (label, description, checked, onChange) => (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <div style={{ paddingRight: "16px" }}>
        <div style={{ fontSize: "14px", fontWeight: "600", color: "white" }}>{label}</div>
        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>{description}</div>
      </div>
      <div 
        onClick={() => onChange(!checked)}
        style={{
          width: "44px",
          height: "22px",
          borderRadius: "11px",
          background: checked ? "var(--blue-400)" : "rgba(255,255,255,0.1)",
          padding: "2px",
          cursor: "pointer",
          transition: "background 0.2s ease",
          display: "flex",
          alignItems: "center",
          flexShrink: 0
        }}
      >
        <div 
          style={{
            width: "18px",
            height: "18px",
            borderRadius: "50%",
            background: "white",
            transform: checked ? "translateX(22px)" : "translateX(0)",
            transition: "transform 0.2s ease",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="settings-view" style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "600px" }}>
      
      {/* Profile Card */}
      <div className="panel-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "20px" }}>
        <div style={{ width: "52px", height: "52px", borderRadius: "50%", background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", fontWeight: "bold" }}>
          {user?.name ? user.name[0].toUpperCase() : "U"}
        </div>
        <div>
          <h3 style={{ margin: "0 0 4px 0", fontSize: "16px" }}>{user?.name || "User Profile"}</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "13px" }}>{user?.email || "user@drivesecure.com"}</p>
        </div>
      </div>

      {/* Safety Preferences */}
      <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>🛡️ Live Safety Preferences</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 12px 0" }}>Control how DriveSecure alerts you about live road hazards.</p>
        
        {renderToggle("Vocal Warning Alerts", "Get vocal sound warning when approaching fatal/serious accident-prone zones", audioAlerts, setAudioAlerts)}
        {renderToggle("Live Hazard Broadcasts", "Receive real-time push alerts about active road events in your city", pushNotifications, setPushNotifications)}
        {renderToggle("Auto-Route Optimizer", "Automatically suggest alternative route if current path risk exceeds 50%", autoAlternative, setAutoAlternative)}
      </div>

      {/* Map Preferences */}
      <div className="panel-card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <h3 style={{ marginBottom: "8px" }}>🗺️ Map Display Options</h3>
        <p style={{ color: "var(--text-muted)", fontSize: "13px", margin: "0 0 12px 0" }}>Customize information overlays on the Live Map.</p>

        {renderToggle("Accident Hazard Overlay", "Highlight historical accident-prone regions with heat overlays on map", highRiskOverlay, setHighRiskOverlay)}
        {renderToggle("Live Traffic Density Flow", "Overlay real-time traffic speeds and congestion lines along path", trafficLayer, setTrafficLayer)}

        <button 
          className="route-calc-btn" 
          onClick={handleSave} 
          style={{ width: "100%", height: "44px", marginTop: "16px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <FaSave /> {saved ? "✨ Preferences Saved!" : "Save Safety Settings"}
        </button>
      </div>

    </div>
  );
}

// ========== RISK CHECK VIEW ==========
function RiskCheckView({ locations }) {
  const now = new Date();
  const currentHour = now.getHours();

  // Auto-detect light condition from real clock
  const autoLight = (currentHour >= 18 || currentHour < 6) ? 'Darkness - lights lit' : 'Daylight';
  // Auto-detect time slot label
  const getTimeSlot = (h) => {
    if (h >= 6  && h < 10) return 'Morning Rush (6–10 AM)';
    if (h >= 10 && h < 13) return 'Mid Morning (10 AM–1 PM)';
    if (h >= 13 && h < 17) return 'Afternoon (1–5 PM)';
    if (h >= 17 && h < 21) return 'Evening Rush (5–9 PM)';
    return 'Night (9 PM–6 AM)';
  };

  // Auto traffic area by time
  const autoTrafficArea = () => {
    if (currentHour >= 8  && currentHour < 10) return 'Office areas';
    if (currentHour >= 10 && currentHour < 16) return 'Market areas';
    if (currentHour >= 17 && currentHour < 20) return 'Office areas';
    if (currentHour >= 20 || currentHour < 6)  return 'Residential areas';
    return 'Industrial areas';
  };

  const [vehicle, setVehicle] = useState('Automobile');
  const [timeOverride, setTimeOverride] = useState(String(currentHour));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [autoParams, setAutoParams] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchHistory = useCallback(async () => {
    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch(`${API_BASE_URL}/predict/history`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (Array.isArray(data)) setHistory(data);
    } catch {}
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const getRiskColor = (level) => {
    if (level === 'Fatal injury')   return '#ef4444';
    if (level === 'Serious Injury') return '#f59e0b';
    return '#22c55e';
  };

  const handlePredict = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    const h = parseInt(timeOverride, 10);

    // Auto-determine all environmental parameters
    const weathers     = ['Normal', 'Rainy', 'Cloudy', 'Fog or mist'];
    const weatherPick  = weathers[Math.floor(Math.random() * weathers.length)];
    const road         = (weatherPick === 'Rainy' || weatherPick === 'Fog or mist') ? 'Wet or damp' : 'Dry';
    const light        = (h >= 18 || h < 6) ? 'Darkness - lights lit' : 'Daylight';
    const trafficAreas = ['Market areas', 'Office areas', 'Industrial areas', 'Residential areas'];
    const area         = (h >= 8 && h < 10) || (h >= 17 && h < 20) ? 'Office areas'
                       : (h >= 10 && h < 16) ? 'Market areas'
                       : (h >= 20 || h < 6) ? 'Residential areas'
                       : 'Industrial areas';

    const detected = { weather: weatherPick, road, light, area, timeSlot: getTimeSlot(h) };
    setAutoParams(detected);

    const payload = {
      age_band_of_driver:  '18-30',
      driving_experience:  '2-5yr',
      type_of_vehicle:     vehicle,
      location:            area,
      road_surface_conditions: road,
      light_conditions:    light,
      weather_conditions:  weatherPick,
    };

    try {
      const token = localStorage.getItem('ds_token');
      const res = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) { setResult(data); fetchHistory(); }
      else setError(data.error || 'Prediction failed.');
    } catch {
      setError('Could not connect to prediction API.');
    } finally {
      setLoading(false);
    }
  };

  const vehicleGroupedOptions = [
    {
      label: '🛵 2-Wheeler',
      items: [
        { value: 'Motorcycle',  label: '🏍️ Bike / Motorcycle' },
        { value: 'Bajaj',       label: '🛺 Auto Rickshaw (3-Wheeler)' },
        { value: 'Bicycle',     label: '🚲 Bicycle' },
      ]
    },
    {
      label: '🚗 4-Wheeler (Personal)',
      items: [
        { value: 'Automobile',       label: '🚗 Car / Hatchback / Sedan' },
        { value: 'Pick up upto 10Q', label: '🛻 Pick-Up / SUV' },
        { value: 'Stationwagen',     label: '🚙 Station Wagon / MUV' },
        { value: 'Taxi',             label: '🚕 Taxi / Cab' },
      ]
    },
    {
      label: '🚌 Public Transport',
      items: [
        { value: 'Public (> 45 seats)',  label: '🚌 Bus (> 45 seats)' },
        { value: 'Public (13?45 seats)', label: '🚌 Mini Bus (13-45 seats)' },
        { value: 'Public (12 seats)',    label: '🚐 Tempo / Van (≤12 seats)' },
      ]
    },
    {
      label: '🚛 Heavy / Commercial',
      items: [
        { value: 'Lorry (41?100Q)', label: '🚛 Lorry / Truck (41-100Q)' },
        { value: 'Lorry (11?40Q)', label: '🚛 Lorry / Truck (11-40Q)' },
        { value: 'Long lorry',      label: '🚛 Long Trailer / Heavy Truck' },
      ]
    },
    {
      label: '🚙 Other',
      items: [
        { value: 'Special vehicle', label: '🚑 Special Vehicle (Ambulance / Fire)' },
        { value: 'Other',           label: '❓ Other' },
      ]
    },
  ];

  const timeOptions = Array.from({ length: 24 }, (_, i) => ({
    value: String(i),
    label: `${String(i).padStart(2,'0')}:00 — ${getTimeSlot(i)}`
  }));

  const rfConf  = result ? result.random_forest?.confidence_score * 100  : 0;
  const lrConf  = result ? result.logistic_regression?.confidence_score * 100 : 0;
  const rfLevel = result?.random_forest?.risk_level;
  const lrLevel = result?.logistic_regression?.risk_level;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── TOP ROW: Input + Auto-params + Results ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: '20px', flexWrap: 'wrap' }}>

        {/* Input Card */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FaShieldAlt style={{ color: 'var(--blue-400)' }} /> Risk Predictor
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              Select your vehicle &amp; time — we'll detect the rest automatically.
            </p>
          </div>

          <div>
            <label className="settings-label">🚗 Vehicle Type</label>
            <CustomSelect value={vehicle} onChange={setVehicle} placeholder="Select vehicle type..." groupedOptions={vehicleGroupedOptions} />
          </div>

          <div>
            <label className="settings-label">🕐 Time of Day</label>
            <CustomSelect value={timeOverride} onChange={setTimeOverride} placeholder="Select time..." options={timeOptions} />
          </div>

          <button
            className="route-calc-btn"
            onClick={handlePredict}
            disabled={loading}
            style={{ width: '100%', marginTop: 'auto', padding: '14px' }}
          >
            {loading ? '🔍 Analyzing...' : '⚡ Analyze Risk Now'}
          </button>
          {error && <div className="alert-item alert-danger" style={{ marginTop: '0' }}>⚠️ {error}</div>}
        </div>

        {/* Auto-detected Parameters */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>🤖 Auto-Detected Conditions</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>
              System-inferred from your selected time
            </p>
          </div>

          {[
            { icon: '🕐', label: 'Time Slot',       value: autoParams ? autoParams.timeSlot  : getTimeSlot(parseInt(timeOverride)) },
            { icon: '🌤️', label: 'Weather',          value: autoParams ? autoParams.weather   : '— run prediction first' },
            { icon: '🛣️', label: 'Road Surface',     value: autoParams ? autoParams.road      : '— run prediction first' },
            { icon: '💡', label: 'Light Condition',  value: autoParams ? autoParams.light     : (parseInt(timeOverride) >= 18 || parseInt(timeOverride) < 6 ? 'Darkness - lights lit' : 'Daylight') },
            { icon: '📍', label: 'Traffic Area',     value: autoParams ? autoParams.area      : autoTrafficArea() },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.025)',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{icon}</span>
              <div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'white', marginTop: '2px' }}>{value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Result + Risk Graph */}
        <div className="panel-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h3 style={{ marginBottom: '4px' }}>📊 Risk Analysis Output</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: 0 }}>AI model comparison with confidence scores</p>
          </div>

          {result ? (
            <>
              {/* Risk Bar Graph */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  { label: '🌲 Random Forest', level: rfLevel, conf: rfConf, color: getRiskColor(rfLevel), accent: 'var(--blue-400)' },
                  { label: '📈 Logistic Regression', level: lrLevel, conf: lrConf, color: getRiskColor(lrLevel), accent: '#a855f7' },
                ].map(({ label, level, conf, color, accent }) => (
                  <div key={label} style={{
                    padding: '14px 16px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid rgba(255,255,255,0.06)`,
                    borderLeft: `4px solid ${color}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: accent }}>{label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 800, color }}>{level}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${conf}%`, background: color,
                          borderRadius: '4px', transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                        }} />
                      </div>
                      <span style={{ fontSize: '13px', fontWeight: 800, color, minWidth: '42px', textAlign: 'right' }}>{conf.toFixed(1)}%</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* SVG gauge: risk levels side-by-side */}
              <div style={{ marginTop: '4px' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Risk Level Gauge</div>
                <svg viewBox="0 0 300 80" style={{ width: '100%' }}>
                  {[
                    { label: 'Slight', val: rfLevel === 'Slight Injury' ? rfConf : (lrLevel === 'Slight Injury' ? lrConf : 30), color: '#22c55e' },
                    { label: 'Serious', val: rfLevel === 'Serious Injury' ? rfConf : (lrLevel === 'Serious Injury' ? lrConf : 20), color: '#f59e0b' },
                    { label: 'Fatal', val: rfLevel === 'Fatal injury' ? rfConf : (lrLevel === 'Fatal injury' ? lrConf : 10), color: '#ef4444' },
                  ].map((d, i) => {
                    const bw = (d.val / 100) * 160;
                    const y = 8 + i * 24;
                    return (
                      <g key={d.label}>
                        <text x="0" y={y + 13} fill="#94a3b8" fontSize="10">{d.label}</text>
                        <rect x="52" y={y} width={bw} height="16" rx="6" fill={d.color} opacity="0.85">
                          <animate attributeName="width" from="0" to={bw} dur="0.9s" fill="freeze" />
                        </rect>
                        <text x={56 + bw} y={y + 12} fill="white" fontSize="10" fontWeight="700">{d.val.toFixed(0)}%</text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              {/* Safety alert */}
              <div className={`alert-item ${rfLevel === 'Fatal injury' ? 'alert-danger' : rfLevel === 'Serious Injury' ? 'alert-warning' : 'alert-info'}`}>
                {rfLevel === 'Fatal injury'   ? '🚨 HIGH RISK: Consider delaying travel or taking a safer alternative.'
                 : rfLevel === 'Serious Injury' ? '⚠️ MODERATE RISK: Drive carefully, wear seatbelt, reduce speed.'
                 : '✅ LOW RISK: Conditions appear safe. Follow standard precautions.'}
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--text-muted)', textAlign: 'center', padding: '40px 20px', gap: '16px' }}>
              <span style={{ fontSize: '52px' }}>🤖</span>
              <p style={{ margin: 0, fontSize: '14px', lineHeight: 1.6 }}>
                Select your vehicle &amp; time on the left, then click <strong style={{ color: 'white' }}>Analyze Risk Now</strong> to see AI-powered severity prediction.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── HISTORY TABLE ── */}
      <div className="panel-card">
        <h3 style={{ marginBottom: '16px' }}>📋 Prediction History ({history.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '10px 8px' }}>Time</th>
                <th style={{ padding: '10px 8px' }}>Vehicle</th>
                <th style={{ padding: '10px 8px' }}>Weather / Road</th>
                <th style={{ padding: '10px 8px' }}>Area</th>
                <th style={{ padding: '10px 8px' }}>RF Result</th>
                <th style={{ padding: '10px 8px' }}>LR Result</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={h._id || i} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>
                    {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    <div style={{ fontSize: '11px' }}>{new Date(h.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td style={{ padding: '10px 8px' }}>🚗 {h.inputs?.type_of_vehicle}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <div>{h.inputs?.weather_conditions}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{h.inputs?.road_surface_conditions}</div>
                  </td>
                  <td style={{ padding: '10px 8px', color: 'var(--text-muted)' }}>{h.inputs?.location}</td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ color: getRiskColor(h.random_forest?.risk_level), fontWeight: 700 }}>{h.random_forest?.risk_level}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontSize: '11px' }}>({(h.random_forest?.confidence_score * 100).toFixed(0)}%)</span>
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ color: getRiskColor(h.logistic_regression?.risk_level), fontWeight: 700 }}>{h.logistic_regression?.risk_level}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px', fontSize: '11px' }}>({(h.logistic_regression?.confidence_score * 100).toFixed(0)}%)</span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>No predictions yet. Make your first prediction above!</td></tr>
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
  const [globalLocations, setGlobalLocations] = useState([]);
  const [settings, setSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ds_settings")) || {}; } catch { return {}; }
  });

  // Fetch global locations
  useEffect(() => {
    const fetchLocs = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/route/locations`);
        const data = await res.json();
        if (Array.isArray(data)) setGlobalLocations(data);
      } catch (err) {
        console.error("Failed to fetch locations:", err);
      }
    };
    fetchLocs();
  }, []);

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
        {activeTab === "map" && <LiveMapView settings={settings} mapCenter={mapCenter} locations={globalLocations} />}
        {activeTab === "predict" && <RiskCheckView locations={globalLocations} />}
        {activeTab === "alerts" && <AlertsView alerts={alerts} socket={socket} locations={globalLocations} />}
        {activeTab === "analytics" && <AnalyticsView alertStats={alertStats} />}
        {activeTab === "settings" && <SettingsView settings={settings} setSettings={setSettings} user={user} />}
      </div>
    </div>
  );
}

export default Dashboard;