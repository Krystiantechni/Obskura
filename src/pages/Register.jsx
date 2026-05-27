import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

const GENRE_IDS = ["psy", "folk", "cosmic", "noir", "true", "cyber", "myth", "body"];

function strengthOf(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}

const PW_COLORS = ["bg-line", "bg-[#ff4444]", "bg-[#ff9944]", "bg-[#ffdd44]", "bg-[#44dd66]"];

export default function Register() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [data, setData] = useState({ email: "", password: "", name: "", intensity: 7, genres: ["psy", "folk"], terms: false });

  const upd = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const toggleGenre = (id) =>
    setData((d) => ({ ...d, genres: d.genres.includes(id) ? d.genres.filter((g) => g !== id) : [...d.genres, id] }));

  const strength = useMemo(() => strengthOf(data.password), [data.password]);
  const strengthLabel = t(`register.pw_strengths_${Math.max(0, strength - 1)}`);

  const canStep1 = data.email.includes("@") && strength >= 2;
  const canStep2 = data.genres.length >= 1;
  const canStep3 = data.name.length >= 2 && data.terms;

  const submit = (e) => {
    e.preventDefault();
    setStep(4);
  };

  const stepLabel = step === 1 ? t("register.step1_label") : step === 2 ? t("register.step2_label") : t("register.step3_label");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Form (order-1) */}
      <div className="relative order-2 flex items-center justify-center px-6 py-20 lg:order-1 lg:px-[60px]">
        <Link to="/" className="absolute left-6 top-8 font-mono text-[11px] uppercase tracking-mono text-ink-2 hover:text-ink-0 lg:left-[60px]">
          {t("register.back")}
        </Link>

        <form className="w-full max-w-[460px]" onSubmit={submit}>
          {step < 4 && (
            <>
              <div className="mb-8 flex items-center gap-3">
                {[1, 2, 3].map((n, i) => (
                  <div key={n} className="contents">
                    <div
                      className={[
                        "grid h-7 w-7 place-items-center border font-mono text-[11px] transition-all",
                        step === n ? "border-red bg-red text-white shadow-[0_0_16px_rgba(255,42,42,0.4)]" : step > n ? "border-red text-red" : "border-line text-ink-2",
                      ].join(" ")}
                    >
                      {step > n ? "✓" : n}
                    </div>
                    {i < 2 && (
                      <div className={`relative h-px flex-1 ${step > n ? "bg-red shadow-[0_0_4px_#ff2a2a]" : "bg-line"}`} />
                    )}
                  </div>
                ))}
              </div>
              <div className="mb-6 font-mono text-[10px] uppercase tracking-mono text-ink-2">
                {t("register.step")} {step} <span className="text-ink-3">{t("register.of")} {stepLabel}</span>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="mb-3 font-serif text-5xl font-medium leading-none tracking-[-0.02em]">
                {t("register.step1_h1_p1")} <em className="italic text-ink-1">{t("register.step1_h1_p2")}</em>.
              </h1>
              <p className="mb-9 text-sm leading-relaxed text-ink-1">{t("register.step1_sub")}</p>

              <div className="mb-5 flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("register.email_label")}</label>
                <input type="email" placeholder={t("register.email_placeholder")} className={FIELD} value={data.email} onChange={(e) => upd("email", e.target.value)} />
              </div>

              <div className="mb-7 flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("register.password_label")}</label>
                <input type="password" placeholder={t("register.password_placeholder")} className={FIELD} value={data.password} onChange={(e) => upd("password", e.target.value)} />
                <div className="mt-1.5 flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`h-[3px] flex-1 transition-colors ${i <= strength ? PW_COLORS[strength] : "bg-line"}`} />
                  ))}
                </div>
                <div className="font-mono text-[10px] tracking-ui text-ink-2">{data.password ? strengthLabel : t("register.pw_hint")}</div>
              </div>

              <HorrorButton block disabled={!canStep1} onClick={() => canStep1 && setStep(2)}>
                {t("register.next")}
              </HorrorButton>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="mb-3 font-serif text-5xl font-medium leading-none tracking-[-0.02em]">
                {t("register.step2_h1_p1")} <em className="italic text-ink-1">{t("register.step2_h1_p2")}</em>?
              </h1>
              <p className="mb-7 text-sm leading-relaxed text-ink-1">{t("register.step2_sub")}</p>

              <div className="mb-7 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {GENRE_IDS.map((id) => {
                  const sel = data.genres.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleGenre(id)}
                      className={[
                        "flex items-center gap-2.5 border p-3.5 text-left text-[13px] transition-colors",
                        sel ? "border-red bg-red/[0.08] text-ink-0" : "border-line bg-white/[0.02] text-ink-1 hover:border-red/50",
                      ].join(" ")}
                    >
                      <span className={`grid h-3.5 w-3.5 flex-shrink-0 place-items-center border text-[10px] font-bold text-white transition-colors ${sel ? "border-red bg-red" : "border-line"}`}>
                        {sel ? "✓" : ""}
                      </span>
                      <span>
                        <span className="mb-0.5 block font-medium">{t(`register.genres.${id}_label`)}</span>
                        <span className="block text-[11px] text-ink-2">{t(`register.genres.${id}_desc`)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-7 border border-line bg-white/[0.02] p-5">
                <div className="mb-3.5 flex items-baseline justify-between">
                  <span className="text-[13px] text-ink-1">{t("register.intensity_label")}</span>
                  <span className="font-mono text-[11px] tracking-ui text-red">{data.intensity}/10</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={data.intensity}
                  onChange={(e) => upd("intensity", +e.target.value)}
                  className="h-1 w-full cursor-pointer appearance-none bg-gradient-to-r from-blue to-red accent-ink-0"
                />
                <div className="mt-2.5 flex justify-between font-mono text-[9px] tracking-[0.1em] text-ink-2">
                  <span>{t("register.intensity_subtle")}</span>
                  <span>{t("register.intensity_dark")}</span>
                  <span>{t("register.intensity_extreme")}</span>
                </div>
              </div>

              <div className="flex gap-3">
                <HorrorButton variant="ghost" onClick={() => setStep(1)}>{t("register.back_step")}</HorrorButton>
                <HorrorButton className="flex-1" disabled={!canStep2} onClick={() => canStep2 && setStep(3)}>{t("register.next")}</HorrorButton>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="mb-3 font-serif text-5xl font-medium leading-none tracking-[-0.02em]">
                {t("register.step3_h1_p1")} <em className="italic text-ink-1">{t("register.step3_h1_p2")}</em>.
              </h1>
              <p className="mb-7 text-sm leading-relaxed text-ink-1">{t("register.step3_sub")}</p>

              <div className="mb-5 flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("register.name_label")}</label>
                <input type="text" placeholder={t("register.name_placeholder")} className={FIELD} value={data.name} onChange={(e) => upd("name", e.target.value)} />
                <div className="text-xs text-ink-2">{t("register.name_hint")}</div>
              </div>

              <div className="mb-5 flex flex-col gap-2">
                <label className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("register.time_label")}</label>
                <select defaultValue="late" className={FIELD}>
                  <option value="evening">{t("register.time_evening")}</option>
                  <option value="late">{t("register.time_late")}</option>
                  <option value="dawn">{t("register.time_dawn")}</option>
                  <option value="any">{t("register.time_any")}</option>
                </select>
              </div>

              <label className="mb-3 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink-1">
                <input type="checkbox" checked={data.terms} onChange={(e) => upd("terms", e.target.checked)} className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red" />
                <span>{t("register.terms")}</span>
              </label>
              <label className="mb-7 flex cursor-pointer items-start gap-2.5 text-[13px] leading-snug text-ink-1">
                <input type="checkbox" defaultChecked className="mt-0.5 h-4 w-4 flex-shrink-0 accent-red" />
                <span>{t("register.newsletter_optin")}</span>
              </label>

              <div className="flex gap-3">
                <HorrorButton variant="ghost" onClick={() => setStep(2)}>{t("register.back_step")}</HorrorButton>
                <HorrorButton type="submit" className="flex-1" disabled={!canStep3}>{t("register.submit")}</HorrorButton>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="py-10 text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 animate-obskura-pulse place-items-center rounded-full border border-red text-[32px] font-light text-red shadow-[0_0_32px_rgba(255,42,42,0.3)]">✓</div>
              <Eyebrow centered className="mb-6 justify-center">{t("register.success_eyebrow")} · {data.name.toUpperCase()}</Eyebrow>
              <h1 className="font-serif text-5xl font-medium leading-none tracking-[-0.02em]">
                {t("register.success_h1_p1")} <em className="italic text-ink-1">{t("register.success_h1_p2")}</em>.
              </h1>
              <p className="mb-8 mt-4 text-sm leading-relaxed text-ink-1">{t("register.success_sub")}</p>
              <HorrorButton to="/" block>{t("register.success_cta")}</HorrorButton>
            </div>
          )}

          {step < 4 && (
            <div className="mt-8 text-center text-[13px] text-ink-2">
              {t("register.already_account")}{" "}
              <Link to="/zaloguj" className="border-b border-red pb-px text-ink-0 hover:text-red">{t("register.login_link")}</Link>
            </div>
          )}
        </form>
      </div>

      {/* Art (order-2) */}
      <div className="relative order-1 hidden overflow-hidden bg-bg-0 lg:order-2 lg:block">
        <img src="/images/img-orbs.png" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_30%]" style={{ filter: "contrast(1.05) saturate(0.85) brightness(0.85)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(270deg, transparent 0%, transparent 60%, rgba(5,6,8,0.95) 100%), linear-gradient(180deg, rgba(5,6,8,0.4) 0%, transparent 30%, rgba(5,6,8,0.7) 100%)" }} />
        <div className="absolute right-[60px] top-8 z-[2] flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-1">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-blue shadow-[0_0_8px_#5fa8ff]" />
          {t("register.tag")}
        </div>
        <div className="absolute inset-x-[60px] bottom-[60px] z-[2]">
          <div className="mb-8 grid grid-cols-3 gap-8 border-b border-white/15 pb-8">
            {[
              { num: "147", lab: t("register.stat_label_stories") },
              { num: "2.4M", lab: t("register.stat_label_listeners") },
              { num: "3D", lab: t("register.stat_label_3d") },
            ].map((s, i) => (
              <div key={i}>
                <div className="mb-1.5 font-serif text-3xl font-medium leading-none text-ink-0">{s.num}</div>
                <div className="font-mono text-[9px] uppercase tracking-mono text-ink-2">{s.lab}</div>
              </div>
            ))}
          </div>
          <div className="max-w-md font-serif text-[22px] italic leading-snug text-ink-1">{t("register.quote")}</div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("register.quote_meta")}</div>
        </div>
      </div>
    </div>
  );
}
