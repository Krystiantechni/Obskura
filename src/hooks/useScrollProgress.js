import { useEffect, useState } from "react";

// Procent przewinięcia całej strony (0-1).
// rAF zamiast scroll event — działa z Lenis (smooth scroll), 60fps. Clamp do [0,1] żeby
// pasek dociągnął do końca nawet gdy Lenis kończy z mikro-opóźnieniem.
export function useScrollProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId;
    let last = -1;
    const update = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, h.scrollTop / total)) : 0;
      if (Math.abs(p - last) > 0.001) {
        last = p;
        setProgress(p);
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return progress;
}

export default useScrollProgress;
