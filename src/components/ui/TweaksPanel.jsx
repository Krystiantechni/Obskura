import PropTypes from "prop-types";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";

// Panel A/B (prawy dół) — toggle hero portret 9:16 / wide 16:9. Wybór w localStorage.
export default function TweaksPanel({ variant, onChange }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("tweaks.title")}
        className="fixed bottom-[88px] right-6 z-[200] grid h-12 w-12 place-items-center bg-red text-white shadow-[0_0_24px_rgba(255,42,42,0.4),0_0_0_1px_rgba(255,42,42,0.4)] transition-colors hover:bg-red-soft"
      >
        <span className="font-mono text-base leading-none">A/B</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-[88px] right-6 z-[200] min-w-[260px] border border-line bg-bg-1/95 px-5 py-[18px] shadow-[0_30px_60px_-10px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,42,42,0.08)] backdrop-blur-xl">
      <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />
      <div className="mb-3.5 flex items-center justify-between border-b border-line pb-2.5">
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-red">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
          {t("tweaks.title")}
        </span>
        <button type="button" onClick={() => setOpen(false)} className="p-1 text-ink-2 hover:text-ink-0" aria-label="Close">
          <X size={14} />
        </button>
      </div>

      <div className="mb-2 font-mono text-[9px] uppercase tracking-mono text-ink-2">{t("tweaks.hero_label")}</div>
      <div className="grid grid-cols-2 gap-1 border border-line bg-black/40 p-[3px]">
        {[
          { id: "portrait", label: t("tweaks.portrait") },
          { id: "wide", label: t("tweaks.wide") },
        ].map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={[
              "px-1.5 py-2 font-mono text-[10px] uppercase tracking-ui transition-colors",
              variant === o.id ? "bg-red text-white" : "text-ink-2 hover:text-ink-1",
            ].join(" ")}
          >
            {o.label}
          </button>
        ))}
      </div>
      <p className="mt-2.5 border-t border-line/60 pt-2.5 font-serif text-[11px] italic leading-snug text-ink-2">
        {variant === "portrait" ? t("tweaks.hint_portrait") : t("tweaks.hint_wide")}
      </p>
    </div>
  );
}

TweaksPanel.propTypes = {
  variant: PropTypes.oneOf(["portrait", "wide"]).isRequired,
  onChange: PropTypes.func.isRequired,
};
