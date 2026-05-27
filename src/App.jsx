import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { PlayerProvider } from "./context/PlayerContext";

export default function App() {
  useLenisScroll();
  // PlayerProvider ponad routerem — jeden <audio> gra nieprzerwanie przy zmianie tras.
  return (
    <PlayerProvider>
      <RouterProvider router={router} />
    </PlayerProvider>
  );
}
