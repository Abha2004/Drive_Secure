import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div className="footer-brand">
          <h3>
            <span style={{ color: "var(--blue-500)" }}>D</span>rive
            <span style={{ color: "var(--blue-500)" }}>S</span>ecure
          </h3>
          <p>
            AI-powered smart road safety platform designed to reduce
            accidents and improve transportation safety through intelligent
            monitoring and prediction.
          </p>
        </div>

        <div className="footer-col">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/login">Dashboard</Link>
          <a href="#features">Features</a>
          <Link to="/about">About</Link>
        </div>

        <div className="footer-col">
          <h4>Resources</h4>
          <a href="#" onClick={(e) => e.preventDefault()}>Documentation</a>
          <a href="#" onClick={(e) => e.preventDefault()}>API Reference</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Safety Reports</a>
        </div>

        <div className="footer-col">
          <h4>Contact</h4>
          <a href="mailto:support@drivesecure.com">support@drivesecure.com</a>
          <a href="#" onClick={(e) => e.preventDefault()}>Twitter</a>
          <a href="#" onClick={(e) => e.preventDefault()}>LinkedIn</a>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} DriveSecure. All rights reserved.
        Built with ❤️ for safer roads.
      </div>
    </footer>
  );
}

export default Footer;
