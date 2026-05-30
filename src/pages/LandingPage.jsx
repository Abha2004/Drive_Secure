import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import bg from "../assets/bg_road.jpeg";

const features = [
  {
    icon: "🗺️",
    title: "Live Traffic Monitoring",
    text: "Monitor traffic congestion and identify risky road zones instantly using real-time analytics and AI-powered sensors.",
  },
  {
    icon: "🚨",
    title: "Emergency Alerts",
    text: "Receive AI-generated accident and danger notifications for improved safety awareness and faster response times.",
  },
  {
    icon: "🤖",
    title: "AI Risk Prediction",
    text: "Predict accident-prone routes using weather conditions, historical data, and intelligent traffic analysis.",
  },
  {
    icon: "📍",
    title: "Smart Route Analysis",
    text: "Get optimized and safer route recommendations based on real-time traffic and road conditions.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    text: "Visualize traffic trends, alerts, road conditions, and accident statistics with professional dashboards.",
  },
  {
    icon: "☁️",
    title: "Weather-Based Alerts",
    text: "Analyze weather conditions to detect possible driving risks before accidents occur on the road.",
  },
];

const stats = [
  { number: "50K+", label: "Active Users" },
  { number: "98%", label: "Accuracy Rate" },
  { number: "1.2M", label: "Routes Analyzed" },
  { number: "24/7", label: "Live Monitoring" },
];

function LandingPage() {
  return (
    <div>
      <Navbar />

      {/* HERO */}
      <section
        className="hero"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge animate-fade-in-up">
            <span /> AI-Powered Road Safety
          </div>

          <h1 className="hero-title animate-fade-in-up delay-1">
            DriveSecure
          </h1>

          <h2 className="hero-subtitle animate-fade-in-up delay-2">
            Smart Accident Prediction Using AI
          </h2>

          <p className="hero-desc animate-fade-in-up delay-3">
            AI-powered system that analyzes traffic patterns, predicts
            accident-prone zones, and helps improve road safety in real-time
            using cutting-edge machine learning technology.
          </p>

          <div className="hero-buttons animate-fade-in-up delay-4">
            <Link to="/login" className="btn-primary">
              Get Started →
            </Link>
            <Link to="/about" className="btn-secondary">
              Learn More
            </Link>
          </div>

          <div className="hero-features animate-fade-in-up delay-5">
            <div className="hero-feature-card">
              <h3>🛡️ Smart Prediction</h3>
              <p>AI detects accident-prone zones using traffic and road pattern analysis.</p>
            </div>
            <div className="hero-feature-card">
              <h3>📡 Live Monitoring</h3>
              <p>Real-time traffic analytics help monitor congestion and risky areas.</p>
            </div>
            <div className="hero-feature-card">
              <h3>🚨 Emergency Alerts</h3>
              <p>Instant notifications during accidents improve emergency response speed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="section section-dark">
        <div className="section-glow top-right" />
        <div className="stats-row">
          {stats.map((s, i) => (
            <div key={i} className="stat-item animate-fade-in-up" style={{ animationDelay: `${i * 0.15}s` }}>
              <div className="stat-number">{s.number}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="section section-dark about-section">
        <div className="section-glow bottom-left" />
        <div className="section-label">AI Powered Road Safety Platform</div>
        <h2 className="section-title">About DriveSecure</h2>
        <div className="section-divider" />
        <p className="section-desc">
          DriveSecure is an advanced AI-powered smart road safety platform
          designed to improve transportation safety through intelligent
          traffic monitoring, accident prediction, emergency alert systems,
          and smart route analysis. The system continuously analyzes traffic
          congestion, weather conditions, accident-prone zones, and road
          safety data in real time to help users make safer travel decisions.
        </p>
      </section>

      {/* FEATURES */}
      <section id="features" className="section section-dark">
        <div className="section-glow top-right" />
        <h2 className="section-title">Core Features</h2>
        <div className="section-divider" />
        <div className="features-grid">
          {features.map((item, i) => (
            <div
              key={i}
              className="feature-card animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="feature-icon">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section section-dark" style={{ textAlign: "center" }}>
        <h2 className="section-title">Ready to Drive Safer?</h2>
        <p className="section-desc" style={{ marginBottom: "32px" }}>
          Join thousands of users who trust DriveSecure for safer journeys
          every day.
        </p>
        <Link to="/login" className="btn-primary">
          Start Free Trial →
        </Link>
      </section>

      <Footer />
    </div>
  );
}

export default LandingPage;