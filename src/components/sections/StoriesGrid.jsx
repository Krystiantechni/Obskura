import { useTranslation } from "react-i18next";
import StoryCard from "../ui/StoryCard";

export default function StoriesGrid() {
  const { t } = useTranslation();

  const stories = [
    { num: "02", tag: t("stories.psychological"), tagAccent: "red", title: t("stories.last_light_t1"), titleEm: t("stories.last_light_t2"), duration: "52:08", rating: "★ 4.9", image: "/images/img-hallway.webp", video: "/videos/vid-figure.mp4", to: "/odcinek/2" },
    { num: "03", tag: t("stories.folk"), tagAccent: "blue", title: t("stories.forest_t1"), titleEm: t("stories.forest_t2"), duration: "01:14:33", rating: "★ 4.8", image: "/images/img-forest.webp", video: "/videos/vid-shadows.mp4", to: "/odcinek/3" },
    { num: "04", tag: t("stories.true"), tagAccent: "red", title: t("stories.cisowa_t1"), titleEm: t("stories.cisowa_t2"), duration: "38:21", rating: "★ 4.9", image: "/images/img-creature.webp", video: "/videos/vid-creature.mp4", to: "/odcinek/4" },
    { num: "05", tag: t("stories.cosmic"), tagAccent: "blue", title: t("stories.orbita_t1"), titleEm: t("stories.orbita_t2"), duration: "01:02:47", rating: "★ 5.0", image: "/images/img-orbs.webp", to: "/odcinek/5" },
    { num: "06", tag: t("stories.cyber"), tagAccent: "blue", title: t("stories.beton_t1"), titleEm: t("stories.beton_t2"), duration: "58:02", rating: "★ 4.6", image: "/images/img-tunnel.webp", video: "/videos/vid-structures.mp4", to: "/odcinek/6" },
    { num: "07", tag: t("stories.myth"), tagAccent: "red", title: t("stories.fenrir_t1"), titleEm: t("stories.fenrir_t2"), duration: "01:22:55", rating: "★ 5.0", image: "/images/img-wolf.webp", to: "/odcinek/7" },
  ];

  return (
    <section className="cv-auto mx-auto mt-20 max-w-[1400px] px-5 pb-32 lg:px-12">
      <div className="mb-12 flex flex-col items-start justify-between gap-3 border-b border-white/8 pb-6 sm:flex-row sm:items-end">
        <h2 className="font-serif text-[clamp(36px,5vw,52px)] font-medium leading-none tracking-[-0.02em] text-ink-0">
          {t("stories.section_title")} <em className="italic text-ink-2">{t("stories.section_title_em")}</em>
        </h2>
        <div className="text-right font-mono text-[10px] uppercase tracking-mono text-ink-2">
          <div className="inline-flex items-center gap-1.5 text-red">
            <span className="h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_6px_#ff2a2a]" />
            {t("stories.live")}
          </div>
          <div className="mt-1">{t("stories.archive")}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
        {stories.map((s) => (
          <StoryCard key={s.num} {...s} />
        ))}
      </div>
    </section>
  );
}
