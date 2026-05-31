/* eslint-disable react-refresh/only-export-components -- plik konfiguracji routera, nie granica fast-refresh */
import { lazy } from "react";
import { createBrowserRouter, Navigate, useParams } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";

// Home eager — najczęstsze wejście, szybki pierwszy paint.
// Pozostałe trasy lazy — własny chunk ładowany na żądanie (Suspense + shimmer w Layout).
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Archive = lazy(() => import("./pages/Archive"));
const Club = lazy(() => import("./pages/Club"));
const Episode = lazy(() => import("./pages/Episode"));
const App = lazy(() => import("./pages/App"));
const Forum = lazy(() => import("./pages/Forum"));
const Careers = lazy(() => import("./pages/Careers"));
const Account = lazy(() => import("./pages/Account"));
const Mailings = lazy(() => import("./pages/Mailings"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Patrons = lazy(() => import("./pages/Patrons"));
const Player = lazy(() => import("./pages/Player"));
const Press = lazy(() => import("./pages/Press"));
const Legal = lazy(() => import("./pages/Legal"));
const Events = lazy(() => import("./pages/Events"));
const States = lazy(() => import("./pages/States"));
const Creators = lazy(() => import("./pages/Creators"));
const Support = lazy(() => import("./pages/Support"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

// Stare PL /odcinek/:id → /episode/:id z zachowaniem identyfikatora (301 client-side).
function LegacyEpisodeRedirect() {
  const { id } = useParams();
  return <Navigate to={`/episode/${id}`} replace />;
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // Trasy docelowe (EN)
      { path: "login", element: <Login /> },
      { path: "register", element: <Register /> },
      { path: "archive", element: <Archive /> },
      { path: "club", element: <Club /> },
      { path: "episode/:id", element: <Episode /> },
      { path: "app", element: <App /> },
      { path: "forum", element: <Forum /> },
      { path: "careers", element: <Careers /> },
      { path: "account", element: <Account /> },
      { path: "mailings", element: <Mailings /> },
      { path: "newsletter", element: <Newsletter /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "patrons", element: <Patrons /> },
      { path: "player", element: <Player /> },
      { path: "press", element: <Press /> },
      { path: "legal", element: <Legal /> },
      { path: "events", element: <Events /> },
      { path: "states", element: <States /> },
      { path: "creators", element: <Creators /> },
      { path: "support", element: <Support /> },

      // Redirecty 301 ze starych ścieżek PL (UX; server-level 301 w vercel.json dla SEO)
      { path: "zaloguj", element: <Navigate to="/login" replace /> },
      { path: "rejestracja", element: <Navigate to="/register" replace /> },
      { path: "archiwum", element: <Navigate to="/archive" replace /> },
      { path: "klub", element: <Navigate to="/club" replace /> },
      { path: "odcinek/:id", element: <LegacyEpisodeRedirect /> },
      { path: "aplikacja", element: <Navigate to="/app" replace /> },
      { path: "kariera", element: <Navigate to="/careers" replace /> },
      { path: "konto", element: <Navigate to="/account" replace /> },
      { path: "mailingi", element: <Navigate to="/mailings" replace /> },
      { path: "patroni", element: <Navigate to="/patrons" replace /> },
      { path: "prasa", element: <Navigate to="/press" replace /> },
      { path: "prawne", element: <Navigate to="/legal" replace /> },
      { path: "spotkania", element: <Navigate to="/events" replace /> },
      { path: "stany", element: <Navigate to="/states" replace /> },
      { path: "tworcy", element: <Navigate to="/creators" replace /> },
      { path: "wsparcie", element: <Navigate to="/support" replace /> },

      { path: "*", element: <ComingSoon title="404" /> },
    ],
  },
]);
