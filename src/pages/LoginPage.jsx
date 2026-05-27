import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import bg from "../assets/bg_road.jpeg";
import { API_BASE_URL } from "../config/env";

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [remember, setRemember] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) { setError("Please enter your email address."); return; }
    if (!password.trim()) { setError("Please enter your password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      localStorage.setItem("ds_token", data.token);
      localStorage.setItem("ds_user", JSON.stringify({ name: data.name, email: data.email, _id: data._id }));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ backgroundImage: `url(${bg})` }}>
      <div className="auth-overlay" />
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card">
          <div className="auth-logo">
            <span style={{ color: "var(--blue-500)" }}>D</span>rive
            <span style={{ color: "var(--blue-500)" }}>S</span>ecure
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account to continue</p>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <form onSubmit={handleLogin}>
            <div className="auth-input-group">
              <label htmlFor="email">Email</label>
              <input id="email" type="email" className="auth-input" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="auth-input-group">
              <label htmlFor="password">Password</label>
              <input id="password" type={showPassword ? "text" : "password"} className="auth-input" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>
            <div className="auth-options">
              <label>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>Forgot Password?</a>
            </div>
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>
          <p className="auth-footer">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;