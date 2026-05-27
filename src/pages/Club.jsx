import { useState } from "react";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";

export default function Club() {
  const { t } = useTranslation();
  const [yearly, setYearly] = useState(true);

  const tiers = [
    {
      id: "free", name: t("club.tier_free_name"), tag: t("club.tier_free_tag"), priceMonth: 0, priceYear: 0,
      cta: t("club.tier_free_cta"), featured: false,
      feats: [
        { ok: true, text: "20 odcinków miesięcznie z katalogu (rotacja)" },
        { ok: true, text: "Jakość audio 192 kbps + binauralny 3D" },
        { ok: true, text: "1 urządzenie jednocześnie" },
        { ok: true, text: "Discord read-only dla członków" },
        { ok: false, text: "Bez reklam" },
        { ok: false, text: "Słuchanie offline" },
        { ok: false, text: "Premiery przed czasem" },
        { ok: false, text: "Treści ekskluzywne" },
      ],
    },
    {
      id: "solo", name: t("club.tier_solo_name"), tag: t("club.tier_solo_tag"), priceMonth: 29, priceYear: 24,
      cta: t("club.tier_solo_cta"), badge: t("club.tier_solo_badge"), featured: true,
      feats: [
        { ok: true, text: "Wszystkie 147 odcinków, bez limitu" },
        { ok: true, text: "Nowe odcinki 72h przed premierą" },
        { ok: true, text: "Lossless 320 kbps + binauralny 3D" },
        { ok: true, text: "Bez reklam, bez przerw" },
        { ok: true, text: "Słuchanie offline bez limitu" },
        { ok: true, text: "2 urządzenia jednocześnie" },
        { ok: true, text: "Discord — pełny dostęp + Q&A kwartalnie" },
        { ok: true, text: "Kulisy, alternatywne zakończenia" },
      ],
    },
    {
      id: "klan", name: t("club.tier_klan_name"), tag: t("club.tier_klan_tag"), priceMonth: 49, priceYear: 39,
      cta: t("club.tier_klan_cta"), featured: false,
      feats: [
        { ok: true, text: "Wszystko z planu Solo" },
        { ok: true, text: "Premiery 7 dni przed publicznym wydaniem" },
        { ok: true, text: "Bezstratny FLAC dla audiofilów" },
        { ok: true, text: "6 urządzeń · 5 profili (w tym profil 12+)" },
        { ok: true, text: "Wpływ na produkcję — głosowanie kwartalne" },
        { ok: true, text: "Spotkania miesięczne z twórcami + archiwum" },
        { ok: true, text: "Fizyczna książka roczna w komplecie" },
        { ok: true, text: "Wsparcie premium — 1h odpowiedzi" },
      ],
    },
  ];

  const compareRows = [
    { cat: "// KATALOG" },
    { label: "Liczba odcinków", vals: ["20 / mies.", "Wszystkie 147", "Wszystkie 147"] },
    { label: "Nowe odcinki — przed premierą", vals: ["—", "72h wcześniej", "7 dni wcześniej"] },
    { label: "Treści ekskluzywne (kulisy, alt. zakończenia)", vals: ["—", "●", "●"] },
    { cat: "// JAKOŚĆ I FORMA" },
    { label: "Jakość audio", vals: ["192 kbps", "320 kbps", "Lossless FLAC"] },
    { label: "Binauralny 3D + spatial mix", vals: ["●", "●", "●"] },
    { label: "Reklamy", vals: ["Tak (90s na epi.)", "Brak", "Brak"] },
    { label: "Słuchanie offline", vals: ["—", "Bez limitu", "Bez limitu"] },
    { cat: "// KONTO & PROFILE" },
    { label: "Jednoczesnych urządzeń", vals: ["1", "2", "6"] },
    { label: "Profili rodzinnych", vals: ["1", "1", "5"] },
    { label: "Profil dziecka (filtr 12+)", vals: ["—", "—", "●"] },
    { cat: "// SPOŁECZNOŚĆ & EKSTRA" },
    { label: "Discord — kanały dla członków", vals: ["read-only", "Pełny dostęp", "+ kanał Klanu"] },
    { label: "Spotkania z twórcami (Q&A live)", vals: ["—", "Kwartalne", "Miesięczne + nagrania"] },
    { label: "Wpływ na produkcję (głosowanie)", vals: ["—", "—", "●"] },
    { label: "Druk transkryptów (rocznie)", vals: ["—", "—", "1 tom"] },
  ];

  const extras = [
    { tag: t("club.extra1_tag"), p1: t("club.extra1_h_p1"), em: t("club.extra1_h_em"), desc: t("club.extra1_desc"), img: "/images/img-tunnel.png" },
    { tag: t("club.extra2_tag"), p1: t("club.extra2_h_p1"), em: t("club.extra2_h_em"), desc: t("club.extra2_desc"), img: "/images/img-creature.png" },
    { tag: t("club.extra3_tag"), p1: t("club.extra3_h_p1"), em: t("club.extra3_h_em"), desc: t("club.extra3_desc"), img: "/images/img-forest.png" },
    { tag: t("club.extra4_tag"), p1: t("club.extra4_h_p1"), em: t("club.extra4_h_em"), desc: t("club.extra4_desc"), img: "/images/img-hallway.png" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden px-5 pb-16 pt-40 lg:px-12">
        <div className="absolute inset-0 z-0">
          <img src="/images/img-wolf.png" alt="" className="h-full w-full object-cover object-[center_25%]" style={{ filter: "contrast(1.05) saturate(0.9) brightness(0.6)" }} />
          <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 60% at 50% 60%, rgba(255,42,42,0.12), transparent 70%), linear-gradient(180deg, rgba(5,6,8,0.5) 0%, transparent 30%, rgba(5,6,8,0.9) 100%)" }} />
        </div>
        <div className="relative z-[2] mx-auto w-full max-w-[1400px]">
          <Eyebrow>{t("club.eyebrow")}</Eyebrow>
          <h1 className="my-6 max-w-5xl font-serif text-[clamp(56px,9vw,144px)] font-medium leading-[0.9] tracking-[-0.03em]">
            {t("club.title_p1")} <em className="italic text-ink-1">{t("club.title_em")}</em>
            <br />
            <span className="text-red drop-shadow-[0_0_32px_rgba(255,42,42,0.5)]">{t("club.title_glow")}</span>
          </h1>
          <p className="my-8 max-w-xl text-lg font-light leading-relaxed text-ink-1">{t("club.sub")}</p>
        </div>
      </section>

      {/* Billing toggle */}
      <div className="mx-auto -mt-16 max-w-[1400px] px-5 lg:px-12">
        <div className="relative z-[3] inline-flex items-center border border-line bg-bg-1/70 p-1">
          <button onClick={() => setYearly(false)} className={`px-6 py-3 font-mono text-[11px] uppercase tracking-ui transition-colors ${!yearly ? "bg-red text-white" : "text-ink-2"}`}>{t("club.billing_monthly")}</button>
          <button onClick={() => setYearly(true)} className={`px-6 py-3 font-mono text-[11px] uppercase tracking-ui transition-colors ${yearly ? "bg-red text-white" : "text-ink-2"}`}>
            {t("club.billing_yearly")} <span className="ml-2 text-[9px] text-[#00ff88]">{t("club.billing_save")}</span>
          </button>
        </div>
      </div>

      {/* Tiers */}
      <section className="mx-auto mt-10 max-w-[1400px] px-5 lg:px-12">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {tiers.map((tier) => {
            const price = yearly ? tier.priceYear : tier.priceMonth;
            const isFree = tier.id === "free";
            const save = (tier.priceMonth - tier.priceYear) * 12;
            return (
              <div key={tier.id} className={`relative p-10 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 ${tier.featured ? "border border-red bg-[linear-gradient(180deg,rgba(255,42,42,0.06),rgba(15,18,24,0.8))] shadow-[0_0_0_1px_rgba(255,42,42,0.3),0_30px_80px_-20px_rgba(255,42,42,0.2)]" : "border border-line bg-bg-1/60 hover:border-red/30"}`}>
                {tier.featured && <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.8),transparent)]" />}
                {tier.badge && <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red px-3 py-1 font-mono text-[9px] uppercase tracking-eyebrow text-white shadow-[0_0_16px_rgba(255,42,42,0.4)]">{tier.badge}</div>}
                <div className="mb-1 font-serif text-3xl font-medium leading-none tracking-[-0.01em]">{tier.name}</div>
                <div className="mb-6 font-mono text-[10px] uppercase tracking-mono text-ink-2">{tier.tag}</div>
                <div className="mb-2 flex items-baseline gap-2">
                  {!isFree && <span className="font-mono text-sm text-ink-2">PLN</span>}
                  <span className="font-serif text-[64px] font-medium leading-none text-ink-0">{isFree ? "0" : price}</span>
                  <span className="text-[13px] text-ink-2">{isFree ? t("club.forever") : t("club.per_month")}</span>
                </div>
                <div className={`mb-7 h-[18px] text-xs ${yearly && !isFree ? "text-[#00ff88]" : "text-ink-2"}`}>
                  {isFree ? t("club.tier_free_sub_zero") : yearly ? t("club.save_text_yearly", { total: price * 12, save }) : t("club.save_text_monthly")}
                </div>
                <HorrorButton to="/rejestracja" variant={tier.featured ? "primary" : "ghost"} block className="!mb-8">
                  {tier.cta} →
                </HorrorButton>
                <ul className="border-t border-line pt-6">
                  {tier.feats.map((f, i) => (
                    <li key={i} className={`flex items-start gap-3 border-b border-line/50 py-2.5 text-sm leading-snug last:border-b-0 ${f.ok ? "text-ink-1" : "text-ink-3 line-through"}`}>
                      <span className={`mt-0.5 grid h-4 w-4 flex-shrink-0 place-items-center rounded-full border text-[10px] ${f.ok ? "border-red text-red" : "border-ink-3 text-ink-3"}`}>{f.ok ? "✓" : "×"}</span>
                      <span>{f.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <div className="mt-10 text-center font-mono text-[11px] uppercase tracking-mono text-ink-2">{t("club.all_taxes")}</div>
      </section>

      {/* Compare */}
      <section className="mx-auto mt-32 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow>{t("club.compare_eyebrow")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("club.compare_title_p1")} <em className="italic text-ink-2">{t("club.compare_title_em")}</em>?
        </h2>
        <div className="mt-10 overflow-hidden border border-line bg-bg-1/40">
          <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-b border-line bg-red/[0.04]">
            <div className="flex items-center border-r border-line px-3 py-6 font-mono text-[11px] uppercase tracking-mono text-ink-2 sm:px-5">// FUNKCJE</div>
            {["Próg", "Solo", "Klan"].map((n, i) => (
              <div key={n} className={`flex items-center border-r border-line px-3 py-6 font-serif text-lg font-medium italic last:border-r-0 sm:px-5 sm:text-2xl ${i === 1 ? "text-red" : ""}`}>{n}</div>
            ))}
          </div>
          {compareRows.map((row, idx) =>
            row.cat ? (
              <div key={idx} className="border-b border-line bg-black/40 px-3 py-3.5 font-mono text-[10px] uppercase tracking-mono text-red sm:px-5">{row.cat}</div>
            ) : (
              <div key={idx} className="grid grid-cols-[1.6fr_1fr_1fr_1fr] border-b border-line last:border-b-0">
                <div className="flex items-center border-r border-line bg-black/20 px-3 py-4 text-xs font-medium text-ink-0 sm:px-5 sm:text-sm">{row.label}</div>
                {row.vals.map((v, i) => (
                  <div key={i} className="flex items-center border-r border-line px-3 py-4 text-xs text-ink-1 last:border-r-0 sm:px-5 sm:text-sm">
                    {v === "●" || v.includes("Wszystkie") || v.includes("wcześniej") || v.includes("Bez limitu") || v.includes("Pełny") || v.includes("kanał") || v.includes("Kwartalne") || v.includes("Miesięczne") || v.includes("tom") ? <span className="font-bold text-red">{v}</span> : v}
                  </div>
                ))}
              </div>
            ),
          )}
        </div>
      </section>

      {/* Extras */}
      <section className="mx-auto mt-32 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("club.extras_eyebrow")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("club.extras_title_p1")} <em className="italic text-ink-1">{t("club.extras_title_em")}</em>.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {extras.map((ex, i) => (
            <div key={i} className="group relative aspect-[16/11] cursor-pointer overflow-hidden bg-bg-1">
              <img src={ex.img} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" style={{ filter: "contrast(1.05) saturate(0.9)" }} />
              <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(5,6,8,0.4) 0%, transparent 30%, rgba(5,6,8,0.95) 95%)" }} />
              <div className="absolute inset-x-0 bottom-0 z-[2] p-8">
                <span className="mb-4 inline-block border border-red bg-red/15 px-2.5 py-1 font-mono text-[9px] uppercase tracking-eyebrow text-red">{ex.tag}</span>
                <h3 className="mb-2.5 font-serif text-3xl font-medium leading-tight">{ex.p1} <em className="italic text-ink-1">{ex.em}</em></h3>
                <p className="max-w-md text-sm font-light leading-relaxed text-ink-1">{ex.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-36 max-w-5xl px-5 text-center lg:px-12">
        <div className="relative overflow-hidden border border-line bg-bg-1/60 px-5 py-20 lg:px-12">
          <div className="pointer-events-none absolute left-1/2 top-[-50%] h-[300px] w-[600px] -translate-x-1/2" style={{ background: "radial-gradient(ellipse, rgba(255,42,42,0.15), transparent 70%)" }} />
          <Eyebrow centered className="relative mb-6">{t("club.cta_eyebrow")}</Eyebrow>
          <h2 className="relative font-serif text-[clamp(40px,5vw,64px)] font-medium leading-none">
            {t("club.cta_h_p1")} <em className="italic text-ink-1">{t("club.cta_h_em")}</em>
            <br />
            {t("club.cta_h_p2")}
          </h2>
          <p className="relative mx-auto mb-8 mt-4 max-w-xl text-[17px] font-light leading-relaxed text-ink-1">{t("club.cta_desc")}</p>
          <div className="relative flex justify-center">
            <HorrorButton to="/rejestracja" className="!px-8 !py-[18px] !text-[13px]">
              {t("club.cta_btn")} <Arrow />
            </HorrorButton>
          </div>
          <div className="relative mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("club.trust")}</div>
        </div>
      </section>
    </>
  );
}
