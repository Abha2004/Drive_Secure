import { useState } from "react";
import { FaMapMarkerAlt, FaLocationArrow, FaSave, FaSatelliteDish } from "react-icons/fa";
import { API_BASE_URL } from "../config/env";

function LocationForm({ onLocationTracked }) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [activeTab, setActiveTab] = useState("auto");

  const getCurrentLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          const fixedLat = parseFloat(lat.toFixed(6));
          const fixedLng = parseFloat(lng.toFixed(6));
          setLatitude(fixedLat);
          setLongitude(fixedLng);
          if (!name.trim()) setName("Current Location");
          if (typeof onLocationTracked === "function") onLocationTracked(fixedLat, fixedLng);
          setMessage("Location fetched successfully!");
          setMessageType("success");
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setMessage("Unable to fetch location. Please enable location access.");
          setMessageType("error");
          setLoading(false);
        }
      );
    } else {
      setMessage("Geolocation is not supported by your browser.");
      setMessageType("error");
      setLoading(false);
    }
  };

  const handleNameBlur = async () => {
    if (activeTab === "manual" && name.trim().length >= 3 && (!latitude || !longitude)) {
      setLoading(true);
      setMessage("Detecting coordinates...");
      setMessageType("success");
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(name.trim())}&limit=1&countrycodes=in`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          const lon = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setLatitude(lat);
          setLongitude(lon);
          setMessage(`Coordinates auto-detected: ${lat}, ${lon}`);
          setMessageType("success");
        } else {
          setMessage("Could not auto-detect. Enter coordinates manually.");
          setMessageType("error");
        }
      } catch (err) {
        setMessage("Geocoding lookup failed.");
        setMessageType("error");
      } finally {
        setLoading(false);
      }
    }
  };

  const submitLocation = async () => {
    const finalName = name.trim();
    let finalLat = latitude;
    let finalLng = longitude;
    if (!finalName) { setMessage("Please enter a location name."); setMessageType("error"); return; }
    setLoading(true);
    if (activeTab === "manual" && (!finalLat || !finalLng)) {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(finalName)}&limit=1&countrycodes=in`);
        const data = await res.json();
        if (data && data.length > 0) {
          finalLat = parseFloat(parseFloat(data[0].lat).toFixed(6));
          finalLng = parseFloat(parseFloat(data[0].lon).toFixed(6));
          setLatitude(finalLat); setLongitude(finalLng);
        } else { setMessage("Could not resolve coordinates."); setMessageType("error"); setLoading(false); return; }
      } catch { setMessage("Failed to search for coordinates."); setMessageType("error"); setLoading(false); return; }
    }
    try {
      const token = localStorage.getItem("ds_token");
      const res = await fetch(`${API_BASE_URL}/location/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: finalName, latitude: parseFloat(finalLat), longitude: parseFloat(finalLng) }),
      });
      if (!res.ok) throw new Error("Failed");
      setMessage(`"${finalName}" saved successfully!`);
      setMessageType("success");
      if (typeof onLocationTracked === "function") onLocationTracked(parseFloat(finalLat), parseFloat(finalLng));
      setTimeout(() => { setName(""); setLatitude(""); setLongitude(""); setMessage(""); }, 2500);
    } catch {
      setMessage("Failed to save location. Please try again.");
      setMessageType("error");
    } finally { setLoading(false); }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setLatitude(""); setLongitude(""); setName(""); setMessage("");
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(8,14,32,0.95) 0%, rgba(5,9,22,0.98) 100%)",
      border: "1px solid rgba(96,165,250,0.12)",
      borderRadius: "20px",
      padding: "28px",
      backdropFilter: "blur(24px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Top edge glow */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(96,165,250,0.4),transparent)" }} />
      {/* Ambient bg glow */}
      <div style={{ position:"absolute", top:"-40px", left:"-40px", width:"200px", height:"200px", borderRadius:"50%", background:"radial-gradient(circle, rgba(96,165,250,0.04) 0%, transparent 70%)", pointerEvents:"none" }} />

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:"14px", marginBottom:"24px" }}>
        <div style={{
          width:"42px", height:"42px", borderRadius:"12px", flexShrink:0,
          background:"linear-gradient(135deg, rgba(96,165,250,0.2), rgba(79,70,229,0.15))",
          border:"1px solid rgba(96,165,250,0.25)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:"18px", color:"#60a5fa",
          boxShadow:"0 0 20px rgba(96,165,250,0.15)"
        }}>
          <FaMapMarkerAlt />
        </div>
        <div>
          <h3 style={{ margin:0, fontSize:"16px", fontWeight:"700", color:"white" }}>Add Your Location</h3>
          <p style={{ margin:0, fontSize:"12px", color:"rgba(148,163,184,0.7)", marginTop:"2px" }}>Pin your position to the safety map</p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{
        display:"flex", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
        borderRadius:"12px", padding:"4px", gap:"4px", marginBottom:"22px"
      }}>
        {[
          { id:"auto", icon:<FaLocationArrow />, label:"Auto-Detect" },
          { id:"manual", icon:<FaMapMarkerAlt />, label:"Manual Entry" }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => switchTab(tab.id)}
            style={{
              flex:1, padding:"10px 14px", borderRadius:"9px", border:"none", cursor:"pointer",
              fontSize:"13px", fontWeight:"600", display:"flex", alignItems:"center", justifyContent:"center", gap:"7px",
              transition:"all 0.25s ease",
              background: activeTab === tab.id
                ? "linear-gradient(135deg, rgba(37,99,235,0.35), rgba(79,70,229,0.28))"
                : "transparent",
              color: activeTab === tab.id ? "#93c5fd" : "rgba(148,163,184,0.6)",
              boxShadow: activeTab === tab.id ? "0 0 15px rgba(37,99,235,0.15), inset 0 1px 0 rgba(255,255,255,0.05)" : "none",
              borderColor: activeTab === tab.id ? "rgba(96,165,250,0.2)" : "transparent",
            }}
          >
            <span style={{ fontSize:"12px" }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Auto-Detect Tab */}
      {activeTab === "auto" ? (
        <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
          {latitude && longitude ? (
            /* Coords detected */
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
              {[["Latitude", latitude], ["Longitude", longitude]].map(([label, val]) => (
                <div key={label} style={{
                  background:"rgba(96,165,250,0.04)", border:"1px solid rgba(96,165,250,0.15)",
                  borderRadius:"12px", padding:"14px 16px", position:"relative", overflow:"hidden"
                }}>
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:"1px", background:"linear-gradient(90deg,transparent,rgba(96,165,250,0.3),transparent)" }} />
                  <p style={{ margin:0, fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.8px", color:"rgba(96,165,250,0.7)", marginBottom:"6px" }}>{label}</p>
                  <p style={{ margin:0, fontSize:"15px", fontWeight:"700", color:"white", fontFamily:"'Courier New', monospace", textShadow:"0 0 10px rgba(96,165,250,0.3)" }}>{val}</p>
                </div>
              ))}
            </div>
          ) : (
            /* Not detected */
            <div style={{
              background:"rgba(255,255,255,0.01)", border:"1px dashed rgba(96,165,250,0.15)",
              borderRadius:"14px", padding:"24px 20px", textAlign:"center",
            }}>
              {/* Radar animation */}
              <div style={{ position:"relative", width:"56px", height:"56px", margin:"0 auto 14px" }}>
                <style>{`
                  @keyframes radarRing { 0%{transform:scale(0.6);opacity:0.8} 100%{transform:scale(1.6);opacity:0} }
                  @keyframes radarSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
                `}</style>
                <div style={{ position:"absolute", inset:0, borderRadius:"50%", border:"1px solid rgba(96,165,250,0.25)", animation:"radarRing 2s ease-out infinite" }} />
                <div style={{ position:"absolute", inset:"8px", borderRadius:"50%", border:"1px solid rgba(96,165,250,0.2)", animation:"radarRing 2s ease-out 0.6s infinite" }} />
                <div style={{ position:"absolute", inset:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", color:"#60a5fa", animation:"radarSpin 4s linear infinite" }}>
                  <FaSatelliteDish />
                </div>
              </div>
              <p style={{ margin:0, fontSize:"13px", color:"rgba(148,163,184,0.8)", lineHeight:1.5 }}>
                Click below to fetch your<br/>GPS coordinates instantly
              </p>
            </div>
          )}

          {/* Detect button */}
          <button
            onClick={getCurrentLocation}
            disabled={loading}
            style={{
              width:"100%", padding:"13px", borderRadius:"12px", border:"none", cursor: loading ? "not-allowed" : "pointer",
              background: loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color:"white", fontSize:"14px", fontWeight:"700", display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
              boxShadow: loading ? "none" : "0 4px 20px rgba(102,126,234,0.3)",
              transition:"all 0.3s ease", opacity: loading ? 0.6 : 1,
            }}
          >
            <FaLocationArrow /> {loading ? "Fetching GPS..." : "Auto-Detect Location"}
          </button>

          {/* Name input + save after coords detected */}
          {latitude && longitude && (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
              <input
                type="text"
                placeholder="Label this location (e.g. Home, Office)…"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{
                  width:"100%", padding:"12px 14px", borderRadius:"10px",
                  border:"1px solid rgba(96,165,250,0.15)", background:"rgba(255,255,255,0.03)",
                  color:"white", fontSize:"14px", outline:"none", boxSizing:"border-box",
                  fontFamily:"inherit", transition:"border-color 0.2s"
                }}
                onFocus={e => e.target.style.borderColor="rgba(96,165,250,0.4)"}
                onBlur={e => e.target.style.borderColor="rgba(96,165,250,0.15)"}
              />
              <button
                onClick={submitLocation}
                disabled={loading}
                style={{
                  width:"100%", padding:"13px", borderRadius:"12px", border:"none",
                  background:"linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                  color:"white", fontSize:"14px", fontWeight:"700",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
                  boxShadow:"0 4px 20px rgba(59,130,246,0.3)", cursor:"pointer", transition:"all 0.3s ease"
                }}
              >
                <FaSave /> {loading ? "Saving..." : "Save Location"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Manual Entry Tab */
        <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div>
            <label style={{ fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.8px", color:"rgba(96,165,250,0.7)", display:"block", marginBottom:"7px" }}>
              Location Name
            </label>
            <input
              type="text"
              placeholder="e.g. Bhopal, Jabalpur, MP Nagar…"
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={handleNameBlur}
              style={{
                width:"100%", padding:"12px 14px", borderRadius:"10px",
                border:"1px solid rgba(96,165,250,0.15)", background:"rgba(255,255,255,0.03)",
                color:"white", fontSize:"14px", outline:"none", boxSizing:"border-box", fontFamily:"inherit"
              }}
              onFocus={e => e.target.style.borderColor="rgba(96,165,250,0.4)"}
            />
            <p style={{ fontSize:"11px", color:"rgba(148,163,184,0.5)", marginTop:"5px", margin:"5px 0 0" }}>
              💡 Type a city or area — coordinates auto-fill on blur
            </p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"12px" }}>
            {[
              ["Latitude", latitude, setLatitude, "23.2599", "-90", "90"],
              ["Longitude", longitude, setLongitude, "77.4126", "-180", "180"]
            ].map(([label, val, setter, ph, min, max]) => (
              <div key={label}>
                <label style={{ fontSize:"10px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.8px", color:"rgba(96,165,250,0.7)", display:"block", marginBottom:"7px" }}>
                  {label} <span style={{ color:"rgba(148,163,184,0.4)", fontStyle:"italic", textTransform:"none", letterSpacing:0 }}>(optional)</span>
                </label>
                <input
                  type="number"
                  placeholder={ph}
                  value={val}
                  onChange={e => setter(e.target.value)}
                  step="0.000001" min={min} max={max}
                  style={{
                    width:"100%", padding:"12px 14px", borderRadius:"10px",
                    border: val ? "1px solid rgba(96,165,250,0.3)" : "1px solid rgba(96,165,250,0.12)",
                    background: val ? "rgba(96,165,250,0.05)" : "rgba(255,255,255,0.02)",
                    color:"white", fontSize:"13px", outline:"none", boxSizing:"border-box",
                    fontFamily:"'Courier New', monospace", transition:"all 0.2s"
                  }}
                  onFocus={e => e.target.style.borderColor="rgba(96,165,250,0.4)"}
                  onBlur={e => e.target.style.borderColor= val ? "rgba(96,165,250,0.3)" : "rgba(96,165,250,0.12)"}
                />
              </div>
            ))}
          </div>

          <button
            onClick={submitLocation}
            disabled={loading || !name.trim()}
            style={{
              width:"100%", padding:"13px", borderRadius:"12px", border:"none",
              background: name.trim() ? "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)" : "rgba(255,255,255,0.04)",
              color: name.trim() ? "white" : "rgba(255,255,255,0.3)",
              fontSize:"14px", fontWeight:"700",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"9px",
              boxShadow: name.trim() ? "0 4px 20px rgba(59,130,246,0.3)" : "none",
              cursor: name.trim() ? "pointer" : "not-allowed",
              transition:"all 0.3s ease", marginTop:"2px",
              border: name.trim() ? "none" : "1px solid rgba(255,255,255,0.06)"
            }}
          >
            <FaSave /> {loading ? "Saving..." : "Save Location"}
          </button>
        </div>
      )}

      {/* Status message */}
      {message && (
        <div style={{
          marginTop:"16px", padding:"12px 14px", borderRadius:"10px", fontSize:"13px", fontWeight:"500",
          display:"flex", alignItems:"center", gap:"8px",
          background: messageType === "success" ? "rgba(34,197,94,0.07)" : "rgba(239,68,68,0.07)",
          border: `1px solid ${messageType === "success" ? "rgba(34,197,94,0.25)" : "rgba(239,68,68,0.25)"}`,
          color: messageType === "success" ? "#4ade80" : "#f87171",
        }}>
          <span style={{ fontSize:"15px" }}>{messageType === "success" ? "✓" : "✕"}</span>
          {message}
        </div>
      )}
    </div>
  );
}

export default LocationForm;
