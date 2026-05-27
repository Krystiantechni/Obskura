import { useEffect, useRef } from "react";

// Spotlight follow-mouse na konkretnym elemencie (nie globalny).
// Dodaje do elementu CSS variables --mx i --my, użyteczne np. do hover glow.
// Użycie:
//   const ref = useMouseSpotlight();
//   <div ref={ref} className="relative" style={{background: 'radial-gradient(400px at var(--mx) var(--my), rgba(0,217,255,0.15), transparent)'}}>
export function useMouseSpotlight() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - rect.left}px`);
      el.style.setProperty("--my", `${e.clientY - rect.top}px`);
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  return ref;
}

export default useMouseSpotlight;
