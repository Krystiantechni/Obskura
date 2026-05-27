import { useEffect, useState } from "react";
import { Outlet, useOutlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Nav from "./Nav";
import Footer from "./Footer";
import ScrollProgressBar from "../ui/ScrollProgressBar";
import MiniPlayer from "../ui/MiniPlayer";

// Zamraża bieżący outlet w momencie montażu, żeby podczas exit-animacji
// stara trasa nie podmieniła się na nową (wymóg data routera dla AnimatePresence).
function FrozenOutlet() {
  const outlet = useOutlet();
  const [frozen] = useState(outlet);
  return frozen ?? <Outlet />;
}

const pageVariants = {
  initial: { opacity: 0, y: 22, filter: "blur(6px)" },
  enter: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    y: -14,
    filter: "blur(5px)",
    transition: { duration: 0.32, ease: [0.7, 0, 0.84, 0] },
  },
};

// Wspólny shell: scroll progress + fixed nav + treść strony + footer.
// Cinematic przejścia między trasami (AnimatePresence) + scroll-to-top.
export default function Layout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <ScrollProgressBar />
      <Nav />
      <main className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            variants={reduce ? undefined : pageVariants}
            initial={reduce ? false : "initial"}
            animate={reduce ? undefined : "enter"}
            exit={reduce ? undefined : "exit"}
            style={{ willChange: reduce ? undefined : "opacity, transform, filter" }}
          >
            <FrozenOutlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <MiniPlayer />
    </>
  );
}
