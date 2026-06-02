import PropTypes from "prop-types";
import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { status } = useAuth();
  const location = useLocation();
  // Łapiemy lokalizację wejścia RAZ (leniwy init) — stała wartość sprawia, że
  // <Navigate> ma niezmienne propsy i nie pętli się podczas tranzycji redirectu
  // (gdy location zmienia się na /login w trakcie nawigacji). returnTo niesiemy w `state`.
  const [from] = useState(() => location.pathname + location.search);

  if (status === "loading") {
    // Placeholder na czas hydratacji sesji — nie migamy redirectem do /login.
    return <div className="min-h-screen bg-bg-0" aria-busy="true" />;
  }

  if (status === "guest") {
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // Jawnie tylko dla "authed" — żaden inny/nieznany status nie przepuści treści chronionej.
  if (status === "authed") {
    return children;
  }

  return null;
}

RequireAuth.propTypes = { children: PropTypes.node };
