import { useState } from "react";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

export default function Creators() {
  const { t } = useTranslation();
  const [submitted, setSubmitted] = useState(false);

  const roleTabs = [
    { key: "all", label: t("tworcy.tab_all", "Wszyscy"), num: 12 },
    { key: "narr", label: t("tworcy.tab_narr", "Narratorzy"), num: 5 },
    { key: "dir", label: t("tworcy.tab_dir", "Reżyseria"), num: 3 },
    { key: "sound", label: t("tworcy.tab_sound", "Dźwięk"), num: 2 },
    { key: "script", label: t("tworcy.tab_script", "Scenariusz"), num: 2 },
  ];
  const [activeTab, setActiveTab] = useState("all");

  const creators = [
    {
      img: "/images/img-smoke.webp", pos: "center 18%", tag: t("tworcy.c1_tag", "Narratorka"), accent: "red",
      name: "Katarzyna", nameEm: "Wieczorek", role: t("tworcy.c1_role", "LEAD VOCAL · OD 2023"),
      bio: t("tworcy.c1_bio", "Aktorka teatralna i radiowa. Specjalizuje się w głosach kobiet w sytuacjach granicznych."),
      stats: [{ v: "23", l: t("tworcy.s_ep", "odc.") }, { v: "4.9", l: "★" }, { v: "2.1M", l: t("tworcy.s_plays", "odsłuchów") }],
    },
    {
      img: "/images/img-hallway.webp", pos: "center", tag: t("tworcy.c2_tag", "Reżyseria"), accent: "blue",
      name: "Marta", nameEm: "Sobczak", role: t("tworcy.c2_role", "DYREKTORKA KREATYWNA · OD 2021"),
      bio: t("tworcy.c2_bio", "Współzałożycielka Obskury. Reżyseruje 90% odcinków. Wcześniej Trójka, BBC Sounds."),
      stats: [{ v: "132", l: t("tworcy.s_ep", "odc.") }, { v: "4.8", l: "★" }, { v: "—", l: "" }],
    },
    {
      img: "/images/img-tunnel.webp", pos: "center", tag: t("tworcy.c3_tag", "Dźwięk"), accent: "blue",
      name: "Piotr", nameEm: "Górski", role: t("tworcy.c3_role", "INŻYNIER DŹWIĘKU · OD 2021"),
      bio: t("tworcy.c3_bio", "Architekt binauralnej przestrzeni. Każdy mix wymaga 40h pracy. Lubi to."),
      stats: [{ v: "147", l: t("tworcy.s_ep", "odc.") }, { v: "4.9", l: "★" }, { v: "FLAC", l: "" }],
    },
    {
      img: "/images/monster.webp", pos: "center 20%", tag: t("tworcy.c4_tag", "Narrator"), accent: "red",
      name: "Adam", nameEm: "Karpiński", role: t("tworcy.c4_role", "NARRATOR · OD 2022"),
      bio: t("tworcy.c4_bio", "Były dziennikarz Gazety Wyborczej. Głos do serii „TRUE HORROR” — opartych na faktach."),
      stats: [{ v: "18", l: t("tworcy.s_ep", "odc.") }, { v: "4.8", l: "★" }, { v: "1.6M", l: t("tworcy.s_plays", "odsłuchów") }],
    },
    {
      img: "/images/img-creature.webp", pos: "center 5%", tag: t("tworcy.c5_tag", "Scenariusz"), accent: "red",
      name: "Jakub", nameEm: "Borek", role: t("tworcy.c5_role", "SCENARZYSTA · OD 2022"),
      bio: t("tworcy.c5_bio", "Pisał dla CD Projekt i Bloober Team. W Obskurze odpowiada za psychologiczne i cosmic."),
      stats: [{ v: "34", l: t("tworcy.s_scen", "scen.") }, { v: "4.7", l: "★" }, { v: "3", l: t("tworcy.s_awards", "nagrody") }],
    },
    {
      img: "/images/img-forest.webp", pos: "center 60%", tag: t("tworcy.c6_tag", "Narratorka"), accent: "red",
      name: "Zofia", nameEm: "Lange", role: t("tworcy.c6_role", "NARRATORKA · OD 2024"),
      bio: t("tworcy.c6_bio", "Lingwistka, mówi czterema językami. Lead w sezonie 2 — gatunki folk horror i mitologia."),
      stats: [{ v: "14", l: t("tworcy.s_ep", "odc.") }, { v: "4.9", l: "★" }, { v: "PL/EN/DE", l: "" }],
    },
    {
      img: "/images/img-wolf.webp", pos: "center 25%", tag: t("tworcy.c7_tag", "Reżyseria"), accent: "blue",
      name: "Tomasz", nameEm: "Reich", role: t("tworcy.c7_role", "REŻYSER · OD 2023"),
      bio: t("tworcy.c7_bio", "Specjalizacja: mitologia słowiańska i nordycka. Konsultuje z etnografami z UJ."),
      stats: [{ v: "12", l: t("tworcy.s_ep", "odc.") }, { v: "4.8", l: "★" }, { v: "—", l: "" }],
    },
    {
      img: "/images/img-orbs.webp", pos: "center 70%", tag: t("tworcy.c8_tag", "Narratorka"), accent: "red",
      name: "Nadia", nameEm: "O.", role: t("tworcy.c8_role", "NARRATORKA · OD 2025"),
      bio: t("tworcy.c8_bio", "Pseudonim. Anonimowa. Głos do cyber-horror i body horror. Nie udziela wywiadów."),
      stats: [{ v: "7", l: t("tworcy.s_ep", "odc.") }, { v: "5.0", l: "★" }, { v: "—", l: "" }],
    },
  ];

  const featStats = [
    { n: "23", l: t("tworcy.feat_stat1", "Odcinki") },
    { n: "4.9 ★", l: t("tworcy.feat_stat2", "Średnia ocena") },
    { n: "2.1M", l: t("tworcy.feat_stat3", "Łącznych odsłuchów") },
  ];

  const credits = [
    { text: t("tworcy.credit_lead", "LEAD S03 · MGŁA NAD WISŁOUJŚCIEM"), lead: true },
    { text: t("tworcy.credit2", "OSTATNIE ŚWIATŁO") },
    { text: t("tworcy.credit3", "PACJENTKA 23") },
    { text: t("tworcy.credit4", "PUSTY POKÓJ") },
    { text: t("tworcy.credit5", "+ 19 ODCINKÓW") },
  ];

  const process = [
    { num: "// 01", strong: t("tworcy.step1_strong", "Próbka audio"), text: t("tworcy.step1_text", "— 5–10 minut twojej pracy. Może być z teatru, podcastu, audiobook'a, nawet z TikToka. Format: MP3 lub WAV.") },
    { num: "// 02", strong: t("tworcy.step2_strong", "Krótki opis"), text: t("tworcy.step2_text", "— kim jesteś, co chcesz opowiedzieć, co cię przeraża. 300 słów wystarczy.") },
    { num: "// 03", strong: t("tworcy.step3_strong", "Czytamy każdy"), text: t("tworcy.step3_text", ". Odpowiadamy w 4 tygodnie. Jeśli zaczynamy rozmowę — proponujemy nagranie testowe.") },
  ];

  return (
    <>
      <header className="relative overflow-hidden border-b border-line px-5 pb-12 pt-[140px] lg:pb-16 lg:px-12">
        <div className="mx-auto grid max-w-[1400px] items-end gap-8 lg:grid-cols-[1.4fr_1fr] lg:gap-[60px]">
          <div>
            <Eyebrow>{t("tworcy.eyebrow", "// LUDZIE ZA GŁOSAMI · 38 OSÓB · 12 STAŁYCH")}</Eyebrow>
            <h1 className="my-4 font-serif text-[clamp(40px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.02em] lg:my-5">
              {t("tworcy.title_p1", "Ci, którzy")} <em className="italic text-ink-1">{t("tworcy.title_em", "opowiadają")}</em>
              <br />
              {t("tworcy.title_p2", "twoje koszmary.")}
            </h1>
            <p className="text-[15px] font-light leading-relaxed text-ink-1 sm:max-w-[540px] lg:text-[17px]">
              {t("tworcy.lead", "Nie mamy gwiazd, mamy ludzi. Reżyserów, narratorów, autorów i inżynierów dźwięku, którzy spędzają noce nad jednym oddechem między dwoma słowami. Zobacz, kto stoi za każdym odcinkiem, który cię nie pozwala zasnąć.")}
            </p>
          </div>
          <figure className="relative mt-2 border-l-2 border-red bg-bg-1/60 p-5 sm:mt-0 sm:p-8">
            <blockquote className="mb-4 font-serif text-[18px] italic leading-tight text-ink-0 sm:text-[22px]">
              <span aria-hidden className="-mb-2 block text-[48px] leading-none text-red drop-shadow-[0_0_16px_rgba(255,42,42,0.4)] sm:text-[60px]">&ldquo;</span>
              {t("tworcy.quote", "Najtrudniej jest opowiadać szeptem tak, żeby nie zaszemrać. Tej cierpliwości nas nauczono.")}
            </blockquote>
            <figcaption className="font-mono text-[10px] uppercase tracking-mono text-ink-2">
              {t("tworcy.quote_who", "— M. SOBCZAK · REŻYSERKA DŹWIĘKU · OD 2021")}
            </figcaption>
          </figure>
        </div>
      </header>

      <section className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-24 lg:px-12">
        <Eyebrow accent="blue">{t("tworcy.featured_eyebrow", "TWÓRCZYNI MIESIĄCA · MAJ 2026")}</Eyebrow>
        <div className="mt-6 grid items-center gap-8 sm:mt-8 sm:grid-cols-[1.1fr_1fr] sm:gap-10 lg:gap-[60px]">
          <div className="relative aspect-[3/4] overflow-hidden bg-bg-1 sm:aspect-[4/5]">
            <img src="/images/img-orbs.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[center_20%]" style={{ filter: "contrast(1.05) saturate(0.9)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, transparent 50%, rgba(5,6,8,0.4))" }} />
            <span className="absolute left-4 top-4 z-[2] border-l-2 border-red bg-black/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-red backdrop-blur-md sm:left-5 sm:top-5 sm:px-3.5 sm:py-2">
              {t("tworcy.spotlight_tag", "// SPOTLIGHT 05/2026")}
            </span>
            <div className="absolute inset-x-4 bottom-4 z-[2] flex items-end justify-between sm:inset-x-6 sm:bottom-6">
              <div className="font-serif text-xl italic sm:text-2xl">K. Wieczorek</div>
              <div className="text-right font-mono text-[9px] uppercase tracking-[0.15em] text-ink-2 sm:text-[10px]">
                {t("tworcy.sig_role", "NARRATOR LEAD")}<br />
                {t("tworcy.sig_meta", "SEZON 03 · 12/12 ODCINKÓW")}
              </div>
            </div>
          </div>
          <div>
            <Eyebrow>{t("tworcy.feat_kicker", "NARRATOR · KATARZYNA WIECZOREK")}</Eyebrow>
            <h2 className="my-4 font-serif text-[clamp(32px,5vw,64px)] font-medium leading-none tracking-[-0.02em] sm:my-5 sm:text-[clamp(40px,5vw,64px)]">
              {t("tworcy.feat_h_p1", "Głos, który")} <em className="italic text-ink-1">{t("tworcy.feat_h_em", "ciebie")}</em> {t("tworcy.feat_h_p2", "słyszy.")}
            </h2>
            <p className="mb-4 text-[14px] font-light leading-relaxed text-ink-1 sm:text-[15px]">
              {t("tworcy.feat_p1", "Po dziesięciu latach w teatrze radiowym Trójki, Katarzyna dołączyła do Obskury w 2023 roku z prostą zasadą — nie czyta, opowiada. Każde nagranie zaczyna od godziny ciszy w studiu. Każde kończy rozmową z reżyserką o tym, co poszło źle.")}
            </p>
            <p className="mb-4 text-[14px] font-light leading-relaxed text-ink-1 sm:text-[15px]">
              {t("tworcy.feat_p2", "„W trzecim sezonie skończyło mi się powietrze w środku piątego odcinka. Zostawiłyśmy to nagranie w finalnej wersji. Słychać, że nie kłamię.”")}
            </p>
            <div className="my-6 grid grid-cols-3 gap-4 border-y border-line py-5 sm:my-8 sm:gap-6 sm:py-6">
              {featStats.map((s) => (
                <div key={s.l}>
                  <div className="font-serif text-[clamp(20px,3vw,32px)] font-medium leading-none sm:text-[clamp(24px,3vw,32px)]">{s.n}</div>
                  <div className="mt-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">{s.l}</div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {credits.map((c) => (
                <span key={c.text} className={`border bg-white/[0.02] px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-[0.15em] sm:px-3 sm:text-[10px] ${c.lead ? "border-red text-red" : "border-line text-ink-1"}`}>
                  {c.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1400px] px-5 sm:mt-32 lg:px-12">
        <div className="mb-8 flex flex-col gap-5 border-b border-line pb-6 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow>{t("tworcy.team_eyebrow", "// ZESPÓŁ STAŁY")}</Eyebrow>
            <h2 className="mt-3 font-serif text-[clamp(32px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em] sm:mt-4 sm:text-[clamp(36px,4.5vw,56px)]">
              {t("tworcy.team_title_p1", "Wszyscy")} <em className="italic text-ink-1">{t("tworcy.team_title_em", "stali")}</em>.
            </h2>
          </div>
          <div className="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:overflow-x-visible sm:px-0">
            <div className="flex gap-4 pb-0.5 sm:flex-wrap sm:gap-6 sm:pb-0">
              {roleTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex min-h-[44px] flex-shrink-0 items-center whitespace-nowrap border-b py-2 font-mono text-[11px] uppercase tracking-mono transition-colors sm:flex-shrink ${activeTab === tab.key ? "border-red text-ink-0" : "border-transparent text-ink-2 hover:text-ink-0"}`}
                >
                  {tab.label} <span className="ml-1.5 text-[9px] text-ink-3">{tab.num}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {creators.map((c) => (
            <article key={`${c.name}-${c.nameEm}`} className="group cursor-pointer border border-line bg-bg-1/40 transition-all duration-300 hover:-translate-y-1 hover:border-red/30">
              <div className="relative aspect-square overflow-hidden bg-bg-1">
                <img src={c.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover grayscale-[0.5] transition-[filter,transform] duration-500 group-hover:scale-[1.04] group-hover:grayscale-0" style={{ objectPosition: c.pos }} />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, transparent 50%, rgba(5,6,8,0.9))" }} />
                <span className={`absolute left-3.5 top-3.5 z-[2] bg-black/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono backdrop-blur-md ${c.accent === "blue" ? "text-blue" : "text-red"}`}>
                  {c.tag}
                </span>
              </div>
              <div className="px-5 pb-5 pt-[18px]">
                <div className="mb-1 font-serif text-[22px] font-medium leading-tight">{c.name} <em className="italic text-ink-1">{c.nameEm}</em></div>
                <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2">{c.role}</div>
                <p className="mb-3.5 text-[13px] font-light leading-snug text-ink-1">{c.bio}</p>
                <div className="flex gap-3.5 border-t border-line pt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">
                  {c.stats.map((s, i) => (
                    <span key={i}><strong className="font-medium text-ink-0">{s.v}</strong> {s.l}</span>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-[1400px] px-5 sm:mt-32 lg:px-12">
        <div className="relative grid items-center gap-10 overflow-hidden border border-line bg-bg-1/60 p-5 sm:p-8 lg:grid-cols-2 lg:gap-[60px] lg:p-[60px]">
          <div className="pointer-events-none absolute -right-24 -top-24 h-[400px] w-[400px]" style={{ background: "radial-gradient(circle, rgba(255,42,42,0.1), transparent 70%)" }} />
          <div className="relative">
            <Eyebrow>{t("tworcy.apply_eyebrow", "// OTWARTE ZGŁOSZENIA")}</Eyebrow>
            <h2 className="my-4 font-serif text-[clamp(36px,4vw,56px)] font-medium leading-none">
              {t("tworcy.apply_h_p1", "Chcesz")} <em className="italic text-ink-1">{t("tworcy.apply_h_em", "opowiadać")}</em>
              <br />
              {t("tworcy.apply_h_p2", "z nami?")}
            </h2>
            <p className="mb-5 text-[15px] font-light leading-relaxed text-ink-1">
              {t("tworcy.apply_p", "Przyjmujemy zgłoszenia raz na kwartał. Szukamy ludzi, których głos zostaje po ostatnim wyrazie — narratorów, scenarzystów, reżyserów dźwięku, lektorów. Doświadczenie pomaga, ale ważniejsze jest słyszenie ciszy.")}
            </p>
            <ol className="mt-8">
              {process.map((p, i) => (
                <li key={p.num} className={`flex gap-4 border-t border-line py-4 text-sm leading-snug text-ink-1 ${i === process.length - 1 ? "border-b" : ""}`}>
                  <span className="w-[60px] flex-shrink-0 font-mono text-[11px] tracking-mono text-red">{p.num}</span>
                  <span><strong className="font-medium text-ink-0">{p.strong}</strong>{p.text}</span>
                </li>
              ))}
            </ol>
          </div>

          <form
            className="relative border border-line bg-black/40 p-5 sm:p-6 lg:p-9"
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
          >
            <h3 className="mb-1.5 font-serif text-2xl font-medium">{t("tworcy.form_h_p1", "Formularz")} <em className="italic text-ink-1">{t("tworcy.form_h_em", "zgłoszeniowy")}</em></h3>
            <p className="mb-6 text-[13px] text-ink-2">{t("tworcy.form_sub", "Wszystkie pola wymagane. Czas wypełniania: ~6 min.")}</p>
            <div className="mb-6 border-l-2 border-red bg-red/[0.05] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-1">
              <strong className="text-red">{t("tworcy.form_window_label", "NAJBLIŻSZE OKNO ZGŁOSZEŃ:")}</strong> {t("tworcy.form_window_dates", "15.06 – 30.06.2026")}
            </div>

            <div className="mb-4 flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("tworcy.f_name_label", "Imię i nazwisko / pseudonim")}</label>
              <input type="text" required placeholder={t("tworcy.f_name_ph", "np. Adam Karpinski lub A.")} className={FIELD} />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("tworcy.f_email_label", "E-mail kontaktowy")}</label>
              <input type="email" required placeholder="twoj@email.com" className={FIELD} />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("tworcy.f_role_label", "Aplikuję jako")}</label>
              <select required defaultValue="" className={FIELD}>
                <option value="" disabled>{t("tworcy.f_role_ph", "Wybierz rolę")}</option>
                <option>{t("tworcy.f_role_1", "Narrator / lektor")}</option>
                <option>{t("tworcy.f_role_2", "Reżyser dźwięku")}</option>
                <option>{t("tworcy.f_role_3", "Inżynier mixu")}</option>
                <option>{t("tworcy.f_role_4", "Scenarzysta")}</option>
                <option>{t("tworcy.f_role_5", "Aktor — role drugoplanowe")}</option>
                <option>{t("tworcy.f_role_6", "Inne — w opisie poniżej")}</option>
              </select>
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("tworcy.f_link_label", "Link do próbki (Dropbox / SoundCloud / WeTransfer)")}</label>
              <input type="url" required placeholder="https://..." className={FIELD} />
            </div>
            <div className="mb-4 flex flex-col gap-2">
              <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("tworcy.f_about_label", "Krótko o sobie (max 300 słów)")}</label>
              <textarea required className={`${FIELD} min-h-[100px] resize-y`} placeholder={t("tworcy.f_about_ph", "Kim jesteś, co cię przeraża, co chcesz opowiedzieć?")} />
            </div>
            <label className="mb-6 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink-1">
              <input type="checkbox" required className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red" />
              <span>{t("tworcy.f_consent", "Zgadzam się na przetwarzanie danych osobowych w celu rekrutacji.")} <a href="#" className="text-red underline">{t("tworcy.f_privacy", "Polityka prywatności")}</a>.</span>
            </label>
            <HorrorButton type="submit" block disabled={submitted}>
              {submitted ? t("tworcy.f_submitted", "Zgłoszenie przyjęte — odezwiemy się w 4 tygodnie") : <>{t("tworcy.f_submit", "Wyślij zgłoszenie")} <Arrow /></>}
            </HorrorButton>
          </form>
        </div>
      </section>

      <div className="h-16 sm:h-32" />
    </>
  );
}
