import { useEffect } from "react";
import { getLenis } from "../lib/lenisRef";

// Ustawia CSS var --blood-fill (poziom krwi 0–100%) na elemencie ref, sterowany
// prędkością scrolla: szybki scroll w dół wbija krew w górę (peak-hold),
// grawitacja ściąga ją z powrotem do `base`. Respektuje prefers-reduced-motion.
export function useScrollBlood(ref, active, { base = 14, gain = 2.4 } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    const MAX = 100;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--blood-fill", `${base}%`);
      return undefined;
    }

    let lastY = window.scrollY;
    let target = base;
    let level = base;
    let raf;
    const tick = () => {
      const lenis = getLenis();
      const y = window.scrollY;
      const d = lenis && typeof lenis.velocity === "number" ? lenis.velocity : y - lastY;
      lastY = y;
      if (d > 0.5) target = Math.max(target, Math.min(MAX, base + d * gain));
      target += (base - target) * 0.045; // grawitacja
      level += (target - level) * 0.2; // wygładzenie
      el.style.setProperty("--blood-fill", `${level.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, active, base, gain]);
}

export default useScrollBlood;
