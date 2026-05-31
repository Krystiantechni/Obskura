import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";

export default function Press() {
  const { t } = useTranslation();

  const quickRows = [
    { l: t("prasa.contact_main", "Główny kontakt"), v: "media@obskura.audio", link: true },
    { l: t("prasa.contact_person", "Osoba"), v: "Marta Sobczak" },
    { l: t("prasa.contact_phone", "Telefon"), v: "+48 22 489 12 03" },
    { l: t("prasa.contact_time", "Czas odpowiedzi"), v: t("prasa.contact_time_val", "do 24h") },
    { l: t("prasa.contact_interviews", "Wywiady / sesje"), v: t("prasa.contact_interviews_val", "3 dni naprzód") },
  ];

  const stats = [
    { n: "147", em: true, lab: "// ODCINKI", p: t("prasa.stat1", "3 sezony od 2021. Średnia długość: 56 min. Najdłuższy: 2h 14min („Łańcuch Fenrira”).") },
    { n: "2.4M", lab: "// SŁUCHACZY / MIESIĄC", p: t("prasa.stat2", "Aktywni słuchacze (przynajmniej 1 odcinek dokończony). 67 krajów. Najwięcej: PL, DE, UK.") },
    { n: "47 800", lab: "// PŁACĄCY CZŁONKOWIE", p: t("prasa.stat3", "Subskrybenci Klubu (Próg / Solo / Klan) + Patroni sezonowi. 73% rocznych, 27% miesięcznych.") },
    { n: "4.9 ★", lab: "// APPLE PODCASTS", p: t("prasa.stat4", "147 800 ocen. #1 w kategorii „Drama” w PL od 14 miesięcy. Top 5 EU.") },
    { n: "38", lab: "// NARRATORZY", p: t("prasa.stat5", "12 stałych, 26 gościnnych. Wszystkie nagrania w PL, 4 odcinki testowo w EN.") },
    { n: "3", lab: "// STUDIA NAGRANIOWE", p: t("prasa.stat6", "Gdańsk (główne), Warszawa (mix), Kraków (foley). 14 osób w zespole technicznym.") },
    { n: "412 280", lab: "// ZŁ ROCZNIE NA TWÓRCÓW", p: t("prasa.stat7", "Tyle wypłacamy aktorom, scenarzystom, reżyserom. Najwyższe stawki w polskim audio.") },
    { n: "7", lab: "// NAGRODY", p: t("prasa.stat8", "Grand Press Digital '24, KTR '25 (3×), Webby Honoree '24, Press Club Polska '23, '24.") },
  ];

  const downloads = [
    {
      h1: t("prasa.dl1_h1", "Logotypy"),
      em: t("prasa.dl1_em", "(SVG + PNG)"),
      p: t("prasa.dl1_p", "Logo główne, sygnet, wersja monochromatyczna i invert. Wektor + raster do 4K."),
      size: "12 PLIKÓW · 8.4 MB · ZIP",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <rect x="2" y="2" width="14" height="14" />
          <path d="M2 12 L6 8 L10 12 L14 6 L16 9" />
          <circle cx="6" cy="6" r="1.5" />
        </svg>
      ),
    },
    {
      h1: t("prasa.dl2_h1", "One-pager"),
      em: t("prasa.dl2_em", "(PDF)"),
      p: t("prasa.dl2_p", "Jednostronicowe streszczenie firmy, faktów i zespołu. Po polsku i angielsku."),
      size: "2 PLIKI · 1.2 MB · PDF",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <rect x="2" y="3" width="14" height="11" />
          <path d="M2 3 L9 9 L16 3" />
        </svg>
      ),
    },
    {
      h1: t("prasa.dl3_h1", "Zdjęcia"),
      em: t("prasa.dl3_em", "zespołu & studia"),
      p: t("prasa.dl3_p", "56 zdjęć wysokiej rozdzielczości — portrety twórców, sesje nagraniowe, mix."),
      size: "56 ZDJĘĆ · 184 MB · ZIP",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <circle cx="9" cy="9" r="6" />
          <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        </svg>
      ),
    },
    {
      h1: t("prasa.dl4_h1", "Próbki"),
      em: t("prasa.dl4_em", "audio (WAV)"),
      p: t("prasa.dl4_p", "10 minut z 5 odcinków — można cytować bezpośrednio w audycji lub artykule online."),
      size: "5 PLIKÓW · 320 MB · WAV",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <path d="M3 6 L9 6 M3 9 L13 9 M3 12 L11 12" />
          <circle cx="14" cy="6" r="1" />
          <circle cx="15" cy="9" r="1" />
          <circle cx="13" cy="12" r="1" />
        </svg>
      ),
    },
    {
      h1: t("prasa.dl5_h1", "Screeny"),
      em: t("prasa.dl5_em", "aplikacji"),
      p: t("prasa.dl5_p", "iOS / Android / Web — wszystkie ekrany w wersji dark mode. Mockupy do umieszczenia w artykule."),
      size: "23 SCREENY · 28 MB · ZIP",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <rect x="2" y="4" width="14" height="10" />
          <path d="M6 14 V16 H12 V14 M7 8 L11 8 M7 10 L9 10" />
        </svg>
      ),
    },
    {
      h1: t("prasa.dl6_h1", "Brand"),
      em: t("prasa.dl6_em", "guidelines"),
      p: t("prasa.dl6_p", "Typografia, kolory, użycie logo, ton komunikacji. Pełen manual dla redakcji i partnerów."),
      size: "36 STRON · 14 MB · PDF",
      icon: (
        <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-[18px] w-[18px]">
          <rect x="3" y="3" width="12" height="12" />
          <path d="M6 6 L6 12 M9 6 L9 12 M12 6 L12 12" />
        </svg>
      ),
    },
  ];

  const swatches = [
    { name: "ABYSS", hex: "#050608", bg: "#050608", text: "#c9c4b8", hexColor: "#6e6a60" },
    { name: "CARBON", hex: "#0A0D12", bg: "#0a0d12", text: "#c9c4b8", hexColor: "#6e6a60" },
    { name: "SIGNAL RED", hex: "#FF2A2A", bg: "#ff2a2a", text: "#ffffff", hexColor: "rgba(255,255,255,0.7)" },
    { name: "FOG BLUE", hex: "#5FA8FF", bg: "#5fa8ff", text: "#ffffff", hexColor: "rgba(255,255,255,0.7)" },
    { name: "BONE", hex: "#F4F1EA", bg: "#f4f1ea", text: "#050608", hexColor: "#050608" },
  ];

  const releases = [
    {
      date: "23.05.2026",
      h1: t("prasa.rel1_h1", "Finał sezonu 03:"),
      em: t("prasa.rel1_em", "„Mgła nad Wisłoujściem”"),
      h2: t("prasa.rel1_h2", "z udziałem Katarzyny Wieczorek"),
      p: t("prasa.rel1_p", "Premiera 12. odcinka 3. sezonu zamyka roczny cykl produkcyjny. Pełen pakiet prasowy zawiera scenariusz, foto z planu, oraz dłuższy wywiad z reżyserką Martą Sobczak."),
    },
    {
      date: "14.04.2026",
      h1: t("prasa.rel2_h1", "Obskura podpisuje umowę dystrybucyjną z"),
      em: t("prasa.rel2_em", "BBC Sounds"),
      h2: "",
      p: t("prasa.rel2_p", "4 odcinki sezonu 3 (wersje EN) trafią do BBC Sounds na zasadzie wymiany — w zamian BBC Sounds udostępni 3 brytyjskie produkcje audio dla polskich słuchaczy."),
    },
    {
      date: "12.03.2026",
      h1: t("prasa.rel3_h1", "2 nagrody KTR 2025:"),
      em: t("prasa.rel3_em", "Najlepsze audio"),
      h2: t("prasa.rel3_h2", "i Najlepszy mix dźwięku"),
      p: t("prasa.rel3_p", "Obskura zdobywa dwie nagrody na 35. KTR — za serial „Pacjentka 23” (najlepsze audio) i mix odcinka „Łańcuch Fenrira” (Piotr Górski, najlepszy mix)."),
    },
    {
      date: "04.02.2026",
      h1: t("prasa.rel4_h1", "Sezon 03 startuje 14 lutego —"),
      em: t("prasa.rel4_em", "12 odcinków, 11h materiału"),
      h2: "",
      p: t("prasa.rel4_p", "Trzeci sezon wystartuje od premiery „Maszynownia” 14 lutego. Plan szczegółowy, harmonogram premier i lista narratorów."),
    },
  ];

  const coverage = [
    { src: "GAZETA WYBORCZA · 24.05.2026", quote: t("prasa.cov1", "Najlepsze polskie audio od lat. Słychać każdy oddech, każdy szept. Słuchawki obowiązkowe."), author: "— ALEKSANDRA KWIATKOWSKA · KULTURA" },
    { src: "DWUTYGODNIK · 04/2026", quote: t("prasa.cov2", "Obskura robi dla audio horroru to, co Netflix zrobił dla seriali — dowodzi, że gatunek może być sztuką."), author: "— MICHAŁ NOWACKI · TEORIA KULTURY" },
    { src: "VICE POLSKA · 12.03.2026", quote: t("prasa.cov3", "Nie spałem trzy dni po „Pacjentce 23”. Coś w tym dźwięku jest po prostu nieludzkie."), author: "— PIOTR KARDAS · KULTURA" },
    { src: "PRESS · NR 03/2026", quote: t("prasa.cov4", "Niewielki zespół, ogromna jakość. To dziś najbardziej obiecujący niezależny gracz w audio na rynku."), author: "— REDAKCJA · BIZNES MEDIÓW" },
    { src: "THE GUARDIAN · 18.04.2026 (EN)", quote: t("prasa.cov5", "Polish horror audio that rivals anything coming out of the UK or US. Get your headphones ready."), author: "— SARAH BRYAN · PODCAST CRITIC" },
    { src: "PODCAST MAGAZINE · 05/2026", quote: t("prasa.cov6", "A standard-setting work in binaural narrative. The kind of show you'll want to listen to in the dark."), author: "— DAN MISENER · CRITIC AT LARGE" },
  ];

  return (
    <>
      {/* Hero */}
      <header className="border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-end gap-10 sm:grid-cols-[1.3fr_1fr] sm:gap-12 lg:gap-14">
          <div>
            <Eyebrow>{t("prasa.hero_eyebrow", "// PRASA · MEDIA · WSPÓŁPRACA")}</Eyebrow>
            <h1 className="my-4 font-serif text-[clamp(48px,6vw,88px)] font-medium leading-[0.95] tracking-[-0.02em]">
              {t("prasa.hero_title_p1", "Wszystko, czego potrzebujesz,")} <em className="italic text-ink-1">{t("prasa.hero_title_em", "żeby o nas napisać")}</em>.
            </h1>
            <p className="text-[15px] font-light leading-relaxed text-ink-1 sm:max-w-[560px] sm:text-[16px]">
              {t("prasa.hero_lead", "Logotypy, fakty, kontakty, gotowe cytaty. Jeśli czegoś tu nie ma — napisz, dostarczymy w 24h. Wszystkie materiały dostępne bez licencji do publikacji prasowych i krytyki.")}
            </p>
          </div>
          <div className="border border-line bg-bg-1/60 p-5 sm:p-7">
            <h4 className="mb-4 font-mono text-[10px] uppercase tracking-eyebrow text-red">// KONTAKT PRASOWY</h4>
            {quickRows.map((r, i) => (
              <div key={r.l} className={`flex flex-wrap items-center justify-between gap-x-4 py-3 ${i === 0 ? "border-t border-line" : "border-t border-line/50"}`}>
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-2">{r.l}</span>
                <span className="font-serif text-[16px] italic text-ink-0 sm:text-[18px]">
                  {r.link ? <a href={`mailto:${r.v}`} className="inline-flex min-h-[44px] items-center border-b border-red text-ink-0 break-all">{r.v}</a> : r.v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* About */}
      <section className="mx-auto mt-14 max-w-[1400px] px-5 sm:mt-20 lg:px-12">
        <Eyebrow>{t("prasa.about_eyebrow", "O FIRMIE · BOILERPLATE")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("prasa.about_title_p1", "Krótko —")} <em className="italic text-ink-2">{t("prasa.about_title_em", "kim jesteśmy")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="mb-4 text-[15px] font-light leading-relaxed text-ink-1">
              <strong className="font-medium text-ink-0">OBSKURA Audio sp. z o.o.</strong> {t("prasa.about_p1", "to niezależne studio nagrywające oryginalne audio horror w języku polskim. Założone w 2021 roku w Gdańsku przez Martę Sobczak (była Trójka, BBC Sounds) i Piotra Górskiego (inżynier dźwięku).")}
            </p>
            <p className="mb-4 text-[15px] font-light leading-relaxed text-ink-1">
              {t("prasa.about_p2a", "Specjalizujemy się w")} <strong className="font-medium text-ink-0">{t("prasa.about_p2b", "dźwięku binauralnym 3D")}</strong> {t("prasa.about_p2c", "i długich, narracyjnych odcinkach (40–90 min). Każdy odcinek to oryginalny scenariusz, nagrywany w jednym z trzech naszych studiów w Gdańsku, Warszawie i Krakowie.")}
            </p>
            <p className="mb-4 text-[15px] font-light leading-relaxed text-ink-1">
              {t("prasa.about_p3", "Stworzyliśmy 147 odcinków w 3 sezonach. Słuchają nas w 67 krajach. Pracujemy z 38 narratorami. Mamy 2.4M słuchaczy miesięcznie i klub 47 800 płacących członków.")}
            </p>
          </div>
          <div>
            <blockquote className="my-6 border-l-2 border-red px-5 py-4 font-serif text-[22px] italic leading-tight text-ink-0 sm:my-8 sm:px-6 sm:py-5 sm:text-[28px]">
              <span className="text-4xl leading-[0] text-red sm:text-5xl">&ldquo;</span>{t("prasa.about_quote", "Nie nagrywamy horroru. Nagrywamy ciszę, w której można usłyszeć, że ktoś tam jest.")}
            </blockquote>
            <p className="mb-4 text-[15px] font-light leading-relaxed text-ink-1">
              {t("prasa.about_p4a", "Co nas wyróżnia:")} <strong className="font-medium text-ink-0">{t("prasa.about_p4b", "brak kompromisu na dźwięku")}</strong>. {t("prasa.about_p4c", "Każdy odcinek mixowany do binauralnego 3D (8 ścieżek, czasem 16), nagrywany w jednym ujęciu z aktorami w fizycznej przestrzeni, nie w boxie lektorskim.")}
            </p>
            <p className="text-[15px] font-light leading-relaxed text-ink-1">
              <strong className="font-medium text-ink-0">{t("prasa.about_p5a", "Brak reklam zewnętrznych.")}</strong> {t("prasa.about_p5b", "Klub, patroni i krótkie self-promo — finansują nas tylko ludzie, którzy nas słuchają.")}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-24 lg:px-12">
        <Eyebrow accent="blue">{t("prasa.stats_eyebrow", "DANE · STAN NA MAJ 2026")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("prasa.stats_title_p1", "Liczby")} <em className="italic text-ink-2">{t("prasa.stats_title_em", "bez ozdób")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.lab} className="border border-line bg-bg-1/50 p-4 sm:p-7">
              <div className="font-serif text-[32px] font-medium leading-none sm:text-[48px]">
                {s.em ? <em className="not-italic text-red">{s.n}</em> : s.n}
              </div>
              <div className="mb-2.5 mt-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2 sm:my-2 sm:text-[10px]">{s.lab}</div>
              <p className="text-[11px] font-light leading-snug text-ink-1 sm:text-[12px]">{s.p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Downloads */}
      <section className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-24 lg:px-12">
        <Eyebrow>{t("prasa.dl_eyebrow", "PLIKI DO POBRANIA")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("prasa.dl_title_p1", "Zestaw")} <em className="italic text-ink-2">{t("prasa.dl_title_em", "prasowy")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {downloads.map((d, i) => (
            <a
              key={i}
              href="#"
              className="group relative block border border-line bg-bg-1/50 p-5 transition-all duration-200 hover:border-red/40 hover:bg-red/[0.04] sm:p-7"
            >
              <span className="absolute right-5 top-5 text-ink-3 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-red sm:right-7 sm:top-7">
                <Download size={14} />
              </span>
              <div className="mb-4 grid h-10 w-10 place-items-center border border-red text-red sm:mb-5">{d.icon}</div>
              <h4 className="mb-2 font-serif text-[20px] font-medium sm:text-[22px]">
                {d.h1} <em className="italic text-ink-1">{d.em}</em>
              </h4>
              <p className="mb-3 text-[13px] font-light leading-snug text-ink-1">{d.p}</p>
              <div className="font-mono text-[10px] uppercase tracking-mono text-ink-3">{d.size}</div>
            </a>
          ))}
        </div>
      </section>

      {/* Brand colors */}
      <section className="mx-auto mt-12 max-w-[1400px] px-5 sm:mt-16 lg:px-12">
        <Eyebrow accent="blue">{t("prasa.palette_eyebrow", "PALETA · 5 KOLORÓW")}</Eyebrow>
        <div className="mt-5 grid grid-cols-3 gap-2 border border-line bg-black/30 p-2 sm:gap-3 sm:p-3 lg:grid-cols-5">
          {swatches.map((s) => (
            <div key={s.name} className="relative min-h-[100px] px-3 py-5 sm:min-h-[120px] sm:px-4 sm:py-6" style={{ background: s.bg }}>
              <span className="font-mono text-[9px] uppercase tracking-mono sm:text-[10px]" style={{ color: s.text }}>{s.name}</span>
              <span className="absolute bottom-3 left-3 font-mono text-[10px] tracking-[0.1em] sm:bottom-4 sm:left-4 sm:text-[11px]" style={{ color: s.hexColor }}>{s.hex}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Press releases */}
      <section className="mx-auto mt-16 max-w-[1100px] px-5 sm:mt-24 lg:px-12">
        <Eyebrow>{t("prasa.releases_eyebrow", "// KOMUNIKATY PRASOWE · 2025–2026")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("prasa.releases_title_p1", "Najnowsze")} <em className="italic text-ink-2">{t("prasa.releases_title_em", "wiadomości")}</em>.
        </h2>
        <div className="mt-8">
          {releases.map((r, i) => (
            <div
              key={i}
              className="grid grid-cols-1 items-start gap-2 border-t border-line py-5 last:border-b sm:grid-cols-[120px_1fr_auto] sm:gap-8 sm:py-7"
            >
              <div className="font-mono text-[11px] uppercase tracking-mono text-ink-2">{r.date}</div>
              <div>
                <h3 className="mb-2 font-serif text-[22px] font-medium leading-tight sm:text-[26px]">
                  {r.h1} <em className="italic text-ink-1">{r.em}</em> {r.h2}
                </h3>
                <p className="text-[13px] font-light leading-snug text-ink-1 sm:text-[14px]">{r.p}</p>
              </div>
              <a href="#" className="inline-flex min-h-[44px] items-center whitespace-nowrap font-mono text-[10px] uppercase tracking-mono text-red transition-colors hover:text-white">
                {t("prasa.releases_dl", "POBIERZ PDF →")}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Coverage */}
      <section className="mx-auto mt-16 max-w-[1400px] px-5 pb-16 sm:mt-24 sm:pb-24 lg:px-12">
        <Eyebrow accent="blue">{t("prasa.coverage_eyebrow", "// MÓWIĄ O NAS")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("prasa.coverage_title_p1", "Krytyka")} <em className="italic text-ink-2">{t("prasa.coverage_title_em", "i recenzje")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {coverage.map((c, i) => (
            <div key={i} className="border border-line bg-bg-1/40 p-5 transition-colors hover:border-red/40 sm:p-7">
              <div className="mb-3.5 font-mono text-[10px] uppercase tracking-mono text-red">{c.src}</div>
              <div className="mb-4 font-serif text-[18px] italic leading-snug text-ink-0 sm:text-[20px]">
                <span className="text-red">&ldquo;</span>{c.quote}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-2">{c.author}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
