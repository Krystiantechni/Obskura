import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import Eyebrow from "../ui/Eyebrow";
import { Play } from "../ui/Icons";

// 21:9 cinematic banner — autoplay loop video, overlay gradient, corner brackets.
// Wideo gra tylko gdy w viewport (IntersectionObserver) — oszczędza dekoder/GPU.
export default function FeaturedBanner() {
  const { t } = useTranslation();
  const videoRef = useRef(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) v.play().catch(() => {});
        else v.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  const brackets = [
    "top-4 left-4 border-r-0 border-b-0",
    "top-4 right-4 border-l-0 border-b-0",
    "bottom-4 left-4 border-r-0 border-t-0",
    "bottom-4 right-4 border-l-0 border-t-0",
  ];

  return (
    <section className="mx-auto mt-32 max-w-[1400px] px-5 lg:px-12">
      <div className="group relative aspect-[4/5] cursor-pointer overflow-hidden border border-white/6 bg-bg-0 sm:aspect-[21/9]">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "contrast(1.05) saturate(0.85)" }}
          src="/videos/vid-coolon.mp4"
          poster="/images/img-smoke.webp"
          muted
          loop
          playsInline
          preload="metadata"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(90deg, rgba(5,6,8,0.85) 0%, rgba(5,6,8,0.55) 35%, rgba(5,6,8,0.2) 70%, rgba(5,6,8,0.65) 100%), linear-gradient(180deg, transparent 60%, rgba(5,6,8,0.7) 100%)",
          }}
        />

        {brackets.map((b, i) => (
          <span key={i} className={`absolute z-[3] h-[18px] w-[18px] border border-red ${b}`} />
        ))}

        <div className="absolute bottom-5 right-9 z-[3] flex items-center gap-2 font-mono text-[10px] tracking-mono text-ink-1">
          <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
          {t("featured.timecode")}
        </div>

        <div className="absolute inset-0 z-[2] flex items-center p-8 lg:p-16">
          <div className="max-w-lg">
            <Eyebrow className="mb-6">{t("featured.kicker")}</Eyebrow>
            <h3 className="mb-4 font-serif text-[clamp(32px,4vw,56px)] font-medium leading-none tracking-[-0.015em] text-ink-0">
              {t("featured.title_line1")} <em className="italic text-ink-1">{t("featured.title_line2")}</em>
            </h3>
            <p className="mb-6 max-w-md text-sm font-light leading-relaxed text-ink-1">{t("featured.desc")}</p>
            <div className="flex flex-wrap items-center gap-3.5">
              <button className="inline-flex items-center gap-3 border border-white/15 bg-white/[0.06] px-6 py-3.5 font-sans text-xs font-semibold uppercase tracking-[0.15em] text-ink-0 backdrop-blur-md transition-all hover:border-red hover:bg-red hover:shadow-[0_0_30px_rgba(255,42,42,0.4)]">
                <Play size={10} /> {t("featured.cta")}
              </button>
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2">{t("featured.stat")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
