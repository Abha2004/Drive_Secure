import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <Link to="/" className="nav-logo">
        <span className="accent">D</span>rive
        <span className="accent">S</span>ecure
      </Link>

      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <Link to="/" className="nav-item">Home</Link>
        <a href={location.pathname === "/" ? "#about" : "/#about"} className="nav-item">About</a>
        <a href={location.pathname === "/" ? "#features" : "/#features"} className="nav-item">Features</a>
        <Link to="/login" className="nav-cta">Get Started</Link>
      </div>

      <div
        className={`nav-hamburger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span />
        <span />
        <span />
      </div>
    </nav>
  );
}

export default Navbar;
