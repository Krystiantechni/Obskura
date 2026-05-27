import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { setLenis } from "../lib/lenisRef";

// Smooth-scroll global (Lenis). Dodaj raz na poziomie App.
// lerp: factor 0.05-0.15 — im wyżej tym bardziej responsywne, im niżej tym gładsze.
// 0.08 = ~92% do targetu per frame ≈ 180-220ms dotarcia, bez "exp ogona" który
// powoduje że szybkie zmiany kierunku scrolla wyglądają jak skok.
export function useLenisScroll({ lerp = 0.08 } = {}) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp,
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.5,
      syncTouch: true,
    });
    setLenis(lenis);

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      setLenis(null);
    };
  }, [lerp]);
}

export default useLenisScroll;
