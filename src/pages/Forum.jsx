import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { MessageSquare, Users, TrendingUp } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import ForumCategory from "../components/sections/ForumCategory";

const CATEGORIES = [
  {
    name: "Dyskusje o odcinkach",
    info: ["147 ODCINKÓW", "8 412 WĄTKÓW"],
    icon: MessageSquare,
    threads: [
      { t: "[S03E12] Mgła nad Wisłoujściem — dyskusja po premierze", meta: "PRZEZ M. SOBCZAK · ZAŁOŻONY 23.05.2026 · OFICJALNY", badge: "pin", replies: "847", views: "23.4K", who: "Eliza Z.", when: "12 MIN TEMU" },
      { t: "Czy ktoś inny słyszał oddech w 31:14? (Mgła nad Wisłoujściem)", meta: "PRZEZ NOKTURN_47 · ZAŁOŻONY 24.05.2026", badge: "hot", replies: "412", views: "9.1K", who: "Karol P.", when: "18 MIN TEMU" },
      { t: "Analiza zakończenia \"Ostatnie Światło\" — kto naprawdę był w pokoju 304?", meta: "PRZEZ MAJA O. · ZAŁOŻONY 21.05.2026", replies: "289", views: "6.7K", who: "P. Górski", when: "1H TEMU" },
      { t: "[S03E10] Coś patrzy z lasu — debata o znaczeniu sceny w 47:08", meta: "PRZEZ TOMASZ R. · ZAŁOŻONY 18.05.2026", replies: "178", views: "4.2K", who: "N.N.", when: "3H TEMU" },
      { t: "Najlepsze odcinki sezonu 3 — głosowanie", meta: "PRZEZ ANONIM_023 · ZAŁOŻONY 15.05.2026", replies: "523", views: "11.8K", who: "Hanna O.", when: "4H TEMU" },
    ],
  },
  {
    name: "Kulisy i produkcja",
    info: ["892 WĄTKÓW", "OFICJALNE NOTATKI EKIPY"],
    icon: Users,
    threads: [
      { t: "AMA z Katarzyną Wieczorek — pytania zbieramy do 30.05", meta: "PRZEZ M. SOBCZAK · OFICJALNY · TERMIN: 02.06.2026", badge: "pin", replies: "234", views: "5.4K", who: "K. Wieczorek", when: "6H TEMU" },
      { t: "Jak nagrywaliśmy oddech głównego potwora — wycieczka po studio", meta: "PRZEZ P. GÓRSKI · ZAŁOŻONY 12.05.2026 · TECH", replies: "89", views: "3.1K", who: "Daniel S.", when: "8H TEMU" },
      { t: "Co wycięliśmy z S03E12 i dlaczego — uwaga, spojlery", meta: "PRZEZ J. BOREK · ZAŁOŻONY 24.05.2026 · SPOILER", replies: "156", views: "4.8K", who: "Filip K.", when: "12H TEMU" },
    ],
  },
  {
    name: "Twoje historie · creepypasta & mikropowieści",
    info: ["3 421 WĄTKÓW", "MODEROWANE"],
    icon: TrendingUp,
    threads: [
      { t: "[CREEPYPASTA] Wiadomość od mojej zmarłej babci na automacie biletowym", meta: "PRZEZ ZUZIA K. · ZAŁOŻONY 23.05.2026", replies: "72", views: "1.8K", who: "Marcin N.", when: "2H TEMU" },
      { t: "[MIKROPOWIEŚĆ · 800 słów] Pokój nad sklepem mięsnym", meta: "PRZEZ JAKUB G. · ZAŁOŻONY 22.05.2026 · OZNACZONO PRZEZ ZESPÓŁ", replies: "134", views: "3.4K", who: "M. Sobczak", when: "5H TEMU" },
      { t: "Konkurs majowy: napisz pierwszą scenę odcinka \"Pacjentka 23\" w 500 słów", meta: "PRZEZ MODERACJA · DEADLINE: 31.05.2026 · NAGRODA", replies: "67", views: "1.2K", who: "Bartek M.", when: "1D TEMU" },
    ],
  },
  {
    name: "Techniczne · audio & sprzęt",
    info: ["1 247 WĄTKÓW", "POMOC SŁUCHACZ ↔ SŁUCHACZ"],
    icon: MessageSquare,
    threads: [
      { t: "Najlepsze słuchawki do binauralnego 3D do 800 zł", meta: "PRZEZ KAROLINA W. · ZAŁOŻONY 19.05.2026", replies: "89", views: "2.4K", who: "Piotr S.", when: "30 MIN TEMU" },
      { t: "Aplikacja zacina się przy synchronizacji offline (iOS 18.1)", meta: "PRZEZ ANNA K. · ZAŁOŻONY 20.05.2026 · BUG", replies: "23", views: "489", who: "Wsparcie OBSKURA", when: "4H TEMU" },
    ],
  },
];

const STATS = [
  { n: "14 832", l: "Wątków" },
  { n: "128 740", l: "Odpowiedzi" },
  { n: "8 217", l: "Aktywnych członków" },
  { n: "247", l: "Online teraz", accent: true },
];

const TOP_POSTERS = [
  { num: "01", who: "Eliza Z.", cnt: "412" },
  { num: "02", who: "Karol P.", cnt: "287" },
  { num: "03", who: "Hanna O.", cnt: "198" },
  { num: "04", who: "Anonim #047", cnt: "156" },
  { num: "05", who: "Daniel S.", cnt: "134" },
];

const RULES = [
  "Spoilery w tytule — używaj tagu [SPOILER] dla odcinków < 30 dni.",
  "Bez polityki bez kontekstu związanego z odcinkiem.",
  "Creepypasta — moderator musi oznaczyć przed publikacją.",
  "Konstruktywna krytyka tak. Ataki personalne — ban.",
  "Reklama? Tylko związana z gatunkiem, w odpowiednim wątku.",
];

export default function Forum() {
  const { t } = useTranslation();

  return (
    <div className="pt-[88px]">
      {/* HERO */}
      <header className="border-b border-line px-5 pb-8 pt-8 sm:pb-10 sm:pt-12 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Eyebrow className="mb-4">{t("forum.eyebrow", "// FORUM · MIEJSCE NA NIESPOKOJNE PYTANIA")}</Eyebrow>
          <h1 className="my-4 font-serif text-[clamp(44px,6vw,88px)] font-medium leading-[0.95] tracking-[-0.02em]">
            {t("forum.title_p1", "Co was")} <em className="italic text-ink-1">{t("forum.title_em", "obudziło")}</em>
            <br />
            {t("forum.title_p2", "o trzeciej w nocy?")}
          </h1>
          <p className="max-w-[600px] text-[16px] font-light leading-relaxed text-ink-1">
            {t("forum.lead", "Forum dla słuchaczy Obskury. Bez politycznych awantur, bez creepypast bez kontekstu. Moderowane przez nasz zespół, nie przez algorytm. Dołącz — zaloguj się kontem Obskury.")}
          </p>
          <div className="mt-7 flex flex-wrap gap-6 border-t border-line pt-5 sm:gap-10">
            {STATS.map((s) => (
              <div key={s.l}>
                <div className={`font-serif text-[22px] sm:text-[28px] ${s.accent ? "text-red" : ""}`}>{s.n}</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-mono text-ink-2">{t(`forum.stat_${s.l}`, s.l)}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto mt-10 grid max-w-[1400px] grid-cols-1 gap-10 px-5 pb-24 lg:grid-cols-[1fr_320px] lg:px-12">
        <div>
          {CATEGORIES.map((cat) => (
            <ForumCategory key={cat.name} category={cat} />
          ))}
        </div>

        {/* SIDEBAR */}
        <aside>
          <div className="mb-5 border border-line bg-bg-1/40 p-6">
            <h4 className="mb-4 border-b border-line pb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">
              {t("forum.side_activity", "// AKTYWNOŚĆ TERAZ")}
            </h4>
            <div className="mb-4 flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-full border border-[#00ff88] font-serif text-sm text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.25)]">
                <span className="h-1.5 w-1.5 animate-obskura-pulse rounded-full bg-[#00ff88]" />
              </span>
              <div>
                <div className="font-serif text-[28px] leading-none">247</div>
                <div className="mt-1 font-mono text-[9px] uppercase tracking-mono text-ink-2">{t("forum.members_online", "członków online")}</div>
              </div>
            </div>
            <div className="font-mono text-[10px] uppercase leading-relaxed tracking-ui text-ink-2">
              <strong className="text-ink-0">42</strong> {t("forum.writing", "piszących")} · <strong className="text-ink-0">8</strong>{" "}
              {t("forum.mods", "moderatorów dyżuruje")} · <strong className="text-red">3</strong> {t("forum.hot", "wątki w gorącym")}
            </div>
          </div>

          <div className="mb-5 border border-line bg-bg-1/40 p-6">
            <h4 className="mb-4 border-b border-line pb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">
              {t("forum.side_top", "// NAJAKTYWNIEJSI · MAJ")}
            </h4>
            {TOP_POSTERS.map((p) => (
              <div key={p.num} className="flex items-center gap-3 border-t border-line-soft py-2.5 first:border-t-0">
                <span className="w-6 font-mono text-[10px] text-ink-3">{p.num}</span>
                <span className="flex-1 font-serif text-[16px] italic">{p.who}</span>
                <span className="font-mono text-[10px] text-red">{p.cnt}</span>
              </div>
            ))}
          </div>

          <div className="mb-5 border border-line bg-bg-1/40 p-6">
            <h4 className="mb-4 border-b border-line pb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">
              {t("forum.side_rules", "// REGULAMIN FORUM")}
            </h4>
            <ol className="list-none">
              {RULES.map((r, i) => (
                <li key={r} className="border-t border-line-soft py-2.5 text-[13px] leading-relaxed text-ink-1 first:border-t-0">
                  <span className="mr-2 font-mono text-[10px] text-red">{i + 1}</span>
                  {t(`forum.rule_${i + 1}`, r)}
                </li>
              ))}
            </ol>
          </div>

          <div className="border border-line bg-bg-1/40 p-5">
            <HorrorButton block>{t("forum.new_thread", "+ Załóż wątek")}</HorrorButton>
            <p className="mt-2.5 flex flex-wrap items-center justify-center gap-x-1 font-mono text-[9px] uppercase tracking-mono text-ink-3">
              <span>{t("forum.requires_account", "WYMAGA KONTA")}</span>
              <span>·</span>
              <Link to="/login" className="inline-flex min-h-[44px] items-center text-ink-1 hover:text-ink-0">
                {t("forum.login", "ZALOGUJ")}
              </Link>
              <span>/</span>
              <Link to="/register" className="inline-flex min-h-[44px] items-center text-red hover:text-red-soft">
                {t("forum.register", "UTWÓRZ")}
              </Link>
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}
