import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, Loader } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Play, SearchIcon } from "../components/ui/Icons";

function Loading({ t }) {
  return (
    <>
      <div className="absolute left-10 top-9 flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">
        <span className="h-2 w-2 rounded-full bg-red shadow-[0_0_12px_#ff2a2a] animate-obskura-pulse-fast" />
        {t("stany.loading_label", "Ładowanie · wysyłamy zapytanie...")}
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
Loading.propTypes = { t: PropTypes.func.isRequired };

function Empty({ t }) {
  return (
    <div className="max-w-[520px] text-center">
      <div className="relative mx-auto mb-7 grid h-20 w-20 place-items-center border border-line text-ink-2">
        <Inbox size={32} strokeWidth={1.5} />
      </div>
      <Eyebrow centered className="mb-4">{t("stany.empty_eyebrow", "// Ulubione · Brak")}</Eyebrow>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">{t("stany.empty_h_p1", "Cisza w")} <em className="italic text-ink-1">{t("stany.empty_h_em", "twoich ulubionych")}</em>.</h3>
      <p className="mb-7 text-[15px] font-light leading-relaxed text-ink-1">{t("stany.empty_p", "Nie polubiłeś jeszcze żadnego odcinka. Posłuchaj kilku i kliknij serce — wrócimy do nich razem.")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton to="/archive">{t("stany.empty_cta_browse", "Przeglądaj archiwum →")}</HorrorButton>
        <HorrorButton to="/" variant="ghost">{t("stany.empty_cta_picks", "Polecane tej nocy")}</HorrorButton>
      </div>
    </div>
  );
}
Empty.propTypes = { t: PropTypes.func.isRequired };

function NoSearchResults({ t }) {
  const chips = [
    t("stany.search_chip_psy", "Psychologiczne (12)"),
    t("stany.search_chip_cosmic", "Cosmic dread (18)"),
    t("stany.search_chip_true", "True horror (22)"),
    t("stany.search_chip_folk", "Folk horror (14)"),
    t("stany.search_chip_myth", "Mitologia (9)"),
  ];
  return (
    <div className="max-w-[540px] text-center">
      <Eyebrow centered className="mb-4">{t("stany.search_eyebrow", "// Szukaj · 0 wyników")}</Eyebrow>
      <div className="mb-6 inline-block border border-line bg-black/40 px-4 py-2.5 font-mono text-[13px] tracking-ui text-ink-0">
        {t("stany.search_query_label", "Szukałeś:")} <span className="text-red">&quot;{t("stany.search_query_val", "zombie vampires harem")}&quot;</span>
      </div>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">{t("stany.search_h_p1", "Nie mamy tego,")} <em className="italic text-ink-1">{t("stany.search_h_em", "czego szukasz")}</em>.</h3>
      <p className="text-[15px] font-light leading-relaxed text-ink-1">{t("stany.search_p", "Może spróbuj inaczej. Albo poszukaj czegoś, co mamy.")}</p>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {chips.map((c) => (
          <button key={c} type="button" className="border border-red/30 bg-red/[0.06] px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-eyebrow text-red transition-colors hover:bg-red hover:text-white">
            {c}
          </button>
        ))}
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        {t("stany.search_forum_p1", "Albo zaproponuj nam temat →")} <a href="/forum" className="text-red">{t("stany.search_forum_link", "Forum propozycji")}</a>
      </div>
    </div>
  );
}
NoSearchResults.propTypes = { t: PropTypes.func.isRequired };

function OfflineRow({ img, pos, ep, t1, em, size }) {
  return (
    <div className="grid grid-cols-[40px_1fr_auto] items-center gap-2.5 border-b border-line-soft px-4 py-3 text-left last:border-b-0 sm:grid-cols-[48px_1fr_auto_auto] sm:gap-3.5 sm:px-5">
      <div className="h-10 w-10 bg-cover sm:h-12 sm:w-12" style={{ backgroundImage: `url('${img}')`, backgroundPosition: pos }} />
      <div>
        <div className="mb-0.5 font-mono text-[9px] tracking-mono text-red">{ep}</div>
        <div className="font-serif text-[15px] leading-tight sm:text-base">{t1} <em className="italic text-ink-1">{em}</em></div>
      </div>
      <div className="hidden font-mono text-[10px] tracking-ui text-ink-2 sm:block">{size}</div>
      <div className="text-[#00ff88]"><Play size={14} /></div>
    </div>
  );
}
OfflineRow.propTypes = {
  img: PropTypes.string.isRequired, pos: PropTypes.string, ep: PropTypes.string.isRequired,
  t1: PropTypes.string.isRequired, em: PropTypes.string.isRequired, size: PropTypes.string.isRequired,
};

function Offline({ t }) {
  return (
    <div className="w-full max-w-[680px] text-center">
      <div className="mb-8 inline-flex items-center gap-3 border border-[#ffaa44]/30 bg-[#ffaa44]/[0.04] px-5 py-3.5 font-mono text-[11px] uppercase tracking-mono text-[#ffaa44]">
        <span className="h-2 w-2 rounded-full bg-[#ffaa44] shadow-[0_0_8px_#ffaa44] animate-obskura-pulse-fast" />
        {t("stany.offline_label", "Brak internetu · tryb offline aktywny")}
      </div>
      <h3 className="mb-3 font-serif text-4xl font-medium leading-tight">{t("stany.offline_h_p1", "Cisza")} <em className="italic text-ink-1">{t("stany.offline_h_em", "radiowa")}</em>.</h3>
      <p className="text-[15px] font-light leading-relaxed text-ink-1">{t("stany.offline_p", "Twoja sieć nie odpowiada. Sprawdzamy ponownie co 5 sekund. Tymczasem — masz 12 pobranych odcinków.")}</p>

      <div className="mt-9 border border-line bg-bg-2/50 text-left">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">
          <span>{t("stany.offline_downloaded_label", "// Pobrane lokalnie")}</span>
          <span className="text-[#00ff88]">{t("stany.offline_downloaded_meta", "12 odcinków · 4.8 GB · ✓ aktualne")}</span>
        </div>
        <OfflineRow img="/images/monster.webp" pos="center 20%" ep="S03 · E12" t1={t("stany.offline_row1_t1", "Mgła nad")} em={t("stany.offline_row1_em", "Wisłoujściem")} size="412 MB" />
        <OfflineRow img="/images/img-hallway.webp" pos="center" ep="S03 · E11" t1={t("stany.offline_row2_t1", "Ostatnie")} em={t("stany.offline_row2_em", "Światło")} size="487 MB" />
        <OfflineRow img="/images/img-creature.webp" pos="center 15%" ep="S03 · E04" t1={t("stany.offline_row3_t1", "Dom przy")} em={t("stany.offline_row3_em", "ul. Cisowej 7")} size="356 MB" />
      </div>

      <div className="mt-6 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        {t("stany.offline_retry", "Automatyczne ponowienie za ·")} <span className="text-red">00:00:03</span>
      </div>
    </div>
  );
}
Offline.propTypes = { t: PropTypes.func.isRequired };

function ErrCode({ code }) {
  return (
    <div className="relative my-2 inline-block">
      <span className="font-serif text-[clamp(120px,18vw,240px)] font-medium leading-[0.85] tracking-[-0.04em] text-red drop-shadow-[0_0_32px_rgba(255,42,42,0.4)]">{code}</span>
    </div>
  );
}
ErrCode.propTypes = { code: PropTypes.string.isRequired };

function Err404({ t }) {
  return (
    <div className="max-w-[640px] text-center">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">{t("stany.err404_eyebrow", "// HTTP 404 · błąd nawigacji")}</div>
      <ErrCode code="404" />
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">{t("stany.err404_h_p1", "Nie znajdziesz")} <em className="italic text-ink-1">{t("stany.err404_h_em", "tego, czego nie ma")}</em>.</h3>
      <p className="mx-auto mb-7 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">{t("stany.err404_p", "Strona pod tym adresem nie istnieje. Może została usunięta, może nigdy nie istniała. Możesz wrócić — albo zostać tu jeszcze chwilę.")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton to="/">{t("stany.err404_cta_home", "← Strona główna")}</HorrorButton>
        <HorrorButton to="/archive" variant="ghost">{t("stany.err404_cta_archive", "Archiwum")}</HorrorButton>
        <HorrorButton to="/support" variant="ghost">{t("stany.err404_cta_help", "Pomoc")}</HorrorButton>
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-3">
        {t("stany.err404_url_label", "Próbowałeś otworzyć:")} <span className="text-ink-2">obskura.audio/ten-pokoj-nie-istnieje</span>
      </div>
    </div>
  );
}
Err404.propTypes = { t: PropTypes.func.isRequired };

function Err500({ t }) {
  return (
    <div className="max-w-[640px] text-center">
      <div className="mb-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">{t("stany.err500_eyebrow", "// HTTP 500 · coś nie działa · zgłosiliśmy sobie")}</div>
      <ErrCode code="500" />
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">{t("stany.err500_h_p1", "To")} <em className="italic text-ink-1">{t("stany.err500_h_em", "nasz")}</em> {t("stany.err500_h_p2", "błąd, nie twój.")}</h3>
      <p className="mx-auto mb-7 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">{t("stany.err500_p", "Coś poszło nie tak na naszej stronie. Już o tym wiemy, pracujemy nad naprawą. Możesz spróbować ponownie — odświeżymy stronę za 30 sekund automatycznie.")}</p>
      <div className="flex flex-wrap justify-center gap-3">
        <HorrorButton type="button">{t("stany.err500_cta_retry", "↻ Spróbuj ponownie")}</HorrorButton>
        <HorrorButton to="/support" variant="ghost">{t("stany.err500_cta_status", "Status systemów")}</HorrorButton>
      </div>
      <div className="mx-auto mt-8 max-w-md border border-line bg-black/40 px-5 py-3.5 font-mono text-[10px] tracking-ui text-ink-2">
        {t("stany.err500_err_id_label", "BŁĄD ID:")} <span className="text-red">err_8f4d92b3c8e1f5a7</span> {t("stany.err500_err_id_meta", "· WYSŁANY DO SENTRY · 26.05.2026 14:23:08")}
      </div>
    </div>
  );
}
Err500.propTypes = { t: PropTypes.func.isRequired };

function Maintenance({ t }) {
  const rows = [
    { time: "04:00", lbl: t("stany.maint_row1", "Maintenance start · backup bazy · 4.8 GB"), state: "done" },
    { time: "04:14", lbl: t("stany.maint_row2", "Migracja schematu · 12 tabel"), state: "done" },
    { time: "04:42", lbl: t("stany.maint_row3", "Migracja indeksów · 47 indeksów"), state: "done" },
    { time: "05:12", lbl: (<>{t("stany.maint_row4_p1", "Re-cache odcinków na CDN ·")} <span className="text-red">{t("stany.maint_row4_em", "w trakcie · 87/147")}</span></>), state: "cur" },
    { time: "~05:30", lbl: t("stany.maint_row5", "Smoke testy · automatyczne"), state: "" },
    { time: "~05:47", lbl: t("stany.maint_row6", "Powrót do produkcji"), state: "" },
  ];
  return (
    <div className="max-w-[640px] text-center">
      <Eyebrow centered className="mb-6">{t("stany.maint_eyebrow", "// Planowane maintenance · 26.05.2026 · 04:00 — 06:00 CET")}</Eyebrow>
      <div className="mb-6 font-serif text-5xl italic text-ink-0 sm:text-6xl">{t("stany.maint_back_p1", "Wracamy o")} <span className="text-red">05:47</span>.</div>
      <h3 className="mb-4 font-serif text-3xl font-medium leading-tight">{t("stany.maint_h_p1", "Migrujemy")} <em className="italic text-ink-1">{t("stany.maint_h_em", "bazę danych")}</em>.</h3>
      <p className="mx-auto mb-8 max-w-lg text-[15px] font-light leading-relaxed text-ink-1">{t("stany.maint_p", "Ostatni krok przed sezonem 04 — przepisujemy bazę odcinków na nowy silnik. Twoje dane są bezpieczne, pobrane odcinki działają normalnie.")}</p>
      <div className="border border-line bg-black/40 p-5 text-left">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-2.5 border-b border-line-soft py-2.5 font-mono text-[10px] tracking-ui last:border-b-0 sm:gap-3.5 sm:text-[11px]">
            <span className="min-w-[52px] text-[9px] text-ink-2 sm:min-w-[80px] sm:text-[10px]">{r.time}</span>
            <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${r.state === "done" ? "bg-[#00ff88]" : r.state === "cur" ? "bg-red shadow-[0_0_8px_#ff2a2a] animate-obskura-pulse-fast" : "bg-ink-3"}`} />
            <span className={r.state === "done" ? "text-ink-2 line-through" : r.state === "cur" ? "text-ink-0" : "text-ink-1"}>{r.lbl}</span>
          </div>
        ))}
      </div>
      <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        {t("stany.maint_status_p1", "Status na żywo ·")} <a href="/support" className="text-red">{t("stany.maint_status_link", "status.obskura.audio →")}</a>
      </div>
    </div>
  );
}
Maintenance.propTypes = { t: PropTypes.func.isRequired };

function Expired({ t }) {
  const opts = [
    { featured: true, t1: t("stany.expired_opt1_t1", "Włącz ponownie"), em: t("stany.expired_opt1_em", "Solo"), desc: t("stany.expired_opt1_desc", "Pełny dostęp wraca natychmiast. Tym razem 25 zł / mies. (oferta powrotna, -14% przez 6 mies.).") },
    { featured: false, t1: t("stany.expired_opt2_t1", "Zostań"), em: t("stany.expired_opt2_em", "na Progu"), desc: t("stany.expired_opt2_desc", "Limit 20 odcinków/mies., reklamy między rozdziałami, jakość 192 kbps. Za darmo, bez limitu czasowego.") },
  ];
  return (
    <div className="max-w-[640px] text-center">
      <div className="mx-auto mb-7 grid h-24 w-24 place-items-center rounded-full border-2 border-red font-serif text-4xl italic text-red shadow-[0_0_32px_rgba(255,42,42,0.2)]">!</div>
      <Eyebrow centered className="mb-4">{t("stany.expired_eyebrow", "// Plan Solo · wygasł 14.05.2026")}</Eyebrow>
      <h3 className="mb-4 font-serif text-4xl font-medium leading-tight">{t("stany.expired_h_p1", "Twój dostęp")} <em className="italic text-ink-1">{t("stany.expired_h_em", "wygasł wczoraj")}</em>.</h3>
      <p className="mb-2 text-[15px] font-light leading-relaxed text-ink-1">{t("stany.expired_p1_p1", "Konto pozostaje twoje — historia, ulubione, komentarze. Od dziś jesteś na planie")} <strong className="font-medium text-ink-0">{t("stany.expired_p1_strong", "Próg")}</strong> {t("stany.expired_p1_p2", "(20 odcinków / miesiąc, z reklamami).")}</p>
      <p className="text-sm font-light leading-relaxed text-ink-1">{t("stany.expired_p2", "Nie ma presji. Wybierz co dalej — kiedy chcesz.")}</p>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {opts.map((o, i) => (
          <a key={i} href="/club" className={`relative block border p-6 text-left transition-all duration-200 ${o.featured ? "border-red bg-red/[0.04]" : "border-line bg-bg-2/50 hover:border-red hover:bg-red/[0.04]"}`}>
            {o.featured && <span className="absolute -top-4 left-6 font-mono text-[9px] uppercase tracking-eyebrow text-red">{t("stany.expired_featured", "Polecane")}</span>}
            <h4 className="mb-1.5 font-serif text-xl font-medium">{o.t1} <em className="italic text-ink-1">{o.em}</em></h4>
            <p className="text-xs font-light leading-relaxed text-ink-1">{o.desc}</p>
          </a>
        ))}
      </div>
      <div className="mt-6 font-mono text-[10px] uppercase tracking-ui text-ink-2">{t("stany.expired_downloads_note", "Twoje pobrane offline wygasną 14.06.2026 (30 dni karencji)")}</div>
    </div>
  );
}
Expired.propTypes = { t: PropTypes.func.isRequired };

const STAGES = {
  loading: Loading, empty: Empty, search: NoSearchResults, offline: Offline,
  404: Err404, 500: Err500, maint: Maintenance, expired: Expired,
};

export default function States() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("loading");

  const STATES = [
    { id: "loading", label: t("stany.tab_loading", "Ładowanie"), dot: "bg-blue", code: "STATE-001" },
    { id: "empty", label: t("stany.tab_empty", "Puste · brak danych"), dot: "bg-[#00ff88]", code: "STATE-002" },
    { id: "search", label: t("stany.tab_search", "Brak wyników"), dot: "bg-[#00ff88]", code: "STATE-003" },
    { id: "offline", label: t("stany.tab_offline", "Offline"), dot: "bg-[#ffaa44]", code: "STATE-004" },
    { id: "404", label: t("stany.tab_404", "404 · nie znaleziono"), dot: "bg-red", code: "STATE-005" },
    { id: "500", label: t("stany.tab_500", "500 · awaria serwera"), dot: "bg-red", code: "STATE-006" },
    { id: "maint", label: t("stany.tab_maint", "Maintenance"), dot: "bg-[#ffaa44]", code: "STATE-007" },
    { id: "expired", label: t("stany.tab_expired", "Subskrypcja wygasła"), dot: "bg-red", code: "STATE-008" },
  ];

  const META = {
    loading: {
      title: (<>{t("stany.meta_loading_t1", "Ładowanie")} <em className="italic text-ink-1">{t("stany.meta_loading_em", "strony głównej")}</em></>),
      desc: (<>{t("stany.meta_loading_desc_p1", "Pokazywany przez")} <strong className="font-medium text-ink-0">{t("stany.meta_loading_desc_strong", "maksymalnie 800ms")}</strong>. {t("stany.meta_loading_desc_p2", "Po tym czasie automatycznie pokazujemy treść (z fallbackiem jeśli sieć padła). Skeleton odtwarza ostatnio widziany układ.")}</>),
      tech: { trigger: t("stany.tech_loading_trigger", "COLD START"), when: t("stany.tech_loading_when", "PIERWSZE WEJŚCIE / RELOAD"), timeout: "800ms", browser: t("stany.tech_loading_browser", "OBSKURA.AUDIO · ŁADOWANIE..."), status: "OBSKURA · v4.2.3" },
    },
    empty: {
      title: (<>{t("stany.meta_empty_t1", "Puste")} <em className="italic text-ink-1">{t("stany.meta_empty_em", "archiwum / lista")}</em></>),
      desc: (<>{t("stany.meta_empty_desc_p1", "Gdy użytkownik nie ma jeszcze ulubionych, historii ani komentarzy.")} <strong className="font-medium text-ink-0">{t("stany.meta_empty_desc_strong", "Pusty stan to zaproszenie")}</strong>{t("stany.meta_empty_desc_p2", ", nie błąd — copy ma motywować, nie pouczać.")}</>),
      tech: { trigger: t("stany.tech_empty_trigger", "EMPTY DATASET"), when: t("stany.tech_empty_when", "PIERWSZE WEJŚCIE NA SEKCJĘ"), timeout: t("stany.tech_no_timeout", "BRAK"), browser: "OBSKURA.AUDIO/KONTO/ULUBIONE", status: "OBSKURA · v4.2.3" },
    },
    search: {
      title: (<>{t("stany.meta_search_t1", "Wyszukiwanie")} <em className="italic text-ink-1">{t("stany.meta_search_em", "bez wyników")}</em></>),
      desc: (<>{t("stany.meta_search_desc_p1", "Pokazujemy zapytanie, sugerujemy podobne.")} <strong className="font-medium text-ink-0">{t("stany.meta_search_desc_strong", "Nigdy")}</strong> {t("stany.meta_search_desc_p2", "nie wracamy pustym ekranem — zawsze 5 chipów z podobnymi gatunkami.")}</>),
      tech: { trigger: t("stany.tech_search_trigger", "ZERO RESULTS"), when: t("stany.tech_search_when", "PO QUERY > 3 ZNAKI"), timeout: t("stany.tech_no_timeout", "BRAK"), browser: "OBSKURA.AUDIO/ARCHIWUM?Q=ZOMBIE", status: "OBSKURA · v4.2.3" },
    },
    offline: {
      title: (<>{t("stany.meta_offline_t1", "Tryb")} <em className="italic text-ink-1">{t("stany.meta_offline_em", "offline")}</em></>),
      desc: (<>{t("stany.meta_offline_desc_p1", "Sieć padła? Pokazujemy")} <strong className="font-medium text-ink-0">{t("stany.meta_offline_desc_strong", "pobrane wcześniej odcinki")}</strong> {t("stany.meta_offline_desc_p2", "i status sieci. Status auto-refresh co 5s.")}</>),
      tech: { trigger: t("stany.tech_offline_trigger", "NETWORK ERROR"), when: t("stany.tech_offline_when", "NAVIGATOR.ONLINE = FALSE"), timeout: t("stany.tech_offline_timeout", "RETRY 5S"), browser: t("stany.tech_offline_browser", "OBSKURA.AUDIO · OFFLINE"), status: t("stany.tech_offline_status", "◉ OFFLINE") },
    },
    404: {
      title: (<>{t("stany.meta_404_t1", "404 ·")} <em className="italic text-ink-1">{t("stany.meta_404_em", "strona nie istnieje")}</em></>),
      desc: (<>{t("stany.meta_404_desc_p1", "Klasyczny 404.")} <strong className="font-medium text-ink-0">{t("stany.meta_404_desc_strong", "Z atmosferą")}</strong> {t("stany.meta_404_desc_p2", "— kod jako element wizualny, copy w naszym tonie.")}</>),
      tech: { trigger: "HTTP 404", when: t("stany.tech_404_when", "PATH NIE PASUJE DO ROUTERA"), timeout: t("stany.tech_no_timeout", "BRAK"), browser: "OBSKURA.AUDIO/SCIEZKA-KTOREJ-NIE-MA", status: "OBSKURA · v4.2.3" },
    },
    500: {
      title: (<>{t("stany.meta_500_t1", "500 ·")} <em className="italic text-ink-1">{t("stany.meta_500_em", "awaria serwera")}</em></>),
      desc: (<>{t("stany.meta_500_desc_p1", "Coś u nas się zepsuło.")} <strong className="font-medium text-ink-0">{t("stany.meta_500_desc_strong", "Bez paniki")}</strong>{t("stany.meta_500_desc_p2", ", automatycznie loguje się do Sentry. User dostaje status i opcję ponowienia.")}</>),
      tech: { trigger: "HTTP 500", when: t("stany.tech_500_when", "BACKEND EXCEPTION"), timeout: t("stany.tech_500_timeout", "AUTO-RETRY 30S"), browser: t("stany.tech_500_browser", "OBSKURA.AUDIO · BŁĄD SERWERA"), status: "OBSKURA · v4.2.3" },
    },
    maint: {
      title: (<>{t("stany.meta_maint_t1", "Maintenance")} <em className="italic text-ink-1">{t("stany.meta_maint_em", "planowane")}</em></>),
      desc: (<>{t("stany.meta_maint_desc_p1", "Aktualizujemy infrastrukturę.")} <strong className="font-medium text-ink-0">{t("stany.meta_maint_desc_strong", "Tylko zaplanowane przerwy")}</strong> {t("stany.meta_maint_desc_p2", "w godz. 4–6. Pokazujemy timeline z postępem migracji.")}</>),
      tech: { trigger: t("stany.tech_maint_trigger", "FLAG SET"), when: t("stany.tech_maint_when", "CO ~ 4 MIESIĄCE · NIEDZIELA 04:00"), timeout: t("stany.tech_maint_timeout", "60-120 MIN"), browser: t("stany.tech_maint_browser", "OBSKURA.AUDIO · MAINTENANCE"), status: t("stany.tech_maint_status", "◉ MAINTENANCE") },
    },
    expired: {
      title: (<>{t("stany.meta_expired_t1", "Subskrypcja")} <em className="italic text-ink-1">{t("stany.meta_expired_em", "wygasła")}</em></>),
      desc: (<>{t("stany.meta_expired_desc_p1", "Po końcu opłaconego okresu.")} <strong className="font-medium text-ink-0">{t("stany.meta_expired_desc_strong", "Bez agresji")}</strong> {t("stany.meta_expired_desc_p2", "— pokazujemy opcje równolegle (downgrade na Próg, ponowne włączenie).")}</>),
      tech: { trigger: t("stany.tech_expired_trigger", "STRIPE EVENT · SUBSCRIPTION.DELETED"), when: t("stany.tech_expired_when", "PO DACIE WYGAŚNIĘCIA + 24H"), timeout: t("stany.tech_no_timeout", "BRAK"), browser: "OBSKURA.AUDIO/KONTO", status: "OBSKURA · v4.2.3" },
    },
  };

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
            {t("stany.hero_h1_p1", "Co widzi użytkownik,")} <em className="italic text-ink-1">{t("stany.hero_h1_em", "gdy coś nie idzie z planem")}</em>.
          </h1>
          <p className="max-w-[620px] text-base font-light leading-relaxed text-ink-1">
            {t("stany.hero_lead", "Osiem stanów UI w jednym miejscu — od ładowania po awarię, od pustego archiwum po wygaśniętą subskrypcję. Każdy zaprojektowany tak, że problem to też okazja do dobrego copy i wizualnej tożsamości.")}
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[68px] z-40 border-b border-line bg-bg-1/85 px-0 backdrop-blur-xl lg:px-12">
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setTab(s.id)}
              className={`flex min-h-[44px] flex-shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 font-mono text-[10px] uppercase tracking-mono transition-colors sm:gap-2 sm:px-5 sm:py-4 sm:text-[11px] ${
                tab === s.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
              }`}
            >
              <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${s.dot}`} />
              <span>{s.label}</span>
              <span className={`hidden text-[9px] sm:inline ${tab === s.id ? "text-red" : "text-ink-3"}`}>{s.code}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="mx-auto mt-10 max-w-[1400px] px-5 pb-20 lg:px-12">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
          <div>
            <Eyebrow>// {cur.code}</Eyebrow>
            <h2 className="mt-3 font-serif text-3xl font-medium leading-none">{m.title}</h2>
            <p className="mt-1.5 max-w-[520px] text-[13px] font-light leading-relaxed text-ink-1">{m.desc}</p>
          </div>
          <div className="flex gap-5 font-mono text-[10px] uppercase tracking-ui text-ink-2 sm:block sm:gap-0 sm:text-right">
            <div>
              {t("stany.tech_trigger_label", "Wyzwalacz")}<strong className="mt-1 block text-ink-0">{m.tech.trigger}</strong>
            </div>
            <div className="sm:mt-2.5">
              {t("stany.tech_when_label", "Kiedy")}<strong className="mt-1 block text-ink-0">{m.tech.when}</strong>
            </div>
            <div className="sm:mt-2.5">
              {t("stany.tech_timeout_label", "Timeout")}<strong className="mt-1 block text-ink-0">{m.tech.timeout}</strong>
            </div>
          </div>
        </div>

        {/* Browser frame */}
        <div className="relative min-h-[420px] overflow-hidden border border-line bg-bg-0 sm:min-h-[600px]">
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
          <div className="relative flex min-h-[360px] flex-col items-center justify-center px-4 py-10 sm:min-h-[540px] sm:px-10 sm:py-16">
            <Stage t={t} />
          </div>
        </div>
      </div>
    </>
  );
}
