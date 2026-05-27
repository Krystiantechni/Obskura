import { useEffect } from "react";
import { getLenis } from "../lib/lenisRef";

// Ustawia CSS var --blood-fill na elemencie ref jako BEZWŁADNĄ ciecz o stałej objętości:
// poziom spoczynkowy = `base`, a scroll wprawia ciecz w chlupot (sprężyna-tłumik napędzany
// PRZYSPIESZENIEM scrolla). Szybki scroll → chlupie w górę i wraca do `base` (objętość stała).
// Respektuje prefers-reduced-motion.
export function useScrollBlood(ref, active, { base = 24, gain = 0.7, spring = 0.07, damp = 0.87, swing = 40 } = {}) {
  useEffect(() => {
    if (!active) return undefined;
    const el = ref.current;
    if (!el) return undefined;

    // Zakres chlupotu wokół stałego poziomu — objętość zostaje ~ta sama, tylko się przelewa.
    const MIN = Math.max(0, base - swing * 0.45);
    const MAX = Math.min(100, base + swing);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--blood-fill", `${base}%`);
      return undefined;
    }

    let lastY = window.scrollY;
    let prevV = 0;
    let level = base;
    let vel = 0;
    let raf;
    const tick = () => {
      const lenis = getLenis();
      const y = window.scrollY;
      const v = lenis && typeof lenis.velocity === "number" ? lenis.velocity : y - lastY;
      lastY = y;
      const accel = v - prevV; // przyspieszenie scrolla = bezwładność cieczy
      prevV = v;

      vel += accel * gain; // impuls od przyspieszenia
      vel += (base - level) * spring; // sprężyna do poziomu spoczynkowego (stała objętość)
      vel *= damp; // tłumienie
      level += vel;
      if (level < MIN) { level = MIN; vel *= -0.35; } // miękkie odbicie od dna
      if (level > MAX) { level = MAX; vel *= -0.35; } // i od góry

      el.style.setProperty("--blood-fill", `${level.toFixed(2)}%`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ref, active, base, gain, spring, damp]);
}

export default useScrollBlood;
