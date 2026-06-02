import { RouterProvider } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";
import { PlayerProvider } from "./context/PlayerContext";
import { AuthProvider } from "./context/AuthContext";
import { queryClient } from "./lib/queryClient";

export default function App() {
  useLenisScroll();
  // QueryClient najwyżej (katalog), potem Auth (sesja) i Player (jeden <audio>) — wszystkie ponad routerem.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PlayerProvider>
          <RouterProvider router={router} />
        </PlayerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
