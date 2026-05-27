import { useEffect, useRef } from "react";

// Efekt magnesu — element przyciągany w stronę kursora gdy ten w pobliżu.
// strength: 0-1 (siła przyciągania), radius: piksele zasięgu.
// Użycie:
//   const ref = useMagneticCursor();
//   <button ref={ref}>Magnes</button>
export function useMagneticCursor({ strength = 0.35, radius = 120 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < radius) {
        const pull = (1 - dist / radius) * strength;
        targetX = dx * pull;
        targetY = dy * pull;
      } else {
        targetX = 0;
        targetY = 0;
      }
    };

    const animate = () => {
      currentX += (targetX - currentX) * 0.18;
      currentY += (targetY - currentY) * 0.18;
      el.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0)`;
      raf = requestAnimationFrame(animate);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
    };

    window.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [strength, radius]);

  return ref;
}

export default useMagneticCursor;
