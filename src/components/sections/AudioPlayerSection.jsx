import { useTranslation } from "react-i18next";
import WaveformBar from "../ui/WaveformBar";
import { Play, Pause, Prev, Next, Heart, HeartFill, Volume, Share, List } from "../ui/Icons";
import { usePlayer } from "../../context/PlayerContext";
import { HERO_TRACK } from "../../data/tracks";

function fmt(sec) {
  if (!Number.isFinite(sec)) return "00:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// Sekcja "teraz odtwarzane" — spięta z globalnym playerem. Gdy nic nie gra,
// pokazuje ścieżkę wiodącą jako gotową do odtworzenia.
export default function AudioPlayerSection() {
  const { t } = useTranslation();
  const {
    current, playing, progress, currentTime, duration,
    hasNext, hasPrev, playTrack, toggle, next, prev, seek, toggleFavorite, isFavorite,
  } = usePlayer();

  const track = current ?? HERO_TRACK;
  const liked = isFavorite(track.id);
  const onPlay = () => (current?.id === track.id ? toggle() : playTrack(track));

  return (
    <section className="relative z-20 mx-auto -mt-10 max-w-[1320px] px-4 lg:px-12">
      <div className="relative grid items-center gap-5 border border-white/8 bg-[linear-gradient(180deg,rgba(15,18,24,0.95),rgba(10,13,18,0.98))] p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8),0_0_0_1px_rgba(255,42,42,0.08)] backdrop-blur-xl lg:grid-cols-[auto_1fr_auto] lg:gap-8 lg:p-8">
        <span className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,42,42,0.5),transparent)]" />

        {/* Track */}
        <div className="flex min-w-0 items-center gap-[18px] lg:min-w-[280px]">
          <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${track.cover})`, filter: "contrast(1.05)" }}>
            <span className="absolute inset-0" style={{ background: "radial-gradient(circle at 50% 30%, rgba(255,42,42,0.25), transparent 55%), linear-gradient(180deg, transparent 40%, rgba(5,6,8,0.6))" }} />
            {playing && current?.id === track.id && (
              <span className="absolute bottom-1.5 left-1.5 h-1.5 w-1.5 animate-obskura-pulse-fast rounded-full bg-red shadow-[0_0_8px_#ff2a2a]" />
            )}
          </div>
          <div className="min-w-0">
            <div className="mb-1 font-mono text-[10px] tracking-mono text-red">{t("player.ep_num")}</div>
            <div className="mb-1 font-serif text-[22px] font-medium leading-tight text-ink-0">
              {track.title} {track.em && <em className="italic text-ink-1">{track.em}</em>}
            </div>
            <div className="text-[11px] text-ink-2">{track.meta}</div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3.5">
          <WaveformBar progress={progress} onSeek={seek} />
          <div className="-mt-1 flex justify-between font-mono text-[10px] tracking-[0.1em] text-ink-2">
            <span className="text-red">{fmt(currentTime)}</span>
            <span>– {fmt(duration - currentTime)}</span>
          </div>
          <div className="flex items-center justify-center gap-6">
            <button type="button" onClick={prev} disabled={!hasPrev && currentTime < 3} aria-label="Poprzednia" className="grid place-items-center p-1.5 text-ink-1 transition-colors hover:text-ink-0 disabled:opacity-30"><Prev /></button>
            <button
              type="button"
              onClick={onPlay}
              aria-label={playing && current?.id === track.id ? "Pauza" : "Odtwórz"}
              className="grid h-11 w-11 place-items-center rounded-full bg-ink-0 text-bg-0 transition-all hover:bg-red hover:text-white hover:shadow-[0_0_20px_rgba(255,42,42,0.5)]"
            >
              {playing && current?.id === track.id ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button type="button" onClick={next} disabled={!hasNext} aria-label="Następna" className="grid place-items-center p-1.5 text-ink-1 transition-colors hover:text-ink-0 disabled:opacity-30"><Next /></button>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center justify-center gap-[18px] lg:justify-end">
          <button
            type="button"
            onClick={() => toggleFavorite(track.id)}
            aria-pressed={liked}
            aria-label={liked ? "Usuń z ulubionych" : "Dodaj do ulubionych"}
            className={`grid h-9 w-9 place-items-center border transition-colors ${liked ? "border-red text-red" : "border-white/10 text-ink-1 hover:border-red hover:text-red"}`}
          >
            {liked ? <HeartFill /> : <Heart />}
          </button>
          <button type="button" aria-label="Głośność" className="grid h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red"><Volume /></button>
          <button type="button" aria-label="Udostępnij" className="grid h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red"><Share /></button>
          <button type="button" aria-label="Kolejka" className="grid h-9 w-9 place-items-center border border-white/10 text-ink-1 transition-colors hover:border-red hover:text-red"><List /></button>
        </div>
      </div>
    </section>
  );
}
