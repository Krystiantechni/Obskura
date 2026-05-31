import PropTypes from "prop-types";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Check, X } from "lucide-react";
import { LOCALES, getLocale } from "../../i18n/locales";

// Dropdown wyboru języka — 40 języków pogrupowanych po regionie + search.
// OBSKURA styling: mono uppercase, czerwone akcenty, glass bg.
export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const current = getLocale(i18n.language);

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? LOCALES.filter(
          (l) =>
            l.native.toLowerCase().includes(q) ||
            l.english.toLowerCase().includes(q) ||
            l.code.includes(q),
        )
      : LOCALES;
    const groups = {};
    for (const l of filtered) {
      if (!groups[l.region]) groups[l.region] = [];
      groups[l.region].push(l);
    }
    return groups;
  }, [query]);

  const change = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 border border-line bg-bg-1/70 px-3 py-2 font-mono text-[11px] uppercase tracking-mono text-ink-0 backdrop-blur-md transition-colors hover:border-red hover:text-red focus-visible:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-0"
        aria-label={t("language_switcher.label_with_code", "Język: {{code}}, kliknij aby zmienić", { code: current.code.toUpperCase() })}
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.code.toUpperCase()}</span>
        <span className={`inline-block h-2 w-2 border-b border-r border-current transition-transform ${open ? "rotate-[225deg] -translate-y-[2px]" : "rotate-45 -translate-y-[2px]"}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-[110] w-80 overflow-hidden border border-line bg-bg-1/95 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <div className="relative border-b border-line p-3">
            <Search
              size={14}
              strokeWidth={2}
              className="pointer-events-none absolute left-6 top-1/2 -translate-y-1/2 text-ink-2"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("language_switcher.search_placeholder", "Search language…")}
              className="w-full border border-line bg-black/40 py-2 pl-9 pr-9 text-sm text-ink-0 placeholder:text-ink-3 focus:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-6 top-1/2 -translate-y-1/2 text-ink-2 hover:text-ink-0"
                aria-label={t("language_switcher.clear_search", "Clear search")}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto" data-lenis-prevent>
            {Object.entries(grouped).map(([region, items]) => (
              <div key={region} className="border-b border-line/40 last:border-b-0">
                <p className="sticky top-0 z-10 bg-bg-1/95 px-4 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-2 backdrop-blur-sm">
                  {region}
                </p>
                {items.map((l) => {
                  const isCurrent = l.code === i18n.language;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => change(l.code)}
                      className={[
                        "flex w-full items-center justify-between gap-3 px-4 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:bg-red/15 focus-visible:text-ink-0",
                        isCurrent
                          ? "bg-red/8 text-red"
                          : "text-ink-1 hover:bg-red/10 hover:text-ink-0",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <span className="text-base leading-none">{l.flag}</span>
                        <span className="font-medium">{l.native}</span>
                        <span className="text-xs text-ink-2">{l.english}</span>
                      </span>
                      {isCurrent && <Check size={14} strokeWidth={2.5} />}
                    </button>
                  );
                })}
              </div>
            ))}
            {Object.keys(grouped).length === 0 && (
              <p className="px-4 py-6 text-center text-sm text-ink-2">
                {t("language_switcher.no_match", "No language matches.")}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

LanguageSwitcher.propTypes = {
  className: PropTypes.string,
};
