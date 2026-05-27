/* eslint-disable react-refresh/only-export-components -- plik konfiguracji routera, nie granica fast-refresh */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";

// Home eager — najczęstsze wejście, szybki pierwszy paint.
// Pozostałe trasy lazy — własny chunk ładowany na żądanie (Suspense + shimmer w Layout).
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Archive = lazy(() => import("./pages/Archive"));
const Club = lazy(() => import("./pages/Club"));
const Episode = lazy(() => import("./pages/Episode"));
const Aplikacja = lazy(() => import("./pages/Aplikacja"));
const Forum = lazy(() => import("./pages/Forum"));
const Kariera = lazy(() => import("./pages/Kariera"));
const Konto = lazy(() => import("./pages/Konto"));
const Mailingi = lazy(() => import("./pages/Mailingi"));
const Newsletter = lazy(() => import("./pages/Newsletter"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Patroni = lazy(() => import("./pages/Patroni"));
const Player = lazy(() => import("./pages/Player"));
const Prasa = lazy(() => import("./pages/Prasa"));
const Prawne = lazy(() => import("./pages/Prawne"));
const Spotkania = lazy(() => import("./pages/Spotkania"));
const Stany = lazy(() => import("./pages/Stany"));
const Tworcy = lazy(() => import("./pages/Tworcy"));
const Wsparcie = lazy(() => import("./pages/Wsparcie"));
const ComingSoon = lazy(() => import("./pages/ComingSoon"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      { path: "zaloguj", element: <Login /> },
      { path: "rejestracja", element: <Register /> },
      { path: "archiwum", element: <Archive /> },
      { path: "klub", element: <Club /> },
      { path: "odcinek/:id", element: <Episode /> },

      { path: "aplikacja", element: <Aplikacja /> },
      { path: "forum", element: <Forum /> },
      { path: "kariera", element: <Kariera /> },
      { path: "konto", element: <Konto /> },
      { path: "mailingi", element: <Mailingi /> },
      { path: "newsletter", element: <Newsletter /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "patroni", element: <Patroni /> },
      { path: "player", element: <Player /> },
      { path: "prasa", element: <Prasa /> },
      { path: "prawne", element: <Prawne /> },
      { path: "spotkania", element: <Spotkania /> },
      { path: "stany", element: <Stany /> },
      { path: "tworcy", element: <Tworcy /> },
      { path: "wsparcie", element: <Wsparcie /> },

      { path: "*", element: <ComingSoon title="404" /> },
    ],
  },
]);
