import { useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getConsent, setConsent } from "../../lib/consent";

// Ikonki kategorii
const Shield = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"/></svg>);
const Sliders = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2.2"/><circle cx="8" cy="17" r="2.2"/></svg>);
const Chart = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 19V5M4 19h16M8 16l4-5 3 3 4-6"/></svg>);
const Megaphone = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 10v4h3l9 5V5L7 10H4zM18 9a3 3 0 0 1 0 6"/></svg>);
const Cookie = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
    <path d="M12 2.6a9.4 9.4 0 1 0 9.4 9.4 3.7 3.7 0 0 1-4.6-4.7A3.7 3.7 0 0 1 12 2.6z" />
    <circle cx="9.1" cy="9" r="1.05" fill="currentColor" stroke="none" />
    <circle cx="7.3" cy="13.1" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="11.6" cy="12.2" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="12.5" cy="16" r="1.35" fill="currentColor" stroke="none" />
    <circle cx="9" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
    <circle cx="15.5" cy="14.8" r="0.7" fill="currentColor" stroke="none" />
  </svg>
);
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
  const { t } = useTranslation();
  return (
    <div className="border border-white/8 bg-white/[0.02] p-3">
      <div className="mb-1 flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-ink-0">
          <span className="text-red">{icon}</span>
          <span className="text-[12px] font-medium">{title}</span>
        </div>
        {always ? (
          <span className="shrink-0 border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase tracking-mono text-ink-2">{t("cookie.always_on", "Zawsze aktywne")}</span>
        ) : (
          <Toggle checked={checked} onChange={onChange} label={title} />
        )}
      </div>
      <p className="text-[10.5px] font-light leading-snug text-ink-2">{desc}</p>
    </div>
  );
}
Category.propTypes = {
  icon: PropTypes.node.isRequired, title: PropTypes.string.isRequired, desc: PropTypes.string.isRequired,
  always: PropTypes.bool, checked: PropTypes.bool, onChange: PropTypes.func,
};

// Baner zgody na cookies — schemat: collapsed → szczegóły (4 kategorie) → reopen ikoną.
export default function CookieConsent() {
  const { t } = useTranslation();
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
    setView("banner"); // zawsze otwiera się zwinięty
  };

  return (
    <>
      {/* Pływająca ikona — wycofaj/zmień zgodę (prawy dół, obok panelu A/B). Statyczna pozycja. */}
      {view === "hidden" && (
        <button
          type="button"
          onClick={reopen}
          aria-label={t("cookie.fab_aria", "Ustawienia plików cookie")}
          className="cookie-fab fixed bottom-4 right-4 z-[85] grid h-[40px] w-[40px] place-items-center rounded-full bg-[rgba(10,13,18,0.96)] text-ink-0 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.85)] transition-colors hover:text-red lg:bottom-6 lg:right-6 lg:h-[58px] lg:w-[58px]"
        >
          <span className="cookie-fab-ring" aria-hidden />
          <span className="cookie-fab-sheen" aria-hidden />
          <span className="relative z-[2]"><Cookie size={18} className="lg:hidden" /><Cookie size={26} className="hidden lg:block" /></span>
        </button>
      )}

      <AnimatePresence>
        {view !== "hidden" && (
          <motion.div
            initial={{ y: 48, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 48, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-8 left-4 right-4 z-[95] mx-auto w-auto max-w-lg border border-white/10 bg-[rgba(10,13,18,0.98)] p-4 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-md"
            role="dialog"
            aria-label={t("cookie.dialog_aria", "Ustawienia plików cookie")}
            aria-live="polite"
          >
            <div className="mb-2.5 flex items-start gap-2.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-red/40 text-red shadow-[0_0_12px_rgba(255,42,42,0.25)]"><Cookie size={14} /></span>
              <div>
                <h2 className="mb-1 font-serif text-[15px] font-medium text-ink-0">{t("cookie.title", "Ustawienia plików cookie")}</h2>
                <p className="text-[11.5px] font-light leading-snug text-ink-1">
                  {t("cookie.desc", "Używamy plików cookie. Niezbędne są wymagane do działania serwisu — pozostałe uruchamiamy wyłącznie za Twoją zgodą.")}{" "}
                  <Link to="/prawne" className="whitespace-nowrap text-ink-0 underline decoration-red/50 underline-offset-2 transition-colors hover:decoration-red">{t("cookie.privacy_link", "Polityka prywatności")}</Link>
                </p>
              </div>
            </div>

            {/* Toggle szczegółów */}
            <button
              type="button"
              onClick={() => setView(view === "details" ? "banner" : "details")}
              className="mb-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-mono text-ink-2 transition-colors hover:text-ink-0"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" className={`transition-transform ${view === "details" ? "rotate-180" : ""}`}><path d="M3 4.5 6 7.5 9 4.5"/></svg>
              {view === "details" ? t("cookie.hide_details", "Ukryj szczegóły") : t("cookie.show_details", "Pokaż szczegóły")}
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
                  <div className="mb-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <Category icon={<Shield />} always
                      title={t("cookie.cat_necessary_title", "Niezbędne do działania")}
                      desc={t("cookie.cat_necessary_desc", "Zapamiętanie zgody i podstawowe działanie serwisu (w przyszłości też logowanie). Bez nich serwis nie zadziała.")} />
                    <Category icon={<Sliders />} checked={prefs} onChange={setPrefs}
                      title={t("cookie.cat_preferences_title", "Dopasowanie strony do Ciebie")}
                      desc={t("cookie.cat_preferences_desc", "Język, ulubione, postęp odsłuchu i wariant strony — byś nie ustawiał ich od nowa. Brak danych osobowych.")} />
                    <Category icon={<Chart />} checked={analytics} onChange={setAnalytics}
                      title={t("cookie.cat_analytics_title", "Analiza i ulepszanie serwisu")}
                      desc={t("cookie.cat_analytics_desc", "Anonimowe statystyki użycia, by ulepszać OBSKURĘ. Obecnie nie zbieramy żadnych — tylko za Twoją zgodą.")} />
                    <Category icon={<Megaphone />} checked={marketing} onChange={setMarketing}
                      title={t("cookie.cat_marketing_title", "Reklamy spersonalizowane")}
                      desc={t("cookie.cat_marketing_desc", "Personalizacja reklam. Obecnie nie używamy żadnych pikseli — nie uruchomią się bez Twojej zgody.")} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Akcje */}
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" onClick={acceptAll}
                className="flex-1 bg-red px-3.5 py-2.5 font-mono text-[10px] font-bold uppercase tracking-ui text-black transition-shadow hover:shadow-[0_0_24px_rgba(255,42,42,0.45)]">
                {view === "details" ? t("cookie.accept_all", "Akceptuj wszystkie") : t("cookie.ok", "W porządku")}
              </button>
              {view === "details" ? (
                <>
                  <button type="button" onClick={rejectAll}
                    className="flex-1 border border-white/15 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-ui text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0">
                    {t("cookie.reject_all", "Odrzuć wszystkie")}
                  </button>
                  <button type="button" onClick={savePrefs}
                    className="flex-1 border border-white/15 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-ui text-ink-1 transition-colors hover:border-red hover:text-red">
                    {t("cookie.save_prefs", "Zapisz preferencje")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setView("details")}
                  className="border border-white/15 px-5 py-2.5 font-mono text-[10px] uppercase tracking-ui text-ink-1 transition-colors hover:border-ink-0 hover:text-ink-0">
                  {t("cookie.settings", "Ustawienia")}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
