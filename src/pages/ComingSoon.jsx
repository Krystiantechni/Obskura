import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Eyebrow from "../components/ui/Eyebrow";
import HorrorButton from "../components/ui/HorrorButton";

// Placeholder podstrony — layout gotowy, copy/komponenty trafiają tu iteracyjnie.
// `reference` wskazuje plik źródłowy z bundle Claude Design.
export default function ComingSoon({ title, reference }) {
  const { t } = useTranslation();
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 pt-20 text-center lg:px-12">
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 animate-red-breath" style={{ background: "radial-gradient(circle, rgba(255,42,42,0.1), transparent 60%)" }} />
      <div className="relative max-w-xl">
        <Eyebrow centered className="mb-8 justify-center">{t("common.coming_soon_eyebrow")}</Eyebrow>
        <h1 className="font-serif text-[clamp(48px,8vw,96px)] font-medium leading-[0.95] tracking-[-0.02em]">
          {title}
        </h1>
        <p className="mx-auto mb-2 mt-2 font-serif text-3xl italic text-ink-2">{t("common.coming_soon_h_em")}</p>
        <p className="mx-auto mb-10 mt-6 max-w-md text-base font-light leading-relaxed text-ink-1">{t("common.coming_soon_desc")}</p>
        <div className="flex justify-center">
          <HorrorButton to="/" variant="ghost">{t("common.coming_soon_cta")}</HorrorButton>
        </div>
        {reference && (
          <p className="mt-10 font-mono text-[10px] uppercase tracking-mono text-ink-3">
            REF · .claude/design/obskura/project/{reference}
          </p>
        )}
      </div>
    </section>
  );
}

ComingSoon.propTypes = {
  title: PropTypes.string.isRequired,
  reference: PropTypes.string,
};
