import { useEffect, useRef, useState } from "react";

// IntersectionObserver — true gdy element wjedzie w viewport.
// Użycie: const [ref, visible] = useReveal({ threshold: 0.2, once: true });
// <div ref={ref} className={visible ? "opacity-100" : "opacity-0"} />
export function useReveal(options = {}) {
  const { threshold = 0.15, rootMargin = "0px 0px -10% 0px", once = true } = options;
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, visible];
}

export default useReveal;
