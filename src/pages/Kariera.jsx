import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

export default function Kariera() {
  const { t } = useTranslation();

  const values = [
    {
      num: "// 01",
      h1: t("kariera.val1_h1", "Praca"),
      em: t("kariera.val1_em", "jest cicha"),
      p: t("kariera.val1_p", "Nie mamy open space. Każdy ma swój pokój albo studio. Skupienie ma swoje fizyczne miejsce. Slack tylko do koordynacji, nie do pogawędek."),
      anti: t("kariera.val1_anti", "jeśli lubisz energię „cały zespół w jednej sali, muzyka w tle, ciągłe rozmowy”. My to wyłączamy."),
    },
    {
      num: "// 02",
      h1: t("kariera.val2_h1", "Decyzje"),
      em: t("kariera.val2_em", "z premedytacją"),
      p: t("kariera.val2_p", "Każda większa decyzja przechodzi przez 48-godzinną pauzę. Bez pomysłów rzucanych na meetingu i akceptowanych w tym samym tygodniu. Wszystko ważne pisze się."),
      anti: t("kariera.val2_anti", "jeśli pasjonuje cię move-fast-break-things. Tutaj robimy odwrotnie."),
    },
    {
      num: "// 03",
      h1: t("kariera.val3_h1", "Stawki"),
      em: t("kariera.val3_em", "uczciwe i jawne"),
      p: t("kariera.val3_p", "Wszystkie pensje są w wewnętrznej tabeli widoczne dla każdego. Bo wiem, ile zarabia osoba obok ciebie. Podwyżki — algorytmem, raz na pół roku."),
      anti: t("kariera.val3_anti", "jeśli wolisz negocjować indywidualnie i pilnować, żeby koledzy nie wiedzieli ile dostajesz."),
    },
    {
      num: "// 04",
      h1: t("kariera.val4_h1", "Czas to"),
      em: t("kariera.val4_em", "twoja waluta"),
      p: t("kariera.val4_p", "25 dni urlopu plus 5 dni „wolnej myśli” (bez pytań, bez tłumaczenia). Praca 4-dniowa od 2024, czwartek = piątek. Po 18:00 telefon wyłączony — żelazna zasada."),
      anti: t("kariera.val4_anti", "jeśli chcesz pokazać się od strony „pracuję po nocach”. To nie miejsce na heroiczne nadgodziny."),
    },
  ];

  const roles = [
    {
      ttl: t("kariera.role1_ttl", "Inżynier dźwięku"),
      em: t("kariera.role1_em", "· senior"),
      sub: t("kariera.role1_sub", "Mix binauralny, post-produkcja, ścisła współpraca z Piotrem Górskim. Pełen etat."),
      meta: [
        { l: t("kariera.role1_m1_l", "DOŚWIADCZENIE"), v: t("kariera.role1_m1_v", "5+ lat audio") },
        { l: t("kariera.role1_m2_l", "LOKALIZACJA"), v: t("kariera.role1_m2_v", "Gdańsk · studio") },
        { l: t("kariera.role1_m3_l", "WIDEŁKI"), v: t("kariera.role1_m3_v", "12 — 16 tys. zł") },
        { l: t("kariera.role1_m4_l", "PILNE"), v: t("kariera.role1_m4_v", "do 15.06.2026"), urgent: true },
      ],
    },
    {
      ttl: t("kariera.role2_ttl", "Scenarzysta / scenarzystka"),
      em: t("kariera.role2_em", "· freelance"),
      sub: t("kariera.role2_sub", "Pisanie scenariuszy odcinków (40–90 min). Dwa pewne odcinki + opcje. Specjalizacja: psychologiczny + true horror."),
      meta: [
        { l: t("kariera.role2_m1_l", "DOŚWIADCZENIE"), v: t("kariera.role2_m1_v", "Portfolio + 2 referencje") },
        { l: t("kariera.role2_m2_l", "LOKALIZACJA"), v: t("kariera.role2_m2_v", "Zdalnie · cała Polska") },
        { l: t("kariera.role2_m3_l", "STAWKA"), v: t("kariera.role2_m3_v", "14–18 tys. zł / odc.") },
        { l: t("kariera.role2_m4_l", "DEADLINE"), v: t("kariera.role2_m4_v", "do 30.06.2026") },
      ],
    },
    {
      ttl: t("kariera.role3_ttl", "Reżyser"),
      em: t("kariera.role3_em", "dźwięku"),
      sub: t("kariera.role3_sub", "Prowadzenie sesji nagraniowych, praca z aktorami, supervisor mixu. Następca M. Sobczak dla wybranych odcinków."),
      meta: [
        { l: t("kariera.role3_m1_l", "DOŚWIADCZENIE"), v: t("kariera.role3_m1_v", "3+ lata radio / podcast") },
        { l: t("kariera.role3_m2_l", "LOKALIZACJA"), v: t("kariera.role3_m2_v", "Gdańsk / hybryda") },
        { l: t("kariera.role3_m3_l", "WIDEŁKI"), v: t("kariera.role3_m3_v", "10 — 14 tys. zł") },
        { l: t("kariera.role3_m4_l", "DEADLINE"), v: t("kariera.role3_m4_v", "do 30.06.2026") },
      ],
    },
    {
      ttl: t("kariera.role4_ttl", "Junior community"),
      em: t("kariera.role4_em", "moderator"),
      sub: t("kariera.role4_sub", "Moderowanie forum, kanałów Discord, odpowiedzi na zgłoszenia z bazy wiedzy. 4-dniowa praca, dyżury nocne."),
      meta: [
        { l: t("kariera.role4_m1_l", "DOŚWIADCZENIE"), v: t("kariera.role4_m1_v", "1+ rok społeczność online") },
        { l: t("kariera.role4_m2_l", "LOKALIZACJA"), v: t("kariera.role4_m2_v", "Zdalnie · PL/EU") },
        { l: t("kariera.role4_m3_l", "WIDEŁKI"), v: t("kariera.role4_m3_v", "7 — 9 tys. zł") },
        { l: t("kariera.role4_m4_l", "DEADLINE"), v: t("kariera.role4_m4_v", "do 15.07.2026") },
      ],
    },
  ];

  const steps = [
    {
      num: "// 01",
      h1: t("kariera.step1_h1", "Zgłoszenie"),
      em: t("kariera.step1_em", "+ próbka"),
      p: t("kariera.step1_p", "Krótki list (do 400 słów — „dlaczego ja, dlaczego teraz”) + portfolio / próbka pracy w formacie odpowiednim do roli."),
      when: t("kariera.step1_when", "DZIEŃ 0 · ODPOWIADAMY W 5 DNI"),
    },
    {
      num: "// 02",
      h1: t("kariera.step2_h1", "Rozmowa"),
      em: t("kariera.step2_em", "z osobą stałą"),
      p: t("kariera.step2_p", "45–60 min z osobą, która pracuje na podobnej pozycji. Konkretnie o pracy, bez „opowiedz mi swoją drogę”. Bez testów logicznych."),
      when: t("kariera.step2_when", "DZIEŃ 5–8 · ONLINE / SPACER"),
    },
    {
      num: "// 03",
      h1: t("kariera.step3_h1", "Zadanie"),
      em: t("kariera.step3_em", "płatne"),
      p: t("kariera.step3_p", "Małe zadanie podobne do tego, co będziesz robić. 4–8h. Płacimy 800 zł flat (nie „za rynkową stawkę”). Twoja praca zostaje twoja."),
      when: t("kariera.step3_when", "DZIEŃ 10–14 · ASYNC"),
    },
    {
      num: "// 04",
      h1: t("kariera.step4_h1", "Spotkanie"),
      em: t("kariera.step4_em", "z zespołem"),
      p: t("kariera.step4_p", "2h w naszym studio (jeśli możesz przyjechać) lub online. Poznajesz 4–5 osób, z którymi będziesz pracować. Oferta w 48h."),
      when: t("kariera.step4_when", "DZIEŃ 14–18 · DECYZJA W 48H"),
    },
  ];

  const perks = [
    { h1: t("kariera.perk1_h1", "25 + 5"), em: t("kariera.perk1_em", "dni urlopu"), p: t("kariera.perk1_p", "5 dodatkowych „wolnej myśli” — bez pytań, bez tłumaczenia, bez kalendarza.") },
    { h1: t("kariera.perk2_h1", "4-dniowy"), em: t("kariera.perk2_em", "tydzień pracy"), p: t("kariera.perk2_p", "Od stycznia 2024. Czwartek = piątek. Pensja taka sama. Nie eksperymentujemy — to teraz nasz standard.") },
    { h1: t("kariera.perk3_h1", "Studio"), em: t("kariera.perk3_em", "do dyspozycji"), p: t("kariera.perk3_p", "Każdy pracownik ma dostęp do studia poza godzinami pracy. Własne projekty, podcast, demo — nasze sprzęty są też twoje.") },
    { h1: t("kariera.perk4_h1", "Budżet"), em: t("kariera.perk4_em", "na słuchawki + sprzęt"), p: t("kariera.perk4_p", "3 500 zł na onboarding (słuchawki referencyjne + monitor) + 1 200 zł rocznie na update.") },
    { h1: t("kariera.perk5_h1", "Opieka"), em: t("kariera.perk5_em", "medyczna"), p: t("kariera.perk5_p", "LUX MED Premium + 600 zł rocznie na fizjoterapię (od dźwięku łatwo zboleć w karku).") },
    { h1: t("kariera.perk6_h1", "Multisport"), em: t("kariera.perk6_em", "+ książki"), p: t("kariera.perk6_p", "Multisport Plus, 200 zł / miesiąc na książki (nasz wybór: papierowe, nie audiobook'i).") },
    { h1: t("kariera.perk7_h1", "Roczna"), em: t("kariera.perk7_em", "konferencja zagraniczna"), p: t("kariera.perk7_p", "Twój wybór — Audiocraft, Sound on Sound, BBC R&D. Pokrywamy wszystko + 2 dni na zwiedzanie.") },
    { h1: t("kariera.perk8_h1", "Praca"), em: t("kariera.perk8_em", "z innego dnia"), p: t("kariera.perk8_p", "2 dni / mies. możesz pracować w naszym studio w Krakowie albo Warszawie. Bo czasem człowiek potrzebuje innego okna.") },
    { h1: t("kariera.perk9_h1", "Dzieła"), em: t("kariera.perk9_em", "w napisach"), p: t("kariera.perk9_p", "Twoje imię w napisach każdego odcinka, przy którym pracowałeś. Nie ukrywamy zespołu.") },
  ];

  return (
    <>
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div
          className="pointer-events-none absolute -left-24 -top-24 h-[500px] w-[500px]"
          style={{ background: "radial-gradient(circle, rgba(95,168,255,0.08), transparent 60%)" }}
        />
        <div className="relative mx-auto max-w-[1400px]">
          <Eyebrow>{t("kariera.hero_eyebrow", "// KARIERA · ZESPÓŁ 14 OSÓB · ROŚNIEMY OSTROŻNIE")}</Eyebrow>
          <h1 className="my-5 max-w-[1200px] font-serif text-[clamp(48px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.02em]">
            {t("kariera.hero_title_p1", "Praca, w której")} <em className="italic text-ink-1">{t("kariera.hero_title_em", "cisza")}</em>
            <br />
            {t("kariera.hero_title_p2", "jest narzędziem.")}
          </h1>
          <p className="max-w-[620px] text-[17px] font-light leading-relaxed text-ink-1">
            {t("kariera.hero_lead", "Nie szukamy 50 osób. Szukamy 3, które naprawdę pasują. Nie mamy darmowych masaży i piłkarzyków — mamy własne studio nagraniowe, świetny sprzęt, 25 dni urlopu i ludzi, którzy nie udają, że cię lubią, jeśli cię nie lubią.")}
          </p>
          <div className="mt-8 flex flex-wrap gap-x-9 gap-y-3 border-t border-line pt-6">
            <div className="flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-obskura-pulse-fast" />
              <span>{t("kariera.hero_q1", "4 OTWARTE STANOWISKA")}</span>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">
              {t("kariera.hero_q2_l", "SIEDZIBA")} · <strong className="text-ink-0">{t("kariera.hero_q2_v", "Gdańsk + remote-friendly")}</strong>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">
              {t("kariera.hero_q3_l", "PRZESTRZEŃ")} · <strong className="text-ink-0">{t("kariera.hero_q3_v", "3 studia + biuro 280m²")}</strong>
            </div>
            <div className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">
              {t("kariera.hero_q4_l", "JĘZYK PRACY")} · <strong className="text-ink-0">{t("kariera.hero_q4_v", "PL (+ EN dla 2 ról)")}</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Values */}
      <section className="mx-auto mt-20 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("kariera.values_eyebrow", "JAK PRACUJEMY")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("kariera.values_title_p1", "Cztery")} <em className="italic text-ink-2">{t("kariera.values_title_em", "zasady")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {values.map((v) => (
            <div key={v.num} className="relative border border-line bg-bg-1/50 p-9 transition-colors hover:border-red/40">
              <div className="mb-4 font-mono text-[10px] tracking-eyebrow text-red">{v.num}</div>
              <h3 className="mb-3 font-serif text-[30px] font-medium leading-tight">
                {v.h1} <em className="italic text-ink-1">{v.em}</em>.
              </h3>
              <p className="text-[14px] font-light leading-relaxed text-ink-1">{v.p}</p>
              <p className="mt-3.5 border-t border-line pt-3.5 text-[13px] italic text-ink-2">
                <strong className="font-mono text-[10px] not-italic tracking-mono text-red">{t("kariera.values_anti", "NIE FUNKCJONUJE")}</strong> — {v.anti}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 lg:px-12">
        <div className="mb-6 flex flex-col items-start justify-between gap-5 border-b border-line pb-5 sm:flex-row sm:items-end">
          <div>
            <Eyebrow>{t("kariera.roles_eyebrow", "OTWARTE STANOWISKA · 4")}</Eyebrow>
            <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
              {t("kariera.roles_title_p1", "Tego")} <em className="italic text-ink-2">{t("kariera.roles_title_em", "szukamy")}</em> {t("kariera.roles_title_p2", "teraz")}.
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("kariera.roles_updated", "AKTUALIZACJA · 23.05.2026")}</div>
        </div>

        {roles.map((r, i) => (
          <div
            key={i}
            className="mb-2 grid grid-cols-1 items-center gap-4 border border-line bg-bg-1/40 p-5 transition-all duration-200 hover:-translate-y-px hover:border-red/40 hover:bg-bg-1/70 lg:grid-cols-[1fr_1fr_180px_140px_140px_auto] lg:gap-6 lg:px-6"
          >
            <div>
              <div className="font-serif text-[24px] font-medium leading-tight">
                {r.ttl} <em className="italic text-ink-1">{r.em}</em>
              </div>
            </div>
            <div className="text-[13px] leading-snug text-ink-1">{r.sub}</div>
            {r.meta.map((m, j) => (
              <div key={j} className={`font-mono text-[10px] uppercase tracking-eyebrow ${m.urgent ? "text-red" : "text-ink-2"}`}>
                {m.l}
                <strong className={`mt-1 block text-[12px] tracking-ui ${m.urgent ? "text-red" : "text-ink-0"}`}>{m.v}</strong>
              </div>
            ))}
            <HorrorButton to="#" className="!px-[18px] !py-2.5">
              {t("kariera.roles_apply", "Aplikuj")}
            </HorrorButton>
          </div>
        ))}

        <div className="mt-10 border border-dashed border-line bg-bg-1/30 p-9 text-center">
          <h4 className="mb-2.5 font-serif text-[26px] italic">
            {t("kariera.nofit_h1", "Nie ma")} <em className="text-ink-1">{t("kariera.nofit_em", "twojej roli")}</em>?
          </h4>
          <p className="mx-auto mb-5 max-w-[540px] text-[14px] leading-relaxed text-ink-1">
            {t("kariera.nofit_p", "Jeśli czujesz, że pasujesz do Obskury, ale nie do żadnej z otwartych pozycji, napisz do nas. Otwieramy nowe stanowiska zwykle co 3 miesiące — przed otwarciem przeglądamy zgłoszenia z „rezerwy”.")}
          </p>
          <HorrorButton variant="ghost" to="#">kariera@obskura.audio</HorrorButton>
        </div>
      </section>

      {/* Process */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 lg:px-12">
        <Eyebrow accent="blue">{t("kariera.process_eyebrow", "PROCES REKRUTACJI · 4 KROKI · ŚREDNIO 18 DNI")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("kariera.process_title_p1", "Bez")} <em className="italic text-ink-2">{t("kariera.process_title_em", "algorytmów")}</em>.
        </h2>
        <p className="mt-4 max-w-[700px] text-[15px] font-light leading-relaxed text-ink-1">
          {t("kariera.process_lead", "Nie używamy ATS, nie sortujemy CV-tek po słowach kluczowych. Czytamy każde zgłoszenie. Odpowiadamy każdemu — nawet jeśli to „nie tym razem”.")}
        </p>
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-4">
          {steps.map((s) => (
            <div key={s.num} className="border-t border-line pt-6">
              <div className="mb-3 font-mono text-[11px] tracking-eyebrow text-red">{s.num}</div>
              <h4 className="mb-2.5 font-serif text-[22px] font-medium leading-tight">
                {s.h1} <em className="italic text-ink-1">{s.em}</em>
              </h4>
              <p className="mb-2.5 text-[14px] font-light leading-snug text-ink-1">{s.p}</p>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-2">{s.when}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Perks */}
      <section className="mx-auto mt-24 max-w-[1400px] px-5 pb-16 lg:px-12">
        <Eyebrow>{t("kariera.perks_eyebrow", "// CO JESZCZE")}</Eyebrow>
        <h2 className="mt-4 font-serif text-[clamp(36px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em]">
          {t("kariera.perks_title_p1", "Drobiazgi,")} <em className="italic text-ink-2">{t("kariera.perks_title_em", "które się liczą")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          {perks.map((p, i) => (
            <div key={i} className="flex items-start gap-3.5 border border-line bg-bg-1/40 p-5 transition-colors hover:border-red/40">
              <div className="grid h-8 w-8 flex-shrink-0 place-items-center border border-red text-red">
                <Check size={14} />
              </div>
              <div>
                <h5 className="mb-1 font-serif text-[17px] font-medium">
                  {p.h1} <em className="italic text-ink-1">{p.em}</em>
                </h5>
                <p className="text-[12px] font-light leading-snug text-ink-1">{p.p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
