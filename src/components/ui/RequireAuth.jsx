import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    // Placeholder na czas hydratacji sesji — nie migamy redirectem do /login.
    return <div className="min-h-screen bg-bg-0" aria-busy="true" />;
  }

  if (status === "guest") {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  return children;
}

RequireAuth.propTypes = { children: PropTypes.node };
