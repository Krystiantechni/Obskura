import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, Loader } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Play, SearchIcon } from "../components/ui/Icons";

const STATES = [
  { id: "loading", label: "Ładowanie", dot: "bg-blue", code: "STATE-001" },
  { id: "empty", label: "Puste · brak danych", dot: "bg-[#00ff88]", code: "STATE-002" },
  { id: "search", label: "Brak wyników", dot: "bg-[#00ff88]", code: "STATE-003" },
  { id: "offline", label: "Offline", dot: "bg-[#ffaa44]", code: "STATE-004" },
  { id: "404", label: "404 · nie znaleziono", dot: "bg-red", code: "STATE-005" },
  { id: "500", label: "500 · awaria serwera", dot: "bg-red", code: "STATE-006" },
  { id: "maint", label: "Maintenance", dot: "bg-[#ffaa44]", code: "STATE-007" },
  { id: "expired", label: "Subskrypcja wygasła", dot: "bg-red", code: "STATE-008" },
];

const META = {
  loading: {
    title: (<>Ładowanie <em className="italic text-ink-1">strony głównej</em></>),
    desc: (<>Pokazywany przez <strong className="font-medium text-ink-0">maksymalnie 800ms</strong>. Po tym czasie automatycznie pokazujemy treść (z fallbackiem jeśli sieć padła). Skeleton odtwarza ostatnio widziany układ.</>),
    tech: { trigger: "COLD START", when: "PIERWSZE WEJŚCIE / RELOAD", timeout: "800ms", browser: "OBSKURA.AUDIO · ŁADOWANIE...", status: "OBSKURA · v4.2.3" },
  },
  empty: {
    title: (<>Puste <em className="italic text-ink-1">archiwum / lista</em></>),
    desc: (<>Gdy użytkownik nie ma jeszcze ulubionych, historii ani komentarzy. <strong className="font-medium text-ink-0">Pusty stan to zaproszenie</strong>, nie błąd — copy ma motywować, nie pouczać.</>),
    tech: { trigger: "EMPTY DATASET", when: "PIERWSZE WEJŚCIE NA SEKCJĘ", timeout: "BRAK", browser: "OBSKURA.AUDIO/KONTO/ULUBIONE", status: "OBSKURA · v4.2.3" },
  },
  search: {
    title: (<>Wyszukiwanie <em className="italic text-ink-1">bez wyników</em></>),
    desc: (<>Pokazujemy zapytanie, sugerujemy podobne. <strong className="font-medium text-ink-0">Nigdy</strong> nie wracamy pustym ekranem — zawsze 5 chipów z podobnymi gatunkami.</>),
    tech: { trigger: "ZERO RESULTS", when: "PO QUERY > 3 ZNAKI", timeout: "BRAK", browser: "OBSKURA.AUDIO/ARCHIWUM?Q=ZOMBIE", status: "OBSKURA · v4.2.3" },
  },
  offline: {
    title: (<>Tryb <em className="italic text-ink-1">offline</em></>),
    desc: (<>Sieć padła? Pokazujemy <strong className="font-medium text-ink-0">pobrane wcześniej odcinki</strong> i status sieci. Status auto-refresh co 5s.</>),
    tech: { trigger: "NETWORK ERROR", when: "NAVIGATOR.ONLINE = FALSE", timeout: "RETRY 5S", browser: "OBSKURA.AUDIO · OFFLINE", status: "◉ OFFLINE" },
  },
  404: {
    title: (<>404 · <em className="italic text-ink-1">strona nie istnieje</em></>),
    desc: (<>Klasyczny 404. <strong className="font-medium text-ink-0">Z atmosferą</strong> — kod jako element wizualny, copy w naszym tonie.</>),
    tech: { trigger: "HTTP 404", when: "PATH NIE PASUJE DO ROUTERA", timeout: "BRAK", browser: "OBSKURA.AUDIO/SCIEZKA-KTOREJ-NIE-MA", status: "OBSKURA · v4.2.3" },
  },
  500: {
    title: (<>500 · <em className="italic text-ink-1">awaria serwera</em></>),
    desc: (<>Coś u nas się zepsuło. <strong className="font-medium text-ink-0">Bez paniki</strong>, automatycznie loguje się do Sentry. User dostaje status i opcję ponowienia.</>),
    tech: { trigger: "HTTP 500", when: "BACKEND EXCEPTION", timeout: "AUTO-RETRY 30S", browser: "OBSKURA.AUDIO · BŁĄD SERWERA", status: "OBSKURA · v4.2.3" },
  },
  maint: {
    title: (<>Maintenance <em className="italic text-ink-1">planowane</em></>),
    desc: (<>Aktualizujemy infrastrukturę. <strong className="font-medium text-ink-0">Tylko zaplanowane przerwy</strong> w godz. 4–6. Pokazujemy timeline z postępem migracji.</>),
    tech: { trigger: "FLAG SET", when: "CO ~ 4 MIESIĄCE · NIEDZIELA 04:00", timeout: "60-120 MIN", browser: "OBSKURA.AUDIO · MAINTENANCE", status: "◉ MAINTENANCE" },
  },
  expired: {
    title: (<>Subskrypcja <em className="italic text-ink-1">wygasła</em></>),
    desc: (<>Po końcu opłaconego okresu. <strong className="font-medium text-ink-0">Bez agresji</strong> — pokazujemy opcje równolegle (downgrade na Próg, ponowne włączenie).</>),
    tech: { trigger: "STRIPE EVENT · SUBSCRIPTION.DELETED", when: "PO DACIE WYGAŚNIĘCIA + 24H", timeout: "BRAK", browser: "OBSKURA.AUDIO/KONTO", status: "OBSKURA · v4.2.3" },
  },
};

function Loading() {
  return (
    <>
      <div className="absolute left-10 top-9 flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">
        <span className="h-2 w-2 rounded-full bg-red shadow-[0_0_12px_#ff2a2a] animate-obskura-pulse-fast" />
        Ładowanie · wysyłamy zapytanie...
      </div>
      <div className="w-full max-w-[900px]">
        <div className="relative mb-8 h-[200px] animate-pulse overflow-hidden bg-white/[0.03]" />
        <div className="mb-8 grid grid-cols-2 gap-5 sm:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="relative aspect-[3/4] animate-pulse overflow-hidden bg-white/[0.03]" />
          ))}
        </div>
        <div className="mb-3 h-3.5 w-[90%] animate-pulse bg-white/[0.03]" />
        <div className="h-3.5 w-[60%] animate-pulse bg-white/[0.03]" />
      </div>
    </>
  );
}

function Empty() {
  return (
    <div className="max-w-[520px] text-center">
      <div className="relative mx-auto mb-7 grid h-20 w-20 place-items-center border border-line text-ink-2">
        <Inbox size={32} strokeWidth={1.5} />
      </div>
      <Eyebrow centered className="mb-4">// Ulubione · Brak</Eyebrow>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">Cisza w <em className="italic text-ink-1">twoich ulubionych</em>.</h3>
      <p className="mb-7 text-[15px] font-light leading-relaxed text-ink-1">Nie polubiłeś jeszcze żadnego odcinka. Posłuchaj kilku i kliknij serce — wrócimy do nich razem.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton to="/archiwum">Przeglądaj archiwum →</HorrorButton>
        <HorrorButton to="/" variant="ghost">Polecane tej nocy</HorrorButton>
      </div>
    </div>
  );
}

function NoSearchResults() {
  const chips = ["Psychologiczne (12)", "Cosmic dread (18)", "True horror (22)", "Folk horror (14)", "Mitologia (9)"];
  return (
    <div className="max-w-[540px] text-center">
      <Eyebrow centered className="mb-4">// Szukaj · 0 wyników</Eyebrow>
      <div className="mb-6 inline-block border border-line bg-black/40 px-4 py-2.5 font-mono text-[13px] tracking-ui text-ink-0">
        Szukałeś: <span className="text-red">&quot;zombie vampires harem&quot;</span>
      </div>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">Nie mamy tego, <em className="italic text-ink-1">czego szukasz</em>.</h3>
      <p className="text-[15px] font-light leading-relaxed text-ink-1">Może spróbuj inaczej. Albo poszukaj czegoś, co mamy.</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {chips.map((c) => (
          <button key={c} type="button" className="border border-red/30 bg-red/[0.06] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-red transition-colors hover:bg-red hover:text-white">
            {c}
          </button>
        ))}
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        Albo zaproponuj nam temat → <a href="/forum" className="text-red">Forum propozycji</a>
      </div>
    </div>
  );
}

function OfflineRow({ img, pos, ep, t1, em, size }) {
  return (
    <div className="grid grid-cols-[48px_1fr_auto_auto] items-center gap-3.5 border-b border-line-soft px-5 py-3 text-left last:border-b-0">
      <div className="h-12 w-12 bg-cover" style={{ backgroundImage: `url('${img}')`, backgroundPosition: pos }} />
      <div>
        <div className="mb-0.5 font-mono text-[9px] tracking-mono text-red">{ep}</div>
        <div className="font-serif text-base leading-tight">{t1} <em className="italic text-ink-1">{em}</em></div>
      </div>
      <div className="font-mono text-[10px] tracking-ui text-ink-2">{size}</div>
      <div className="text-[#00ff88]"><Play size={14} /></div>
    </div>
  );
}
OfflineRow.propTypes = {
  img: PropTypes.string.isRequired, pos: PropTypes.string, ep: PropTypes.string.isRequired,
  t1: PropTypes.string.isRequired, em: PropTypes.string.isRequired, size: PropTypes.string.isRequired,
};

function Offline() {
  return (
    <div className="w-full max-w-[680px] text-center">
      <div className="mb-8 inline-flex items-center gap-3 border border-[#ffaa44]/30 bg-[#ffaa44]/[0.04] px-5 py-3.5 font-mono text-[11px] uppercase tracking-mono text-[#ffaa44]">
        <span className="h-2 w-2 rounded-full bg-[#ffaa44] shadow-[0_0_8px_#ffaa44] animate-obskura-pulse-fast" />
        Brak internetu · tryb offline aktywny
      </div>
      <h3 className="mb-3 font-serif text-4xl font-medium leading-tight">Cisza <em className="italic text-ink-1">radiowa</em>.</h3>
      <p className="text-[15px] font-light leading-relaxed text-ink-1">Twoja sieć nie odpowiada. Sprawdzamy ponownie co 5 sekund. Tymczasem — masz 12 pobranych odcinków.</p>

      <div className="mt-9 border border-line bg-bg-2/50 text-left">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">
          <span>// Pobrane lokalnie</span>
          <span className="text-[#00ff88]">12 odcinków · 4.8 GB · ✓ aktualne</span>
        </div>
        <OfflineRow img="/images/monster.webp" pos="center 20%" ep="S03 · E12" t1="Mgła nad" em="Wisłoujściem" size="412 MB" />
        <OfflineRow img="/images/img-hallway.webp" pos="center" ep="S03 · E11" t1="Ostatnie" em="Światło" size="487 MB" />
        <OfflineRow img="/images/img-creature.webp" pos="center 15%" ep="S03 · E04" t1="Dom przy" em="ul. Cisowej 7" size="356 MB" />
      </div>

      <div className="mt-6 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        Automatyczne ponowienie za · <span className="text-red">00:00:03</span>
      </div>
    </div>
  );
}

function ErrCode({ code }) {
  return (
    <div className="relative my-2 inline-block">
      <span className="font-serif text-[clamp(120px,18vw,240px)] font-medium leading-[0.85] tracking-[-0.04em] text-red drop-shadow-[0_0_32px_rgba(255,42,42,0.4)]">{code}</span>
    </div>
  );
}
ErrCode.propTypes = { code: PropTypes.string.isRequired };

function Err404() {
  return (
    <div className="max-w-[640px] text-center">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">// HTTP 404 · błąd nawigacji</div>
      <ErrCode code="404" />
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">Nie znajdziesz <em className="italic text-ink-1">tego, czego nie ma</em>.</h3>
      <p className="mx-auto mb-7 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">Strona pod tym adresem nie istnieje. Może została usunięta, może nigdy nie istniała. Możesz wrócić — albo zostać tu jeszcze chwilę.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton to="/">← Strona główna</HorrorButton>
        <HorrorButton to="/archiwum" variant="ghost">Archiwum</HorrorButton>
        <HorrorButton to="/wsparcie" variant="ghost">Pomoc</HorrorButton>
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-3">
        Próbowałeś otworzyć: <span className="text-ink-2">obskura.audio/ten-pokoj-nie-istnieje</span>
      </div>
    </div>
  );
}

function Err500() {
  return (
    <div className="max-w-[640px] text-center">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">// HTTP 500 · coś nie działa · zgłosiliśmy sobie</div>
      <ErrCode code="500" />
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">To <em className="italic text-ink-1">nasz</em> błąd, nie twój.</h3>
      <p className="mx-auto mb-7 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">Coś poszło nie tak na naszej stronie. Już o tym wiemy, pracujemy nad naprawą. Możesz spróbować ponownie — odświeżymy stronę za 30 sekund automatycznie.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton type="button">↻ Spróbuj ponownie</HorrorButton>
        <HorrorButton to="/wsparcie" variant="ghost">Status systemów</HorrorButton>
      </div>
      <div className="mx-auto mt-8 max-w-md border border-line bg-black/40 px-5 py-3.5 font-mono text-[10px] tracking-ui text-ink-2">
        BŁĄD ID: <span className="text-red">err_8f4d92b3c8e1f5a7</span> · WYSŁANY DO SENTRY · 26.05.2026 14:23:08
      </div>
    </div>
  );
}

function Maintenance() {
  const rows = [
    { time: "04:00", lbl: "Maintenance start · backup bazy · 4.8 GB", state: "done" },
    { time: "04:14", lbl: "Migracja schematu · 12 tabel", state: "done" },
    { time: "04:42", lbl: "Migracja indeksów · 47 indeksów", state: "done" },
    { time: "05:12", lbl: (<>Re-cache odcinków na CDN · <span className="text-red">w trakcie · 87/147</span></>), state: "cur" },
    { time: "~05:30", lbl: "Smoke testy · automatyczne", state: "" },
    { time: "~05:47", lbl: "Powrót do produkcji", state: "" },
  ];
  return (
    <div className="max-w-[640px] text-center">
      <Eyebrow centered className="mb-6">// Planowane maintenance · 26.05.2026 · 04:00 — 06:00 CET</Eyebrow>
      <div className="mb-6 font-serif text-5xl italic text-ink-0 sm:text-6xl">Wracamy o <span className="text-red">05:47</span>.</div>
      <h3 className="mb-4 font-serif text-3xl font-medium leading-tight">Migrujemy <em className="italic text-ink-1">bazę danych</em>.</h3>
      <p className="mx-auto mb-8 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">Ostatni krok przed sezonem 04 — przepisujemy bazę odcinków na nowy silnik. Twoje dane są bezpieczne, pobrane odcinki działają normalnie.</p>
      <div className="border border-line bg-black/40 p-5 text-left">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3.5 border-b border-line-soft py-2.5 font-mono text-[11px] tracking-ui last:border-b-0">
            <span className="min-w-[80px] text-[10px] text-ink-2">{r.time}</span>
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${r.state === "done" ? "bg-[#00ff88]" : r.state === "cur" ? "bg-red shadow-[0_0_8px_#ff2a2a] animate-obskura-pulse-fast" : "bg-ink-3"}`} />
            <span className={r.state === "done" ? "text-ink-2 line-through" : r.state === "cur" ? "text-ink-0" : "text-ink-1"}>{r.lbl}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        Status na żywo · <a href="/wsparcie" className="text-red">status.obskura.audio →</a>
      </div>
    </div>
  );
}

function Expired() {
  const opts = [
    { featured: true, t1: "Włącz ponownie", em: "Solo", desc: "Pełny dostęp wraca natychmiast. Tym razem 25 zł / mies. (oferta powrotna, -14% przez 6 mies.)." },
    { featured: false, t1: "Zostań", em: "na Progu", desc: "Limit 20 odcinków/mies., reklamy między rozdziałami, jakość 192 kbps. Za darmo, bez limitu czasowego." },
  ];
  return (
    <div className="max-w-[640px] text-center">
      <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-full border-2 border-red font-serif text-4xl italic text-red shadow-[0_0_32px_rgba(255,42,42,0.2)]">!</div>
      <Eyebrow centered className="mb-4">// Plan Solo · wygasł 14.05.2026</Eyebrow>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">Twój dostęp <em className="italic text-ink-1">wygasł wczoraj</em>.</h3>
      <p className="mb-2 text-[15px] font-light leading-relaxed text-ink-1">Konto pozostaje twoje — historia, ulubione, komentarze. Od dziś jesteś na planie <strong className="font-medium text-ink-0">Próg</strong> (20 odcinków / miesiąc, z reklamami).</p>
      <p className="text-sm font-light leading-relaxed text-ink-1">Nie ma presji. Wybierz co dalej — kiedy chcesz.</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opts.map((o, i) => (
          <a key={i} href="/klub" className={`relative block border p-6 text-left transition-all duration-200 ${o.featured ? "border-red bg-red/[0.04]" : "border-line bg-bg-2/50 hover:border-red hover:bg-red/[0.04]"}`}>
            {o.featured && <span className="absolute -top-4 left-6 font-mono text-[9px] uppercase tracking-eyebrow text-red">Polecane</span>}
            <h4 className="mb-1.5 font-serif text-xl font-medium">{o.t1} <em className="italic text-ink-1">{o.em}</em></h4>
            <p className="text-xs font-light leading-relaxed text-ink-1">{o.desc}</p>
          </a>
        ))}
      </div>
      <div className="mt-6 font-mono text-[10px] uppercase tracking-ui text-ink-2">Twoje pobrane offline wygasną 14.06.2026 (30 dni karencji)</div>
    </div>
  );
}

const STAGES = {
  loading: Loading, empty: Empty, search: NoSearchResults, offline: Offline,
  404: Err404, 500: Err500, maint: Maintenance, expired: Expired,
};

export default function Stany() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("loading");
  const cur = STATES.find((s) => s.id === tab);
  const m = META[tab];
  const Stage = STAGES[tab];

  return (
    <>
      {/* Header */}
      <header className="border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div className="mx-auto max-w-[1400px]">
          <Eyebrow>{t("stany.eyebrow", "// Stany UI · 8 ekranów · biblioteka wspólna")}</Eyebrow>
          <h1 className="my-4 font-serif text-[clamp(48px,6vw,80px)] font-medium leading-[0.95] tracking-[-0.02em]">
            Co widzi użytkownik, <em className="italic text-ink-1">gdy coś nie idzie z planem</em>.
          </h1>
          <p className="max-w-[620px] text-base font-light leading-relaxed text-ink-1">
            Osiem stanów UI w jednym miejscu — od ładowania po awarię, od pustego archiwum po wygaśniętą subskrypcję. Każdy zaprojektowany tak, że problem to też okazja do dobrego copy i wizualnej tożsamości.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[68px] z-40 border-b border-line bg-bg-1/85 px-5 backdrop-blur-xl lg:px-12">
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto">
          {STATES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTab(s.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-4 font-mono text-[11px] uppercase tracking-mono transition-colors ${
                tab === s.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
              }`}
            >
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.dot}`} />
              <span>{s.label}</span>
              <span className={`text-[9px] ${tab === s.id ? "text-red" : "text-ink-3"}`}>{s.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mx-auto mt-10 max-w-[1400px] px-5 pb-20 lg:px-12">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <Eyebrow>// {cur.code}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-none">{m.title}</h2>
            <p className="mt-1.5 max-w-[520px] text-[13px] font-light leading-relaxed text-ink-1">{m.desc}</p>
          </div>
          <div className="text-right font-mono text-[10px] uppercase tracking-ui text-ink-2">
            Wyzwalacz<strong className="mt-1 block text-ink-0">{m.tech.trigger}</strong>
            <div className="mt-2.5">Kiedy<strong className="mt-1 block text-ink-0">{m.tech.when}</strong></div>
            <div className="mt-2.5">Timeout<strong className="mt-1 block text-ink-0">{m.tech.timeout}</strong></div>
          </div>
        </div>

        {/* Browser frame */}
        <div className="relative min-h-[600px] overflow-hidden border border-line bg-bg-0">
          <div className="flex items-center gap-3 border-b border-line bg-bg-2/95 px-4 py-3 font-mono text-[11px] tracking-ui text-ink-2">
            <div className="flex gap-1.5">
              <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f56]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#ffbd2e]" />
              <span className="h-[11px] w-[11px] rounded-full bg-[#27c93f]" />
            </div>
            <div className="hidden flex-1 truncate bg-black/40 px-3.5 py-1.5 text-center text-ink-1 sm:block">{m.tech.browser}</div>
            <div className="ml-auto flex items-center gap-2">
              {tab === "loading" && <Loader size={12} className="animate-spin text-blue" aria-hidden />}
              {tab === "404" && <AlertTriangle size={12} className="text-red" aria-hidden />}
              {tab === "500" && <AlertTriangle size={12} className="text-red" aria-hidden />}
              {tab === "search" && <SearchIcon size={12} />}
              <span>{m.tech.status}</span>
            </div>
          </div>
          <div className="relative flex min-h-[540px] flex-col items-center justify-center px-5 py-16 sm:px-10">
            <Stage />
          </div>
        </div>
      </div>
    </>
  );
}
