import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { Mail, ChevronRight } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";

// Bloki ciała maila (dark, branded) — wspólne style.
function MailH1({ children }) {
  return <h1 className="mb-4 font-serif text-[28px] sm:text-[36px] font-medium leading-[1.05] tracking-[-0.01em] text-[#f4f1ea]">{children}</h1>;
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
    <span className="my-4 inline-block w-full sm:w-auto text-center bg-[#ff2a2a] px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-white">
      {children}
    </span>
  );
}
MailCta.propTypes = { children: PropTypes.node.isRequired };

function MailCard({ img, pos, ep, t1, em, meta }) {
  return (
    <div className="my-6 grid grid-cols-[64px_1fr] sm:grid-cols-[80px_1fr] items-center gap-4 border border-red/20 bg-bg-2/60 p-5">
      <div className="h-16 w-16 sm:h-20 sm:w-20 bg-cover" style={{ backgroundImage: `url('${img}')`, backgroundPosition: pos }} />
      <div>
        <div className="mb-1 font-mono text-[10px] tracking-mono text-[#ff2a2a]">{ep}</div>
        <div className="mb-1 font-serif text-[22px] leading-tight text-[#f4f1ea]">{t1} <em className="italic text-[#c9c4b8]">{em}</em></div>
        <div className="font-mono text-[11px] uppercase tracking-ui text-[#6e6a60] break-words">{meta}</div>
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
    <div className="my-6 border border-white/[0.08] bg-black/40 p-4 sm:p-6 font-mono text-xs leading-relaxed text-[#c9c4b8]">
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

function MailSig({ who, role, t }) {
  return (
    <div className="mt-9 border-t border-white/[0.08] pt-6 font-serif text-sm italic text-[#c9c4b8]">
      {role ? t("mailingi.sig_role", "Do usłyszenia,") : t("mailingi.sig_default", "Bywaj,")}<br />
      <span className="text-base text-[#f4f1ea]">— {who}</span><br />
      {t("mailingi.sig_company", "reżyserka, OBSKURA")}
    </div>
  );
}
MailSig.propTypes = { who: PropTypes.string.isRequired, role: PropTypes.bool, t: PropTypes.func.isRequired };

function MailBody({ tpl, t }) {
  return (
    <>
      {tpl === "welcome" && (
        <>
          <div className="relative h-[200px] overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_60%,rgba(10,13,18,0.95))]">
            <img src="/images/dada.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          </div>
          <div className="px-5 sm:px-9 pb-12 pt-9">
            <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.welcome_kicker", "// Pierwszy mail · konto aktywne")}</div>
            <MailH1>{t("mailingi.welcome_h1_p1", "Witaj w")} <em className="italic text-[#c9c4b8]">{t("mailingi.welcome_h1_em", "Obskurze")}</em>{t("mailingi.welcome_h1_p2", ", Nokturn_47.")}</MailH1>
            <MailP drop>{t("mailingi.welcome_p1", "Trafiłeś w dobre miejsce. Tutaj nagrywamy historie, które słucha się na słuchawkach, w nocy, w ciszy mieszkania. 147 odcinków czeka. Pierwszy ci wybraliśmy.")}</MailP>
            <MailP>{t("mailingi.welcome_p2_p1", "Konto")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.welcome_p2_strong", "aktywne")}</strong>. {t("mailingi.welcome_p2_p2", "Pierwsze 30 dni planu Solo — gratis. Po tym czasie automatycznie przedłużamy do roku za 288 zł — ale możesz anulować w każdej chwili.")}</MailP>
            <MailCard img="/images/img-hallway.webp" pos="center" ep={t("mailingi.welcome_card_ep", "S03 · E11 · Wybrane dla ciebie")} t1={t("mailingi.welcome_card_t1", "Ostatnie")} em={t("mailingi.welcome_card_em", "Światło")} meta={t("mailingi.welcome_card_meta", "52:08 · ★ 4.9 · Psychological")} />
            <MailCta>{t("mailingi.welcome_cta", "Posłuchaj pierwszego odcinka →")}</MailCta>
            <MailH2>{t("mailingi.welcome_h2", "Co dalej?")}</MailH2>
            <ul className="mb-4 list-disc pl-5">
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">{t("mailingi.welcome_step1_b", "Załóż słuchawki")}</strong> {t("mailingi.welcome_step1_t", "— dźwięk binauralny działa tylko na nich.")}</li>
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">{t("mailingi.welcome_step2_b", "Zgaś światło")}</strong> {t("mailingi.welcome_step2_t", "— nasze odcinki są zaprojektowane na ciemność.")}</li>
              <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]"><strong className="font-medium text-[#f4f1ea]">{t("mailingi.welcome_step3_b", "Sprawdź ustawienia")}</strong> {t("mailingi.welcome_step3_t", "— pora powiadomień, jakość audio, tryb anonimowy.")}</li>
            </ul>
            <MailSig who="Marta Sobczak" role t={t} />
          </div>
        </>
      )}

      {tpl === "newsletter" && (
        <div className="px-5 sm:px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.newsletter_kicker", "// Wydanie #183 · czwartek 23:00")}</div>
          <MailH1>{t("mailingi.newsletter_h1_p1", "Coś")} <em className="italic text-[#c9c4b8]">{t("mailingi.newsletter_h1_em", "chce wrócić")}</em>.</MailH1>
          <MailP drop>{t("mailingi.newsletter_p1", "W zeszłą środę zamknęliśmy się w studiu z Katarzyną Wieczorek na sześć godzin. Nie wyszliśmy zadowoleni. Dziś rano wyszliśmy z czymś, co działa. Słuchasz tego pierwszy — link wygasa za 71 godzin.")}</MailP>
          <MailCard img="/images/monster.webp" pos="center 25%" ep={t("mailingi.newsletter_card_ep", "S03 · E12 · Wygasa w 71h")} t1={t("mailingi.newsletter_card_t1", "Mgła nad")} em={t("mailingi.newsletter_card_em", "Wisłoujściem")} meta={t("mailingi.newsletter_card_meta", "47:12 · Binaural · K. Wieczorek")} />
          <MailCta>{t("mailingi.newsletter_cta", "Słuchaj 72 godziny wcześniej →")}</MailCta>
          <MailH2>{t("mailingi.newsletter_h2a_p1", "Z")} <em className="italic text-[#c9c4b8]">{t("mailingi.newsletter_h2a_em", "notatek reżyserskich")}</em></MailH2>
          <MailP>{t("mailingi.newsletter_p2", "Wycięliśmy z S03E12 całą scenę w piwnicy. Marta opisała dlaczego — to wstrząsające 700 słów o tym, dlaczego cisza wygrywa z każdym efektem.")}</MailP>
          <MailH2>{t("mailingi.newsletter_h2b_p1", "Z")} <em className="italic text-[#c9c4b8]">{t("mailingi.newsletter_h2b_em", "tekstów członków")}</em></MailH2>
          <MailP>{t("mailingi.newsletter_p3_p1", "Konkurs majowy „Napisz pierwszą scenę Pacjentki 23 w 500 słów” wygrała")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.newsletter_p3_strong", "Z. Kowalewicz")}</strong>. {t("mailingi.newsletter_p3_p2", "Czytamy jej tekst w pełni w tym mailu.")}</MailP>
          <MailH2>{t("mailingi.newsletter_h2c_p1", "Z")} <em className="italic text-[#c9c4b8]">{t("mailingi.newsletter_h2c_em", "archiwum")}</em></MailH2>
          <MailP>{t("mailingi.newsletter_p4", "Trzy lata temu premierowy odcinek „Pierwsze mleko” miał 38 minut. Dziś średnia długość to 56 minut. Co się stało? Krótki tekst od Jakuba.")}</MailP>
          <p className="mt-8 font-serif italic text-[#6e6a60]">{t("mailingi.newsletter_outro", "Do czwartku,")}<br />{t("mailingi.newsletter_signature", "— Redakcja")}</p>
        </div>
      )}

      {tpl === "premiere" && (
        <>
          <div className="relative h-[200px] overflow-hidden after:absolute after:inset-0 after:bg-[linear-gradient(180deg,transparent_60%,rgba(10,13,18,0.95))]">
            <img src="/images/monster.webp" alt="" loading="lazy" decoding="async" className="h-full w-full object-cover object-[center_25%]" />
          </div>
          <div className="px-5 sm:px-9 pb-12 pt-9">
            <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.premiere_kicker", "// Premiera · dziś 23:00 · tylko twój")}</div>
            <MailH1>{t("mailingi.premiere_h1_p1", "Nowy odcinek")} <em className="italic text-[#c9c4b8]">{t("mailingi.premiere_h1_em", "czeka")}</em>.</MailH1>
            <MailP>{t("mailingi.premiere_p1_p1", "Trzeci sezon dobiega końca finałem nagrywanym przez nas")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.premiere_p1_strong", "14 miesięcy")}</strong>. {t("mailingi.premiere_p1_p2", "Premiera dla Klubu Solo — 72 godziny przed publicznym wydaniem.")}</MailP>
            <MailCard img="/images/dada.webp" pos="center 30%" ep={t("mailingi.premiere_card_ep", "S03 · E12 · Finał sezonu")} t1={t("mailingi.premiere_card_t1", "Mgła nad")} em={t("mailingi.premiere_card_em", "Wisłoujściem")} meta={t("mailingi.premiere_card_meta", "47:12 · Cosmic dread · 18+ · Binaural 3D")} />
            <MailCta>{t("mailingi.premiere_cta", "▶ Słuchaj teraz")}</MailCta>
            <MailH2>{t("mailingi.premiere_h2_p1", "O")} <em className="italic text-[#c9c4b8]">{t("mailingi.premiere_h2_em", "czym jest")}</em></MailH2>
            <MailP>{t("mailingi.premiere_p2", "Reporterka wraca do rodzinnego portu po 23 latach. Plan: napisać reportaż o zaginięciach z 1968 roku. Zostaje na jedną noc. Tej jednej nocy wystarczy.")}</MailP>
            <MailAlert title={t("mailingi.premiere_alert_title", "// Content warning")}>{t("mailingi.premiere_alert_body", "Opisy utonięcia, talasofobia, intensywne dźwięki infradźwięku (17.8 Hz). Nie zalecane dla osób z lękiem przed głęboką wodą.")}</MailAlert>
            <MailP>{t("mailingi.premiere_p3_p1", "Zwiastun: 2:14 min ·")} <span className="text-[#ff2a2a]">{t("mailingi.premiere_p3_link", "Posłuchaj zwiastuna →")}</span></MailP>
          </div>
        </>
      )}

      {tpl === "reset" && (
        <div className="px-5 sm:px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.reset_kicker", "// Bezpieczeństwo · link jednorazowy")}</div>
          <MailH1>{t("mailingi.reset_h1_p1", "Resetujesz")} <em className="italic text-[#c9c4b8]">{t("mailingi.reset_h1_em", "hasło")}</em>.</MailH1>
          <MailP>{t("mailingi.reset_p1_p1", "Ktoś (mamy nadzieję, że ty) poprosił o reset hasła do twojego konta OBSKURA.")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.reset_p1_strong", "Jeśli to nie ty")}</strong> {t("mailingi.reset_p1_p2", "— zignoruj ten e-mail, twoje hasło pozostanie bez zmian.")}</MailP>
          <MailCta>{t("mailingi.reset_cta", "Zresetuj hasło →")}</MailCta>
          <p className="text-xs text-[#6e6a60]">{t("mailingi.reset_link_label", "Lub skopiuj ten link do przeglądarki:")}</p>
          <p className="break-all bg-black/40 p-3 font-mono text-[11px] text-[#5fa8ff]">https://obskura.audio/reset?token=k8f7d3a92b4c8e1f5a7d3a92b4c8e1f5a7d3a92b4c8e1f</p>
          <MailAlert title={t("mailingi.reset_alert_title", "// Ważne")}>{t("mailingi.reset_alert_p1", "Link wygasa za")} <strong className="text-[#f4f1ea]">{t("mailingi.reset_alert_strong", "30 minut")}</strong> {t("mailingi.reset_alert_p2", "(06.06.2026 · 14:53 CET). Po tym czasie musisz poprosić o nowy link.")}</MailAlert>
          <MailH2>{t("mailingi.reset_h2_p1", "Czego")} <em className="italic text-[#c9c4b8]">{t("mailingi.reset_h2_em", "od ciebie nigdy")}</em> {t("mailingi.reset_h2_p2", "nie poprosimy")}</MailH2>
          <ul className="mb-4 list-disc pl-5">
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.reset_never_1", "O hasło przez e-mail, czat lub telefon")}</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.reset_never_2", "O dane karty kredytowej poza stroną płatności Stripe")}</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.reset_never_3_p1", "O zalogowanie się przez link inny niż na")} <strong className="font-medium text-[#f4f1ea]">obskura.audio</strong></li>
          </ul>
          <p className="mt-6 text-xs text-[#6e6a60]">{t("mailingi.reset_origin", "Próba pochodziła z: Warszawa · PL · IP 5.184.x.x · Safari na macOS · 06.06.2026 · 14:23 CET")}</p>
        </div>
      )}

      {tpl === "invoice" && (
        <div className="px-5 sm:px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.invoice_kicker", "// Faktura VAT · obowiązuje przez 5 lat (ustawa)")}</div>
          <MailH1>{t("mailingi.invoice_h1_p1", "Dziękujemy")} <em className="italic text-[#c9c4b8]">{t("mailingi.invoice_h1_em", "za płatność")}</em>.</MailH1>
          <MailP>{t("mailingi.invoice_p1", "Subskrypcja Solo (roczna) odnowiona automatycznie. Wszystko działa, dostęp nieprzerwany. Faktura w załączniku — i poniżej do podglądu.")}</MailP>
          <MailInvoice rows={[
            { k: t("mailingi.invoice_row_number", "NUMER FAKTURY"), v: "FV/2026/05/0847" },
            { k: t("mailingi.invoice_row_issued", "DATA WYSTAWIENIA"), v: "14.05.2026" },
            { k: t("mailingi.invoice_row_paid", "DATA PŁATNOŚCI"), v: "14.05.2026 · 03:14 CET" },
            { k: t("mailingi.invoice_row_method", "METODA"), v: "VISA •••• 4137" },
            { k: t("mailingi.invoice_row_service", "USŁUGA"), v: t("mailingi.invoice_row_service_val", "OBSKURA SOLO · ROCZNIE"), sep: true },
            { k: t("mailingi.invoice_row_net", "NETTO"), v: "266,67 PLN" },
            { k: t("mailingi.invoice_row_vat", "VAT (8%)"), v: "21,33 PLN" },
            { k: t("mailingi.invoice_row_total", "RAZEM BRUTTO"), v: "288,00 PLN", total: true },
          ]} />
          <MailCta>{t("mailingi.invoice_cta", "↓ Pobierz fakturę PDF")}</MailCta>
          <MailH2>{t("mailingi.invoice_h2_p1", "Jak")} <em className="italic text-[#c9c4b8]">{t("mailingi.invoice_h2_em", "anulować")}</em></MailH2>
          <MailP>{t("mailingi.invoice_p2_p1", "Konto → Subskrypcja → Anuluj. Jedno kliknięcie. Dostęp pozostaje aktywny do końca opłaconego okresu (do")} <strong className="font-medium text-[#f4f1ea]">14.05.2027</strong>{t("mailingi.invoice_p2_p2", "). Bez ekranów „jesteś pewien?”.")}</MailP>
          <p className="text-xs text-[#6e6a60]">{t("mailingi.invoice_footer", "OBSKURA Audio sp. z o.o. · NIP 583-321-09-44 · ul. Stara Stocznia 27, 80-863 Gdańsk")}</p>
        </div>
      )}

      {tpl === "security" && (
        <div className="px-5 sm:px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ffaa44]">{t("mailingi.security_kicker", "// Alert · wymaga twojej uwagi")}</div>
          <MailH1>{t("mailingi.security_h1_p1", "Ktoś próbował")} <em className="italic text-[#c9c4b8]">{t("mailingi.security_h1_em", "cię odwiedzić")}</em>.</MailH1>
          <MailP>{t("mailingi.security_p1_p1", "Wczoraj o")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.security_p1_strong1", "14:23 CET")}</strong> {t("mailingi.security_p1_p2", "wykonano nietypowe logowanie do twojego konta. Próba została")} <strong className="font-medium text-[#00ff88]">{t("mailingi.security_p1_strong2", "zablokowana")}</strong> {t("mailingi.security_p1_p3", "przez nasz system, ale chcemy, żebyś wiedział.")}</MailP>
          <MailInvoice rows={[
            { k: t("mailingi.security_row_location", "LOKALIZACJA"), v: "Berlin · DE" },
            { k: t("mailingi.security_row_ip", "IP"), v: "46.183.x.x" },
            { k: t("mailingi.security_row_device", "URZĄDZENIE"), v: "Windows · Chrome 124" },
            { k: t("mailingi.security_row_time", "CZAS"), v: "25.05.2026 · 14:23:08 CET" },
            { k: t("mailingi.security_row_status", "STATUS"), v: t("mailingi.security_row_status_val", "● ZABLOKOWANE"), green: true, sep: true },
          ]} />
          <MailH2>{t("mailingi.security_h2_p1", "Co")} <em className="italic text-[#c9c4b8]">{t("mailingi.security_h2_em", "powinieneś zrobić")}</em></MailH2>
          <MailP>{t("mailingi.security_p2_p1", "Jeśli to")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.security_p2_strong", "byłeś ty")}</strong> {t("mailingi.security_p2_p2", "(np. podróżujesz, VPN) — zignoruj ten mail.")}</MailP>
          <MailP>{t("mailingi.security_p3_p1", "Jeśli to")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.security_p3_strong", "nie ty")}</strong> {t("mailingi.security_p3_p2", "— natychmiast zmień hasło i sprawdź aktywne sesje.")}</MailP>
          <MailCta>{t("mailingi.security_cta", "Zmień hasło teraz →")}</MailCta>
          <MailAlert accent="red" title={t("mailingi.security_alert_title", "// Jeśli masz wątpliwości")}>{t("mailingi.security_alert_p1", "Skontaktuj się z nami:")} <strong className="text-[#f4f1ea]">pomoc@obskura.audio</strong>. {t("mailingi.security_alert_p2", "Odpowiadamy w 4h, w nocy w 12h.")}</MailAlert>
        </div>
      )}

      {tpl === "cancel" && (
        <div className="px-5 sm:px-9 pb-12 pt-9">
          <div className="mb-3.5 font-mono text-[10px] uppercase tracking-eyebrow text-[#ff2a2a]">{t("mailingi.cancel_kicker", "// Anulowanie potwierdzone")}</div>
          <MailH1>{t("mailingi.cancel_h1_p1", "Twoja subskrypcja")} <em className="italic text-[#c9c4b8]">{t("mailingi.cancel_h1_em", "została anulowana")}</em>.</MailH1>
          <MailP drop>{t("mailingi.cancel_p1_p1", "To smutna wiadomość, ale szanujemy decyzję. Twój dostęp do całego katalogu pozostaje")} <strong className="font-medium text-[#f4f1ea]">{t("mailingi.cancel_p1_strong", "aktywny do 14.05.2027")}</strong>. {t("mailingi.cancel_p1_p2", "Po tym czasie wracasz na plan Próg (20 odcinków / miesiąc, z reklamami).")}</MailP>
          <MailH2>{t("mailingi.cancel_h2a_p1", "Co")} <em className="italic text-[#c9c4b8]">{t("mailingi.cancel_h2a_em", "teraz")}</em></MailH2>
          <ul className="mb-4 list-disc pl-5">
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.cancel_li1_p1", "Nadal masz pełen dostęp do")} <strong className="font-medium text-[#f4f1ea]">14.05.2027</strong></li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.cancel_li2", "Twoje konto, dane, historia słuchania — pozostają nietknięte")}</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.cancel_li3", "Pobrane odcinki offline znikną z aplikacji po wygaśnięciu")}</li>
            <li className="mb-1.5 text-sm font-light leading-relaxed text-[#c9c4b8]">{t("mailingi.cancel_li4", "Twoje komentarze i polubienia — zostają")}</li>
          </ul>
          <MailH2>{t("mailingi.cancel_h2b_p1", "Jeśli to")} <em className="italic text-[#c9c4b8]">{t("mailingi.cancel_h2b_em", "pomyłka")}</em></MailH2>
          <MailP>{t("mailingi.cancel_p2", "Możesz wrócić w każdej chwili. Anulowanie cofa się jednym kliknięciem — nie pytamy o powody.")}</MailP>
          <MailCta>{t("mailingi.cancel_cta", "Cofnij anulowanie →")}</MailCta>
          <MailH2>{t("mailingi.cancel_h2c_p1", "Powiedz")} <em className="italic text-[#c9c4b8]">{t("mailingi.cancel_h2c_em", "dlaczego")}</em>?</MailH2>
          <MailP>{t("mailingi.cancel_p3", "Jeśli chcesz, w 30 sekundach odpowiedz nam na 3 pytania. Po prostu chcemy wiedzieć — żeby być lepsi.")}</MailP>
          <p className="text-center"><span className="font-mono text-xs uppercase tracking-ui text-[#5fa8ff]">{t("mailingi.cancel_survey", "30-sekundowa ankieta (anonimowa) →")}</span></p>
          <MailSig who="Marta Sobczak" t={t} />
        </div>
      )}
    </>
  );
}
MailBody.propTypes = { tpl: PropTypes.string.isRequired, t: PropTypes.func.isRequired };

function Email({ tpl, heads, t }) {
  const h = heads[tpl];
  const [name, addr] = h.from.split("<");
  return (
    <>
      <div className="grid grid-cols-[80px_1fr] items-center gap-x-6 gap-y-3.5 bg-[#f4f1ea] px-6 py-6 text-[#050608] sm:grid-cols-[100px_1fr_auto] sm:px-8">
        <span className="font-mono text-[10px] uppercase tracking-mono text-[#6e6a60]">{t("mailingi.email_from", "Od")}</span>
        <span className="text-[13px]"><strong className="font-semibold">{name.trim()}</strong><br /><span className="text-[#6e6a60]">{addr?.replace(">", "")}</span></span>
        <span className="hidden font-mono text-[10px] uppercase tracking-ui text-[#6e6a60] sm:block">↩ ↪ ⌄</span>
        <span className="font-mono text-[10px] uppercase tracking-mono text-[#6e6a60]">{t("mailingi.email_to", "Do")}</span>
        <span className="text-[13px] sm:col-span-2">{t("mailingi.email_recipient", "ty@email.com")}</span>
        <div className="col-span-2 mt-1.5 font-serif text-[22px] sm:text-[28px] leading-snug text-[#050608] sm:col-span-3">{h.subject}</div>
      </div>

      <div className="bg-[#050608]">
        <div className="mx-auto max-w-[600px] bg-bg-1">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-5 sm:px-8 py-6">
            <span className="relative h-[18px] w-[18px] rounded-full border-[1.5px] border-[#ff2a2a] after:absolute after:inset-[5px] after:rounded-full after:bg-[#ff2a2a]" />
            <span className="font-sans text-sm font-extrabold tracking-brand text-[#f4f1ea]">OBSKURA</span>
          </div>
          <MailBody tpl={tpl} t={t} />
          <div className="border-t border-white/[0.08] bg-[#050608] px-5 sm:px-8 py-7">
            <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-ui">
              <a href="#footer" className="inline-block py-2 text-[#c9c4b8]">{t("mailingi.footer_subs", "Zarządzaj subskrypcjami")}</a>
              <a href="#footer" className="inline-block py-2 text-[#c9c4b8]">{t("mailingi.footer_unsub", "Wypisz się")}</a>
              <a href="#footer" className="inline-block py-2 text-[#c9c4b8]">{t("mailingi.footer_help", "Pomoc")}</a>
              <a href="#footer" className="inline-block py-2 text-[#c9c4b8]">{t("mailingi.footer_privacy", "Polityka prywatności")}</a>
            </div>
            <p className="font-mono text-[10px] leading-relaxed tracking-ui text-[#6e6a60]">
              {t("mailingi.footer_company", "OBSKURA Audio sp. z o.o. · NIP 583-321-09-44")}<br />
              {t("mailingi.footer_address", "ul. Stara Stocznia 27 · 80-863 Gdańsk · POLSKA")}<br />
              {t("mailingi.footer_rights", "© 2021–2026 · Wszystkie głosy zastrzeżone")}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
Email.propTypes = { tpl: PropTypes.string.isRequired, heads: PropTypes.object.isRequired, t: PropTypes.func.isRequired };

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

export default function Mailings() {
  const { t } = useTranslation();
  const [tab, setTab] = useState("welcome");

  const TEMPLATES = useMemo(() => [
    { id: "welcome", label: t("mailingi.tpl_welcome_label", "Powitalny"), purpose: t("mailingi.tpl_welcome_purpose", "Po pierwszym logowaniu"), freq: t("mailingi.freq_once", "Jednorazowo"), tag: t("mailingi.tag_transactional", "TRANSAKCYJNY") },
    { id: "newsletter", label: t("mailingi.tpl_newsletter_label", "Newsletter"), purpose: t("mailingi.tpl_newsletter_purpose", "Co czwartek o 23:00"), freq: t("mailingi.freq_weekly", "Tygodniowo"), tag: t("mailingi.tag_marketing", "MARKETINGOWY") },
    { id: "premiere", label: t("mailingi.tpl_premiere_label", "Nowa premiera"), purpose: t("mailingi.tpl_premiere_purpose", "Gdy nowy odcinek"), freq: t("mailingi.freq_per_release", "Co premierę"), tag: t("mailingi.tag_notification", "POWIADOMIENIE") },
    { id: "reset", label: t("mailingi.tpl_reset_label", "Reset hasła"), purpose: t("mailingi.tpl_reset_purpose", "Na żądanie"), freq: t("mailingi.freq_on_demand", "Na żądanie"), tag: t("mailingi.tag_transactional", "TRANSAKCYJNY") },
    { id: "invoice", label: t("mailingi.tpl_invoice_label", "Faktura"), purpose: t("mailingi.tpl_invoice_purpose", "Po każdej płatności"), freq: t("mailingi.freq_per_renewal", "Co odnowę"), tag: t("mailingi.tag_transactional", "TRANSAKCYJNY") },
    { id: "security", label: t("mailingi.tpl_security_label", "Alert bezpieczeństwa"), purpose: t("mailingi.tpl_security_purpose", "Nietypowe logowanie"), freq: t("mailingi.freq_as_needed", "W razie potrzeby"), tag: t("mailingi.tag_critical", "KRYTYCZNY") },
    { id: "cancel", label: t("mailingi.tpl_cancel_label", "Potw. anulowania"), purpose: t("mailingi.tpl_cancel_purpose", "Po anulowaniu subskrypcji"), freq: t("mailingi.freq_once", "Jednorazowo"), tag: t("mailingi.tag_transactional", "TRANSAKCYJNY") },
  ], [t]);

  const HEADS = useMemo(() => ({
    welcome: { from: '"OBSKURA" <witaj@obskura.audio>', subject: (<>{t("mailingi.subj_welcome_p1", "Witaj w Obskurze.")} <em className="italic text-[#6e6a60]">{t("mailingi.subj_welcome_em", "Pierwsze 30 dni — nic nie płacisz.")}</em></>) },
    newsletter: { from: '"Obskura Listy" <listy@obskura.audio>', subject: (<>#183 · <em className="italic text-[#6e6a60]">{t("mailingi.subj_newsletter_em", "Coś chce wrócić")}</em> {t("mailingi.subj_newsletter_p", "— twój dostęp do S03E12 wygasa za 71h")}</>) },
    premiere: { from: '"OBSKURA" <premiery@obskura.audio>', subject: (<>{t("mailingi.subj_premiere_p1", "Nowy odcinek dla ciebie.")} <em className="italic text-[#6e6a60]">{t("mailingi.subj_premiere_em", "S03E12 · Mgła nad Wisłoujściem")}</em></>) },
    reset: { from: `"${t("mailingi.from_reset", "OBSKURA bezpieczeństwo")}" <noreply@obskura.audio>`, subject: (<>{t("mailingi.subj_reset_p1", "Reset hasła —")} <em className="italic text-[#6e6a60]">{t("mailingi.subj_reset_em", "link wygasa za 30 minut")}</em></>) },
    invoice: { from: `"${t("mailingi.from_invoice", "OBSKURA Płatności")}" <faktury@obskura.audio>`, subject: (<>{t("mailingi.subj_invoice_p1", "Faktura VAT FV/2026/05/0847 ·")} <em className="italic text-[#6e6a60]">288,00 PLN</em></>) },
    security: { from: '"OBSKURA Alert" <alert@obskura.audio>', subject: (<>{t("mailingi.subj_security_p1", "⚠ Nietypowe logowanie z")} <em className="italic text-[#6e6a60]">{t("mailingi.subj_security_em", "Berlin · 25.05.2026 · 14:23")}</em></>) },
    cancel: { from: '"OBSKURA" <witaj@obskura.audio>', subject: (<>{t("mailingi.subj_cancel_p1", "Anulowanie potwierdzone.")} <em className="italic text-[#6e6a60]">{t("mailingi.subj_cancel_em", "Brakuje nam ciebie już teraz.")}</em></>) },
  }), [t]);

  const tpl = TEMPLATES.find((x) => x.id === tab);
  const idx = TEMPLATES.findIndex((x) => x.id === tab);

  const KRYTYCZNY = t("mailingi.tag_critical", "KRYTYCZNY");
  const MARKETINGOWY = t("mailingi.tag_marketing", "MARKETINGOWY");
  const tagColor = tpl.tag === KRYTYCZNY ? "text-red" : tpl.tag === MARKETINGOWY ? "text-blue" : "text-ink-0";
  const metrics = {
    sent: tab === "newsletter" ? "47 832" : tab === "premiere" ? "12 047" : "847",
    open: tab === "newsletter" ? "68%" : tab === "security" ? "94%" : "72%",
    click: tab === "newsletter" ? "34%" : tab === "premiere" ? "52%" : "18%",
    unsub: tab === "newsletter" ? t("mailingi.metric_unsub_monthly", "42 / mies.") : "—",
  };

  const headerStats = [
    ["7", t("mailingi.hstat_active", "Aktywnych szablonów"), true],
    ["47 800", t("mailingi.hstat_subs", "Subskrybentów"), false],
    ["0%", t("mailingi.hstat_spam", "Spam reports"), false],
    ["68%", t("mailingi.hstat_open", "Open rate"), false],
  ];

  return (
    <>
      <header className="border-b border-line px-5 pb-10 pt-[130px] lg:px-12">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 items-end gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
          <div>
            <Eyebrow>{t("mailingi.eyebrow", "// Szablony e-mail · Postmark · GDPR")}</Eyebrow>
            <h1 className="my-4 font-serif text-[clamp(48px,6vw,80px)] font-medium leading-[0.95] tracking-[-0.02em]">
              {t("mailingi.hero_h1_p1", "Wszystkie wiadomości,")} <em className="italic text-ink-1">{t("mailingi.hero_h1_em", "które kiedykolwiek od nas dostaniesz")}</em>.
            </h1>
            <p className="max-w-[560px] text-base font-light leading-relaxed text-ink-1">
              {t("mailingi.hero_lead", "7 szablonów, jeden wspólny styl, jedna paleta. Maksymalnie 1 e-mail dziennie (poza rzeczami transakcyjnymi). Każda wiadomość ma link „wypisz się” jednym kliknięciem.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-9 pt-4">
            {headerStats.map(([n, l, red], i) => (
              <div key={i}>
                <div className={`font-serif text-3xl font-medium leading-none ${red ? "text-red" : ""}`}>{n}</div>
                <div className="mt-1.5 font-mono text-[9px] uppercase tracking-mono text-ink-2">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="sticky top-[68px] z-40 border-b border-line bg-bg-1/85 px-5 backdrop-blur-xl lg:px-12">
        <div className="relative mx-auto max-w-[1400px] after:pointer-events-none after:absolute after:right-0 after:top-0 after:h-full after:w-10 after:bg-gradient-to-l after:from-bg-1 after:to-transparent lg:after:hidden">
        <div className="flex overflow-x-auto">
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
      </div>

      <div className="mx-auto mt-14 grid max-w-[1400px] grid-cols-1 items-start gap-10 px-5 pb-24 lg:grid-cols-[1fr_300px] lg:px-12">
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
          <Email tpl={tab} heads={HEADS} t={t} />
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-28">
          <SideBlock title={t("mailingi.side_meta", "// Metadane szablonu")}>
            <KV k="ID" v={`EMAIL-${String(idx + 1).padStart(3, "0")}`} />
            <KV k={t("mailingi.side_kv_type", "Typ")} v={<span className={`not-italic font-mono text-[11px] font-semibold tracking-ui ${tagColor}`}>{tpl.tag}</span>} />
            <KV k={t("mailingi.side_kv_freq", "Częstotliwość")} v={tpl.freq} />
            <KV k={t("mailingi.side_kv_trigger", "Wyzwalacz")} v={tpl.purpose} />
            <KV k={t("mailingi.side_kv_status", "Status")} v={<span className="not-italic font-mono text-[11px] tracking-ui text-[#00ff88]">{t("mailingi.side_kv_status_val", "● Aktywny")}</span>} />
            <KV k={t("mailingi.side_kv_version", "Wersja")} v="4.2.1" />
            <KV k={t("mailingi.side_kv_last_edit", "Ostatnia edycja")} v="23.04.2026" />
          </SideBlock>

          <SideBlock title={t("mailingi.side_metrics", "// Metryki · ostatnie 30 dni")}>
            <KV k={t("mailingi.metric_sent", "Wysłane")} v={metrics.sent} />
            <KV k={t("mailingi.metric_open", "Open rate")} v={<span className="not-italic font-sans font-semibold text-red">{metrics.open}</span>} />
            <KV k={t("mailingi.metric_click", "Click rate")} v={metrics.click} />
            <KV k={t("mailingi.metric_spam", "Spam reports")} v={<span className="not-italic font-mono text-[11px] tracking-ui text-[#00ff88]">0</span>} />
            <KV k={t("mailingi.metric_bounce", "Bounce")} v="0.3%" />
            <KV k={t("mailingi.metric_unsub", "Unsub po tym")} v={metrics.unsub} />
          </SideBlock>

          <SideBlock title={t("mailingi.side_tags", "// Tagi")}>
            <div className="flex flex-wrap gap-1.5">
              {["PL/EN", t("mailingi.tag_responsive", "Responsive"), t("mailingi.tag_dark_mode", "Dark mode"), "GDPR", t("mailingi.tag_unsub", "Unsub 1-click"), t("mailingi.tag_fallback", "Plain-text fallback")].map((tg) => (
                <span key={tg} className="border border-red/30 bg-red/5 px-2.5 py-1 font-mono text-[9px] uppercase tracking-mono text-red">{tg}</span>
              ))}
            </div>
          </SideBlock>

          <SideBlock title={t("mailingi.side_rules", "// Zasady")} accent>
            <p className="text-xs font-light leading-relaxed text-ink-1">
              {t("mailingi.rules_max_p1", "Max")} <strong className="font-medium text-ink-0">{t("mailingi.rules_max_strong", "1 mail / dzień")}</strong> {t("mailingi.rules_max_p2", "per user (poza transakcyjnymi).")}<br />
              <strong className="font-medium text-ink-0">{t("mailingi.rules_dark_strong", "0 dark patterns")}</strong> {t("mailingi.rules_dark_t", "przy wypisaniu.")}<br />
              <strong className="font-medium text-ink-0">{t("mailingi.rules_track_strong", "Bez śledzenia")}</strong> {t("mailingi.rules_track_t", "klików w marketingowych.")}<br />
              {t("mailingi.rules_fallback", "Każdy mail = plain-text fallback dla czytników.")} <ChevronRight size={11} className="inline text-red" aria-hidden />
            </p>
          </SideBlock>
        </aside>
      </div>
    </>
  );
}
