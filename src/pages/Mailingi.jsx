import { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Mail, ChevronRight } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";

const TEMPLATES = [
  { id: "welcome", label: "Powitalny", purpose: "Po pierwszym logowaniu", freq: "Jednorazowo", tag: "TRANSAKCYJNY" },
  { id: "newsletter", label: "Newsletter", purpose: "Co czwartek o 23:00", freq: "Tygodniowo", tag: "MARKETINGOWY" },
  { id: "premiere", label: "Nowa premiera", purpose: "Gdy nowy odcinek", freq: "Co premierę", tag: "POWIADOMIENIE" },
  { id: "reset", label: "Reset hasła", purpose: "Na żądanie", freq: "Na żądanie", tag: "TRANSAKCYJNY" },
  { id: "invoice", label: "Faktura", purpose: "Po każdej płatności", freq: "Co odnowę", tag: "TRANSAKCYJNY" },
  { id: "security", label: "Alert bezpieczeństwa", purpose: "Nietypowe logowanie", freq: "W razie potrzeby", tag: "KRYTYCZNY" },
  { id: "cancel", label: "Potw. anulowania", purpose: "Po anulowaniu subskrypcji", freq: "Jednorazowo", tag: "TRANSAKCYJNY" },
];

const HEADS = {
  welcome: { from: '"OBSKURA" <witaj@obskura.audio>', subject: (<>Witaj w Obskurze. <em className="italic text-[#6e6a60]">Pierwsze 30 dni — nic nie płacisz.</em></>) },
  newsletter: { from: '"Obskura Listy" <listy@obskura.audio>', subject: (<>#183 · <em className="italic text-[#6e6a60]">Coś chce wrócić</em> — twój dostęp do S03E12 wygasa za 71h</>) },
  premiere: { from: '"OBSKURA" <premiery@obskura.audio>', subject: (<>Nowy odcinek dla ciebie. <em className="italic text-[#6e6a60]">S03E12 · Mgła nad Wisłoujściem</em></>) },
  reset: { from: '"OBSKURA bezpieczeństwo" <noreply@obskura.audio>', subject: (<>Reset hasła — <em className="italic text-[#6e6a60]">link wygasa za 30 minut</em></>) },
  invoice: { from: '"OBSKURA Płatności" <faktury@obskura.audio>', subject: (<>Faktura VAT FV/2026/05/0847 · <em className="italic text-[#6e6a60]">288,00 PLN</em></>) },
  security: { from: '"OBSKURA Alert" <alert@obskura.audio>', subject: (<>⚠ Nietypowe logowanie z <em className="italic text-[#6e6a60]">Berlin · 25.05.2026 · 14:23</em></>) },
  cancel: { from: '"OBSKURA" <witaj@obskura.audio>', subject: (<>Anulowanie potwierdzone. <em className="italic text-[#6e6a60]">Brakuje nam ciebie już teraz.</em></>) },
};

// Bloki ciała maila (dark, branded) — wspólne style.
function MailH1({ children }) {
  return <h1 className="mb-4 font-serif text-[36px] font-medium leading-[1.05] tracking-[-0.01em] text-[#f4f1ea]">{children}</h1>;
}
MailH1.propTypes = { children: PropTypes.node.isRequired };

function MailH2({ children }) {
  return <h2 className="mb-3 mt-7 font-serif text-[22px] font-medium leading-tight text-[#f4f1ea]">{children}</h2>;
}
MailH2.propTypes = { children: PropTypes.node.isRequired };

function MailP({ children, drop = false }) {
  return (
    <p className={`mb-3.5 text-sm font-light leading-relaxed text-[#c9c4b8] ${drop ? "[&::first-letter]:float-left [&::first-letter]:mr-3 [&::first-letter]:mt-1 [&::first-letter]:font-serif [&::first-letter]:text-[60px] [&::first-letter]:italic [&::first-letter]:leading-[0.85] [&::first-letter]:text-[#ff2a2a]" : ""}`}>
      {children}
    </p>
  );
}
MailP.propTypes = { children: PropTypes.node.isRequired, drop: PropTypes.bool };

function MailCta({ children }) {
  return (
    <span className="my-4 inline-block bg-[#ff2a2a] px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white">
      {children}
    </span>
  );
}
MailCta.propTypes = { children: PropTypes.node.isRequired };

function MailCard({ img, pos, ep, t1, em, meta }) {
  return (
    <div className="my-6 grid grid-cols-[80px_1fr] items-center gap-4 border border-red/20 bg-bg-2/60 p-5">
      <div className="h-20 w-20 bg-cover" style={{ backgroundImage: `url('${img}')`, backgroundPosition: pos }} />
      <div>
        <div className="mb-1 font-mono text-[10px] tracking-mono text-[#ff2a2a]">{ep}</div>
        <div className="mb-1 font-serif text-[22px] leading-tight text-[#f4f1ea]">{t1} <em className="italic text-[#c9c4b8]">{em}</em></div>
        <div className="font-mono text-[11px] uppercase tracking-ui text-[#6e6a60]">{meta}</div>
      </div>
    </div>
  );
}
MailCard.propTypes = {
  img: PropTypes.string.isRequired, pos: PropTypes.string, ep: PropTypes.string.isRequired,
  t1: PropTypes.string.isRequired, em: PropTypes.string.isRequired, meta: PropTypes.string.isRequired,
};

function MailAlert({ accent = "amber", title, children }) {
  const border = accent === "red" ? "border-l-[#ff2a2a]" : "border-l-[#ffaa44]";
  const bg = accent === "red" ? "bg-red/5" : "bg-[#ffaa44]/[0.05]";
  const head = accent === "red" ? "text-[#ff2a2a]" : "text-[#ffaa44]";
  return (
    <div className={`my-5 border-l-2 ${border} ${bg} px-5 py-4`}>
      <h5 className={`mb-1.5 font-mono text-[10px] uppercase tracking-mono ${head}`}>{title}</h5>
      <p className="text-[13px] leading-snug text-[#c9c4b8]">{children}</p>
    </div>
  );
}
MailAlert.propTypes = { accent: PropTypes.oneOf(["amber", "red"]), title: PropTypes.string.isRequired, children: PropTypes.node.isRequired };

function MailInvoice({ rows }) {
  return (
    <div className="my-6 border border-white/[0.08] bg-black/40 p-6 font-mono text-xs leading-relaxed text-[#c9c4b8]">
      {rows.map((r, i) => (
        <div key={i} className={`flex justify-between py-1 ${r.total ? "mt-2 border-t border-white/[0.08] pt-2 text-sm text-[#f4f1ea]" : ""} ${r.sep ? "mt-3 border-t border-white/[0.08] pt-2" : ""}`}>
          <span>{r.k}</span>
          <span className={r.total ? "font-semibold text-[#ff2a2a]" : r.green ? "font-semibold text-[#00ff88]" : ""}>{r.v}</span>
        </div>
      ))}
    </div>
  );
}
MailInvoice.propTypes = { rows: PropTypes.array.isRequired };

function MailSig({ who, role }) {
  return (
    <div className="mt-9 border-t border-white/[0.08] pt-6 font-serif text-sm italic text-[#c9c4b8]">
      {role ? "Do usłyszenia," : "Bywaj,"}<br />
      <span className="text-base text-[#f4f1ea]">— {who}</span><br />
      reżyserka, OBSKURA
    </div>
  );
}
MailSig.propTypes = { who: PropTypes.string.isRequired, role: PropTypes.bool };

function MailBody({ tpl }) {
  return (
    <>
      {tpl === "welcome" && (
        <>
          <div className="relative h-[200px] overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_60%,rgba(10,13,18,0.95))]">
            <img src="/images/dada.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div className="px-9 pb-12 pt-9">
            <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Pierwszy mail · konto aktywne</div>
            <MailH1>Witaj w <em className="italic text-[#c9c4b8]">Obskurze</em>, Nokturn_47.</MailH1>
            <MailP drop>Trafiłeś w dobre miejsce. Tutaj nagrywamy historie, które słucha się na słuchawkach, w nocy, w ciszy mieszkania. 147 odcinków czeka. Pierwszy ci wybraliśmy.</MailP>
            <MailP>Konto <strong className="font-medium text-[#f4f1ea]">aktywne</strong>. Pierwsze 30 dni planu Solo — gratis. Po tym czasie automatycznie przedłużamy do roku za 288 zł — ale możesz anulować w każdej chwili.</MailP>
            <MailCard img="/images/img-hallway.webp" pos="center" ep="S03 · E11 · Wybrane dla ciebie" t1="Ostatnie" em="Światło" meta="52:08 · ★ 4.9 · Psychological" />
            <MailCta>Posłuchaj pierwszego odcinka →</MailCta>
            <MailH2>Co dalej?</MailH2>
            <ul className="mb-4 list-disc pl-5">
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">Załóż słuchawki</strong> — dźwięk binauralny działa tylko na nich.</li>
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">Zgaś światło</strong> — nasze odcinki są zaprojektowane na ciemność.</li>
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">Sprawdź ustawienia</strong> — pora powiadomień, jakość audio, tryb anonimowy.</li>
            </ul>
            <MailSig who="Marta Sobczak" role />
          </div>
        </>
      )}

      {tpl === "newsletter" && (
        <div className="px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Wydanie #183 · czwartek 23:00</div>
          <MailH1>Coś <em className="italic text-[#c9c4b8]">chce wrócić</em>.</MailH1>
          <MailP drop>W zeszłą środę zamknęliśmy się w studiu z Katarzyną Wieczorek na sześć godzin. Nie wyszliśmy zadowoleni. Dziś rano wyszliśmy z czymś, co działa. Słuchasz tego pierwszy — link wygasa za 71 godzin.</MailP>
          <MailCard img="/images/monster.webp" pos="center 25%" ep="S03 · E12 · Wygasa w 71h" t1="Mgła nad" em="Wisłoujściem" meta="47:12 · Binaural · K. Wieczorek" />
          <MailCta>Słuchaj 72 godziny wcześniej →</MailCta>
          <MailH2>Z <em className="italic text-[#c9c4b8]">notatek reżyserskich</em></MailH2>
          <MailP>Wycięliśmy z S03E12 całą scenę w piwnicy. Marta opisała dlaczego — to wstrząsające 700 słów o tym, dlaczego cisza wygrywa z każdym efektem.</MailP>
          <MailH2>Z <em className="italic text-[#c9c4b8]">tekstów członków</em></MailH2>
          <MailP>Konkurs majowy „Napisz pierwszą scenę Pacjentki 23 w 500 słów” wygrała <strong className="font-medium text-[#f4f1ea]">Z. Kowalewicz</strong>. Czytamy jej tekst w pełni w tym mailu.</MailP>
          <MailH2>Z <em className="italic text-[#c9c4b8]">archiwum</em></MailH2>
          <MailP>Trzy lata temu premierowy odcinek „Pierwsze mleko” miał 38 minut. Dziś średnia długość to 56 minut. Co się stało? Krótki tekst od Jakuba.</MailP>
          <p className="mt-8 font-serif italic text-[#6e6a60]">Do czwartku,<br />— Redakcja</p>
        </div>
      )}

      {tpl === "premiere" && (
        <>
          <div className="relative h-[200px] overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_60%,rgba(10,13,18,0.95))]">
            <img src="/images/monster.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[center_25%]" />
          </div>
          <div className="px-9 pb-12 pt-9">
            <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Premiera · dziś 23:00 · tylko twój</div>
            <MailH1>Nowy odcinek <em className="italic text-[#c9c4b8]">czeka</em>.</MailH1>
            <MailP>Trzeci sezon dobiega końca finałem nagrywanym przez nas <strong className="font-medium text-[#f4f1ea]">14 miesięcy</strong>. Premiera dla Klubu Solo — 72 godziny przed publicznym wydaniem.</MailP>
            <MailCard img="/images/dada.webp" pos="center 30%" ep="S03 · E12 · Finał sezonu" t1="Mgła nad" em="Wisłoujściem" meta="47:12 · Cosmic dread · 18+ · Binaural 3D" />
            <MailCta>▶ Słuchaj teraz</MailCta>
            <MailH2>O <em className="italic text-[#c9c4b8]">czym jest</em></MailH2>
            <MailP>Reporterka wraca do rodzinnego portu po 23 latach. Plan: napisać reportaż o zaginięciach z 1968 roku. Zostaje na jedną noc. Tej jednej nocy wystarczy.</MailP>
            <MailAlert title="// Content warning">Opisy utonięcia, talasofobia, intensywne dźwięki infradźwięku (17.8 Hz). Nie zalecane dla osób z lękiem przed głęboką wodą.</MailAlert>
            <MailP>Zwiastun: 2:14 min · <span className="text-[#ff2a2a]">Posłuchaj zwiastuna →</span></MailP>
          </div>
        </>
      )}

      {tpl === "reset" && (
        <div className="px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Bezpieczeństwo · link jednorazowy</div>
          <MailH1>Resetujesz <em className="italic text-[#c9c4b8]">hasło</em>.</MailH1>
          <MailP>Ktoś (mamy nadzieję, że ty) poprosił o reset hasła do twojego konta OBSKURA. <strong className="font-medium text-[#f4f1ea]">Jeśli to nie ty</strong> — zignoruj ten e-mail, twoje hasło pozostanie bez zmian.</MailP>
          <MailCta>Zresetuj hasło →</MailCta>
          <p className="text-xs text-[#6e6a60]">Lub skopiuj ten link do przeglądarki:</p>
          <p className="break-all bg-black/40 p-3 font-mono text-[11px] text-[#5fa8ff]">https://obskura.audio/reset?token=k8f7d3a92b4c8e1f5a7d3a92b4c8e1f5a7d3a92b4c8e1f</p>
          <MailAlert title="// Ważne">Link wygasa za <strong className="text-[#f4f1ea]">30 minut</strong> (06.06.2026 · 14:53 CET). Po tym czasie musisz poprosić o nowy link.</MailAlert>
          <MailH2>Czego <em className="italic text-[#c9c4b8]">od ciebie nigdy</em> nie poprosimy</MailH2>
          <ul className="mb-4 list-disc pl-5">
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">O hasło przez e-mail, czat lub telefon</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">O dane karty kredytowej poza stroną płatności Stripe</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">O zalogowanie się przez link inny niż na <strong className="font-medium text-[#f4f1ea]">obskura.audio</strong></li>
          </ul>
          <p className="mt-6 text-xs text-[#6e6a60]">Próba pochodziła z: Warszawa · PL · IP 5.184.x.x · Safari na macOS · 06.06.2026 · 14:23 CET</p>
        </div>
      )}

      {tpl === "invoice" && (
        <div className="px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Faktura VAT · obowiązuje przez 5 lat (ustawa)</div>
          <MailH1>Dziękujemy <em className="italic text-[#c9c4b8]">za płatność</em>.</MailH1>
          <MailP>Subskrypcja Solo (roczna) odnowiona automatycznie. Wszystko działa, dostęp nieprzerwany. Faktura w załączniku — i poniżej do podglądu.</MailP>
          <MailInvoice rows={[
            { k: "NUMER FAKTURY", v: "FV/2026/05/0847" },
            { k: "DATA WYSTAWIENIA", v: "14.05.2026" },
            { k: "DATA PŁATNOŚCI", v: "14.05.2026 · 03:14 CET" },
            { k: "METODA", v: "VISA •••• 4137" },
            { k: "USŁUGA", v: "OBSKURA SOLO · ROCZNIE", sep: true },
            { k: "NETTO", v: "266,67 PLN" },
            { k: "VAT (8%)", v: "21,33 PLN" },
            { k: "RAZEM BRUTTO", v: "288,00 PLN", total: true },
          ]} />
          <MailCta>↓ Pobierz fakturę PDF</MailCta>
          <MailH2>Jak <em className="italic text-[#c9c4b8]">anulować</em></MailH2>
          <MailP>Konto → Subskrypcja → Anuluj. Jedno kliknięcie. Dostęp pozostaje aktywny do końca opłaconego okresu (do <strong className="font-medium text-[#f4f1ea]">14.05.2027</strong>). Bez ekranów „jesteś pewien?”.</MailP>
          <p className="text-xs text-[#6e6a60]">OBSKURA Audio sp. z o.o. · NIP 583-321-09-44 · ul. Stara Stocznia 27, 80-863 Gdańsk</p>
        </div>
      )}

      {tpl === "security" && (
        <div className="px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ffaa44]">// Alert · wymaga twojej uwagi</div>
          <MailH1>Ktoś próbował <em className="italic text-[#c9c4b8]">cię odwiedzić</em>.</MailH1>
          <MailP>Wczoraj o <strong className="font-medium text-[#f4f1ea]">14:23 CET</strong> wykonano nietypowe logowanie do twojego konta. Próba została <strong className="font-medium text-[#00ff88]">zablokowana</strong> przez nasz system, ale chcemy, żebyś wiedział.</MailP>
          <MailInvoice rows={[
            { k: "LOKALIZACJA", v: "Berlin · DE" },
            { k: "IP", v: "46.183.x.x" },
            { k: "URZĄDZENIE", v: "Windows · Chrome 124" },
            { k: "CZAS", v: "25.05.2026 · 14:23:08 CET" },
            { k: "STATUS", v: "● ZABLOKOWANE", green: true, sep: true },
          ]} />
          <MailH2>Co <em className="italic text-[#c9c4b8]">powinieneś zrobić</em></MailH2>
          <MailP>Jeśli to <strong className="font-medium text-[#f4f1ea]">byłeś ty</strong> (np. podróżujesz, VPN) — zignoruj ten mail.</MailP>
          <MailP>Jeśli to <strong className="font-medium text-[#f4f1ea]">nie ty</strong> — natychmiast zmień hasło i sprawdź aktywne sesje.</MailP>
          <MailCta>Zmień hasło teraz →</MailCta>
          <MailAlert accent="red" title="// Jeśli masz wątpliwości">Skontaktuj się z nami: <strong className="text-[#f4f1ea]">pomoc@obskura.audio</strong>. Odpowiadamy w 4h, w nocy w 12h.</MailAlert>
        </div>
      )}

      {tpl === "cancel" && (
        <div className="px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">// Anulowanie potwierdzone</div>
          <MailH1>Twoja subskrypcja <em className="italic text-[#c9c4b8]">została anulowana</em>.</MailH1>
          <MailP drop>To smutna wiadomość, ale szanujemy decyzję. Twój dostęp do całego katalogu pozostaje <strong className="font-medium text-[#f4f1ea]">aktywny do 14.05.2027</strong>. Po tym czasie wracasz na plan Próg (20 odcinków / miesiąc, z reklamami).</MailP>
          <MailH2>Co <em className="italic text-[#c9c4b8]">teraz</em></MailH2>
          <ul className="mb-4 list-disc pl-5">
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">Nadal masz pełen dostęp do <strong className="font-medium text-[#f4f1ea]">14.05.2027</strong></li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">Twoje konto, dane, historia słuchania — pozostają nietknięte</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">Pobrane odcinki offline znikną z aplikacji po wygaśnięciu</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">Twoje komentarze i polubienia — zostają</li>
          </ul>
          <MailH2>Jeśli to <em className="italic text-[#c9c4b8]">pomyłka</em></MailH2>
          <MailP>Możesz wrócić w każdej chwili. Anulowanie cofa się jednym kliknięciem — nie pytamy o powody.</MailP>
          <MailCta>Cofnij anulowanie →</MailCta>
          <MailH2>Powiedz <em className="italic text-[#c9c4b8]">dlaczego</em>?</MailH2>
          <MailP>Jeśli chcesz, w 30 sekundach odpowiedz nam na 3 pytania. Po prostu chcemy wiedzieć — żeby być lepsi.</MailP>
          <p className="text-center"><span className="font-mono text-xs uppercase tracking-ui text-[#5fa8ff]">30-sekundowa ankieta (anonimowa) →</span></p>
          <MailSig who="Marta Sobczak" />
        </div>
      )}
    </>
  );
}
MailBody.propTypes = { tpl: PropTypes.string.isRequired };

function Email({ tpl }) {
  const h = HEADS[tpl];
  const [name, addr] = h.from.split("<");
  return (
    <>
      {/* Light mail header */}
      <div className="grid grid-cols-[80px_1fr] items-center gap-x-6 gap-y-3.5 bg-[#f4f1ea] px-6 py-6 text-[#050608] sm:grid-cols-[100px_1fr_auto] sm:px-8">
        <span className="font-mono text-[10px] uppercase tracking-mono text-[#6e6a60]">Od</span>
        <span className="text-[13px]"><strong className="font-semibold">{name.trim()}</strong><br /><span className="text-[#6e6a60]">{addr?.replace(">", "")}</span></span>
        <span className="hidden font-mono text-[10px] uppercase tracking-ui text-[#6e6a60] sm:block">↩ ↪ ⌄</span>
        <span className="font-mono text-[10px] uppercase tracking-mono text-[#6e6a60]">Do</span>
        <span className="text-[13px] sm:col-span-2">ty@email.com</span>
        <div className="col-span-2 mt-1.5 font-serif text-[28px] leading-snug text-[#050608] sm:col-span-3">{h.subject}</div>
      </div>

      {/* Dark branded body */}
      <div className="bg-[#050608]">
        <div className="mx-auto max-w-[600px] bg-bg-1">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-8 py-6">
            <span className="relative h-[18px] w-[18px] rounded-full border-[1.5px] border-[#ff2a2a] after:absolute after:inset-[5px] after:rounded-full after:bg-[#ff2a2a]" />
            <span className="font-sans text-sm font-extrabold tracking-brand text-[#f4f1ea]">OBSKURA</span>
          </div>
          <MailBody tpl={tpl} />
          <div className="border-t border-white/[0.08] bg-[#050608] px-8 py-7">
            <div className="mb-3 space-x-4 font-mono text-[10px] tracking-ui">
              <a href="#footer" className="text-[#c9c4b8]">Zarządzaj subskrypcjami</a>
              <a href="#footer" className="text-[#c9c4b8]">Wypisz się</a>
              <a href="#footer" className="text-[#c9c4b8]">Pomoc</a>
              <a href="#footer" className="text-[#c9c4b8]">Polityka prywatności</a>
            </div>
            <p className="font-mono text-[10px] leading-relaxed tracking-ui text-[#6e6a60]">
              OBSKURA Audio sp. z o.o. · NIP 583-321-09-44<br />
              ul. Stara Stocznia 27 · 80-863 Gdańsk · POLSKA<br />
              © 2021–2026 · Wszystkie głosy zastrzeżone
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
Email.propTypes = { tpl: PropTypes.string.isRequired };

function SideBlock({ title, children, accent = false }) {
  return (
    <div className={`border p-5 ${accent ? "border-red/30 bg-red/[0.04]" : "border-line bg-bg-2/50"}`}>
      <h5 className={`mb-3.5 border-b border-line pb-2.5 font-mono text-[10px] uppercase tracking-mono ${accent ? "text-red" : "text-ink-2"}`}>{title}</h5>
      {children}
    </div>
  );
}
SideBlock.propTypes = { title: PropTypes.string.isRequired, children: PropTypes.node.isRequired, accent: PropTypes.bool };

function KV({ k, v, color }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-xs">
      <span className="font-mono text-[10px] uppercase tracking-ui text-ink-2">{k}</span>
      <span className={`text-right font-serif text-sm italic text-ink-0 ${color || ""}`}>{v}</span>
    </div>
  );
}
KV.propTypes = { k: PropTypes.string.isRequired, v: PropTypes.node.isRequired, color: PropTypes.string };

export default function Mailingi() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("welcome");
  const tpl = TEMPLATES.find((x) => x.id === tab);
  const idx = TEMPLATES.findIndex((x) => x.id === tab);

  const tagColor = tpl.tag === "KRYTYCZNY" ? "text-red" : tpl.tag === "MARKETINGOWY" ? "text-blue" : "text-ink-0";
  const metrics = {
    sent: tab === "newsletter" ? "47 832" : tab === "premiere" ? "12 047" : "847",
    open: tab === "newsletter" ? "68%" : tab === "security" ? "94%" : "72%",
    click: tab === "newsletter" ? "34%" : tab === "premiere" ? "52%" : "18%",
    unsub: tab === "newsletter" ? "42 / mies." : "—",
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>{t("mailingi.eyebrow", "// Szablony e-mail · Postmark · GDPR")}</Eyebrow>
            <h1 className="my-4 font-serif text-[clamp(48px,6vw,80px)] font-medium leading-[0.95] tracking-[-0.02em]">
              Wszystkie wiadomości, <em className="italic text-ink-1">które kiedykolwiek od nas dostaniesz</em>.
            </h1>
            <p className="max-w-[560px] text-base font-light leading-relaxed text-ink-1">
              7 szablonów, jeden wspólny styl, jedna paleta. Maksymalnie 1 e-mail dziennie (poza rzeczami transakcyjnymi). Każda wiadomość ma link „wypisz się” jednym kliknięciem.
            </p>
          </div>
          <div className="flex flex-wrap gap-9 pt-4">
            {[["7", "Aktywnych szablonów", true], ["47 800", "Subskrybentów"], ["0%", "Spam reports"], ["68%", "Open rate"]].map(([n, l, red], i) => (
              <div key={i}>
                <div className={`font-serif text-3xl font-medium leading-none ${red ? "text-red" : ""}`}>{n}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-[68px] z-40 border-b border-line bg-bg-1/85 px-5 backdrop-blur-xl lg:px-12">
        <div className="mx-auto flex max-w-[1400px] overflow-x-auto">
          {TEMPLATES.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => setTab(x.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-5 py-4 font-mono text-[11px] uppercase tracking-mono transition-colors ${
                tab === x.id ? "border-red text-red" : "border-transparent text-ink-2 hover:text-ink-0"
              }`}
            >
              <span className={`text-[10px] ${tab === x.id ? "text-red/60" : "text-ink-3"}`}>// {String(i + 1).padStart(2, "0")}</span>
              {x.label}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div className="mx-auto mt-14 grid max-w-[1400px] grid-cols-1 items-start gap-10 px-5 pb-24 lg:grid-cols-[1fr_300px] lg:px-12">
        {/* Mailbox mockup */}
        <div className="overflow-hidden border border-line bg-[#f4f1ea] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-3 border-b border-black/[0.08] bg-[#e8e3d4] px-4 py-3 font-mono text-[11px] tracking-ui text-[#6e6a60]">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
              <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
              <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
            </div>
            <span className="hidden flex-1 truncate text-center opacity-70 sm:block">postmark.app/preview · OBSKURA · 04.06.2026 23:00</span>
            <span className="ml-auto flex items-center gap-1.5"><Mail size={12} aria-hidden /> 14:23 PM · CET</span>
          </div>
          <Email tpl={tab} />
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <SideBlock title="// Metadane szablonu">
            <KV k="ID" v={`EMAIL-${String(idx + 1).padStart(3, "0")}`} />
            <KV k="Typ" v={<span className={`not-italic font-mono text-[11px] font-semibold tracking-ui ${tagColor}`}>{tpl.tag}</span>} />
            <KV k="Częstotliwość" v={tpl.freq} />
            <KV k="Wyzwalacz" v={tpl.purpose} />
            <KV k="Status" v={<span className="not-italic font-mono text-[11px] tracking-ui text-[#00ff88]">● Aktywny</span>} />
            <KV k="Wersja" v="4.2.1" />
            <KV k="Ostatnia edycja" v="23.04.2026" />
          </SideBlock>

          <SideBlock title="// Metryki · ostatnie 30 dni">
            <KV k="Wysłane" v={metrics.sent} />
            <KV k="Open rate" v={<span className="not-italic font-sans font-semibold text-red">{metrics.open}</span>} />
            <KV k="Click rate" v={metrics.click} />
            <KV k="Spam reports" v={<span className="not-italic font-mono text-[11px] tracking-ui text-[#00ff88]">0</span>} />
            <KV k="Bounce" v="0.3%" />
            <KV k="Unsub po tym" v={metrics.unsub} />
          </SideBlock>

          <SideBlock title="// Tagi">
            <div className="flex flex-wrap gap-1.5">
              {["PL/EN", "Responsive", "Dark mode", "GDPR", "Unsub 1-click", "Plain-text fallback"].map((tg) => (
                <span key={tg} className="border border-red/30 bg-red/5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono text-red">{tg}</span>
              ))}
            </div>
          </SideBlock>

          <SideBlock title="// Zasady" accent>
            <p className="text-xs font-light leading-relaxed text-ink-1">
              Max <strong className="font-medium text-ink-0">1 mail / dzień</strong> per user (poza transakcyjnymi).<br />
              <strong className="font-medium text-ink-0">0 dark patterns</strong> przy wypisaniu.<br />
              <strong className="font-medium text-ink-0">Bez śledzenia</strong> klików w marketingowych.<br />
              Każdy mail = plain-text fallback dla czytników. <ChevronRight size={11} className="inline text-red" aria-hidden />
            </p>
          </SideBlock>
        </aside>
      </div>
    </>
  );
}
