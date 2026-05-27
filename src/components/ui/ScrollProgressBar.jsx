import { motion, useScroll, useSpring } from "framer-motion";

// Pasek postępu scrolla na samej górze strony.
// useScroll() śledzi natywny scroll co frame (zgodne z Lenis), useSpring wygładza,
// scaleX (GPU transform) — płynne 60fps bez React re-renderów.
export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 32,
    restDelta: 0.001,
  });

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[120] h-[2px] bg-white/5">
      <motion.div
        className="h-full origin-left bg-gradient-to-r from-blue via-red to-red-dim shadow-[0_0_8px_rgba(255,42,42,0.6)]"
        style={{ scaleX }}
      />
    </div>
  );
}
