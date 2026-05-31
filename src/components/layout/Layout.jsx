import { Suspense, useEffect, useState } from "react";
import { Outlet, useOutlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import Nav from "./Nav";
import Footer from "./Footer";
import ScrollProgressBar from "../ui/ScrollProgressBar";
import MiniPlayer from "../ui/MiniPlayer";
import PageFallback from "../ui/PageFallback";
import CookieConsent from "../ui/CookieConsent";
import ErrorBoundary from "../ui/ErrorBoundary";
import { applySeo } from "../../seo";
import { usePlayer } from "../../context/PlayerContext";
import { initAnalytics } from "../../lib/analytics";

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
// Spacer pod Footerem gdy player aktywny — żeby fixed MiniPlayer nie zasłaniał stopki.
export default function Layout() {
  const { pathname } = useLocation();
  const reduce = useReducedMotion();
  const { current } = usePlayer();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    window.scrollTo(0, 0);
    applySeo(pathname, t);
    // Reaktywne na zmianę języka: re-apply meta po zmianie i18n.language.
  }, [pathname, t, i18n.language]);

  // Plausible: cookieless analytics, ładowane tylko po zgodzie "analytics".
  // initAnalytics sam pilnuje idempotencji i nasłuchu na event "obskura:consent".
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <>
      {/* Skip-link a11y — Tab z górki strony przeskakuje całe nav prosto do main. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[1000] focus:bg-red focus:px-4 focus:py-2 focus:font-mono focus:text-[11px] focus:font-bold focus:uppercase focus:tracking-ui focus:text-black focus:shadow-[0_0_24px_rgba(255,42,42,0.45)]"
      >
        Przejdź do treści
      </a>
      <ScrollProgressBar />
      <Nav />
      <main id="main" className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            variants={reduce ? undefined : pageVariants}
            initial={reduce ? false : "initial"}
            animate={reduce ? undefined : "enter"}
            exit={reduce ? undefined : "exit"}
            style={{ willChange: reduce ? undefined : "opacity, transform, filter" }}
          >
            <ErrorBoundary>
              <Suspense fallback={<PageFallback />}>
                <FrozenOutlet />
              </Suspense>
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      {current && <div aria-hidden className="h-[78px] lg:h-[88px]" />}
      <MiniPlayer />
      <CookieConsent />
    </>
  );
}
