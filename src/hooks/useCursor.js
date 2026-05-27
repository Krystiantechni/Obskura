import { useEffect, useState } from "react";

// Aktualizuje CSS variables --cursor-x i --cursor-y na :root.
// Pozwala stosować spotlight effect: background: radial-gradient(... at var(--cursor-x) var(--cursor-y) ...)
// Dodatkowo zwraca {x, y} dla logiki w React.
export function useCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      document.documentElement.style.setProperty("--cursor-x", `${e.clientX}px`);
      document.documentElement.style.setProperty("--cursor-y", `${e.clientY}px`);
      setPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return pos;
}

export default useCursor;
