import { useEffect, useState } from "react";

// Parallax — wartość przesunięcia Y w zależności od scrolla.
// speed: 0.2 = wolniej, 1 = z prędkością scrolla, -0.5 = w przeciwnym kierunku.
export function useParallax(speed = 0.3) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffset(window.scrollY * speed);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [speed]);

  return offset;
}

export default useParallax;
