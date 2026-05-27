import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getConsent, setConsent } from "../../lib/consent";

// Baner zgody na cookies — dark cinematic. Niezbędne zawsze on, analityka opcjonalna.
export default function CookieConsent() {
  const [open, setOpen] = useState(() => !getConsent());
  const [details, setDetails] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const decide = (analyticsChoice) => {
    setConsent({ analytics: analyticsChoice });
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 left-4 right-4 z-[95] mx-auto max-w-md border border-white/10 bg-[rgba(10,13,18,0.97)] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:left-6 sm:right-auto"
          role="dialog"
          aria-label="Zgoda na pliki cookies"
          aria-live="polite"
        >
          <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />

          <div className="mb-3 flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-mono text-red">
            <span className="h-1.5 w-1.5 animate-obskura-pulse rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
            Cookies
          </div>

          <p className="mb-4 text-[13px] font-light leading-relaxed text-ink-1">
            Używamy danych niezbędnych do działania serwisu (język, ulubione, postęp odsłuchu).
            Za Twoją zgodą włączymy też anonimową analitykę, żeby ulepszać OBSKURĘ. Szczegóły w{" "}
            <Link to="/prawne" className="text-ink-0 underline decoration-red/50 underline-offset-2 transition-colors hover:decoration-red">
              informacjach prawnych
            </Link>
            .
          </p>

          <AnimatePresence initial={false}>
            {details && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="mb-4 space-y-2.5 border-y border-white/8 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-medium text-ink-0">Niezbędne</div>
                      <div className="text-[11px] text-ink-2">Język, ulubione, stan odtwarzacza.</div>
                    </div>
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] uppercase tracking-mono text-ink-3">Zawsze</span>
                  </div>
                  <label className="flex cursor-pointer items-start justify-between gap-3">
                    <div>
                      <div className="text-[12px] font-medium text-ink-0">Analityka</div>
                      <div className="text-[11px] text-ink-2">Anonimowe statystyki użycia.</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-red"
                    />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex flex-wrap items-center gap-2.5">
            {details ? (
              <button
                type="button"
                onClick={() => decide(analytics)}
                className="flex-1 bg-red px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-ui text-white transition-shadow hover:shadow-[0_0_24px_rgba(255,42,42,0.45)]"
              >
                Zapisz wybór
              </button>
            ) : (
              <button
                type="button"
                onClick={() => decide(true)}
                className="flex-1 bg-red px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-ui text-white transition-shadow hover:shadow-[0_0_24px_rgba(255,42,42,0.45)]"
              >
                Akceptuję wszystkie
              </button>
            )}
            <button
              type="button"
              onClick={() => decide(false)}
              className="border border-white/15 px-4 py-2.5 font-mono text-[11px] uppercase tracking-ui text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0"
            >
              Tylko niezbędne
            </button>
            {!details && (
              <button
                type="button"
                onClick={() => setDetails(true)}
                className="px-2 py-2.5 font-mono text-[11px] uppercase tracking-ui text-ink-2 transition-colors hover:text-ink-0"
              >
                Ustawienia
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
