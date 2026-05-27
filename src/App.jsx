import { RouterProvider } from "react-router-dom";
import { router } from "./Router";
import { useLenisScroll } from "./hooks/useLenisScroll";

export default function App() {
  useLenisScroll();
  return <RouterProvider router={router} />;
}
