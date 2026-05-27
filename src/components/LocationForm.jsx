import { useState } from "react";
import { FaMapMarkerAlt, FaLocationArrow, FaSave } from "react-icons/fa";
import { API_BASE_URL } from "../config/env";

function LocationForm({ onLocationTracked }) {
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'

  // Get current location using geolocation API
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
          if (typeof onLocationTracked === 'function') onLocationTracked(fixedLat, fixedLng);
          setMessage("📍 Location fetched successfully!");
          setMessageType("success");
          setLoading(false);
        },
        (error) => {
          console.error(error);
          setMessage("❌ Unable to fetch location. Please enable location access.");
          setMessageType("error");
          setLoading(false);
        }
      );
    } else {
      setMessage("❌ Geolocation is not supported by your browser.");
      setMessageType("error");
      setLoading(false);
    }
  };

  // Submit location to backend
  const submitLocation = async () => {
    if (!name.trim()) {
      setMessage("⚠️ Please enter a location name (e.g., Home, Office).");
      setMessageType("error");
      return;
    }

    if (!latitude || !longitude) {
      setMessage("⚠️ Please enter both latitude and longitude.");
      setMessageType("error");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("ds_token");
      const res = await fetch(`${API_BASE_URL}/location/update`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      if (!res.ok) throw new Error("Failed to save location");

      const data = await res.json();
      setMessage(`✅ Location "${name}" saved successfully!`);
      setMessageType("success");
      if (typeof onLocationTracked === 'function') onLocationTracked(parseFloat(latitude), parseFloat(longitude));
      
      // Clear inputs after success
      setTimeout(() => {
        setName("");
        setLatitude("");
        setLongitude("");
        setMessage("");
      }, 2000);
    } catch (error) {
      console.error(error);
      setMessage("❌ Failed to save location. Please try again.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel-card location-form" style={{ maxWidth: "500px" }}>
      <h3 style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
        <FaMapMarkerAlt /> Add Your Location
      </h3>

      <input
        type="text"
        placeholder="Location name (e.g., Home, Office, School)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="auth-input"
        style={{ marginBottom: "16px" }}
      />

      <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
        <input
          type="number"
          placeholder="Latitude"
          value={latitude}
          onChange={(e) => setLatitude(e.target.value)}
          className="auth-input"
          step="0.000001"
          min="-90"
          max="90"
          style={{ flex: 1 }}
        />
        <input
          type="number"
          placeholder="Longitude"
          value={longitude}
          onChange={(e) => setLongitude(e.target.value)}
          className="auth-input"
          step="0.000001"
          min="-180"
          max="180"
          style={{ flex: 1 }}
        />
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
        <button
          className="route-calc-btn"
          onClick={getCurrentLocation}
          disabled={loading}
          style={{ flex: 1, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
        >
          <FaLocationArrow /> {loading ? "Fetching..." : "Current Location"}
        </button>
        <button
          className="route-calc-btn"
          onClick={submitLocation}
          disabled={loading || !name.trim() || !latitude || !longitude}
          style={{ flex: 1 }}
        >
          <FaSave /> {loading ? "Saving..." : "Save Location"}
        </button>
      </div>

      {message && (
        <div
          style={{
            padding: "12px",
            borderRadius: "8px",
            fontSize: "14px",
            backgroundColor: messageType === "success" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
            color: messageType === "success" ? "#22c55e" : "#ef4444",
            border: `1px solid ${messageType === "success" ? "#22c55e" : "#ef4444"}`,
          }}
        >
          {message}
        </div>
      )}

      <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
        💡 Tip: Give your location a name (Home, Office, etc.), click "Current Location" to auto-detect, or enter coordinates manually.
      </p>
    </div>
  );
}

export default LocationForm;
