import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import IosFrame from "../components/sections/IosFrame";
import AndroidFrame from "../components/sections/AndroidFrame";
import { Play, Pause, Prev, Next, SearchIcon } from "../components/ui/Icons";

// Wiersz listy odcinków (iOS Home)
function IosListRow({ r }) {
  return (
    <div className="grid grid-cols-[52px_1fr_auto] items-center gap-3.5 border-t border-white/[0.04] py-3 first:border-t-0">
      <span
        className="h-[52px] w-[52px] bg-cover"
        style={{ backgroundImage: `url('${r.img}')`, backgroundPosition: r.pos }}
      />
      <span className="min-w-0">
        <span className="mb-0.5 block font-mono text-[9px] tracking-mono text-red">{r.ep}</span>
        <span className="block truncate font-serif text-[16px] leading-tight">
          {r.t1} <em className="italic text-ink-1">{r.t2}</em>
        </span>
        <span className="mt-0.5 block font-mono text-[9px] uppercase tracking-ui text-ink-2">{r.d}</span>
      </span>
      <span className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-ink-1">
        <Play size={9} />
      </span>
    </div>
  );
}
IosListRow.propTypes = {
  r: PropTypes.shape({
    img: PropTypes.string.isRequired,
    pos: PropTypes.string.isRequired,
    ep: PropTypes.string.isRequired,
    t1: PropTypes.string.isRequired,
    t2: PropTypes.string.isRequired,
    d: PropTypes.string.isRequired,
  }).isRequired,
};

// ── Ekran iOS: Słuchaj / Home ──────────────────────────────────
function IosHomeScreen() {
  const rows = [
    { img: "/images/monster.webp", pos: "center 20%", ep: "S03 · E12 · 19:43 / 47:12", t1: "Mgła nad", t2: "Wisłoujściem", d: "42% · WCZORAJ" },
    { img: "/images/img-orbs.webp", pos: "center 25%", ep: "S03 · E08 · 12:08 / 01:02:47", t1: "Sygnał z", t2: "orbity", d: "19% · PORZUCONE" },
  ];
  const recos = [
    { img: "/images/img-hallway.webp", pos: "center", ep: "S03 · E11 · PSYCHOLOGICAL", t1: "Ostatnie", t2: "Światło", d: "52:08 · ★ 4.9" },
    { img: "/images/img-creature.webp", pos: "center 15%", ep: "S03 · E04 · TRUE HORROR", t1: "Dom przy", t2: "ul. Cisowej 7", d: "38:21 · ★ 4.9" },
    { img: "/images/img-wolf.webp", pos: "center 28%", ep: "S03 · E06 · MYTHOLOGY", t1: "Łańcuch", t2: "Fenrira", d: "01:22:55 · ★ 5.0" },
  ];
  const tabs = ["Słuchaj", "Szukaj", "Archiwum", "Ulubione", "Konto"];

  return (
    <div className="h-full overflow-y-auto bg-bg-0 pb-24 text-ink-0">
      {/* hero card */}
      <div className="relative h-[300px] overflow-hidden">
        <img src="/images/dada.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_50%,rgba(5,6,8,0.95))]" />
        <span className="absolute left-5 top-14 z-[2] border-l-2 border-red bg-black/60 px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono text-red backdrop-blur">
          // NOWE · DZIŚ
        </span>
        <div className="absolute inset-x-5 bottom-4 z-[2]">
          <div className="mb-1.5 font-mono text-[9px] tracking-mono text-red">SEZON 03 · ODCINEK 12 · FINAŁ</div>
          <div className="font-serif text-[28px] font-medium leading-none">
            Mgła nad <em className="italic text-ink-1">Wisłoujściem</em>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">// KONTYNUUJ SŁUCHANIE</h3>
        {rows.map((r) => (
          <IosListRow key={r.t2} r={r} />
        ))}
      </div>
      <div className="px-5 pt-6">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">// POLECANE TEJ NOCY</h3>
        {recos.map((r) => (
          <IosListRow key={r.t2} r={r} />
        ))}
      </div>

      {/* tab bar */}
      <div className="absolute inset-x-4 bottom-12 z-30 grid grid-cols-5 rounded-[22px] border border-white/10 bg-bg-2/95 p-2.5 backdrop-blur-xl">
        {tabs.map((tb, i) => (
          <span
            key={tb}
            className={`flex flex-col items-center gap-1 py-1.5 font-mono text-[8px] uppercase tracking-mono ${
              i === 0 ? "text-red" : "text-ink-2"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-current" />
            {tb}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Ekran iOS: Pełnoekranowy player ────────────────────────────
function IosPlayerScreen() {
  const viz = [0.3, 0.5, 0.7, 0.9, 0.6, 0.4, 0.8, 0.5, 0.7, 0.3, 0.5, 0.8, 0.4, 0.6, 0.9, 0.5, 0.7, 0.3, 0.4, 0.6, 0.8, 0.5, 0.7, 0.3, 0.5];
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/monster.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover brightness-50" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,6,8,0.4)_0%,transparent_30%,rgba(5,6,8,0.85)_70%)]" />
      </div>
      <div className="relative z-[2] flex min-h-full flex-col px-6 pb-10 pt-14">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-ui text-ink-1">
          <span>← MGŁA NAD WISŁOUJŚCIEM</span>
          <span>⋯</span>
        </div>

        <div className="mb-auto mt-10 text-center">
          <div className="mb-3.5 font-mono text-[10px] tracking-mono text-red">SEZON 03 · ODCINEK 12 · FINAŁ</div>
          <h1 className="mb-3 font-serif text-[40px] font-medium leading-none">
            Mgła nad <em className="italic text-ink-1">Wisłoujściem</em>
          </h1>
          <div className="font-serif text-[16px] italic text-ink-1">// rozdz. 04 · Pierwszy raz przy molo nocą</div>
        </div>

        <div className="mx-3 my-7 flex h-9 items-end gap-[2px]">
          {viz.map((h, i) => (
            <span key={i} className="flex-1 bg-[linear-gradient(180deg,#ff2a2a,rgba(255,42,42,0.3))]" style={{ height: `${h * 100}%` }} />
          ))}
        </div>

        <div className="mb-6 flex items-center gap-2.5 font-mono text-[11px] text-ink-1">
          <span className="text-red">19:43</span>
          <span className="relative h-[3px] flex-1 bg-white/10">
            <span className="absolute inset-y-0 left-0 w-[42%] bg-red shadow-[0_0_8px_rgba(255,42,42,0.5)]" />
          </span>
          <span>27:29</span>
        </div>

        <div className="mb-6 flex items-center justify-center gap-8 text-ink-1">
          <Prev size={20} />
          <span className="grid h-16 w-16 place-items-center rounded-full bg-ink-0 text-bg-0 shadow-[0_0_0_1px_rgba(255,255,255,0.2)]">
            <Pause size={22} />
          </span>
          <Next size={20} />
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[9px] uppercase tracking-ui text-ink-2">
          <span>1×</span>
          <span className="text-red">★</span>
          <span>⏰ 15</span>
          <span>↗</span>
          <span>FLAC</span>
        </div>
      </div>
    </div>
  );
}

// ── Ekran Android: Browse + mini player ────────────────────────
function AndroidBrowseScreen() {
  const chips = ["Wszystkie", "Psychologiczne", "Cosmic", "True Horror", "Folk", "Mitologia"];
  const cards = [
    { img: "/images/img-hallway.webp", t1: "Ostatnie", t2: "Światło" },
    { img: "/images/img-forest.webp", t1: "Coś patrzy", t2: "z lasu" },
    { img: "/images/img-tunnel.webp", t1: "Pod", t2: "betonem" },
    { img: "/images/img-wolf.webp", t1: "Łańcuch", t2: "Fenrira" },
  ];
  return (
    <div className="h-full overflow-y-auto bg-bg-0 pb-20 text-ink-0">
      <div className="m-4 flex items-center gap-3 rounded-xl border border-white/10 bg-bg-2/60 px-4 py-3.5 text-[14px] text-ink-1">
        <span className="text-ink-2">
          <SearchIcon size={18} />
        </span>
        <span>Szukaj historii, narratora, gatunku...</span>
      </div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-4">
        {chips.map((c, i) => (
          <span
            key={c}
            className={`whitespace-nowrap rounded-full border px-3.5 py-2 font-mono text-[10px] uppercase tracking-mono ${
              i === 0 ? "border-red bg-red text-white" : "border-white/10 bg-bg-2/60 text-ink-1"
            }`}
          >
            {c}
          </span>
        ))}
      </div>

      <div className="relative mx-4 mb-6 aspect-[16/11] overflow-hidden rounded-2xl bg-bg-1">
        <img src="/images/img-creature.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[center_15%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,6,8,0.95))]" />
        <div className="absolute inset-x-4 bottom-4 z-[2]">
          <div className="mb-1.5 font-mono text-[9px] tracking-mono text-red">// PREMIERA · DZIŚ</div>
          <div className="mb-1 font-serif text-[24px] leading-tight">
            Dom przy <em className="italic text-ink-1">ul. Cisowej 7</em>
          </div>
          <div className="font-mono text-[9px] tracking-ui text-ink-1">38:21 · ★ 4.9 · TRUE HORROR</div>
        </div>
      </div>

      <div className="px-4 pb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">// POPULARNE TEJ NOCY</div>
      <div className="grid grid-cols-2 gap-3 px-4">
        {cards.map((c) => (
          <div key={c.t2} className="relative aspect-[4/5] overflow-hidden rounded-xl bg-bg-1">
            <img src={c.img} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_40%,rgba(5,6,8,0.9))]" />
            <div className="absolute inset-x-3 bottom-2 z-[2] font-serif text-[16px] leading-tight">
              {c.t1} <em className="italic text-ink-1">{c.t2}</em>
            </div>
          </div>
        ))}
      </div>

      {/* mini player */}
      <div className="absolute inset-x-0 bottom-6 z-30 grid grid-cols-[44px_1fr_auto] items-center gap-3 border-t border-red/30 bg-bg-2/95 px-3 py-2.5 backdrop-blur-xl before:absolute before:left-0 before:top-0 before:h-0.5 before:w-[47%] before:bg-red before:shadow-[0_0_8px_rgba(255,42,42,0.5)] before:content-['']">
        <span className="h-11 w-11 bg-cover" style={{ backgroundImage: "url('/images/monster.webp')", backgroundPosition: "center 20%" }} />
        <span className="overflow-hidden">
          <span className="mb-0.5 block font-mono text-[8px] tracking-mono text-red">S03 · E12 · MGŁA</span>
          <span className="block truncate font-serif text-[15px] leading-tight">
            Mgła nad <em className="italic text-ink-1">Wisłoujściem</em>
          </span>
        </span>
        <span className="grid h-9 w-9 place-items-center rounded-full bg-red text-white">
          <Pause size={12} />
        </span>
      </div>
    </div>
  );
}

const FEATURES = [
  { num: "// 01", t1: "Offline", t2: "bez limitu", k: "f1", d: "Pobierz całą bibliotekę na telefon. 147 odcinków = ~46 GB w 320 kbps, ~12 GB w 192. Z FLAC: 130 GB." },
  { num: "// 02", t1: "Sleep", t2: "timer", k: "f2", d: "Auto-pauza po 15/30/45/60 min lub na końcu obecnego rozdziału. Z fade-out 30 sekund, żebyś nie obudził się w środku krzyku." },
  { num: "// 03", t1: "Synchronizacja", t2: "między urządzeniami", k: "f3", d: "Zatrzymaj na telefonie w drodze do domu, kontynuuj na MacBooku. Pozycja synchronizuje się co 10 sekund." },
  { num: "// 04", t1: "CarPlay", t2: "+ Android Auto", k: "f4", d: "Pełne wsparcie systemów samochodowych. Hands-free control, prosty interfejs dla kierowcy." },
  { num: "// 05", t1: "Apple Watch", t2: "+ Wear OS", k: "f5", d: "Mini-player na nadgarstku. Skip, pause, ulubione. Sterowanie głosem." },
  { num: "// 06", t1: "Dynamic Island", t2: "+ Live Activity", k: "f6", d: "Pokazujemy aktualny rozdział i progres w Dynamic Island (iPhone) i jako persistent notification (Android)." },
];

export default function App() {
  const { t } = useTranslation();

  const screens = [
    { tag: t("aplikacja.screen_ios_home", "// iOS · LISTEN · HOME"), accent: "red", node: <IosFrame><IosHomeScreen /></IosFrame> },
    { tag: t("aplikacja.screen_ios_player", "// iOS · FULL-SCREEN PLAYER"), accent: "red", node: <IosFrame><IosPlayerScreen /></IosFrame> },
    { tag: t("aplikacja.screen_android", "// ANDROID · BROWSE + MINI-PLAYER"), accent: "blue", node: <AndroidFrame><AndroidBrowseScreen /></AndroidFrame> },
  ];

  return (
    <div className="pt-[88px]">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-line px-5 pb-10 pt-8 sm:pb-14 sm:pt-12 lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Eyebrow className="mb-3 sm:mb-4">{t("aplikacja.eyebrow", "// APLIKACJA MOBILNA · iOS 16+ · ANDROID 11+")}</Eyebrow>
          <h1 className="mb-4 font-serif text-[clamp(40px,7vw,104px)] font-medium leading-[0.95] tracking-[-0.02em] sm:mb-5">
            {t("aplikacja.title_p1", "Obskura")} <em className="italic text-ink-1">{t("aplikacja.title_em", "w kieszeni")}</em>.
          </h1>
          <p className="mb-6 max-w-[640px] text-[15px] font-light leading-relaxed text-ink-1 sm:mb-8 sm:text-[17px]">
            {t("aplikacja.lead", "Cała platforma w aplikacji — offline, binauralne 3D, sleep timer, kontynuowanie odsłuchania między urządzeniami. Bez reklam, bez trackingu, 27 MB.")}
          </p>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            {[
              { lab: t("aplikacja.dl_label", "POBIERZ NA"), name: "App Store" },
              { lab: t("aplikacja.dl_label", "POBIERZ NA"), name: "Google Play" },
            ].map((p) => (
              <a
                key={p.name}
                href="#"
                className="inline-flex items-center gap-3.5 border border-line bg-bg-1/70 px-5 py-3.5 transition-colors hover:border-red hover:bg-red/[0.04]"
              >
                <span>
                  <span className="block font-mono text-[9px] uppercase tracking-mono text-ink-2">{p.lab}</span>
                  <span className="block font-serif text-[20px] italic leading-none">{p.name}</span>
                </span>
              </a>
            ))}
            <span className="font-mono text-[9px] uppercase tracking-mono text-ink-2 sm:text-[10px]">
              <strong className="text-ink-0">4.9 ★</strong> APP STORE · <strong className="text-ink-0">4.8 ★</strong> GOOGLE PLAY · <strong className="text-ink-0">320K</strong> POBRAŃ
            </span>
          </div>
        </div>
      </header>

      {/* SCREENS */}
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#050608_0%,#0a0d12_50%,#050608_100%)] px-5 py-12 sm:py-20 lg:px-12">
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 bg-[radial-gradient(circle,rgba(255,42,42,0.06),transparent_60%)]" />
        <div className="relative mx-auto flex max-w-[1400px] flex-col items-center gap-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-12">
          {screens.map((s) => (
            <div key={s.tag} className="flex w-full flex-col items-center gap-4 sm:w-auto">
              <span
                className={`flex items-center gap-2.5 font-mono text-[9px] uppercase tracking-mono text-ink-2 before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full before:content-[''] sm:text-[10px] ${
                  s.accent === "blue" ? "before:bg-blue before:shadow-[0_0_6px_#5fa8ff]" : "before:bg-red before:shadow-[0_0_6px_#ff2a2a]"
                }`}
              >
                {s.tag}
              </span>
              {s.node}
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto mt-12 max-w-[1400px] px-5 lg:mt-20 lg:px-12">
        <Eyebrow className="mb-4">{t("aplikacja.feat_eyebrow", "// EKSKLUZYWNIE W APLIKACJI")}</Eyebrow>
        <h2 className="font-serif text-[clamp(32px,5vw,64px)] font-medium leading-tight tracking-[-0.02em]">
          {t("aplikacja.feat_h_p1", "Czego")} <em className="italic text-ink-1">{t("aplikacja.feat_h_em", "nie ma na webie")}</em>.
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:mt-10 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.num} className="border border-line bg-bg-1/50 p-6 transition-colors hover:border-red/40 sm:p-8">
              <div className="mb-3.5 font-mono text-[11px] tracking-mono text-red">{f.num}</div>
              <h3 className="mb-3 font-serif text-[24px] font-medium leading-tight sm:text-[28px]">
                {t(`aplikacja.${f.k}_t1`, f.t1)} <em className="italic text-ink-1">{t(`aplikacja.${f.k}_t2`, f.t2)}</em>
              </h3>
              <p className="text-[14px] font-light leading-relaxed text-ink-1">{t(`aplikacja.${f.k}_d`, f.d)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* QR */}
      <section className="mx-auto mt-12 max-w-[1100px] px-5 pb-16 sm:pb-24 lg:mt-20 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-8 border border-line bg-bg-1/50 p-6 sm:gap-12 sm:p-8 lg:grid-cols-[240px_1fr] lg:p-12">
          <div className="relative mx-auto grid h-[160px] w-[160px] place-items-center bg-ink-0 p-4 sm:h-[200px] sm:w-[200px] lg:h-[240px] lg:w-[240px]">
            <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
              <rect width="200" height="200" fill="#f4f1ea" />
              <g fill="#050608">
                <rect x="10" y="10" width="40" height="40" />
                <rect x="20" y="20" width="20" height="20" fill="#f4f1ea" />
                <rect x="25" y="25" width="10" height="10" />
                <rect x="150" y="10" width="40" height="40" />
                <rect x="160" y="20" width="20" height="20" fill="#f4f1ea" />
                <rect x="165" y="25" width="10" height="10" />
                <rect x="10" y="150" width="40" height="40" />
                <rect x="20" y="160" width="20" height="20" fill="#f4f1ea" />
                <rect x="25" y="165" width="10" height="10" />
                <rect x="60" y="10" width="10" height="10" /><rect x="80" y="10" width="10" height="10" /><rect x="100" y="10" width="10" height="10" /><rect x="120" y="10" width="10" height="10" />
                <rect x="60" y="30" width="10" height="10" /><rect x="100" y="30" width="10" height="10" /><rect x="140" y="30" width="10" height="10" />
                <rect x="10" y="60" width="10" height="10" /><rect x="40" y="60" width="10" height="10" /><rect x="80" y="60" width="10" height="10" /><rect x="120" y="60" width="10" height="10" /><rect x="170" y="60" width="10" height="10" />
                <rect x="30" y="90" width="10" height="10" /><rect x="80" y="90" width="10" height="10" /><rect x="100" y="90" width="10" height="10" /><rect x="140" y="90" width="10" height="10" />
                <rect x="40" y="110" width="10" height="10" /><rect x="110" y="110" width="10" height="10" /><rect x="180" y="110" width="10" height="10" />
                <rect x="60" y="150" width="10" height="10" /><rect x="120" y="150" width="10" height="10" /><rect x="170" y="150" width="10" height="10" />
                <rect x="80" y="180" width="10" height="10" /><rect x="150" y="180" width="10" height="10" />
              </g>
            </svg>
          </div>
          <div>
            <Eyebrow accent="blue" className="mb-4">{t("aplikacja.qr_eyebrow", "// SKANUJ TELEFONEM")}</Eyebrow>
            <h2 className="mb-3.5 font-serif text-[clamp(28px,4vw,40px)] font-medium leading-tight">
              {t("aplikacja.qr_h_p1", "Otwórz")} <em className="italic text-ink-1">{t("aplikacja.qr_h_em", "aparat")}</em> {t("aplikacja.qr_h_p2", "w telefonie")}.
            </h2>
            <p className="text-[14px] font-light leading-relaxed text-ink-1 sm:text-[15px]">
              {t("aplikacja.qr_desc", "Skieruj na kod, kliknij banner — automatycznie otwieramy stronę z aplikacją w odpowiednim sklepie. Bez instalowania osobnej apki do skanowania.")}
            </p>
            <div className="mt-6 font-mono text-[10px] uppercase tracking-mono text-ink-2 sm:text-[11px]">
              APP STORE · GOOGLE PLAY · 27 MB · WERSJA 4.2.3 · POPRAWKI 24.05.2026
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
