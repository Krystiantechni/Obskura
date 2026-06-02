import { useTranslation } from "react-i18next";
import StoryCard from "../ui/StoryCard";
import CardSkeleton from "../ui/CardSkeleton";
import { useEpisodes, useGenres } from "../../hooks/useCatalog";

export default function StoriesGrid() {
  const { t } = useTranslation();
  const { episodes, isLoading } = useEpisodes();
  const { genreLabels } = useGenres();
  // Sekcja na Home pokazuje pierwszych 6 najnowszych.
  const items = episodes.slice(0, 6);

  return (
    <section className="cv-auto mx-auto mt-12 max-w-[1400px] px-5 pb-16 lg:mt-20 lg:pb-32 lg:px-12">
      <div className="mb-8 flex flex-col items-start justify-between gap-3 border-b border-white/8 pb-5 sm:flex-row sm:items-end lg:mb-12 lg:pb-6">
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
        {isLoading && items.length === 0 ? (
          <CardSkeleton count={6} />
        ) : (
          items.map((ep) => (
            <StoryCard key={ep.slug} episode={ep} queue={items} genreLabels={genreLabels} video={ep.video} />
          ))
        )}
      </div>
    </section>
  );
}
