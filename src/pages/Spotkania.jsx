import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

// Lokalny countdown do najbliższego spotkania (02.06.2026 23:00 CET).
function useCountdown(targetIso) {
  const target = useMemo(() => new Date(targetIso).getTime(), [targetIso]);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

export default function Spotkania() {
  const { t } = useTranslation();
  const cd = useCountdown("2026-06-02T23:00:00+02:00");

  const [activeTab, setActiveTab] = useState("all");
  const upTabs = [
    { key: "all", label: t("spotkania.tab_all", "Wszystkie") },
    { key: "online", label: t("spotkania.tab_online", "Online") },
    { key: "live", label: t("spotkania.tab_live", "Na żywo") },
    { key: "klan", label: t("spotkania.tab_klan", "Tylko Klan") },
  ];

  const featDetails = [
    { d: t("spotkania.feat_d1_l", "FORMAT"), v: t("spotkania.feat_d1_v", "Online (Discord stage + audio-only)") },
    { d: t("spotkania.feat_d2_l", "PROWADZI"), v: t("spotkania.feat_d2_v", "Marta Sobczak · reż.") },
    { d: t("spotkania.feat_d3_l", "CZAS TRWANIA"), v: t("spotkania.feat_d3_v", "90 min + 30 min Q&A") },
    { d: t("spotkania.feat_d4_l", "JĘZYK"), v: t("spotkania.feat_d4_v", "Polski · z napisami EN") },
  ];

  const events = [
    {
      day: "02", month: t("spotkania.mon_jun", "CZE"), type: "online",
      tag: t("spotkania.tag_ama", "AMA"), tagAccent: "red",
      title_p1: t("spotkania.e1_title_p1", "Z Katarzyną"), title_em: t("spotkania.e1_title_em", "Wieczorek"),
      sub_strong: t("spotkania.e1_sub_strong", "Online · Discord stage"), sub_rest: t("spotkania.e1_sub_rest", " · 23:00 CET · 90 min"),
      metaLabel: t("spotkania.meta_host", "PROWADZI"), metaVal: "M. Sobczak",
      seats: "134 / 500", seatsLabel: t("spotkania.seats_left", "POZOSTAŁO"),
      cta: t("spotkania.cta_signup", "Zapisz się"), ctaVariant: "primary", to: "/rejestracja",
    },
    {
      day: "14", month: t("spotkania.mon_jun", "CZE"), type: "live",
      tag: t("spotkania.tag_live", "LIVE"), tagAccent: "blue",
      title_p1: t("spotkania.e2_title_p1", "Premiera odsłuchowa „Pacjentka 23”"), title_em: t("spotkania.e2_title_em", "· Kino Iluzjon"),
      sub_strong: t("spotkania.e2_sub_strong", "Warszawa · sala kinowa, słuchawki"), sub_rest: t("spotkania.e2_sub_rest", " · 22:00 · 110 min + Q&A"),
      metaLabel: t("spotkania.meta_guests", "GOŚCIE"), metaVal: "M. Sobczak, K. Wieczorek",
      seats: "12 / 180", seatsLabel: t("spotkania.seats_left_price", "POZOSTAŁO · 35 zł"),
      cta: t("spotkania.cta_ticket", "Bilet"), ctaVariant: "primary", to: "#",
    },
    {
      day: "22", month: t("spotkania.mon_jun", "CZE"), type: "klan",
      tag: t("spotkania.tag_klan", "TYLKO KLAN"), tagAccent: "red",
      title_p1: t("spotkania.e3_title_p1", "Warsztat dźwiękowy"), title_em: t("spotkania.e3_title_em", "· P. Górski"),
      sub_strong: t("spotkania.e3_sub_strong", "Online · obecność live max 30 osób"), sub_rest: t("spotkania.e3_sub_rest", " · 20:00 · 3h"),
      metaLabel: t("spotkania.meta_slot", "SLOT-LIMIT"), metaVal: t("spotkania.e3_meta_v", "30 osób"),
      seats: t("spotkania.full", "PEŁNE"), seatsLabel: t("spotkania.waitlist", "LISTA REZERWOWA"), seatsFull: true,
      cta: t("spotkania.cta_full", "Pełne"), ctaVariant: "disabled", to: "#",
    },
    {
      day: "07", month: t("spotkania.mon_jul", "LIP"), type: "live",
      tag: t("spotkania.tag_live", "LIVE"), tagAccent: "blue",
      title_p1: t("spotkania.e4_title_p1", "Letnia czytanka"), title_em: t("spotkania.e4_title_em", "w lesie Kabacki"),
      sub_strong: t("spotkania.e4_sub_strong", "Warszawa · plener nocny, max 80 osób"), sub_rest: t("spotkania.e4_sub_rest", " · 22:00 · 4h"),
      metaLabel: t("spotkania.meta_readers", "CZYTAJĄ"), metaVal: "A. Karpiński, Z. Lange",
      seats: "23 / 80", seatsLabel: t("spotkania.seats_left_price75", "POZOSTAŁO · 75 zł"),
      cta: t("spotkania.cta_ticket", "Bilet"), ctaVariant: "primary", to: "#",
    },
    {
      day: "18", month: t("spotkania.mon_jul", "LIP"), type: "online",
      tag: t("spotkania.tag_ama", "AMA"), tagAccent: "red",
      title_p1: t("spotkania.e5_title_p1", "Z Jakubem"), title_em: t("spotkania.e5_title_em", "Borkiem · scenariusz"),
      sub_strong: t("spotkania.e5_sub_strong", "Online · Discord stage"), sub_rest: t("spotkania.e5_sub_rest", " · 22:00 · 90 min"),
      metaLabel: t("spotkania.meta_host", "PROWADZI"), metaVal: "T. Reich",
      seats: "412 / 500", seatsLabel: t("spotkania.seats_left", "POZOSTAŁO"),
      cta: t("spotkania.cta_signup", "Zapisz się"), ctaVariant: "primary", to: "/rejestracja",
    },
    {
      day: "09", month: t("spotkania.mon_aug", "SIE"), type: "live",
      tag: t("spotkania.tag_live_krakow", "LIVE · KRAKÓW"), tagAccent: "blue",
      title_p1: t("spotkania.e6_title_p1", "Festiwal „Mokry Pąsek”"), title_em: t("spotkania.e6_title_em", "· OBSKURA scena audio"),
      sub_strong: t("spotkania.e6_sub_strong", "Kraków · Nowa Huta, hala dźwiękowa"), sub_rest: t("spotkania.e6_sub_rest", " · 21:00 · cały wieczór"),
      metaLabel: t("spotkania.meta_team", "CAŁY ZESPÓŁ"), metaVal: t("spotkania.e6_meta_v", "+ niespodzianki"),
      seats: t("spotkania.preorder", "PREORDER"), seatsLabel: t("spotkania.from_date", "OD 15.06"),
      cta: t("spotkania.cta_notify", "Notyfikacja"), ctaVariant: "ghost", to: "#",
    },
  ];
  const filtered = activeTab === "all" ? events : events.filter((e) => e.type === activeTab);

  const past = [
    {
      date: t("spotkania.past1_date", "04.05.2026 · ONLINE · 217 OSÓB"),
      h_p1: t("spotkania.past1_h_p1", "AMA z Piotrem"), h_em: t("spotkania.past1_h_em", "Górskim · dźwięk"),
      p: t("spotkania.past1_p", "Inżynier dźwięku Obskury o tym, dlaczego mixujemy w 7.1, kiedy używamy hydrofonów, i jak nagrać oddech bez oddychania."),
      stats: ["2h 14min", "4.8 ★", t("spotkania.past1_stat3", "NAGRANIE DLA KLUBU")],
      link: t("spotkania.past_listen", "Posłuchaj nagrania →"),
    },
    {
      date: t("spotkania.past2_date", "12.04.2026 · KINO ILUZJON · 180 OSÓB"),
      h_p1: t("spotkania.past2_h_p1", "Premiera"), h_em: t("spotkania.past2_h_em", "„Łańcuch Fenrira”"),
      p: t("spotkania.past2_p", "Pierwsze publiczne odsłuchanie 8. odcinka sezonu 3. Pokaz w totalnej ciemności + Q&A z reżyserem T. Reichem i ekspertem od mitologii UJ."),
      stats: ["3h", "5.0 ★", t("spotkania.past2_stat3", "WYPRZEDANE")],
      link: t("spotkania.past_gallery", "Galeria + transkrypt →"),
    },
    {
      date: t("spotkania.past3_date", "15.03.2026 · ONLINE · 412 OSÓB"),
      h_p1: t("spotkania.past3_h_p1", "Q&A z"), h_em: t("spotkania.past3_h_em", "Nadią O. · anonimowo"),
      p: t("spotkania.past3_p", "Jedyna jak dotąd publiczna rozmowa z naszą najbardziej tajemniczą narratorką. Tylko głos, bez kamery, bez prawdziwego imienia."),
      stats: ["1h 47min", "4.9 ★", t("spotkania.past3_stat3", "NAGRANIE DLA KLANU")],
      link: t("spotkania.past_listen", "Posłuchaj nagrania →"),
    },
  ];

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Eyebrow>{t("spotkania.eyebrow", "// SPOTKANIA · LIVE · ONLINE · ARCHIWUM")}</Eyebrow>
          <h1 className="my-5 font-serif text-[clamp(48px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.02em]">
            {t("spotkania.title_p1", "Słuchać")} <em className="italic text-ink-1">{t("spotkania.title_em", "razem")}</em>.
            <br />
            {t("spotkania.title_p2", "Patrzeć w oczy.")}
          </h1>
          <p className="max-w-[620px] text-[17px] font-light leading-relaxed text-ink-1">
            {t("spotkania.lead", "Raz w miesiącu organizujemy spotkanie — z narratorem, reżyserką, scenarzystą. Czasem w studio, czasem w kinie, czasem online o trzeciej w nocy. Bez wykładów, tylko rozmowa o tym, dlaczego coś się komuś przyśniło.")}
          </p>
        </div>
      </header>

      {/* Featured event */}
      <section className="mx-auto mt-16 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("spotkania.feat_eyebrow", "NAJBLIŻSZE · 02 CZERWCA 2026")}</Eyebrow>
        <div className="mt-8 grid items-stretch overflow-hidden border border-line bg-bg-1/60 lg:grid-cols-[380px_1fr]">
          <div className="relative min-h-[220px] bg-cover bg-center lg:min-h-[360px]" style={{ backgroundImage: "url('/images/img-tunnel.webp')" }}>
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(5,6,8,0.3), rgba(5,6,8,0.7))" }} />
            <div className="absolute left-5 top-5 z-[2] flex items-center gap-2 bg-red px-3 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-white shadow-neon-red">
              <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-white" />
              {t("spotkania.feat_live", "ZAPISY AKTYWNE")}
            </div>
            <div className="absolute inset-x-6 bottom-6 z-[2] font-serif text-ink-0">
              <div className="mb-1 font-mono text-[10px] uppercase tracking-eyebrow text-red">{t("spotkania.feat_day", "WTOREK · 23:00 CET")}</div>
              <div className="text-[48px] italic leading-none">02.06</div>
              <div className="mt-3 flex gap-3 font-mono text-[11px] uppercase tracking-mono text-ink-1">
                <span><strong className="text-ink-0">{cd.days}</strong>d</span>
                <span><strong className="text-ink-0">{String(cd.hours).padStart(2, "0")}</strong>h</span>
                <span><strong className="text-ink-0">{String(cd.mins).padStart(2, "0")}</strong>m</span>
                <span><strong className="text-ink-0">{String(cd.secs).padStart(2, "0")}</strong>s</span>
              </div>
            </div>
          </div>
          <div className="p-6 lg:p-10">
            <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-red">{t("spotkania.feat_kicker", "AMA · KATARZYNA WIECZOREK · NARRATORKA SEZONU 03")}</div>
            <h2 className="mb-4 font-serif text-[clamp(28px,4vw,40px)] font-medium leading-tight tracking-[-0.01em]">
              {t("spotkania.feat_h_p1", "„Skąd")} <em className="italic text-ink-1">{t("spotkania.feat_h_em", "biorę")}</em> {t("spotkania.feat_h_p2", "ten głos.”")}
            </h2>
            <p className="mb-4 text-sm font-light leading-relaxed text-ink-1">
              {t("spotkania.feat_p", "Otwarte spotkanie z Katarzyną Wieczorek po finale trzeciego sezonu. 90 minut rozmowy — o tym, jak przygotowuje się do sceny, dlaczego pierwszego dnia w studio milczy, co robi gdy nagranie nie wychodzi. Twoje pytania zbieramy do 30 maja w wątku na forum.")}
            </p>
            <div className="my-6 grid grid-cols-2 gap-4 border-y border-line py-4">
              {featDetails.map((d) => (
                <div key={d.d} className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2">
                  {d.d}<strong className="mt-1 block text-[13px] tracking-[0.1em] text-ink-0">{d.v}</strong>
                </div>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <HorrorButton to="/rejestracja">{t("spotkania.feat_cta1", "Zapisz się (bezpłatne)")}</HorrorButton>
              <HorrorButton to="/forum" variant="ghost">{t("spotkania.feat_cta2", "Wątek z pytaniami")}</HorrorButton>
              <div className="font-mono text-[11px] uppercase tracking-[0.15em] text-ink-2">
                {t("spotkania.feat_seats_p1", "POZOSTAŁO")} <strong className="text-red">134 / 500</strong> {t("spotkania.feat_seats_p2", "MIEJSC")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming list */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <div>
            <Eyebrow>{t("spotkania.up_eyebrow", "NADCHODZĄCE · CZERWIEC–WRZESIEŃ 2026")}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
              {t("spotkania.up_title_p1", "8")} <em className="italic text-ink-1">{t("spotkania.up_title_em", "spotkań")}</em> {t("spotkania.up_title_p2", "w kalendarzu.")}
            </h2>
          </div>
          <div className="flex flex-wrap gap-6">
            {upTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex min-h-[44px] items-center border-b py-1.5 font-mono text-[11px] uppercase tracking-mono transition-colors ${activeTab === tab.key ? "border-red text-ink-0" : "border-transparent text-ink-2 hover:text-ink-0"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((e) => (
            <div key={`${e.day}-${e.month}-${e.title_em}`} className="grid grid-cols-1 items-center gap-3 border border-line bg-bg-1/40 px-5 py-5 transition-colors hover:border-red/30 hover:bg-bg-1/70 lg:grid-cols-[100px_1fr_200px_180px_auto] lg:gap-6 lg:px-6">
              <div className="flex items-center gap-3 lg:block lg:border-r lg:border-line lg:pr-4 lg:text-center">
                <div className="font-serif text-4xl leading-none">{e.day}</div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{e.month}</div>
              </div>
              <div>
                <div className="mb-1 font-serif text-[22px] leading-tight">
                  <span className={`mr-2.5 inline-block px-2 py-0.5 align-middle font-mono text-[9px] tracking-eyebrow ${e.tagAccent === "blue" ? "bg-blue/10 text-blue" : "bg-red/10 text-red"}`}>{e.tag}</span>
                  {e.title_p1} <em className="italic text-ink-1">{e.title_em}</em>
                </div>
                <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2"><span className="text-ink-1">{e.sub_strong}</span>{e.sub_rest}</div>
              </div>
              <div className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-2">
                {e.metaLabel}<div className="font-serif text-sm italic normal-case tracking-normal text-ink-0">{e.metaVal}</div>
              </div>
              <div className={`text-left font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2 lg:text-right ${e.seatsFull ? "" : ""}`}>
                <span className={`block text-sm ${e.seatsFull ? "text-ink-3" : "text-ink-0"}`}>{e.seats}</span>{e.seatsLabel}
              </div>
              {e.ctaVariant === "disabled" ? (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center border border-line px-5 py-3 text-center font-sans text-xs font-semibold uppercase tracking-[0.18em] text-ink-3">{e.cta}</span>
              ) : (
                <HorrorButton to={e.to} variant={e.ctaVariant} className="!px-5 !py-3">{e.cta}</HorrorButton>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Past events */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("spotkania.past_eyebrow", "// ARCHIWUM · ZAGRANE")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("spotkania.past_title_p1", "Co")} <em className="italic text-ink-1">{t("spotkania.past_title_em", "przeszło")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {past.map((p, i) => (
            <article key={i} className="border border-line bg-bg-1/40 p-6 transition-colors hover:border-red/30">
              <div className="mb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">{p.date}</div>
              <h4 className="mb-2 font-serif text-[22px] font-medium leading-tight">{p.h_p1} <em className="italic text-ink-1">{p.h_em}</em></h4>
              <p className="mb-3.5 text-[13px] font-light leading-snug text-ink-1">{p.p}</p>
              <div className="flex gap-4 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
                {p.stats.map((s, j) => (
                  <span key={j} className={j < 2 ? "text-ink-0" : ""}>{s}</span>
                ))}
              </div>
              <a href="#" className="mt-3.5 inline-flex min-h-[44px] items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-red transition-colors hover:text-ink-0">{p.link}</a>
            </article>
          ))}
        </div>
        <div className="mt-10 text-center">
          <HorrorButton to="/archiwum" variant="ghost">{t("spotkania.past_all", "Wszystkie 23 archiwalne nagrania →")}</HorrorButton>
        </div>
      </section>

      <div className="h-32" />
    </>
  );
}
