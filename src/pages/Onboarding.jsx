import { useState } from "react";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import HorrorButton from "../components/ui/HorrorButton";
import { Play, Arrow } from "../components/ui/Icons";

const STEPS = [
  { id: "welcome", labelKey: "step_welcome", labelDef: "Witaj", bg: "/images/dada.jpg" },
  { id: "genres", labelKey: "step_genres", labelDef: "Gatunki", bg: "/images/img-forest.jpg" },
  { id: "when", labelKey: "step_when", labelDef: "Pora", bg: "/images/img-hallway.jpg" },
  { id: "audio", labelKey: "step_audio", labelDef: "Audio", bg: "/images/img-tunnel.jpg" },
  { id: "first", labelKey: "step_first", labelDef: "Pierwsze odsłuchanie", bg: "/images/img-creature.jpg" },
];

const GENRES = [
  { id: "psy", nameDef: "Psychologiczny", tagDef: "Manipulacja, lęk", img: "/images/img-hallway.jpg" },
  { id: "folk", nameDef: "Folk horror", tagDef: "Rytuały, las", img: "/images/img-forest.jpg" },
  { id: "cosmic", nameDef: "Cosmic dread", tagDef: "Niewyobrażalne", img: "/images/img-orbs.jpg" },
  { id: "noir", nameDef: "Noir", tagDef: "Detektyw, miasto", img: "/images/img-smoke.jpg" },
  { id: "true", nameDef: "True horror", tagDef: "Oparte na faktach", img: "/images/img-creature.jpg" },
  { id: "cyber", nameDef: "Cyber horror", tagDef: "Sieć, AI", img: "/images/img-tunnel.jpg" },
  { id: "myth", nameDef: "Mitologia", tagDef: "Słowiańska, nordycka", img: "/images/img-wolf.jpg" },
  { id: "mar", nameDef: "Maritime", tagDef: "Głębia, mgła", img: "/images/monster.jpg" },
];

const TIMES = [
  { id: "evening", hours: "20–22", labelDef: "// Wczesny wieczór", descDef: "Z kolacją w słuchawkach, po pracy, przed ciszą snu. Niezbyt mroczne dla początków." },
  { id: "night", hours: "22–02", labelDef: "// Późna noc", descDef: "Klasyk Obskury. Świat zasypia, ty zostajesz przy słuchawkach. Bohaterem jesteś ty." },
  { id: "dawn", hours: "02–06", labelDef: "// Przed świtem", descDef: "Dla insomniaków, kierowców nocnych, ludzi po pracy zmianowej. Najgłębsze odcinki." },
];

const MORE_RECS = ["Łańcuch Fenrira", "Coś patrzy z lasu", "Mgła nad Wisłoujściem", "Sygnał z orbity"];

function OnboardingEyebrow({ children }) {
  return (
    <div className="mb-7 inline-flex items-center gap-3 font-mono text-[11px] uppercase tracking-eyebrow text-red">
      <span className="h-px w-8 bg-red shadow-[0_0_6px_#ff2a2a]" />
      {children}
      <span className="h-px w-8 bg-red shadow-[0_0_6px_#ff2a2a]" />
    </div>
  );
}
OnboardingEyebrow.propTypes = { children: PropTypes.node.isRequired };

export default function Onboarding() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [genres, setGenres] = useState(["psy", "folk"]);
  const [when, setWhen] = useState("night");
  const [hpAns, setHpAns] = useState(null);

  const toggleGenre = (id) => setGenres((g) => (g.includes(id) ? g.filter((x) => x !== id) : [...g, id]));
  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  const canAdvance = step === 1 ? genres.length >= 1 : step === 3 ? hpAns !== null : true;
  const selectedTime = TIMES.find((tm) => tm.id === when);

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg-0 pb-32 pt-[120px]">
      {/* Atmospheric backgrounds — fade between steps */}
      {STEPS.map((s, i) => (
        <div key={s.id} className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-[1500ms] ease-in-out" style={{ opacity: i === step ? 1 : 0 }}>
          <img src={s.bg} alt="" className="h-full w-full object-cover" style={{ filter: "contrast(1.05) saturate(0.85) brightness(0.5)" }} />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 60% at 50% 50%, transparent, rgba(5,6,8,0.6) 70%, rgba(5,6,8,0.95)), linear-gradient(180deg, rgba(5,6,8,0.7) 0%, transparent 30%, rgba(5,6,8,0.7) 100%)",
            }}
          />
        </div>
      ))}

      <div className="relative z-[5] flex min-h-[calc(100vh-180px)] flex-col justify-center px-5 lg:px-12">
        <motion.div
          className="mx-auto w-full max-w-[1000px] text-center"
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* STEP 0 — Welcome */}
          {step === 0 && (
            <>
              <OnboardingEyebrow>{t("onboarding.welcome_eyebrow", "PIERWSZY KROK · ZAJMIE 2 MINUTY")}</OnboardingEyebrow>
              <h1 className="mb-6 font-serif font-medium leading-[0.95] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                {t("onboarding.welcome_h1_p1", "Witaj")} <em className="italic text-ink-1">{t("onboarding.welcome_h1_em", "w")}</em>{" "}
                <span className="text-red [text-shadow:0_0_24px_rgba(255,42,42,0.4)]">{t("onboarding.welcome_h1_p2", "Obskurze")}</span>.
              </h1>
              <p className="mx-auto mb-10 max-w-[580px] text-lg font-light leading-relaxed text-ink-1">
                {t("onboarding.welcome_sub_p1", "Zanim podasz nam słuchawki, chcemy wiedzieć")}{" "}
                <strong className="font-medium text-ink-0">{t("onboarding.welcome_sub_b1", "czego się boisz")}</strong>{" "}
                {t("onboarding.welcome_sub_p2", "i")}{" "}
                <strong className="font-medium text-ink-0">{t("onboarding.welcome_sub_b2", "kiedy chcesz słuchać")}</strong>.{" "}
                {t("onboarding.welcome_sub_p3", "Cztery pytania, jeden krótki test dźwięku, i pierwszy odcinek dobrany pod ciebie.")}
              </p>
              <div className="flex flex-wrap justify-center gap-3.5">
                <HorrorButton onClick={next}>{t("onboarding.welcome_cta", "Zaczynamy")} <Arrow /></HorrorButton>
              </div>
              <div className="mt-14 font-mono text-[10px] uppercase tracking-mono text-ink-2">
                {t("onboarding.welcome_note", "ZALECANE: SŁUCHAWKI · NOC · CISZA · OD 18 LAT")}
              </div>
            </>
          )}

          {/* STEP 1 — Genres */}
          {step === 1 && (
            <>
              <OnboardingEyebrow>{t("onboarding.genres_eyebrow", "KROK 02 / 04 · GATUNKI")}</OnboardingEyebrow>
              <h1 className="mb-6 font-serif font-medium leading-[0.95] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                {t("onboarding.genres_h1_p1", "Co cię")} <em className="italic text-ink-1">{t("onboarding.genres_h1_em", "obudzi")}</em> {t("onboarding.genres_h1_p2", "o trzeciej?")}
              </h1>
              <p className="mx-auto mb-10 max-w-[580px] text-lg font-light leading-relaxed text-ink-1">
                {t("onboarding.genres_sub_p1", "Wybierz")} <strong className="font-medium text-ink-0">{t("onboarding.genres_sub_b", "minimum 1")}</strong>{" "}
                {t("onboarding.genres_sub_p2", "max 8. Algorytm dobierze ci historie. Możesz to zmienić później w ustawieniach.")}
              </p>

              <div className="mx-auto grid max-w-[900px] grid-cols-2 gap-3.5 lg:grid-cols-4">
                {GENRES.map((g) => {
                  const sel = genres.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGenre(g.id)}
                      className={[
                        "group relative aspect-[3/4] overflow-hidden border-2 bg-bg-1 transition-all hover:-translate-y-[3px]",
                        sel ? "border-red shadow-[0_0_0_1px_rgba(255,42,42,0.4),0_0_32px_rgba(255,42,42,0.2)]" : "border-line hover:border-red/40",
                      ].join(" ")}
                    >
                      <img
                        src={g.img}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className={`h-full w-full object-cover transition-[filter] duration-300 ${sel ? "[filter:grayscale(0)_brightness(1)]" : "[filter:grayscale(0.5)_brightness(0.7)]"}`}
                      />
                      <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-0/95" />
                      <span
                        className={[
                          "absolute right-3 top-3 z-[3] grid h-6 w-6 place-items-center rounded-full border text-white backdrop-blur-sm transition-all",
                          sel ? "border-red bg-red shadow-[0_0_12px_rgba(255,42,42,0.4)]" : "border-white/30 bg-black/50",
                        ].join(" ")}
                      >
                        {sel ? <Check size={13} strokeWidth={2.5} /> : null}
                      </span>
                      <span className="absolute inset-x-3.5 bottom-3.5 z-[2] text-left">
                        <span className="mb-1 block font-serif text-xl italic leading-tight">{t(`onboarding.genre_${g.id}_name`, g.nameDef)}</span>
                        <span className="block font-mono text-[9px] uppercase tracking-ui text-ink-2">{t(`onboarding.genre_${g.id}_tag`, g.tagDef)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 font-mono text-[11px] uppercase tracking-mono text-ink-2">
                {t("onboarding.genres_count", "WYBRANO:")} <strong className="text-ink-0">{genres.length}</strong> {t("onboarding.genres_count_of", "Z 8")}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <HorrorButton variant="ghost" onClick={prev}>← {t("onboarding.back", "Wstecz")}</HorrorButton>
                <HorrorButton disabled={!canAdvance} onClick={() => canAdvance && next()}>{t("onboarding.forward", "Dalej")} <Arrow /></HorrorButton>
              </div>
            </>
          )}

          {/* STEP 2 — When */}
          {step === 2 && (
            <>
              <OnboardingEyebrow>{t("onboarding.when_eyebrow", "KROK 03 / 04 · KIEDY")}</OnboardingEyebrow>
              <h1 className="mb-6 font-serif font-medium leading-[0.95] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                {t("onboarding.when_h1_p1", "O której najlepiej")} <em className="italic text-ink-1">{t("onboarding.when_h1_em", "słuchać")}</em>?
              </h1>
              <p className="mx-auto mb-10 max-w-[580px] text-lg font-light leading-relaxed text-ink-1">
                {t("onboarding.when_sub", "Ustawiamy ci powiadomienia o premierach na tę porę. Bez budzenia cię w środku dnia.")}
              </p>

              <div className="mx-auto grid max-w-[760px] gap-4 md:grid-cols-3">
                {TIMES.map((tm) => {
                  const sel = when === tm.id;
                  return (
                    <button
                      key={tm.id}
                      type="button"
                      onClick={() => setWhen(tm.id)}
                      className={[
                        "border-2 p-6 text-left transition-all",
                        sel ? "border-red bg-red/[0.04] shadow-[0_0_32px_rgba(255,42,42,0.15)]" : "border-line bg-bg-2/60 hover:border-red/40",
                      ].join(" ")}
                    >
                      <div className="mb-1.5 font-serif text-4xl font-medium italic leading-none">{tm.hours}</div>
                      <div className="mb-3 font-mono text-[10px] uppercase tracking-mono text-red">{t(`onboarding.time_${tm.id}_label`, tm.labelDef)}</div>
                      <div className={`text-[13px] font-light leading-relaxed ${sel ? "text-ink-1" : "text-ink-2"}`}>{t(`onboarding.time_${tm.id}_desc`, tm.descDef)}</div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <HorrorButton variant="ghost" onClick={prev}>← {t("onboarding.back", "Wstecz")}</HorrorButton>
                <HorrorButton onClick={next}>{t("onboarding.forward", "Dalej")} <Arrow /></HorrorButton>
              </div>
            </>
          )}

          {/* STEP 3 — Headphone test */}
          {step === 3 && (
            <>
              <OnboardingEyebrow>{t("onboarding.audio_eyebrow", "KROK 04 / 04 · TEST DŹWIĘKU")}</OnboardingEyebrow>
              <h1 className="mb-6 font-serif font-medium leading-[0.95] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                {t("onboarding.audio_h1_p1", "Sprawdzamy")} <em className="italic text-ink-1">{t("onboarding.audio_h1_em", "słuchawki")}</em>.
              </h1>
              <p className="mx-auto mb-10 max-w-[580px] text-lg font-light leading-relaxed text-ink-1">
                {t("onboarding.audio_sub_p1", "Klikniesz")} <strong className="font-medium text-ink-0">play</strong>,{" "}
                {t("onboarding.audio_sub_p2", "usłyszysz krótki dźwięk panoramowany binauralnie. Powiedz nam, z której strony słyszysz głos — to wystarczy do kalibracji 3D mixu.")}
              </p>

              <div className="mx-auto max-w-[680px]">
                <div className="mb-6 border border-line bg-bg-2/60 p-6 sm:p-10">
                  <div className="mb-8 flex items-center justify-between gap-5 sm:gap-14">
                    <div className="flex-1 text-center">
                      <div className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">{t("onboarding.audio_left", "LEWE")}</div>
                      <div className="relative mx-auto h-20 w-20 animate-obskura-pulse rounded-full border-2 border-red shadow-[0_0_0_1px_rgba(255,42,42,0.4),0_0_32px_rgba(255,42,42,0.3)]">
                        <span aria-hidden className="absolute inset-2 rounded-full border border-red bg-red/30" />
                      </div>
                    </div>
                    <HorrorButton className="px-7 py-5">
                      <Play size={14} /> {t("onboarding.audio_play", "Odtwórz test")}
                    </HorrorButton>
                    <div className="flex-1 text-center">
                      <div className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-ink-2">{t("onboarding.audio_right", "PRAWE")}</div>
                      <div className="relative mx-auto h-20 w-20 rounded-full border-2 border-line">
                        <span aria-hidden className="absolute inset-2 rounded-full border border-line" />
                      </div>
                    </div>
                  </div>
                  <div className="py-5 text-center font-serif text-xl italic text-ink-0">
                    {t("onboarding.audio_question_p1", '"Skąd słyszysz głos szeptający')} <em className="text-ink-1">{t("onboarding.audio_question_em", "twoje imię")}</em>{t("onboarding.audio_question_p2", '?"')}
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    {[
                      { id: "L", labelDef: "Z lewej" },
                      { id: "C", labelDef: "Środek / nie wiem" },
                      { id: "R", labelDef: "Z prawej" },
                    ].map((a) => {
                      const sel = hpAns === a.id;
                      return (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setHpAns(a.id)}
                          className={[
                            "border p-3.5 font-mono text-[11px] uppercase tracking-ui transition-all",
                            sel ? "border-[#00ff88] bg-[#00ff88]/[0.05] text-[#00ff88]" : "border-line bg-white/[0.02] text-ink-1 hover:border-red/40 hover:text-red",
                          ].join(" ")}
                        >
                          {t(`onboarding.audio_ans_${a.id}`, a.labelDef)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-l-2 border-blue bg-blue/[0.04] p-4 text-left">
                  <div className="mb-1.5 font-mono text-[10px] uppercase tracking-mono text-blue">{t("onboarding.audio_tip_label", "// TIP")}</div>
                  <p className="text-[13px] font-light leading-relaxed text-ink-1">
                    {t("onboarding.audio_tip_p1", "Jeśli słyszysz głos tylko w środku, sprawdź czy słuchawki są podłączone")}{" "}
                    <strong className="text-ink-0">{t("onboarding.audio_tip_b", "z prawą i lewą stroną w odpowiednie uszy")}</strong>.{" "}
                    {t("onboarding.audio_tip_p2", "W przeciwnym razie 3D nie zadziała.")}
                  </p>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3.5">
                <HorrorButton variant="ghost" onClick={prev}>← {t("onboarding.back", "Wstecz")}</HorrorButton>
                <HorrorButton disabled={!canAdvance} onClick={() => canAdvance && next()}>{t("onboarding.forward", "Dalej")} <Arrow /></HorrorButton>
              </div>
            </>
          )}

          {/* STEP 4 — First recommendation */}
          {step === 4 && (
            <>
              <OnboardingEyebrow>{t("onboarding.first_eyebrow", "GOTOWE · TWOJE PIERWSZE ODSŁUCHANIE")}</OnboardingEyebrow>
              <h1 className="mb-6 font-serif font-medium leading-[0.95] tracking-[-0.02em]" style={{ fontSize: "clamp(48px, 7vw, 96px)" }}>
                {t("onboarding.first_h1_p1", "Mamy")} <em className="italic text-ink-1">{t("onboarding.first_h1_em", "kogoś")}</em> {t("onboarding.first_h1_p2", "dla ciebie.")}
              </h1>
              <p className="mx-auto mb-10 max-w-[580px] text-lg font-light leading-relaxed text-ink-1">
                {t("onboarding.first_sub_p1", "Na podstawie twoich wyborów —")}{" "}
                <strong className="font-medium text-ink-0">{genres.length} {t("onboarding.first_sub_genres", "gatunków")}</strong>,{" "}
                {t("onboarding.first_sub_p2", "porę")} <strong className="font-medium text-ink-0">{selectedTime?.hours}</strong> —{" "}
                {t("onboarding.first_sub_p3", "wybraliśmy ci ten odcinek. Załóż słuchawki, zgaś światło. 47 minut. Zaczynamy.")}
              </p>

              <div className="mx-auto grid max-w-[720px] overflow-hidden border border-line bg-bg-2/60 text-left md:grid-cols-[220px_1fr]">
                <div className="relative min-h-[180px] bg-cover bg-center" style={{ backgroundImage: "url('/images/img-hallway.jpg')" }}>
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-b from-red/10 to-bg-0/50" />
                  <span className="absolute left-4 top-4 bg-black/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-ui text-red">{t("onboarding.first_rec_tag", "// REKOMENDACJA #01")}</span>
                </div>
                <div className="p-7 sm:p-8">
                  <div className="mb-2 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("onboarding.first_rec_pre", "SEZON 03 · ODCINEK 11 · PSYCHOLOGICAL")}</div>
                  <h3 className="mb-2 font-serif text-3xl font-medium leading-tight">
                    {t("onboarding.first_rec_title_p1", "Ostatnie")} <em className="italic text-ink-1">{t("onboarding.first_rec_title_em", "Światło")}</em>
                  </h3>
                  <div className="mb-3.5 font-mono text-[10px] uppercase tracking-ui text-ink-2">
                    52:08 · <span className="text-ink-1">★ 4.9</span> · {t("onboarding.first_rec_narrator", "NARRATOR:")} <span className="text-ink-1">K. WIECZOREK</span>
                  </div>
                  <p className="mb-4 text-[13px] font-light leading-relaxed text-ink-1">
                    {t("onboarding.first_rec_desc", "Pacjentka w psychiatryku w pokoju 304 widzi coś w lustrze. Tylko w nocy. Tylko gdy świeci tylne światło korytarza. Pielęgniarka twierdzi, że to halucynacje. Pacjentka twierdzi, że to nie ona patrzy.")}
                  </p>
                  <HorrorButton to="/player" className="px-6 py-3.5 text-[11px]">
                    <Play size={12} /> {t("onboarding.first_rec_cta", "Słuchaj teraz")}
                  </HorrorButton>
                </div>
              </div>

              <div className="mt-8 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("onboarding.first_more", "LUB SPRÓBUJ INNYCH:")}</div>
              <div className="mt-4 flex flex-wrap justify-center gap-3">
                {MORE_RECS.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    className="border border-line bg-black/30 px-3.5 py-2 font-serif text-[15px] italic text-ink-1 transition-colors hover:border-red hover:text-red"
                  >
                    {t(`onboarding.more_rec_${i}`, r)}
                  </button>
                ))}
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-3.5">
                <HorrorButton variant="ghost" to="/">{t("onboarding.first_home", "Wróć do strony głównej")}</HorrorButton>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Step progress */}
      <div className="fixed bottom-9 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 border border-line bg-bg-1/70 px-5 py-3.5 backdrop-blur-md">
        {STEPS.map((s, i) => (
          <span
            key={s.id}
            className={[
              "h-[3px] w-6 transition-all sm:w-9",
              i < step ? "bg-red shadow-[0_0_6px_rgba(255,42,42,0.4)]" : i === step ? "bg-ink-0 shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "bg-line",
            ].join(" ")}
          />
        ))}
        <span className="ml-4 self-center font-mono text-[10px] uppercase tracking-mono text-ink-2">
          {t("onboarding.progress_step", "KROK")} <strong className="text-ink-0">{step + 1}</strong> / {STEPS.length} ·{" "}
          <strong className="text-ink-0">{t(`onboarding.${STEPS[step].labelKey}`, STEPS[step].labelDef).toUpperCase()}</strong>
        </span>
      </div>
    </div>
  );
}
