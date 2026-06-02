import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";

export default function App() {
  useLenisScroll();
  // AuthProvider + PlayerProvider ponad routerem:
  // sesja i jeden <audio> przeżywają zmianę tras.
  return (
    <AuthProvider>
      <PlayerProvider>
        <RouterProvider router={router} />
      </PlayerProvider>
    </AuthProvider>
  );
}
