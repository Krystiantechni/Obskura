import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

export default function Patroni() {
  const { t } = useTranslation();

  const counters = [
    { n: "412", l: t("patroni.counter1", "Aktywnych patronów"), accent: false },
    { n: "147 280 zł", l: t("patroni.counter2", "Sfinansowanego sezonu 04"), accent: true },
    { n: "73%", l: t("patroni.counter3", "Celu sezonowego"), accent: false },
    { n: "12", l: t("patroni.counter4", "Nagrań w produkcji"), accent: false },
  ];

  const tiers = [
    {
      role: t("patroni.t1_role", "// ŚWIADEK"), featured: false,
      name_p1: t("patroni.t1_name_p1", "Anonim"), name_em: t("patroni.t1_name_em", "w cieniu"),
      amt: "120", per: t("patroni.per_season", "zł / sezon"),
      feats: [
        t("patroni.t1_f1", "Dostęp do całego sezonu 04 30 dni przed premierą"),
        t("patroni.t1_f2", "Dwa spotkania na żywo w trakcie produkcji"),
        t("patroni.t1_f3", "Twoje (lub anonimowe) imię w napisach"),
        t("patroni.t1_f4", "Dyskord — kanał #patroni-s04"),
        t("patroni.t1_f5", "Cyfrowy „zin” — 24-stronicowy PDF z notatkami z planu"),
      ],
      cta: t("patroni.t1_cta", "Zostań Świadkiem"), variant: "ghost",
    },
    {
      role: t("patroni.t2_role", "// SOJUSZNIK · NAJPOPULARNIEJSZY"), featured: true,
      name_p1: t("patroni.t2_name_p1", "Twoje"), name_em: t("patroni.t2_name_em", "imię w pętli"),
      amt: "450", per: t("patroni.per_season", "zł / sezon"),
      feats: [
        t("patroni.t2_f1", "Wszystko z poziomu Świadek"),
        t("patroni.t2_f2", "Imię w napisach każdego odcinka (audio + pisemne)"),
        t("patroni.t2_f3", "Dostęp do scenariuszy 30 dni przed nagraniem"),
        t("patroni.t2_f4", "Głos doradczy — komentujesz scenariusze przed mixem"),
        t("patroni.t2_f5", "Fizyczna paczka: plakat, naklejki, kaseta-pamiątka"),
        t("patroni.t2_f6", "1× spotkanie 1-na-1 z dowolnym narratorem (45 min)"),
      ],
      cta: t("patroni.t2_cta", "Zostań Sojusznikiem"), variant: "primary",
    },
    {
      role: t("patroni.t3_role", "// PRODUCENT WYKONAWCZY"), featured: false,
      name_p1: t("patroni.t3_name_p1", "Współ"), name_em: t("patroni.t3_name_em", "producent"), nameJoined: true,
      amt: "2 400", per: t("patroni.per_season", "zł / sezon"),
      feats: [
        t("patroni.t3_f1", "Wszystko z poziomu Sojusznik"),
        t("patroni.t3_f2", "„Producent wykonawczy” w napisach + na stronie"),
        t("patroni.t3_f3", "Wybór jednego odcinka z 3 propozycji do nagrania"),
        t("patroni.t3_f4", "Wizyta w studio + udział w jednej sesji nagraniowej"),
        t("patroni.t3_f5", "Numerowana kopia 12” winylowego soundtracka sezonu"),
        t("patroni.t3_f6", "Limit: 12 osób na sezon. Zostało: 4."),
      ],
      cta: t("patroni.t3_cta", "Aplikuj (4/12)"), variant: "ghost",
    },
  ];

  const execNames = [
    "M. KOWALEWICZ · EP", "A. NOWAK · EP", "FUNDACJA „LAMPA” · EP",
    "N.N. (LWÓW) · EP", "P. KWIATKOWSKI · EP", "A. SOBÓL · EP",
  ];
  const regularNames = [
    "Eliza Z.", "Marek B.", "Anna K.", "Piotr S.", "Karolina W.", "Tomasz R.",
    "Jakub G.", "Magda L.", "Hanna O.", "Krzysztof P.", "Joanna T.", "Bartek M.",
    "Ola D.", "Filip K.", "Natalia Ż.", "Paweł W.", "Marta H.", "Daniel S.",
    "Kasia M.", "Marcin N.", "Igor B.",
  ];
  const anonNames = ["Anonim · #018", "Anonim · #023", "Anonim · #047"];
  const moreNames = ["Mateusz J.", "Zuzia K.", "Janek W.", "Karol P.", "Maja O."];

  const faqs = [
    { q_p1: t("patroni.faq1_q_p1", "Czy to"), q_em: t("patroni.faq1_q_em", "jednorazowa płatność"), q_p2: t("patroni.faq1_q_p2", "czy abonament?"), a: t("patroni.faq1_a", "Jednorazowa — za jeden sezon (zwykle 12 odcinków przez 6 miesięcy). Po zakończeniu sezonu możesz, ale nie musisz, wesprzeć następny. Bez automatycznego przedłużania, bez „dark patterns”.") },
    { q_p1: t("patroni.faq2_q_p1", "Co jeśli"), q_em: t("patroni.faq2_q_em", "nie spodoba mi się"), q_p2: t("patroni.faq2_q_p2", "sezon?"), a: t("patroni.faq2_a", "30 dni od pierwszej płatności — pełen zwrot, bez pytań. Po tym czasie — proporcjonalnie do tego, co zostało nagrane. Napisz na pomoc@obskura.audio i sprawa zamknięta w 48h.") },
    { q_p1: t("patroni.faq3_q_p1", "Czy mogę być"), q_em: t("patroni.faq3_q_em", "patronem anonimowo"), q_p2: t("patroni.faq3_q_p2", "?"), a: t("patroni.faq3_a", "Tak. W koszyku zaznaczasz „anonim” i w napisach pojawiasz się jako „Anonim #042”. 38% naszych patronów wybiera tę opcję — większość to ludzie z branż, w których publiczne wsparcie horroru byłoby niezręczne. Szanujemy to.") },
    { q_p1: t("patroni.faq4_q_p1", "Czy mogę być patronem"), q_em: t("patroni.faq4_q_em", "w imieniu firmy"), q_p2: t("patroni.faq4_q_p2", "?"), a: t("patroni.faq4_a", "Producent wykonawczy — tak (wystawiamy fakturę, dostajesz logo w napisach jako „presented by”). Świadek i Sojusznik — preferujemy osoby prywatne, ale firmę też przyjmiemy. Skontaktuj się przez patroni@obskura.audio.") },
  ];

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden px-5 pb-10 pt-[140px] lg:px-12">
        <div className="pointer-events-none absolute -right-24 top-16 h-[500px] w-[500px]" style={{ background: "radial-gradient(circle, rgba(255,42,42,0.08), transparent 60%)" }} />
        <div className="relative mx-auto max-w-[1400px]">
          <Eyebrow>{t("patroni.eyebrow", "// PATRONI · 412 OSÓB · FINANSUJĄ SEZON 04")}</Eyebrow>
          <h1 className="my-5 max-w-[1200px] font-serif text-[clamp(48px,8vw,120px)] font-medium leading-[0.92] tracking-[-0.02em]">
            {t("patroni.title_p1", "Bez was")} <em className="italic text-ink-1">{t("patroni.title_em1", "nie nagrywamy")}</em>.
            <br />
            {t("patroni.title_p2", "Bez was nie ma")} <em className="italic text-ink-1">{t("patroni.title_em2", "Obskury")}</em>.
          </h1>
          <p className="max-w-[660px] text-[18px] font-light leading-relaxed text-ink-1">
            {t("patroni.lead", "Patroni to coś innego niż Klub. Klub to subskrypcja. Patroni to ludzie, którzy finansują konkretny sezon, dostają nazwisko w napisach końcowych i decydują o tym, co nagramy za pół roku.")}
          </p>
          <div className="mt-10 grid grid-cols-2 gap-8 border-t border-line pt-8 lg:grid-cols-4">
            {counters.map((c) => (
              <div key={c.l}>
                <div className={`font-serif text-[clamp(28px,4vw,40px)] font-medium leading-none ${c.accent ? "text-red" : ""}`}>{c.n}</div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-mono text-ink-2">{c.l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Patroni vs Klub */}
      <section className="mx-auto mt-20 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("patroni.vs_eyebrow", "JAKA RÓŻNICA")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("patroni.vs_title_p1", "Patroni")} <em className="italic text-ink-1">{t("patroni.vs_title_em", "vs.")}</em> {t("patroni.vs_title_p2", "Klub.")}
        </h2>
        <div className="mt-8 grid gap-9 border border-line bg-bg-1/60 p-9 lg:grid-cols-2">
          <div>
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("patroni.vs_klub_label", "// KLUB")}</h4>
            <div className="mb-4 font-serif text-[28px] font-medium">{t("patroni.vs_klub_name_p1", "Słuchasz")} <em className="italic text-ink-1">{t("patroni.vs_klub_name_em", "tego, co już jest")}</em></div>
            <p className="text-sm font-light leading-relaxed text-ink-1">{t("patroni.vs_klub_p", "Subskrypcja miesięczna lub roczna. Dostajesz cały katalog, jakość lossless, ekskluzywne treści, brak reklam. Klub finansuje codzienną pracę zespołu. Anulujesz w każdej chwili.")}</p>
          </div>
          <div className="border-t border-line pt-9 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("patroni.vs_patron_label", "// PATRON")}</h4>
            <div className="mb-4 font-serif text-[28px] font-medium text-red">{t("patroni.vs_patron_name_p1", "Finansujesz")} <em className="italic">{t("patroni.vs_patron_name_em", "to, czego jeszcze nie ma")}</em></div>
            <p className="text-sm font-light leading-relaxed text-ink-1">{t("patroni.vs_patron_p", "Jednorazowa wpłata na konkretny sezon. Dostajesz wszystko co Klub Klan + bezpośredni wpływ na produkcję, dostęp do scenariuszy na etapie pisania, twoje nazwisko w napisach każdego odcinka sezonu.")}</p>
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow>{t("patroni.tiers_eyebrow", "SEZON 04 · LATO 2026")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("patroni.tiers_title_p1", "Trzy")} <em className="italic text-ink-1">{t("patroni.tiers_title_em", "poziomy")}</em>.
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div key={tier.role} className={`relative p-8 transition-all duration-300 hover:-translate-y-1 ${tier.featured ? "border border-red bg-[linear-gradient(180deg,rgba(255,42,42,0.06),rgba(15,18,24,0.7))] shadow-[0_0_0_1px_rgba(255,42,42,0.3),0_30px_80px_-20px_rgba(255,42,42,0.18)]" : "border border-line bg-bg-1/50 hover:border-red/40"}`}>
              <div className={`mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow ${tier.featured ? "text-red" : "text-ink-2"}`}>{tier.role}</div>
              <h3 className="mb-1.5 font-serif text-4xl font-medium leading-none">
                {tier.name_p1}{tier.nameJoined ? "" : " "}<em className="italic text-ink-1">{tier.name_em}</em>
              </h3>
              <div className="mb-6 flex items-baseline gap-2 border-b border-line pb-5">
                <span className="font-serif text-5xl font-medium leading-none">{tier.amt}</span>
                <span className="text-[13px] text-ink-2">{tier.per}</span>
              </div>
              <ul>
                {tier.feats.map((f, i) => (
                  <li key={i} className="flex gap-3 border-b border-line/50 py-2.5 text-sm leading-snug text-ink-1 last:border-b-0">
                    <span aria-hidden className="pt-1.5 text-[8px] text-red">◆</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <HorrorButton to="/rejestracja" variant={tier.variant} block className="!mt-6">
                {tier.cta}
              </HorrorButton>
            </div>
          ))}
        </div>
      </section>

      {/* Wall of patrons */}
      <section className="mx-auto mt-32 max-w-[1400px] px-5 lg:px-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-3.5 border-b border-line pb-6 lg:flex-row lg:items-end">
          <div>
            <Eyebrow accent="blue">{t("patroni.wall_eyebrow", "// ŚCIANA SEZONU 03 · ZAMKNIĘTA 31.12.2025")}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
              {t("patroni.wall_title_p1", "Ci, którzy")} <em className="italic text-ink-1">{t("patroni.wall_title_em", "byli tu pierwsi")}</em>.
            </h2>
          </div>
          <div className="font-mono text-[11px] uppercase tracking-mono text-ink-2">{t("patroni.wall_count", "327 PATRONÓW · 11 PRODUCENTÓW")}</div>
        </div>

        <div className="grid grid-cols-2 gap-1 border border-line bg-black/40 p-1 lg:grid-cols-6">
          {execNames.map((n) => (
            <div key={n} className="bg-bg-1/60 px-4 py-3.5 font-sans text-[14px] uppercase tracking-[0.05em] text-red transition-colors hover:bg-red/[0.08]">{n}</div>
          ))}
          {regularNames.map((n) => (
            <div key={n} className="bg-bg-1/60 px-4 py-3.5 font-serif text-[17px] italic text-ink-1 transition-colors hover:bg-red/[0.08] hover:text-ink-0">{n}</div>
          ))}
          {anonNames.map((n) => (
            <div key={n} className="bg-bg-1/60 px-4 py-3.5 font-serif text-[17px] italic text-ink-3 transition-colors hover:bg-red/[0.08]">{n}</div>
          ))}
          {moreNames.map((n) => (
            <div key={n} className="bg-bg-1/60 px-4 py-3.5 font-serif text-[17px] italic text-ink-1 transition-colors hover:bg-red/[0.08] hover:text-ink-0">{n}</div>
          ))}
          <div className="bg-bg-1/60 px-4 py-3.5 font-serif text-[17px] italic text-ink-3 transition-colors hover:bg-red/[0.08]">{t("patroni.wall_more", "+ 291 osób")}</div>
        </div>
        <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2">
          {t("patroni.wall_meta", "NAZWISKA POJAWIAJĄ SIĘ W KAŻDYM ODCINKU SEZONU · ANONIM = TYLKO NUMER · BEZ NACISKU")}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto mt-32 max-w-[1100px] px-5 lg:px-12">
        <Eyebrow>{t("patroni.faq_eyebrow", "CZĘSTE PYTANIA")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("patroni.faq_title_p1", "Zanim")} <em className="italic text-ink-1">{t("patroni.faq_title_em", "klikniesz")}</em>.
        </h2>
        <div className="mt-10">
          {faqs.map((f, i) => (
            <div key={i} className="border-t border-line py-6 last:border-b">
              <h4 className="mb-2 font-serif text-[22px] font-medium">
                {f.q_p1} <em className="italic text-ink-1">{f.q_em}</em>{f.q_p2 === "?" ? "?" : ` ${f.q_p2}`}
              </h4>
              <p className="text-sm font-light leading-relaxed text-ink-1">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h-32" />
    </>
  );
}
