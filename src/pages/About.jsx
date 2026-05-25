import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const features = [
  {
    icon: "🗺️",
    title: "Live Traffic Monitoring",
    text: "Monitor real-time traffic congestion and identify risky road zones instantly using AI analytics.",
  },
  {
    icon: "🚨",
    title: "Emergency Alerts",
    text: "Receive AI-generated accident and danger notifications in real time for faster response.",
  },
  {
    icon: "🤖",
    title: "AI Risk Prediction",
    text: "Predict accident-prone areas using intelligent traffic analytics and historical data.",
  },
  {
    icon: "📍",
    title: "Smart Route Analysis",
    text: "Get optimized and safer travel route recommendations instantly based on live data.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    text: "Visualize traffic trends, alerts, and accident statistics with professional dashboards.",
  },
  {
    icon: "☁️",
    title: "Weather-Based Alerts",
    text: "Analyze weather conditions to detect possible driving risks before they cause accidents.",
  },
];

const techStack = [
  { name: "React.js", desc: "Modern UI Framework" },
  { name: "Vite", desc: "Lightning-Fast Build Tool" },
  { name: "Leaflet Maps", desc: "Interactive Map Integration" },
  { name: "AI/ML Models", desc: "Predictive Analytics Engine" },
  { name: "Real-time API", desc: "Live Data Processing" },
  { name: "Tailwind CSS", desc: "Utility-First Styling" },
];

function About() {
  return (
    <div>
      <Navbar />

      {/* HERO INTRO */}
      <section className="section section-dark" style={{ paddingTop: "140px" }}>
        <div className="section-glow top-right" />

        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="section-label animate-fade-in-up">About Us</div>

          <h1
            className="section-title animate-fade-in-up delay-1"
            style={{ fontSize: "clamp(40px, 6vw, 72px)", letterSpacing: "-2px" }}
          >
            About DriveSecure
          </h1>

          <div className="section-divider animate-fade-in-up delay-2" />

          <p className="section-desc animate-fade-in-up delay-3">
            DriveSecure is an advanced AI-powered smart road safety platform
            designed to improve transportation safety through intelligent
            traffic monitoring, accident prediction, emergency alert systems,
            and smart route analysis. The platform analyzes traffic conditions,
            weather patterns, accident-prone zones, and road safety data in
            real time to help users make safer travel decisions. DriveSecure
            aims to reduce road accidents, enhance emergency response
            efficiency, and create a smarter and more secure driving
            experience using modern AI-driven technology.
          </p>
        </div>
      </section>

      {/* FEATURES */}
      <section className="section section-dark">
        <div className="section-glow bottom-left" />
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

      {/* TECH STACK */}
      <section className="section section-dark" style={{ textAlign: "center" }}>
        <h2 className="section-title">Technologies Used</h2>
        <div className="section-divider" />

        <div className="features-grid" style={{ maxWidth: "900px", margin: "0 auto" }}>
          {techStack.map((tech, i) => (
            <div
              key={i}
              className="feature-card animate-fade-in-up"
              style={{
                animationDelay: `${i * 0.1}s`,
                textAlign: "center",
                padding: "28px",
              }}
            >
              <h3 style={{ fontSize: "18px", color: "var(--blue-400)" }}>
                {tech.name}
              </h3>
              <p style={{ marginTop: "8px" }}>{tech.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CONTACT */}
      <section className="section section-dark" style={{ textAlign: "center" }}>
        <h2 className="section-title">Get In Touch</h2>
        <div className="section-divider" />
        <p className="section-desc">
          Have questions or want to partner with us? Reach out to our team.
        </p>
        <a
          href="mailto:support@drivesecure.com"
          className="btn-primary"
          style={{ display: "inline-flex" }}
        >
          Contact Us →
        </a>
      </section>

      <Footer />
    </div>
  );
}

export default About;