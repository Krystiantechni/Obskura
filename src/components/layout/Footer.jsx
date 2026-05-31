import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Brand from "../ui/Brand";

export default function Footer() {
  const { t } = useTranslation();

  const cols = [
    {
      head: "footer.listen",
      links: [
        { key: "footer.home", to: "/" },
        { key: "footer.archive", to: "/archive" },
        { key: "footer.new", to: "/archive" },
        { key: "footer.series", to: "/archive" },
        { key: "footer.playlists", to: "/archive" },
      ],
    },
    {
      head: "footer.community",
      links: [
        { key: "footer.creators", to: "/creators" },
        { key: "footer.club", to: "/club" },
        { key: "footer.patrons", to: "/patrons" },
        { key: "footer.forum", to: "/forum" },
        { key: "footer.events", to: "/events" },
      ],
    },
    {
      head: "footer.help",
      links: [
        { key: "footer.support", to: "/support" },
        { key: "footer.faq", to: "/support" },
        { key: "footer.contact", to: "/support" },
        { key: "footer.press", to: "/press" },
        { key: "footer.careers", to: "/careers" },
      ],
    },
  ];

  return (
    <footer className="relative mt-32 border-t border-line bg-[linear-gradient(180deg,transparent,rgba(0,0,0,0.4))] px-5 pb-10 pt-20 lg:px-12">
      <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.4),transparent)]" />
      <div className="mx-auto mb-14 grid max-w-[1400px] grid-cols-2 gap-10 lg:grid-cols-[2fr_1fr_1fr_1fr_1.5fr]">
        {/* Brand */}
        <div className="col-span-2 lg:col-span-1">
          <Brand />
          <p className="my-5 max-w-xs text-[13px] leading-relaxed text-ink-2">{t("footer.tagline")}</p>
          <div className="flex gap-3">
            {[
              { label: "SPOTIFY", href: "https://open.spotify.com/search/obskura" },
              { label: "APPLE", href: "https://podcasts.apple.com/search?term=obskura" },
              { label: "RSS", href: "/rss.xml" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                target={s.href.startsWith("http") ? "_blank" : undefined}
                rel={s.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="inline-flex min-h-[44px] items-center border border-white/10 px-3.5 font-sans text-[11px] font-semibold uppercase tracking-ui text-ink-0 transition-colors hover:border-red hover:text-red"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        {/* Link cols */}
        {cols.map((col) => (
          <div key={col.head}>
            <h3 className="mb-5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t(col.head)}</h3>
            <ul className="flex flex-col gap-3">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="inline-block py-1.5 text-sm text-ink-1 transition-colors hover:text-red">
                    {t(l.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Newsletter */}
        <div className="col-span-2 lg:col-span-1">
          <h3 className="mb-5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("footer.newsletter")}</h3>
          <p className="mb-3.5 text-[13px] leading-snug text-ink-1">{t("footer.newsletter_desc")}</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder={t("footer.email_placeholder")}
              className="mb-2.5 min-h-[44px] w-full border border-line bg-white/[0.03] px-3.5 py-3 text-[13px] text-ink-0 placeholder:text-ink-3 focus:border-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70"
            />
            <button
              type="submit"
              className="min-h-[44px] w-full bg-red px-3 py-3 font-sans text-[11px] font-semibold uppercase tracking-ui text-black shadow-cta-red transition-colors hover:bg-red-soft"
            >
              {t("footer.newsletter_cta")}
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-4 border-t border-line pt-8 font-mono text-[11px] tracking-[0.1em] text-ink-2 sm:flex-row sm:items-center">
        <div>{t("footer.copyright")}</div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <Link to="/legal" className="inline-block py-1.5 text-ink-2 hover:text-ink-0">{t("footer.privacy")}</Link>
          <Link to="/legal" className="inline-block py-1.5 text-ink-2 hover:text-ink-0">{t("footer.terms")}</Link>
          <Link to="/legal" className="inline-block py-1.5 text-ink-2 hover:text-ink-0">{t("footer.cookies")}</Link>
        </div>
      </div>
    </footer>
  );
}
