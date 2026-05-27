import { useEffect, useRef } from "react";

// 3D tilt na hover (efekt karty unoszącej się). Działa lepiej z `transform-gpu` na elemencie.
// max: maksymalny obrót w stopniach, perspective: głębia, scale: zoom na hover.
export function useTilt3D({ max = 12, perspective = 1000, scale = 1.03 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    let raf = 0;
    let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
    let hovered = false;

    const onMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      targetRX = (0.5 - y) * max * 2;
      targetRY = (x - 0.5) * max * 2;
    };

    const animate = () => {
      currentRX += (targetRX - currentRX) * 0.12;
      currentRY += (targetRY - currentRY) * 0.12;
      el.style.transform = hovered
        ? `perspective(${perspective}px) rotateX(${currentRX.toFixed(2)}deg) rotateY(${currentRY.toFixed(2)}deg) scale(${scale})`
        : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale(1)`;
      raf = requestAnimationFrame(animate);
    };

    const onEnter = () => { hovered = true; };
    const onLeave = () => {
      hovered = false;
      targetRX = 0;
      targetRY = 0;
    };

    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";
    raf = requestAnimationFrame(animate);

    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, [max, perspective, scale]);

  return ref;
}

export default useTilt3D;
