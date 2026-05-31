import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";
import { submitContact } from "../lib/apiClient";
import { contactSchema, flattenErrors } from "../lib/formSchemas";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

const LABEL = "font-mono text-[10px] uppercase tracking-mono text-ink-2";

export default function Support() {
  const { t } = useTranslation();

  const systems = [
    { label: t("wsparcie.sys_streaming", "Streaming audio"), value: "OPERATIONAL · 99.99%", warn: false },
    { label: t("wsparcie.sys_mobile", "Aplikacja mobilna"), value: "OPERATIONAL · 100%", warn: false },
    { label: t("wsparcie.sys_payments", "Płatności"), value: "OPERATIONAL · 100%", warn: false },
    { label: t("wsparcie.sys_accounts", "Konta & rejestracja"), value: "DEGRADED · 12 min temu", warn: true },
    { label: t("wsparcie.sys_api", "API dla partnerów"), value: "OPERATIONAL · 100%", warn: false },
  ];

  const quickLinks = [
    {
      href: "#faq",
      h1: t("wsparcie.quick1_h1", "FAQ &"),
      em: t("wsparcie.quick1_em", "poradniki"),
      desc: t("wsparcie.quick1_desc", "34 pytania, 12 poradników. Większość spraw rozwiążesz tutaj w minutę."),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="9" r="7" />
          <path d="M9 13v.5M9 5a2 2 0 0 1 1.5 3.5L9 10v1" />
        </svg>
      ),
    },
    {
      href: "#kontakt",
      h1: t("wsparcie.quick2_h1", "Kontakt"),
      em: t("wsparcie.quick2_em", "z nami"),
      desc: t("wsparcie.quick2_desc", "E-mail, czat, Discord. Średni czas odpowiedzi: 3h 47min."),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4 H16 V14 H2 Z M2 4 L9 10 L16 4" />
        </svg>
      ),
    },
    {
      href: "#kontakt",
      h1: t("wsparcie.quick3_h1", "Subskrypcja"),
      em: t("wsparcie.quick3_em", "i płatności"),
      desc: t("wsparcie.quick3_desc", "Zarządzaj planem, zmień metodę płatności, anuluj jednym kliknięciem."),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="12" height="12" />
          <path d="M3 7 H15 M7 3 V15" />
        </svg>
      ),
    },
    {
      href: "#kontakt",
      h1: t("wsparcie.quick4_h1", "Konto i"),
      em: t("wsparcie.quick4_em", "prywatność"),
      desc: t("wsparcie.quick4_desc", "Eksport danych, dwustopniowa weryfikacja, usuwanie konta — wszystko po stronie użytkownika."),
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="9" cy="6" r="3" />
          <path d="M3 16 C3 12 6 10 9 10 C12 10 15 12 15 16" />
        </svg>
      ),
    },
  ];

  const cats = [
    { id: "all", label: t("wsparcie.cat_all", "Wszystkie") },
    { id: "tech", label: t("wsparcie.cat_tech", "Techniczne") },
    { id: "pay", label: t("wsparcie.cat_pay", "Płatności") },
    { id: "konto", label: t("wsparcie.cat_konto", "Konto") },
    { id: "tresc", label: t("wsparcie.cat_tresc", "Treść") },
  ];

  const faqs = [
    {
      cat: "tech",
      q: t("wsparcie.faq1_q", "Dźwięk zacina się / spada jakość w środku odcinka. Co robić?"),
      a: t("wsparcie.faq1_a", "Najczęściej to słaba sieć. Spróbuj pobrać odcinek w aplikacji do offline (ikona ↓ obok tytułu). Jeśli słuchasz na komputerze, sprawdź w ustawieniach jakość 320 kbps i wyłącz „Adaptive”. Jeżeli problem trwa po przełączeniu na sieć komórkową — daj nam znać, sprawdzimy CDN twojego regionu."),
    },
    {
      cat: "tech",
      q: t("wsparcie.faq2_q", "Dźwięk 3D / binauralny nie działa — słyszę zwykłe stereo."),
      a: t("wsparcie.faq2_a", "Dźwięk binauralny działa wyłącznie na słuchawkach. Na głośnikach efekt zanika. Jeśli używasz słuchawek i wciąż słyszysz zwykłe stereo: w ustawieniach iOS wyłącz Spatial Audio (Apple), a w Androidzie Dolby Atmos — one „nadpisują” nasz mix."),
    },
    {
      cat: "tech",
      q: t("wsparcie.faq3_q", "Aplikacja zawiesza się przy uruchomieniu."),
      a: t("wsparcie.faq3_a", "Wersja 4.2.1 (iOS) i 4.1.8 (Android) zawierały błąd przy starcie po nocnej synchronizacji. Update do 4.2.3+ naprawia. Jeśli nie możesz zaktualizować — wymuszone zamknięcie + ponowne uruchomienie zwykle wystarczy."),
    },
    {
      cat: "pay",
      q: t("wsparcie.faq4_q", "Jak anulować subskrypcję?"),
      a: t("wsparcie.faq4_a", "Wejdź w Konto → Subskrypcja → Anuluj. Jedno kliknięcie. Nie pytamy „jesteś pewien?”. Nie pokazujemy ekranów z prośbą o zostanie. Dostęp masz do końca opłaconego okresu."),
    },
    {
      cat: "pay",
      q: t("wsparcie.faq5_q", "Czy mogę dostać zwrot za niewykorzystany okres?"),
      a: t("wsparcie.faq5_a", "Tak. W ciągu pierwszych 30 dni od pierwszej płatności — pełen zwrot, bez pytań. Po tym czasie — proporcjonalnie do wykorzystanego czasu (zwracamy resztę). Napisz na pomoc@obskura.audio."),
    },
    {
      cat: "pay",
      q: t("wsparcie.faq6_q", "Jakie metody płatności akceptujecie?"),
      a: t("wsparcie.faq6_a", "Karty (Visa, MC, Amex), BLIK, Przelewy24, Google Pay, Apple Pay. Nie przyjmujemy kryptowalut. Faktury VAT wystawiamy automatycznie po każdej płatności (PDF w mailu i w Koncie)."),
    },
    {
      cat: "konto",
      q: t("wsparcie.faq7_q", "Zapomniałem hasła. Jak je zresetować?"),
      a: t("wsparcie.faq7_a", "Na ekranie logowania kliknij „Zapomniałem hasła”. Link resetujący wygasa po 30 minutach (bezpieczeństwo). Jeśli e-mail nie przychodzi w 5 minut — sprawdź SPAM, a potem napisz do nas."),
    },
    {
      cat: "konto",
      q: t("wsparcie.faq8_q", "Czy mogę używać jednego konta na kilku urządzeniach?"),
      a: t("wsparcie.faq8_a", "Tak. Plan Solo obsługuje 2 urządzenia jednocześnie, plan Klan — 6 urządzeń i 5 profili (z osobnymi historiami słuchania). Możesz słuchać na telefonie, laptopie, głośniku Sonos i w samochodzie naraz."),
    },
    {
      cat: "konto",
      q: t("wsparcie.faq9_q", "Jak usunąć konto?"),
      a: t("wsparcie.faq9_a", "Konto → Prywatność → Usuń konto. Eksport wszystkich danych w ZIP-ie dostajesz mailem przed usunięciem. Po 30 dniach (okres karencji) konto jest nieodwracalnie usunięte z naszych baz, włącznie z backupami."),
    },
    {
      cat: "tresc",
      q: t("wsparcie.faq10_q", "Czy historie są oparte na faktach?"),
      a: t("wsparcie.faq10_a", "Niektóre — oznaczamy je tagiem TRUE HORROR. Większość to fikcja, ale często inspirowana doniesieniami prasowymi lub dokumentami. Każdy odcinek ma przypisany rodzaj („oryginalna fikcja”, „inspirowane faktami”, „dokument”)."),
    },
    {
      cat: "tresc",
      q: t("wsparcie.faq11_q", "Jak zostać narratorem / twórcą na Obskurze?"),
      a: t("wsparcie.faq11_a", "Przyjmujemy zgłoszenia raz na kwartał. Zobacz stronę Twórcy — tam jest formularz. Wymagamy próbki audio (5–10 min) i krótkiego opisu, co chcesz opowiedzieć. Odpowiadamy każdemu."),
    },
    {
      cat: "tresc",
      q: t("wsparcie.faq12_q", "Mam pomysł na historię. Czy mogę go wam wysłać?"),
      a: t("wsparcie.faq12_a", "Tak — używamy zewnętrznej skrzynki pomysly@obskura.audio z osobnym regulaminem (chroni cię i nas prawnie). Czytamy każdy, ale odpowiadamy tylko, kiedy zaczynamy pracę nad konkretnym pomysłem (max 1–2 razy w roku)."),
    },
  ];

  const channels = [
    { tag: t("wsparcie.ch1_tag", "E-MAIL"), val: "pomoc@obskura.audio", meta: t("wsparcie.ch1_meta", "~ 3h ODPOWIEDZI"), live: false },
    { tag: t("wsparcie.ch2_tag", "CZAT NA ŻYWO"), val: "23:00 – 03:00 CET", meta: t("wsparcie.ch2_meta", "● TERAZ ONLINE"), live: true },
    { tag: t("wsparcie.ch3_tag", "DISCORD"), val: "obskura.audio/discord", meta: t("wsparcie.ch3_meta", "4 200 OSÓB"), live: false },
    { tag: t("wsparcie.ch4_tag", "PRASA"), val: "media@obskura.audio", meta: t("wsparcie.ch4_meta", "M. SOBCZAK"), live: false },
    { tag: t("wsparcie.ch5_tag", "DOTKLIWE WARUNKI"), val: "911 / 112", meta: t("wsparcie.ch5_meta", "NIE JESTEŚMY LINIĄ ZAUFANIA"), live: false },
  ];

  const [cat, setCat] = useState("all");
  const [open, setOpen] = useState(0);
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", category: "Problem techniczny — odtwarzanie", message: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const updField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const list = cat === "all" ? faqs : faqs.filter((f) => f.cat === cat);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    const parsed = contactSchema.safeParse(form);
    if (!parsed.success) { setErrors(flattenErrors(parsed.error)); return; }
    setLoading(true);
    try {
      await submitContact(parsed.data);
      setSent(true);
    } catch (err) {
      setServerError(err.message || "Nie udało się wysłać. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="relative overflow-hidden px-5 pb-12 pt-[88px] lg:px-12 lg:pb-16 lg:pt-[120px]">
        <div className="mx-auto grid max-w-[1400px] items-end gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>{t("wsparcie.hero_eyebrow", "// CENTRUM POMOCY · ODPOWIADAMY W < 4H")}</Eyebrow>
            <h1 className="my-4 font-serif text-[clamp(40px,6vw,88px)] font-medium leading-[0.95] tracking-[-0.02em] lg:my-5">
              {t("wsparcie.hero_title_p1", "Coś nie")} <em className="italic text-ink-1">{t("wsparcie.hero_title_em", "działa")}</em>?
              <br />
              {t("wsparcie.hero_title_p2", "Pomożemy.")}
            </h1>
            <p className="text-[15px] font-light leading-relaxed text-ink-1 lg:max-w-[540px] lg:text-[17px]">
              {t("wsparcie.hero_lead", "Jeśli dźwięk zacina się w 23. minucie, jeśli twój znajomy nie może aktywować zaproszenia, albo jeśli po prostu chcesz coś powiedzieć — jesteśmy. Czytamy każdą wiadomość.")}
            </p>
          </div>

          <div id="kontakt" className="relative border border-line bg-bg-1/70 p-5 backdrop-blur-md sm:p-7">
            <span className="absolute inset-x-0 top-[-1px] h-px bg-[linear-gradient(90deg,transparent,rgba(0,255,136,0.5),transparent)]" />
            <h3 className="mb-1 font-serif text-2xl font-medium">
              {t("wsparcie.status_h_p1", "Wszystkie systemy")} <span className="italic text-[#00ff88]">{t("wsparcie.status_h_em", "aktywne")}</span>.
            </h3>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-mono text-ink-2">// LIVE · 26.05.2026 · 23:14:08</div>
            {systems.map((s) => (
              <div key={s.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line py-3 last:border-b-0 sm:flex-nowrap sm:py-3.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-1 sm:text-[11px]">{s.label}</span>
                <span className={`flex flex-shrink-0 items-center gap-2 font-mono text-[10px] tracking-[0.12em] sm:text-[11px] sm:tracking-[0.15em] ${s.warn ? "text-[#ffaa44]" : "text-[#00ff88]"}`}>
                  <span
                    className={`h-1.5 w-1.5 rounded-full animate-obskura-pulse-fast ${s.warn ? "bg-[#ffaa44] shadow-[0_0_8px_#ffaa44]" : "bg-[#00ff88] shadow-[0_0_8px_#00ff88]"}`}
                  />
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[1400px] px-5 lg:mt-20 lg:px-12">
        <Eyebrow>{t("wsparcie.quick_eyebrow", "SZYBKIE LINKI")}</Eyebrow>
        <h2 className="mt-3 font-serif text-[clamp(32px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em] sm:mt-4">
          {t("wsparcie.quick_title_p1", "Pierwszy")} <em className="italic text-ink-2">{t("wsparcie.quick_title_em", "krok")}</em>.
        </h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:mt-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-4 lg:gap-4">
          {quickLinks.map((q, i) => (
            <a
              key={i}
              href={q.href}
              className="group relative block border border-line bg-bg-1/50 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-red hover:bg-red/[0.04] sm:p-6"
            >
              <span className="absolute right-5 top-5 text-ink-3 transition-colors group-hover:text-red sm:right-6 sm:top-6">
                <Arrow size={14} />
              </span>
              <div className="mb-4 grid h-9 w-9 place-items-center border border-line text-red transition-colors group-hover:border-red sm:mb-5">
                {q.icon}
              </div>
              <h4 className="mb-1.5 font-serif text-[18px] font-medium sm:text-[22px]">
                {q.h1} <em className="italic text-ink-1">{q.em}</em>
              </h4>
              <p className="text-[13px] leading-snug text-ink-1">{q.desc}</p>
            </a>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto mt-16 max-w-[1400px] px-5 lg:mt-32 lg:px-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:gap-4 sm:pb-6 lg:mb-10">
          <div>
            <Eyebrow accent="blue">{t("wsparcie.faq_eyebrow", "FAQ · 34 PYTANIA")}</Eyebrow>
            <h2 className="mt-3 font-serif text-[clamp(32px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em] sm:mt-4">
              {t("wsparcie.faq_title_p1", "Najczęstsze")} <em className="italic text-ink-2">{t("wsparcie.faq_title_em", "wątpliwości")}</em>.
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("wsparcie.faq_updated", "AKTUALIZACJA · 23.05.2026")}</div>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 sm:mb-8">
          {cats.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCat(c.id);
                setOpen(-1);
              }}
              className={`inline-flex min-h-[44px] items-center border px-4 py-2 font-mono text-[11px] uppercase tracking-eyebrow transition-all duration-200 ${
                cat === c.id ? "border-red bg-red text-black" : "border-line text-ink-1 hover:border-red/40"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {list.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={`${cat}-${i}`}
                className={`border transition-colors duration-200 ${isOpen ? "border-red/30 bg-bg-1/70" : "border-line bg-bg-1/40"}`}
              >
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="flex w-full items-center gap-3 px-4 py-4 text-left text-[14px] font-medium leading-snug text-ink-0 sm:gap-6 sm:px-7 sm:py-5 sm:text-[17px]"
                  aria-expanded={isOpen}
                >
                  <span className="hidden flex-shrink-0 font-mono text-[11px] tracking-mono text-ink-2 sm:inline">// {String(i + 1).padStart(2, "0")}</span>
                  <span className="flex-1">{f.q}</span>
                  <span
                    className={`grid h-8 w-8 flex-shrink-0 place-items-center border transition-all duration-200 sm:h-7 sm:w-7 ${isOpen ? "border-red bg-red text-black" : "border-line text-ink-1"}`}
                  >
                    <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-6 text-[13px] font-light leading-relaxed text-ink-1 sm:px-7 sm:pb-7 sm:pl-[88px] sm:text-[15px]">
                    {f.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-[1400px] px-5 pb-16 lg:mt-32 lg:px-12 lg:pb-24">
        <Eyebrow>{t("wsparcie.contact_eyebrow", "// JEŚLI FAQ NIE WYSTARCZY")}</Eyebrow>
        <h2 className="mt-3 font-serif text-[clamp(32px,4.5vw,56px)] font-medium leading-none tracking-[-0.02em] sm:mt-4">
          {t("wsparcie.contact_title_p1", "Napisz")} <em className="italic text-ink-2">{t("wsparcie.contact_title_em", "do nas")}</em>.
        </h2>

        <div className="mt-8 grid grid-cols-1 items-start gap-8 lg:mt-10 lg:grid-cols-[1fr_1.2fr] lg:gap-14">
          <div>
            <p className="mb-5 text-[14px] font-light leading-relaxed text-ink-1 sm:mb-6 sm:text-[15px]">
              {t("wsparcie.contact_info", "Mamy mały zespół wsparcia (5 osób). Każdy z nas słucha własnych historii i każdy odpowiada osobiście. Bez botów, bez szablonów, bez „przyjmiemy zgłoszenie”.")}
            </p>
            {channels.map((c) => (
              <div
                key={c.tag}
                className="grid grid-cols-1 gap-0.5 border-t border-line py-4 sm:grid-cols-[1fr_2fr_auto] sm:items-center sm:gap-4 sm:py-5"
              >
                <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{c.tag}</div>
                <div className="font-serif text-[18px] italic text-ink-0 sm:text-[22px]">{c.val}</div>
                <div className={`font-mono text-[10px] uppercase tracking-eyebrow sm:text-right ${c.live ? "text-[#00ff88]" : "text-ink-2"}`}>{c.meta}</div>
              </div>
            ))}
          </div>

          <form onSubmit={onSubmit} className="border border-line bg-bg-1/70 p-6 sm:p-9">
            <h3 className="mb-1.5 font-serif text-[28px] font-medium">
              {t("wsparcie.form_title_p1", "Formularz")} <em className="italic text-ink-1">{t("wsparcie.form_title_em", "kontaktowy")}</em>
            </h3>
            <p className="mb-6 text-[13px] text-ink-2">{t("wsparcie.form_sub", "Odpowiadamy w ciągu 4 godzin (zwykle szybciej). W nocy też.")}</p>

            <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="ws-name">{t("wsparcie.form_name", "Imię / pseudonim")}</label>
                <input id="ws-name" type="text" required placeholder="np. Eliza"
                  className={`${FIELD} ${errors.name ? "border-red" : ""}`}
                  value={form.name} onChange={(e) => updField("name", e.target.value)} />
                {errors.name && <p className="font-mono text-[10px] text-red">{errors.name}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <label className={LABEL} htmlFor="ws-email">{t("wsparcie.form_email", "E-mail")}</label>
                <input id="ws-email" type="email" required placeholder="twoj@email.com"
                  className={`${FIELD} ${errors.email ? "border-red" : ""}`}
                  value={form.email} onChange={(e) => updField("email", e.target.value)} />
                {errors.email && <p className="font-mono text-[10px] text-red">{errors.email}</p>}
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-2">
              <label className={LABEL} htmlFor="ws-cat">{t("wsparcie.form_category", "Kategoria")}</label>
              <select id="ws-cat" className={FIELD} value={form.category} onChange={(e) => updField("category", e.target.value)}>
                <option>{t("wsparcie.form_cat1", "Problem techniczny — odtwarzanie")}</option>
                <option>{t("wsparcie.form_cat2", "Problem techniczny — aplikacja mobilna")}</option>
                <option>{t("wsparcie.form_cat3", "Płatności i subskrypcja")}</option>
                <option>{t("wsparcie.form_cat4", "Konto i logowanie")}</option>
                <option>{t("wsparcie.form_cat5", "Treść (sugestia, błąd merytoryczny)")}</option>
                <option>{t("wsparcie.form_cat6", "Współpraca — narrator / twórca")}</option>
                <option>{t("wsparcie.form_cat7", "Inne")}</option>
              </select>
            </div>

            <div className="mb-5 flex flex-col gap-2">
              <label className={LABEL} htmlFor="ws-msg">{t("wsparcie.form_message", "Opisz problem")}</label>
              <textarea
                id="ws-msg"
                required
                placeholder={t("wsparcie.form_message_ph", "Im więcej szczegółów, tym szybciej pomożemy. Numer odcinka, system, godzina, screenshot...")}
                className={`${FIELD} min-h-[140px] resize-y font-sans ${errors.message ? "border-red" : ""}`}
                value={form.message}
                onChange={(e) => updField("message", e.target.value)}
              />
              {errors.message && <p className="font-mono text-[10px] text-red">{errors.message}</p>}
            </div>

            <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink-1">
              <input type="checkbox" className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red" />
              <span>{t("wsparcie.form_urgent", "Sprawa pilna — w 3 sekundach krzyk, nie wiem co robić")}</span>
            </label>

            {serverError && <p className="mb-4 border border-red/40 bg-red/[0.06] p-2.5 font-mono text-[11px] text-red" role="alert">{serverError}</p>}

            <HorrorButton type="submit" block disabled={sent || loading}>
              {sent
                ? t("wsparcie.form_sent", "✓ Wysłane — odpowiemy w 4h")
                : loading
                  ? t("wsparcie.form_loading", "Wysyłanie…")
                  : <>{t("wsparcie.form_submit", "Wyślij zgłoszenie")} <Arrow /></>}
            </HorrorButton>
          </form>
        </div>
      </section>
    </>
  );
}
