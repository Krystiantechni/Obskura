import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";
import { subscribeNewsletter } from "../lib/apiClient";
import { newsletterSchema, flattenErrors } from "../lib/formSchemas";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

const FREQ_OPTIONS = [
  { id: "week", dayKey: "freq_week_day", whenKey: "freq_week_when", dayDef: "Co czwartek", whenDef: "23:00 · pełne wydanie" },
  { id: "big", dayKey: "freq_big_day", whenKey: "freq_big_when", dayDef: "Tylko premiery", whenDef: "gdy nowy odcinek" },
  { id: "month", dayKey: "freq_month_day", whenKey: "freq_month_when", dayDef: "Miesięcznie", whenDef: "1. pn miesiąca · digest" },
];

function NewsletterSubscribeCard() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [freq, setFreq] = useState("week");
  const [consent, setConsent] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  const onSubmit = async (e) => {
    e?.preventDefault?.();
    setErrors({});
    setServerError("");
    const parsed = newsletterSchema.safeParse({ email, freq, consent });
    if (!parsed.success) { setErrors(flattenErrors(parsed.error)); return; }
    setLoading(true);
    try {
      await subscribeNewsletter(parsed.data);
      setSubscribed(true);
    } catch (err) {
      setServerError(err.message || "Nie udało się zapisać. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="relative border border-line bg-bg-1/85 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-10">
        <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red/50 to-transparent" />
        <div className="py-6 text-center">
          <div className="mx-auto mb-5 grid h-16 w-16 animate-obskura-pulse place-items-center rounded-full border border-red text-red shadow-[0_0_24px_rgba(255,42,42,0.3)]">
            <Check size={28} strokeWidth={1.5} />
          </div>
          <Eyebrow centered className="mb-3 justify-center">
            {t("newsletter.success_eyebrow", "SUBSKRYPCJA POTWIERDZONA")}
          </Eyebrow>
          <h2 className="font-serif text-3xl font-medium leading-tight">
            {t("newsletter.success_h2_p1", "Sprawdź")} <em className="italic text-ink-1">{t("newsletter.success_h2_p2", "skrzynkę")}</em>.
          </h2>
          <p className="mx-auto mb-6 mt-3 max-w-xs text-[13px] leading-relaxed text-ink-1">
            {t("newsletter.success_sub_p1", "Wysłaliśmy ci link aktywacyjny na")}{" "}
            <strong className="text-ink-0">{email}</strong>.{" "}
            {t("newsletter.success_sub_p2", "Może wylądować w SPAMIE — to dobry znak.")}
          </p>
          <HorrorButton variant="ghost" onClick={() => setSubscribed(false)}>
            {t("newsletter.success_back", "← Zmień coś")}
          </HorrorButton>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="relative border border-line bg-bg-1/85 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-10" noValidate>
      <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red/50 to-transparent" />
      <div className="mb-4 font-mono text-[10px] uppercase tracking-eyebrow text-red">
        {t("newsletter.card_tag", "// FORMULARZ SUBSKRYPCJI")}
      </div>
      <h2 className="font-serif text-[32px] font-medium leading-tight">
        {t("newsletter.card_h2_p1", "Zapisz się")} <em className="italic text-ink-1">{t("newsletter.card_h2_p2", "teraz")}</em>.
      </h2>
      <p className="mb-6 mt-2 text-[13px] leading-relaxed text-ink-1">
        {t("newsletter.card_sub", "Bez kart, bez opłat. Wystarczy e-mail. Odpisać możesz w każdej chwili — jednym kliknięciem.")}
      </p>

      <div className="mb-6 flex flex-col gap-2">
        <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2" htmlFor="nl-email">
          {t("newsletter.email_label", "Twój adres e-mail")}
        </label>
        <input
          id="nl-email"
          type="email"
          required
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "nl-email-err" : undefined}
          placeholder={t("newsletter.email_placeholder", "twoj@email.com")}
          className={`${FIELD} ${errors.email ? "border-red" : ""}`}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p id="nl-email-err" className="font-mono text-[10px] text-red">{errors.email}</p>}
      </div>

      <div className="mb-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">
        {t("newsletter.freq_label", "Częstotliwość")}
      </div>
      <div className="mb-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FREQ_OPTIONS.map((o) => {
          const sel = freq === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => setFreq(o.id)}
              className={[
                "border px-2.5 py-3.5 text-center transition-all",
                sel
                  ? "border-red bg-red/[0.08] text-ink-0 shadow-[0_0_16px_rgba(255,42,42,0.15)]"
                  : "border-line bg-white/[0.02] text-ink-1 hover:border-red/40",
              ].join(" ")}
            >
              <div className="mb-0.5 font-serif text-[22px] italic">{t(`newsletter.${o.dayKey}`, o.dayDef)}</div>
              <div className={`font-mono text-[9px] uppercase tracking-mono ${sel ? "text-red" : "text-ink-2"}`}>
                {t(`newsletter.${o.whenKey}`, o.whenDef)}
              </div>
            </button>
          );
        })}
      </div>

      <label className="mb-2 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red"
        />
        <span>{t("newsletter.consent", "Zgadzam się na otrzymywanie wiadomości od OBSKURY. Mogę zrezygnować w każdej chwili.")}</span>
      </label>
      {errors.consent && <p className="mb-4 font-mono text-[10px] text-red">{errors.consent}</p>}
      {serverError && <p className="mb-4 border border-red/40 bg-red/[0.06] p-2.5 font-mono text-[11px] text-red" role="alert">{serverError}</p>}

      <HorrorButton block disabled={loading} type="submit">
        {loading ? t("newsletter.submit_loading", "Zapisywanie…") : t("newsletter.submit", "Zapisz się")} <Arrow />
      </HorrorButton>

      <div className="mt-5 text-center font-mono text-[9px] uppercase tracking-mono text-ink-3">
        {t("newsletter.trust_line", "47 800 OSÓB JUŻ SŁUCHA · 0% SPAMU · GDPR")}
      </div>
    </form>
  );
}

const WHAT_ITEMS = [
  {
    num: "// 01 — PIERWSZEŃSTWO",
    h: ["Nowe odcinki", "72 godziny przed", "premierą publiczną."],
    p: "Subskrybenci dostają link do nowego odcinka wcześniej niż reszta. Bez wyjątków, bez retencji — jeśli nie posłuchasz, link wygasa po 72h.",
  },
  {
    num: "// 02 — KULISY",
    h: ["Notatki", "od reżysera", "i fragmenty wyciętych scen."],
    p: "Krótki tekst od osoby, która zrobiła ten odcinek. Dlaczego ten dźwięk, ta pauza, ten głos. Czasem pliki audio, które nie weszły do finalnej wersji.",
  },
  {
    num: "// 03 — JEDNA HISTORIA",
    h: ["Krótki,", "500-słowowy", "tekst grozy."],
    p: "Ekskluzywnie dla newslettera — coś między mikropowieścią a creepypastą. Pisane przez naszych narratorów. Nigdy nie pojawi się nigdzie indziej.",
  },
];

export default function Newsletter() {
  const { t } = useTranslation();

  return (
    <div className="bg-bg-0">
      {/* HERO — split obraz + zapis */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden px-5 pb-16 pt-[140px] sm:pb-20 lg:px-12">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/img-forest.webp"
            alt=""
            className="h-full w-full object-cover object-[center_60%]"
            style={{ filter: "contrast(1.05) saturate(0.85) brightness(0.7)" }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 80% at 30% 50%, rgba(5,6,8,0.8), rgba(5,6,8,0.4) 60%, transparent), linear-gradient(180deg, rgba(5,6,8,0.6) 0%, transparent 30%, rgba(5,6,8,0.85) 100%)",
            }}
          />
        </div>

        <div className="relative z-[2] mx-auto grid w-full max-w-[1400px] items-center gap-10 lg:grid-cols-[1.2fr_1fr] lg:gap-20">
          <div>
            <Eyebrow>{t("newsletter.hero_eyebrow", "// TYGODNIK NOCNY · CO CZWARTEK O 23:00")}</Eyebrow>
            <h1 className="my-6 font-serif font-medium leading-[0.92] tracking-[-0.02em]" style={{ fontSize: "clamp(40px, 8vw, 112px)" }}>
              {t("newsletter.hero_h1_p1", "Listy")} <em className="italic text-ink-1">{t("newsletter.hero_h1_p2", "z")}</em>
              <br />
              <span className="text-red [text-shadow:0_0_24px_rgba(255,42,42,0.4)]">{t("newsletter.hero_h1_p3", "ciemnej")}</span>
              <br />
              {t("newsletter.hero_h1_p4", "strony.")}
            </h1>
            <p className="mb-9 w-full text-[15px] font-light leading-relaxed text-ink-1 sm:max-w-[480px] sm:text-[17px]">
              {t(
                "newsletter.hero_lead",
                "Newsletter dla tych, którzy słuchają historii w drodze do domu o trzeciej w nocy. Co czwartek wysyłamy ci nowy odcinek przed premierą, kulisy nagrań i jeden krótki tekst, który nie pozwoli ci zasnąć.",
              )}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] uppercase tracking-ui text-ink-2">
              <span>{t("newsletter.stat_subs", "47 800 SUBSKRYBENTÓW")}</span>
              <span className="text-ink-3">·</span>
              <span>{t("newsletter.stat_editions", "183 WYSŁANE WYDANIA")}</span>
              <span className="text-ink-3">·</span>
              <span>{t("newsletter.stat_spam", "0 SPAMU")}</span>
            </div>
          </div>

          <NewsletterSubscribeCard />
        </div>
      </section>

      {/* DLACZEGO WARTO */}
      <section className="mx-auto mt-16 max-w-[1400px] px-5 sm:mt-24 lg:px-12">
        <Eyebrow>{t("newsletter.what_eyebrow", "DLACZEGO WARTO")}</Eyebrow>
        <h2 className="mt-4 font-serif text-4xl font-medium leading-none tracking-[-0.02em] sm:text-5xl">
          {t("newsletter.what_h2_p1", "Trzy rzeczy, które dostajesz,")}{" "}
          <em className="italic text-ink-1">{t("newsletter.what_h2_p2", "i nic więcej")}</em>.
        </h2>

        <div className="mt-8 grid gap-6 sm:mt-14 sm:gap-8 md:grid-cols-3">
          {WHAT_ITEMS.map((item, i) => (
            <div key={i} className="border-t border-line pt-8">
              <div className="mb-4 font-mono text-[11px] tracking-mono text-red">{t(`newsletter.what_${i}_num`, item.num)}</div>
              <h3 className="mb-3 font-serif text-[28px] font-medium leading-tight">
                {t(`newsletter.what_${i}_h_p1`, item.h[0])} <em className="italic text-ink-1">{t(`newsletter.what_${i}_h_em`, item.h[1])}</em> {t(`newsletter.what_${i}_h_p2`, item.h[2])}
              </h3>
              <p className="text-sm font-light leading-relaxed text-ink-1">{t(`newsletter.what_${i}_p`, item.p)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PODGLĄD MAILA */}
      <section className="mx-auto my-16 max-w-[1400px] px-5 sm:my-28 lg:px-12">
        <div className="mb-10 flex flex-col gap-6 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Eyebrow accent="blue" className="mb-3">
              {t("newsletter.preview_eyebrow", "PODGLĄD · WYDANIE #183")}
            </Eyebrow>
            <h2 className="font-serif text-4xl font-medium leading-none tracking-[-0.02em] sm:text-5xl">
              {t("newsletter.preview_h2_p1", "Co dokładnie")} <em className="italic text-ink-1">{t("newsletter.preview_h2_p2", "dostaniesz")}</em>?
            </h2>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">
            {t("newsletter.preview_delivered", "DOSTARCZONE · CZW. 23.05.2026 · 23:00:14")}
          </div>
        </div>

        <div className="grid gap-8 border border-line bg-bg-1/60 p-6 sm:gap-12 sm:p-12 lg:grid-cols-[1fr_2fr]">
          <div className="border-b border-line pb-6 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-12">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-ui text-ink-2">{t("newsletter.preview_from", "OD")}</div>
            <div className="mb-4 text-[13px] text-ink-0">obskura@listy.obskura.audio</div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-ui text-ink-2">{t("newsletter.preview_to", "DO")}</div>
            <div className="mb-4 text-[13px] text-ink-0">ty@email.com</div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-ui text-ink-2">{t("newsletter.preview_subject", "TEMAT")}</div>
            <div className="mt-2 font-serif text-2xl italic leading-tight text-ink-0">
              {t("newsletter.preview_subject_val", "Coś chce wrócić — odcinek 12 dostępny dla ciebie")}
            </div>
          </div>

          <div>
            <p className="mb-4 text-sm font-light leading-[1.7] text-ink-1 [&::first-letter]:float-left [&::first-letter]:mr-2 [&::first-letter]:font-serif [&::first-letter]:text-5xl [&::first-letter]:leading-[0.9] [&::first-letter]:text-red">
              {t(
                "newsletter.preview_body_1",
                "W zeszłą środę zamknęliśmy się w studiu z Katarzyną Wieczorek na sześć godzin. Nie wyszliśmy zadowoleni. Dziś rano wyszliśmy z czymś, co działa. Słuchasz tego pierwszy.",
              )}
            </p>
            <p className="mb-4 text-sm font-light leading-[1.7] text-ink-1">
              {t(
                "newsletter.preview_body_2",
                'W tym wydaniu znajdziesz odcinek "Mgła nad Wisłoujściem", krótką notatkę o tym, dlaczego wycięliśmy z niego całą scenę w piwnicy (i dlaczego była potrzebna), oraz 500-słowowy tekst od M. Sobczak — naszego stałego reżysera dźwięku.',
              )}
            </p>

            <div className="my-6 flex items-center gap-4 border-y border-line py-5">
              <div
                className="h-[60px] w-[60px] flex-shrink-0 bg-cover bg-[center_20%]"
                style={{ backgroundImage: "url('/images/img-creature.webp')" }}
              />
              <div>
                <div className="mb-1 font-mono text-[10px] tracking-ui text-red">{t("newsletter.preview_ep_num", "S03 · E12 · TWÓJ EKSKLUZYWNY LINK")}</div>
                <div className="mb-0.5 font-serif text-xl text-ink-0">{t("newsletter.preview_ep_name", "Mgła nad Wisłoujściem")}</div>
                <div className="text-[11px] text-ink-2">{t("newsletter.preview_ep_meta", "47:12 · Słuchawki wymagane · Wygasa za 71h 48min")}</div>
              </div>
            </div>

            <p className="mb-4 text-sm font-light leading-[1.7] text-ink-1">
              {t(
                "newsletter.preview_body_3",
                "To wszystko, czego dziś od nas dostajesz. Następne wydanie wyjdzie w czwartek o 23:00. Jeśli chcesz, możesz odpowiedzieć na ten e-mail — czytamy każdy.",
              )}
            </p>
            <p className="mt-8 font-serif italic text-ink-2">{t("newsletter.preview_signature", "— Redakcja OBSKURA")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
