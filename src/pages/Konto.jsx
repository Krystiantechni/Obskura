import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Upload, AlertTriangle, X } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

const SECTIONS = [
  { id: "profile", labelDef: "Profil", badge: "" },
  { id: "history", labelDef: "Historia słuchania", badge: "147" },
  { id: "favs", labelDef: "Ulubione", badge: "38" },
  { id: "plan", labelDef: "Subskrypcja", badge: "SOLO" },
  { id: "audio", labelDef: "Audio i odtwarzanie", badge: "" },
  { id: "notif", labelDef: "Powiadomienia", badge: "" },
  { id: "privacy", labelDef: "Prywatność i dane", badge: "" },
  { id: "security", labelDef: "Bezpieczeństwo", badge: "!" },
];

function Toggle({ on, onClick }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${on ? "bg-red" : "bg-white/[0.08]"}`}
    >
      <span className={`absolute left-[3px] top-[3px] h-[18px] w-[18px] rounded-full bg-ink-0 transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}
Toggle.propTypes = { on: PropTypes.bool.isRequired, onClick: PropTypes.func };

function Segment({ options, value, onChange }) {
  return (
    <div className="inline-flex flex-shrink-0 border border-line bg-black/40 p-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange?.(o.value)}
          className={`px-3.5 py-2 font-mono text-[10px] uppercase tracking-ui transition-all ${value === o.value ? "bg-red text-white" : "text-ink-2 hover:text-ink-0"} ${o.dim ? "opacity-50" : ""}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
Segment.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string, dim: PropTypes.bool })).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func,
};

function SettingRow({ children }) {
  return <div className="grid grid-cols-[1fr_auto] items-center gap-6 border-b border-white/[0.04] py-[18px] last:border-b-0">{children}</div>;
}
SettingRow.propTypes = { children: PropTypes.node.isRequired };

function SettingInfo({ children, desc }) {
  return (
    <div className="info">
      <h5 className="mb-1 font-serif text-lg font-medium">{children}</h5>
      <p className="max-w-[480px] text-xs font-light leading-relaxed text-ink-1">{desc}</p>
    </div>
  );
}
SettingInfo.propTypes = { children: PropTypes.node.isRequired, desc: PropTypes.node.isRequired };

function PanelHead({ eyebrow, title, em, suffix = ".", desc, accent }) {
  return (
    <div className="mb-7 border-b border-line pb-5">
      <Eyebrow accent={accent} className="mb-3">{eyebrow}</Eyebrow>
      <h2 className="font-serif text-4xl font-medium leading-none tracking-[-0.02em]">
        {title} <em className="italic text-ink-1">{em}</em>{suffix}
      </h2>
      {desc && <p className="mt-2 text-[13px] font-light leading-relaxed text-ink-1">{desc}</p>}
    </div>
  );
}
PanelHead.propTypes = {
  eyebrow: PropTypes.node.isRequired,
  title: PropTypes.node.isRequired,
  em: PropTypes.node.isRequired,
  suffix: PropTypes.string,
  desc: PropTypes.node,
  accent: PropTypes.oneOf(["red", "blue"]),
};

function HistoryRow({ thumb, thumbPos = "center", epn, ttl, ttlEm, when, progress, done, icon = "▶" }) {
  return (
    <div className="mb-1.5 grid grid-cols-[56px_1fr] items-center gap-3 border border-line bg-black/20 p-3.5 transition-colors hover:border-red/30 lg:grid-cols-[56px_1fr_140px_100px_auto] lg:gap-4">
      <div className="h-14 w-14 bg-cover" style={{ backgroundImage: `url('${thumb}')`, backgroundPosition: thumbPos }} />
      <div>
        <div className="mb-1 font-mono text-[10px] tracking-mono text-red">{epn}</div>
        <div className="font-serif text-[17px] leading-tight">
          {ttl} <em className="italic text-ink-1">{ttlEm}</em>
        </div>
      </div>
      <div className="hidden font-mono text-[11px] uppercase tracking-ui text-ink-2 lg:block">{when}</div>
      <div className={`hidden font-mono text-[11px] lg:block ${done ? "text-[#00ff88]" : "text-ink-1"}`}>{progress}</div>
      <button type="button" className="hidden h-9 w-9 place-items-center border border-line bg-white/[0.02] text-ink-1 transition-colors hover:border-red hover:text-red lg:grid">
        {icon}
      </button>
    </div>
  );
}
HistoryRow.propTypes = {
  thumb: PropTypes.string.isRequired,
  thumbPos: PropTypes.string,
  epn: PropTypes.string.isRequired,
  ttl: PropTypes.string.isRequired,
  ttlEm: PropTypes.string.isRequired,
  when: PropTypes.string.isRequired,
  progress: PropTypes.string.isRequired,
  done: PropTypes.bool,
  icon: PropTypes.string,
};

export default function Konto() {
  const { t } = useTranslation();
  const [section, setSection] = useState("profile");
  const [tw, setTw] = useState({
    spatial: true,
    autoplay: true,
    skipIntro: false,
    bigsub: true,
    newsletter: true,
    notifReply: false,
    notifEvent: true,
    quietHours: false,
    analytics: true,
    recommend: true,
    twofa: true,
    sessNotif: true,
    showComments: true,
    showStats: true,
    anon: false,
  });
  const flip = (k) => setTw((s) => ({ ...s, [k]: !s[k] }));
  const [quality, setQuality] = useState("320");
  const [skip, setSkip] = useState("15");

  const SESSIONS = [
    { name: "MacBook Pro · Safari", loc: "Warszawa · PL", when: "TERAZ", current: true, ip: "5.184.x.x" },
    { name: "iPhone 15 · OBSKURA app", loc: "Warszawa · PL", when: "2H TEMU", ip: "5.184.x.x" },
    { name: "iPad · OBSKURA app", loc: "Sopot · PL", when: "23 GODZ. TEMU", ip: "37.47.x.x" },
    { name: "Windows · Chrome", loc: "Berlin · DE", when: "3 DNI TEMU", ip: "46.183.x.x", warn: true },
  ];

  return (
    <div className="bg-bg-0">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-line px-5 pb-8 pt-[120px] lg:px-12">
        <span aria-hidden className="pointer-events-none absolute right-[-100px] top-[60px] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(255,42,42,0.06),transparent_60%)]" />
        <div className="relative mx-auto grid max-w-[1400px] items-end gap-10 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow className="mb-4">{t("konto.hero_eyebrow", "// TWOJE KONTO · ZALOGOWANY 23:14")}</Eyebrow>
            <h1 className="font-serif font-medium leading-none tracking-[-0.02em]" style={{ fontSize: "clamp(40px, 5vw, 72px)" }}>
              {t("konto.hero_h1_p1", "Witaj")} <em className="italic text-ink-1">{t("konto.hero_h1_em", "z powrotem,")}</em> Nokturn_47.
            </h1>
            <div className="mt-3 text-sm font-light leading-relaxed text-ink-1">
              {t("konto.hero_sub_p1", "Ostatnie odsłuchanie:")} <strong className="text-ink-0">Mgła nad Wisłoujściem</strong> {t("konto.hero_sub_p2", "· 21:08 wczoraj · zatrzymane na 19:43")}
            </div>
          </div>
          <div className="border border-line bg-bg-2/60 p-5 lg:min-w-[280px]">
            {[
              { l: t("konto.status_plan", "Plan"), v: "SOLO · ROCZNIE", red: true },
              { l: t("konto.status_next", "Następna płatność"), v: "14.08.2026" },
              { l: t("konto.status_since", "Klub od"), v: "23 miesięcy" },
              { l: t("konto.status_status", "Status"), v: "● AKTYWNY", green: true },
            ].map((row, i) => (
              <div key={i} className="flex items-baseline justify-between py-1.5 text-[13px]">
                <span className="font-mono text-[10px] uppercase tracking-ui text-ink-2">{row.l}</span>
                {row.red ? (
                  <span className="font-sans text-[13px] font-semibold text-red">{row.v}</span>
                ) : row.green ? (
                  <span className="font-mono text-[11px] tracking-ui text-[#00ff88]">{row.v}</span>
                ) : (
                  <span className="font-serif text-base italic text-ink-0">{row.v}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* LAYOUT */}
      <main className="mx-auto my-10 grid max-w-[1400px] items-start gap-10 px-5 lg:my-16 lg:grid-cols-[260px_1fr] lg:px-12">
        {/* Side nav */}
        <nav className="flex flex-col border border-line bg-bg-2/40 lg:sticky lg:top-[100px]">
          <h5 className="px-5 pb-2 pt-[18px] font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.menu", "// MENU")}</h5>
          {SECTIONS.map((s) => {
            const act = section === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSection(s.id)}
                className={[
                  "flex items-center justify-between border-l-2 px-5 py-3 text-left text-sm transition-all",
                  act ? "border-red bg-red/[0.05] text-ink-0" : "border-transparent text-ink-1 hover:bg-white/[0.02] hover:text-ink-0",
                ].join(" ")}
              >
                <span>{t(`konto.section_${s.id}`, s.labelDef)}</span>
                {s.badge && <span className={`font-mono text-[9px] tracking-ui ${s.badge === "!" || act ? "text-red" : "text-ink-3"}`}>{s.badge}</span>}
              </button>
            );
          })}
          <div className="my-3 h-px bg-line" />
          <button type="button" className="border-l-2 border-transparent px-5 py-3.5 text-left font-mono text-[11px] uppercase tracking-ui text-red">
            ← {t("konto.logout", "Wyloguj się")}
          </button>
        </nav>

        {/* Content */}
        <section className="border border-line bg-bg-2/30 p-6 sm:p-10">
          {section === "profile" && (
            <>
              <PanelHead
                eyebrow={t("konto.profile_eyebrow", "// PROFIL · PUBLICZNY")}
                title={t("konto.profile_h2_p1", "Kim")}
                em={t("konto.profile_h2_em", "jesteś")}
                desc={t("konto.profile_desc", "Informacje widoczne dla innych słuchaczy w komentarzach i na forum.")}
              />

              <div className="mb-6 flex items-center gap-5 border-b border-white/[0.04] pb-6">
                <div className="grid h-[88px] w-[88px] flex-shrink-0 place-items-center border border-line bg-gradient-to-br from-bg-2 to-bg-3 font-serif text-4xl italic text-ink-1">N</div>
                <div className="flex-1">
                  <h4 className="mb-1.5 font-serif text-[22px] italic">Nokturn_47</h4>
                  <p className="text-xs text-ink-2">{t("konto.profile_avatar_note", "Awatar generowany z pierwszej litery. Możesz wgrać własny.")}</p>
                  <button type="button" className="mt-2.5 inline-flex items-center gap-2 border border-white/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-ui text-ink-0 transition-colors hover:border-red hover:text-red">
                    <Upload size={13} /> {t("konto.profile_avatar_btn", "Wgraj awatar")}
                  </button>
                </div>
              </div>

              <div className="mb-5 grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.profile_name_label", "Nazwa wyświetlana")}</label>
                  <input type="text" defaultValue="Nokturn_47" className={FIELD} />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.profile_anon_label", "Anonimowy numer (jeśli wolisz)")}</label>
                  <input type="text" defaultValue="Anonim #047" disabled className={`${FIELD} text-ink-2`} />
                </div>
              </div>

              <div className="mb-2 flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.profile_bio_label", "Bio (max 200 znaków)")}</label>
                <textarea defaultValue="Słucham od 2023. Najgorzej w deszczowe wtorki o 3:00. Folk horror i cosmic dread." className={`${FIELD} min-h-[80px] resize-y`} />
              </div>

              <SettingRow>
                <SettingInfo desc={t("konto.profile_comments_desc", "Pseudonim widoczny przy twoich komentarzach na odcinkach i forum.")}>
                  {t("konto.profile_comments_p1", "Pokazuj")} <em className="italic text-ink-1">{t("konto.profile_comments_em", "w komentarzach")}</em>
                </SettingInfo>
                <Toggle on={tw.showComments} onClick={() => flip("showComments")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.profile_stats_desc", "Inni mogą widzieć ile odcinków posłuchałeś, ulubione gatunki, średnią dziennie.")}>
                  {t("konto.profile_stats_p1", "Pokazuj")} <em className="italic text-ink-1">{t("konto.profile_stats_em", "statystyki słuchania")}</em>
                </SettingInfo>
                <Toggle on={tw.showStats} onClick={() => flip("showStats")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={<>{t("konto.profile_anon_desc_p1", 'Cała aktywność jako „Anonim #047".')} <strong className="text-ink-0">{t("konto.profile_anon_desc_b", "Komentarze, polubienia, statystyki — bez pseudonimu.")}</strong></>}>
                  {t("konto.profile_anonmode_p1", "Tryb")} <em className="italic text-ink-1">{t("konto.profile_anonmode_em", "anonimowy")}</em>
                </SettingInfo>
                <Toggle on={tw.anon} onClick={() => flip("anon")} />
              </SettingRow>

              <div className="mt-7 flex gap-3">
                <HorrorButton>{t("konto.profile_save", "Zapisz zmiany")}</HorrorButton>
                <HorrorButton variant="ghost">{t("konto.profile_cancel", "Anuluj")}</HorrorButton>
              </div>
            </>
          )}

          {section === "history" && (
            <>
              <PanelHead
                eyebrow={t("konto.history_eyebrow", "// HISTORIA · 147 ODSŁUCHAŃ")}
                title={t("konto.history_h2_p1", "Co")}
                em={t("konto.history_h2_em", "słyszałeś")}
                desc={t("konto.history_desc", "Twoje ostatnie odsłuchania. Sortowanie i filtry powyżej.")}
              />
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <Segment
                  value="all"
                  options={[
                    { value: "all", label: t("konto.history_filter_all", "Wszystkie") },
                    { value: "progress", label: t("konto.history_filter_progress", "W trakcie") },
                    { value: "done", label: t("konto.history_filter_done", "Ukończone") },
                    { value: "liked", label: t("konto.history_filter_liked", "Polubione") },
                  ]}
                />
                <button type="button" className="inline-flex items-center gap-2 border border-white/10 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-ui text-ink-0 transition-colors hover:border-red hover:text-red">
                  ↓ {t("konto.history_export", "Eksport CSV")}
                </button>
              </div>

              <HistoryRow thumb="/images/monster.png" thumbPos="center 20%" epn="S03 · E12 · ROZDZIAŁ 04" ttl="Mgła nad" ttlEm="Wisłoujściem" when="21:08 WCZORAJ" progress="19:43 / 47:12 · 42%" />
              <HistoryRow thumb="/images/img-hallway.png" epn="S03 · E11 · UKOŃCZONE" ttl="Ostatnie" ttlEm="Światło" when="23:42 PIĄTEK" progress="52:08 / 52:08 · ✓" done icon="↻" />
              <HistoryRow thumb="/images/img-forest.png" epn="S03 · E10 · UKOŃCZONE" ttl="Coś patrzy" ttlEm="z lasu" when="02:14 WTOREK" progress="01:14:33 · ✓" done icon="↻" />
              <HistoryRow thumb="/images/img-creature.png" thumbPos="center 15%" epn="S03 · E04 · UKOŃCZONE 3×" ttl="Dom przy" ttlEm="ul. Cisowej 7" when="15.05.2026" progress="38:21 · ✓ ✓ ✓" done icon="↻" />
              <HistoryRow thumb="/images/img-orbs.png" thumbPos="center 20%" epn="S03 · E08 · PORZUCONE" ttl="Sygnał z" ttlEm="orbity" when="04.05.2026" progress="12:08 / 01:02:47 · 19%" />

              <div className="mt-6 text-center font-mono text-[11px] uppercase tracking-mono text-ink-2">
                {t("konto.history_shown", "POKAZANO 5 Z 147 ·")} <button type="button" className="text-red">{t("konto.history_more", "POKAŻ WIĘCEJ →")}</button>
              </div>
            </>
          )}

          {section === "favs" && (
            <>
              <PanelHead
                eyebrow={t("konto.favs_eyebrow", "// ULUBIONE · 38 ODCINKÓW")}
                title={t("konto.favs_h2_p1", "Twoja")}
                em={t("konto.favs_h2_em", "kolekcja")}
                desc={t("konto.favs_desc", "Polubione, dodane do biblioteki, oznaczone do ponownego odsłuchania.")}
              />
              <div className="mb-5">
                <Segment
                  value="liked"
                  options={[
                    { value: "liked", label: t("konto.favs_filter_liked", "Polubione (38)") },
                    { value: "library", label: t("konto.favs_filter_library", "Biblioteka (12)") },
                    { value: "rewatch", label: t("konto.favs_filter_rewatch", "Do ponownego (7)") },
                  ]}
                />
              </div>

              <HistoryRow thumb="/images/img-wolf.png" thumbPos="center 28%" epn="S03 · E06 · ★ ULUBIONE" ttl="Łańcuch" ttlEm="Fenrira" when="DODANE 12.04" progress="01:22:55 · ✓" done />
              <HistoryRow thumb="/images/img-creature.png" thumbPos="center 15%" epn="S03 · E04 · ★ ULUBIONE · 5/5" ttl="Dom przy" ttlEm="ul. Cisowej 7" when="DODANE 22.03" progress="38:21 · ✓ ✓ ✓" done icon="↻" />
              <HistoryRow thumb="/images/img-hallway.png" epn="S03 · E11 · ★ ULUBIONE" ttl="Ostatnie" ttlEm="Światło" when="DODANE 18.05" progress="52:08 · ✓" done icon="↻" />
            </>
          )}

          {section === "plan" && (
            <>
              <PanelHead
                eyebrow={t("konto.plan_eyebrow", "// SUBSKRYPCJA · AKTYWNA")}
                title={t("konto.plan_h2_p1", "Twój")}
                em={t("konto.plan_h2_em", "plan")}
                desc={t("konto.plan_desc", "Pełne zarządzanie subskrypcją. Wszystkie zmiany wchodzą w życie natychmiast.")}
              />

              <div className="mb-6 border border-red bg-gradient-to-b from-red/[0.06] to-bg-2/70 p-8 shadow-[0_0_0_1px_rgba(255,42,42,0.2),0_20px_60px_-20px_rgba(255,42,42,0.15)]">
                <div className="mb-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-red">{t("konto.plan_card_tag", "// OBECNY PLAN")}</div>
                <h3 className="mb-2 font-serif text-4xl font-medium">
                  {t("konto.plan_card_title", "Solo")} <em className="italic text-ink-1">{t("konto.plan_card_title_em", "· roczny")}</em>
                </h3>
                <p className="mb-6 max-w-[520px] text-sm font-light leading-relaxed text-ink-1">
                  {t("konto.plan_card_desc", "Wszystkie 147 odcinków, premiery 72h przed publicznym wydaniem, jakość 320 kbps, dwie aktywne sesje jednocześnie, Discord, ekskluzywne kulisy.")}
                </p>
                <div className="mb-5 grid grid-cols-1 gap-6 border-y border-line py-5 sm:grid-cols-3">
                  {[
                    { l: t("konto.plan_meta_price", "Cena"), v: "288 zł / rok" },
                    { l: t("konto.plan_meta_next", "Następna płatność"), v: "14.08.2026" },
                    { l: t("konto.plan_meta_method", "Metoda"), v: "VISA •••• 4137" },
                  ].map((m, i) => (
                    <div key={i}>
                      <div className="mb-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">{m.l}</div>
                      <div className="font-serif text-xl italic">{m.v}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap gap-3">
                  <HorrorButton variant="ghost">{t("konto.plan_change_method", "Zmień metodę płatności")}</HorrorButton>
                  <HorrorButton variant="ghost">{t("konto.plan_invoices", "Pobierz faktury")}</HorrorButton>
                  <HorrorButton variant="ghost" className="border-red/40 text-red hover:border-red">{t("konto.plan_cancel", "Anuluj subskrypcję")}</HorrorButton>
                </div>
              </div>

              <SettingRow>
                <SettingInfo desc={<>{t("konto.plan_clan_desc_p1", "Dostęp dla całej rodziny (6 urządzeń, 5 profili), lossless FLAC, premiery 7 dni wcześniej, fizyczna książka roczna. Dopłata")} <strong className="text-ink-0">{t("konto.plan_clan_desc_b", "20 zł / mies.")}</strong> {t("konto.plan_clan_desc_p2", "(rozliczenie proporcjonalne).")}</>}>
                  {t("konto.plan_clan_p1", "Zmień plan na")} <em className="italic text-ink-1">{t("konto.plan_clan_em", "Klan")}</em>
                </SettingInfo>
                <HorrorButton className="px-5 py-3">{t("konto.plan_clan_btn", "Wybierz Klan →")}</HorrorButton>
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.plan_patron_desc", "Patroni dostają wszystko + nazwisko w napisach + wpływ na produkcję. Sezon 04 zaczynamy w czerwcu 2026.")}>
                  {t("konto.plan_patron_p1", "Zostań")} <em className="italic text-ink-1">{t("konto.plan_patron_em", "patronem sezonu 04")}</em>
                </SettingInfo>
                <HorrorButton variant="ghost">{t("konto.plan_patron_btn", "Zobacz poziomy →")}</HorrorButton>
              </SettingRow>

              <div className="mt-7 border border-line bg-black/30 p-5">
                <h5 className="mb-3.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.plan_payments_title", "// HISTORIA PŁATNOŚCI · OSTATNIE 6")}</h5>
                {[
                  { d: "14.08.2025 · Subskrypcja roczna", a: "288,00 PLN" },
                  { d: "14.08.2024 · Subskrypcja roczna", a: "288,00 PLN" },
                  { d: "14.08.2023 · Subskrypcja roczna", a: "240,00 PLN" },
                ].map((p, i) => (
                  <div key={i} className="flex justify-between border-b border-white/[0.04] py-2 font-mono text-xs text-ink-1">
                    <span>{p.d}</span>
                    <span className="text-ink-0">{p.a} · ✓ <button type="button" className="text-red">PDF</button></span>
                  </div>
                ))}
                <button type="button" className="mt-3 block font-mono text-[11px] uppercase tracking-ui text-red">{t("konto.plan_all_payments", "Wszystkie 24 płatności →")}</button>
              </div>
            </>
          )}

          {section === "audio" && (
            <>
              <PanelHead
                eyebrow={t("konto.audio_eyebrow", "// USTAWIENIA AUDIO")}
                title={t("konto.audio_h2_p1", "Jak")}
                em={t("konto.audio_h2_em", "słuchać")}
                desc={t("konto.audio_desc", "Konfiguracja odtwarzania. Zmiany zapisują się automatycznie i synchronizują między urządzeniami.")}
              />

              <SettingRow>
                <SettingInfo desc={t("konto.audio_quality_desc", "FLAC dostępny tylko w planie Klan. Wyższa jakość = większy transfer (FLAC ~100 MB/h).")}>
                  {t("konto.audio_quality_p1", "Jakość")} <em className="italic text-ink-1">{t("konto.audio_quality_em", "audio")}</em>
                </SettingInfo>
                <Segment
                  value={quality}
                  onChange={(v) => v !== "flac" && setQuality(v)}
                  options={[
                    { value: "192", label: "192 KBPS" },
                    { value: "320", label: "320 KBPS" },
                    { value: "flac", label: "FLAC ⓘ", dim: true },
                  ]}
                />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={<>{t("konto.audio_3d_desc_p1", "Pełna przestrzeń 7.1 + spatial audio.")} <strong className="text-ink-0">{t("konto.audio_3d_desc_b", "Wymaga słuchawek.")}</strong> {t("konto.audio_3d_desc_p2", "Na głośnikach automatycznie wyłączany.")}</>}>
                  {t("konto.audio_3d_p1", "Binauralny")} <em className="italic text-ink-1">{t("konto.audio_3d_em", "3D mix")}</em>
                </SettingInfo>
                <Toggle on={tw.spatial} onClick={() => flip("spatial")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.audio_bass_desc", "Dodatkowy boost dla infrasound (17–25 Hz). Polecane na słuchawkach planar/over-ear.")}>
                  {t("konto.audio_bass_p1", "Wzmocnienie")} <em className="italic text-ink-1">{t("konto.audio_bass_em", "basów (sub-bass)")}</em>
                </SettingInfo>
                <Toggle on={tw.bigsub} onClick={() => flip("bigsub")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.audio_skip_desc", "Przyciski przewijania w playerze. Krótszy = bardziej precyzyjny.")}>
                  {t("konto.audio_skip_p1", "Skip")} <em className="italic text-ink-1">{t("konto.audio_skip_em", "do tyłu / przodu")}</em>
                </SettingInfo>
                <Segment value={skip} onChange={setSkip} options={["5", "10", "15", "30"].map((s) => ({ value: s, label: `${s}s` }))} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.audio_autoplay_desc", "Po zakończeniu odcinka — automatycznie zacznij następny w serii.")}>
                  {t("konto.audio_autoplay_p1", "Autoplay")} <em className="italic text-ink-1">{t("konto.audio_autoplay_em", "następnego odcinka")}</em>
                </SettingInfo>
                <Toggle on={tw.autoplay} onClick={() => flip("autoplay")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.audio_intro_desc", 'Każdy odcinek ma rozdział „intro" (~30s) i „outro" (~45s). Możesz je pomijać automatycznie.')}>
                  {t("konto.audio_intro_p1", "Pomiń")} <em className="italic text-ink-1">{t("konto.audio_intro_em", "intro/outro")}</em>
                </SettingInfo>
                <Toggle on={tw.skipIntro} onClick={() => flip("skipIntro")} />
              </SettingRow>
            </>
          )}

          {section === "notif" && (
            <>
              <PanelHead
                eyebrow={t("konto.notif_eyebrow", "// POWIADOMIENIA")}
                title={t("konto.notif_h2_p1", "Kiedy")}
                em={t("konto.notif_h2_em", "chcesz wiedzieć")}
                desc={t("konto.notif_desc", "Powiadomienia push, e-mail i in-app. Wszystkie ustawienia osobno.")}
              />

              <SettingRow>
                <SettingInfo desc={t("konto.notif_premiere_desc", "Powiadomienie o nowym odcinku — push, e-mail lub oba.")}>
                  {t("konto.notif_premiere_p1", "Nowe")} <em className="italic text-ink-1">{t("konto.notif_premiere_em", "premiery")}</em>
                </SettingInfo>
                <Segment
                  value="both"
                  options={[
                    { value: "both", label: t("konto.notif_premiere_both", "PUSH + EMAIL") },
                    { value: "email", label: t("konto.notif_premiere_email", "TYLKO EMAIL") },
                    { value: "off", label: t("konto.notif_premiere_off", "WYŁĄCZ") },
                  ]}
                />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={<>{t("konto.notif_reply_desc_p1", "Ktoś odpowiada w wątku, do którego dołączyłeś.")} <strong className="text-ink-0">{t("konto.notif_reply_desc_b", "Tylko w aplikacji + e-mail dzienny digest.")}</strong></>}>
                  {t("konto.notif_reply_p1", "Odpowiedzi")} <em className="italic text-ink-1">{t("konto.notif_reply_em", "na twoje komentarze")}</em>
                </SettingInfo>
                <Toggle on={tw.notifReply} onClick={() => flip("notifReply")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.notif_event_desc", "2h przed startem live event'u (AMA, premiery online).")}>
                  {t("konto.notif_event_p1", "Spotkania")} <em className="italic text-ink-1">{t("konto.notif_event_em", "i AMA")}</em>
                </SettingInfo>
                <Toggle on={tw.notifEvent} onClick={() => flip("notifEvent")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.notif_news_desc", "Co czwartek o 23:00. Można wypisać się jednym kliknięciem.")}>
                  {t("konto.notif_news_p1", "Newsletter")} <em className="italic text-ink-1">{t("konto.notif_news_em", "czwartkowy")}</em>
                </SettingInfo>
                <Toggle on={tw.newsletter} onClick={() => flip("newsletter")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.notif_quiet_desc", "Żadnych powiadomień push między 23:00 — 07:00. Mimo, że w nocy najlepiej słucha się Obskury.")}>
                  {t("konto.notif_quiet_p1", "Cisza")} <em className="italic text-ink-1">{t("konto.notif_quiet_em", "nocna")}</em>
                </SettingInfo>
                <Toggle on={tw.quietHours} onClick={() => flip("quietHours")} />
              </SettingRow>
            </>
          )}

          {section === "privacy" && (
            <>
              <PanelHead
                eyebrow={t("konto.privacy_eyebrow", "// PRYWATNOŚĆ I DANE")}
                title={t("konto.privacy_h2_p1", "Twoje")}
                em={t("konto.privacy_h2_em", "dane")}
                desc={t("konto.privacy_desc", "Wszystkie dane, które przechowujemy o tobie. Eksport, kontrola, usunięcie.")}
              />

              <SettingRow>
                <SettingInfo desc={<>{t("konto.privacy_analytics_desc", "Liczymy ilość wizyt bez identyfikacji konkretnej osoby. Hosted w EU.")} <button type="button" className="text-red">{t("konto.privacy_details", "Szczegóły")}</button>.</>}>
                  {t("konto.privacy_analytics_p1", "Anonimowa")} <em className="italic text-ink-1">{t("konto.privacy_analytics_em", "analityka (Plausible)")}</em>
                </SettingInfo>
                <Toggle on={tw.analytics} onClick={() => flip("analytics")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={<>{t("konto.privacy_recommend_desc_p1", "Algorytm dobiera ci historie na podstawie tego, czego słuchałeś.")} <strong className="text-ink-0">{t("konto.privacy_recommend_desc_b", "Wyłączenie = brak personalizacji.")}</strong></>}>
                  {t("konto.privacy_recommend_p1", "Rekomendacje")} <em className="italic text-ink-1">{t("konto.privacy_recommend_em", "na podstawie historii")}</em>
                </SettingInfo>
                <Toggle on={tw.recommend} onClick={() => flip("recommend")} />
              </SettingRow>

              <div className="mt-8 border border-line bg-black/30 p-6">
                <h5 className="mb-3.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.privacy_export_title", "// EKSPORT I USUWANIE · RODO ART. 15-22")}</h5>
                <div className="mb-4 flex flex-wrap gap-3">
                  {[
                    t("konto.privacy_export_all", "↓ Eksport wszystkich danych (ZIP)"),
                    t("konto.privacy_export_history", "↓ Tylko historia słuchania (CSV)"),
                    t("konto.privacy_export_comments", "↓ Komentarze i posty"),
                  ].map((label, i) => (
                    <button key={i} type="button" className="border border-white/10 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-ui text-ink-0 transition-colors hover:border-red hover:text-red">
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mb-4 text-xs leading-relaxed text-ink-1">{t("konto.privacy_export_note", "Eksport jest gotowy w 7 dni roboczych (zwykle szybciej). Otrzymasz e-mail z linkiem (ważnym 30 dni).")}</p>
                <button type="button" className="inline-flex items-center gap-2 border border-red/40 px-4.5 py-3 text-[11px] font-semibold uppercase tracking-ui text-red transition-colors hover:border-red">
                  <X size={13} /> {t("konto.privacy_delete", "USUŃ KONTO NIEODWRACALNIE")}
                </button>
                <p className="mt-2.5 text-[11px] leading-relaxed text-ink-3">{t("konto.privacy_delete_note", "Karencja 30 dni — możesz cofnąć decyzję. Po 30 dniach dane usuwane bezpowrotnie z baz i backupów. Faktury (5 lat) — wymóg ustawy.")}</p>
              </div>
            </>
          )}

          {section === "security" && (
            <>
              <PanelHead
                eyebrow={t("konto.security_eyebrow", "// BEZPIECZEŃSTWO")}
                title={t("konto.security_h2_p1", "Tylko")}
                em={t("konto.security_h2_em", "ty")}
                suffix={t("konto.security_h2_suffix", " wchodzisz.")}
                desc={t("konto.security_desc", "Hasło, 2FA, urządzenia, alerty bezpieczeństwa. Sprawdź co miesiąc.")}
              />

              <div className="mb-5 flex gap-3.5 border-l-2 border-[#ffaa44] bg-[#ffaa44]/[0.04] p-4">
                <AlertTriangle size={18} className="flex-shrink-0 text-[#ffaa44]" />
                <div>
                  <h6 className="mb-1.5 font-mono text-[10px] uppercase tracking-mono text-[#ffaa44]">{t("konto.security_alert_title", "// NIETYPOWE LOGOWANIE")}</h6>
                  <p className="text-[13px] font-light leading-relaxed text-ink-1">
                    {t("konto.security_alert_p1", "Wczoraj o 14:23 ktoś próbował zalogować się z urządzenia w Berlinie. Próba została zablokowana. Jeśli to nie ty —")}{" "}
                    <button type="button" className="text-[#ffaa44] underline">{t("konto.security_alert_link", "zmień hasło natychmiast")}</button>.
                  </p>
                </div>
              </div>

              <SettingRow>
                <SettingInfo desc={<>{t("konto.security_pw_desc_p1", "Ostatnia zmiana:")} <strong className="text-ink-0">14.03.2026</strong>. {t("konto.security_pw_desc_p2", "Zalecamy zmianę co 6 miesięcy.")}</>}>
                  {t("konto.security_pw", "Hasło")}
                </SettingInfo>
                <HorrorButton variant="ghost" className="px-4 py-2.5">{t("konto.security_pw_btn", "Zmień hasło")}</HorrorButton>
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={<><strong className="text-[#00ff88]">{t("konto.security_2fa_active", "Aktywna")}</strong> {t("konto.security_2fa_desc", "· aplikacja Authy. Backup codes wygenerowano 12.01.2026.")}</>}>
                  {t("konto.security_2fa_p1", "Weryfikacja")} <em className="italic text-ink-1">{t("konto.security_2fa_em", "dwuetapowa (2FA)")}</em>
                </SettingInfo>
                <Toggle on={tw.twofa} onClick={() => flip("twofa")} />
              </SettingRow>
              <SettingRow>
                <SettingInfo desc={t("konto.security_login_desc", "E-mail przy każdym logowaniu z nowego urządzenia / lokalizacji.")}>
                  {t("konto.security_login_p1", "Powiadomienia")} <em className="italic text-ink-1">{t("konto.security_login_em", "o nowym logowaniu")}</em>
                </SettingInfo>
                <Toggle on={tw.sessNotif} onClick={() => flip("sessNotif")} />
              </SettingRow>

              <div className="mt-7">
                <h5 className="mb-3.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("konto.security_sessions_title", "// AKTYWNE SESJE · 4")}</h5>
                {SESSIONS.map((s, i) => (
                  <div
                    key={i}
                    className={`mb-1.5 grid grid-cols-1 items-center gap-3 border p-3.5 font-mono text-[11px] sm:grid-cols-[1fr_140px_140px_auto] ${s.warn ? "border-[#ffaa44]/30 bg-[#ffaa44]/[0.04]" : "border-line bg-black/20"}`}
                  >
                    <div>
                      <div className="mb-0.5 font-sans text-sm text-ink-0">
                        {s.name} {s.current && <span className="ml-2 text-[10px] tracking-ui text-[#00ff88]">● TERAZ</span>}
                      </div>
                      <div className="uppercase tracking-[0.1em] text-ink-2">{s.loc} · IP {s.ip}</div>
                    </div>
                    <div className="uppercase tracking-[0.1em] text-ink-2">{s.when}</div>
                    <div>{s.warn && <span className="text-[#ffaa44]">⚠ {t("konto.security_unusual", "NIETYPOWE")}</span>}</div>
                    {!s.current && (
                      <button type="button" className="justify-self-start border border-line px-2.5 py-1.5 text-[10px] uppercase tracking-ui text-red transition-colors hover:border-red sm:justify-self-auto">
                        {t("konto.security_logout_session", "WYLOGUJ")}
                      </button>
                    )}
                  </div>
                ))}
                <HorrorButton variant="ghost" className="mt-3 border-red/40 px-4 py-2.5 text-red hover:border-red">
                  {t("konto.security_logout_all", "Wyloguj wszystkie inne sesje")}
                </HorrorButton>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
