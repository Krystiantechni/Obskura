import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

// Wspólne style typografii dokumentu — czytelne, serif nagłówki.
function DocHeading({ sec, children }) {
  return (
    <h2 className="mb-4 mt-10 border-b border-line pb-3 font-serif text-2xl font-medium leading-tight first:mt-0 sm:mt-12 sm:text-3xl">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-eyebrow text-red">{sec}</span>
      {children}
    </h2>
  );
}
DocHeading.propTypes = { sec: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function SubHeading({ children }) {
  return <h3 className="mb-3 mt-6 font-serif text-lg font-medium italic text-ink-0 sm:mt-7 sm:text-xl">{children}</h3>;
}
SubHeading.propTypes = { children: PropTypes.node.isRequired };

function P({ children }) {
  return <p className="mb-3.5 w-full max-w-prose text-[15px] font-light leading-[1.7] text-ink-1">{children}</p>;
}
P.propTypes = { children: PropTypes.node.isRequired };

function Code({ children }) {
  return <code className="break-all bg-black/40 px-2 py-0.5 font-mono text-[13px] text-red">{children}</code>;
}
Code.propTypes = { children: PropTypes.node.isRequired };

function Bullets({ items, ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`mb-4 mt-3 w-full max-w-prose space-y-2 pl-5 sm:pl-6 ${ordered ? "list-decimal" : "list-disc"} marker:text-red`}>
      {items.map((it, i) => (
        <li key={i} className="text-sm font-light leading-relaxed text-ink-1">{it}</li>
      ))}
    </Tag>
  );
}
Bullets.propTypes = { items: PropTypes.array.isRequired, ordered: PropTypes.bool };

function Tldr({ tldrLabel, children }) {
  return (
    <div className="mb-8 border-l-2 border-red bg-red/5 p-4 sm:mb-10 sm:p-6">
      <h4 className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-red">{tldrLabel}</h4>
      <p className="text-[15px] font-light leading-relaxed text-ink-0">{children}</p>
    </div>
  );
}
Tldr.propTypes = { tldrLabel: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function DataTable({ head, rows }) {
  return (
    <div className="-mx-5 my-5 overflow-x-auto sm:mx-0">
      <table className="min-w-[480px] w-full border-collapse text-sm sm:min-w-0">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-red bg-black/30 px-3 py-3 text-left font-mono text-[10px] uppercase tracking-mono text-ink-2 sm:px-4 sm:py-3.5">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-b border-line px-3 py-3 font-light text-ink-1 sm:px-4 sm:py-3.5">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
DataTable.propTypes = { head: PropTypes.array.isRequired, rows: PropTypes.array.isRequired };

function ToggleRow({ title, desc, on, required = false, onToggle }) {
  return (
    <div className={`mb-2 flex items-center justify-between gap-3 border border-line bg-bg-2/50 px-4 py-4 sm:gap-4 sm:px-5 ${required ? "opacity-60" : ""}`}>
      <div className="min-w-0 flex-1">
        <h5 className="mb-1 font-serif text-base font-medium sm:text-lg">{title}</h5>
        <p className="text-xs text-ink-2">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={required}
        onClick={onToggle}
        className="flex min-h-[44px] min-w-[44px] flex-shrink-0 items-center justify-center"
      >
        <span
          className={`relative h-[22px] w-10 rounded-full transition-colors duration-200 ${
            required ? "cursor-not-allowed bg-ink-3" : on ? "bg-red" : "bg-white/10"
          } after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-ink-0 after:transition-transform after:duration-200 ${
            on ? "after:translate-x-[18px]" : ""
          }`}
        />
      </button>
    </div>
  );
}
ToggleRow.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  on: PropTypes.bool.isRequired,
  required: PropTypes.bool,
  onToggle: PropTypes.func,
};

export default function Legal() {
  const { t } = useTranslation();

  const TABS = [
    { id: "prywatnosc", label: t("prawne.tab_privacy", "Polityka prywatności") },
    { id: "regulamin", label: t("prawne.tab_terms", "Regulamin") },
    { id: "cookies", label: t("prawne.tab_cookies", "Cookies") },
  ];

  const TOC = {
    prywatnosc: [
      { id: "p1", label: t("prawne.privacy_toc_1", "Kim jesteśmy") },
      { id: "p2", label: t("prawne.privacy_toc_2", "Jakie dane zbieramy") },
      { id: "p3", label: t("prawne.privacy_toc_3", "Po co je zbieramy") },
      { id: "p4", label: t("prawne.privacy_toc_4", "Komu udostępniamy") },
      { id: "p5", label: t("prawne.privacy_toc_5", "Jak długo trzymamy") },
      { id: "p6", label: t("prawne.privacy_toc_6", "Twoje prawa") },
      { id: "p7", label: t("prawne.privacy_toc_7", "Bezpieczeństwo") },
      { id: "p8", label: t("prawne.privacy_toc_8", "Kontakt") },
    ],
    regulamin: [
      { id: "r1", label: t("prawne.tos_toc_1", "Definicje") },
      { id: "r2", label: t("prawne.tos_toc_2", "Konto") },
      { id: "r3", label: t("prawne.tos_toc_3", "Subskrypcja") },
      { id: "r4", label: t("prawne.tos_toc_4", "Płatności") },
      { id: "r5", label: t("prawne.tos_toc_5", "Odstąpienie") },
      { id: "r6", label: t("prawne.tos_toc_6", "Treści użytkowników") },
      { id: "r7", label: t("prawne.tos_toc_7", "Treści Obskury") },
      { id: "r8", label: t("prawne.tos_toc_8", "Reklamacje") },
      { id: "r9", label: t("prawne.tos_toc_9", "Zmiany") },
    ],
    cookies: [
      { id: "c1", label: t("prawne.cookies_toc_1", "Co to są cookies") },
      { id: "c2", label: t("prawne.cookies_toc_2", "Jakich używamy") },
      { id: "c3", label: t("prawne.cookies_toc_3", "Preferencje") },
      { id: "c4", label: t("prawne.cookies_toc_4", "Wyłączenie cookies") },
    ],
  };

  const [tab, setTab] = useState(() => {
    const h = typeof window !== "undefined" ? window.location.hash.replace("#", "") : "";
    return TABS.find((x) => x.id === h) ? h : "prywatnosc";
  });
  const [cookiePrefs, setCookiePrefs] = useState({ analytics: true, performance: true, marketing: false });

  useEffect(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (TABS.find((x) => x.id === h)) setTab(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchTab = (id) => {
    setTab(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
  };

  const titles = {
    prywatnosc: (<>{t("prawne.privacy_title_p1", "Polityka")} <em className="italic text-ink-1">{t("prawne.privacy_title_em", "prywatności")}</em>.</>),
    regulamin: (<>{t("prawne.tos_title_p1", "Regulamin")} <em className="italic text-ink-1">{t("prawne.tos_title_em", "świadczenia usług")}</em>.</>),
    cookies: (<>{t("prawne.cookies_title_p1", "Polityka")} <em className="italic text-ink-1">{t("prawne.cookies_title_em", "cookies")}</em>.</>),
  };
  const docNums = { prywatnosc: "01", regulamin: "02", cookies: "03" };
  const tldrLabel = t("prawne.tldr_label", "// TL;DR · Krótko");

  return (
    <>
      <header className="border-b border-line px-5 pb-7 pt-[110px] sm:pb-9 sm:pt-[130px] lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <Eyebrow>{`${t("prawne.eyebrow_prefix", "// Dokument nr")} ${docNums[tab]} ${t("prawne.eyebrow_suffix", "· Obowiązuje od 15.04.2026")}`}</Eyebrow>
          <h1 className="my-4 font-serif text-[clamp(32px,5vw,72px)] font-medium leading-[0.95] tracking-[-0.02em] sm:text-[clamp(40px,5vw,72px)]">{titles[tab]}</h1>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-mono text-ink-2 sm:mt-6 sm:gap-7">
            <span>{t("prawne.meta_last_update", "Ostatnia aktualizacja")} · <strong className="text-ink-0">15.04.2026</strong></span>
            <span>{t("prawne.meta_language", "Język")} · <strong className="text-ink-0">{t("prawne.meta_language_val", "Polski")}</strong></span>
            <span>{t("prawne.meta_version", "Wersja")} · <strong className="text-ink-0">4.2.1</strong></span>
            <span>{t("prawne.meta_length", "Długość")} · <strong className="text-ink-0">{t("prawne.meta_length_val", "~ 8 min czytania")}</strong></span>
          </div>
        </div>
      </header>

      <div className="sticky top-[58px] z-40 border-b border-line bg-bg-1/70 px-5 backdrop-blur-lg sm:top-[68px] lg:px-12">
        <div className="relative">
          <div className="mx-auto flex max-w-[1100px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {TABS.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => switchTab(x.id)}
                className={`min-h-[44px] whitespace-nowrap border-b-2 px-4 py-3.5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors sm:px-7 sm:py-5 ${
                  tab === x.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
                }`}
              >
                <span className={`mr-1.5 sm:mr-2 ${tab === x.id ? "text-red/60" : "text-ink-3"}`}>// {String(i + 1).padStart(2, "0")}</span>
                {x.label}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-bg-1 to-transparent lg:hidden" aria-hidden="true" />
        </div>
      </div>

      <main className="mx-auto mt-8 grid max-w-[1100px] grid-cols-1 items-start gap-8 px-5 pb-16 sm:mt-10 sm:pb-24 lg:mt-16 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-12">
        <aside className="order-2 lg:order-1 lg:sticky lg:top-36">
          <h5 className="mb-3 border-b border-line pb-2.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("prawne.toc_label", "// Spis treści")}</h5>
          <ol className="grid grid-cols-2 gap-x-4 gap-y-0.5 sm:grid-cols-3 lg:block lg:space-y-2">
            {TOC[tab].map((s, i) => (
              <li key={s.id} className="text-[13px]">
                <span className="mr-1 font-mono text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")} ·</span>
                <a href={`#${s.id}`} className="inline-block py-1.5 text-ink-1 transition-colors hover:text-red">{s.label}</a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="order-1 min-w-0 lg:order-2 text-ink-1">
          {tab === "prywatnosc" && (
            <>
              <Tldr tldrLabel={tldrLabel}>
                {t("prawne.privacy_tldr_p1", "Zbieramy")} <strong className="font-medium text-ink-0">{t("prawne.privacy_tldr_strong", "minimalnie")}</strong> {t("prawne.privacy_tldr_p2", "— e-mail, hasło zaszyfrowane, dane o tym, jakich odcinków słuchasz. Nie sprzedajemy nic nikomu. Nie ma Facebook Pixela, nie ma Google Analytics, używamy własnego anonimowego trackingu. Wszystkie dane możesz pobrać, edytować lub usunąć z jednego ekranu. RODO i wszystko, co z tego wynika — szanujemy.")}
              </Tldr>

              <DocHeading sec={t("prawne.section_label_01", "// Sekcja 01")}><span id="p1" />{t("prawne.privacy_h1_p1", "Kim")} <em className="italic text-ink-1">{t("prawne.privacy_h1_em", "jesteśmy")}</em>.</DocHeading>
              <P>{t("prawne.privacy_p1_p1", "Administratorem danych osobowych jest")} <strong className="font-medium text-ink-0">{t("prawne.privacy_p1_strong", "OBSKURA Audio sp. z o.o.")}</strong> {t("prawne.privacy_p1_p2", "z siedzibą w Gdańsku, ul. Stara Stocznia 27, 80-863, NIP 583-321-09-44, KRS 0000847291.")}</P>
              <P>{t("prawne.privacy_p1b_p1", "W sprawach związanych z ochroną danych osobowych możesz kontaktować się z naszym Inspektorem Ochrony Danych:")} <Code>iod@obskura.audio</Code>. {t("prawne.privacy_p1b_p2", "Odpowiadamy w 14 dni.")}</P>

              <DocHeading sec={t("prawne.section_label_02", "// Sekcja 02")}><span id="p2" />{t("prawne.privacy_h2_p1", "Jakie dane")} <em className="italic text-ink-1">{t("prawne.privacy_h2_em", "zbieramy")}</em>.</DocHeading>
              <SubHeading>{t("prawne.privacy_sub_account", "Dane konta")}</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_acc_1_b", "E-mail")}</strong> {t("prawne.privacy_acc_1_t", "— do logowania, komunikacji, fakturowania.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_acc_2_b", "Hasło")}</strong> {t("prawne.privacy_acc_2_t", "— zaszyfrowane algorytmem bcrypt cost 12. Nikt z naszego zespołu nie widzi twojego hasła w postaci jawnej.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_acc_3_b", "Pseudonim / nazwa wyświetlana")}</strong> {t("prawne.privacy_acc_3_t", "— opcjonalna, widoczna dla innych użytkowników.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_acc_4_b", "Preferencje gatunków")}</strong> {t("prawne.privacy_acc_4_t", "— które kategorie wybrałeś przy rejestracji.")}</>,
              ]} />
              <SubHeading>{t("prawne.privacy_sub_listen", "Dane o słuchaniu")}</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_listen_1_b", "Historia słuchania")}</strong> {t("prawne.privacy_listen_1_t", "— które odcinki, jak długo, czy do końca.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_listen_2_b", "Pozycja odtwarzania")}</strong> {t("prawne.privacy_listen_2_t", "— w której minucie zatrzymałeś się.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_listen_3_b", "Polubienia, oceny, komentarze")}</strong> {t("prawne.privacy_listen_3_t", "— twoje aktywności w platformie.")}</>,
              ]} />
              <SubHeading>{t("prawne.privacy_sub_tech", "Dane techniczne")}</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_tech_1_b", "Adres IP")}</strong> {t("prawne.privacy_tech_1_t", "— przechowywany maksymalnie 7 dni dla celów bezpieczeństwa.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_tech_2_b", "Typ urządzenia, OS, przeglądarka")}</strong> {t("prawne.privacy_tech_2_t", "— do diagnostyki bugów, agregowane.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_tech_3_b", "Wybrana jakość audio")}</strong> {t("prawne.privacy_tech_3_t", "— do optymalizacji CDN.")}</>,
              ]} />

              <DocHeading sec={t("prawne.section_label_03", "// Sekcja 03")}><span id="p3" />{t("prawne.privacy_h3_p1", "Po co")} <em className="italic text-ink-1">{t("prawne.privacy_h3_em", "je zbieramy")}</em>.</DocHeading>
              <DataTable
                head={[t("prawne.privacy_th_cel", "Cel"), t("prawne.privacy_th_podstawa", "Podstawa prawna"), t("prawne.privacy_th_czas", "Czas")]}
                rows={[
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row1_cel", "Świadczenie usługi (odtwarzanie, konto)")}</strong>, t("prawne.privacy_row1_podstawa", "Umowa"), t("prawne.privacy_row1_czas", "Cały okres konta")],
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row2_cel", "Rozliczenia, fakturowanie")}</strong>, t("prawne.privacy_row2_podstawa", "Obowiązek prawny"), t("prawne.privacy_row2_czas", "5 lat po wystawieniu")],
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row3_cel", "Rekomendacje treści")}</strong>, t("prawne.privacy_row3_podstawa", "Uzasadniony interes"), t("prawne.privacy_row3_czas", "Cały okres konta")],
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row4_cel", "Newsletter")}</strong>, t("prawne.privacy_row4_podstawa", "Zgoda"), t("prawne.privacy_row4_czas", "Do wycofania zgody")],
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row5_cel", "Statystyki (agregowane)")}</strong>, t("prawne.privacy_row5_podstawa", "Uzasadniony interes"), t("prawne.privacy_row5_czas", "Bezterminowo")],
                  [<strong className="font-medium text-ink-0">{t("prawne.privacy_row6_cel", "Bezpieczeństwo (logi, IP)")}</strong>, t("prawne.privacy_row6_podstawa", "Uzasadniony interes"), t("prawne.privacy_row6_czas", "7 dni")],
                ]}
              />

              <DocHeading sec={t("prawne.section_label_04", "// Sekcja 04")}><span id="p4" />{t("prawne.privacy_h4_p1", "Komu")} <em className="italic text-ink-1">{t("prawne.privacy_h4_em", "udostępniamy")}</em>.</DocHeading>
              <P>{t("prawne.privacy_p4", "Nikomu na zewnątrz nie sprzedajemy danych. Powierzamy je tylko zaufanym dostawcom usług, którzy świadczą nam infrastrukturę:")}</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_vendor1_b", "Hetzner Online GmbH")}</strong> {t("prawne.privacy_vendor1_t", "(Niemcy) — hosting baz i serwerów aplikacji")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_vendor2_b", "Bunny.net")}</strong> {t("prawne.privacy_vendor2_t", "(Słowenia) — CDN audio")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_vendor3_b", "Stripe Payments Europe")}</strong> {t("prawne.privacy_vendor3_t", "(Irlandia) — przetwarzanie płatności kartą")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_vendor4_b", "Postmark")}</strong> {t("prawne.privacy_vendor4_t", "(USA, DPF certified) — wysyłka e-maili transakcyjnych")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_vendor5_b", "Plausible Analytics")}</strong> {t("prawne.privacy_vendor5_t", "(Estonia) — anonimowe statystyki, bez cookies trackingowych")}</>,
              ]} />
              <P>{t("prawne.privacy_p4b", "Każdy z nich ma podpisaną umowę powierzenia danych (DPA). Pełen rejestr dostępny na żądanie.")}</P>

              <DocHeading sec={t("prawne.section_label_05", "// Sekcja 05")}><span id="p5" />{t("prawne.privacy_h5_p1", "Jak długo")} <em className="italic text-ink-1">{t("prawne.privacy_h5_em", "trzymamy")}</em>.</DocHeading>
              <P>{t("prawne.privacy_p5_p1", "Domyślnie —")} <strong className="font-medium text-ink-0">{t("prawne.privacy_p5_strong", "tak długo, jak masz konto u nas")}</strong>. {t("prawne.privacy_p5_p2", "Po usunięciu konta:")}</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_retention_1_b", "0 — 30 dni")}</strong>{t("prawne.privacy_retention_1_t", ": okres karencji. Możesz odzyskać konto bez utraty danych.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_retention_2_b", "31. dzień")}</strong>{t("prawne.privacy_retention_2_t", ": dane usuwane z aktywnych baz, włącznie z backupami.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_retention_3_b", "5 lat")}</strong>{t("prawne.privacy_retention_3_t", ": dane rozliczeniowe (faktury, transakcje) — wymóg ustawy o rachunkowości.")}</>,
              ]} />

              <DocHeading sec={t("prawne.section_label_06", "// Sekcja 06")}><span id="p6" />{t("prawne.privacy_h6_p1", "Twoje")} <em className="italic text-ink-1">{t("prawne.privacy_h6_em", "prawa")}</em>.</DocHeading>
              <P>{t("prawne.privacy_p6", "Zgodnie z RODO (art. 15–22) masz prawo do:")}</P>
              <Bullets ordered items={[
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_1_b", "Dostępu")}</strong> {t("prawne.privacy_rights_1_t", "— w 7 dni dostajesz ZIP z wszystkimi swoimi danymi (JSON + CSV).")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_2_b", "Sprostowania")}</strong> {t("prawne.privacy_rights_2_t", "— edytuj wszystko w Koncie → Profil.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_3_b", "Usunięcia")}</strong> {t("prawne.privacy_rights_3_t", "— Konto → Prywatność → Usuń konto.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_4_b", "Ograniczenia przetwarzania")}</strong> {t("prawne.privacy_rights_4_t", "— możesz wyłączyć rekomendacje, newsletter, telemetrię niezależnie.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_5_b", "Przenoszenia danych")}</strong> {t("prawne.privacy_rights_5_t", "— eksport w formacie strukturalnym.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_6_b", "Sprzeciwu")}</strong> {t("prawne.privacy_rights_6_t", "— wobec marketingu lub profilowania.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.privacy_rights_7_b", "Skargi do PUODO")}</strong> {t("prawne.privacy_rights_7_t", "— Prezes Urzędu Ochrony Danych Osobowych, ul. Stawki 2, Warszawa.")}</>,
              ]} />
              <P>{t("prawne.privacy_p6b", "Wszystkie żądania realizujemy bezpłatnie i w ciągu 14 dni.")}</P>

              <DocHeading sec={t("prawne.section_label_07", "// Sekcja 07")}><span id="p7" />{t("prawne.privacy_h7", "Bezpieczeństwo")}.</DocHeading>
              <P>{t("prawne.privacy_p7", "Stosujemy techniczne i organizacyjne środki ochrony danych: szyfrowanie TLS 1.3 w komunikacji, AES-256 w spoczynku, hasła hashowane bcrypt, 2FA opcjonalne, regularne audyty bezpieczeństwa (ostatni: 03.2026 przez Securitum). W razie incydentu — informujemy w 72h.")}</P>

              <DocHeading sec={t("prawne.section_label_08", "// Sekcja 08")}><span id="p8" />{t("prawne.privacy_h8", "Kontakt")}.</DocHeading>
              <P>{t("prawne.privacy_p8_iod", "Inspektor Ochrony Danych —")} <Code>iod@obskura.audio</Code>.<br />{t("prawne.privacy_p8_help", "Wsparcie ogólne —")} <Code>pomoc@obskura.audio</Code>.<br />{t("prawne.privacy_p8_mail", "Pocztą tradycyjną — OBSKURA Audio sp. z o.o., ul. Stara Stocznia 27, 80-863 Gdańsk.")}</P>
            </>
          )}

          {tab === "regulamin" && (
            <>
              <Tldr tldrLabel={tldrLabel}>
                <strong className="font-medium text-ink-0">{t("prawne.tos_tldr_strong", "Płacisz — słuchasz.")}</strong> {t("prawne.tos_tldr_p", "Możesz anulować w każdej chwili jednym kliknięciem. 30 dni od zakupu — pełen zwrot bez pytań. Nie udostępniaj konta osobom poza domem. Nie ściągaj naszych odcinków na zewnątrz. Bądź uprzejmy w komentarzach. Reszta jest detalem.")}
              </Tldr>

              <DocHeading sec={t("prawne.tos_section_1", "// § 1")}><span id="r1" />{t("prawne.tos_h1", "Definicje")}.</DocHeading>
              <P>{t("prawne.tos_p1", "W niniejszym regulaminie używane są następujące pojęcia:")}</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_1_b", "OBSKURA")}</strong> {t("prawne.tos_def_1_t", "— OBSKURA Audio sp. z o.o., NIP 583-321-09-44.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_2_b", "Platforma")}</strong> {t("prawne.tos_def_2_t", "— serwis obskura.audio wraz z aplikacjami mobilnymi.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_3_b", "Użytkownik")}</strong> {t("prawne.tos_def_3_t", "— osoba fizyczna posiadająca konto na Platformie.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_4_b", "Treści")}</strong> {t("prawne.tos_def_4_t", "— odcinki audio, transkrypty, materiały dodatkowe oferowane przez OBSKURA.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_5_b", "Treści użytkownika")}</strong> {t("prawne.tos_def_5_t", "— komentarze, posty na forum, recenzje wprowadzane przez Użytkowników.")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.tos_def_6_b", "Subskrypcja")}</strong> {t("prawne.tos_def_6_t", "— odpłatne uprawnienie do dostępu do Treści w wybranym Planie.")}</>,
              ]} />

              <DocHeading sec={t("prawne.tos_section_2", "// § 2")}><span id="r2" />{t("prawne.tos_h2", "Konto")}.</DocHeading>
              <P>{t("prawne.tos_p2_p1", "Założenie konta jest bezpłatne. Wymaga podania prawidłowego adresu e-mail i ustanowienia hasła. Konto może założyć osoba, która ukończyła")} <strong className="font-medium text-ink-0">{t("prawne.tos_p2_strong", "16 lat")}</strong>. {t("prawne.tos_p2_p2", "Osoby między 13–16 r.ż. — wyłącznie za zgodą opiekuna prawnego.")}</P>
              <P>{t("prawne.tos_p2b", "Konto jest osobiste. Współdzielenie loginu / hasła z osobami spoza domu — narusza regulamin. W Planie Klan dopuszczamy do 5 profili rodzinnych.")}</P>

              <DocHeading sec={t("prawne.tos_section_3", "// § 3")}><span id="r3" />{t("prawne.tos_h3", "Subskrypcja i plany")}.</DocHeading>
              <P>{t("prawne.tos_p3_p1", "OBSKURA oferuje trzy plany:")} <strong className="font-medium text-ink-0">{t("prawne.tos_plan_prog", "Próg")}</strong> {t("prawne.tos_p3_p2", "(bezpłatny, ograniczony),")} <strong className="font-medium text-ink-0">{t("prawne.tos_plan_solo", "Solo")}</strong> {t("prawne.tos_p3_p3", "(płatny indywidualny),")} <strong className="font-medium text-ink-0">{t("prawne.tos_plan_klan", "Klan")}</strong> {t("prawne.tos_p3_p4", "(płatny rodzinny). Szczegóły cen znajdziesz na")} <Code>obskura.audio/club</Code>.</P>
              <P>{t("prawne.tos_p3b", "Subskrypcja odnawia się automatycznie do momentu jej anulowania. Anulowania można dokonać w każdej chwili w panelu Konto → Subskrypcja → Anuluj.")}</P>

              <DocHeading sec={t("prawne.tos_section_4", "// § 4")}><span id="r4" />{t("prawne.tos_h4", "Płatności")}.</DocHeading>
              <P>{t("prawne.tos_p4_p1", "Płatności realizowane są przez")} <strong className="font-medium text-ink-0">{t("prawne.tos_p4_strong", "Stripe Payments Europe")}</strong>. {t("prawne.tos_p4_p2", "Akceptujemy karty Visa / MasterCard / Amex, BLIK, Przelewy24, Google Pay, Apple Pay.")}</P>
              <P>{t("prawne.tos_p4b", "Wszystkie ceny zawierają VAT. Faktury wystawiane automatycznie po każdej płatności.")}</P>

              <DocHeading sec={t("prawne.tos_section_5", "// § 5")}><span id="r5" />{t("prawne.tos_h5", "Odstąpienie i zwroty")}.</DocHeading>
              <blockquote className="my-5 border-l-2 border-red bg-red/5 px-4 py-4 font-serif text-base italic leading-snug text-ink-0 sm:my-6 sm:px-5 sm:text-lg">
                {t("prawne.tos_quote_p1", "W ciągu")} <strong className="font-medium">{t("prawne.tos_quote_strong", "30 dni od pierwszej płatności")}</strong> {t("prawne.tos_quote_p2", "— pełen zwrot, bez pytań i tłumaczenia.")}
              </blockquote>
              <P>{t("prawne.tos_p5", "To więcej niż wymaga ustawa o prawach konsumenta (14 dni).")}</P>
              <P>{t("prawne.tos_p5b_p1", "Po 30 dniach — zwrot proporcjonalny do niewykorzystanej części okresu. Wniosek:")} <Code>pomoc@obskura.audio</Code>. {t("prawne.tos_p5b_p2", "Realizacja zwrotu — 7 dni roboczych.")}</P>

              <DocHeading sec={t("prawne.tos_section_6", "// § 6")}><span id="r6" />{t("prawne.tos_h6", "Treści użytkowników")}.</DocHeading>
              <P>{t("prawne.tos_p6", "Wprowadzając Treści (komentarze, posty na forum, recenzje), Użytkownik:")}</P>
              <Bullets ordered items={[
                t("prawne.tos_user_1", "Oświadcza, że posiada do nich pełne prawa autorskie."),
                t("prawne.tos_user_2", "Udziela OBSKURA niewyłącznej licencji na ich wyświetlanie w obrębie Platformy."),
                t("prawne.tos_user_3", "Może w każdej chwili je usunąć (cofa wówczas licencję)."),
              ]} />
              <P>{t("prawne.tos_p6b", "Zakazane są Treści: zniesławiające, naruszające prawa autorskie, podżegające do przemocy, zawierające spam czy malware. Moderacja działa post-publication w 4h (dzień) lub 12h (noc).")}</P>

              <DocHeading sec={t("prawne.tos_section_7", "// § 7")}><span id="r7" />{t("prawne.tos_h7", "Treści OBSKURY")}.</DocHeading>
              <P>{t("prawne.tos_p7_p1", "Wszystkie odcinki, transkrypty, materiały graficzne są chronione prawem autorskim. Subskrypcja udziela")} <strong className="font-medium text-ink-0">{t("prawne.tos_p7_strong", "licencji niewyłącznej, nieprzekazywalnej")}</strong>{t("prawne.tos_p7_p2", ", ograniczonej do osobistego użytku.")}</P>
              <P>{t("prawne.tos_p7b", "Zabronione jest: pobieranie odcinków poza oficjalną funkcję offline, udostępnianie ich w internecie, wykorzystywanie komercyjne bez pisemnej zgody.")}</P>
              <P>{t("prawne.tos_p7c", "Krótkie cytaty (do 30 sekund audio lub 100 słów transkryptu) — dozwolone w ramach dozwolonego użytku (art. 29 PrAut).")}</P>

              <DocHeading sec={t("prawne.tos_section_8", "// § 8")}><span id="r8" />{t("prawne.tos_h8", "Reklamacje")}.</DocHeading>
              <P>{t("prawne.tos_p8_p1", "Reklamacje składamy na")} <Code>pomoc@obskura.audio</Code>. {t("prawne.tos_p8_p2", "Termin odpowiedzi — 14 dni. W razie sporu — najpierw mediacja przez UOKiK, w ostateczności sąd właściwy dla siedziby OBSKURY (Gdańsk).")}</P>
              <P>{t("prawne.tos_p8b", "Dla konsumentów — sąd właściwy dla miejsca zamieszkania Użytkownika.")}</P>

              <DocHeading sec={t("prawne.tos_section_9", "// § 9")}><span id="r9" />{t("prawne.tos_h9", "Zmiany regulaminu")}.</DocHeading>
              <P>{t("prawne.tos_p9_p1", "O zmianach regulaminu informujemy z")} <strong className="font-medium text-ink-0">{t("prawne.tos_p9_strong", "30-dniowym wyprzedzeniem")}</strong> {t("prawne.tos_p9_p2", "— e-mailem i banerem. Jeśli nie akceptujesz nowej wersji — masz prawo usunąć konto z pełnym zwrotem niewykorzystanej Subskrypcji.")}</P>
              <P>{t("prawne.tos_p9b_p1", "Historia wszystkich wersji — pod")} <Code>obskura.audio/legal/historia</Code>.</P>
            </>
          )}

          {tab === "cookies" && (
            <>
              <Tldr tldrLabel={tldrLabel}>
                {t("prawne.cookies_tldr_p1", "Używamy")} <strong className="font-medium text-ink-0">{t("prawne.cookies_tldr_strong1", "minimum cookies")}</strong> {t("prawne.cookies_tldr_p2", "niezbędnych do działania serwisu (login, koszyk, język). Do statystyk — Plausible (bez identyfikacji, bez third-party cookies).")} <strong className="font-medium text-ink-0">{t("prawne.cookies_tldr_strong2", "Bez Google Analytics, bez Facebook Pixela, bez retargetingu.")}</strong> {t("prawne.cookies_tldr_p3", "Reszta — twoja decyzja, ustawisz poniżej.")}
              </Tldr>

              <DocHeading sec={t("prawne.section_label_01", "// Sekcja 01")}><span id="c1" />{t("prawne.cookies_h1_p1", "Co to są")} <em className="italic text-ink-1">{t("prawne.cookies_h1_em", "cookies")}</em>.</DocHeading>
              <P>{t("prawne.cookies_p1", "Cookies (ciasteczka) to małe pliki tekstowe, które przeglądarka zapisuje na twoim urządzeniu, gdy odwiedzasz stronę. Pozwalają nam rozpoznać twoje urządzenie przy kolejnej wizycie i zapamiętać ustawienia.")}</P>
              <P>{t("prawne.cookies_p1b_p1", "Cookies")} <strong className="font-medium text-ink-0">{t("prawne.cookies_p1b_strong", "nie zawierają")}</strong> {t("prawne.cookies_p1b_p2", "osobistych informacji w bezpośredniej formie. Nie mogą instalować malware ani odczytywać innych plików z twojego urządzenia.")}</P>

              <DocHeading sec={t("prawne.section_label_02", "// Sekcja 02")}><span id="c2" />{t("prawne.cookies_h2_p1", "Jakich cookies")} <em className="italic text-ink-1">{t("prawne.cookies_h2_em", "używamy")}</em>.</DocHeading>
              <DataTable
                head={[t("prawne.cookies_th_cookie", "Cookie"), t("prawne.cookies_th_cel", "Cel"), t("prawne.cookies_th_czas", "Czas życia"), t("prawne.cookies_th_typ", "Typ")]}
                rows={[
                  [<Code>ob_session</Code>, t("prawne.cookies_row1_cel", "Zalogowana sesja"), t("prawne.cookies_row1_czas", "14 dni"), <strong className="font-medium text-ink-0">{t("prawne.cookies_type_necessary", "Niezbędne")}</strong>],
                  [<Code>ob_csrf</Code>, t("prawne.cookies_row2_cel", "Bezpieczeństwo (CSRF)"), t("prawne.cookies_row2_czas", "Sesja"), <strong className="font-medium text-ink-0">{t("prawne.cookies_type_necessary", "Niezbędne")}</strong>],
                  [<Code>ob_lang</Code>, t("prawne.cookies_row3_cel", "Wybrany język"), t("prawne.cookies_row3_czas", "1 rok"), <strong className="font-medium text-ink-0">{t("prawne.cookies_type_necessary", "Niezbędne")}</strong>],
                  [<Code>ob_player_qual</Code>, t("prawne.cookies_row4_cel", "Jakość audio"), t("prawne.cookies_row4_czas", "1 rok"), t("prawne.cookies_type_performance", "Wydajność")],
                  [<Code>ob_player_pos</Code>, t("prawne.cookies_row5_cel", "Pozycja odtwarzania"), t("prawne.cookies_row5_czas", "30 dni"), t("prawne.cookies_type_performance", "Wydajność")],
                  [<Code>plausible_id</Code>, t("prawne.cookies_row6_cel", "Anonimowa statystyka"), t("prawne.cookies_row6_czas", "24h"), t("prawne.cookies_type_analytics", "Analityka")],
                ]}
              />
              <P>{t("prawne.cookies_p2", "To wszystko. Sześć cookies. Trzy obowiązkowe (bez nich logowanie nie działa), trzy opcjonalne (możesz wyłączyć).")}</P>

              <DocHeading sec={t("prawne.section_label_03", "// Sekcja 03")}><span id="c3" />{t("prawne.cookies_h3_p1", "Twoje")} <em className="italic text-ink-1">{t("prawne.cookies_h3_em", "preferencje")}</em>.</DocHeading>
              <P>{t("prawne.cookies_p3", "Możesz w każdej chwili zmienić ustawienia. Zapis wchodzi w życie natychmiast.")}</P>
              <div className="mt-6">
                <ToggleRow required on title={t("prawne.cookies_toggle_necessary_t", "Niezbędne")} desc={t("prawne.cookies_toggle_necessary_d", "Logowanie, bezpieczeństwo, podstawowe ustawienia. Bez nich serwis nie działa.")} />
                <ToggleRow title={t("prawne.cookies_toggle_performance_t", "Wydajność")} desc={t("prawne.cookies_toggle_performance_d", "Pamiętanie ustawień jakości audio i pozycji odtwarzania.")} on={cookiePrefs.performance} onToggle={() => setCookiePrefs((p) => ({ ...p, performance: !p.performance }))} />
                <ToggleRow title={t("prawne.cookies_toggle_analytics_t", "Analityka anonimowa (Plausible)")} desc={t("prawne.cookies_toggle_analytics_d", "Liczymy ile osób odwiedza strony — bez identyfikacji ciebie. Hosted w EU.")} on={cookiePrefs.analytics} onToggle={() => setCookiePrefs((p) => ({ ...p, analytics: !p.analytics }))} />
                <ToggleRow title={t("prawne.cookies_toggle_marketing_t", "Marketing")} desc={t("prawne.cookies_toggle_marketing_d", "Nie używamy żadnych cookies marketingowych. Ten toggle jest tu, żeby było widać, że nie używamy.")} on={cookiePrefs.marketing} onToggle={() => setCookiePrefs((p) => ({ ...p, marketing: !p.marketing }))} />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:mt-7 sm:flex-row sm:flex-wrap">
                <HorrorButton type="button" onClick={() => setCookiePrefs((p) => p)}>{t("prawne.cookies_btn_save", "Zapisz preferencje")}</HorrorButton>
                <HorrorButton type="button" variant="ghost" onClick={() => setCookiePrefs({ analytics: false, performance: false, marketing: false })}>{t("prawne.cookies_btn_reject", "Odrzuć wszystkie opcjonalne")}</HorrorButton>
              </div>

              <DocHeading sec={t("prawne.section_label_04", "// Sekcja 04")}><span id="c4" />{t("prawne.cookies_h4_p1", "Wyłączenie")} <em className="italic text-ink-1">{t("prawne.cookies_h4_em", "cookies całkowicie")}</em>.</DocHeading>
              <P>{t("prawne.cookies_p4", "Możesz wyłączyć obsługę cookies w ustawieniach przeglądarki. Pamiętaj, że bez cookies niezbędnych nie będziesz mógł się zalogować.")}</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">{t("prawne.cookies_browser_1_b", "Chrome / Edge")}</strong> {t("prawne.cookies_browser_1_t", "— Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.cookies_browser_2_b", "Firefox")}</strong> {t("prawne.cookies_browser_2_t", "— Preferencje → Prywatność i bezpieczeństwo → Pliki cookie i dane stron")}</>,
                <><strong className="font-medium text-ink-0">{t("prawne.cookies_browser_3_b", "Safari")}</strong> {t("prawne.cookies_browser_3_t", "— Safari → Preferencje → Prywatność")}</>,
              ]} />
            </>
          )}
        </article>
      </main>
    </>
  );
}
