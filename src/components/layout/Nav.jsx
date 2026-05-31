import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import Brand from "../ui/Brand";
import LanguageSwitcher from "../ui/LanguageSwitcher";
import HorrorButton from "../ui/HorrorButton";

const LINKS = [
  { to: "/", key: "nav.listen", end: true },
  { to: "/archiwum", key: "nav.archive" },
  { to: "/tworcy", key: "nav.creators" },
  { to: "/klub", key: "nav.club" },
  { to: "/wsparcie", key: "nav.support" },
];

export default function Nav() {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    [
      "relative font-sans text-[13px] font-medium uppercase tracking-ui transition-colors",
      isActive ? "text-ink-0" : "text-ink-1 hover:text-ink-0",
      isActive
        ? "after:absolute after:-bottom-2 after:left-1/2 after:h-1 after:w-1 after:-translate-x-1/2 after:rounded-full after:bg-red after:shadow-[0_0_8px_#ff2a2a]"
        : "",
    ].join(" ");

  return (
    <nav className="fixed inset-x-0 top-0 z-[100] flex items-center justify-between border-b border-line/50 bg-[linear-gradient(180deg,rgba(5,6,8,0.92),rgba(5,6,8,0.7))] px-5 py-4 backdrop-blur-md lg:px-12 lg:py-[22px]">
      <Brand />

      {/* Desktop links */}
      <div className="hidden gap-9 lg:flex">
        {LINKS.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
            {t(l.key)}
          </NavLink>
        ))}
      </div>

      {/* Desktop actions */}
      <div className="hidden items-center gap-3.5 lg:flex">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88]" />
          <span>{t("nav.stream-live")}</span>
        </div>
        <LanguageSwitcher />
        <HorrorButton to="/zaloguj" variant="ghost" className="!px-[18px] !py-2.5">
          {t("nav.login")}
        </HorrorButton>
      </div>

      {/* Mobile trigger */}
      <button
        type="button"
        className="text-ink-0 lg:hidden"
        onClick={() => setMobileOpen((o) => !o)}
        aria-label="Menu"
      >
        {mobileOpen ? <X size={22} /> : <Menu size={22} />}
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute inset-x-0 top-full flex flex-col gap-6 border-b border-line bg-bg-0 px-5 py-8 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)] lg:hidden">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `font-mono text-sm uppercase tracking-ui ${isActive ? "text-red" : "text-ink-1"}`
              }
            >
              {t(l.key)}
            </NavLink>
          ))}
          <div className="flex items-center justify-between border-t border-line pt-6">
            <LanguageSwitcher />
            <HorrorButton to="/zaloguj" variant="ghost" className="!px-[18px] !py-2.5" onClick={() => setMobileOpen(false)}>
              {t("nav.login")}
            </HorrorButton>
          </div>
        </div>
      )}
    </nav>
  );
}
