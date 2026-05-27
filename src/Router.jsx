import { createBrowserRouter } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Archive from "./pages/Archive";
import Club from "./pages/Club";
import Episode from "./pages/Episode";
import Aplikacja from "./pages/Aplikacja";
import Forum from "./pages/Forum";
import Kariera from "./pages/Kariera";
import Konto from "./pages/Konto";
import Mailingi from "./pages/Mailingi";
import Newsletter from "./pages/Newsletter";
import Onboarding from "./pages/Onboarding";
import Patroni from "./pages/Patroni";
import Player from "./pages/Player";
import Prasa from "./pages/Prasa";
import Prawne from "./pages/Prawne";
import Spotkania from "./pages/Spotkania";
import Stany from "./pages/Stany";
import Tworcy from "./pages/Tworcy";
import Wsparcie from "./pages/Wsparcie";
import ComingSoon from "./pages/ComingSoon";

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
