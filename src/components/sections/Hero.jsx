import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import Eyebrow from "../ui/Eyebrow";
import HorrorButton from "../ui/HorrorButton";
import FloatingMetaCard from "../ui/FloatingMetaCard";
import SciFiText from "../ui/SciFiText";
import { Play, Pause, Arrow } from "../ui/Icons";
import { usePlayer } from "../../context/PlayerContext";
import { HERO_TRACK } from "../../data/tracks";

// Hero full-bleed. variant: "wide" (dada.png 16:9, default) | "portrait" (monster.png 9:16).
export default function Hero({ variant = "wide" }) {
  const { t } = useTranslation();
  const { current, playing: globalPlaying, playTrack, toggle } = usePlayer();
  const isWide = variant === "wide";
  const img = isWide ? "/images/dada.webp" : "/images/monster.webp";

  const isHero = current?.id === HERO_TRACK.id;
  const playing = isHero && globalPlaying;
  const onToggle = () => (isHero ? toggle() : playTrack(HERO_TRACK));

  return (
    <section className="relative min-h-screen overflow-hidden px-5 pb-16 pt-[140px] lg:px-12">
      {/* Monster stage */}
      <div className="pointer-events-none absolute inset-0 z-[1] flex justify-center" style={{ alignItems: isWide ? "stretch" : "flex-end" }}>
        <div className={isWide ? "relative h-full w-full" : "relative mb-[-8%] aspect-[816/1456] h-[110%]"} style={{ filter: "contrast(1.05) saturate(0.88)" }}>
          <img
            src={img}
            alt=""
            fetchpriority="high"
            className={`absolute inset-0 h-full w-full object-cover ${isWide ? "mask-hero-wide object-[center_40%]" : "mask-hero-portrait"}`}
          />
          {/* Red rim glow — bez animacji oddechu i mix-blend (oba kosztowne na 380x200 z blur 20px). */}
          <div
            className="pointer-events-none absolute left-1/2 z-[2] -translate-x-1/2"
            style={
              isWide
                ? { top: "28%", width: 380, height: 200, background: "radial-gradient(ellipse, rgba(255,42,42,0.5), transparent 65%)" }
                : { top: "18%", width: 280, height: 280, background: "radial-gradient(circle, rgba(255,42,42,0.55), transparent 60%)" }
            }
          />
          {/* Blue water glow — radial gradient (sam radial robi miękkie krawędzie, blur 40px niepotrzebny). */}
          <div
            className="pointer-events-none absolute left-1/2 z-[2] w-4/5 -translate-x-1/2"
            style={{ bottom: isWide ? "-5%" : "-10%", height: isWide ? "50%" : "40%", background: "radial-gradient(ellipse, rgba(95,168,255,0.42), transparent 70%)" }}
          />
        </div>
      </div>

      {/* Atmospheric fog overlay — static (animowane bg-position na SVG turbulence z mix-blend było ciężkie). */}
      <div className="pointer-events-none absolute inset-0 z-[3] bg-fog-drift opacity-25" />
      <div className="pointer-events-none absolute inset-0 z-[3]" style={{ background: "radial-gradient(ellipse 110% 100% at 50% 50%, transparent 20%, rgba(5,6,8,0.55) 70%, #050608)" }} />
      <div className="pointer-events-none absolute inset-0 z-[3]" style={{ background: "linear-gradient(180deg, transparent 40%, rgba(5,6,8,0.6) 70%, #050608 95%)" }} />

      {/* Content */}
      <div className={`relative z-10 mx-auto grid min-h-[calc(100vh-200px)] max-w-[1400px] items-center gap-12 ${isWide ? "grid-cols-1" : "lg:grid-cols-2 lg:gap-20"}`}>
        <div className={isWide ? "max-w-3xl bg-[linear-gradient(90deg,rgba(5,6,8,0.85),rgba(5,6,8,0.6)_60%,transparent)] py-9 pr-10 lg:-ml-10 lg:pl-10" : "pt-5"}>
          <Eyebrow className="mb-7">{t("hero.eyebrow")}</Eyebrow>
          <h1 className="mb-7 font-serif text-[clamp(48px,7.5vw,120px)] font-medium leading-[0.92] tracking-[-0.02em] text-ink-0">
            <span className="block">{t("hero.h1_line1")}</span>
            <span className="block italic font-normal text-ink-1">{t("hero.h1_line2")}</span>
            <span className="block">
              <SciFiText text={t("hero.h1_line3")} />
            </span>
          </h1>
          <p className="mb-10 max-w-lg text-[17px] font-light leading-relaxed text-ink-1">
            <strong className="font-medium text-ink-0">{t("hero.desc_strong")}</strong> {t("hero.desc")}
          </p>

          <div className="mb-14 flex flex-col items-stretch gap-6 sm:flex-row sm:items-center">
            <HorrorButton onClick={onToggle} className="!px-8 !py-[18px] !text-[13px] !tracking-[0.2em] !font-bold">
              <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-black/40">
                {playing ? <Pause size={8} /> : <Play size={8} />}
              </span>
              {playing ? t("hero.cta_pause") : t("hero.cta_listen")}
            </HorrorButton>
            <button className="inline-flex items-center gap-2.5 border-b border-white/15 pb-1.5 font-sans text-[13px] font-medium uppercase tracking-[0.15em] text-ink-0 transition-colors hover:border-ink-0">
              {t("hero.cta_trailer")} <Arrow />
            </button>
          </div>

          <div className="flex flex-wrap gap-12 border-t border-white/10 pt-8">
            {[
              { num: "147", accent: ".", label: t("hero.stats_episodes") },
              { num: "2.4M", accent: "+", label: t("hero.stats_listeners") },
              { num: "4.9", accent: "★", label: t("hero.stats_rating") },
            ].map((s, i) => (
              <div key={i}>
                <div className="mb-1.5 font-serif text-4xl font-medium leading-none tracking-[-0.02em] text-ink-0">
                  {s.num}<span className="text-red">{s.accent}</span>
                </div>
                <div className="font-mono text-[10px] uppercase tracking-mono text-ink-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Meta cards — pojemnik bez interakcji, karty z pointer-events-auto (hover sci-fi) */}
        <div className="pointer-events-none absolute inset-0 z-[11] hidden lg:block">
          <FloatingMetaCard
            accent="red"
            className="pointer-events-auto"
            label={t("hero.meta_position_label")}
            value={t("hero.meta_position_val")}
            style={isWide ? { top: 130, right: "7%" } : { top: "8%", right: "6%" }}
          />
          <FloatingMetaCard
            accent="red"
            className="pointer-events-auto"
            label={t("hero.meta_status_label")}
            value={t("hero.meta_status_val")}
            style={isWide ? { bottom: "16%", right: "5%" } : { bottom: "22%", right: "-1%" }}
          />
        </div>
      </div>
    </section>
  );
}

Hero.propTypes = {
  variant: PropTypes.oneOf(["wide", "portrait"]),
};
