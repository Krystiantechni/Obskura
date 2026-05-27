import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

const TABS = [
  { id: "prywatnosc", label: "Polityka prywatności" },
  { id: "regulamin", label: "Regulamin" },
  { id: "cookies", label: "Cookies" },
];

const TOC = {
  prywatnosc: [
    { id: "p1", label: "Kim jesteśmy" },
    { id: "p2", label: "Jakie dane zbieramy" },
    { id: "p3", label: "Po co je zbieramy" },
    { id: "p4", label: "Komu udostępniamy" },
    { id: "p5", label: "Jak długo trzymamy" },
    { id: "p6", label: "Twoje prawa" },
    { id: "p7", label: "Bezpieczeństwo" },
    { id: "p8", label: "Kontakt" },
  ],
  regulamin: [
    { id: "r1", label: "Definicje" },
    { id: "r2", label: "Konto" },
    { id: "r3", label: "Subskrypcja" },
    { id: "r4", label: "Płatności" },
    { id: "r5", label: "Odstąpienie" },
    { id: "r6", label: "Treści użytkowników" },
    { id: "r7", label: "Treści Obskury" },
    { id: "r8", label: "Reklamacje" },
    { id: "r9", label: "Zmiany" },
  ],
  cookies: [
    { id: "c1", label: "Co to są cookies" },
    { id: "c2", label: "Jakich używamy" },
    { id: "c3", label: "Preferencje" },
    { id: "c4", label: "Wyłączenie cookies" },
  ],
};

// Wspólne style typografii dokumentu — czytelne, serif nagłówki.
function DocHeading({ sec, children }) {
  return (
    <h2 className="mb-4 mt-12 border-b border-line pb-3 font-serif text-2xl font-medium leading-tight first:mt-0 sm:text-3xl">
      <span className="mb-2 block font-mono text-[11px] uppercase tracking-eyebrow text-red">{sec}</span>
      {children}
    </h2>
  );
}
DocHeading.propTypes = { sec: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function SubHeading({ children }) {
  return <h3 className="mb-3 mt-7 font-serif text-xl font-medium italic text-ink-0">{children}</h3>;
}
SubHeading.propTypes = { children: PropTypes.node.isRequired };

function P({ children }) {
  return <p className="mb-3.5 max-w-prose text-[15px] font-light leading-relaxed text-ink-1">{children}</p>;
}
P.propTypes = { children: PropTypes.node.isRequired };

function Code({ children }) {
  return <code className="bg-black/40 px-2 py-0.5 font-mono text-[13px] text-red">{children}</code>;
}
Code.propTypes = { children: PropTypes.node.isRequired };

function Bullets({ items, ordered = false }) {
  const Tag = ordered ? "ol" : "ul";
  return (
    <Tag className={`mb-4 mt-3 max-w-prose space-y-2 pl-6 ${ordered ? "list-decimal" : "list-disc"} marker:text-red`}>
      {items.map((it, i) => (
        <li key={i} className="text-sm font-light leading-relaxed text-ink-1">{it}</li>
      ))}
    </Tag>
  );
}
Bullets.propTypes = { items: PropTypes.array.isRequired, ordered: PropTypes.bool };

function Tldr({ children }) {
  return (
    <div className="mb-10 border-l-2 border-red bg-red/5 p-6">
      <h4 className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-red">// TL;DR · Krótko</h4>
      <p className="text-[15px] font-light leading-relaxed text-ink-0">{children}</p>
    </div>
  );
}
Tldr.propTypes = { children: PropTypes.node.isRequired };

function DataTable({ head, rows }) {
  return (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} className="border-b border-red bg-black/30 px-4 py-3.5 text-left font-mono text-[10px] uppercase tracking-mono text-ink-2">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className="border-b border-line px-4 py-3.5 font-light text-ink-1">{c}</td>
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
    <div className={`mb-2 flex items-center justify-between gap-4 border border-line bg-bg-2/50 px-5 py-4 ${required ? "opacity-60" : ""}`}>
      <div>
        <h5 className="mb-1 font-serif text-lg font-medium">{title}</h5>
        <p className="text-xs text-ink-2">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={title}
        disabled={required}
        onClick={onToggle}
        className={`relative h-[22px] w-10 flex-shrink-0 rounded-full transition-colors duration-200 ${
          required ? "cursor-not-allowed bg-ink-3" : on ? "bg-red" : "bg-white/10"
        } after:absolute after:left-[3px] after:top-[3px] after:h-4 after:w-4 after:rounded-full after:bg-ink-0 after:transition-transform after:duration-200 ${
          on ? "after:translate-x-[18px]" : ""
        }`}
      />
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

export default function Prawne() {
  const { t } = useTranslation();
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
  }, []);

  const switchTab = (id) => {
    setTab(id);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${id}`);
  };

  const titles = {
    prywatnosc: (<>Polityka <em className="italic text-ink-1">prywatności</em>.</>),
    regulamin: (<>Regulamin <em className="italic text-ink-1">świadczenia usług</em>.</>),
    cookies: (<>Polityka <em className="italic text-ink-1">cookies</em>.</>),
  };
  const docNums = { prywatnosc: "01", regulamin: "02", cookies: "03" };

  return (
    <>
      {/* Header */}
      <header className="border-b border-line px-5 pb-9 pt-[130px] lg:px-12">
        <div className="mx-auto max-w-[1100px]">
          <Eyebrow>{t("prawne.eyebrow", `// Dokument nr ${docNums[tab]} · Obowiązuje od 15.04.2026`)}</Eyebrow>
          <h1 className="my-4 font-serif text-[clamp(40px,5vw,72px)] font-medium leading-[0.95] tracking-[-0.02em]">{titles[tab]}</h1>
          <div className="mt-6 flex flex-wrap gap-7 border-t border-line pt-4 font-mono text-[11px] uppercase tracking-mono text-ink-2">
            <span>Ostatnia aktualizacja · <strong className="text-ink-0">15.04.2026</strong></span>
            <span>Język · <strong className="text-ink-0">Polski</strong></span>
            <span>Wersja · <strong className="text-ink-0">4.2.1</strong></span>
            <span>Długość · <strong className="text-ink-0">~ 8 min czytania</strong></span>
          </div>
        </div>
      </header>

      {/* Tab bar */}
      <div className="sticky top-[68px] z-40 border-b border-line bg-bg-1/70 px-5 backdrop-blur-lg lg:px-12">
        <div className="mx-auto flex max-w-[1100px] overflow-x-auto">
          {TABS.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => switchTab(x.id)}
              className={`whitespace-nowrap border-b-2 px-5 py-5 font-mono text-[11px] uppercase tracking-eyebrow transition-colors sm:px-7 ${
                tab === x.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
              }`}
            >
              <span className={`mr-2 ${tab === x.id ? "text-red/60" : "text-ink-3"}`}>// {String(i + 1).padStart(2, "0")}</span>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* Document */}
      <main className="mx-auto mt-10 grid max-w-[1100px] grid-cols-1 items-start gap-8 px-5 pb-24 lg:mt-16 lg:grid-cols-[220px_1fr] lg:gap-16 lg:px-12">
        {/* TOC */}
        <aside className="lg:sticky lg:top-36">
          <h5 className="mb-4 border-b border-line pb-2.5 font-mono text-[10px] uppercase tracking-mono text-ink-2">// Spis treści</h5>
          <ol className="space-y-2">
            {TOC[tab].map((s, i) => (
              <li key={s.id} className="text-[13px]">
                <span className="mr-1 font-mono text-[10px] text-ink-3">{String(i + 1).padStart(2, "0")} ·</span>
                <a href={`#${s.id}`} className="text-ink-1 transition-colors hover:text-red">{s.label}</a>
              </li>
            ))}
          </ol>
        </aside>

        {/* Body */}
        <article className="text-ink-1">
          {tab === "prywatnosc" && (
            <>
              <Tldr>
                Zbieramy <strong className="font-medium text-ink-0">minimalnie</strong> — e-mail, hasło zaszyfrowane, dane o tym, jakich odcinków słuchasz. Nie sprzedajemy nic nikomu. Nie ma Facebook Pixela, nie ma Google Analytics, używamy własnego anonimowego trackingu. Wszystkie dane możesz pobrać, edytować lub usunąć z jednego ekranu. RODO i wszystko, co z tego wynika — szanujemy.
              </Tldr>

              <DocHeading sec="// Sekcja 01"><span id="p1" />Kim <em className="italic text-ink-1">jesteśmy</em>.</DocHeading>
              <P>Administratorem danych osobowych jest <strong className="font-medium text-ink-0">OBSKURA Audio sp. z o.o.</strong> z siedzibą w Gdańsku, ul. Stara Stocznia 27, 80-863, NIP 583-321-09-44, KRS 0000847291.</P>
              <P>W sprawach związanych z ochroną danych osobowych możesz kontaktować się z naszym Inspektorem Ochrony Danych: <Code>iod@obskura.audio</Code>. Odpowiadamy w 14 dni.</P>

              <DocHeading sec="// Sekcja 02"><span id="p2" />Jakie dane <em className="italic text-ink-1">zbieramy</em>.</DocHeading>
              <SubHeading>Dane konta</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">E-mail</strong> — do logowania, komunikacji, fakturowania.</>,
                <><strong className="font-medium text-ink-0">Hasło</strong> — zaszyfrowane algorytmem bcrypt cost 12. Nikt z naszego zespołu nie widzi twojego hasła w postaci jawnej.</>,
                <><strong className="font-medium text-ink-0">Pseudonim / nazwa wyświetlana</strong> — opcjonalna, widoczna dla innych użytkowników.</>,
                <><strong className="font-medium text-ink-0">Preferencje gatunków</strong> — które kategorie wybrałeś przy rejestracji.</>,
              ]} />
              <SubHeading>Dane o słuchaniu</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">Historia słuchania</strong> — które odcinki, jak długo, czy do końca.</>,
                <><strong className="font-medium text-ink-0">Pozycja odtwarzania</strong> — w której minucie zatrzymałeś się.</>,
                <><strong className="font-medium text-ink-0">Polubienia, oceny, komentarze</strong> — twoje aktywności w platformie.</>,
              ]} />
              <SubHeading>Dane techniczne</SubHeading>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">Adres IP</strong> — przechowywany maksymalnie 7 dni dla celów bezpieczeństwa.</>,
                <><strong className="font-medium text-ink-0">Typ urządzenia, OS, przeglądarka</strong> — do diagnostyki bugów, agregowane.</>,
                <><strong className="font-medium text-ink-0">Wybrana jakość audio</strong> — do optymalizacji CDN.</>,
              ]} />

              <DocHeading sec="// Sekcja 03"><span id="p3" />Po co <em className="italic text-ink-1">je zbieramy</em>.</DocHeading>
              <DataTable
                head={["Cel", "Podstawa prawna", "Czas"]}
                rows={[
                  [<strong className="font-medium text-ink-0">Świadczenie usługi (odtwarzanie, konto)</strong>, "Umowa", "Cały okres konta"],
                  [<strong className="font-medium text-ink-0">Rozliczenia, fakturowanie</strong>, "Obowiązek prawny", "5 lat po wystawieniu"],
                  [<strong className="font-medium text-ink-0">Rekomendacje treści</strong>, "Uzasadniony interes", "Cały okres konta"],
                  [<strong className="font-medium text-ink-0">Newsletter</strong>, "Zgoda", "Do wycofania zgody"],
                  [<strong className="font-medium text-ink-0">Statystyki (agregowane)</strong>, "Uzasadniony interes", "Bezterminowo"],
                  [<strong className="font-medium text-ink-0">Bezpieczeństwo (logi, IP)</strong>, "Uzasadniony interes", "7 dni"],
                ]}
              />

              <DocHeading sec="// Sekcja 04"><span id="p4" />Komu <em className="italic text-ink-1">udostępniamy</em>.</DocHeading>
              <P>Nikomu na zewnątrz nie sprzedajemy danych. Powierzamy je tylko zaufanym dostawcom usług, którzy świadczą nam infrastrukturę:</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">Hetzner Online GmbH</strong> (Niemcy) — hosting baz i serwerów aplikacji</>,
                <><strong className="font-medium text-ink-0">Bunny.net</strong> (Słowenia) — CDN audio</>,
                <><strong className="font-medium text-ink-0">Stripe Payments Europe</strong> (Irlandia) — przetwarzanie płatności kartą</>,
                <><strong className="font-medium text-ink-0">Postmark</strong> (USA, DPF certified) — wysyłka e-maili transakcyjnych</>,
                <><strong className="font-medium text-ink-0">Plausible Analytics</strong> (Estonia) — anonimowe statystyki, bez cookies trackingowych</>,
              ]} />
              <P>Każdy z nich ma podpisaną umowę powierzenia danych (DPA). Pełen rejestr dostępny na żądanie.</P>

              <DocHeading sec="// Sekcja 05"><span id="p5" />Jak długo <em className="italic text-ink-1">trzymamy</em>.</DocHeading>
              <P>Domyślnie — <strong className="font-medium text-ink-0">tak długo, jak masz konto u nas</strong>. Po usunięciu konta:</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">0 — 30 dni</strong>: okres karencji. Możesz odzyskać konto bez utraty danych.</>,
                <><strong className="font-medium text-ink-0">31. dzień</strong>: dane usuwane z aktywnych baz, włącznie z backupami.</>,
                <><strong className="font-medium text-ink-0">5 lat</strong>: dane rozliczeniowe (faktury, transakcje) — wymóg ustawy o rachunkowości.</>,
              ]} />

              <DocHeading sec="// Sekcja 06"><span id="p6" />Twoje <em className="italic text-ink-1">prawa</em>.</DocHeading>
              <P>Zgodnie z RODO (art. 15–22) masz prawo do:</P>
              <Bullets ordered items={[
                <><strong className="font-medium text-ink-0">Dostępu</strong> — w 7 dni dostajesz ZIP z wszystkimi swoimi danymi (JSON + CSV).</>,
                <><strong className="font-medium text-ink-0">Sprostowania</strong> — edytuj wszystko w Koncie → Profil.</>,
                <><strong className="font-medium text-ink-0">Usunięcia</strong> — Konto → Prywatność → Usuń konto.</>,
                <><strong className="font-medium text-ink-0">Ograniczenia przetwarzania</strong> — możesz wyłączyć rekomendacje, newsletter, telemetrię niezależnie.</>,
                <><strong className="font-medium text-ink-0">Przenoszenia danych</strong> — eksport w formacie strukturalnym.</>,
                <><strong className="font-medium text-ink-0">Sprzeciwu</strong> — wobec marketingu lub profilowania.</>,
                <><strong className="font-medium text-ink-0">Skargi do PUODO</strong> — Prezes Urzędu Ochrony Danych Osobowych, ul. Stawki 2, Warszawa.</>,
              ]} />
              <P>Wszystkie żądania realizujemy bezpłatnie i w ciągu 14 dni.</P>

              <DocHeading sec="// Sekcja 07"><span id="p7" />Bezpieczeństwo.</DocHeading>
              <P>Stosujemy techniczne i organizacyjne środki ochrony danych: szyfrowanie TLS 1.3 w komunikacji, AES-256 w spoczynku, hasła hashowane bcrypt, 2FA opcjonalne, regularne audyty bezpieczeństwa (ostatni: 03.2026 przez Securitum). W razie incydentu — informujemy w 72h.</P>

              <DocHeading sec="// Sekcja 08"><span id="p8" />Kontakt.</DocHeading>
              <P>Inspektor Ochrony Danych — <Code>iod@obskura.audio</Code>.<br />Wsparcie ogólne — <Code>pomoc@obskura.audio</Code>.<br />Pocztą tradycyjną — OBSKURA Audio sp. z o.o., ul. Stara Stocznia 27, 80-863 Gdańsk.</P>
            </>
          )}

          {tab === "regulamin" && (
            <>
              <Tldr>
                <strong className="font-medium text-ink-0">Płacisz — słuchasz.</strong> Możesz anulować w każdej chwili jednym kliknięciem. 30 dni od zakupu — pełen zwrot bez pytań. Nie udostępniaj konta osobom poza domem. Nie ściągaj naszych odcinków na zewnątrz. Bądź uprzejmy w komentarzach. Reszta jest detalem.
              </Tldr>

              <DocHeading sec="// § 1"><span id="r1" />Definicje.</DocHeading>
              <P>W niniejszym regulaminie używane są następujące pojęcia:</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">OBSKURA</strong> — OBSKURA Audio sp. z o.o., NIP 583-321-09-44.</>,
                <><strong className="font-medium text-ink-0">Platforma</strong> — serwis obskura.audio wraz z aplikacjami mobilnymi.</>,
                <><strong className="font-medium text-ink-0">Użytkownik</strong> — osoba fizyczna posiadająca konto na Platformie.</>,
                <><strong className="font-medium text-ink-0">Treści</strong> — odcinki audio, transkrypty, materiały dodatkowe oferowane przez OBSKURA.</>,
                <><strong className="font-medium text-ink-0">Treści użytkownika</strong> — komentarze, posty na forum, recenzje wprowadzane przez Użytkowników.</>,
                <><strong className="font-medium text-ink-0">Subskrypcja</strong> — odpłatne uprawnienie do dostępu do Treści w wybranym Planie.</>,
              ]} />

              <DocHeading sec="// § 2"><span id="r2" />Konto.</DocHeading>
              <P>Założenie konta jest bezpłatne. Wymaga podania prawidłowego adresu e-mail i ustanowienia hasła. Konto może założyć osoba, która ukończyła <strong className="font-medium text-ink-0">16 lat</strong>. Osoby między 13–16 r.ż. — wyłącznie za zgodą opiekuna prawnego.</P>
              <P>Konto jest osobiste. Współdzielenie loginu / hasła z osobami spoza domu — narusza regulamin. W Planie Klan dopuszczamy do 5 profili rodzinnych.</P>

              <DocHeading sec="// § 3"><span id="r3" />Subskrypcja i plany.</DocHeading>
              <P>OBSKURA oferuje trzy plany: <strong className="font-medium text-ink-0">Próg</strong> (bezpłatny, ograniczony), <strong className="font-medium text-ink-0">Solo</strong> (płatny indywidualny), <strong className="font-medium text-ink-0">Klan</strong> (płatny rodzinny). Szczegóły cen znajdziesz na <Code>obskura.audio/klub</Code>.</P>
              <P>Subskrypcja odnawia się automatycznie do momentu jej anulowania. Anulowania można dokonać w każdej chwili w panelu Konto → Subskrypcja → Anuluj.</P>

              <DocHeading sec="// § 4"><span id="r4" />Płatności.</DocHeading>
              <P>Płatności realizowane są przez <strong className="font-medium text-ink-0">Stripe Payments Europe</strong>. Akceptujemy karty Visa / MasterCard / Amex, BLIK, Przelewy24, Google Pay, Apple Pay.</P>
              <P>Wszystkie ceny zawierają VAT. Faktury wystawiane automatycznie po każdej płatności.</P>

              <DocHeading sec="// § 5"><span id="r5" />Odstąpienie i zwroty.</DocHeading>
              <blockquote className="my-6 border-l-2 border-red bg-red/5 px-5 py-4 font-serif text-lg italic leading-snug text-ink-0">
                W ciągu <strong className="font-medium">30 dni od pierwszej płatności</strong> — pełen zwrot, bez pytań i tłumaczenia.
              </blockquote>
              <P>To więcej niż wymaga ustawa o prawach konsumenta (14 dni).</P>
              <P>Po 30 dniach — zwrot proporcjonalny do niewykorzystanej części okresu. Wniosek: <Code>pomoc@obskura.audio</Code>. Realizacja zwrotu — 7 dni roboczych.</P>

              <DocHeading sec="// § 6"><span id="r6" />Treści użytkowników.</DocHeading>
              <P>Wprowadzając Treści (komentarze, posty na forum, recenzje), Użytkownik:</P>
              <Bullets ordered items={[
                "Oświadcza, że posiada do nich pełne prawa autorskie.",
                "Udziela OBSKURA niewyłącznej licencji na ich wyświetlanie w obrębie Platformy.",
                "Może w każdej chwili je usunąć (cofa wówczas licencję).",
              ]} />
              <P>Zakazane są Treści: zniesławiające, naruszające prawa autorskie, podżegające do przemocy, zawierające spam czy malware. Moderacja działa post-publication w 4h (dzień) lub 12h (noc).</P>

              <DocHeading sec="// § 7"><span id="r7" />Treści OBSKURY.</DocHeading>
              <P>Wszystkie odcinki, transkrypty, materiały graficzne są chronione prawem autorskim. Subskrypcja udziela <strong className="font-medium text-ink-0">licencji niewyłącznej, nieprzekazywalnej</strong>, ograniczonej do osobistego użytku.</P>
              <P>Zabronione jest: pobieranie odcinków poza oficjalną funkcję offline, udostępnianie ich w internecie, wykorzystywanie komercyjne bez pisemnej zgody.</P>
              <P>Krótkie cytaty (do 30 sekund audio lub 100 słów transkryptu) — dozwolone w ramach dozwolonego użytku (art. 29 PrAut).</P>

              <DocHeading sec="// § 8"><span id="r8" />Reklamacje.</DocHeading>
              <P>Reklamacje składamy na <Code>pomoc@obskura.audio</Code>. Termin odpowiedzi — 14 dni. W razie sporu — najpierw mediacja przez UOKiK, w ostateczności sąd właściwy dla siedziby OBSKURY (Gdańsk).</P>
              <P>Dla konsumentów — sąd właściwy dla miejsca zamieszkania Użytkownika.</P>

              <DocHeading sec="// § 9"><span id="r9" />Zmiany regulaminu.</DocHeading>
              <P>O zmianach regulaminu informujemy z <strong className="font-medium text-ink-0">30-dniowym wyprzedzeniem</strong> — e-mailem i banerem. Jeśli nie akceptujesz nowej wersji — masz prawo usunąć konto z pełnym zwrotem niewykorzystanej Subskrypcji.</P>
              <P>Historia wszystkich wersji — pod <Code>obskura.audio/prawne/historia</Code>.</P>
            </>
          )}

          {tab === "cookies" && (
            <>
              <Tldr>
                Używamy <strong className="font-medium text-ink-0">minimum cookies</strong> niezbędnych do działania serwisu (login, koszyk, język). Do statystyk — Plausible (bez identyfikacji, bez third-party cookies). <strong className="font-medium text-ink-0">Bez Google Analytics, bez Facebook Pixela, bez retargetingu.</strong> Reszta — twoja decyzja, ustawisz poniżej.
              </Tldr>

              <DocHeading sec="// Sekcja 01"><span id="c1" />Co to są <em className="italic text-ink-1">cookies</em>.</DocHeading>
              <P>Cookies (ciasteczka) to małe pliki tekstowe, które przeglądarka zapisuje na twoim urządzeniu, gdy odwiedzasz stronę. Pozwalają nam rozpoznać twoje urządzenie przy kolejnej wizycie i zapamiętać ustawienia.</P>
              <P>Cookies <strong className="font-medium text-ink-0">nie zawierają</strong> osobistych informacji w bezpośredniej formie. Nie mogą instalować malware ani odczytywać innych plików z twojego urządzenia.</P>

              <DocHeading sec="// Sekcja 02"><span id="c2" />Jakich cookies <em className="italic text-ink-1">używamy</em>.</DocHeading>
              <DataTable
                head={["Cookie", "Cel", "Czas życia", "Typ"]}
                rows={[
                  [<Code>ob_session</Code>, "Zalogowana sesja", "14 dni", <strong className="font-medium text-ink-0">Niezbędne</strong>],
                  [<Code>ob_csrf</Code>, "Bezpieczeństwo (CSRF)", "Sesja", <strong className="font-medium text-ink-0">Niezbędne</strong>],
                  [<Code>ob_lang</Code>, "Wybrany język", "1 rok", <strong className="font-medium text-ink-0">Niezbędne</strong>],
                  [<Code>ob_player_qual</Code>, "Jakość audio", "1 rok", "Wydajność"],
                  [<Code>ob_player_pos</Code>, "Pozycja odtwarzania", "30 dni", "Wydajność"],
                  [<Code>plausible_id</Code>, "Anonimowa statystyka", "24h", "Analityka"],
                ]}
              />
              <P>To wszystko. Sześć cookies. Trzy obowiązkowe (bez nich logowanie nie działa), trzy opcjonalne (możesz wyłączyć).</P>

              <DocHeading sec="// Sekcja 03"><span id="c3" />Twoje <em className="italic text-ink-1">preferencje</em>.</DocHeading>
              <P>Możesz w każdej chwili zmienić ustawienia. Zapis wchodzi w życie natychmiast.</P>
              <div className="mt-6">
                <ToggleRow required on title="Niezbędne" desc="Logowanie, bezpieczeństwo, podstawowe ustawienia. Bez nich serwis nie działa." />
                <ToggleRow title="Wydajność" desc="Pamiętanie ustawień jakości audio i pozycji odtwarzania." on={cookiePrefs.performance} onToggle={() => setCookiePrefs((p) => ({ ...p, performance: !p.performance }))} />
                <ToggleRow title="Analityka anonimowa (Plausible)" desc="Liczymy ile osób odwiedza strony — bez identyfikacji ciebie. Hosted w EU." on={cookiePrefs.analytics} onToggle={() => setCookiePrefs((p) => ({ ...p, analytics: !p.analytics }))} />
                <ToggleRow title="Marketing" desc="Nie używamy żadnych cookies marketingowych. Ten toggle jest tu, żeby było widać, że nie używamy." on={cookiePrefs.marketing} onToggle={() => setCookiePrefs((p) => ({ ...p, marketing: !p.marketing }))} />
              </div>
              <div className="mt-7 flex flex-wrap gap-3">
                <HorrorButton type="button" onClick={() => setCookiePrefs((p) => p)}>Zapisz preferencje</HorrorButton>
                <HorrorButton type="button" variant="ghost" onClick={() => setCookiePrefs({ analytics: false, performance: false, marketing: false })}>Odrzuć wszystkie opcjonalne</HorrorButton>
              </div>

              <DocHeading sec="// Sekcja 04"><span id="c4" />Wyłączenie <em className="italic text-ink-1">cookies całkowicie</em>.</DocHeading>
              <P>Możesz wyłączyć obsługę cookies w ustawieniach przeglądarki. Pamiętaj, że bez cookies niezbędnych nie będziesz mógł się zalogować.</P>
              <Bullets items={[
                <><strong className="font-medium text-ink-0">Chrome / Edge</strong> — Ustawienia → Prywatność i bezpieczeństwo → Pliki cookie</>,
                <><strong className="font-medium text-ink-0">Firefox</strong> — Preferencje → Prywatność i bezpieczeństwo → Pliki cookie i dane stron</>,
                <><strong className="font-medium text-ink-0">Safari</strong> — Safari → Preferencje → Prywatność</>,
              ]} />
            </>
          )}
        </article>
      </main>
    </>
  );
}
