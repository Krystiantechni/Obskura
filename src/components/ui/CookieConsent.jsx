import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { getConsent, setConsent } from "../../lib/consent";

// Ikonki kategorii
const Shield = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>);
const Sliders = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>);
const Chart = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 19V5M4 19h16M8 16l4-5 3 3 4-6"/></svg>);
const Megaphone = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10v4h3l9 5V5L7 10H4zM18 9a3 3 0 0 1 0 6"/></svg>);
const Cookie = ({ size = 18 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3a9 9 0 1 0 9 9 3.5 3.5 0 0 1-4-4 3.5 3.5 0 0 1-5-5z"/><circle cx="9" cy="11" r="1" fill="currentColor"/><circle cx="14" cy="14" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/></svg>);
Cookie.propTypes = { size: PropTypes.number };

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-red" : "bg-white/15"}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
    </button>
  );
}
Toggle.propTypes = { checked: PropTypes.bool.isRequired, onChange: PropTypes.func.isRequired, label: PropTypes.string.isRequired };

function Category({ icon, title, desc, always, checked, onChange }) {
  return (
    <div className="border border-white/8 bg-white/[0.02] p-4">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-ink-0">
          <span className="text-red">{icon}</span>
          <span className="text-[13px] font-medium">{title}</span>
        </div>
        {always ? (
          <span className="shrink-0 border border-white/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">Zawsze aktywne</span>
        ) : (
          <Toggle checked={checked} onChange={onChange} label={title} />
        )}
      </div>
      <p className="text-[11.5px] font-light leading-relaxed text-ink-2">{desc}</p>
    </div>
  );
}
Category.propTypes = {
  icon: PropTypes.node.isRequired, title: PropTypes.string.isRequired, desc: PropTypes.string.isRequired,
  always: PropTypes.bool, checked: PropTypes.bool, onChange: PropTypes.func,
};

const DESC =
  "Korzystamy z plików cookie i podobnych technologii. Niezbędne są wymagane do działania serwisu. Pozostałe (dopasowanie, analityka, marketing) uruchamiamy wyłącznie po Twojej dobrowolnej zgodzie. Zgodę zmienisz w każdej chwili ikoną ciasteczka w rogu strony.";

// Baner zgody na cookies — schemat: collapsed → szczegóły (4 kategorie) → reopen ikoną.
export default function CookieConsent() {
  const saved = getConsent();
  const [view, setView] = useState(saved ? "hidden" : "banner"); // "banner" | "details" | "hidden"
  const [prefs, setPrefs] = useState(saved?.preferences ?? true);
  const [analytics, setAnalytics] = useState(saved?.analytics ?? false);
  const [marketing, setMarketing] = useState(saved?.marketing ?? false);

  const close = (choice) => {
    setConsent(choice);
    setView("hidden");
  };
  const acceptAll = () => { setPrefs(true); setAnalytics(true); setMarketing(true); close({ preferences: true, analytics: true, marketing: true }); };
  const rejectAll = () => { setPrefs(false); setAnalytics(false); setMarketing(false); close({ preferences: false, analytics: false, marketing: false }); };
  const savePrefs = () => close({ preferences: prefs, analytics, marketing });
  const reopen = () => {
    const c = getConsent();
    setPrefs(c?.preferences ?? true); setAnalytics(c?.analytics ?? false); setMarketing(c?.marketing ?? false);
    setView("details");
  };

  return (
    <>
      {/* Pływająca ikona — wycofaj/zmień zgodę (prawy dół, obok panelu A/B) */}
      {view === "hidden" && (
        <button
          type="button"
          onClick={reopen}
          aria-label="Ustawienia plików cookie"
          className="cookie-fab fixed bottom-6 right-6 z-[85] grid h-[58px] w-[58px] place-items-center rounded-full bg-[rgba(10,13,18,0.96)] text-ink-0 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-colors hover:text-red"
        >
          <span className="cookie-fab-ring" aria-hidden />
          <span className="cookie-fab-sheen" aria-hidden />
          <span className="relative z-[1]"><Cookie size={26} /></span>
          <span className="blood-pool" aria-hidden />
          {/* krople boczne mniejsze, środkowa główna większa */}
          <span className="blood-drip" style={{ left: "15px", width: "4px", height: "5px", animationDelay: "0.6s" }} aria-hidden />
          <span className="blood-drip" style={{ left: "27px", width: "8px", height: "10px", animationDelay: "1.8s" }} aria-hidden />
          <span className="blood-drip" style={{ left: "41px", width: "4px", height: "5px", animationDelay: "3.1s" }} aria-hidden />
        </button>
      )}
      {/* Krew zebrana na dole ekranu pod ikoną */}
      {view === "hidden" && <span className="blood-puddle" aria-hidden />}

      <AnimatePresence>
        {view !== "hidden" && (
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed bottom-4 left-4 right-4 z-[95] mx-auto w-auto border border-white/10 bg-[rgba(10,13,18,0.97)] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:p-6 ${view === "details" ? "max-w-3xl" : "max-w-2xl"}`}
            role="dialog"
            aria-label="Ustawienia plików cookie"
            aria-live="polite"
          >
            <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />

            <div className="mb-3 flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full border border-red/40 text-red shadow-[0_0_12px_rgba(255,42,42,0.25)]"><Cookie /></span>
              <div>
                <h2 className="mb-1.5 font-serif text-xl font-medium text-ink-0">Ustawienia plików cookie</h2>
                <p className="text-[13px] font-light leading-relaxed text-ink-1">
                  {DESC.replace("ikoną ciasteczka w rogu strony.", "")}
                  <Link to="/prawne" className="ml-1 whitespace-nowrap text-ink-0 underline decoration-red/50 underline-offset-2 transition-colors hover:decoration-red">Polityka prywatności</Link>
                </p>
              </div>
            </div>

            {/* Toggle szczegółów */}
            <button
              type="button"
              onClick={() => setView(view === "details" ? "banner" : "details")}
              className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-mono text-ink-2 transition-colors hover:text-ink-0"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className={`transition-transform ${view === "details" ? "rotate-180" : ""}`}><path d="M3 4.5 6 7.5 9 4.5"/></svg>
              {view === "details" ? "Ukryj szczegóły" : "Pokaż szczegóły"}
            </button>

            <AnimatePresence initial={false}>
              {view === "details" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28 }}
                  className="overflow-hidden"
                >
                  <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Category icon={<Shield />} title="Niezbędne do działania" always
                      desc="Zapamiętanie Twojej zgody i podstawowe działanie serwisu (w przyszłości także sesja logowania i bezpieczeństwo). Bez nich serwis nie zadziała — nie można ich wyłączyć. Przechowywanie: localStorage / sesja." />
                    <Category icon={<Sliders />} title="Dopasowanie strony do Ciebie" checked={prefs} onChange={setPrefs}
                      desc="Zapamiętują Twój język, ulubione odcinki, postęp odsłuchu i wybrany wariant strony — byś nie ustawiał ich od nowa. First-party, brak danych osobowych. Przechowywanie: do 1 roku." />
                    <Category icon={<Chart />} title="Analiza i ulepszanie serwisu" checked={analytics} onChange={setAnalytics}
                      desc="Anonimowe statystyki użycia (które sekcje odwiedzasz, gdzie napotykasz błędy), by ulepszać OBSKURĘ. Obecnie nie zbieramy żadnych — uruchomią się wyłącznie po Twojej zgodzie. Nie służą do profilowania." />
                    <Category icon={<Megaphone />} title="Reklamy spersonalizowane" checked={marketing} onChange={setMarketing}
                      desc="Personalizacja reklam i pomiar ich skuteczności. Obecnie nie używamy żadnych pikseli ani skryptów reklamowych — jeśli to się zmieni, nie uruchomią się przed Twoją zgodą." />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Akcje */}
            <div className="flex flex-col gap-2.5 sm:flex-row">
              <button type="button" onClick={acceptAll}
                className="flex-1 bg-red px-4 py-3 font-mono text-[11px] font-bold uppercase tracking-ui text-white transition-shadow hover:shadow-[0_0_24px_rgba(255,42,42,0.45)]">
                {view === "details" ? "Akceptuj wszystkie" : "W porządku"}
              </button>
              {view === "details" ? (
                <>
                  <button type="button" onClick={rejectAll}
                    className="flex-1 border border-white/15 px-4 py-3 font-mono text-[11px] uppercase tracking-ui text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0">
                    Odrzuć wszystkie
                  </button>
                  <button type="button" onClick={savePrefs}
                    className="flex-1 border border-white/15 px-4 py-3 font-mono text-[11px] uppercase tracking-ui text-ink-1 transition-colors hover:border-red hover:text-red">
                    Zapisz preferencje
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setView("details")}
                  className="border border-white/15 px-6 py-3 font-mono text-[11px] uppercase tracking-ui text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0">
                  Ustawienia
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
