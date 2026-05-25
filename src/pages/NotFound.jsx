import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="not-found">
      <h1 className="animate-fade-in-up">404</h1>
      <h2 className="animate-fade-in-up delay-1">Page Not Found</h2>
      <p className="animate-fade-in-up delay-2">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary animate-fade-in-up delay-3">
        ← Back to Home
      </Link>
    </div>
  );
}

export default NotFound;
