import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import bg from "../assets/bg_road.jpeg";

function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    navigate("/dashboard");
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

          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Join DriveSecure for safer journeys</p>

          {error && <div className="auth-error">⚠️ {error}</div>}

          <form onSubmit={handleSignup}>
            <div className="auth-input-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                className="auth-input"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-email">Email</label>
              <input
                id="signup-email"
                type="email"
                className="auth-input"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="auth-input-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                className="auth-input"
                placeholder="Create a password (min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </div>
            </div>

            <button type="submit" className="auth-btn" style={{ marginTop: "8px" }}>
              Create Account
            </button>
          </form>

          <p className="auth-footer">
            Already have an account?{" "}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
