import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";
import { Arrow } from "../components/ui/Icons";
import { login } from "../lib/apiClient";
import { loginSchema, flattenErrors } from "../lib/formSchemas";

const FIELD =
  "border border-line bg-white/[0.02] px-4 py-3.5 text-[15px] text-ink-0 transition-colors placeholder:text-ink-3 focus:border-red focus:bg-red/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/70";

export default function Login() {
  const { t } = useTranslation();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({}); setServerError("");
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) { setErrors(flattenErrors(parsed.error)); return; }
    setLoading(true);
    try {
      await login(parsed.data);
    } catch (err) {
      setServerError(err.message || "Logowanie nieudane.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* Art */}
      <div className="relative hidden overflow-hidden bg-bg-0 lg:block">
        <img src="/images/img-hallway.webp" alt="" className="absolute inset-0 h-full w-full object-cover object-[center_25%]" style={{ filter: "contrast(1.05) saturate(0.85) brightness(0.85)" }} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(90deg, transparent 0%, transparent 60%, rgba(5,6,8,0.9) 100%), linear-gradient(180deg, rgba(5,6,8,0.5) 0%, transparent 30%, rgba(5,6,8,0.7) 100%)" }} />
        <div className="absolute left-[60px] top-8 z-[2] flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-1">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
          {t("login.chronometr")}
        </div>
        <div className="absolute inset-x-[60px] bottom-[60px] z-[2]">
          <div className="relative mb-5 max-w-md font-serif text-[32px] italic leading-tight text-ink-0">
            <span className="absolute -top-8 left-0 text-7xl leading-none text-red drop-shadow-[0_0_20px_rgba(255,42,42,0.5)]">&ldquo;</span>
            {t("login.quote")}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("login.quote_meta")}</div>
        </div>
      </div>

      {/* Form */}
      <div className="relative flex items-center justify-center px-6 py-20 lg:px-[60px]">
        <Link to="/" className="absolute left-6 top-8 font-mono text-[11px] uppercase tracking-mono text-ink-2 hover:text-ink-0 lg:left-[60px]">
          {t("login.back")}
        </Link>

        <form className="w-full max-w-[420px]" onSubmit={onSubmit} noValidate>
          <Eyebrow className="mb-6">{t("login.eyebrow")}</Eyebrow>
          <h1 className="mb-3 font-serif text-5xl font-medium leading-none tracking-[-0.02em]">
            {t("login.h1_p1")} <em className="italic text-ink-1">{t("login.h1_p2")}</em>.
          </h1>
          <p className="mb-9 text-sm leading-relaxed text-ink-1">{t("login.sub")}</p>

          <div className="grid grid-cols-2 gap-2.5">
            {[t("login.oauth_github"), t("login.oauth_google")].map((o) => (
              <button key={o} type="button" className="flex items-center justify-center gap-2.5 border border-line bg-white/[0.02] py-3.5 font-sans text-xs font-medium uppercase tracking-[0.1em] text-ink-0 transition-colors hover:border-white/25 hover:bg-white/[0.04]">
                {o}
              </button>
            ))}
          </div>

          <div className="my-7 flex items-center gap-4 font-mono text-[10px] tracking-mono text-ink-2 before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
            {t("login.or_email")}
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label htmlFor="lg-email" className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("login.email_label")}</label>
            <input id="lg-email" type="email" autoComplete="email" placeholder={t("login.email_placeholder")}
              value={email} onChange={(e) => setEmail(e.target.value)}
              className={`${FIELD} ${errors.email ? "border-red" : ""}`} />
            {errors.email && <p className="font-mono text-[10px] text-red">{errors.email}</p>}
          </div>

          <div className="mb-5 flex flex-col gap-2">
            <label htmlFor="lg-pw" className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{t("login.password_label")}</label>
            <div className="relative">
              <input id="lg-pw" type={showPw ? "text" : "password"} autoComplete="current-password" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className={`${FIELD} w-full pr-[70px] ${errors.password ? "border-red" : ""}`} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-[10px] tracking-ui text-ink-2 hover:text-ink-0">
                {showPw ? t("login.hide") : t("login.show")}
              </button>
            </div>
            {errors.password && <p className="font-mono text-[10px] text-red">{errors.password}</p>}
          </div>

          {serverError && <p className="mb-4 border border-red/40 bg-red/[0.06] p-2.5 font-mono text-[11px] text-red" role="alert">{serverError}</p>}

          <div className="mb-7 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2.5 text-xs text-ink-1">
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-red" />
              {t("login.remember")}
            </label>
            <a href="#" className="font-mono text-[11px] uppercase tracking-ui text-ink-1 hover:text-red">{t("login.forgot")}</a>
          </div>

          <HorrorButton type="submit" block disabled={loading}>
            {loading ? t("login.submit_loading", "Logowanie…") : t("login.submit")} <Arrow />
          </HorrorButton>

          <div className="mt-8 text-center text-[13px] text-ink-1">
            {t("login.no_account")}{" "}
            <Link to="/rejestracja" className="border-b border-red pb-px text-ink-0 hover:text-red">{t("login.create_link")}</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
